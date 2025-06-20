import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { socketService } from "~/services/socket.service";

interface UserInfo {
  id: string;
  email: string;
  username: string;
  userType: string;
  firstName: string;
  lastName: string;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  medications?: number;
  lastActive?: Date;
}

interface PharmacyDashboardProps {
  userInfo: UserInfo | null;
}

export default function PharmacyDashboard({
  userInfo,
}: PharmacyDashboardProps) {
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [pendingRefills, setPendingRefills] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // --- POPUP NOTIFICATION STATE ---
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPatientId, setPopupPatientId] = useState<string | null>(null);
  const [popupUserName, setPopupUserName] = useState<string>("");
  const [popupUserPhone, setPopupUserPhone] = useState<string>("");
  const [popupDrugId, setPopupDrugId] = useState<string>("");
  const [popupDrugName, setPopupDrugName] = useState<string>("");
  const [popupNote, setPopupNote] = useState<string>("");
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [responding, setResponding] = useState(false);
  const [responsePrice, setResponsePrice] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Simulated data - would be replaced with actual API calls
        // These would be API calls to get pharmacy-specific data

        // Mock data for demonstration
        const mockRecentPatients = [
          {
            _id: "1",
            firstName: "John",
            lastName: "Smith",
            email: "john@example.com",
            phoneNumber: "555-123-4567",
            medications: 3,
            lastActive: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            _id: "2",
            firstName: "Emma",
            lastName: "Johnson",
            email: "emma@example.com",
            phoneNumber: "555-987-6543",
            medications: 2,
            lastActive: new Date(Date.now() - 172800000), // 2 days ago
          },
          {
            _id: "3",
            firstName: "Michael",
            lastName: "Brown",
            email: "michael@example.com",
            phoneNumber: "555-555-5555",
            medications: 5,
            lastActive: new Date(Date.now() - 259200000), // 3 days ago
          },
        ];

        setRecentPatients(mockRecentPatients);
        setPendingRefills(7);
      } catch (err) {
        console.error("Error fetching pharmacy dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Listen for show_popup and close_popup events
  useEffect(() => {
    const handleShowPopup = (data: {
      patientId: string;
      userName: string;
      userPhone: string;
      drugId: string;
      drugName: string;
      note: string;
    }) => {
      setPopupPatientId(data.patientId);
      setPopupUserName(data.userName);
      setPopupUserPhone(data.userPhone);
      setPopupDrugId(data.drugId);
      setPopupDrugName(data.drugName);
      setPopupNote(data.note);
      setPopupOpen(true);
      setResponseMessage("");
    };
    const handleClosePopup = (data: { patientId: string }) => {
      if (popupPatientId === data.patientId) {
        setPopupOpen(false);
        setPopupPatientId(null);
        setPopupUserName("");
        setPopupUserPhone("");
        setPopupDrugId("");
        setPopupDrugName("");
        setPopupNote("");
        setResponseMessage("");
      }
    };
    socketService.setupShowPopupListener(handleShowPopup);
    socketService.setupClosePopupListener(handleClosePopup);
    return () => {
      socketService.removeShowPopupListener();
      socketService.removeClosePopupListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupPatientId]);

  // Respond to patient
  const handleRespond = () => {
    if (
      !popupPatientId ||
      !responseMessage.trim() ||
      !responsePrice.trim() ||
      isNaN(Number(responsePrice))
    )
      return;
    setResponding(true);
    socketService.emitPharmacistPopupResponse({
      patientId: popupPatientId,
      response: responseMessage,
      price: Number(responsePrice),
      drugId: popupDrugId,
      note: popupNote,
    });
    setResponding(false);
    setPopupOpen(false);
    setPopupPatientId(null);
    setPopupUserName("");
    setPopupUserPhone("");
    setPopupDrugId("");
    setPopupDrugName("");
    setPopupNote("");
    setResponseMessage("");
    setResponsePrice("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Popup Modal for Pharmacist */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setPopupOpen(false)}
              aria-label="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-indigo-800 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              Patient Request
            </h2>
            <div className="mb-4">
              <div className="font-medium text-gray-700 mb-1">
                Patient Name:
              </div>
              <div className="bg-gray-100 rounded p-2 text-gray-900 mb-2">
                {popupUserName}
              </div>
              <div className="font-medium text-gray-700 mb-1">
                Patient Phone:
              </div>
              <div className="bg-gray-100 rounded p-2 text-gray-900 mb-2">
                {popupUserPhone}
              </div>
              <div className="font-medium text-gray-700 mb-1">Medication:</div>
              <div className="bg-gray-100 rounded p-2 text-gray-900 mb-2">
                {popupDrugName}
              </div>
              <div className="font-medium text-gray-700 mb-1">Note:</div>
              <div className="bg-gray-100 rounded p-2 text-gray-900">
                {popupNote}
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="pharmacist-response"
                className="block text-sm font-medium text-gray-700 mb-1">
                Respond to Patient:
              </label>
              <input
                id="pharmacist-response"
                type="text"
                className="border border-indigo-300 rounded px-3 py-2 text-sm w-full"
                placeholder="Enter your response"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                disabled={responding}
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="pharmacist-price"
                className="block text-sm font-medium text-gray-700 mb-1">
                Price:
              </label>
              <input
                id="pharmacist-price"
                type="number"
                min="0"
                step="0.01"
                className="border border-indigo-300 rounded px-3 py-2 text-sm w-full"
                placeholder="Enter price"
                value={responsePrice}
                onChange={(e) => setResponsePrice(e.target.value)}
                disabled={responding}
              />
            </div>
            <button
              onClick={handleRespond}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm w-full"
              disabled={
                responding ||
                !responseMessage.trim() ||
                !responsePrice.trim() ||
                isNaN(Number(responsePrice))
              }>
              {responding ? "Sending..." : "Send Response"}
            </button>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {userInfo?.firstName || "Pharmacy"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s an overview of your pharmacy operations and patient
          information.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Patients
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">42</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending Refills
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {pendingRefills}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Medications
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">128</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
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
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Recent Patients
          </h2>
          <Link
            to="/patients"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medications
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPatients.map((patient) => (
                <tr key={patient._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{patient.email}</div>
                    <div className="text-sm text-gray-500">
                      {patient.phoneNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.medications}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {patient.lastActive?.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/patients/${patient._id}`}
                      className="text-indigo-600 hover:text-indigo-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/patients/add"
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Add Patient</h3>
              <p className="text-xs text-gray-500">Register a new patient</p>
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
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Browse Medications
              </h3>
              <p className="text-xs text-gray-500">Search the drug library</p>
            </div>
          </Link>

          <Link
            to="/refills"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Manage Refills
              </h3>
              <p className="text-xs text-gray-500">Process pending requests</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
