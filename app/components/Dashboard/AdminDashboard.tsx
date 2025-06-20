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

      {/* System Activity & Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          System Activity
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
            <div className="flex-shrink-0 bg-green-100 p-2 rounded-md mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                New User Registration
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">12 new users</span> registered
                today
              </p>
            </div>
            <div className="ml-auto text-xs text-gray-500">2 hours ago</div>
          </div>

          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
            <div className="flex-shrink-0 bg-blue-100 p-2 rounded-md mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                System Update Complete
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Database migration completed successfully
              </p>
            </div>
            <div className="ml-auto text-xs text-gray-500">5 hours ago</div>
          </div>

          <div className="flex items-start p-4 border border-gray-200 rounded-lg">
            <div className="flex-shrink-0 bg-red-100 p-2 rounded-md mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-600"
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
            <div>
              <p className="text-sm font-medium text-gray-800image.png">
                Alert: High System Load
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Backend server utilization at 82%
              </p>
            </div>
            <div className="ml-auto text-xs text-gray-500">12 hours ago</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Administrative Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/users"
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Manage Users
              </h3>
              <p className="text-xs text-gray-500">
                Add, edit, or remove system users
              </p>
            </div>
          </Link>

          <Link
            to="/system/logs"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">System Logs</h3>
              <p className="text-xs text-gray-500">
                View activity and error logs
              </p>
            </div>
          </Link>

          <Link
            to="/settings"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                System Settings
              </h3>
              <p className="text-xs text-gray-500">
                Configure application settings
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
