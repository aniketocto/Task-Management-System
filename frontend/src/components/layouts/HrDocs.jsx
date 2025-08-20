import { useEffect, useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";

const HrDocs = () => {
  const [docs, setDocs] = useState(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.INTERVIEW.GET_DOCS); // adjust endpoint
       setDocs(res.data);

       console.log("Fetched HR Docs:", res.data); // Debugging log
      } catch (err) {
        console.error("Error fetching docs:", err);
      }
    };
    fetchDocs();
  }, []);

  if (!docs) return <p className="text-gray-500">Loading...</p>;

  // Define fields dynamically
  const fields = [
    { key: "recruitmentReport", label: "Recruitment Report" },
    { key: "onBoarding", label: "Onboarding" },
    { key: "offBoarding", label: "Offboarding" },
    { key: "evalution", label: "Evaluation" },
    { key: "appraisal", label: "Appraisal" },
    { key: "hrPolicies", label: "HR Policies" },
    { key: "hrProcess", label: "HR Process" },
    { key: "hrTraining", label: "HR Training" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">HR Documents</h2>
      <div className="space-y-3">
        {fields.map(
          ({ key, label }) =>
            docs[key] && (
              <a
                key={key}
                href={docs[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <FaFileAlt className="text-xl text-gray-700" />
                <span>{label}</span>
              </a>
            )
        )}
      </div>
    </div>
  );
};

export default HrDocs;
