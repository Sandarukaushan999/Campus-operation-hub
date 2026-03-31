import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings } from "../../../api/bookingApi";

const statusClass = (status) => {
  if (status === "APPROVED") return "badge badge-approved";
  if (status === "REJECTED") return "badge badge-rejected";
  if (status === "CANCELLED") return "badge badge-cancelled";
  return "badge badge-pending";
};

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="grid">
      <div className="spread">
        <h2>My Bookings</h2>
        <Link className="btn btn-primary" to="/bookings/create">Create Booking</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading bookings...</div>}

      {!loading && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.title}</td>
                  <td>{booking.date}</td>
                  <td>{booking.startTime} - {booking.endTime}</td>
                  <td><span className={statusClass(booking.status)}>{booking.status}</span></td>
                  <td><Link to={`/bookings/${booking.id}`}>View</Link></td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={5}>No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default MyBookingsPage;