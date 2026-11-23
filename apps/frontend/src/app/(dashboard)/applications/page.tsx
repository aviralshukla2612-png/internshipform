"use client";

import React, { useState, useEffect } from "react";
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
  X,
  Maximize2,
  Trash2,
  RotateCcw,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { ApplicationStatus, Gender } from "@recruitment/shared";

export default function ApplicationsPage() {
  const queryClient = useQueryClient();

  // Persistent state initialized from URL query params or sessionStorage fallback
  const [page, setPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("page");
      if (p && !isNaN(Number(p))) return Math.max(1, Number(p));
      const cached = sessionStorage.getItem("app_table_page");
      if (cached && !isNaN(Number(cached))) return Math.max(1, Number(cached));
    }
    return 1;
  });

  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const l = new URLSearchParams(window.location.search).get("limit");
      if (l && !isNaN(Number(l))) return Number(l);
      const cached = sessionStorage.getItem("app_table_limit");
      if (cached && !isNaN(Number(cached))) return Number(cached);
    }
    return 10;
  });

  const [search, setSearch] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const s = new URLSearchParams(window.location.search).get("search");
      if (s !== null) return s;
      const cached = sessionStorage.getItem("app_table_search");
      if (cached !== null) return cached;
    }
    return "";
  });

  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const st = new URLSearchParams(window.location.search).get("status");
      if (st !== null) return st;
      const cached = sessionStorage.getItem("app_table_status");
      if (cached !== null) return cached;
    }
    return "";
  });

  const [selectedGender, setSelectedGender] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const g = new URLSearchParams(window.location.search).get("gender");
      if (g !== null) return g;
      const cached = sessionStorage.getItem("app_table_gender");
      if (cached !== null) return cached;
    }
    return "";
  });

  const [isFresherFilter, setIsFresherFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const f = new URLSearchParams(window.location.search).get("isFresher");
      if (f !== null) return f;
      const cached = sessionStorage.getItem("app_table_fresher");
      if (cached !== null) return cached;
    }
    return "";
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sync state to URL and sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedGender) params.set("gender", selectedGender);
    if (isFresherFilter !== "") params.set("isFresher", isFresherFilter);

    const queryStr = params.toString();
    const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;

    window.history.replaceState(null, "", newUrl);

    sessionStorage.setItem("app_table_page", String(page));
    sessionStorage.setItem("app_table_limit", String(pageSize));
    sessionStorage.setItem("app_table_search", search);
    sessionStorage.setItem("app_table_status", selectedStatus);
    sessionStorage.setItem("app_table_gender", selectedGender);
    sessionStorage.setItem("app_table_fresher", isFresherFilter);
  }, [page, pageSize, search, selectedStatus, selectedGender, isFresherFilter]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setPage(Math.max(1, Number(params.get("page")) || 1));
      setPageSize(Number(params.get("limit")) || 10);
      setSearch(params.get("search") || "");
      setSelectedStatus(params.get("status") || "");
      setSelectedGender(params.get("gender") || "");
      setIsFresherFilter(params.get("isFresher") !== null ? (params.get("isFresher") as string) : "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Bulk status update modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<ApplicationStatus>(ApplicationStatus.SHORTLISTED);
  const [bulkReason, setBulkReason] = useState("");

  // Photo Zoom Lightbox Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string; code: string } | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["applicationsList", page, pageSize, search, selectedStatus, selectedGender, isFresherFilter],
    queryFn: () =>
      apiClient("/applications", {
        params: {
          page,
          limit: pageSize,
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["applicationsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      apiClient("/applications/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      setIsBulkDeleteModalOpen(false);
      setSelectedIds([]);
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
      "WhatsApp",
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
      app.candidate.whatsappNumber || app.candidate.mobileNumber,
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
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 whitespace-nowrap inline-block">New</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 whitespace-nowrap inline-block">Review</span>;
      case "SHORTLISTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 whitespace-nowrap inline-block">Shortlisted</span>;
      case "INTERVIEW_SCHEDULED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 whitespace-nowrap inline-block">Interview Scheduled</span>;
      case "SELECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap inline-block">Selected</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 whitespace-nowrap inline-block">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 whitespace-nowrap inline-block">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Applications Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, inspect, shortlist, and schedule interviews across candidate submissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Bulk Action ({selectedIds.length})
              </button>
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.length})
              </button>
            </>
          )}

          <button
            onClick={exportToCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
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

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-none px-3 py-2 border rounded-lg text-xs bg-white text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value={ApplicationStatus.NEW}>New</option>
            <option value={ApplicationStatus.UNDER_REVIEW}>Under Review</option>
            <option value={ApplicationStatus.SHORTLISTED}>Shortlisted</option>
            <option value={ApplicationStatus.INTERVIEW_SCHEDULED}>Interview Scheduled</option>
            <option value={ApplicationStatus.SELECTED}>Selected</option>
            <option value={ApplicationStatus.REJECTED}>Rejected</option>
          </select>

          {/* Gender Filter (Male / Female Only) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedGender("");
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition ${selectedGender === ""
                ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              All Genders
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGender(Gender.MALE);
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition ${selectedGender === Gender.MALE
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGender(Gender.FEMALE);
                setPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition ${selectedGender === Gender.FEMALE
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Female
            </button>
          </div>

          <select
            value={isFresherFilter}
            onChange={(e) => {
              setIsFresherFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-none px-3 py-2 border rounded-lg text-xs bg-white text-slate-700 outline-none"
          >
            <option value="">All Candidates</option>
            <option value="true">Freshers Only</option>
            <option value="false">Experienced Only</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full min-w-[980px] lg:min-w-full text-left border-collapse text-xs">
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
                <th className="p-3 whitespace-nowrap">Application ID</th>
                <th className="p-3">Candidate</th>
                <th className="p-3 whitespace-nowrap">Mobile / Contact</th>
                <th className="p-3">Position</th>
                <th className="p-3 whitespace-nowrap">Gender</th>
                <th className="p-3">Profile Snapshot</th>
                <th className="p-3 whitespace-nowrap">Applied Date</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading application records...
                  </td>
                </tr>
              ) : !data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No applications match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                data.data.map((app: any) => {
                  const isChecked = selectedIds.includes(app.id);
                  const latestEdu = app.candidate.educations?.[0];
                  const latestExp = app.candidate.experiences?.[0];
                  const address = app.candidate.addresses?.[0];

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

                      <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {app.applicationCode}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {app.candidate.profilePhotoDocId ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: `/api/v1/documents/view/${app.candidate.profilePhotoDocId}`,
                                  name: app.candidate.fullName,
                                  code: app.applicationCode,
                                })
                              }
                              className="relative group shrink-0 focus:outline-none"
                              title="Click to view full photo"
                            >
                              <img
                                src={`/api/v1/documents/view/${app.candidate.profilePhotoDocId}`}
                                alt={app.candidate.fullName}
                                className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 group-hover:border-blue-500 shadow-xs transition transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/25 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-3 h-3 text-white drop-shadow" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                              {app.candidate.fullName ? app.candidate.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{app.candidate.fullName}</div>
                            {app.candidate.fatherName && (
                              <div className="text-[10px] text-slate-400 truncate">S/D/O {app.candidate.fatherName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mobile / Contact Details Column */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          {/* Primary Mobile Number + Click to Call + WhatsApp Badge */}
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono">
                            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <a
                              href={`tel:${app.candidate.mobileNumber}`}
                              className="hover:text-blue-600 hover:underline"
                              title="Click to call candidate"
                            >
                              {app.candidate.mobileNumber}
                            </a>
                            {app.candidate.whatsappNumber && (
                              <a
                                href={`https://api.whatsapp.com/send?phone=91${app.candidate.whatsappNumber.replace(/\D/g, "").slice(-10)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>WA</span>
                              </a>
                            )}
                          </div>

                          {/* WhatsApp number if different from Mobile */}
                          {app.candidate.whatsappNumber && app.candidate.whatsappNumber !== app.candidate.mobileNumber && (
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                              <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>WA: {app.candidate.whatsappNumber}</span>
                            </div>
                          )}

                          {/* Email Address */}
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <a
                              href={`mailto:${app.candidate.email}`}
                              className="hover:text-blue-600 hover:underline truncate max-w-[200px]"
                              title={app.candidate.email}
                            >
                              {app.candidate.email}
                            </a>
                          </div>

                          {/* Address / City if available */}
                          {address?.city && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {address.city}
                                {address.state ? `, ${address.state}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-slate-800 leading-snug">{app.jobPosition?.title || "N/A"}</div>
                        <div className="text-[10px] text-slate-500">{app.jobPosition?.department}</div>
                      </td>

                      <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                        {app.candidate.gender.replace(/_/g, " ")}
                      </td>

                      <td className="p-3">
                        {app.isFresher ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 inline-block leading-normal">
                            Fresher ({latestEdu?.degreeName || "Graduate"})
                          </span>
                        ) : (
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-800">{latestExp?.designation || "Experienced"}</span>
                            <div className="text-[10px] text-slate-500">{latestExp?.companyName || "Previous Org"}</div>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-slate-500 whitespace-nowrap">{formatDate(app.createdAt)}</td>

                      <td className="p-3 whitespace-nowrap">{getStatusBadge(app.status)}</td>

                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <Link
                          href={`/candidates/${app.id}${typeof window !== "undefined" && window.location.search ? `?from=${encodeURIComponent(window.location.search)}` : ""}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        {app.status === ApplicationStatus.SHORTLISTED ? (
                          <>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: app.id,
                                  status: ApplicationStatus.NEW,
                                  reason: "Shortlist undone from dashboard",
                                })
                              }
                              title="Undo Shortlist (Reset to New)"
                              className="p-1 rounded text-amber-600 hover:bg-amber-50 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
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
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : app.status === ApplicationStatus.REJECTED ? (
                          <>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: app.id,
                                  status: ApplicationStatus.NEW,
                                  reason: "Rejection undone from dashboard",
                                })
                              }
                              title="Undo Rejection (Reset to New)"
                              className="p-1 rounded text-amber-600 hover:bg-amber-50 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: app.id,
                                  status: ApplicationStatus.SHORTLISTED,
                                  reason: "Shortlisted from dashboard",
                                })
                              }
                              title="Shortlist Candidate"
                              className="p-1 rounded text-purple-600 hover:bg-purple-50 transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : app.status === ApplicationStatus.NEW || app.status === ApplicationStatus.UNDER_REVIEW ? (
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
                              className="p-1 rounded text-purple-600 hover:bg-purple-50 transition"
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
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: app.id,
                                status: ApplicationStatus.NEW,
                                reason: "Status reset to New from dashboard",
                              })
                            }
                            title="Reset Status to New (Undo)"
                            className="p-1 rounded text-amber-600 hover:bg-amber-50 transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(app)}
                          title="Delete Candidate Record"
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4 inline-block" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data?.meta && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                Showing{" "}
                <strong>
                  {data.meta.total > 0 ? (page - 1) * pageSize + 1 : 0}
                </strong>
                –
                <strong>
                  {Math.min(page * pageSize, data.meta.total)}
                </strong>{" "}
                of <strong>{data.meta.total}</strong> applications
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="px-2.5 py-1.5 border border-slate-300 bg-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold"
                title="First Page"
              >
                &laquo; First
              </button>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-300 bg-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-slate-100 font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              {/* Page Number Badges */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.max(1, data.meta.totalPages) }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === Math.max(1, data.meta.totalPages) || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && p - arr[idx - 1] > 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-md font-bold text-xs transition ${page === p
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                disabled={page >= Math.max(1, data.meta.totalPages)}
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-300 bg-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-slate-100 font-semibold"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= Math.max(1, data.meta.totalPages)}
                onClick={() => setPage(Math.max(1, data.meta.totalPages))}
                className="px-2.5 py-1.5 border border-slate-300 bg-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold"
                title="Last Page"
              >
                Last &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Status Update Confirmation Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border mx-4 max-h-[90vh] overflow-y-auto">
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
                  <option value={ApplicationStatus.NEW}>Reset to New (Undo)</option>
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

      {/* Photo Zoom / Lightbox Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 mx-4 max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{previewPhoto.name}</h3>
                <span className="font-mono text-xs text-slate-500">{previewPhoto.code}</span>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-slate-950 flex items-center justify-center min-h-[300px]">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
              />
            </div>

            <div className="p-3 bg-slate-50 border-t flex items-center justify-between text-xs">
              <span className="text-slate-500">Applicant Profile Photograph</span>
              <a
                href={previewPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Full Photo
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-rose-100 animate-in fade-in duration-150 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Application</h3>
                <p className="text-xs text-slate-500">Permanent record removal</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-bold text-slate-900">{deleteTarget.candidate?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App ID:</span>
                <span className="font-mono font-bold text-slate-800">{deleteTarget.applicationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Position:</span>
                <span className="font-medium text-slate-800">{deleteTarget.jobPosition?.title || "N/A"}</span>
              </div>
            </div>

            <p className="text-xs text-rose-600 font-medium">
              Are you sure you want to delete this candidate application? This action will permanently remove all associated notes, interview rounds, and status records.
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-rose-100 animate-in fade-in duration-150 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bulk Delete Applications</h3>
                <p className="text-xs text-slate-500">{selectedIds.length} candidate applications selected</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4">
              Are you sure you want to permanently delete <strong className="text-rose-600">{selectedIds.length}</strong> selected candidate applications? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete All ({selectedIds.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
