import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { approveBooking, getAllBookings, rejectBooking } from "../../../api/bookingApi";

const statusClass = (status) => {
  if (status === "APPROVED") return "badge badge-approved";
  if (status === "REJECTED") return "badge badge-rejected";
  if (status === "CANCELLED") return "badge badge-cancelled";
  return "badge badge-pending";
};

const parseErr = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const BookingListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");

  const fetchBookings = async () => {
    try {
      setError("");
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      setError(parseErr(err, "Failed to load all bookings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onApprove = async (id) => {
    if (!window.confirm("Approve this booking?")) return;
    setPendingId(id);
    setError("");
    try {
      await approveBooking(id, { note: "Approved by admin" });
      await fetchBookings();
    } catch (err) {
      setError(parseErr(err, "Failed to approve booking"));
    } finally {
      setPendingId("");
    }
  };

  const onReject = async (id) => {
    const reason = window.prompt("Reason for rejecting this booking?");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required");
      return;
    }
    setPendingId(id);
    setError("");
    try {
      await rejectBooking(id, { reason: reason.trim() });
      await fetchBookings();
    } catch (err) {
      setError(parseErr(err, "Failed to reject booking"));
    } finally {
      setPendingId("");
    }
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
                          <button
                            className="btn btn-light"
                            type="button"
                            onClick={() => onApprove(booking.id)}
                            disabled={pendingId === booking.id}
                          >
                            {pendingId === booking.id ? "Approving..." : "Approve"}
                          </button>
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => onReject(booking.id)}
                            disabled={pendingId === booking.id}
                          >
                            {pendingId === booking.id ? "Rejecting..." : "Reject"}
                          </button>
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