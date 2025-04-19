import { useState, useEffect } from "react";
import { Link, useLocation } from "@remix-run/react";
import { chatService } from "~/services/chat.service";
import { authService } from "~/services/auth.service";

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

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const currentUserId = authService.getUserInfo()?._id || "";

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const data = await chatService.getConversations();
        setConversations(data || []);
        setError(null);
      } catch (err) {
        setError("Failed to load conversations. Please try again later.");
        console.error(err);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Add a function to refresh conversations
  const handleRefreshConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getConversations();
      setConversations(data || []);
    } catch (err) {
      setError("Failed to refresh conversations. Please try again later.");
      console.error(err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Get other participant's details (pharmacy)
  const getParticipantDetails = (conversation: Conversation) => {
    const otherParticipant = conversation.participantDetails.find(
      (p) => p._id !== currentUserId
    );

    return {
      name:
        otherParticipant?.pharmacyName ||
        otherParticipant?.username ||
        "Unknown",
      id: otherParticipant?._id || "",
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-md font-medium text-gray-900 mb-1">
            Failed to Load Conversations
          </h3>
          <p className="text-sm text-gray-500 mb-3">{error}</p>
          <button
            onClick={handleRefreshConversations}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <svg
              className="h-3.5 w-3.5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (
    !conversations ||
    !Array.isArray(conversations) ||
    conversations.length === 0
  ) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-center">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-md font-medium text-gray-900 mb-2">
            No Conversations
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            You haven&apos;t started any conversations with pharmacies yet.
          </p>
          <Link
            to="/pharmacies"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Find Pharmacies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-500">
          Your Conversations
        </h4>
        <button
          onClick={handleRefreshConversations}
          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
          title="Refresh conversations"
          aria-label="Refresh conversations">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
      <ul className="divide-y divide-gray-200">
        {conversations.map((conversation) => {
          const participant = getParticipantDetails(conversation);
          const isActive = location.pathname.includes(conversation._id);

          return (
            <li key={conversation._id}>
              <Link
                to={`/pharmacies/chat/${participant.id}/${conversation._id}`}
                className={`block hover:bg-gray-50 ${
                  isActive ? "bg-indigo-50" : ""
                }`}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="flex items-center">
                        <p className="font-medium text-indigo-600 truncate">
                          {participant.name}
                        </p>
                      </div>
                    </div>
                    {conversation.lastMessage && (
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-xs text-gray-500">
                          {formatDate(conversation.lastMessage.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {conversation.lastMessage
                          ? conversation.lastMessage.content
                          : "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
