import { useState, useEffect } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { chatService } from "~/services/chat.service";
import { authService } from "~/services/auth.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Your Patients - MedTrack" }];
};

interface PatientItem {
  _id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  conversationId: string;
}

export default function PatientsPage() {
  const navigate = useNavigate();

  // Check if user is a pharmacy
  useEffect(() => {
    const userInfo = authService.getUserInfo();
    if (!userInfo || userInfo.userType !== "pharmacy") {
      // Redirect non-pharmacy users to the dashboard
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Your Patients</h1>
      </div>

      {/* Display patients list */}
      <div>
        {/* PatientList component will be imported here */}
        <PatientsList />
      </div>
    </div>
  );
}

// Patients List Component (will be moved to its own file later)
function PatientsList() {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // Get conversations where the pharmacy is a participant
        const conversations = await chatService.getConversations();

        if (Array.isArray(conversations) && conversations.length > 0) {
          // Extract unique patients from conversations
          const uniquePatients: Record<string, PatientItem> = {};
          conversations.forEach((conversation) => {
            const patient = conversation.participantDetails.find(
              (participant) => participant.userType === "patient"
            );

            if (patient && patient._id) {
              uniquePatients[patient._id] = {
                _id: patient._id,
                name: patient.username || "Patient",
                lastMessage:
                  conversation.lastMessage?.content || "No messages yet",
                lastMessageTime:
                  conversation.lastMessage?.createdAt || conversation.createdAt,
                conversationId: conversation._id,
              };
            }
          });

          setPatients(Object.values(uniquePatients));
        } else {
          setPatients([]);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patient list. Please try again later.");
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-500"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to Load Patients
          </h3>
          <p className="text-gray-500 max-w-md mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <svg
              className="h-4 w-4 mr-1.5"
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

  if (patients.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Patients Found
          </h3>
          <p className="text-gray-500 max-w-md mb-4">
            You haven&apos;t started any conversations with patients yet.
            Patients will appear here once they begin a conversation with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {patients.map((patient) => (
          <li key={patient._id}>
            <Link
              to={`/patients/chat/${patient._id}/${patient.conversationId}`}
              className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <div className="flex items-center">
                      <p className="font-medium text-indigo-600 truncate">
                        {patient.name}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="text-xs text-gray-500">
                      {formatDate(patient.lastMessageTime)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {patient.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
