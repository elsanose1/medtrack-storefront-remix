import { useEffect, useState } from "react";
import { drugService } from "~/services/drug.service";
import { authService } from "~/services/auth.service";

interface ApprovedDrugRequest {
  _id: string;
  drugID: string;
  patientID: string;
  note?: string;
  price: number;
  status: "preparing" | "out_for_delivery" | "delivered" | "canceled";
  createdAt: string;
}

export default function PharmacyDrugRequestsPage() {
  const [requests, setRequests] = useState<ApprovedDrugRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

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
        setRequests(res.data);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pharmacy Drug Requests</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Drug</th>
                <th className="px-4 py-2 border-b">Patient</th>
                <th className="px-4 py-2 border-b">Note</th>
                <th className="px-4 py-2 border-b">Price</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Created At</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id} className="text-center">
                  <td className="px-4 py-2 border-b">{req.drugID}</td>
                  <td className="px-4 py-2 border-b">{req.patientID}</td>
                  <td className="px-4 py-2 border-b">{req.note || "-"}</td>
                  <td className="px-4 py-2 border-b">
                    ${req.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border-b">{req.status}</td>
                  <td className="px-4 py-2 border-b">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border-b space-x-2">
                    {(req.status === "preparing" ||
                      req.status === "out_for_delivery") && (
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        onClick={() => handleCancel(req._id)}
                        disabled={actionId === req._id}>
                        {actionId === req._id ? "Canceling..." : "Cancel"}
                      </button>
                    )}
                    {req.status === "preparing" && (
                      <button
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                        onClick={() => handleOutForDelivery(req._id)}
                        disabled={actionId === req._id}>
                        {actionId === req._id
                          ? "Updating..."
                          : "Out for Delivery"}
                      </button>
                    )}
                    {req.status === "out_for_delivery" && (
                      <button
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
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
      )}
    </div>
  );
}
