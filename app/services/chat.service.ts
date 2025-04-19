import { API_BASE_URL } from "./constants";
import { authService } from "./auth.service";

interface Pharmacy {
  _id: string;
  pharmacyName: string;
  email: string;
  isVerified: boolean;
  isOnline?: boolean;
}

interface Conversation {
  _id: string;
  participants: string[];
  participantDetails: {
    _id: string;
    username: string;
    pharmacyName?: string;
    userType: string;
  }[];
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversation: string;
  sender: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export const chatService = {
  // Get all verified pharmacies for the patient to choose from
  async getPharmacies(): Promise<Pharmacy[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/pharmacies`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pharmacies: ${response.statusText}`);
      }

      const data = await response.json();
      // Ensure we return an array even if the API response is unexpected
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      // Return an empty array instead of rethrowing the error
      return [];
    }
  },

  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch conversations: ${response.statusText}`
        );
      }

      const data = await response.json();
      // Ensure we return an array even if the API response is unexpected
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      // Return an empty array instead of rethrowing the error
      return [];
    }
  },

  // Create a new conversation with a pharmacy
  async createConversation(pharmacyId: string): Promise<Conversation> {
    try {
      // Log the request for debugging
      console.log("Creating conversation with pharmacy ID:", pharmacyId);

      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantId: pharmacyId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Failed to create conversation: ${response.status} ${response.statusText}` +
            (errorData ? ` - ${JSON.stringify(errorData)}` : "")
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  // Get messages for a specific conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!conversationId) {
      console.error("getMessages called with no conversationId");
      return [];
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      // Ensure we return an array even if the API response is unexpected
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Return an empty array instead of rethrowing the error
      return [];
    }
  },

  // Send a message in a conversation
  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<Message | null> {
    if (!conversationId) {
      console.error("sendMessage called with no conversationId");
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      return data?.data || null;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Check if a user is online
  async checkUserOnlineStatus(userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chat/status/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check user status: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.isOnline;
    } catch (error) {
      console.error("Error checking user status:", error);
      return false;
    }
  },
};
