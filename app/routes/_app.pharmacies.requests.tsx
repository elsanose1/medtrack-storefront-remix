import { useEffect, useState } from "react";
import { drugService } from "~/services/drug.service";
import { authService } from "~/services/auth.service";

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

export default function PharmacyDrugRequestsPage() {
  const [requests, setRequests] = useState<ApprovedDrugRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError("");
      const user = authService.getUserInfo();
      if (!user) {
        setError("User not found");
        setLoading(false);
        return;
      }
      const res = await drugService.getPharmacyApprovedDrugRequests(user._id);
      if (res.success) {
        const sortedData = res.data.sort(
          (a: ApprovedDrugRequest, b: ApprovedDrugRequest) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRequests(sortedData);
      } else {
        setError(res.message || "Failed to fetch requests");
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const handleCancel = async (id: string) => {
    const user = authService.getUserInfo();
    if (!user) return;
    setActionId(id);
    const res = await drugService.cancelPharmacyApprovedDrugRequest(
      id,
      user._id
    );
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "canceled" } : r))
      );
    }
    setActionId(null);
  };

  const handleOutForDelivery = async (id: string) => {
    const user = authService.getUserInfo();
    if (!user) return;
    setActionId(id);
    const res = await drugService.markOutForDelivery(id, user._id);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: "out_for_delivery" } : r
        )
      );
    }
    setActionId(null);
  };

  const handleDelivered = async (id: string) => {
    const user = authService.getUserInfo();
    if (!user) return;
    setActionId(id);
    const res = await drugService.markDelivered(id, user._id);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "delivered" } : r))
      );
    }
    setActionId(null);
  };

  const filteredRequests = requests.filter(
    (req) => statusFilter === "all" || req.status === statusFilter
  );

  console.log(requests);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Pharmacy Drug Requests
        </h1>
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700">
            Filter by Status
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="preparing">Preparing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Drug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="text-center">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {req.drugName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {req.patientName || req.patientID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {req.note || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      ${req.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {req.status === "preparing" && (
                        <span className="bg-yellow-100 text-yellow-800 rounded px-2 py-1 text-xs font-semibold">
                          Preparing
                        </span>
                      )}
                      {req.status === "out_for_delivery" && (
                        <span className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs font-semibold">
                          Out for Delivery
                        </span>
                      )}
                      {req.status === "delivered" && (
                        <span className="bg-green-100 text-green-800 rounded px-2 py-1 text-xs font-semibold">
                          Delivered
                        </span>
                      )}
                      {req.status === "canceled" && (
                        <span className="bg-red-100 text-red-800 rounded px-2 py-1 text-xs font-semibold">
                          Canceled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 space-x-2">
                      {(req.status === "preparing" ||
                        req.status === "out_for_delivery") && (
                        <button
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium"
                          onClick={() => handleCancel(req._id)}
                          disabled={actionId === req._id}>
                          {actionId === req._id ? "Canceling..." : "Cancel"}
                        </button>
                      )}
                      {req.status === "preparing" && (
                        <button
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs font-medium"
                          onClick={() => handleOutForDelivery(req._id)}
                          disabled={actionId === req._id}>
                          {actionId === req._id
                            ? "Updating..."
                            : "Out for Delivery"}
                        </button>
                      )}
                      {req.status === "out_for_delivery" && (
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium"
                          onClick={() => handleDelivered(req._id)}
                          disabled={actionId === req._id}>
                          {actionId === req._id
                            ? "Updating..."
                            : "Mark Delivered"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
