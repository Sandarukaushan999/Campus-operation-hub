import api from "./axios";

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data.data;
};

export const login = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data.data;
};

export const me = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};