import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { adminService } from "~/services/admin.service";

interface UserInfo {
  id: string;
  email: string;
  username: string;
  userType: string;
  firstName: string;
  lastName: string;
}

interface SystemStats {
  totalUsers: number;
  totalPatients: number;
  totalPharmacies: number;
  totalAdmins: number;
  activeMedications: number;
  remindersToday: number;
}

interface Pharmacy {
  _id: string;
  pharmacyName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  verified?: boolean;
}

interface Admin {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AdminDashboardProps {
  userInfo: UserInfo | null;
}

export default function AdminDashboard({ userInfo }: AdminDashboardProps) {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalPharmacies: 0,
    totalAdmins: 0,
    activeMedications: 0,
    remindersToday: 0,
  });
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [pendingPharmacies, setPendingPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [
          usersCount,
          patientsCount,
          pharmaciesCount,
          adminsCount,
          allPharmacies,
          allAdmins,
          pendingPharms,
        ] = await Promise.all([
          adminService.getUsersCount(),
          adminService.getPatientsCount(),
          adminService.getPharmaciesCount(),
          adminService.getAdminsCount(),
          adminService.getAllPharmacies(),
          adminService.getAllAdmins(),
          adminService.getPendingPharmacies(),
        ]);
        setStats((prev) => ({
          ...prev,
          totalUsers: usersCount.count || 0,
          totalPatients: patientsCount.count || 0,
          totalPharmacies: pharmaciesCount.count || 0,
          totalAdmins: adminsCount.count || 0,
        }));
        setPharmacies(
          Array.isArray(allPharmacies) ? allPharmacies.slice(0, 3) : []
        );
        setAdmins(Array.isArray(allAdmins) ? allAdmins.slice(0, 3) : []);
        setPendingPharmacies(
          Array.isArray(pendingPharms) ? pendingPharms.slice(0, 3) : []
        );
      } catch (err) {
        setError("Failed to load dashboard data");
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
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {userInfo?.firstName || "Admin"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s an overview of your system metrics and activity.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-3 rounded-full mb-3">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {stats.totalUsers}
            </div>
            <div className="text-sm text-gray-500">Users</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col items-center">
            <div className="bg-green-100 p-3 rounded-full mb-3">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {stats.totalPatients}
            </div>
            <div className="text-sm text-gray-500">Patients</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col items-center">
            <div className="bg-purple-100 p-3 rounded-full mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {stats.totalPharmacies}
            </div>
            <div className="text-sm text-gray-500">Pharmacies</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col items-center">
            <div className="bg-yellow-100 p-3 rounded-full mb-3">
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
            <div className="text-xl font-bold text-gray-800">
              {stats.totalAdmins}
            </div>
            <div className="text-sm text-gray-500">Admins</div>
          </div>
        </div>
      </div>

      {/* Pharmacies Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            All Pharmacies (Top 3)
          </h2>
          <Link
            to="/admin/all-pharmacies"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 border border-indigo-600 rounded-md transition-colors">
            View All
          </Link>
        </div>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pharmacies.map((pharm) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            All Admins (Top 3)
          </h2>
          <div className="flex gap-2">
            <Link
              to="/admin/all-admins"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 border border-indigo-600 rounded-md transition-colors">
              View All
            </Link>
            <Link
              to="/admin/create-admin"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 border border-indigo-600 rounded-md transition-colors">
              Create Admin
            </Link>
          </div>
        </div>
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
              {admins.map((admin) => (
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
      </div>

      {/* Pending Pharmacies Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Pending Pharmacies (Top 3)
          </h2>
          <Link
            to="/admin/pending-pharmacies"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 border border-indigo-600 rounded-md transition-colors">
            View All
          </Link>
        </div>
        {actionMessage && (
          <div className="mb-4 text-center text-sm text-green-700 bg-green-100 rounded p-2">
            {actionMessage}
          </div>
        )}
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
              {pendingPharmacies.map((pharm) => (
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
      </div>

   
    </div>
  );
}
