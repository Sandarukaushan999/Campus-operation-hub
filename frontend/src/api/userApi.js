import api from "./axios";

export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data.data;
};

export const createUser = async (payload) => {
  const response = await api.post("/users", payload);
  return response.data.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const updateUserRole = async (id, role) => {
  const response = await api.patch(`/users/${id}/role`, { role });
  return response.data.data;
};

export const getProfile = async () => {
  const response = await api.get("/users/me");
  return response.data.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/users/me", data);
  return response.data.data;
};

export const changePassword = async (data) => {
  const response = await api.put("/users/change-password", data);
  return response.data;
};
