import axios, { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";

export const API_URL = "http://localhost:3000/api";

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

interface UserProfile {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  userType: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
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
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    return {
      success: false,
      message: axiosError.response?.data?.message || "Login failed",
    };
  }
};

const register = async (userData: RegisterData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return { success: true, message: response.data.message };
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    return {
      success: false,
      message: axiosError.response?.data?.message || "Registration failed",
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

const changePassword = async (data: ChangePasswordData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/auth/change-password`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    return {
      success: false,
      message: axiosError.response?.data?.message || "Failed to change password",
    };
  }
};

const getProfile = async (): Promise<ApiResponse<UserProfile>> => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    return {
      success: false,
      message: axiosError.response?.data?.message || "Failed to fetch profile",
    };
  }
};

const updateProfile = async (profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_URL}/users/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: response.data, message: "Profile updated successfully" };
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    return {
      success: false,
      message: axiosError.response?.data?.message || "Failed to update profile",
    };
  }
};

export const authService = {
  API_URL,
  login,
  register,
  logout,
  getToken,
  isAuthenticated,
  getUserInfo,
  changePassword,
  getProfile,
  updateProfile,
};
