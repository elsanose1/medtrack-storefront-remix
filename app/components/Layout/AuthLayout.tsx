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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">
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
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                } transition-colors`}>
                Dashboard
              </Link>
              <Link
                to="/medications"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/medications")
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                } transition-colors`}>
                Medications
              </Link>
              <Link
                to="/reminders"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/reminders")
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                } transition-colors`}>
                Reminders
              </Link>
              <Link
                to="/drugs"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/drugs")
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                } transition-colors`}>
                Drug Library
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center">
              <div className="mr-3 hidden md:block">
                <span className="text-sm text-gray-500">Hello, </span>
                <span className="text-sm font-medium text-gray-900">
                  {username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Logout
              </button>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden ml-2 bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden ${
          mobileMenuOpen ? "block" : "hidden"
        } bg-white border-b border-gray-200`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/dashboard")
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            } transition-colors`}
            onClick={() => setMobileMenuOpen(false)}>
            Dashboard
          </Link>
          <Link
            to="/medications"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/medications")
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            } transition-colors`}
            onClick={() => setMobileMenuOpen(false)}>
            Medications
          </Link>
          <Link
            to="/reminders"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/reminders")
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            } transition-colors`}
            onClick={() => setMobileMenuOpen(false)}>
            Reminders
          </Link>
          <Link
            to="/drugs"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/drugs")
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            } transition-colors`}
            onClick={() => setMobileMenuOpen(false)}>
            Drug Library
          </Link>
          <div className="px-3 py-2 text-sm text-gray-500">
            Logged in as{" "}
            <span className="font-medium text-gray-900">{username}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children || <Outlet />}
      </main>
    </div>
  );
}
