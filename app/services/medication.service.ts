import axios from "axios";
import { authService } from "./auth.service";

const API_URL = "http://localhost:3000/api";

// Interfaces
export interface Medication {
  _id: string;
  drugId: string;
  brandName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  instructions: string;
  active: boolean;
  reminders: MedicationReminder[];
  nextReminder?: string;
  notes?: string;
}

export interface MedicationReminder {
  _id: string;
  time: string;
  status: "active" | "snoozed" | "completed" | "missed";
  snoozeUntil?: string;
  notes?: string;
}

export interface MedicationFormData {
  drugId: string;
  brandName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  startDate?: Date;
  endDate?: Date;
  instructions?: string;
  notes?: string;
  firstDoseTime?: Date;
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

// Get all medications for a patient
const getPatientMedications = async () => {
  try {
    const response = await api.get("/medications");
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch medications",
    };
  }
};

// Get a single medication by ID
const getMedicationById = async (medicationId: string) => {
  try {
    const response = await api.get(`/medications/${medicationId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch medication",
    };
  }
};

// Add a new medication
const addMedication = async (medicationData: MedicationFormData) => {
  try {
    const response = await api.post("/medications", medicationData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add medication",
    };
  }
};

// Update an existing medication
const updateMedication = async (
  medicationId: string,
  updateData: Partial<MedicationFormData>
) => {
  try {
    const response = await api.put(`/medications/${medicationId}`, updateData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update medication",
    };
  }
};

// Delete a medication
const deleteMedication = async (medicationId: string) => {
  try {
    await api.delete(`/medications/${medicationId}`);
    return {
      success: true,
      message: "Medication deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete medication",
    };
  }
};

// Get upcoming reminders
const getUpcomingReminders = async (hours: number = 24) => {
  try {
    const response = await api.get(`/medications/upcoming?hours=${hours}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch upcoming reminders",
    };
  }
};

// Update reminder status
const updateReminderStatus = async (
  medicationId: string,
  reminderId: string,
  status: "active" | "snoozed" | "completed" | "missed",
  snoozeUntil?: Date,
  notes?: string
) => {
  try {
    const payload = {
      status,
      snoozeUntil,
      notes,
    };
    const response = await api.patch(
      `/medications/${medicationId}/reminders/${reminderId}`,
      payload
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update reminder status",
    };
  }
};

// Trigger a test reminder for testing
const triggerTestReminder = async (
  medicationId: string,
  reminderId?: string
) => {
  try {
    let url = `/medications/${medicationId}/test-reminder`;
    if (reminderId) {
      url = `/medications/${medicationId}/reminders/${reminderId}/test`;
    }
    const response = await api.post(url);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to trigger test reminder",
    };
  }
};

export const medicationService = {
  getPatientMedications,
  getMedicationById,
  addMedication,
  updateMedication,
  deleteMedication,
  getUpcomingReminders,
  updateReminderStatus,
  triggerTestReminder,
};
