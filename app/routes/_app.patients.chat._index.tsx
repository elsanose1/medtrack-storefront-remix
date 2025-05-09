import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { authService } from "~/services/auth.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Patient Chat - MedTrack" }];
};

export default function PatientChatIndexPage() {
  const navigate = useNavigate();

  // Check if user is a pharmacy
  useEffect(() => {
    const userInfo = authService.getUserInfo();
    if (!userInfo || userInfo.userType !== "pharmacy") {
      // Redirect non-pharmacy users to the dashboard
      navigate("/dashboard");
      return;
    }

    // Redirect to the patients list
    navigate("/patients");
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}
