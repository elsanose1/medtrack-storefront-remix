import { useEffect, useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import { medicationService, Medication } from "~/services/medication.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Medications - MedTrack" }];
};

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    const fetchMedications = async () => {
      setIsLoading(true);
      try {
        const response = await medicationService.getPatientMedications();
        if (response.success) {
          setMedications(response.data);
        } else {
          setError("Failed to load medications");
        }
      } catch (err) {
        console.error("Error fetching medications:", err);
        setError("Failed to load medications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedications();
  }, []);

  const handleDeleteMedication = async (medicationId: string) => {
    if (window.confirm("Are you sure you want to delete this medication?")) {
      try {
        const response = await medicationService.deleteMedication(medicationId);
        if (response.success) {
          setMedications((prev) =>
            prev.filter((med) => med._id !== medicationId)
          );
        } else {
          setError("Failed to delete medication");
        }
      } catch (err) {
        console.error("Error deleting medication:", err);
        setError("Failed to delete medication");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Tabs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Medication Management
          </h1>
          <Link
            to="/medications/add"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Medication
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              to="/medications"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === "/medications"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              All Medications
            </Link>
            <Link
              to="/reminders"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === "/reminders"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              Reminders
            </Link>
            <Link
              to="/drugs"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === "/drugs"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              Medication Database
            </Link>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {medications.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 mx-auto text-gray-400">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>

            <h3 className="mt-4 text-lg font-medium text-gray-700">
              No medications found
            </h3>
            <p className="mt-1 text-gray-500">
              Add your first medication to get started
            </p>
            <div className="mt-6">
              <Link
                to="/medications/add"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                Add Medication
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Medication
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Dosage
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Frequency
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {medications.map((medication) => (
                  <tr key={medication._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div className="font-medium text-gray-900">
                        {medication.brandName}
                      </div>
                      <div className="text-gray-500">
                        {medication.genericName}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {medication.dosage}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {medication.frequency}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          medication.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {medication.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/medications/${medication._id}`}
                          className="text-indigo-600 hover:text-indigo-900">
                          View
                        </Link>
                        <Link
                          to={`/medications/${medication._id}/edit`}
                          className="text-blue-600 hover:text-blue-900">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteMedication(medication._id)}
                          className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/medications/add"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Add Medication
              </h3>
              <p className="text-xs text-gray-500">
                Create a new medication record
              </p>
            </div>
          </Link>
          <Link
            to="/reminders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 bg-green-100 p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
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
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Manage Reminders
              </h3>
              <p className="text-xs text-gray-500">
                View and manage medication reminders
              </p>
            </div>
          </Link>
          <Link
            to="/drugs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 bg-blue-100 p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Drug Database
              </h3>
              <p className="text-xs text-gray-500">
                Search for medication information
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
