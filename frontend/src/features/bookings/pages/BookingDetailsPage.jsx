import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cancelBooking, getBookingById } from "../../../api/bookingApi";

const statusClass = (status) => {
  if (status === "APPROVED") return "badge badge-approved";
  if (status === "REJECTED") return "badge badge-rejected";
  if (status === "CANCELLED") return "badge badge-cancelled";
  return "badge badge-pending";
};

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBooking = async () => {
    try {
      setError("");
      const data = await getBookingById(id);
      setBooking(data);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const onCancel = async () => {
    try {
      await cancelBooking(id, { reason: "Cancelled by user" });
      await fetchBooking();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to cancel booking");
    }
  };

  if (loading) {
    return <div className="card">Loading booking...</div>;
  }

  if (!booking) {
    return <div className="card">Booking not found.</div>;
  }

  return (
    <section className="grid" style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="spread">
          <h2>{booking.title}</h2>
          <span className={statusClass(booking.status)}>{booking.status}</span>
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid" style={{ marginTop: 12 }}>
          <p><strong>Resource:</strong> {booking.resourceId}</p>
          <p><strong>User:</strong> {booking.userId}</p>
          <p><strong>Date:</strong> {booking.date}</p>
          <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
          <p><strong>Purpose:</strong> {booking.purpose || "N/A"}</p>
          <p><strong>Rejection Reason:</strong> {booking.rejectionReason || "N/A"}</p>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          {(booking.status === "PENDING" || booking.status === "APPROVED") && (
            <button className="btn btn-danger" type="button" onClick={onCancel}>
              Cancel Booking
            </button>
          )}
          <button className="btn btn-light" type="button" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    </section>
  );
};

export default BookingDetailsPage;