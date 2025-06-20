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
  advance?: number; // 4 or 1 for advance notifications
}

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    username?: string;
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    username?: string;
  };
  message: string;
  conversation: string;
  createdAt: string;
  read: boolean;
}

// Add simplified message format interface
export interface SimplifiedChatMessage {
  _id: string;
  conversation: string;
  sender: string;
  senderName: string;
  content: string;
  createdAt: string;
  read?: boolean;
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

// Join a conversation room
const joinConversation = (conversationId: string) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;

  currentSocket.emit("join_conversation", conversationId);
  return true;
};

// Leave a conversation room
const leaveConversation = (conversationId: string) => {
  if (!socket) return false;
  socket.emit("leave_conversation", conversationId);
  return true;
};

// Set up new message listener
const setupMessageListener = (
  callback: (message: ChatMessage | SimplifiedChatMessage) => void
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;

  // Get the current active conversation from the URL if possible
  const getActiveConversationFromURL = () => {
    if (typeof window !== "undefined") {
      const url = window.location.pathname;
      const conversationMatch = url.match(/\/chat\/[^/]+\/([^/]+)/);
      return conversationMatch ? conversationMatch[1] : null;
    }
    return null;
  };

  // Add a handler for raw socket messages that ensures conversation ID is present
  currentSocket.on("new_message", (rawMessage) => {
    console.log("Raw message from socket:", rawMessage);

    // Try to ensure the message has a conversation ID
    if (!rawMessage.conversation) {
      const activeConversation = getActiveConversationFromURL();
      if (activeConversation) {
        console.log("Adding conversation ID to message:", activeConversation);
        rawMessage.conversation = activeConversation;
      }
    }

    // Just pass the message through to the callback
    // The component will determine how to handle it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback(rawMessage as any);
  });

  return true;
};

// Remove new message listener
const removeMessageListener = () => {
  if (!socket) return;
  socket.off("new_message");
};

// Set up messages read listener
const setupMessagesReadListener = (
  callback: (data: { userId: string; conversationId: string }) => void
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;

  currentSocket.on("messages_read", callback);
  return true;
};

// Remove messages read listener
const removeMessagesReadListener = () => {
  if (!socket) return;
  socket.off("messages_read");
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
const setupErrorListener = (callback: (error: unknown) => void) => {
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

// --- POPUP NOTIFICATION EVENTS ---

// Patient emits: request pharmacist attention
const emitPatientPopupRequest = (payload: {
  userId: string;
  drugId: string;
  note: string;
}) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;
  currentSocket.emit("patient_popup_request", payload);
  return true;
};

// Patient emits: cancel request
const emitPatientPopupCancel = () => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;
  currentSocket.emit("patient_popup_cancel");
  return true;
};

// Pharmacist emits: respond to popup
const emitPharmacistPopupResponse = (payload: {
  patientId: string;
  response: string;
  price: number;
  drugId: string;
  note: string;
}) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;
  currentSocket.emit("pharmacist_popup_response", payload);
  return true;
};

// Pharmacist listens: show popup
const setupShowPopupListener = (
  callback: (data: {
    patientId: string;
    userName: string;
    userPhone: string;
    drugId: string;
    drugName: string;
    note: string;
  }) => void
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;
  currentSocket.on("show_popup", callback);
  return true;
};
const removeShowPopupListener = () => {
  if (!socket) return;
  socket.off("show_popup");
};

// Pharmacist listens: close popup
const setupClosePopupListener = (
  callback: (data: { patientId: string }) => void
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;
  currentSocket.on("close_popup", callback);
  return true;
};
const removeClosePopupListener = () => {
  if (!socket) return;
  socket.off("close_popup");
};

// Patient listens: popup response
const setupPopupResponseListener = (
  callback: (data: { response: string }) => void
) => {
  const currentSocket = socket || initializeSocket();
  if (!currentSocket) return false;
  currentSocket.on("popup_response", callback);
  return true;
};
const removePopupResponseListener = () => {
  if (!socket) return;
  socket.off("popup_response");
};

export const socketService = {
  initializeSocket,
  disconnectSocket,
  joinConversation,
  leaveConversation,
  setupMessageListener,
  removeMessageListener,
  setupMessagesReadListener,
  removeMessagesReadListener,
  setupMedicationReminderListener,
  removeMedicationReminderListener,
  sendReminderResponse,
  setupReminderUpdateListener,
  removeReminderUpdateListener,
  setupErrorListener,
  removeErrorListener,
  getSocket: () => socket,
  emitPatientPopupRequest,
  emitPatientPopupCancel,
  emitPharmacistPopupResponse,
  setupShowPopupListener,
  removeShowPopupListener,
  setupClosePopupListener,
  removeClosePopupListener,
  setupPopupResponseListener,
  removePopupResponseListener,
};
