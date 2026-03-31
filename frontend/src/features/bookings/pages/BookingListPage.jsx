import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { approveBooking, getAllBookings, rejectBooking } from "../../../api/bookingApi";

const statusClass = (status) => {
  if (status === "APPROVED") return "badge badge-approved";
  if (status === "REJECTED") return "badge badge-rejected";
  if (status === "CANCELLED") return "badge badge-cancelled";
  return "badge badge-pending";
};

const BookingListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setError("");
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load all bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onApprove = async (id) => {
    await approveBooking(id, { note: "Approved by admin" });
    await fetchBookings();
  };

  const onReject = async (id) => {
    await rejectBooking(id, { reason: "Request does not meet policy requirements" });
    await fetchBookings();
  };

  return (
    <section className="grid">
      <h2>All Bookings (Admin)</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading bookings...</div>}

      {!loading && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>User</th>
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
                  <td>{booking.userId}</td>
                  <td>{booking.date}</td>
                  <td>{booking.startTime} - {booking.endTime}</td>
                  <td><span className={statusClass(booking.status)}>{booking.status}</span></td>
                  <td>
                    <div className="row">
                      <Link to={`/bookings/${booking.id}`}>View</Link>
                      {booking.status === "PENDING" && (
                        <>
                          <button className="btn btn-light" type="button" onClick={() => onApprove(booking.id)}>Approve</button>
                          <button className="btn btn-danger" type="button" onClick={() => onReject(booking.id)}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6}>No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default BookingListPage;