import { useState } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { authService } from "~/services/auth.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Create Account - MedTrack" }];
};

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "PATIENT", // Default user type
    // Pharmacy-specific fields
    pharmacyName: "",
    licenseNumber: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    // Patient-specific fields
    dateOfBirth: "",
    medicalHistory: "",
    allergies: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific field error when the field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Pharmacy-specific validations
    if (formData.userType === "PHARMACY") {
      if (!formData.pharmacyName) {
        newErrors.pharmacyName = "Pharmacy name is required";
      }
      if (!formData.licenseNumber) {
        newErrors.licenseNumber = "License number is required";
      }
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
      }
      if (!formData.address) {
        newErrors.address = "Address is required";
      }
    }

    // Patient-specific validations
    if (formData.userType === "PATIENT") {
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setServerError("");
    setSuccessMessage("");

    try {
      // Create username from firstName and lastName
      const username = `${formData.firstName.toLowerCase()}-${formData.lastName.toLowerCase()}`;

      let result;

      if (formData.userType === "PATIENT") {
        // Extract patient-specific data
        const patientData = {
          username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userType: formData.userType.toLowerCase(),
          dateOfBirth: formData.dateOfBirth,
          medicalHistory: formData.medicalHistory || undefined,
          allergies: formData.allergies
            ? formData.allergies.split(",").map((a) => a.trim())
            : undefined,
        };

        result = await authService.register(patientData);
      } else if (formData.userType === "PHARMACY") {
        // Extract pharmacy-specific data
        const pharmacyData = {
          username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userType: formData.userType.toLowerCase(),
          pharmacyName: formData.pharmacyName,
          licenseNumber: formData.licenseNumber,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zip: formData.zip || undefined,
        };

        result = await authService.register(pharmacyData);
      } else {
        throw new Error("Invalid user type");
      }

      if (result.success) {
        setSuccessMessage("Registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setServerError(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setServerError("An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-neutral-50 p-8 rounded-lg shadow-md">
        <div className="text-center">
          <Link to="/" className="block">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
              <span className="text-blue-500">Med</span>Track
            </h1>
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-neutral-900">
            Create an Account
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Sign up to track your medications and receive reminders
          </p>
        </div>

        {serverError && (
          <div className="bg-error/10 text-error p-4 rounded-md">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="bg-success/10 text-success p-4 rounded-md">
            {successMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-neutral-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.firstName ? "border-error" : "border-neutral-300"
                } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-error">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-neutral-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.lastName ? "border-error" : "border-neutral-300"
                } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-error">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`appearance-none relative block w-full px-3 py-2 border ${
                errors.email ? "border-error" : "border-neutral-300"
              } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="userType"
              className="block text-sm font-medium text-neutral-700 mb-1">
              Account Type
            </label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500">
              <option value="PATIENT">Patient</option>
              <option value="PHARMACY">Pharmacy</option>
            </select>
          </div>

          {/* Conditional fields based on user type */}
          {formData.userType === "PHARMACY" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pharmacyName"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Pharmacy Name
                </label>
                <input
                  id="pharmacyName"
                  name="pharmacyName"
                  type="text"
                  value={formData.pharmacyName}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.pharmacyName ? "border-error" : "border-neutral-300"
                  } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.pharmacyName && (
                  <p className="mt-1 text-sm text-error">
                    {errors.pharmacyName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="licenseNumber"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  License Number
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.licenseNumber ? "border-error" : "border-neutral-300"
                  } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-sm text-error">
                    {errors.licenseNumber}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.phoneNumber ? "border-error" : "border-neutral-300"
                  } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-error">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.address ? "border-error" : "border-neutral-300"
                  } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-error">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-neutral-700 mb-1">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-neutral-700 mb-1">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="zip"
                    className="block text-sm font-medium text-neutral-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    id="zip"
                    name="zip"
                    type="text"
                    value={formData.zip}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
                <p className="text-sm text-yellow-700">
                  Note: Your pharmacy account will need to be verified by an
                  administrator before you can fully access all features.
                </p>
              </div>
            </div>
          )}

          {formData.userType === "PATIENT" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.dateOfBirth ? "border-error" : "border-neutral-300"
                  } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-error">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="medicalHistory"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Medical History
                </label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  rows={3}
                  className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="allergies"
                  className="block text-sm font-medium text-neutral-700 mb-1">
                  Allergies (comma separated)
                </label>
                <input
                  id="allergies"
                  name="allergies"
                  type="text"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g. Penicillin, Peanuts, Latex"
                  className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}

          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1">
              Password*
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? "border-error" : "border-neutral-300"
                } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-error">{errors.password}</p>
            )}
          </div>

          <div className="relative">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-neutral-700 mb-1">
              Confirm Password*
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? "border-error" : "border-neutral-300"
                } bg-neutral-50 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSubmitting
                  ? "bg-blue-400"
                  : "bg-blue-500 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}>
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>
          </div>

          <div className="text-center text-sm">
            <p className="text-neutral-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-500 hover:text-primary-700">
                Sign in
              </Link>
            </p>
            <p className="mt-2 text-neutral-600">
              <Link
                to="/"
                className="font-medium text-blue-500 hover:text-primary-700">
                ← Back to Home
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
