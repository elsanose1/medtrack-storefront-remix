import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { socketService } from "~/services/socket.service";
import { requestService } from "~/services/request.service";
import { drugService } from "~/services/drug.service";

interface UserInfo {
  id: string;
  email: string;
  username: string;
  userType: string;
  firstName: string;
  lastName: string;
}

interface ApprovedDrugRequest {
  _id: string;
  drugName: string;
  patientID: string;
  note?: string;
  price: number;
  status: "preparing" | "out_for_delivery" | "delivered" | "canceled";
  createdAt: string;
  patientName?: string;
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
  const [deliveredRequests, setDeliveredRequests] = useState<
    ApprovedDrugRequest[]
  >([]);
  const [preparingCount, setPreparingCount] = useState<number>(0);
  const [outForDeliveryCount, setOutForDeliveryCount] = useState<number>(0);
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
        if (userInfo) {
          const approvedRequestsPromise =
            requestService.getApprovedRequestCounts(userInfo.id);
          const pharmacyRequestsPromise =
            drugService.getPharmacyApprovedDrugRequests(userInfo.id);

          const [approvedRequests, pharmacyRequests] = await Promise.all([
            approvedRequestsPromise,
            pharmacyRequestsPromise,
          ]);

          if (approvedRequests.success) {
            setPreparingCount(approvedRequests.data.preparing);
            setOutForDeliveryCount(approvedRequests.data.out_for_delivery);
          } else {
            setError(approvedRequests.message);
          }

          if (pharmacyRequests.success) {
            const delivered = pharmacyRequests.data.filter(
              (req: ApprovedDrugRequest) => req.status === "delivered"
            );
            setDeliveredRequests(delivered);
          } else {
            setError(pharmacyRequests.message || "Failed to fetch requests");
          }
        }
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
                Preparing Requests
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {preparingCount}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-600"
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Out for Delivery
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {outForDeliveryCount}
              </p>
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Active Requests
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {preparingCount + outForDeliveryCount}
              </p>
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Delivered Requests */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Delivered Requests
          </h2>
          <Link
            to="/pharmacies/requests"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drug
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveredRequests.map((req) => (
                <tr key={req._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {req.drugName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {req.patientName || req.patientID}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${req.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
