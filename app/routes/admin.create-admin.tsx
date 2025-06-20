import { useState } from "react";
import { adminService } from "~/services/admin.service";
import { Link } from "@remix-run/react";
import AuthLayout from "~/components/Layout/AuthLayout";
import type { AxiosError } from "axios";

export default function CreateAdminPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      await adminService.createAdmin(form);
      setSuccess("Admin account created successfully.");
      setForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(
        axiosError?.response?.data?.message || "Failed to create admin account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Create Admin Account
          </h1>
          <Link
            to="/dashboard"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Back to Dashboard
          </Link>
        </div>
        {success && (
          <div className="mb-4 text-center text-sm text-green-700 bg-green-100 rounded p-2">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 text-center text-sm text-red-700 bg-red-100 rounded p-2">
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 space-y-6 border border-gray-100">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-gray-700 font-medium mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 p-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Name fields in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-gray-700 font-medium mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 p-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-gray-700 font-medium mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 p-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="my-2 border-gray-200" />

          {/* Email and Phone fields in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 p-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-gray-700 font-medium mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="text"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 p-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="my-2 border-gray-200" />

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 p-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-gray-700 font-medium mb-1">
              Address
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 p-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {isLoading ? "Creating..." : "Create Admin"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
