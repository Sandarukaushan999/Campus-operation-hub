import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { cancelBooking, getBookingById } from "../../../api/bookingApi";

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

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async () => {
    try {
      setError("");
      const data = await getBookingById(id);
      setBooking(data);
    } catch (err) {
      setError(parseErr(err, "Failed to load booking details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const onCancel = async () => {
    const reason = window.prompt("Reason for cancelling? (optional)");
    if (reason === null) return;
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(true);
    try {
      await cancelBooking(id, { reason: reason.trim() || null });
      await fetchBooking();
    } catch (err) {
      setError(parseErr(err, "Failed to cancel booking"));
    } finally {
      setCancelling(false);
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
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <p><strong>Resource:</strong> {booking.resourceId}</p>
              <p><strong>User:</strong> {booking.userId}</p>
              <p><strong>Date:</strong> {booking.date}</p>
              <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
              <p><strong>Purpose:</strong> {booking.purpose || "N/A"}</p>
              <p><strong>Rejection Reason:</strong> {booking.rejectionReason || "N/A"}</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", background: "var(--bg-glass)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <QRCodeSVG 
                value={`${window.location.origin}/bookings/${booking.id}/verify`} 
                size={150} 
                level={"M"}
                includeMargin={true}
                style={{ borderRadius: "8px" }}
              />
              <p style={{ marginTop: "10px", fontSize: "0.8rem", opacity: 0.8 }}>Scan to verify</p>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          {(booking.status === "PENDING" || booking.status === "APPROVED") && (
            <button className="btn btn-danger" type="button" onClick={onCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Booking"}
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