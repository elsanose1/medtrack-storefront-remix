import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { chatService } from "~/services/chat.service";

interface Pharmacy {
  _id: string;
  pharmacyName: string;
  email: string;
  isVerified: boolean;
  isOnline?: boolean;
}

export default function PharmacyList() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        setLoading(true);
        const pharmacyData = await chatService.getPharmacies();
        setPharmacies(pharmacyData || []);
        setError(null);
      } catch (err) {
        setError("Failed to load pharmacies. Please try again later.");
        console.error(err);
        setPharmacies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, []);

  // Add a function to retry loading pharmacies
  const handleRetryLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      const pharmacyData = await chatService.getPharmacies();
      setPharmacies(pharmacyData || []);
    } catch (err) {
      setError("Failed to load pharmacies. Please try again later.");
      console.error(err);
      setPharmacies([]);
    } finally {
      setLoading(false);
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
            Unable to Load Pharmacies
          </h3>
          <p className="text-gray-500 max-w-md mb-4">{error}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left w-full max-w-md mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Possible solutions:
            </p>
            <ul className="text-gray-500 text-sm space-y-2">
              <li className="flex items-start">
                <svg
                  className="h-4 w-4 text-gray-400 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Check your internet connection
              </li>
              <li className="flex items-start">
                <svg
                  className="h-4 w-4 text-gray-400 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Try refreshing the page or logging in again if your session
                expired
              </li>
              <li className="flex items-start">
                <svg
                  className="h-4 w-4 text-gray-400 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                If the problem persists, contact our support team
              </li>
            </ul>
          </div>
          <button
            onClick={handleRetryLoad}
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

  if (!pharmacies || !Array.isArray(pharmacies) || pharmacies.length === 0) {
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Pharmacies Available
          </h3>
          <p className="text-gray-500 max-w-md mb-4">
            There are no verified pharmacies available for chat at the moment.
            This could be because:
          </p>
          <ul className="text-gray-500 text-left text-sm mb-6 space-y-2">
            <li className="flex items-start">
              <svg
                className="h-4 w-4 text-gray-400 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              No pharmacies have registered with the system yet
            </li>
            <li className="flex items-start">
              <svg
                className="h-4 w-4 text-gray-400 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Registered pharmacies are awaiting verification by admin
            </li>
            <li className="flex items-start">
              <svg
                className="h-4 w-4 text-gray-400 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              There might be a connectivity issue with the pharmacy service
            </li>
          </ul>
          <p className="text-gray-500 text-sm mb-4">
            You can try again later or contact support if the issue persists.
          </p>
          <button
            onClick={handleRetryLoad}
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pharmacies.map((pharmacy) => (
        <div
          key={pharmacy._id}
          className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">
                {pharmacy.pharmacyName}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  pharmacy.isOnline
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                {pharmacy.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 truncate">
              {pharmacy.email}
            </p>
            <div className="mt-4 flex justify-end">
              <Link
                to={`/pharmacies/chat/${pharmacy._id}`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Start Chat
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
