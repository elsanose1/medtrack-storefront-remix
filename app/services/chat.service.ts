import { API_BASE_URL } from "./constants";
import { authService } from "./auth.service";

// Client-side interfaces
interface Pharmacy {
  _id: string;
  pharmacyName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
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

// API response interfaces that match the backend types
interface ApiUser {
  _id: string;
  username?: string;
  firstName: string;
  lastName: string;
  userType: string;
  pharmacyName?: string;
}

interface ApiMessage {
  _id: string;
  sender: ApiUser;
  receiver: ApiUser;
  message: string;
  read: boolean;
  createdAt: string;
  __v: number;
}

interface ApiConversation {
  _id: string;
  patient: ApiUser;
  pharmacy: ApiUser;
  lastMessage: string;
  lastMessageDate: string;
  unreadPatient: number;
  unreadPharmacy: number;
  messages: string[]; // Message IDs
  createdAt: string;
  updatedAt: string;
  __v: number;
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

      // Check if response has a pharmacies property (as per API types)
      if (data && Array.isArray(data.pharmacies)) {
        return data.pharmacies;
      }

      // Fallback to directly using the response if it's an array
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
      console.log("Conversations response:", data);

      // Get conversations from the API response
      let apiConversations: ApiConversation[] = [];

      // Handle different possible response formats
      if (data && Array.isArray(data.conversations)) {
        // Standard format from API types
        apiConversations = data.conversations;
      } else if (data && Array.isArray(data.data)) {
        // Alternative wrapped in data property
        apiConversations = data.data;
      } else if (Array.isArray(data)) {
        // Direct array
        apiConversations = data;
      } else {
        console.error("Unexpected conversations response format:", data);
        return [];
      }

      // Convert API conversation format to client format
      const conversations: Conversation[] = apiConversations.map((conv) => ({
        _id: conv._id,
        participants: [conv.patient._id, conv.pharmacy._id],
        participantDetails: [
          {
            _id: conv.patient._id,
            username:
              conv.patient.username ||
              `${conv.patient.firstName} ${conv.patient.lastName}`,
            userType: "patient",
          },
          {
            _id: conv.pharmacy._id,
            username:
              conv.pharmacy.username ||
              `${conv.pharmacy.firstName} ${conv.pharmacy.lastName}`,
            pharmacyName: conv.pharmacy.pharmacyName,
            userType: "pharmacy",
          },
        ],
        lastMessage: conv.lastMessage
          ? {
              content: conv.lastMessage,
              sender: "", // We don't have this info
              createdAt: conv.lastMessageDate,
            }
          : undefined,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      return conversations;
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

      // Use GET endpoint as per API types
      console.log(`Requesting conversation with pharmacy: ${pharmacyId}`);
      const response = await fetch(
        `${API_BASE_URL}/chat/conversation/pharmacy/${pharmacyId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response:", errorData);
        throw new Error(
          `Failed to create conversation: ${response.status} ${
            response.statusText
          }${errorData ? ` - ${JSON.stringify(errorData)}` : ""}`
        );
      }

      let data;
      try {
        data = await response.json();
        console.log("Response data:", JSON.stringify(data, null, 2));
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        throw new Error("Failed to parse response as JSON");
      }

      // Handle different response formats
      let apiConversation: ApiConversation;

      // If response contains a conversation property (as per API types)
      if (data && data.conversation && data.conversation._id) {
        apiConversation = data.conversation;
      }
      // If response is the conversation object directly
      else if (data && data._id) {
        apiConversation = data;
      }
      // If response has conversation in data property
      else if (data && data.data && data.data._id) {
        apiConversation = data.data;
      } else {
        console.error("Invalid conversation response format:", data);
        throw new Error(
          "Invalid response format: conversation not found in response"
        );
      }

      // Convert API conversation to client format
      const conversation: Conversation = {
        _id: apiConversation._id,
        participants: [
          apiConversation.patient._id,
          apiConversation.pharmacy._id,
        ],
        participantDetails: [
          {
            _id: apiConversation.patient._id,
            username:
              apiConversation.patient.username ||
              `${apiConversation.patient.firstName} ${apiConversation.patient.lastName}`,
            userType: "patient",
          },
          {
            _id: apiConversation.pharmacy._id,
            username:
              apiConversation.pharmacy.username ||
              `${apiConversation.pharmacy.firstName} ${apiConversation.pharmacy.lastName}`,
            pharmacyName: apiConversation.pharmacy.pharmacyName,
            userType: "pharmacy",
          },
        ],
        lastMessage: apiConversation.lastMessage
          ? {
              content: apiConversation.lastMessage,
              sender: "", // We don't have this info
              createdAt: apiConversation.lastMessageDate,
            }
          : undefined,
        createdAt: apiConversation.createdAt,
        updatedAt: apiConversation.updatedAt,
      };

      console.log("Successfully converted conversation to client format");
      return conversation;
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
      console.log(`Fetching messages for conversation: ${conversationId}`);

      const response = await fetch(
        `${API_BASE_URL}/chat/conversation/${conversationId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        `Messages response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
        console.log("Messages response data:", JSON.stringify(data, null, 2));
      } catch (jsonError) {
        console.error("Failed to parse messages response as JSON:", jsonError);
        return [];
      }

      // Handle different response formats
      let apiMessages: ApiMessage[] = [];

      // If response has a messages property (as per API types)
      if (data && Array.isArray(data.messages)) {
        console.log(
          `Found ${data.messages.length} messages in messages property`
        );
        apiMessages = data.messages;
      }
      // If response is an array directly
      else if (Array.isArray(data)) {
        console.log(`Found ${data.length} messages in direct array`);
        apiMessages = data;
      }
      // If response has a data property that's an array
      else if (data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} messages in data property`);
        apiMessages = data.data;
      } else {
        console.error("Unrecognized message response format:", data);
        return [];
      }

      // Transform API message format to client format
      const transformedMessages: Message[] = apiMessages.map((msg) => ({
        _id: msg._id,
        conversation: conversationId,
        sender: msg.sender._id,
        senderName:
          msg.sender.username ||
          `${msg.sender.firstName} ${msg.sender.lastName}`,
        content: msg.message,
        createdAt: msg.createdAt,
        readAt: msg.read ? new Date().toISOString() : undefined,
      }));

      console.log(
        `Transformed ${transformedMessages.length} messages to client format`
      );
      return transformedMessages;
    } catch (error) {
      console.error("Error fetching messages:", error);
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
      console.log(`Sending message to conversation: ${conversationId}`);
      console.log(`Message content: ${content}`);

      const response = await fetch(
        `${API_BASE_URL}/chat/conversation/${conversationId}/message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: content }),
        }
      );

      console.log(
        `Send message response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Send message error response:", errorData);
        throw new Error(
          `Failed to send message: ${response.statusText}${
            errorData ? ` - ${JSON.stringify(errorData)}` : ""
          }`
        );
      }

      let data;
      try {
        data = await response.json();
        console.log(
          "Send message response data:",
          JSON.stringify(data, null, 2)
        );
      } catch (jsonError) {
        console.error(
          "Failed to parse send message response as JSON:",
          jsonError
        );
        return null;
      }

      // Extract the message from the response
      let apiMessage: ApiMessage | null = null;

      // If the response matches our expected API message format
      if (data && data._id && data.sender && typeof data.message === "string") {
        apiMessage = data;
      }
      // If response is wrapped in a data property
      else if (data && data.data && data.data._id) {
        apiMessage = data.data;
      }
      // If we can't find a valid message format
      else {
        console.error("Unrecognized send message response format:", data);

        // Create a fallback client-side message if we got success but no parseable message
        if (
          data &&
          (data.success === true ||
            data.message === "Message sent successfully")
        ) {
          return {
            _id: `temp-${Date.now()}`,
            conversation: conversationId,
            sender: authService.getUserInfo()?._id || "",
            senderName: authService.getUserInfo()?.username || "You",
            content: content,
            createdAt: new Date().toISOString(),
          };
        }

        return null;
      }

      // Verify apiMessage is not null before proceeding
      if (!apiMessage) {
        console.error("Failed to extract valid message from response");
        return null;
      }

      // Convert API message to client format
      const clientMessage: Message = {
        _id: apiMessage._id,
        conversation: conversationId,
        sender: apiMessage.sender._id,
        senderName:
          apiMessage.sender.username ||
          `${apiMessage.sender.firstName} ${apiMessage.sender.lastName}`,
        content: apiMessage.message,
        createdAt: apiMessage.createdAt,
        readAt: apiMessage.read ? new Date().toISOString() : undefined,
      };

      return clientMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Mark messages as read in a conversation
  async markAsRead(conversationId: string): Promise<boolean> {
    if (!conversationId) {
      console.error("markAsRead called with no conversationId");
      return false;
    }

    try {
      console.log(
        `Marking messages as read for conversation: ${conversationId}`
      );

      const response = await fetch(
        `${API_BASE_URL}/chat/conversation/${conversationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        `Mark as read response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark messages as read: ${response.statusText}`
        );
      }

      // Try to parse response for logging
      try {
        const data = await response.json();
        console.log("Mark as read response:", data);
      } catch (e) {
        // Ignore parsing errors for this endpoint
      }

      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }
  },

  // Check if a user is online
  async checkUserOnlineStatus(userId: string): Promise<boolean> {
    try {
      console.log(`Checking online status for user: ${userId}`);

      const response = await fetch(`${API_BASE_URL}/chat/online-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: [userId] }),
      });

      console.log(
        `Online status response: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        throw new Error(`Failed to check user status: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Online status response data:", data);

      // As per API types, the response should have an onlineStatus object with user IDs as keys
      if (
        data &&
        data.onlineStatus &&
        typeof data.onlineStatus[userId] === "boolean"
      ) {
        return data.onlineStatus[userId];
      }

      // Fallback to checking data.data if onlineStatus is not found
      if (data && data.data && typeof data.data[userId] === "boolean") {
        return data.data[userId];
      }

      console.warn("Unexpected online status response format:", data);
      return false;
    } catch (error) {
      console.error("Error checking user status:", error);
      return false;
    }
  },
};
