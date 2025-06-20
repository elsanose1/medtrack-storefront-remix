import { useEffect, useState } from "react";
import { adminService } from "~/services/admin.service";
import { Link } from "@remix-run/react";
import AuthLayout from "~/components/Layout/AuthLayout";

interface Admin {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function AllAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await adminService.getAllAdmins();
        setAdmins(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load admins");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPages = Math.ceil(admins.length / perPage);
  const paginated = admins.slice((page - 1) * perPage, page * perPage);

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">All Admins</h1>
          <div className="flex gap-2">
            <Link
              to="/dashboard"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 border border-indigo-600 rounded-md transition-colors">
              Back to Dashboard
            </Link>
            <Link
              to="/admin/create-admin"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 border border-indigo-600 rounded-md transition-colors">
              Create Admin
            </Link>
          </div>
        </div>
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
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map((admin) => (
                    <tr key={admin._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {admin.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {admin.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                        {admin.firstName || ""} {admin.lastName || ""}
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
