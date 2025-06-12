import axios from "axios";
import { API_URL } from "./auth.service";

const getAuthHeaders = () => {
  const token = localStorage.getItem("med_track_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminService = {
  async getUsersCount() {
    const res = await axios.get(`${API_URL}/admin/users/count`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
  async getPatientsCount() {
    const res = await axios.get(`${API_URL}/admin/patients/count`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
  async getPharmaciesCount() {
    const res = await axios.get(`${API_URL}/admin/pharmacies/count`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
  async getAdminsCount() {
    const res = await axios.get(`${API_URL}/admin/admins/count`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
  async getAllPharmacies() {
    const res = await axios.get(`${API_URL}/admin/pharmacies/all`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
  async getAllAdmins() {
    const res = await axios.get(`${API_URL}/admin/admins/all`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
  async getPendingPharmacies() {
    const res = await axios.get(`${API_URL}/admin/pharmacies/pending`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
};
