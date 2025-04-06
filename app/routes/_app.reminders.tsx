import { useEffect, useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import { medicationService } from "~/services/medication.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Reminders - MedTrack" }];
};

interface Reminder {
  _id: string;
  medicationId: string;
  medicationName: string;
  time: string;
  date: string;
  status: "active" | "snoozed" | "completed" | "missed";
  notes?: string;
}

interface GroupedReminders {
  [date: string]: Reminder[];
}

interface Medication {
  _id: string;
  brandName: string;
  dosage: string;
  reminders: {
    _id: string;
    time: string;
    status?: "active" | "snoozed" | "completed" | "missed";
    notes?: string;
  }[];
}

export default function RemindersPage() {
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [reminderHistory, setReminderHistory] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming"
  );
  const location = useLocation();

  useEffect(() => {
    const fetchReminders = async () => {
      setIsLoading(true);
      try {
        // Fetch upcoming reminders (next 7 days)
        const upcomingResponse = await medicationService.getUpcomingReminders(
          24 * 7
        );
        if (upcomingResponse.success) {
          // Process upcoming reminders
          const processed: Reminder[] = [];

          // Iterate through medications
          upcomingResponse.data.forEach((med: Medication) => {
            // Process each reminder
            if (med.reminders && Array.isArray(med.reminders)) {
              med.reminders.forEach((reminder) => {
                processed.push({
                  _id: reminder._id,
                  medicationId: med._id,
                  medicationName: `${med.brandName} ${med.dosage}`,
                  time: reminder.time,
                  date: new Date(reminder.time).toLocaleDateString(),
                  status: reminder.status || "active",
                  notes: reminder.notes,
                });
              });
            }
          });

          setUpcomingReminders(processed);
        }

        // Fetch reminder history (can be implemented if backend supports it)
        // For now we'll use a mock empty array
        setReminderHistory([]);
      } catch (err) {
        console.error("Error fetching reminders:", err);
        setError("Failed to load reminders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
  }, []);

  // Group reminders by date
  const groupRemindersByDate = (reminders: Reminder[]): GroupedReminders => {
    return reminders.reduce((acc: GroupedReminders, reminder) => {
      const date = reminder.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(reminder);
      return acc;
    }, {});
  };

  const groupedUpcomingReminders = groupRemindersByDate(upcomingReminders);
  const groupedHistoryReminders = groupRemindersByDate(reminderHistory);

  const handleTriggerTestReminder = async (
    medicationId: string,
    reminderId: string
  ) => {
    try {
      await medicationService.triggerTestReminder(medicationId, reminderId);
    } catch (err) {
      console.error("Error triggering test reminder:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Medication Reminders
        </h1>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              to="/medications"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === "/medications"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              All Medications
            </Link>
            <Link
              to="/reminders"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === "/reminders"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              Reminders
            </Link>
            <Link
              to="/drugs"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === "/drugs"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              Medication Database
            </Link>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Reminder Type Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === "upcoming"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              Upcoming Reminders
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`ml-8 py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              Reminder History
            </button>
          </nav>
        </div>

        {/* Upcoming Reminders Tab */}
        {activeTab === "upcoming" && (
          <div>
            {Object.keys(groupedUpcomingReminders).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedUpcomingReminders)
                  .sort(([dateA], [dateB]) => {
                    return (
                      new Date(dateA).getTime() - new Date(dateB).getTime()
                    );
                  })
                  .map(([date, reminders]) => (
                    <div key={date} className="space-y-2">
                      <h2 className="text-lg font-semibold text-gray-700">
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h2>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                          {reminders
                            .sort(
                              (a, b) =>
                                new Date(a.time).getTime() -
                                new Date(b.time).getTime()
                            )
                            .map((reminder) => (
                              <li
                                key={reminder._id}
                                className="px-4 py-3 flex justify-between items-center hover:bg-gray-100">
                                <div>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-gray-900">
                                      {new Date(
                                        reminder.time
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {reminder.medicationName}
                                    </span>
                                  </div>
                                  {reminder.notes && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {reminder.notes}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    handleTriggerTestReminder(
                                      reminder.medicationId,
                                      reminder._id
                                    )
                                  }
                                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded">
                                  Test
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-12 h-12 mx-auto text-gray-400">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-700">
                  No upcoming reminders
                </h3>
                <p className="mt-1 text-gray-500">
                  You don&apos;t have any upcoming medication reminders
                </p>
                <div className="mt-6">
                  <Link
                    to="/medications/add"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                    Add Medication
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            {Object.keys(groupedHistoryReminders).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedHistoryReminders)
                  .sort(([dateA], [dateB]) => {
                    return (
                      new Date(dateB).getTime() - new Date(dateA).getTime()
                    );
                  })
                  .map(([date, reminders]) => (
                    <div key={date} className="space-y-2">
                      <h2 className="text-lg font-semibold text-gray-700">
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h2>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                          {reminders.map((reminder) => (
                            <li
                              key={reminder._id}
                              className="px-4 py-3 hover:bg-gray-100">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium text-gray-900">
                                    {new Date(reminder.time).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                  <span className="font-medium text-gray-800">
                                    {reminder.medicationName}
                                  </span>
                                </div>
                                <span
                                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    reminder.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : reminder.status === "missed"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}>
                                  {reminder.status === "completed"
                                    ? "Taken"
                                    : reminder.status === "missed"
                                    ? "Missed"
                                    : "Snoozed"}
                                </span>
                              </div>
                              {reminder.notes && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {reminder.notes}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-12 h-12 mx-auto text-gray-400">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-700">
                  No reminder history
                </h3>
                <p className="mt-1 text-gray-500">
                  Your medication history will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/medications/add"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
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
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                Add Medication
              </h3>
              <p className="text-xs text-gray-500">
                Create a new medication with reminders
              </p>
            </div>
          </Link>
          <Link
            to="/medications"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 bg-blue-100 p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                View All Medications
              </h3>
              <p className="text-xs text-gray-500">
                Manage your medication inventory
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
