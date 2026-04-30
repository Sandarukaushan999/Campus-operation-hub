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
  const maxHourCount = Math.max(...data.peakHours.map((h) => h.count), 1);
  
  // For top resources chart
  const maxResCount = Math.max(...data.topResources.map((r) => r.count), 1);

  return (
    <section className="grid dashboard-analytics">
      <div className="spread dashboard-analytics-header">
        <div>
          <h2>Usage Analytics</h2>
          <p className="muted">Operational insights for resource demand and booking behavior.</p>
        </div>
        <div className="dashboard-analytics-total">
          <span>Total Bookings</span>
          <strong>{data.totalBookings}</strong>
        </div>
      </div>

      <div className="dashboard-analytics-grid">
        <article className="card dashboard-analytics-card">
          <h3>Top Resources</h3>
          {data.topResources.length === 0 ? (
            <p className="muted">No data available.</p>
          ) : (
            <div className="dashboard-progress-list">
              {data.topResources.map((res, i) => (
                <div key={i} className="dashboard-progress-row">
                  <div className="dashboard-progress-head">
                    <span>{res.name}</span>
                    <strong>{res.count}</strong>
                  </div>
                  <div className="dashboard-progress-track">
                    <div
                      className="dashboard-progress-fill"
                      style={{ width: `${(res.count / maxResCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card dashboard-analytics-card">
          <h3>Peak Booking Hours</h3>
          <div className="dashboard-bars">
            {data.peakHours.map((hour, i) => {
              const heightPct = (hour.count / maxHourCount) * 100;
              return (
                <div key={i} className="dashboard-bar-col">
                  <div
                    className="dashboard-bar"
                    title={`${hour.hour}: ${hour.count} bookings`}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="dashboard-bar-labels">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </article>
      </div>
    </section>
  );
};

export default AdminAnalyticsPage;
