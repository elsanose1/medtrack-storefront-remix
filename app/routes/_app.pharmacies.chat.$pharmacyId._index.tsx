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
        console.log(
          "Starting conversation creation process with pharmacy:",
          pharmacyId
        );

        // First check if this pharmacy exists
        const pharmacies = await chatService.getPharmacies();
        if (!Array.isArray(pharmacies)) {
          console.error("Invalid pharmacy data format received:", pharmacies);
          throw new Error("Invalid pharmacy data received");
        }

        console.log(`Found ${pharmacies.length} pharmacies`);
        const pharmacy = pharmacies.find((p) => p._id === pharmacyId);
        if (!pharmacy) {
          console.error("Pharmacy not found with ID:", pharmacyId);
          setError("Pharmacy not found");
          setLoading(false);
          return;
        }

        console.log("Found pharmacy:", pharmacy.pharmacyName);

        // Check if we already have a conversation with this pharmacy
        const conversations = await chatService.getConversations();
        if (!Array.isArray(conversations)) {
          console.error(
            "Invalid conversation data format received:",
            conversations
          );
          throw new Error("Invalid conversation data received");
        }

        console.log(`Found ${conversations.length} existing conversations`);

        // Find a conversation where this pharmacy is a participant
        for (const conversation of conversations) {
          const participantIds = conversation.participantDetails.map(
            (p) => p._id
          );
          console.log("Checking conversation participants:", participantIds);

          if (participantIds.includes(pharmacyId) && conversation._id) {
            console.log(
              "Found existing conversation with this pharmacy:",
              conversation._id
            );
            // We already have a conversation with this pharmacy, redirect to it
            navigate(`/pharmacies/chat/${pharmacyId}/${conversation._id}`);
            return;
          }
        }

        // We don't have a conversation yet, create one
        console.log(
          "No existing conversation found. Creating new conversation with pharmacy:",
          pharmacyId
        );
        const newConversation = await chatService.createConversation(
          pharmacyId
        );

        if (newConversation && newConversation._id) {
          console.log(
            "Successfully created new conversation:",
            newConversation._id
          );
          // Redirect to the newly created conversation
          navigate(`/pharmacies/chat/${pharmacyId}/${newConversation._id}`);
        } else {
          console.error(
            "Failed to create conversation - response didn't contain conversation ID",
            newConversation
          );
          throw new Error(
            "Failed to create conversation - invalid response format"
          );
        }
      } catch (err) {
        console.error("Error creating conversation:", err);

        // Extract the most useful error message
        let errorMessage = "Failed to start chat. Please try again later.";
        if (typeof err === "object" && err !== null) {
          if ("message" in err) {
            errorMessage = String(err.message);
          }

          // Try to extract more specific error details if available
          if (
            "response" in err &&
            typeof err.response === "object" &&
            err.response !== null
          ) {
            const response = err.response;
            if (
              "data" in response &&
              typeof response.data === "object" &&
              response.data !== null
            ) {
              const data = response.data;
              if ("message" in data) {
                errorMessage = String(data.message);
              }
            }
          }
        }

        setError(errorMessage);
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
