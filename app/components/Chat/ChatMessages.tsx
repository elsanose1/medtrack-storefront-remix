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
  sentStatus?: "sending" | "sent" | "delivered" | "error";
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
            sentStatus: "delivered", // Mark as delivered when received via socket
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
            sentStatus: "delivered", // Mark as delivered when received via socket
          };
        }

        console.log("Processed new message:", newMessage);

        // Add the message if it's not already in our list
        setMessages((prevMessages) => {
          // Check for duplicates with more criteria:
          // 1. Same ID
          // 2. Same content and sender within last 5 seconds (to catch socket duplicates)
          // 3. Temporary message with same content
          const now = new Date();
          const fiveSecondsAgo = new Date(now.getTime() - 5000);

          const existingMessageIndex = prevMessages.findIndex(
            (m) =>
              // Exact ID match
              String(m._id) === String(newMessage._id) ||
              // Temp message with matching content (our manual addition)
              (m._id.startsWith("temp-") &&
                m.content === newMessage.content &&
                m.sender === newMessage.sender) ||
              // Recent message with same content and sender (potential duplicate)
              (m.content === newMessage.content &&
                m.sender === newMessage.sender &&
                new Date(m.createdAt) > fiveSecondsAgo)
          );

          if (existingMessageIndex >= 0) {
            // We found this message - update it rather than add a duplicate
            console.log(
              "Updating existing message with ID:",
              prevMessages[existingMessageIndex]._id
            );

            // Create a new array with the updated message
            const updatedMessages = [...prevMessages];

            // Preserve the readAt state if it exists
            const readAt =
              prevMessages[existingMessageIndex].readAt || newMessage.readAt;

            // If this is replacing a temp message, use the new ID but keep the content
            updatedMessages[existingMessageIndex] = {
              ...newMessage,
              readAt,
              sentStatus: "delivered", // Update status to delivered
            };

            // Also update all previous messages from the same sender to have delivered status
            for (let i = 0; i < updatedMessages.length; i++) {
              if (
                i !== existingMessageIndex &&
                updatedMessages[i].sender === currentUserId &&
                (updatedMessages[i].sentStatus === "sent" ||
                  !updatedMessages[i].sentStatus)
              ) {
                updatedMessages[i] = {
                  ...updatedMessages[i],
                  sentStatus: "delivered",
                };
              }
            }

            return updatedMessages;
          }

          // If this is a new message, also update status of all previous messages
          const newMessages = [...prevMessages, newMessage];

          // Update all older messages from current user to "delivered" status
          if (newMessage.sender !== currentUserId) {
            for (let i = 0; i < newMessages.length - 1; i++) {
              if (
                newMessages[i].sender === currentUserId &&
                (newMessages[i].sentStatus === "sent" ||
                  !newMessages[i].sentStatus)
              ) {
                newMessages[i] = {
                  ...newMessages[i],
                  sentStatus: "delivered",
                };
              }
            }
          }

          console.log("Adding new message to list");
          return newMessages;
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
      // Update UI to show messages as read
      console.log("Messages marked as read:", data);

      if (data && data.conversationId === conversationId) {
        // Update all messages sent by current user to show as read
        setMessages((prevMessages) => {
          return prevMessages.map((msg) => {
            // Only update messages from current user that don't have a readAt time
            if (msg.sender === currentUserId && !msg.readAt) {
              return {
                ...msg,
                readAt: new Date().toISOString(),
              };
            }
            return msg;
          });
        });
      }
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

    // Create a temporary message with 'sending' status to show in the UI immediately
    const tempMessageId = `temp-${Date.now()}`;
    const messageContent = newMessage.trim();

    const tempMessage: Message = {
      _id: tempMessageId,
      conversation: conversationId,
      sender: currentUserId,
      senderName: authService.getUserInfo()?.username || "You",
      content: messageContent,
      createdAt: new Date().toISOString(),
      sentStatus: "sending",
    };

    // Add the temporary message to the UI immediately
    setMessages((prevMessages) => [...prevMessages, tempMessage]);

    // Clear input immediately for better UX
    setNewMessage("");

    try {
      setSending(true);
      console.log("Sending message to conversation:", conversationId);
      console.log("Message content:", messageContent);

      const sentMessage = await chatService.sendMessage(
        conversationId,
        messageContent
      );

      console.log("Message sent response:", sentMessage);

      // Check if we've received this message via socket already
      // If not, update the temporary message
      if (sentMessage) {
        // Set a very short delay to check if socket has already updated the message
        setTimeout(() => {
          setMessages((prevMessages) => {
            // If temp message is gone or we have a message with the same ID as sentMessage,
            // the socket has already handled it - no action needed
            const tempMessageExists = prevMessages.some(
              (m) => m._id === tempMessageId
            );
            const serverMessageExists = prevMessages.some(
              (m) => String(m._id) === String(sentMessage._id)
            );

            // If socket has already handled this message, do nothing
            if (!tempMessageExists || serverMessageExists) {
              return prevMessages;
            }

            // Otherwise, update the temp message with the real message
            return prevMessages.map((m) => {
              if (m._id === tempMessageId) {
                return {
                  ...sentMessage,
                  sentStatus: "sent", // Mark as just sent, will be updated to delivered later
                };
              }
              return m;
            });
          });
        }, 300); // very short delay to allow socket message to come in first
      } else {
        // If no message returned, update the temp message to error state
        setMessages((prevMessages) => {
          return prevMessages.map((m) => {
            if (m._id === tempMessageId) {
              return { ...m, sentStatus: "error" };
            }
            return m;
          });
        });

        setError("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Failed to send message:", err);

      // Update the temporary message to show error
      setMessages((prevMessages) => {
        return prevMessages.map((m) => {
          if (m._id === tempMessageId) {
            return { ...m, sentStatus: "error" };
          }
          return m;
        });
      });

      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // Add a function to retry sending failed messages
  const handleRetryMessage = async (messageId: string, content: string) => {
    // Find and update the failed message status to 'sending'
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg._id === messageId) {
          return { ...msg, sentStatus: "sending" };
        }
        return msg;
      })
    );

    try {
      console.log("Retrying message:", content);

      // Attempt to send the message again
      const sentMessage = await chatService.sendMessage(
        conversationId,
        content
      );

      if (sentMessage) {
        // Replace the failed message with the new sent message
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg._id === messageId) {
              return {
                ...sentMessage,
                sentStatus: "sent",
              };
            }
            return msg;
          })
        );
      } else {
        // If still failing, update status back to error
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg._id === messageId) {
              return { ...msg, sentStatus: "error" };
            }
            return msg;
          })
        );
        setError("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Failed to retry sending message:", err);

      // Update the message back to error state
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg._id === messageId) {
            return { ...msg, sentStatus: "error" };
          }
          return msg;
        })
      );

      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to send message. Please try again."
      );
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
                        className={`text-xs mt-1 text-right flex justify-end items-center ${
                          isCurrentUser ? "text-indigo-200" : "text-gray-500"
                        }`}>
                        {/* Message time */}
                        <span className="mr-1">
                          {formatMessageTime(message.createdAt)}
                        </span>

                        {/* Error retry button */}
                        {isCurrentUser && message.sentStatus === "error" && (
                          <button
                            onClick={() =>
                              handleRetryMessage(message._id, message.content)
                            }
                            className="mr-1 text-red-300 hover:text-red-200"
                            title="Retry sending this message">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        )}

                        {/* Message status indicators (only show for current user's messages) */}
                        {isCurrentUser && (
                          <span className="ml-1 flex items-center">
                            {/* Sending indicator */}
                            {message.sentStatus === "sending" && (
                              <svg
                                className="w-3 h-3 text-indigo-200"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}

                            {/* Sent indicator */}
                            {message.sentStatus === "sent" && (
                              <svg
                                className="w-3 h-3 text-indigo-200"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}

                            {/* Delivered indicator */}
                            {message.sentStatus === "delivered" &&
                              !message.readAt && (
                                <svg
                                  className="w-3.5 h-3.5 text-indigo-200"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 13l4 4L23 7"
                                    strokeOpacity="0.7"
                                  />
                                </svg>
                              )}

                            {/* Read indicator */}
                            {message.readAt && (
                              <svg
                                className="w-3.5 h-3.5 text-indigo-200"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 13l4 4L23 7"
                                />
                              </svg>
                            )}

                            {/* Error indicator */}
                            {message.sentStatus === "error" && (
                              <svg
                                className="w-3 h-3 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </span>
                        )}
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
            className="flex-1 block w-full rounded-md bg-gray-300 border-gray-300 shadow-sm placeholder:text-gray-600 text-black focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
