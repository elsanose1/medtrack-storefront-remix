import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = "http://localhost:3000/api";

interface LoginCredentials {
  email: string;
  password: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
}

interface DecodedToken {
  id: string;
  _id: string;
  email: string;
  username: string;
  userType: string;
  firstName: string;
  lastName: string;
  exp: number;
}

const login = async (credentials: LoginCredentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    const { token } = response.data;

    // Store token in localStorage
    if (token) {
      localStorage.setItem("med_track_token", token);
      return { success: true, token };
    }

    return { success: false, message: "No token received" };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
};

const register = async (userData: RegisterData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return { success: true, message: response.data.message };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

const logout = () => {
  localStorage.removeItem("med_track_token");
  return { success: true };
};

const getToken = () => {
  return localStorage.getItem("med_track_token");
};

const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Ensure _id is set based on id for compatibility
    decoded._id = decoded.id;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authService = {
  login,
  register,
  logout,
  getToken,
  isAuthenticated,
  getUserInfo,
};
