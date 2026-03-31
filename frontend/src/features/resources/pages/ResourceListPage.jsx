import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getResources } from "../../../api/resourceApi";
import useAuth from "../../../hooks/useAuth";

const ResourceListPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <div className="grid grid-2">
          {resources.map((item) => (
            <div key={item.id} className="card">
              <h3>{item.name}</h3>
              <p>{item.location}</p>
              <p>Capacity: {item.capacity}</p>
              <span className="badge badge-approved">{item.status}</span>
            </div>
          ))}
          {resources.length === 0 && <div className="card">No resources yet.</div>}
        </div>
      )}
    </section>
  );
};

export default ResourceListPage;