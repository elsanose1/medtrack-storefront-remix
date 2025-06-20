import axios from "axios";
import { authService } from "./auth.service";

const API_URL = "http://localhost:3000/api";

// Interfaces
export interface Drug {
  id: string;
  brandName: string;
  genericName: string;
  purpose: string[];
  activeIngredients: string[];
  warnings: string[];
  usage: string[];
  sideEffects?: string[];
  whenToStop?: string[];
  dosage: string[];
  manufacturer: string;
  substanceNames: string[];
  route: string[];
}

export interface DrugSearchResult {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: Drug[];
}

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

// Get all drugs with pagination
const getAllDrugs = async (limit: number = 10, skip: number = 0) => {
  try {
    const response = await api.get(`/drugs?limit=${limit}&skip=${skip}`);
    return {
      success: true,
      data: response.data as DrugSearchResult,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to fetch drugs",
    };
  }
};

// Search drugs by brand name
const searchDrugsByBrandName = async (brandName: string) => {
  try {
    const response = await api.get(
      `/drugs/search?brandName=${encodeURIComponent(brandName)}`
    );
    return {
      success: true,
      data: response.data as DrugSearchResult,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to search drugs",
    };
  }
};

// Get drug details by ID
const getDrugById = async (drugId: string) => {
  try {
    const response = await api.get(`/drugs/${drugId}`);
    return {
      success: true,
      data: response.data as Drug,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to fetch drug details",
    };
  }
};

// Approved Drug Requests
const getPatientApprovedDrugRequests = async (patientID: string) => {
  try {
    const response = await api.get(
      `/approved-drug-requests/patient/${patientID}`
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to fetch patient requests",
    };
  }
};

const getPharmacyApprovedDrugRequests = async (pharmacyID: string) => {
  try {
    const response = await api.get(
      `/approved-drug-requests/pharmacy/${pharmacyID}`
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to fetch pharmacy requests",
    };
  }
};

const cancelPatientApprovedDrugRequest = async (
  id: string,
  patientID: string
) => {
  try {
    const response = await api.patch(
      `/approved-drug-requests/cancel/patient/${id}`,
      { patientID }
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to cancel request",
    };
  }
};

const cancelPharmacyApprovedDrugRequest = async (
  id: string,
  pharmacyID: string
) => {
  try {
    const response = await api.patch(
      `/approved-drug-requests/cancel/pharmacy/${id}`,
      { pharmacyID }
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to cancel request",
    };
  }
};

const markOutForDelivery = async (id: string, pharmacyID: string) => {
  try {
    const response = await api.patch(
      `/approved-drug-requests/out-for-delivery/${id}`,
      { pharmacyID }
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to update status",
    };
  }
};

const markDelivered = async (id: string, pharmacyID: string) => {
  try {
    const response = await api.patch(
      `/approved-drug-requests/delivered/${id}`,
      { pharmacyID }
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to update status",
    };
  }
};

export const drugService = {
  getAllDrugs,
  searchDrugsByBrandName,
  getDrugById,
  getPatientApprovedDrugRequests,
  getPharmacyApprovedDrugRequests,
  cancelPatientApprovedDrugRequest,
  cancelPharmacyApprovedDrugRequest,
  markOutForDelivery,
  markDelivered,
};
