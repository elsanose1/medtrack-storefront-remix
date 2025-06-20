import { useState, FormEvent } from "react";
import { useNavigate } from "@remix-run/react";
import { authService } from "~/services/auth.service";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    const result = await authService.changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (result.success) {
      setSuccess(result.message);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Redirect back to profile after 2 seconds
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2 py-8 overflow-y-auto">
      <div className="relative w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-10">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
          <p className="mt-1 text-sm text-gray-600">Update your account password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <div className="mt-1">
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentPassword: e.target.value,
                  })
                }
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1">
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newPassword: e.target.value,
                  })
                }
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {success}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 