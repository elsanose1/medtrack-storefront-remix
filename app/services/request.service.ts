import axios from "axios";
import { authService } from "./auth.service";

const API_URL = "http://localhost:3000/api";

// Create axios instance with auth headers
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Get approved request counts for a pharmacy
const getApprovedRequestCounts = async (pharmacyId: string) => {
  try {
    const response = await api.get(
      `/approved-drug-requests/pharmacy/${pharmacyId}/counts`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data.message ||
          "Failed to fetch approved request counts",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred while fetching request counts.",
    };
  }
};

export const requestService = {
  getApprovedRequestCounts,
};
