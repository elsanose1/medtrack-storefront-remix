import { useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import { drugService, Drug } from "~/services/drug.service";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Medication Database - MedTrack" }];
};

interface DrugSearchResponse {
  success: boolean;
  data?: {
    results: Drug[];
  };
  message?: string;
}

interface DrugDetailsResponse {
  success: boolean;
  data?: Drug;
  message?: string;
}

export default function DrugsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [isDrugDetailsLoading, setIsDrugDetailsLoading] = useState(false);
  const location = useLocation();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError("");
    setSelectedDrug(null);

    try {
      const response = (await drugService.searchDrugsByBrandName(
        searchQuery
      )) as DrugSearchResponse;
      if (response && response.success && response.data) {
        setSearchResults(response.data.results || []);
        if (response.data.results.length === 0) {
          setError("No medications found matching your search");
        }
      } else {
        setError(response?.message || "Failed to search medications");
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching medications:", err);
      setError("An error occurred while searching");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrugSelect = (drugId: string) => {
    const drug = searchResults.find((drug) => drug.id === drugId);

    if (drug) {
      setSelectedDrug(drug);
    } else {
      fetchDrugDetails(drugId);
    }
  };

  const fetchDrugDetails = async (drugId: string) => {
    setIsDrugDetailsLoading(true);
    setError("");

    try {
      const response = (await drugService.getDrugById(
        drugId
      )) as DrugDetailsResponse;
      if (response && response.success && response.data) {
        setSelectedDrug(response.data);
      } else {
        setError(response?.message || "Failed to fetch drug details");
      }
    } catch (err) {
      console.error("Error fetching drug details:", err);
      setError("An error occurred while fetching drug details");
    } finally {
      setIsDrugDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Medication Database
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

        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="search" className="sr-only">
                Search medications
              </label>
              <input
                type="text"
                id="search"
                className="block w-full rounded-md border text-gray-900 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white placeholder:text-black"
                placeholder="Search by medication name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
            </div>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={handleSearch}
              disabled={isLoading}>
              {isLoading ? (
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
                  Searching...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Results */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              Search Results
            </h2>
            {searchResults.length > 0 ? (
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {searchResults.map((drug) => (
                    <li key={drug.id}>
                      <button
                        onClick={() => handleDrugSelect(drug.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                          selectedDrug?.id === drug.id ? "bg-indigo-50" : ""
                        }`}>
                        <div className="font-medium text-gray-900">
                          {drug.brandName}
                        </div>
                        {drug.genericName && (
                          <div className="text-sm text-gray-500">
                            {drug.genericName}
                          </div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {drug.route && drug.route.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {drug.route[0]}
                            </span>
                          )}
                          {drug.dosage && drug.dosage.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {drug.dosage[0]}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="rounded-full bg-gray-200 h-10 w-10 mx-auto"></div>
                    <div className="mt-4 h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="mt-2 h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-10 h-10 mx-auto text-gray-400">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No medications found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try searching for a medication name
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Drug Details */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              Medication Details
            </h2>
            {selectedDrug ? (
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedDrug.brandName}
                    </h3>
                    {selectedDrug.genericName && (
                      <p className="text-sm text-gray-500 mt-1">
                        Generic: {selectedDrug.genericName}
                      </p>
                    )}
                  </div>
                  {selectedDrug.route && selectedDrug.route.length > 0 && (
                    <span className="mt-2 sm:mt-0 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {selectedDrug.route[0]}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Medication Information
                    </h4>
                    <dl className="mt-2 border-t border-gray-200">
                      {selectedDrug.purpose &&
                        selectedDrug.purpose.length > 0 && (
                          <>
                            <div className="py-3 flex justify-between border-b border-gray-200">
                              <dt className="text-sm font-medium text-gray-500">
                                Purpose :{" "}
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {selectedDrug.purpose[0]}
                              </dd>
                            </div>
                          </>
                        )}
                      {selectedDrug.route && selectedDrug.route.length > 0 && (
                        <>
                          <div className="py-3 flex justify-between border-b border-gray-200">
                            <dt className="text-sm font-medium text-gray-500">
                              Route :{" "}
                            </dt>
                            <dd className="text-sm text-gray-900">
                              {selectedDrug.route[0]}
                            </dd>
                          </div>
                        </>
                      )}
                      {selectedDrug.manufacturer && (
                        <>
                          <div className="py-3 flex justify-between border-b border-gray-200">
                            <dt className="text-sm font-medium text-gray-500">
                              Manufacturer :{" "}
                            </dt>
                            <dd className="text-sm text-gray-900">
                              {selectedDrug.manufacturer}
                            </dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </div>

                  <div>
                    {selectedDrug.dosage && selectedDrug.dosage.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Dosage :{" "}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedDrug.dosage[0]}
                        </p>
                      </div>
                    )}

                    {selectedDrug.sideEffects &&
                      selectedDrug.sideEffects.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Potential Side Effects
                          </h4>
                          <ul className="list-disc pl-5 text-sm text-gray-600">
                            {selectedDrug.sideEffects.map((effect, index) => (
                              <li key={index}>{effect}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    to={`/medications/add?prefill=${selectedDrug.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Add This Medication to My List
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                {isDrugDetailsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
                    <div className="mt-4 h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="h-24 bg-gray-200 rounded"></div>
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <>
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
                        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                      />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Select a medication
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Search for a medication and select it to view detailed
                      information
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
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
            to="/reminders"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">
                View Reminders
              </h3>
              <p className="text-xs text-gray-500">
                Check your upcoming medication reminders
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
