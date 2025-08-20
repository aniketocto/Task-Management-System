import DashboardLayout from "components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import React, { useCallback, useContext, useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SpinLoader from "../../components/layouts/SpinLoader";
import Modal from "components/layouts/Modal";
import Input from "components/Inputs/Input";
import SelectOption from "components/Inputs/SelectOption";
import { interviewStatus } from "../../utils/data";
import SelectUsers from "components/Inputs/SelectUsers";
import toast from "react-hot-toast";
import ReactPaginate from "react-paginate";
import { HiTrash } from "react-icons/hi";
import HrDocs from "components/layouts/HrDocs";
import { IoTrashOutline } from "react-icons/io5";
import moment from "moment";

const HrDashboard = () => {
  const { user } = useContext(UserContext);
  const [interviews, setInterviews] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [openingOptions, setOpeningOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      setAllUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const [openInterviewModal, setOpenInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    opening: "",
    candidateName: "",
    startTime: "",
    rounds: 1,
    interviewers: [],
    status: "scheduled",
  });

  const [openFormModal, setOpenFormModal] = useState(false);
  const [openingForm, setOpeningForm] = useState({
    title: "",
    headcount: "",
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

  const clearOpeningData = () => {
    setOpeningForm({
      title: "",
      headcount: "",
    });
  };

  const handleValueChange = (key, value) => {
    setInterviewForm((prevData) => ({ ...prevData, [key]: value }));
  };
  const handleOpeningValueChange = (key, value) => {
    setOpeningForm((prevData) => ({ ...prevData, [key]: value }));
  };

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const getInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.INTERVIEW.GET_ALL_INTERVIEWS,
        {
          params: { limit: 10, page },
        }
      );
      setInterviews(response.data?.data || []);
      setPages(response.data?.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const getUpcomingInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.INTERVIEW.GET_UPCOMING_INTERVIEWS
      );
      setUpcomingInterviews(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const getOpenings = useCallback(async () => {
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
      // console.log(openingOptions);
    } catch (error) {
      console.error("Error fetching openings:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createOpening = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        API_PATHS.INTERVIEW.CREATE_OPENING,
        openingForm
      );
      if (response) {
        clearOpeningData();
        setOpenFormModal(false);
        getOpenings();
      }
      toast.success("Opening created successfully:");
    } catch (error) {
      console.error("Error creating opening:", error);
      toast.error("Failed to create opening. Please fill all fields.");
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteOpening = async (openingId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.delete(
        API_PATHS.INTERVIEW.DELETE_OPENING(openingId)
      );
      if (response) {
        toast.success("Opening deleted successfully");
        getOpenings(); // Refresh the openings list
      }
    } catch (error) {
      console.error("Error deleting opening:", error);
      toast.error("Failed to delete opening.");
    } finally {
      setLoading(false);
    }
  };

  const [dobs, setDobs] = useState([]);
  const getDobs = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.AUTH.DOB);
      setDobs(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching DOBs:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getInterviews();
  }, [page, getInterviews]);

  useEffect(() => {
    getOpenings();
    getUpcomingInterviews();
  }, [getOpenings, getUpcomingInterviews]);

  useEffect(() => {
    getDobs();
  }, [getDobs]);

  return (
    <DashboardLayout activeMenu="Hr Dashboard">
      {/* Upcoming Interviews */}
      <div className="card my-5">
        {loading && <SpinLoader />}
        <div className="overflow-x-auto">
          <h2 className="text-lg font-regular mb-1">Upcoming Interviews</h2>
          <table className="min-w-full text-sm text-gray-200">
            <thead>
              <tr className="text-left border-b border-white/20">
                <th className="py-2 pr-4">Candidate</th>
                <th className="py-2 pr-4">Opening</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">Rounds</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingInterviews.map((interview) => (
                <tr key={interview._id} className="border-b border-white/20">
                  <td className="py-2 pr-4">{interview.candidateName}</td>
                  <td className="py-2 pr-4">{interview.opening}</td>
                  <td className="py-2 pr-4">
                    {new Date(interview.startTime).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{interview.rounds}</td>
                  <td className="py-2 pr-4">{interview.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interviews */}
      <div className="card my-5">
        {loading && <SpinLoader />}
        <div className="overflow-x-auto">
          <h2 className="text-lg font-regular mb-1">Interviews</h2>
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

          <div className="flex items-center justify-between">
            {user?.role === "admin" && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setOpenInterviewModal(true);
                    fetchUsers();
                  }}
                  className=" add-btn w-fit!"
                >
                  Set an Interview
                </button>
              </div>
            )}

            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              breakLabel={"..."}
              pageCount={pages} // total pages from backend
              forcePage={page - 1} // ReactPaginate is zero-based
              marginPagesDisplayed={2}
              pageRangeDisplayed={3}
              onPageChange={(selectedItem) =>
                setPage(selectedItem.selected + 1)
              } // update page
              containerClassName="flex gap-2 mt-4 justify-center"
              pageLinkClassName="px-3 py-1 border rounded text-white cursor-pointer transition-colors duration-200 block"
              activeLinkClassName="bg-[#E43941] border-[#E43941] text-white"
              previousLinkClassName="px-3 py-1 border text-white rounded cursor-pointer block"
              nextLinkClassName="px-3 py-1 border text-white rounded cursor-pointer block"
              disabledLinkClassName="opacity-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Openings && Files */}
      <div className="flex flex-wrap w-full items-start justify-between gap-2">
        <div className="flex-1 card">
          <div className="overflow-x-auto">
            <h2 className="text-lg font-regular mb-1">Openings</h2>
            <table className="min-w-full text-sm text-gray-200">
              <thead>
                <tr className="text-left border-b border-white/20">
                  <th className="py-2 pr-4">Opening</th>
                  <th className="py-2 pr-4">Counts</th>
                  <th className="py-2 pr-4"> </th>
                </tr>
              </thead>
              <tbody>
                {openings.map((o) => (
                  <tr key={o._id} className="border-b border-white/20">
                    <td className="py-2 pr-4">{o.title}</td>
                    <td className="py-2 pr-4">{o.headcount}</td>
                    <td className="py-2 pr-4">
                      <button onClick={() => deleteOpening(o._id)}>
                        <IoTrashOutline className="text-red-500 text-xl cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {user?.role === "superAdmin" && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setOpenFormModal(true)}
                  className=" add-btn w-fit!"
                >
                  Add opening
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 card">
          <HrDocs />
        </div>
      </div>

      <div className="card my-5">
        {loading && <SpinLoader />}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-200">
            <thead>
              <tr className="text-left border-b border-white/20">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">DOB</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Designation</th>
              </tr>
            </thead>
            <tbody>
              {dobs.map((d) => (
                <tr key={d._id} className="border-b border-white/20">
                  <td className="py-2 pr-4">{d.name}</td>
                  <td className="py-2 pr-4">
                    {moment(d.dob).format("DD-MM-YYYY")}
                  </td>
                  <td className="py-2 pr-4">{d.department}</td>
                  <td className="py-2 pr-4">{d.designation}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-slate-200">
            Date & Time
          </label>
          <input
            placeholder="Select Start Time"
            value={interviewForm.startTime}
            onChange={(e) => handleValueChange("startTime", e.target.value)}
            type="datetime-local"
            className="form-input-date"
          />
        </div>
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

      <Modal
        isOpen={openFormModal}
        onClose={() => setOpenFormModal(false)}
        title="Add Opening"
      >
        <Input
          placeholder="Enter Opening"
          value={openingForm.title}
          onChange={(e) => handleOpeningValueChange("title", e.target.value)}
          label="Opening Title"
          type="text"
        />
        <Input
          placeholder="Enter Headcount"
          value={openingForm.headcount}
          onChange={(e) =>
            handleOpeningValueChange("headcount", e.target.value)
          }
          label="Headcount"
          type="number"
        />
        <button
          onClick={createOpening}
          className="px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm"
        >
          Create Opening
        </button>
      </Modal>
    </DashboardLayout>
  );
};

export default HrDashboard;
