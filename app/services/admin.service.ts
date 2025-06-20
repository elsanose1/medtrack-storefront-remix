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
  async approveOrRejectPharmacy(pharmacyId: string, approve: boolean) {
    const res = await axios.put(
      `${API_URL}/admin/pharmacies/${pharmacyId}/verify`,
      { approve },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },
  async unverifyPharmacy(pharmacyId: string) {
    const res = await axios.put(
      `${API_URL}/admin/pharmacies/${pharmacyId}/deverify`,
      {},
      { headers: getAuthHeaders() }
    );
    return res.data;
  },
  async getAllPatients() {
    const res = await axios.get(`${API_URL}/admin/patients`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
  async createAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
  }) {
    const res = await axios.post(`${API_URL}/admin/admins`, adminData, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
};
