import { useState, useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import { authService } from "~/services/auth.service";
import { socketService } from "~/services/socket.service";
import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-100 min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check authentication status when app loads or route changes
    const checkAuth = () => {
      try {
        const isAuth = authService.isAuthenticated();
        const isAuthRoute = ["/login", "/register", "/"].includes(
          location.pathname
        );

        // Only initialize once
        if (!isInitialized) {
          // If user is authenticated, setup socket connection
          if (isAuth) {
            try {
              socketService.initializeSocket();
            } catch (socketError) {
              console.error("Error initializing socket:", socketError);
            }
          }
          setIsInitialized(true);
        }

        // Handle redirects based on auth status
        if (!isAuth && !isAuthRoute) {
          // Redirect to login if not authenticated and trying to access protected route
          navigate("/login");
        } else if (isAuth && location.pathname === "/login") {
          // Redirect to dashboard if already authenticated and trying to access login
          navigate("/dashboard");
        }
      } catch (authError) {
        console.error("Error in auth check:", authError);
        // If there's an auth error, treat as not authenticated
        if (!["/login", "/register", "/"].includes(location.pathname)) {
          navigate("/login");
        }
      }
    };

    checkAuth();
  }, [location.pathname, navigate, isInitialized]);

  // Clean up socket connection when app unmounts
  useEffect(() => {
    return () => {
      try {
        if (authService.isAuthenticated()) {
          socketService.disconnectSocket();
        }
      } catch (error) {
        console.error("Error disconnecting socket:", error);
      }
    };
  }, []);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// Error boundary
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Error!</title>
      </head>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Application Error
            </h1>
            <p className="text-gray-700 mb-4">
              An unexpected error occurred. Please try again later.
            </p>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto">
              <pre className="text-sm text-gray-800">
                {error?.message || "Unknown error occurred"}
              </pre>
            </div>
            <div className="mt-6">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                Go to Home
              </button>
            </div>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
