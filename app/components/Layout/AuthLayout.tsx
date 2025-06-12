import { Link, Outlet, useNavigate, useLocation } from "@remix-run/react";
import { useEffect, useState, ReactNode } from "react";
import { authService } from "~/services/auth.service";
import { socketService } from "~/services/socket.service";

interface AuthLayoutProps {
  children?: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState<string>("");
  const [userType, setUserType] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Get user info from token
    const userInfo = authService.getUserInfo();
    if (userInfo) {
      setUsername(userInfo.username);
      setUserType(userInfo.userType);
    }

    // Initialize socket connection
    socketService.initializeSocket();

    // Cleanup socket connection on unmount
    return () => {
      socketService.disconnectSocket();
    };
  }, [navigate]);

  const handleLogout = () => {
    socketService.disconnectSocket();
    authService.logout();
    navigate("/login");
  };

  // Check if a link is active
  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Navigation Header */}
      <header className="bg-blue-800 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                  <img src="../../../public/logo.png" alt="Med-Track" className="w-18 h-12 flex items-center justify-center " />
                <span className="text-xl font-bold text-white">
                  Med-Track
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/dashboard")
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-white hover:bg-gray-100 hover:text-gray-900"
                } transition-colors`}>
                Dashboard
              </Link>

              {userType === "patient" && (
                <Link
                  to="/medications"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/medications")
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-white hover:bg-gray-100 hover:text-gray-900"
                  } transition-colors`}>
                  Medications
                </Link>
              )}
              {userType === "patient" && (
                <Link
                  to="/reminders"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/reminders")
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-white hover:bg-gray-100 hover:text-gray-900"
                  } transition-colors`}>
                  Reminders
                </Link>
              )}
              <Link
                to="/drugs"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/drugs")
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-white hover:bg-gray-100 hover:text-gray-900"
                } transition-colors`}>
                Drug Library
              </Link>
              {/* Patient link for users of type pharmacy */}
              {userType === "pharmacy" && (
                <Link
                  to="/patients"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/patients")
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-white hover:bg-gray-100 hover:text-gray-900"
                  } transition-colors`}>
                  Patients
                </Link>
              )}
              {/* Pharmacies link for non-pharmacy users (patients) */}
              {userType !== "pharmacy" && (
                <Link
                  to="/pharmacies"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/pharmacies")
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-white hover:bg-gray-100 hover:text-gray-900"
                  } transition-colors`}>
                  Pharmacies
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center">
              <div className="mr-3 hidden md:block">
                <span className="text-sm text-white">Hello, </span>
                <span className="text-sm font-medium text-white">
                  {username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
        <div className="flex justify-center items-center px-2">
          <div className="grid grid-cols-5 gap-1 w-full max-w-md">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center py-2 px-1 ${
                isActive("/dashboard")
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
              }`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 mb-1">
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198c.031-.028.062-.056.091-.086L12 5.43z" />
              </svg>
              <span className="text-xs">Home</span>
            </Link>

            {userType === "patient" && (
              <Link
                to="/medications"
                className={`flex flex-col items-center justify-center py-2 px-1 ${
                  isActive("/medications")
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-indigo-500"
                }`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 mb-1">
                  <path
                    fillRule="evenodd"
                    d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Meds</span>
              </Link>
            )}

            {userType === "patient" && (
              <Link
                to="/reminders"
                className={`flex flex-col items-center justify-center py-2 px-1 ${
                  isActive("/reminders")
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-indigo-500"
                }`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 mb-1">
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Reminders</span>
              </Link>
            )}

            <Link
              to="/drugs"
              className={`flex flex-col items-center justify-center py-2 px-1 ${
                isActive("/drugs")
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
              }`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 mb-1">
                <path
                  fillRule="evenodd"
                  d="M12.786 1.072C11.188.752 9.084.71 7.646 2.146A.75.75 0 007.179 3h9.642a.75.75 0 00-.465-.928A4.883 4.883 0 0012.786 1.072zM10.5 5.25H9a.75.75 0 000 1.5h1.5v9a.75.75 0 001.5 0v-9H13.5a.75.75 0 000-1.5h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs">Drugs</span>
            </Link>

            {userType === "pharmacy" ? (
              <Link
                to="/patients"
                className={`flex flex-col items-center justify-center py-2 px-1 ${
                  isActive("/patients")
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-indigo-500"
                }`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 mb-1">
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Patients</span>
              </Link>
            ) : (
              <Link
                to="/pharmacies"
                className={`flex flex-col items-center justify-center py-2 px-1 ${
                  isActive("/pharmacies")
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-indigo-500"
                }`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 mb-1">
                  <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 007.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 004.902-5.652l-1.3-1.299a1.875 1.875 0 00-1.325-.549H5.223z" />
                  <path
                    fillRule="evenodd"
                    d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 009.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 002.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3zm3-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-3zm8.25-.75a.75.75 0 00-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-5.25a.75.75 0 00-.75-.75h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Pharmacy</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
