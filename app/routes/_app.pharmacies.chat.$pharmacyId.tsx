import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "@remix-run/react";
import { chatService } from "~/services/chat.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Starting Chat - MedTrack" }];
};

export default function InitiateChatPage() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify required params
    if (!pharmacyId) {
      console.error("Missing required parameter: pharmacyId");
      navigate("/pharmacies");
      return;
    }

    // Try to create a conversation with this pharmacy
    const createConversation = async () => {
      try {
        setLoading(true);

        // First check if this pharmacy exists
        const pharmacies = await chatService.getPharmacies();
        if (!Array.isArray(pharmacies)) {
          throw new Error("Invalid pharmacy data received");
        }

        const pharmacy = pharmacies.find((p) => p._id === pharmacyId);
        if (!pharmacy) {
          setError("Pharmacy not found");
          setLoading(false);
          return;
        }

        // Check if we already have a conversation with this pharmacy
        const conversations = await chatService.getConversations();
        if (!Array.isArray(conversations)) {
          throw new Error("Invalid conversation data received");
        }

        // Find a conversation where this pharmacy is a participant
        for (const conversation of conversations) {
          const participantIds = conversation.participantDetails.map(
            (p) => p._id
          );
          if (participantIds.includes(pharmacyId) && conversation._id) {
            // We already have a conversation with this pharmacy, redirect to it
            navigate(`/pharmacies/chat/${pharmacyId}/${conversation._id}`);
            return;
          }
        }

        // We don't have a conversation yet, create one
        console.log("Creating new conversation with pharmacy:", pharmacyId);
        const newConversation = await chatService.createConversation(
          pharmacyId
        );

        if (newConversation && newConversation._id) {
          // Redirect to the newly created conversation
          navigate(`/pharmacies/chat/${pharmacyId}/${newConversation._id}`);
        } else {
          throw new Error("Failed to create conversation");
        }
      } catch (err) {
        console.error("Error creating conversation:", err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "Failed to start chat. Please try again later."
        );
        setLoading(false);
      }
    };

    createConversation();
  }, [pharmacyId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Starting conversation...</p>
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
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
      <p className="text-gray-600">Starting conversation...</p>
    </div>
  );
}
