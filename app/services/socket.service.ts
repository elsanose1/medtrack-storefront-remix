import { io, Socket } from "socket.io-client";
import { authService } from "./auth.service";

const SOCKET_URL = "http://localhost:3000";

export interface MedicationReminderNotification {
  id: string;
  medicationId: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  time: string;
  instructions?: string;
  notes?: string;
  isTestReminder?: boolean;
}

let socket: Socket | null = null;

// Initialize the socket connection
const initializeSocket = () => {
  if (socket) return socket;

  const token = authService.getToken();
  if (!token) return null;

  // Connect to the Socket.IO server with authentication
  socket = io(SOCKET_URL, {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Connection event handlers
  socket.on("connect", () => {
    console.log("Socket.IO connected");
  });

  socket.on("connect_error", (err) => {
    console.error("Socket.IO connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO disconnected:", reason);
  });

  return socket;
};

// Disconnect the socket
const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Setup medication reminder listener
const setupMedicationReminderListener = (
  callback: (reminder: MedicationReminderNotification) => void
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;

  currentSocket.on("medication_reminder", callback);
  return true;
};

// Remove medication reminder listener
const removeMedicationReminderListener = () => {
  if (!socket) return;
  socket.off("medication_reminder");
};

// Send reminder response
const sendReminderResponse = (
  medicationId: string,
  reminderId: string,
  action: "taken" | "snooze" | "missed",
  snoozeMinutes?: number
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;

  currentSocket.emit("reminder_response", {
    medicationId,
    reminderId,
    action,
    snoozeMinutes: action === "snooze" ? snoozeMinutes || 15 : undefined,
  });

  return true;
};

// Listen for reminder updates
const setupReminderUpdateListener = (
  callback: (update: {
    medicationId: string;
    reminderId: string;
    status: string;
  }) => void
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;

  currentSocket.on("reminder_update", callback);
  return true;
};

// Remove reminder update listener
const removeReminderUpdateListener = () => {
  if (!socket) return;
  socket.off("reminder_update");
};

// Handle errors
const setupErrorListener = (callback: (error: any) => void) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;

  currentSocket.on("reminder_error", callback);
  return true;
};

// Remove error listener
const removeErrorListener = () => {
  if (!socket) return;
  socket.off("reminder_error");
};

export const socketService = {
  initializeSocket,
  disconnectSocket,
  setupMedicationReminderListener,
  removeMedicationReminderListener,
  sendReminderResponse,
  setupReminderUpdateListener,
  removeReminderUpdateListener,
  setupErrorListener,
  removeErrorListener,
  getSocket: () => socket,
};
