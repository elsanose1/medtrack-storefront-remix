import PharmacyList from "~/components/Chat/PharmacyList";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Pharmacies - MedTrack" }];
};

export default function PharmaciesPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Pharmacies</h1>
        <p className="mt-2 text-sm text-gray-500">
          Find and chat with verified pharmacies for medication support and
          questions.
        </p>
      </div>

      <PharmacyList />
    </div>
  );
}
