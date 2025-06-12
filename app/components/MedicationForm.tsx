import { useState, useEffect } from "react";
import { drugService } from "~/services/drug.service";

// Medication frequency enum
enum MedicationFrequency {
  ONCE = "once",
  DAILY = "daily",
  TWICE_DAILY = "twice_daily",
  THREE_TIMES_DAILY = "three_times_daily",
  FOUR_TIMES_DAILY = "four_times_daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  AS_NEEDED = "as_needed",
}

// Human-readable frequency labels
const frequencyLabels: Record<MedicationFrequency, string> = {
  [MedicationFrequency.ONCE]: "Once",
  [MedicationFrequency.DAILY]: "Daily",
  [MedicationFrequency.TWICE_DAILY]: "Twice Daily",
  [MedicationFrequency.THREE_TIMES_DAILY]: "Three Times Daily",
  [MedicationFrequency.FOUR_TIMES_DAILY]: "Four Times Daily",
  [MedicationFrequency.WEEKLY]: "Weekly",
  [MedicationFrequency.MONTHLY]: "Monthly",
  [MedicationFrequency.AS_NEEDED]: "As Needed",
};

interface Drug {
  _id: string;
  brandName: string;
  genericName?: string;
}

interface MedicationFormProps {
  initialValues?: {
    brandName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    startDate?: string;
    endDate?: string;
    reminders: {
      time: string; // HH:MM format
      daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
    }[];
  };
  onSubmit: (values: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export default function MedicationForm({
  initialValues = {
    brandName: "",
    genericName: "",
    dosage: "",
    frequency: "",
    instructions: "",
    startDate: "",
    endDate: "",
    reminders: [{ time: "09:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }],
  },
  onSubmit,
  isSubmitting,
}: MedicationFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle drug search
  const handleDrugSearch = async () => {
    if (drugSearchQuery.trim().length < 2) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const result = await drugService.searchDrugsByBrandName(drugSearchQuery);
      if (result.success) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching drugs:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle drug selection from search results
  const handleDrugSelect = (drug: any) => {
    setValues({
      ...values,
      brandName: drug.brandName,
      genericName: drug.genericName || "",
    });
    setShowSearchResults(false);
    setDrugSearchQuery("");
  };

  // Handle reminder changes
  const handleReminderChange = (index: number, field: string, value: any) => {
    const updatedReminders = [...values.reminders];
    updatedReminders[index] = {
      ...updatedReminders[index],
      [field]: value,
    };
    setValues({ ...values, reminders: updatedReminders });
  };

  // Handle day of week selection
  const handleDayToggle = (reminderIndex: number, dayIndex: number) => {
    const updatedReminders = [...values.reminders];
    const currentDays = updatedReminders[reminderIndex].daysOfWeek;

    if (currentDays.includes(dayIndex)) {
      // Remove day if already selected
      updatedReminders[reminderIndex].daysOfWeek = currentDays.filter(
        (day) => day !== dayIndex
      );
    } else {
      // Add day if not selected
      updatedReminders[reminderIndex].daysOfWeek = [
        ...currentDays,
        dayIndex,
      ].sort();
    }

    setValues({ ...values, reminders: updatedReminders });
  };

  // Add a new reminder
  const addReminder = () => {
    setValues({
      ...values,
      reminders: [
        ...values.reminders,
        { time: "09:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      ],
    });
  };

  // Remove a reminder
  const removeReminder = (index: number) => {
    if (values.reminders.length <= 1) return; // Keep at least one reminder

    const updatedReminders = [...values.reminders];
    updatedReminders.splice(index, 1);
    setValues({ ...values, reminders: updatedReminders });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!values.brandName.trim()) {
      newErrors.brandName = "Medication name is required";
    }

    if (!values.dosage.trim()) {
      newErrors.dosage = "Dosage is required";
    }

    if (!values.frequency.trim()) {
      newErrors.frequency = "Frequency is required";
    }

    if (values.startDate && values.endDate) {
      const start = new Date(values.startDate);
      const end = new Date(values.endDate);
      if (end < start) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    // Check that at least one reminder has at least one day selected
    const hasValidReminder = values.reminders.some(
      (reminder) => reminder.daysOfWeek.length > 0
    );

    if (!hasValidReminder) {
      newErrors.reminders =
        "At least one reminder with selected days is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(values);
    }
  };

  // Drug search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (drugSearchQuery.trim().length >= 2) {
        handleDrugSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [drugSearchQuery]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Medication Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="brandName"
            className="block text-sm font-medium text-gray-700 mb-1">
            Brand Name*
          </label>
          <input
            type="text"
            id="brandName"
            name="brandName"
            value={values.brandName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.brandName ? "border-red-500" : "border-gray-300"
            } bg-white text-gray-900`}
          />
          {errors.brandName && (
            <p className="mt-1 text-sm text-red-600">{errors.brandName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="genericName"
            className="block text-sm font-medium text-gray-700 mb-1">
            Generic Name
          </label>
          <input
            type="text"
            id="genericName"
            name="genericName"
            value={values.genericName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="dosage"
            className="block text-sm font-medium text-gray-700 mb-1">
            Dosage*
          </label>
          <input
            type="text"
            id="dosage"
            name="dosage"
            value={values.dosage}
            onChange={handleChange}
            placeholder="e.g. 10mg tablet"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.dosage ? "border-red-500" : "border-gray-300"
            } bg-white text-gray-900`}
          />
          {errors.dosage && (
            <p className="mt-1 text-sm text-red-600">{errors.dosage}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="frequency"
            className="block text-sm font-medium text-gray-700 mb-1">
            Frequency*
          </label>
          <select
            id="frequency"
            name="frequency"
            value={values.frequency}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.frequency ? "border-red-500" : "border-gray-300"
            } bg-white text-gray-900`}>
            <option value="">Select frequency</option>
            {Object.values(MedicationFrequency).map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequencyLabels[frequency as MedicationFrequency]}
              </option>
            ))}
          </select>
          {errors.frequency && (
            <p className="mt-1 text-sm text-red-600">{errors.frequency}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={values.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300  bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={values.endDate}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.endDate ? "border-red-500" : "border-gray-300"
            } bg-white text-gray-900`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Reminders Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Reminders</h2>
          <button
            type="button"
            onClick={addReminder}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Reminder
          </button>
        </div>

        {errors.reminders && (
          <p className="mb-4 text-sm text-red-600">{errors.reminders}</p>
        )}

        <div className="space-y-4">
          {values.reminders.map((reminder, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-700">
                  Reminder #{index + 1}
                </h3>
                {values.reminders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReminder(index)}
                    className="text-red-600 hover:text-red-800 text-sm">
                    Remove
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor={`reminder-time-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  id={`reminder-time-${index}`}
                  value={reminder.time}
                  onChange={(e) =>
                    handleReminderChange(index, "time", e.target.value)
                  }
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day, dayIndex) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(index, dayIndex)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          reminder.daysOfWeek.includes(dayIndex)
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}>
                        {day}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 bg-indigo-600 text-white font-medium rounded-md ${
            isSubmitting
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-indigo-700"
          }`}>
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            "Save Medication"
          )}
        </button>
      </div>
    </form>
  );
}
