import { useState, useEffect } from "react";
import { socketService } from "~/services/socket.service";
import { authService } from "~/services/auth.service";
import { medicationService, Medication } from "~/services/medication.service";

export default function PatientPharmacistAttentionPopup() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [selectedDrugId, setSelectedDrugId] = useState<string>("");
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSent, setPopupSent] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [popupResponse, setPopupResponse] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    if (open) {
      // Fetch medications when popup opens
      medicationService.getPatientMedications().then((result) => {
        if (result.success) setMedications(result.data);
      });
    }
  }, [open]);

  useEffect(() => {
    const handlePopupResponse = (data: { response: string }) => {
      setPopupResponse(data.response);
      setOpen(true);
    };
    socketService.setupPopupResponseListener(handlePopupResponse);
    return () => {
      socketService.removePopupResponseListener();
    };
  }, []);

  const handleSend = () => {
    const user = authService.getUserInfo();
    if (!user) {
      setPopupError("You must be logged in to request a drug.");
      return;
    }
    if (!note.trim()) {
      setPopupError("Please enter a note for the pharmacist.");
      return;
    }
    if (!selectedDrugId) {
      setPopupError("Please select a medication.");
      return;
    }
    setPopupLoading(true);
    setPopupError("");
    console.log(selectedDrugId);

    socketService.emitPatientPopupRequest({
      userId: user._id,
      drugId: selectedDrugId,
      note,
    });
    setPopupSent(true);
    setPopupLoading(false);
  };

  const handleClose = () => {
    setOpen(false);
    setNote("");
    setSelectedDrugId("");
    setPopupSent(false);
    setPopupError("");
    setPopupResponse(null);
  };

  console.log({ medications });

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setOpen(true)}
        aria-label="Request Drug"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </button>

      {/* Popup Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={handleClose}
              aria-label="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              Request Drug
            </h2>
            {popupResponse && (
              <div className="bg-green-100 text-green-800 rounded p-3 mb-2">
                Pharmacist Response: {popupResponse}
              </div>
            )}
            {popupSent && !popupResponse ? (
              <div className="bg-green-100 text-green-800 rounded p-3 mb-2">
                Request sent! A pharmacist will be notified.
              </div>
            ) : !popupSent && !popupResponse ? (
              <>
                <label
                  htmlFor="popup-note"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Note for Pharmacist:
                </label>
                <textarea
                  id="popup-note"
                  className="border border-blue-300 rounded px-3 py-2 text-sm w-full mb-2"
                  placeholder="Enter your note or question"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={popupLoading}
                  rows={3}
                />
                <label
                  htmlFor="popup-drug"
                  className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                  Medication <span className="text-red-500">*</span>:
                </label>
                <select
                  id="popup-drug"
                  className="border border-blue-300 rounded px-3 py-2 text-sm w-full mb-2"
                  value={selectedDrugId}
                  onChange={(e) => setSelectedDrugId(e.target.value)}
                  disabled={popupLoading || medications.length === 0}
                  required>
                  <option value="">-- Select Medication --</option>
                  {medications.map((med) => (
                    <option key={med.drugId} value={med.drugId}>
                      {med.brandName}
                    </option>
                  ))}
                </select>
                {popupError && (
                  <div className="text-red-600 text-sm mb-2">{popupError}</div>
                )}
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm w-full"
                  disabled={popupLoading || !note.trim() || !selectedDrugId}>
                  {popupLoading ? "Sending..." : "Request Drug"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
