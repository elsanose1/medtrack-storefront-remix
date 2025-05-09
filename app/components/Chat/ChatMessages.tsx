import { useState, useEffect, useRef } from "react";
import { chatService } from "~/services/chat.service";
import { authService } from "~/services/auth.service";
import {
  socketService,
  ChatMessage,
  SimplifiedChatMessage,
} from "~/services/socket.service";

interface Message {
  _id: string;
  conversation: string;
  sender: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

// Define a more complete interface for backend messages
interface BackendChatMessage {
  _id: string;
  sender: {
    _id: string;
    username?: string;
    firstName: string;
    lastName: string;
    userType: string;
  };
  receiver: {
    _id: string;
    username?: string;
    firstName: string;
    lastName: string;
    userType: string;
  };
  message: string;
  conversation?: string; // Optional because it might be missing in some messages
  read: boolean;
  createdAt: string;
  __v: number;
}

interface ChatMessagesProps {
  conversationId: string;
  pharmacyName: string;
}

export default function ChatMessages({
  conversationId,
  pharmacyName,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = authService.getUserInfo()?._id || "";

  // Initialize socket connection when component mounts
  useEffect(() => {
    socketService.initializeSocket();
    // Clean up on unmount
    return () => {
      socketService.removeMessageListener();
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, []);

  // Fetch messages and join conversation room when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const messageData = await chatService.getMessages(conversationId);
        // Ensure we have valid data
        setMessages(Array.isArray(messageData) ? messageData : []);
        setError(null);
      } catch (err) {
        setError("Failed to load messages. Please try again later.");
        console.error(err);
        // Ensure messages is set to an empty array on error
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
      // Join the conversation room via Socket.IO
      socketService.joinConversation(conversationId);
    } else {
      setError("No conversation ID provided");
      setLoading(false);
    }

    // Leave the conversation room when component unmounts or conversation changes
    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  // Setup socket listening for new messages
  useEffect(() => {
    // Handler for new messages
    const handleNewMessage = (
      message: ChatMessage | SimplifiedChatMessage | BackendChatMessage
    ) => {
      console.log("New message received via socket:", message);
      console.log("Current conversation ID:", conversationId);

      // Extract or infer conversation ID from the message or use current conversation
      const messageConversationId = message.conversation || conversationId;
      console.log("Message conversation ID:", messageConversationId);

      // Compare the conversation IDs as strings to ensure consistent matching
      const isForCurrentConversation =
        String(messageConversationId) === String(conversationId);
      console.log("Is for current conversation:", isForCurrentConversation);

      // Make sure it's for this conversation or if no conversation ID is present in message
      if (isForCurrentConversation) {
        // Determine the message format and create a standardized Message object
        let newMessage: Message;

        // Handle the expected ChatMessage format from socket.service.ts or BackendChatMessage
        if (
          typeof message.sender === "object" &&
          message.sender !== null &&
          "message" in message
        ) {
          newMessage = {
            _id: message._id,
            conversation: messageConversationId,
            sender: message.sender._id,
            senderName:
              message.sender.username ||
              `${message.sender.firstName} ${message.sender.lastName}`,
            content: message.message,
            createdAt: message.createdAt,
            readAt: message.read ? new Date().toISOString() : undefined,
          };
        }
        // Handle the simplified format (string sender ID, content instead of message)
        else {
          const typedMessage = message as SimplifiedChatMessage;
          newMessage = {
            _id: typedMessage._id,
            conversation: messageConversationId,
            sender: typedMessage.sender,
            senderName: typedMessage.senderName || "Unknown",
            content: typedMessage.content,
            createdAt: typedMessage.createdAt,
            readAt: typedMessage.read ? new Date().toISOString() : undefined,
          };
        }

        console.log("Processed new message:", newMessage);

        // Add the message if it's not already in our list
        setMessages((prevMessages) => {
          // Check if we already have this message by ID
          if (
            prevMessages.some((m) => String(m._id) === String(newMessage._id))
          ) {
            console.log("Message already exists in list, not adding duplicate");
            return prevMessages;
          }
          console.log("Adding new message to list");
          return [...prevMessages, newMessage];
        });

        // If this is a message from the other person, mark it as read
        if (newMessage.sender !== currentUserId) {
          chatService.markAsRead(conversationId).catch((err) => {
            console.error("Failed to mark messages as read:", err);
          });
        }
      } else {
        console.log("Message is not for this conversation, ignoring");
      }
    };

    // Setup the message listener
    socketService.setupMessageListener(handleNewMessage);

    // Setup messages read listener
    socketService.setupMessagesReadListener((data) => {
      // Update UI to show messages as read (if needed)
      console.log("Messages marked as read:", data);
    });

    // Clean up on effect cleanup
    return () => {
      socketService.removeMessageListener();
      socketService.removeMessagesReadListener();
    };
  }, [conversationId, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format timestamp for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !conversationId) return;

    try {
      setSending(true);
      console.log("Sending message to conversation:", conversationId);
      console.log("Message content:", newMessage.trim());

      const sentMessage = await chatService.sendMessage(
        conversationId,
        newMessage.trim()
      );

      console.log("Message sent response:", sentMessage);

      // IMPORTANT: We no longer automatically add the sent message to the list
      // The socket will handle adding the message to prevent duplicates
      // This fixes the issue with messages being duplicated in patients/chat

      // Only add the message if we don't get a socket message (backup mechanism)
      if (sentMessage) {
        // Set a short timeout to wait for the socket message
        const messageId = sentMessage._id;
        const messageContent = sentMessage.content;

        setTimeout(() => {
          // Check if message has been added by socket already
          setMessages((prevMessages) => {
            if (prevMessages.some((m) => m._id === messageId)) {
              console.log(
                "Message already added by socket, skipping manual add"
              );
              return prevMessages;
            }
            console.log(
              "Socket didn't add message, adding manually:",
              messageContent
            );
            return [...prevMessages, sentMessage];
          });
        }, 1000); // Wait 1 second for socket to deliver message
      } else if (!sentMessage) {
        console.error("Failed to send message: No message data returned");
        setError("Failed to send message. Please try again.");
      }

      setNewMessage("");
      setError(null);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      if (!message || !message.createdAt) return;

      try {
        const date = new Date(message.createdAt).toLocaleDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      } catch (e) {
        console.error("Error processing message date:", e);
      }
    });

    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-medium text-gray-900">{pharmacyName}</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                  {formatMessageDate(group.messages[0].createdAt)}
                </div>
              </div>

              {group.messages.map((message) => {
                const isCurrentUser = message.sender === currentUserId;

                return (
                  <div
                    key={message._id}
                    className={`flex mb-4 ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}>
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}>
                      <div className="text-sm">{message.content}</div>
                      <div
                        className={`text-xs mt-1 text-right ${
                          isCurrentUser ? "text-indigo-200" : "text-gray-500"
                        }`}>
                        {formatMessageTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
