import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";
import MedicationForm from "~/components/MedicationForm";
import {
  medicationService,
  MedicationFormData,
} from "~/services/medication.service";
import { drugService } from "~/services/drug.service";
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
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState({
    brandName: "",
    genericName: "",
    dosage: "",
    frequency: "",
    instructions: "",
    reminders: [{ time: "09:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check for drugId in URL params to prefill form
  useEffect(() => {
    const prefillDrugId = searchParams.get("prefill");
    
    if (prefillDrugId) {
      setIsLoading(true);
      fetchDrugDetails(prefillDrugId);
    }
  }, [searchParams]);

  // Fetch drug details for prefilling the form
  const fetchDrugDetails = async (drugId: string) => {
    try {
      const response = await drugService.getDrugById(drugId);
      
      if (response.success && response.data) {
        const drug = response.data;
        
        setInitialValues({
          brandName: drug.brandName || "",
          genericName: drug.genericName || "",
          dosage: drug.dosage && drug.dosage.length > 0 ? drug.dosage[0] : "",
          frequency: "",
          instructions: drug.instructions || "",
          reminders: [{ time: "09:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }],
        });
      }
    } catch (err) {
      console.error("Error fetching drug details:", err);
      setError("Failed to load medication details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: FormattedMedication) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Convert the form data to the format expected by the API
      const medicationData: MedicationFormData = {
        drugId: searchParams.get("prefill") || "", // Set drugId from URL param
        brandName: formData.brandName,
        genericName: formData.genericName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions,
        startDate: formData.startDate
          ? new Date(formData.startDate)
          : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        // Set the first dose time from the first reminder
        firstDoseTime: formData.reminders[0]?.time 
          ? new Date(`${formData.startDate || new Date().toISOString().split('T')[0]}T${formData.reminders[0].time}`)
          : undefined
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <MedicationForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            initialValues={initialValues}
          />
        )}
      </div>
    </div>
  );
}
