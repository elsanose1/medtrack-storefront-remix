import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "@remix-run/react";
import { medicationService, Medication } from "~/services/medication.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Medication Details - MedTrack" }];
};

export default function MedicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [reminderHistory, setReminderHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMedicationDetail = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await medicationService.getMedicationById(id);
        if (response.success) {
          setMedication(response.data);

          // Fetch upcoming reminders for this medication
          const upcomingResponse =
            await medicationService.getMedicationReminders(id, "upcoming");
          if (upcomingResponse.success) {
            setUpcomingReminders(upcomingResponse.data);
          }

          // Fetch reminder history for this medication
          const historyResponse =
            await medicationService.getMedicationReminders(id, "history");
          if (historyResponse.success) {
            setReminderHistory(historyResponse.data);
          }
        } else {
          setError("Failed to load medication details");
        }
      } catch (err) {
        console.error("Error fetching medication details:", err);
        setError("Failed to load medication details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicationDetail();
  }, [id]);

  const handleDeleteMedication = async () => {
    if (!id) return;

    if (window.confirm("Are you sure you want to delete this medication?")) {
      try {
        const response = await medicationService.deleteMedication(id);
        if (response.success) {
          navigate("/medications");
        } else {
          setError("Failed to delete medication");
        }
      } catch (err) {
        console.error("Error deleting medication:", err);
        setError("Failed to delete medication");
      }
    }
  };

  const triggerTestReminder = async (reminderId: string) => {
    if (!id) return;

    try {
      await medicationService.triggerTestReminder(id, reminderId);
    } catch (err) {
      console.error("Error triggering test reminder:", err);
      setError("Failed to trigger test reminder");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medication details...</p>
        </div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-gray-800">
            Medication not found
          </h2>
          <p className="mt-2 text-gray-600">
            The medication you're looking for could not be found.
          </p>
          <div className="mt-6">
            <Link
              to="/medications"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
              Back to Medications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      {/* Medication Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {medication.brandName}
          </h1>
          <div className="flex space-x-2">
            <Link
              to={`/medications/${id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Edit
            </Link>
            <button
              onClick={handleDeleteMedication}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Brand Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {medication.brandName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Generic Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {medication.genericName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dosage</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {medication.dosage}
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {medication.frequency}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      medication.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                    {medication.active ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Instructions
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {medication.instructions}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Upcoming Reminders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Upcoming Reminders
        </h2>
        {upcomingReminders.length > 0 ? (
          <div className="space-y-4">
            {upcomingReminders.map((reminder, index) => (
              <div
                key={reminder._id || index}
                className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm text-gray-800">
                    {new Date(reminder.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(reminder.time).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() =>
                    reminder._id && triggerTestReminder(reminder._id)
                  }
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded">
                  Test
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No upcoming reminders</p>
          </div>
        )}
      </div>

      {/* Reminder History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Reminder History
        </h2>
        {reminderHistory.length > 0 ? (
          <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reminderHistory.map((reminder, index) => (
                  <tr key={reminder._id || index}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                      {new Date(reminder.time).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          reminder.status === "taken"
                            ? "bg-green-100 text-green-800"
                            : reminder.status === "missed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {reminder.status === "taken"
                          ? "Taken"
                          : reminder.status === "missed"
                          ? "Missed"
                          : "Snoozed"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {reminder.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No reminder history</p>
          </div>
        )}
      </div>
    </div>
  );
}
