"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PremiumDateTimePicker } from "@/components/ui/premium-date-time-picker";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  ExternalLink,
  MapPin,
  RefreshCw,
  Eye,
} from "lucide-react";

type DatePreset = "ALL" | "TODAY" | "TOMORROW" | "THIS_WEEK" | "CUSTOM";

function getTodayIST(): { y: number; m: number; d: number; dateStr: string } {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateStr = formatter.format(new Date());
    const [y, m, d] = dateStr.split("-").map(Number);
    return { y, m, d, dateStr };
  } catch {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), dateStr };
  }
}

export default function InterviewsPage() {
  const queryClient = useQueryClient();

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Search & Filter State
  const [search, setSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [customDate, setCustomDate] = useState<string>("");

  // Cancel Modal State
  const [cancelModalItem, setCancelModalItem] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("");

  // Reschedule Modal State
  const [rescheduleModalItem, setRescheduleModalItem] = useState<any | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState<string>("");
  const [rescheduleDuration, setRescheduleDuration] = useState<number>(45);
  const [rescheduleReason, setRescheduleReason] = useState<string>("Time adjusted by admin");
  const [rescheduleDetails, setRescheduleDetails] = useState<string>("");
  const [rescheduleRemarks, setRescheduleRemarks] = useState<string>("");

  // Compute startDate & endDate ISO strings based on selected date filter (strictly in Asia/Kolkata)
  const { startDate, endDate } = useMemo(() => {
    if (datePreset === "ALL") {
      return { startDate: undefined, endDate: undefined };
    }

    if (datePreset === "TODAY") {
      const { dateStr } = getTodayIST();
      return {
        startDate: `${dateStr}T00:00:00.000+05:30`,
        endDate: `${dateStr}T23:59:59.999+05:30`,
      };
    }

    if (datePreset === "TOMORROW") {
      const now = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const dateStr = formatter.format(now);
      return {
        startDate: `${dateStr}T00:00:00.000+05:30`,
        endDate: `${dateStr}T23:59:59.999+05:30`,
      };
    }

    if (datePreset === "THIS_WEEK") {
      const now = new Date();
      const day = now.getDay(); // 0 is Sunday
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now.getTime() + diffToMonday * 24 * 60 * 60 * 1000);
      const sunday = new Date(now.getTime() + (diffToMonday + 6) * 24 * 60 * 60 * 1000);
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const monStr = formatter.format(monday);
      const sunStr = formatter.format(sunday);
      return {
        startDate: `${monStr}T00:00:00.000+05:30`,
        endDate: `${sunStr}T23:59:59.999+05:30`,
      };
    }

    if (datePreset === "CUSTOM" && customDate) {
      return {
        startDate: `${customDate}T00:00:00.000+05:30`,
        endDate: `${customDate}T23:59:59.999+05:30`,
      };
    }

    return { startDate: undefined, endDate: undefined };
  }, [datePreset, customDate]);

  // Fetch paginated interviews list
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "interviewsList",
      page,
      pageSize,
      search,
      selectedStatus,
      datePreset,
      customDate,
      startDate,
      endDate,
    ],
    queryFn: () =>
      apiClient("/interviews", {
        params: {
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          status: selectedStatus !== "ALL" ? selectedStatus : undefined,
          startDate,
          endDate,
        },
      }),
  });

  const interviews = data?.data || [];
  const meta = data?.meta;

  // Cancel Interview Mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient(`/interviews/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      setCancelModalItem(null);
      setCancellationReason("");
      queryClient.invalidateQueries({ queryKey: ["interviewsList"] });
      queryClient.invalidateQueries({ queryKey: ["interviewsCalendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });

  const handleOpenCancelModal = (intv: any) => {
    setCancelModalItem(intv);
    setCancellationReason("");
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalItem) return;
    if (!cancellationReason.trim()) {
      alert("Please provide a reason for cancelling this interview slot.");
      return;
    }
    cancelMutation.mutate({
      id: cancelModalItem.id,
      reason: cancellationReason.trim(),
    });
  };

  // Reschedule Interview Mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({
      id,
      scheduledStart,
      durationMinutes,
      reason,
      meetingDetails,
      remarks,
    }: {
      id: string;
      scheduledStart: string;
      durationMinutes: number;
      reason: string;
      meetingDetails?: string;
      remarks?: string;
    }) =>
      apiClient(`/interviews/${id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({
          scheduledStart,
          durationMinutes,
          reason,
          meetingDetails,
          remarks,
        }),
      }),
    onSuccess: () => {
      setRescheduleModalItem(null);
      queryClient.invalidateQueries({ queryKey: ["interviewsList"] });
      queryClient.invalidateQueries({ queryKey: ["interviewsCalendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });

  const handleOpenRescheduleModal = (intv: any) => {
    setRescheduleModalItem(intv);
    setRescheduleStart(intv.scheduledStart || "");
    setRescheduleDuration(intv.durationMinutes || 45);
    setRescheduleDetails(intv.meetingDetails || "");
    setRescheduleRemarks(intv.remarks || "");
    setRescheduleReason("Time adjusted by admin");
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalItem || !rescheduleStart) {
      alert("Please select a date and start time.");
      return;
    }
    rescheduleMutation.mutate({
      id: rescheduleModalItem.id,
      scheduledStart: rescheduleStart,
      durationMinutes: Number(rescheduleDuration) || 45,
      reason: rescheduleReason.trim() || "Time adjusted by admin",
      meetingDetails: rescheduleDetails.trim() || undefined,
      remarks: rescheduleRemarks.trim() || undefined,
    });
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedStatus !== "ALL" ||
    datePreset !== "ALL" ||
    customDate !== "";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("ALL");
    setDatePreset("ALL");
    setCustomDate("");
    setPage(1);
  };

  const formatScheduledTime = (dateStr: string | null, durationMinutes: number) => {
    if (!dateStr) return "Date & Time: TBD";
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })} (${durationMinutes} mins)`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Interviews & Calendar Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scheduled candidate interview slots, venue details, and status updates
          </p>
        </div>

        {meta && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
              <CalendarIcon className="w-3.5 h-3.5" />
              Total Scheduled: {meta.total}
            </span>
          </div>
        )}
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        {/* Row 1: Search & Status Dropdown */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by candidate name, mobile, email, or remarks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shrink-0"
                title="Reset all filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Date Filters & Preset Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> Date:
            </span>

            <button
              type="button"
              onClick={() => {
                setDatePreset("ALL");
                setCustomDate("");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Dates
            </button>

            <button
              type="button"
              onClick={() => {
                setDatePreset("TODAY");
                setCustomDate("");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "TODAY"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => {
                setDatePreset("TOMORROW");
                setCustomDate("");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "TOMORROW"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tomorrow
            </button>

            <button
              type="button"
              onClick={() => {
                setDatePreset("THIS_WEEK");
                setCustomDate("");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "THIS_WEEK"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              This Week
            </button>
          </div>

          {/* Specific Custom Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
              Pick Date:
            </label>
            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDatePreset("CUSTOM");
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-xs"
              />
              {customDate && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomDate("");
                    setDatePreset("ALL");
                    setPage(1);
                  }}
                  className="ml-1 p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Clear date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white border border-slate-200 rounded-xl shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-semibold">Loading scheduled interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No interviews match your filter criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {hasActiveFilters
              ? "Try adjusting your date, search, or status filter to see other scheduled sessions."
              : "No scheduled interview appointments found. Open a candidate profile to schedule an interview."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((intv: any) => {
            const candidate = intv.application?.candidate;
            const jobTitle = intv.application?.jobPosition?.title || "Full-Stack & AI Engineering Internship Program";
            const interviewerName = intv.assignments?.[0]?.interviewer?.fullName || "Jane Doe (Lead Architect)";

            return (
              <div
                key={intv.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs hover:border-slate-300 transition"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Round Type & Status Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm tracking-tight">
                      {intv.roundType?.replace(/_/g, " ")} ({intv.interviewMode || "OFFLINE"})
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] tracking-wide uppercase ${
                        intv.status === "SCHEDULED"
                          ? "bg-indigo-100 text-indigo-800"
                          : intv.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : intv.status === "RESCHEDULED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {intv.status}
                    </span>
                  </div>

                  {/* Candidate Name & Position */}
                  <div className="text-slate-700 font-medium">
                    Candidate:{" "}
                    <Link
                      href={`/candidates/${intv.applicationId}`}
                      className="font-bold text-slate-900 hover:text-blue-600 hover:underline"
                    >
                      {candidate?.fullName || "Candidate"}
                    </Link>{" "}
                    • Position: <span className="text-slate-600">{jobTitle}</span>
                  </div>

                  {/* Scheduled Date/Time & Interviewer Assignment */}
                  <div className="flex items-center gap-4 text-slate-500 text-[11px] flex-wrap">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {formatScheduledTime(intv.scheduledStart, intv.durationMinutes || 45)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      Interviewer: <strong className="text-slate-700 font-medium">{interviewerName}</strong>
                    </span>

                    {/* Candidate Direct Contact Link */}
                    {candidate?.mobileNumber && (
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                        <a href={`tel:${candidate.mobileNumber}`} className="hover:underline">
                          {candidate.mobileNumber}
                        </a>
                      </span>
                    )}
                  </div>

                  {/* Meeting Details / Office Venue Address */}
                  {intv.meetingDetails && (
                    <div className="mt-2 text-slate-700 bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px]">
                      <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{intv.meetingDetails}</span>
                    </div>
                  )}

                  {/* Remark (Highlighted Box matching user screenshot) */}
                  {intv.remarks && (
                    <div className="mt-1.5 text-slate-800 bg-slate-50/90 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px]">
                      <strong className="text-slate-900 font-bold mr-1">Remark:</strong>
                      <span>{intv.remarks}</span>
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Link
                    href={`/candidates/${intv.applicationId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>

                  {intv.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => handleOpenRescheduleModal(intv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-bold text-xs transition"
                      title="Adjust date, time, or venue for this interview"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> Reschedule Slot
                    </button>
                  )}

                  {intv.status === "SCHEDULED" && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(intv)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs transition"
                    >
                      Cancel Slot
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {meta && meta.totalPages > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing{" "}
              <strong>
                {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)}
              </strong>{" "}
              of <strong>{meta.total}</strong> interviews
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-400">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border rounded-md text-xs bg-white text-slate-700 outline-none font-medium"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || isFetching}
              className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              « First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dynamic Page Numbers */}
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    disabled={isFetching}
                    className={`w-7 h-7 rounded-md font-bold text-xs transition ${
                      page === p
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages || isFetching}
              className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(meta.totalPages)}
              disabled={page >= meta.totalPages || isFetching}
              className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Last »
            </button>
          </div>
        </div>
      )}

      {/* Cancel Slot Confirmation Modal */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Cancel Interview Slot</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel the scheduled interview for{" "}
              <strong className="text-slate-900">
                {cancelModalItem.application?.candidate?.fullName || "this candidate"}
              </strong>
              ?
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Candidate requested reschedule, candidate absent, or position filled..."
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalItem(null)}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling...
                    </>
                  ) : (
                    "Confirm Cancellation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Interview Modal */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <CalendarIcon className="w-4 h-4" />
                <span>Reschedule Interview Slot</span>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-bold text-slate-900">
                  {rescheduleModalItem.application?.candidate?.fullName || "Candidate"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Position:</span>
                <span className="font-medium text-slate-800">
                  {rescheduleModalItem.application?.jobPosition?.title || "Internship Program"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Slot:</span>
                <span className="font-semibold text-blue-700">
                  {formatScheduledTime(
                    rescheduleModalItem.scheduledStart,
                    rescheduleModalItem.durationMinutes || 45
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Date & Start Time <span className="text-red-500">*</span>
                  </label>
                  <PremiumDateTimePicker
                    value={rescheduleStart}
                    onChange={setRescheduleStart}
                    placeholder="Select Date & Time (IST)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={rescheduleDuration}
                    onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                    min={15}
                    max={240}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Meeting Details / Office Address
                </label>
                <input
                  type="text"
                  value={rescheduleDetails}
                  onChange={(e) => setRescheduleDetails(e.target.value)}
                  placeholder="Office address or Google Meet link..."
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remark / Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={rescheduleRemarks}
                  onChange={(e) => setRescheduleRemarks(e.target.value)}
                  placeholder="Notes, agenda, or remarks for this slot..."
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Rescheduling
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Adjusted to 11:00 AM, candidate request..."
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRescheduleModalItem(null)}
                  disabled={rescheduleMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                >
                  {rescheduleMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Update Schedule & Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
