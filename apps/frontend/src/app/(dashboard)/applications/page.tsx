"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { ApplicationStatus, Gender } from "@recruitment/shared";

export default function ApplicationsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [isFresherFilter, setIsFresherFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk status update modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<ApplicationStatus>(ApplicationStatus.SHORTLISTED);
  const [bulkReason, setBulkReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["applicationsList", page, search, selectedStatus, selectedGender, isFresherFilter],
    queryFn: () =>
      apiClient("/applications", {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          status: selectedStatus || undefined,
          gender: selectedGender || undefined,
          isFresher: isFresherFilter !== "" ? isFresherFilter === "true" : undefined,
        },
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: ApplicationStatus; reason: string }) =>
      apiClient(`/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicationsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.data) {
      setSelectedIds(data.data.map((app: any) => app.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const executeBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await updateStatusMutation.mutateAsync({
        id,
        status: bulkTargetStatus,
        reason: bulkReason || `Bulk status update to ${bulkTargetStatus}`,
      });
    }
    setIsBulkModalOpen(false);
    setSelectedIds([]);
  };

  const exportToCsv = () => {
    if (!data?.data || data.data.length === 0) return;

    const headers = [
      "Application ID",
      "Candidate Name",
      "Email",
      "Mobile",
      "Gender",
      "Position",
      "Fresher",
      "Status",
      "Applied Date",
    ];

    const rows = data.data.map((app: any) => [
      app.applicationCode,
      `"${app.candidate.fullName}"`,
      app.candidate.email,
      app.candidate.mobileNumber,
      app.candidate.gender,
      `"${app.jobPosition?.title || "N/A"}"`,
      app.isFresher ? "Yes" : "No",
      app.status,
      new Date(app.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `applications_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">New</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Review</span>;
      case "SHORTLISTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Shortlisted</span>;
      case "INTERVIEW_SCHEDULED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Interview Scheduled</span>;
      case "SELECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Selected</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Applications Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, inspect, shortlist, and schedule interviews across candidate submissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              Bulk Action ({selectedIds.length} selected)
            </button>
          )}

          <button
            onClick={exportToCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Permitted CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by candidate name, email, phone, or application ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg text-xs bg-white text-slate-700 outline-none"
        >
          <option value="">All Statuses</option>
          <option value={ApplicationStatus.NEW}>New</option>
          <option value={ApplicationStatus.UNDER_REVIEW}>Under Review</option>
          <option value={ApplicationStatus.SHORTLISTED}>Shortlisted</option>
          <option value={ApplicationStatus.INTERVIEW_SCHEDULED}>Interview Scheduled</option>
          <option value={ApplicationStatus.SELECTED}>Selected</option>
          <option value={ApplicationStatus.REJECTED}>Rejected</option>
        </select>

        <select
          value={selectedGender}
          onChange={(e) => {
            setSelectedGender(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg text-xs bg-white text-slate-700 outline-none"
        >
          <option value="">All Genders</option>
          <option value={Gender.MALE}>Male</option>
          <option value={Gender.FEMALE}>Female</option>
          <option value={Gender.OTHER}>Other</option>
          <option value={Gender.PREFER_NOT_TO_DISCLOSE}>Prefer not to disclose</option>
        </select>

        <select
          value={isFresherFilter}
          onChange={(e) => {
            setIsFresherFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg text-xs bg-white text-slate-700 outline-none"
        >
          <option value="">All Candidates</option>
          <option value="true">Freshers Only</option>
          <option value="false">Experienced Only</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={data?.data && data.data.length > 0 && selectedIds.length === data.data.length}
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                </th>
                <th className="p-3">Application ID</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Position</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Profile Snapshot</th>
                <th className="p-3">Applied Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading application records...
                  </td>
                </tr>
              ) : !data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No applications match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                data.data.map((app: any) => {
                  const isChecked = selectedIds.includes(app.id);
                  const latestEdu = app.candidate.educations?.[0];
                  const latestExp = app.candidate.experiences?.[0];

                  return (
                    <tr key={app.id} className={`hover:bg-slate-50/80 transition ${isChecked ? "bg-blue-50/40" : ""}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(app.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900">
                        {app.applicationCode}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{app.candidate.fullName}</div>
                        <div className="text-[11px] text-slate-500">{app.candidate.email}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{app.candidate.mobileNumber}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-slate-800">{app.jobPosition?.title || "N/A"}</div>
                        <div className="text-[10px] text-slate-500">{app.jobPosition?.department}</div>
                      </td>

                      <td className="p-3 text-slate-600 font-medium">
                        {app.candidate.gender.replace(/_/g, " ")}
                      </td>

                      <td className="p-3">
                        {app.isFresher ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            Fresher ({latestEdu?.degreeName || "Graduate"})
                          </span>
                        ) : (
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-800">{latestExp?.designation || "Experienced"}</span>
                            <div className="text-[10px] text-slate-500">{latestExp?.companyName || "Previous Org"}</div>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-slate-500">{formatDate(app.createdAt)}</td>

                      <td className="p-3">{getStatusBadge(app.status)}</td>

                      <td className="p-3 text-right space-x-1">
                        <Link
                          href={`/candidates/${app.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        {app.status === "NEW" || app.status === "UNDER_REVIEW" ? (
                          <>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: app.id,
                                  status: ApplicationStatus.SHORTLISTED,
                                  reason: "Shortlisted from dashboard",
                                })
                              }
                              title="Shortlist Candidate"
                              className="p-1 rounded text-purple-600 hover:bg-purple-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: app.id,
                                  status: ApplicationStatus.REJECTED,
                                  reason: "Rejected from dashboard",
                                })
                              }
                              title="Reject Candidate"
                              className="p-1 rounded text-rose-600 hover:bg-rose-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing page <strong>{data.meta.page}</strong> of <strong>{data.meta.totalPages}</strong> ({data.meta.total} applications)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border rounded-md disabled:opacity-40 flex items-center gap-1 hover:bg-slate-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border rounded-md disabled:opacity-40 flex items-center gap-1 hover:bg-slate-50"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Status Update Confirmation Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
              Bulk Update {selectedIds.length} Applications
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              This action will update the lifecycle status of all selected candidate applications and log an immutable audit event.
            </p>

            <div className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Status</label>
                <select
                  value={bulkTargetStatus}
                  onChange={(e) => setBulkTargetStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                >
                  <option value={ApplicationStatus.SHORTLISTED}>Shortlisted</option>
                  <option value={ApplicationStatus.UNDER_REVIEW}>Under Review</option>
                  <option value={ApplicationStatus.REJECTED}>Rejected</option>
                  <option value={ApplicationStatus.ON_HOLD}>On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Bulk shortlisting after round 1 evaluation"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkUpdate}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Confirm Bulk Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
