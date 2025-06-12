import { useEffect, useState } from "react";
import { adminService } from "~/services/admin.service";
import { Link } from "@remix-run/react";
import AuthLayout from "~/components/Layout/AuthLayout";

interface Pharmacy {
  _id: string;
  pharmacyName: string;
  email: string;
  phoneNumber?: string;
  verified?: boolean;
}

export default function PendingPharmaciesPage() {
  const [pendingPharmacies, setPendingPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await adminService.getPendingPharmacies();
        setPendingPharmacies(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load pending pharmacies");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (pharmacyId: string, approve: boolean) => {
    setActionLoading(pharmacyId + approve);
    setActionMessage("");
    try {
      await adminService.approveOrRejectPharmacy(pharmacyId, approve);
      setPendingPharmacies((prev) => prev.filter((p) => p._id !== pharmacyId));
      setActionMessage(approve ? "Pharmacy approved." : "Pharmacy rejected.");
    } catch (err) {
      setActionMessage("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(pendingPharmacies.length / perPage);
  const paginated = pendingPharmacies.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            All Pending Pharmacies
          </h1>
          <Link
            to="/dashboard"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Back to Dashboard
          </Link>
        </div>
        {actionMessage && (
          <div className="mb-4 text-center text-sm text-green-700 bg-green-100 rounded p-2">
            {actionMessage}
          </div>
        )}
        {isLoading ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pharmacy Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map((pharm) => (
                    <tr key={pharm._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {pharm.pharmacyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {pharm.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {pharm.phoneNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        <button
                          className="mr-2 px-3 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                          disabled={!!actionLoading}
                          onClick={() => handleAction(pharm._id, true)}>
                          {actionLoading === pharm._id + true
                            ? "Approving..."
                            : "Approve"}
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                          disabled={!!actionLoading}
                          onClick={() => handleAction(pharm._id, false)}>
                          {actionLoading === pharm._id + false
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}>
                Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
