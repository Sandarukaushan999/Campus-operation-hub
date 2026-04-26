import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getResources, deleteResource } from "../../../api/resourceApi";
import useAuth from "../../../hooks/useAuth";

const statusBadgeClass = (status) => {
  switch (status) {
    case "AVAILABLE":   return "badge badge-approved";
    case "MAINTENANCE": return "badge badge-pending";
    case "UNAVAILABLE":
    case "INACTIVE":    return "badge badge-rejected";
    default:            return "badge";
  }
};

const ResourceListPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResources = resources.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.location && r.location.toLowerCase().includes(q)) ||
      (r.capacity && r.capacity.toString().includes(q))
    );
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const data = await getResources();
        setResources(data);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to load resources");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message ?? "Failed to delete resource");
    }
  };

  return (
    <section className="grid">
      <div className="spread">
        <h2>Resources</h2>
        {user?.role === "ADMIN" && (
          <Link to="/resources/create" className="btn btn-primary">
            Add Resource
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading resources...</div>}

      {!loading && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              className="input"
              placeholder="Search by name, location, or capacity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div className="grid grid-2">
            {filteredResources.map((item) => (
            <div key={item.id} className="card">
              <h3>{item.name}</h3>
              <p>{item.location}</p>
              <p>Capacity: {item.capacity}</p>
              {item.availableDate && (
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Available: {item.availableDate} {item.startTime && item.endTime ? `(${item.startTime} - ${item.endTime})` : ""}
                </p>
              )}
              <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={statusBadgeClass(item.status)}>{item.status}</span>
                {user?.role === "ADMIN" && (
                  <div style={{ display: "flex", gap: "5px" }}>
                    <Link to={`/resources/update/${item.id}`} className="btn btn-light" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                      Edit
                    </Link>
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)} style={{ padding: "4px 8px", fontSize: "0.8rem", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            ))}
            {filteredResources.length === 0 && <div className="card">No resources found.</div>}
          </div>
        </>
      )}
    </section>
  );
};

export default ResourceListPage;