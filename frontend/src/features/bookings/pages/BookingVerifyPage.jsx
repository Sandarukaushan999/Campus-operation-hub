import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingById } from "../../../api/bookingApi";

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

const BookingVerifyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyBooking = async () => {
      try {
        setError("");
        const data = await getBookingById(id);
        setBooking(data);
      } catch (err) {
        setError(parseErr(err, "Invalid or missing booking record."));
      } finally {
        setLoading(false);
      }
    };
    verifyBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="page-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ fontSize: "1.2rem", opacity: 0.8 }}>Verifying Ticket...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="page-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="card" style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "10px" }}>❌</div>
          <h2 style={{ color: "var(--color-danger)" }}>Verification Failed</h2>
          <p>{error || "Booking not found."}</p>
          <button className="btn btn-primary" onClick={() => navigate("/dashboard")} style={{ marginTop: "20px" }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isValid = booking.status === "APPROVED";

  return (
    <div className="page-shell" style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
      <div 
        className="card" 
        style={{ 
          maxWidth: "400px", 
          width: "100%",
          position: "relative",
          overflow: "hidden",
          borderTop: `6px solid ${isValid ? "var(--color-success)" : "var(--color-warning)"}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "2px dashed var(--border)", marginBottom: "20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "10px" }}>
            {isValid ? "✅" : "⚠️"}
          </div>
          <h2 style={{ margin: "0 0 10px 0" }}>Digital Pass</h2>
          <span className={statusClass(booking.status)} style={{ fontSize: "1.1rem", padding: "5px 15px" }}>
            {booking.status}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Resource ID</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{booking.resourceId}</div>
          </div>
          
          <div>
            <span style={{ fontSize: "0.8rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Reserved By (User ID)</span>
            <div style={{ fontSize: "1.1rem" }}>{booking.userId}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-glass)", padding: "15px", borderRadius: "8px" }}>
            <div>
              <span style={{ fontSize: "0.8rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Date</span>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{booking.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.8rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Time Slot</span>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-primary)" }}>{booking.startTime} - {booking.endTime}</div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Booking Title</span>
            <div>{booking.title}</div>
          </div>
        </div>

        <div style={{ marginTop: "30px", textAlign: "center", opacity: 0.5, fontSize: "0.8rem" }}>
          ID: {booking.id}
        </div>
      </div>
    </div>
  );
};

export default BookingVerifyPage;
