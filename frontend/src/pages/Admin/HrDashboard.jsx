import DashboardLayout from "components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SpinLoader from "../../components/layouts/SpinLoader";
import Modal from "components/layouts/Modal";
import Input from "components/Inputs/Input";
import SelectOption from "components/Inputs/SelectOption";
import { interviewStatus, openingStatus } from "../../utils/data";
import SelectUsers from "components/Inputs/SelectUsers";
import toast from "react-hot-toast";
import ReactPaginate from "react-paginate";
import HrDocs from "components/layouts/HrDocs";
import { IoTrashOutline } from "react-icons/io5";
import moment from "moment";
import { FiX } from "react-icons/fi";
import { FaRegFileAlt } from "react-icons/fa";
import { HiBellAlert } from "react-icons/hi2";
import { HiOutlineTrash } from "react-icons/hi";
import DobTable from "components/layouts/dobTable";

const HrDashboard = () => {
  const [interviews, setInterviews] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [openingOptions, setOpeningOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState(null);
  const [editingOpeningId, setEditingOpeningId] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [cname, setCname] = useState("");
  const [debouncedCname, setDebouncedCname] = useState("");

  const [tname, setTname] = useState("");
  const [debouncedTname, setDebouncedTname] = useState("");

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
    status: "open",
    dueDate: "",
    expense: 0,
    jobDesc: "",
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
      status: "open",
      dueDate: "",
      expense: 0,
      jobDesc: "",
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
          params: { limit: 5, page, cname: debouncedCname || undefined },
        }
      );
      setInterviews(response.data?.data || []);
      setPages(response.data?.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedCname]);

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
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview. Please fill all fields.");
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
  const [openingPage, setOpeningPage] = useState(1);
  const [openingPages, setOpeningPages] = useState(1);
  const getOpenings = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.INTERVIEW.GET_OPENINGS,
        {
          params: {
            limit: 5,
            page: openingPage,
            tname: debouncedTname || undefined,
          },
        }
      );
      setOpenings(response.data?.data || []);
      setOpeningOptions(
        response.data?.data.map((opening) => ({
          value: opening.title,
          label: opening.title,
        })) || []
      );
      const totalPages = response.data?.pagination?.totalPages || 1;
      setOpeningPages(totalPages);
    } catch (error) {
      console.error("Error fetching openings:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [openingPage, debouncedTname]);

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

  const updateOpening = async (openingId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch(
        API_PATHS.INTERVIEW.UPDATE_OPENING(openingId),
        openingForm
      );
      if (response) {
        clearOpeningData();
        setOpenFormModal(false);
        getOpenings(); // Refresh the openings list
      }
      toast.success("Opening updated successfully");
    } catch (error) {
      console.error("Error updating opening:", error);
      toast.error("Failed to update opening.");
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCname(cname); // Apply after 1s
    }, 1000);
    return () => clearTimeout(timeout);
  }, [cname]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedTname(tname); // Apply after 1s
    }, 1000);
    return () => clearTimeout(timeout);
  }, [tname]);

  useEffect(() => {
    getInterviews();
  }, [page, getInterviews, debouncedCname]);

  useEffect(() => {
    getOpenings();
  }, [openingPage, getOpenings, debouncedTname]);

  useEffect(() => {
    getUpcomingInterviews();
  }, [getUpcomingInterviews]);

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return "#D3D3D3";
    const daysLeft = moment(dueDate)
      .startOf("day")
      .diff(moment().startOf("day"), "days");
    if (daysLeft < 0) return "#A9A9A9";
    if (daysLeft <= 2) return "#E43941";
    if (daysLeft <= 4) return "#E48E39";
    return "#6FE439";
  };

  if (loading) return <SpinLoader />;

  return (
    <DashboardLayout activeMenu="Hr Dashboard">
      {/* Upcoming Interviews */}
      <div className="card my-5">
        {loading && <SpinLoader />}
        <div className="">
          <h2 className="text-lg font-regular mb-1">Upcoming Interviews</h2>
          <div
            className="relative -mx-4 sm:mx-0" // full‑bleed on mobile
            role="region"
            aria-label="Interviews table"
          >
            <div className="overflow-x-auto overscroll-x-contain px-4 sm:px-0">
              <table className="min-w-[920px] sm:min-w-full text-sm text-gray-200 table-fixed whitespace-nowrap">
                <thead className="sticky top-0 z-10 border-b border-white/20">
                  <tr className="text-left">
                    <th className="py-2 pr-4 w-[220px]">Candidate</th>
                    <th className="py-2 pr-4 w-[220px]">Opening</th>
                    <th className="py-2 pr-4 w-[240px]">Start</th>
                    <th className="py-2 pr-4 w-[120px]">Rounds</th>
                    <th className="py-2 pr-4 w-[140px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInterviews.map((interview) => (
                    <tr
                      key={interview._id}
                      className="border-b border-white/20"
                    >
                      <td className="py-2">{interview.candidateName}</td>
                      <td className="py-2">{interview.opening}</td>
                      <td className="py-2">
                        {new Date(interview.startTime).toLocaleString()}
                      </td>
                      <td className="py-2">{interview.rounds}</td>
                      <td className="py-2">{interview.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Interviews */}
      <div className="card my-5">
        {loading && <SpinLoader />}
        <div className="">
          <div className="flex justify-between flex-wrap items-center mb-4">
            <h2 className="text-lg font-regular mb-1">Interviews</h2>
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <label className="text-white text-sm">Search Candidate:</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={cname}
                  onChange={(e) => setCname(e.target.value)}
                  placeholder="Name"
                  className="pl-0.5 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:ring-0"
                />
                <FiX
                  onClick={() => setCname("")}
                  className="ml-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div
            className="relative -mx-4 sm:mx-0" // full‑bleed on mobile
            role="region"
            aria-label="Interviews table"
          >
            <div className="overflow-x-auto overscroll-x-contain px-4 sm:px-0">
              <table className="min-w-[920px] sm:min-w-full text-sm text-gray-200 table-fixed whitespace-nowrap">
                <thead className="sticky top-0 z-10 border-b border-white/20">
                  <tr className="text-left">
                    <th className="py-2 pr-4 w-[220px]">Candidate</th>
                    <th className="py-2 pr-4 w-[220px]">Opening</th>
                    <th className="py-2 pr-4 w-[240px]">Start</th>
                    <th className="py-2 pr-4 w-[120px]">Rounds</th>
                    <th className="py-2 pr-4 w-[140px]">Status</th>
                    <th className="py-2 pr-2 w-[120px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {interviews.map((interview) => (
                    <tr
                      key={interview._id}
                      className="border-b border-white/20"
                    >
                      <td className="py-2">{interview.candidateName}</td>
                      <td className="py-2">{interview.opening}</td>
                      <td className="py-2">
                        {new Date(interview.startTime).toLocaleString()}
                      </td>
                      <td className="py-2">{interview.rounds}</td>
                      <td className="py-2">{interview.status}</td>
                      {/* <td className="py-2">
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
                      <td className="py-2">
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
                          className="px-3 py-1 bg-[#E43941] cursor-pointer hover:bg-[#da9194] text-white rounded text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-between">
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
            <div className="flex justify-between  flex-wrap items-center mb-4">
              <h2 className="text-lg font-regular mb-1">Job Opening</h2>
              <div className="mt-4 flex gap-2 items-center">
                <label className="text-white text-sm">Search Opening</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={tname}
                    onChange={(e) => setTname(e.target.value)}
                    placeholder="Opening"
                    className="pl-0.5 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:ring-0"
                  />
                  <FiX
                    onClick={() => setTname("")}
                    className="ml-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <table className="min-w-full text-sm text-gray-200">
              <thead>
                <tr className="text-left border-b border-white/20">
                  <th className="py-2">Positions</th>
                  <th className="py-2">Opens</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Expense</th>
                  <th className="py-2">Job Decs</th>
                  <th className="py-2">Due Date</th>
                  <th className="py-2">Due Alert</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {openings.map((o) => (
                  <tr key={o._id} className="border-b border-white/20">
                    <td className="py-2 ">{o.title}</td>
                    <td className="py-2">{o.headcount}</td>
                    <td className="py-2">{o.status}</td>
                    <td className="py-2">{o.expense}</td>
                    <td className="py-2">
                      <a
                        href={o.jobDesc}
                        target="_blank"
                        rel="noopener"
                        className="text-[#E43941] text-xl "
                      >
                        <FaRegFileAlt />
                      </a>
                    </td>
                    <td className="py-2">
                      {moment(o.dueDate).format("Do MMM YYYY")}
                    </td>
                    <td className="py-2">
                      <HiBellAlert
                        className=" text-2xl"
                        style={{ color: getDueDateColor(o.dueDate) }}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => {
                          setOpeningForm({
                            ...o,
                            dueDate: o.dueDate
                              ? new Date(o.dueDate).toISOString().slice(0, 16)
                              : "",
                          });
                          setEditingOpeningId(o._id);
                          setOpenFormModal(true);
                        }}
                        className="px-3 py-1 bg-[#E43941] cursor-pointer hover:bg-[#da9194] text-white rounded text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center  flex-wrap justify-between">
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setOpenFormModal(true)}
                  className=" add-btn w-fit!"
                >
                  Add opening
                </button>
              </div>

              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                breakLabel={"..."}
                pageCount={openingPages} // total pages from backend
                forcePage={openingPage - 1} // ReactPaginate is zero-based
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={(selectedItem) =>
                  setOpeningPage(selectedItem.selected + 1)
                }
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
      </div>

      <div className="my-5 card">
        <HrDocs />
      </div>

      <DobTable />

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
            from="interview"
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
        onClose={() => {
          setOpenFormModal(false);
          clearOpeningData();
          setEditingOpeningId(null);
        }}
        title={
          editingOpeningId
            ? `Update Opening for ${openingForm.title}`
            : "Create Opening"
        }
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
        <Input
          placeholder="Set Expense"
          value={openingForm.expense}
          onChange={(e) => handleOpeningValueChange("expense", e.target.value)}
          label="Set Expense"
          type="number"
        />
        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-slate-200">Status</label>

          <SelectOption
            options={openingStatus}
            value={openingForm.status}
            onChange={(value) => handleOpeningValueChange("status", value)}
            placeholder="Set Status"
          />
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-slate-200">
            Due Date
          </label>
          <input
            placeholder="Set Due Date"
            value={openingForm.dueDate}
            onChange={(e) =>
              handleOpeningValueChange("dueDate", e.target.value)
            }
            type="date"
            className="form-input-date"
          />
        </div>
        <Input
          placeholder="Job Description"
          value={openingForm.jobDesc}
          onChange={(e) => handleOpeningValueChange("jobDesc", e.target.value)}
          label="Job Description"
          type="text"
        />
        <div className="flex items-center gap-3 ">
          <button
            onClick={() => {
              if (editingOpeningId) {
                updateOpening(editingOpeningId);
              } else {
                createOpening();
              }
            }}
            className="px-3 py-1 bg-[#E43941] cursor-pointer hover:bg-[#da9194] text-white rounded text-sm"
          >
            {editingOpeningId ? "Update Opening" : "Create Opening"}
          </button>
          <button
            className=" px-3 flex  items-center cursor-pointer justify-center gap-2 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm "
            onClick={() => {
              deleteOpening(editingOpeningId);
              setOpenFormModal(false);
              clearOpeningData();
              setEditingOpeningId(null);
            }}
          >
            <HiOutlineTrash /> Delete
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default HrDashboard;
