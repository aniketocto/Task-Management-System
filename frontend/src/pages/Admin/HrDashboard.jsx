import DashboardLayout from "components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import React, { useContext, useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SpinLoader from "../../components/layouts/SpinLoader";
import Modal from "components/layouts/Modal";
import Input from "components/Inputs/Input";
import SelectOption from "components/Inputs/SelectOption";
import { interviewStatus } from "../../utils/data";
import SelectUsers from "components/Inputs/SelectUsers";
import toast from "react-hot-toast";
import AvatarGroup from "components/layouts/AvatarGroup";

const HrDashboard = () => {
  const { user } = useContext(UserContext);
  const [interviews, setInterviews] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [openingOptions, setOpeningOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    axiosInstance
      .get(API_PATHS.USERS.GET_ALL_USERS)
      .then((res) => setAllUsers(res.data || []))
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const [openInterviewModal, setOpenInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    opening: "",
    candidateName: "",
    startTime: "",
    rounds: 1,
    interviewers: [],
    status: "scheduled",
  });

  const clearInterviewData = () => {
    setInterviewForm({
      opening: "",
      candidateName: "",
      startTime: "",
      rounds: 1,
      interviewers: [],
      status: "scheduled",
    });
  };

  const handleValueChange = (key, value) => {
    setInterviewForm((prevData) => ({ ...prevData, [key]: value }));
  };

  const getInterviews = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.INTERVIEW.GET_ALL_INTERVIEWS
      );
      setInterviews(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const createInterview = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        API_PATHS.INTERVIEW.CREATE_INTERVIEW,
        interviewForm
      );
      if (response) {
        clearInterviewData();
        setOpenInterviewModal(false);
        getInterviews(); // Refresh the interview list
      }
      console.log("Interview created successfully:", interviewForm);
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview. Please fill all fields.");
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateInterview = async (interviewId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(
        API_PATHS.INTERVIEW.UPDATE_INTERVIEW(interviewId),
        interviewForm
      );
      if (response) {
        clearInterviewData();
        setEditingInterviewId(null); // reset mode
        setOpenInterviewModal(false);
        getInterviews(); // refresh
      }
      toast.success("Interview updated successfully");
    } catch (error) {
      console.error("Error updating interview:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOpenings = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.INTERVIEW.GET_OPENINGS
      );
      setOpenings(response.data?.data || []);
      setOpeningOptions(
        response.data?.data.map((opening) => ({
          value: opening.title,
          label: opening.title,
        })) || []
      );
      console.log(openingOptions);
    } catch (error) {
      console.error("Error fetching openings:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInterviews();
    getOpenings();
  }, []);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="card my-5">
        {loading && <SpinLoader />}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-200">
            <thead>
              <tr className="text-left border-b border-white/20">
                <th className="py-2 pr-4">Candidate</th>
                <th className="py-2 pr-4">Opening</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">Rounds</th>
                <th className="py-2 pr-4">Status</th>
                {/* <th className="py-2 pr-4"> Assigned to</th> */}
                <th className="py-2 pr-4"> Action</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview._id} className="border-b border-white/20">
                  <td className="py-2 pr-4">{interview.candidateName}</td>
                  <td className="py-2 pr-4">{interview.opening}</td>
                  <td className="py-2 pr-4">
                    {new Date(interview.startTime).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{interview.rounds}</td>
                  <td className="py-2 pr-4">{interview.status}</td>
                  {/* <td className="py-2 pr-4">
                    <AvatarGroup
                      avatars={
                        interview.interviewers?.map((u) => ({
                          name: u.name,
                          profileImageUrl: u.profileImageUrl,
                        })) || []
                      }
                      maxVisible={3}
                    />
                  </td> */}
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => {
                        setInterviewForm({
                          ...interview,
                          startTime: new Date(interview.startTime)
                            .toISOString()
                            .slice(0, 16),
                        });
                        setEditingInterviewId(interview._id); // ✅ track which interview we are editing
                        setOpenInterviewModal(true);
                      }}
                      className="px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {user?.role === "admin" && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setOpenInterviewModal(true)}
                className=" add-btn w-fit!"
              >
                Set an Interview
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interview Modal */}
      <Modal
        isOpen={openInterviewModal}
        onClose={() => {
          setOpenInterviewModal(false);
          clearInterviewData();
          setEditingInterviewId(null); // ✅ reset
        }}
        title={
          editingInterviewId
            ? `Update Interview for ${interviewForm.candidateName}`
            : "Set Interview"
        }
      >
        <Input
          placeholder="Enter your name"
          value={interviewForm.candidateName}
          onChange={(e) => handleValueChange("candidateName", e.target.value)}
          label="Candidate Name"
          type="text"
        />
        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-slate-200">
            Select Opening
          </label>
          <SelectOption
            options={openingOptions}
            value={interviewForm.opening}
            onChange={(value) => handleValueChange("opening", value)}
            placeholder="Select Opening"
          />
        </div>
        <Input
          placeholder="Select Start Time"
          value={interviewForm.startTime}
          onChange={(e) => handleValueChange("startTime", e.target.value)}
          label="Start Time"
          type="datetime-local"
        />
        <Input
          placeholder="Enter number of rounds"
          value={interviewForm.rounds}
          onChange={(e) => handleValueChange("rounds", e.target.value)}
          label="Rounds"
          type="number"
        />

        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-slate-200">Status</label>

          <SelectOption
            options={interviewStatus}
            value={interviewForm.status}
            onChange={(value) => handleValueChange("status", value)}
            placeholder="Set  Status"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-slate-200">
            Who will take
          </label>

          <SelectUsers
            selectedUsers={interviewForm.interviewers}
            setSelectedUsers={(selectedUsers) =>
              handleValueChange("interviewers", selectedUsers)
            }
            allUsers={allUsers}
            loading={loadingUsers}
            role="admin"
          />
        </div>
        <button
          onClick={() => {
            if (editingInterviewId) {
              updateInterview(editingInterviewId);
            } else {
              createInterview();
            }
          }}
          className="px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm"
        >
          {editingInterviewId ? "Update Interview" : "Create Interview"}
        </button>
      </Modal>
    </DashboardLayout>
  );
};

export default HrDashboard;
