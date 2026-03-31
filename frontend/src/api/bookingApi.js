import api from "./axios";

export const createBooking = async (payload) => {
  const response = await api.post("/bookings", payload);
  return response.data.data;
};

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my");
  return response.data.data;
};

export const getAllBookings = async () => {
  const response = await api.get("/bookings");
  return response.data.data;
};

export const getBookingAvailability = async (resourceId, from, to) => {
  const response = await api.get("/bookings/availability", {
    params: { resourceId, from, to },
  });
  return response.data.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data.data;
};

export const approveBooking = async (id, payload = {}) => {
  const response = await api.put(`/bookings/${id}/approve`, payload);
  return response.data.data;
};

export const rejectBooking = async (id, payload) => {
  const response = await api.put(`/bookings/${id}/reject`, payload);
  return response.data.data;
};

export const cancelBooking = async (id, payload = {}) => {
  const response = await api.put(`/bookings/${id}/cancel`, payload);
  return response.data.data;
};
