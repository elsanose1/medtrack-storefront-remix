import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "@remix-run/react";
import ChatMessages from "~/components/Chat/ChatMessages";
import ConversationList from "~/components/Chat/ConversationList";
import { chatService } from "~/services/chat.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Chat with Pharmacy - MedTrack" }];
};

export default function ChatPage() {
  const { pharmacyId, conversationId } = useParams();
  const navigate = useNavigate();
  const [pharmacyName, setPharmacyName] = useState("Pharmacy");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify required params
    if (!pharmacyId || !conversationId) {
      console.error(
        "Missing required parameters: pharmacyId or conversationId"
      );
      navigate("/pharmacies");
      return;
    }

    // Fetch pharmacy details and verify conversation belongs to this pharmacy
    const fetchPharmacyDetails = async () => {
      try {
        setLoading(true);

        // First get all pharmacies
        const pharmacies = await chatService.getPharmacies();
        if (!Array.isArray(pharmacies)) {
          throw new Error("Invalid pharmacy data received");
        }

        const pharmacy = pharmacies.find((p) => p._id === pharmacyId);

        if (!pharmacy) {
          setError("Pharmacy not found");
          return;
        }

        setPharmacyName(pharmacy.pharmacyName || "Pharmacy");

        // Verify this conversation exists
        const conversations = await chatService.getConversations();
        if (!Array.isArray(conversations)) {
          throw new Error("Invalid conversation data received");
        }

        const conversation = conversations.find(
          (c) => c._id === conversationId
        );

        if (!conversation) {
          // Conversation not found, try to create one
          try {
            await chatService.createConversation(pharmacyId);
            // Refresh the page to get the new conversation
            window.location.reload();
          } catch (createErr) {
            console.error("Failed to create conversation:", createErr);
            setError("Conversation not found and could not be created");
          }
        }
      } catch (err) {
        console.error("Error fetching pharmacy details:", err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "Failed to load chat. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacyDetails();
  }, [pharmacyId, conversationId, navigate]);

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
          to="/pharmacies"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Back to Pharmacies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <Link
          to="/pharmacies"
          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Back to Pharmacies
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversation list */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Conversations
          </h2>
          <ConversationList />
        </div>

        {/* Chat messages */}
        <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden border border-gray-200 h-[600px]">
          {conversationId && (
            <ChatMessages
              conversationId={conversationId}
              pharmacyName={pharmacyName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
