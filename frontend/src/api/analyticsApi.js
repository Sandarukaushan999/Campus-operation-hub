import api from "./axios";

export const getAnalytics = async () => {
  const response = await api.get("/analytics");
  return response.data.data;
};
