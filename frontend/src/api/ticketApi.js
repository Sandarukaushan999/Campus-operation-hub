import api from "./axios";

// =========================================================
// Ticket API client (Module C - Member 3)
//
// Each function maps to one backend endpoint. We always return
// `response.data.data` so callers get the unwrapped payload, not
// the ApiResponse envelope. This matches how bookingApi.js works.
// =========================================================


// ---------- Tickets ----------

// Create a new ticket. The argument is a FormData built by the
// CreateTicketPage form (because we need to send file attachments).
// We must override Content-Type so axios sets the multipart boundary.
export const createTicket = async (formData) => {
  const response = await api.post("/tickets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

// Tickets reported by the logged-in user.
export const getMyTickets = async () => {
  const response = await api.get("/tickets/my");
  return response.data.data;
};

// Tickets assigned to the logged-in user (technician view).
export const getAssignedTickets = async () => {
  const response = await api.get("/tickets/assigned");
  return response.data.data;
};

// All tickets in the system. Optional status filter (admin only).
export const getAllTickets = async (status) => {
  const response = await api.get("/tickets", {
    params: status ? { status } : {},
  });
  return response.data.data;
};

// Single ticket details.
export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data.data;
};

// Admin assigns a technician.
export const assignTicket = async (id, technicianId) => {
  const response = await api.patch(`/tickets/${id}/assign`, { technicianId });
  return response.data.data;
};

// Workflow status change. Payload shape:
//   { status: "RESOLVED", resolutionNotes: "..." }
//   { status: "REJECTED", rejectionReason: "..." }
//   { status: "CLOSED" }
//   { status: "IN_PROGRESS" }   // re-open from RESOLVED
export const updateTicketStatus = async (id, payload) => {
  const response = await api.patch(`/tickets/${id}/status`, payload);
  return response.data.data;
};

// Hard delete a ticket. Owner can delete only while OPEN, admin always.
export const deleteTicket = async (id) => {
  const response = await api.delete(`/tickets/${id}`);
  return response.data.data;
};

// Build the URL for an attachment image. We don't fetch it directly here -
// the frontend uses this URL inside <img src="..."> tags.
//
// Important: the browser hits this URL through axios indirectly via the
// <img> tag, so the JWT is NOT attached automatically. The download
// endpoint is currently behind security, so this only works if we either:
//   (a) make the backend permit-all on attachments (we don't), OR
//   (b) the user is in the same browser session and the JWT is in
//       localStorage (still not enough for <img>), OR
//   (c) we fetch the image with axios and use a blob URL (what we do).
//
// See loadAttachmentBlob below for the way we actually use this in the UI.
export const buildAttachmentUrl = (ticketId, filename) =>
  `/tickets/${ticketId}/attachments/${filename}`;

// Fetch an attachment as a blob and return an object URL the browser can use.
// Call URL.revokeObjectURL on the returned string when you are done with it
// (e.g. in a useEffect cleanup).
export const loadAttachmentBlob = async (ticketId, filename) => {
  const response = await api.get(`/tickets/${ticketId}/attachments/${filename}`, {
    responseType: "blob",
  });
  return URL.createObjectURL(response.data);
};


// ---------- Comments ----------

// All comments on a ticket, oldest first.
export const getComments = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/comments`);
  return response.data.data;
};

// Add a comment.
export const addComment = async (ticketId, text) => {
  const response = await api.post(`/tickets/${ticketId}/comments`, { text });
  return response.data.data;
};

// Edit a comment - only the original author can do this.
export const editComment = async (ticketId, commentId, text) => {
  const response = await api.put(
    `/tickets/${ticketId}/comments/${commentId}`,
    { text },
  );
  return response.data.data;
};

// Delete a comment - author or admin only.
export const deleteComment = async (ticketId, commentId) => {
  const response = await api.delete(
    `/tickets/${ticketId}/comments/${commentId}`,
  );
  return response.data.data;
};
