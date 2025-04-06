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
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch drugs",
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
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to search drugs",
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
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch drug details",
    };
  }
};

export const drugService = {
  getAllDrugs,
  searchDrugsByBrandName,
  getDrugById,
};
