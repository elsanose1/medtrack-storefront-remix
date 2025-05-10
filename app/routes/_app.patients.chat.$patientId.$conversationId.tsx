import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "@remix-run/react";
import ChatMessages from "~/components/Chat/ChatMessages";
import { chatService } from "~/services/chat.service";
import { authService } from "~/services/auth.service";
import { socketService } from "~/services/socket.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Chat with Patient - MedTrack" }];
};

export default function PharmacyPatientChatPage() {
  const { patientId, conversationId } = useParams();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Patient");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection and join conversation room
  useEffect(() => {
    // Initialize socket
    socketService.initializeSocket();

    // If we have a conversation ID, join that room
    if (conversationId) {
      socketService.joinConversation(conversationId);
    }

    // Clean up on unmount
    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  // Check if user is a pharmacy
  useEffect(() => {
    const userInfo = authService.getUserInfo();
    if (!userInfo || userInfo.userType !== "pharmacy") {
      // Redirect non-pharmacy users to the dashboard
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    // Verify required params
    if (!patientId || !conversationId) {
      console.error("Missing required parameters: patientId or conversationId");
      navigate("/patients");
      return;
    }

    // Fetch patient details and verify conversation belongs to this patient
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);

        // Get conversations
        const conversations = await chatService.getConversations();
        if (!Array.isArray(conversations)) {
          throw new Error("Invalid conversation data received");
        }

        // Find this specific conversation
        const conversation = conversations.find(
          (c) => c._id === conversationId
        );

        if (!conversation) {
          setError("Conversation not found");
          setLoading(false);
          return;
        }

        // Find the patient in this conversation
        const patient = conversation.participantDetails.find(
          (p) => p._id === patientId && p.userType === "patient"
        );

        if (!patient) {
          setError("Patient not found in this conversation");
          setLoading(false);
          return;
        }

        // Set patient name
        setPatientName(patient.username || "Patient");
        setError(null);
      } catch (err) {
        console.error("Error fetching patient details:", err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "Failed to load chat. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId, conversationId, navigate]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && !loading && !error) {
      const markMessagesAsRead = async () => {
        try {
          await chatService.markAsRead(conversationId);
          console.log("Messages marked as read");
        } catch (err) {
          console.error("Error marking messages as read:", err);
        }
      };

      markMessagesAsRead();
    }
  }, [conversationId, loading, error]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
        <Link
          to="/patients"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Back to Patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Chat with Patient</h1>
        <Link
          to="/patients"
          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Back to Patients
        </Link>
      </div>

      {/* Chat messages */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 h-[600px]">
        {conversationId && (
          <ChatMessages
            conversationId={conversationId}
            pharmacyName={patientName} // We're reusing the component but with patient name
          />
        )}
      </div>
    </div>
  );
}
