import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import {
  medicationService,
  Medication,
  MedicationFormData,
} from "~/services/medication.service";
import MedicationForm from "~/components/MedicationForm";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Edit Medication - MedTrack" }];
};

interface FormattedMedication {
  brandName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  reminders: {
    time: string;
    daysOfWeek: number[];
  }[];
}

export default function EditMedicationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medication, setMedication] = useState<FormattedMedication | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMedication = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await medicationService.getMedicationById(id);
        if (response.success) {
          // Format the medication data to match the form structure
          const med = response.data;

          // Create default reminders structure if none exists
          const formattedReminders = med.reminders?.length
            ? med.reminders.map((reminder) => ({
                time: new Date(reminder.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }),
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Default to all days since the actual days might not be in the data
              }))
            : [{ time: "09:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }];

          setMedication({
            brandName: med.brandName,
            genericName: med.genericName,
            dosage: med.dosage,
            frequency: med.frequency,
            instructions: med.instructions,
            startDate: med.startDate
              ? new Date(med.startDate).toISOString().split("T")[0]
              : undefined,
            endDate: med.endDate
              ? new Date(med.endDate).toISOString().split("T")[0]
              : undefined,
            reminders: formattedReminders,
          });
        } else {
          setError("Failed to load medication");
        }
      } catch (err) {
        console.error("Error fetching medication:", err);
        setError("Failed to load medication");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedication();
  }, [id]);

  const handleSubmit = async (formData: FormattedMedication) => {
    if (!id) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Convert the form data to the format expected by the API
      const medicationData: Partial<MedicationFormData> = {
        brandName: formData.brandName,
        genericName: formData.genericName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions,
        startDate: formData.startDate
          ? new Date(formData.startDate)
          : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        // Reminder data would be processed differently in the backend
      };

      const response = await medicationService.updateMedication(
        id,
        medicationData
      );
      if (response.success) {
        navigate(`/medications/${id}`);
      } else {
        setError(response.message || "Failed to update medication");
      }
    } catch (err) {
      console.error("Error updating medication:", err);
      setError("An error occurred while updating the medication");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medication...</p>
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
            The medication you&apos;re trying to edit could not be found.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/medications")}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
              Back to Medications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Edit Medication
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <MedicationForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialValues={medication}
        />
      </div>
    </div>
  );
}
