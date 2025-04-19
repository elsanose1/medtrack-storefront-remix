import { useState, useEffect, useRef } from "react";
import { useParams } from "@remix-run/react";
import { chatService } from "~/services/chat.service";
import { authService } from "~/services/auth.service";
import { socketService } from "~/services/socket.service";

interface Message {
  _id: string;
  conversation: string;
  sender: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt?: string;
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

  // Fetch messages when component mounts or conversation changes
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
    } else {
      setError("No conversation ID provided");
      setLoading(false);
    }
  }, [conversationId]);

  // Setup socket listening for new messages
  useEffect(() => {
    const socket = socketService.getSocket();

    if (socket) {
      // Listen for new messages in this conversation
      const handleNewMessage = (message: Message) => {
        if (message.conversation === conversationId) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
      };
    }
  }, [conversationId]);

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
      const sentMessage = await chatService.sendMessage(
        conversationId,
        newMessage.trim()
      );

      // If the message was sent successfully and not already added by socket, add it to the list
      if (sentMessage && !messages.some((m) => m._id === sentMessage._id)) {
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
      }

      setNewMessage("");
      setError(null);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
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
