import { useEffect, useState } from "react";
import { getAnalytics } from "../../../api/analyticsApi";

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((err) => setError("Failed to load analytics: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-shell"><p>Loading analytics...</p></div>;
  if (error) return <div className="page-shell"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  // For peak hours chart
  const maxHourCount = Math.max(...data.peakHours.map(h => h.count), 1); // prevent div by zero
  
  // For top resources chart
  const maxResCount = Math.max(...data.topResources.map(r => r.count), 1);

  return (
    <section className="grid">
      <div className="spread">
        <h2>Usage Analytics</h2>
        <div style={{ background: "var(--bg-glass)", padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>Total Bookings: </span>
          <strong style={{ fontSize: "1.2rem", color: "var(--color-primary)" }}>{data.totalBookings}</strong>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        {/* Top Resources Card */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Top Resources</h3>
          {data.topResources.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No data available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {data.topResources.map((res, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "0.9rem" }}>
                    <span>{res.name}</span>
                    <strong>{res.count}</strong>
                  </div>
                  <div style={{ width: "100%", height: "10px", background: "var(--border)", borderRadius: "5px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        height: "100%", 
                        width: `${(res.count / maxResCount) * 100}%`, 
                        background: "var(--color-primary)",
                        transition: "width 1s ease-in-out"
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak Hours Card */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Peak Booking Hours</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "200px", paddingTop: "20px", borderBottom: "1px solid var(--border)" }}>
            {data.peakHours.map((hour, i) => {
              const heightPct = (hour.count / maxHourCount) * 100;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div 
                    title={`${hour.hour}: ${hour.count} bookings`}
                    style={{ 
                      width: "100%", 
                      height: `${heightPct}%`, 
                      background: heightPct > 0 ? "var(--color-primary)" : "transparent",
                      minHeight: heightPct > 0 ? "4px" : "0",
                      borderTopLeftRadius: "2px",
                      borderTopRightRadius: "2px",
                      transition: "height 1s ease-in-out",
                      cursor: "pointer"
                    }} 
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "0.8rem", opacity: 0.7 }}>
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AdminAnalyticsPage;
