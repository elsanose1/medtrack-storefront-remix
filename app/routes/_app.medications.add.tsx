import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import MedicationForm from "~/components/MedicationForm";
import {
  medicationService,
  MedicationFormData,
} from "~/services/medication.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Add Medication - MedTrack" }];
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

export default function AddMedicationPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormattedMedication) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Convert the form data to the format expected by the API
      const medicationData: MedicationFormData = {
        drugId: "", // This would need to be set based on drug selection
        brandName: formData.brandName,
        genericName: formData.genericName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions,
        startDate: formData.startDate
          ? new Date(formData.startDate)
          : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        // Reminder times would be processed by the backend
      };

      const response = await medicationService.addMedication(medicationData);
      if (response.success) {
        navigate("/medications");
      } else {
        setError(response.message || "Failed to add medication");
      }
    } catch (err) {
      console.error("Error adding medication:", err);
      setError("An error occurred while adding the medication");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Add New Medication
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <MedicationForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialValues={{
            brandName: "",
            genericName: "",
            dosage: "",
            frequency: "",
            instructions: "",
            reminders: [{ time: "09:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }],
          }}
        />
      </div>
    </div>
  );
}
