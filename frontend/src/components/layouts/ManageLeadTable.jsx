import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { UserContext } from "../../context/userContext";
import { beautify } from "../../utils/helper";
import { FaInstagram, FaLinkedin, FaRegFileAlt } from "react-icons/fa";
import ReactPaginate from "react-paginate";

const ManageLeadTable = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const navigate = useNavigate();

  const { user } = useContext(UserContext);

  const allow = !(
    user.role === "superAdmin" ||
    (user.role === "admin" && user.department === "BusinessDevelopment") ||
    (user.role !== "admin" && user.department === "BusinessDevelopment")
  );

  const fetchLeads = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(API_PATHS.LEADS.GET_LEADS, {
        params: { page: pageNumber, limit: 10 },
      });
      setLeads(data.leads || []);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollowUp = async (id, attemptKey, currVal) => {
    try {
      const leadToUpdate = leads.find((l) => l._id === id);
      const newFollowUp = {
        ...(leadToUpdate.followUp || {}),
        [attemptKey]: !currVal,
      };

      const { data } = await axiosInstance.put(
        API_PATHS.LEADS.UPDATE_LEAD_BY_ID(id),
        { followUp: newFollowUp }
      );
      setLeads((prev) => prev.map((l) => (l._id === id ? data.lead : l)));
    } catch (err) {
      console.error("Failed to update followUp:", err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page]);

  const handleNavigate = (leadId) => {
    navigate("/leads-create", { state: { leadId: leadId } });
  };

  const canSeeDetails =
    user?.role === "superAdmin" ||
    (user?.role === "admin" && user?.department === "BusinessDevelopment") ||
    (user?.role === "user" && user?.department === "BusinessDevelopment");

  
  const baseAttachments = ["briefUrl", "presentationUrl", "websiteUrl"];
  const extraAttachments = ["agreementUrl", "invoiceUrl"];

  const visibleAttachments = canSeeDetails
    ? [...baseAttachments.slice(0, 2), ...extraAttachments, baseAttachments[2]] // Order: brief, presentation, agreement, invoice, website
    : baseAttachments;

  if (loading) {
    return <div className="p-4 text-center text-gray-400">Loading leads…</div>;
  }

  return (
    <div className="relative bg-gray-900 rounded-lg shadow-lg p-4 w-full">
      {/* Container with controlled width and horizontal scroll */}
      <div className="overflow-x-auto overflow-y-visible w-full border border-gray-700 rounded-lg  custom-scrollbar">
        {/* Table wrapper with fixed width */}
        <div
          className={`relative ${
            canSeeDetails ? "min-w-[3400px]" : "min-w-[1600px]"
          }`}
        >
          <table className="w-full bg-gray-900">
            {/* Define column widths */}
            <colgroup>
              <col style={{ width: "200px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "300px" }} />
              {canSeeDetails && <col style={{ width: "150px" }} />}
              {canSeeDetails && <col style={{ width: "150px" }} />}
              {canSeeDetails && <col style={{ width: "150px" }} />}
              {canSeeDetails && <col style={{ width: "150px" }} />}
              {canSeeDetails && <col style={{ width: "150px" }} />}
              <col style={{ width: "100px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
              {canSeeDetails && <col style={{ width: "120px" }} />}
              {canSeeDetails && <col style={{ width: "180px" }} />}
              {canSeeDetails && <col style={{ width: "180px" }} />}
              {canSeeDetails && <col style={{ width: "180px" }} />}
              {canSeeDetails && <col style={{ width: "220px" }} />}
            </colgroup>
            <thead className="sticky top-0 bg-gray-900 z-30">
              <tr className="border-b border-gray-700">
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700 sticky left-0 z-40 bg-gray-800"
                >
                  Company
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Status
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Type
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Category
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Service
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Credential Deck Presentation
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Discovery Call Presentation
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Pitch Presentation
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                >
                  Lead Date
                </th>
                {canSeeDetails && (
                  <th
                    colSpan="5"
                    className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700 text-center"
                  >
                    Follow Up
                  </th>
                )}
                <th
                  colSpan={canSeeDetails ? "5" : "3"}
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700 text-center"
                >
                  Attachments
                </th>
                <th
                  colSpan="2"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700 text-center"
                >
                  Socials
                </th>
                {canSeeDetails && (
                  <th
                    rowSpan="2"
                    className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                  >
                    POC Name
                  </th>
                )}
                {canSeeDetails && (
                  <th
                    rowSpan="2"
                    className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                  >
                    POC Email
                  </th>
                )}
                {canSeeDetails && (
                  <th
                    rowSpan="2"
                    className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                  >
                    POC Contact
                  </th>
                )}
                {canSeeDetails && (
                  <th
                    rowSpan="2"
                    className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                  >
                    POC Job Profile
                  </th>
                )}
                {canSeeDetails && (
                  <th
                    rowSpan="2"
                    className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-800 sticky right-0 z-40 border-l-2 border-gray-600"
                    style={{ boxShadow: "-2px 0 4px rgba(0, 0, 0, 0.1)" }}
                  >
                    Actions
                  </th>
                )}
              </tr>
              <tr className="border-b border-gray-700">
                {canSeeDetails &&
                  [
                    "Attempt 1",
                    "Attempt 2",
                    "Attempt 3",
                    "Attempt 4",
                    "Attempt 5",
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                    >
                      {label}
                    </th>
                  ))}
                {visibleAttachments.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                  >
                    {beautify(key.replace("Url", ""))}
                  </th>
                ))}

                {["Instagram", "Linkedin"].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-2 text-sm font-semibold text-gray-300 border-b border-gray-700"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {leads.map((lead, index) => (
                <tr
                  key={lead._id || index}
                  className="border-b border-gray-700 "
                >
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b  border-gray-700 sticky left-0 z-20 bg-gray-800">
                    {lead.companyName || "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700 capitalize">
                    {lead.status || "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700 capitalize">
                    {lead.type || "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700 capitalize">
                    {beautify(lead.category) || "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700 capitalize">
                    {beautify(lead.services) || "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                    {lead.credentialDeckDate
                      ? moment(lead.credentialDeckDate).format(
                          "DD-MM-YYYY hh:mm A"
                        )
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                    {lead.discoveryCallDate
                      ? moment(lead.discoveryCallDate).format(
                          "DD-MM-YYYY hh:mm A"
                        )
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                    {lead.pitchDate
                      ? moment(lead.pitchDate).format("DD-MM-YYYY hh:mm A")
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                    {lead.leadCameDate
                      ? moment(lead.leadCameDate).format("DD-MM-YYYY")
                      : "-"}
                  </td>
                  {canSeeDetails &&
                    [1, 2, 3, 4, 5].map((attempt) => (
                      <td
                        key={`attempt-${attempt}`}
                        className="px-4 py-2 text-sm text-center text-gray-300 border-b border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={
                            lead.followUp?.[`attempt${attempt}`] || false
                          }
                          disabled={allow}
                          onChange={() =>
                            toggleFollowUp(
                              lead._id,
                              `attempt${attempt}`,
                              lead.followUp?.[`attempt${attempt}`]
                            )
                          }
                          className={`w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500 ${
                            allow ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        />
                      </td>
                    ))}

                  {/* Attachments */}
                  {visibleAttachments.map((key) => {
                    const url = lead.attachments?.[key];
                    return (
                      <td
                        key={key}
                        className="px-4 text-center py-2 text-xl text-gray-300 border-b border-gray-700"
                      >
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener"
                            className="text-[#E43941] flex items-center justify-center hover:underline"
                          >
                            <FaRegFileAlt />
                          </a>
                        ) : (
                          <span className="text-gray-500">–</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                    {lead.socials?.instagramUrl ? (
                      <a
                        href={lead.socials.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center text-pink-500 hover:underline"
                        title="View Instagram"
                      >
                        <FaInstagram size={18} />
                      </a>
                    ) : (
                      <span className="text-gray-500">–</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                    {lead.socials?.linkedinUrlUrl ? (
                      <a
                        href={lead.socials.linkedinUrlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center text-blue-500 hover:underline"
                        title="View LinkedIn"
                      >
                        <FaLinkedin size={18} />
                      </a>
                    ) : (
                      <span className="text-gray-500">–</span>
                    )}
                  </td>
                  {canSeeDetails && (
                    <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                      {lead.cName || "-"}
                    </td>
                  )}
                  {canSeeDetails && (
                    <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                      {lead.email || "-"}
                    </td>
                  )}
                  {canSeeDetails && (
                    <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                      {lead.contact || "-"}
                    </td>
                  )}
                  {canSeeDetails && (
                    <td className="px-4 py-2 text-center text-sm text-gray-300 border-b border-gray-700">
                      {lead.jobProfile || "-"}
                    </td>
                  )}
                  {/* Actions column - sticky */}
                  {canSeeDetails && (
                    <td
                      className="px-4 py-2 text-sm text-gray-300 bg-gray-800 sticky right-0 z-20 border-l-2 border-gray-600"
                      style={{ boxShadow: "-2px 0 4px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="flex justify-center items-center">
                        <button
                          disabled={allow}
                          onClick={() => handleNavigate(lead._id)}
                          className={`px-3 py-1 text-white rounded ${
                            allow
                              ? "bg-gray-700 cursor-not-allowed"
                              : "bg-[#E43941] hover:bg-red-600 cursor-pointer "
                          }  text-xs`}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <ReactPaginate
          previousLabel={"Previous"}
          nextLabel={"Next"}
          breakLabel={"..."}
          pageCount={pages} // total number of pages from backend
          forcePage={page - 1} // zero-based index
          marginPagesDisplayed={2}
          pageRangeDisplayed={3}
          onPageChange={(selectedItem) => setPage(selectedItem.selected + 1)}
          containerClassName="flex gap-2 mt-4 justify-center"
          pageClassName="" // leave this empty
          pageLinkClassName="px-3 py-1 border rounded text-white cursor-pointer transition-colors duration-200 block"
          activeLinkClassName="bg-[#E43941] border-[#E43941] text-white"
          previousLinkClassName="px-3 py-1 border text-white rounded cursor-pointer block"
          nextLinkClassName="px-3 py-1 border text-white rounded cursor-pointer block"
          disabledLinkClassName="opacity-50 cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default ManageLeadTable;
