import { Link } from "@remix-run/react";
import ConversationList from "~/components/Chat/ConversationList";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "My Conversations - MedTrack" }];
};

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Conversations</h1>
        <Link
          to="/pharmacies"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Find Pharmacies
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Recent Conversations
          </h2>
          <p className="text-sm text-gray-500">
            View and continue your conversations with pharmacies.
          </p>
        </div>

        <ConversationList />
      </div>
    </div>
  );
}
