import { useEffect, useState } from "react";
import { authService } from "~/services/auth.service";
import type { MetaFunction } from "@remix-run/node";
import PatientDashboard from "~/components/Dashboard/PatientDashboard";
import PharmacyDashboard from "~/components/Dashboard/PharmacyDashboard";
import AdminDashboard from "~/components/Dashboard/AdminDashboard";

export const meta: MetaFunction = () => {
  return [{ title: "Dashboard - MedTrack" }];
};

interface UserInfo {
  id: string;
  email: string;
  username: string;
  userType: string;
  firstName: string;
  lastName: string;
}

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const info = authService.getUserInfo();
    setUserInfo(info);
    setIsLoading(false);
  }, []);

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

  if (!userInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600">User not found.</p>
        </div>
      </div>
    );
  }

  if (userInfo.userType === "patient") {
    return <PatientDashboard userInfo={userInfo} />;
  }
  if (userInfo.userType === "pharmacy") {
    return <PharmacyDashboard userInfo={userInfo} />;
  }
  if (userInfo.userType === "admin") {
    return <AdminDashboard userInfo={userInfo} />;
  }

  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <p className="text-gray-600">Unknown user type.</p>
      </div>
    </div>
  );
}
