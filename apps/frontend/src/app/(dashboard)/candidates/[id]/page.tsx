"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  User,
  GraduationCap,
  Briefcase,
  FileText,
  Calendar,
  MessageSquare,
  Clock,
  Download,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Video,
  ChevronLeft,
  ShieldCheck,
  Phone,
  Mail,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  Save,
  MessageCircle,
} from "lucide-react";
import {
  ApplicationStatus,
  InterviewRoundType,
  InterviewMode,
} from "@recruitment/shared";
import { PremiumDateTimePicker } from "@/components/ui/premium-date-time-picker";

const DEFAULT_OFFICE_ADDRESS =
  "202, Shitiratna Complex, Panchvati, Navrangpura, Ahmedabad - 380009, Gujarat, India";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // New Note State
  const [newNote, setNewNote] = useState("");

  // Schedule Interview Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleRound, setScheduleRound] = useState<InterviewRoundType>(InterviewRoundType.HR_ROUND);
  const [scheduleMode, setScheduleMode] = useState<InterviewMode>(InterviewMode.OFFLINE);
  const [scheduledStart, setScheduledStart] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState("");
  const [meetingDetails, setMeetingDetails] = useState(DEFAULT_OFFICE_ADDRESS);
  const [instructions, setInstructions] = useState(
    "Please report to the office 10 minutes before the scheduled time with your original credentials.",
  );
  const [remarks, setRemarks] = useState("");
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [pendingOpenWhatsApp, setPendingOpenWhatsApp] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["candidateDetail", id],
    queryFn: () => apiClient(`/applications/${id}`),
    enabled: !!id,
  });

  const { data: interviewers } = useQuery({
    queryKey: ["interviewersList"],
    queryFn: () => apiClient("/auth/users"),
  });

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: (note: string) =>
      apiClient(`/applications/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["candidateDetail", id] });
    },
  });

  // Schedule Interview Mutation with Conflict Engine & Direct WhatsApp Web/App Trigger
  const scheduleMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/interviews/schedule", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_res: any, variables: any) => {
      setIsScheduleModalOpen(false);
      setConflictError(null);
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["candidateDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });

      // Only open WhatsApp Web / App if user chose "Schedule & Open WhatsApp"
      if (variables?.openWhatsApp) {
        const rawWa = candidate?.whatsappNumber || candidate?.mobileNumber || "";
        const cleanWa = rawWa.replace(/\D/g, "");
        const waNumberWithCode = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;

        const formattedStartDate = scheduledStart
          ? new Date(scheduledStart).toLocaleString("en-IN", {
              dateStyle: "full",
              timeStyle: "short",
            })
          : "Scheduled Date & Time";

        const roundLabel = scheduleRound.replace(/_/g, " ");
        const modeLabel =
          scheduleMode === InterviewMode.OFFLINE
            ? "Offline (In-Person at Office)"
            : scheduleMode;

        const remarksSection = remarks.trim() ? `\n📌 Remarks: ${remarks.trim()}` : "";

        const messageText = `Hello ${candidate?.fullName || "Candidate"}! 👋

Greetings from Emperor Smart Solutions.

Your interview has been successfully scheduled:
📅 Date & Time: ${formattedStartDate}
🎯 Round: ${roundLabel}
🏢 Mode: ${modeLabel}
📍 Venue / Address: ${meetingDetails || DEFAULT_OFFICE_ADDRESS}
📝 Instructions: ${instructions || "Please report on time with your original credentials."}${remarksSection}

Please confirm your attendance by replying to this message.

Best regards,
HR & Recruitment Team
Emperor Smart Solutions`;

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${waNumberWithCode}&text=${encodeURIComponent(messageText)}`;

        // Open in WhatsApp Web / App directly
        const win = window.open(whatsappUrl, "_blank");
        if (!win) {
          window.location.href = whatsappUrl;
        }
      }
    },
    onError: (err: any) => {
      setConflictError(
        err.message || "Failed to schedule interview. Please check the start date and try again.",
      );
    },
  });

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: ApplicationStatus; reason: string }) =>
      apiClient(`/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidateDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });

  // WhatsApp Trigger Mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: (interviewId: string) =>
      apiClient("/whatsapp/send-interview-invite", {
        method: "POST",
        body: JSON.stringify({ interviewId }),
      }),
    onSuccess: (res: any) => {
      if (res.skipped) {
        alert(`WhatsApp notification skipped: ${res.reason}`);
      } else {
        alert("WhatsApp invitation dispatched successfully via Meta Cloud API!");
      }
      queryClient.invalidateQueries({ queryKey: ["candidateDetail", id] });
    },
  });

  // Delete Application Mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiClient(`/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicationsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      router.push("/applications");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading candidate profile...</p>
      </div>
    );
  }

  if (!app) {
    return <div className="p-8 text-center text-slate-500">Candidate application record not found.</div>;
  }

  const candidate = app.candidate;

  const handleScheduleSubmit = (e?: React.FormEvent, openWhatsApp: boolean = false) => {
    if (e) e.preventDefault();
    setConflictError(null);

    if (!scheduledStart) {
      setConflictError("Please select a date and start time for the interview.");
      return;
    }

    setPendingOpenWhatsApp(openWhatsApp);

    scheduleMutation.mutate({
      applicationId: app.id,
      roundType: scheduleRound,
      interviewMode: scheduleMode,
      scheduledStart,
      durationMinutes: Number(durationMinutes) || 45,
      interviewerId: selectedInterviewerId || interviewers?.[0]?.id || "",
      meetingDetails: meetingDetails || DEFAULT_OFFICE_ADDRESS,
      instructions,
      remarks,
      openWhatsApp,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Profile Photo & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          {candidate.profilePhotoDocId ? (
            <img
              src={`/api/v1/documents/view/${candidate.profilePhotoDocId}`}
              alt={candidate.fullName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md shrink-0 bg-slate-100"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-2xl border-2 border-blue-200 shrink-0">
              {candidate.fullName ? candidate.fullName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div>
            <Link href="/applications" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mb-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to applications table
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{candidate.fullName}</h1>
              <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-bold">
                {app.applicationCode}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {app.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Applied for <strong>{app.jobPosition?.title || "Full-Stack & AI Engineering Internship Program"}</strong> • Applied on {formatDate(app.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
          >
            <Calendar className="w-4 h-4" /> Schedule Interview
          </button>

          <button
            onClick={() =>
              updateStatusMutation.mutate({
                status: ApplicationStatus.SHORTLISTED,
                reason: "Shortlisted from candidate profile",
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition"
          >
            <CheckCircle className="w-4 h-4" /> Shortlist
          </button>

          <button
            onClick={() =>
              updateStatusMutation.mutate({
                status: ApplicationStatus.REJECTED,
                reason: "Rejected from candidate profile",
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>

          {app.status === ApplicationStatus.SHORTLISTED || app.status === ApplicationStatus.REJECTED ? (
            <button
              onClick={() =>
                updateStatusMutation.mutate({
                  status: ApplicationStatus.NEW,
                  reason: "Status undone by admin from candidate profile",
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition"
            >
              <RotateCcw className="w-4 h-4" /> Undo Status (Reset to New)
            </button>
          ) : null}

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm transition"
          >
            <Trash2 className="w-4 h-4" /> Delete Candidate
          </button>
        </div>
      </div>

      {/* Main Direct 1-Page Layout (No Tabs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Candidate Details, Education, Interview & Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Personal & Contact Profile */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Candidate Profile & Contact
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">WhatsApp / Contact Number</span>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-slate-900 font-mono font-bold text-sm">
                    {candidate.whatsappNumber || candidate.mobileNumber || "N/A"}
                  </p>
                  {(candidate.whatsappNumber || candidate.mobileNumber) && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=91${(candidate.whatsappNumber || candidate.mobileNumber).replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 transition"
                    >
                      <Phone className="w-3 h-3" /> Chat on WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Email Address</span>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-slate-900 font-medium">{candidate.email}</p>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 transition"
                  >
                    <Mail className="w-3 h-3" /> Send Email
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Gender</span>
                  <p className="text-slate-900 font-bold mt-0.5 text-blue-700">{candidate.gender}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Date of Birth</span>
                  <p className="text-slate-900 font-medium mt-0.5">{formatDate(candidate.dateOfBirth)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Education Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" /> Educational Qualifications
            </h3>

            {candidate.educations?.length > 0 ? (
              candidate.educations.map((edu: any) => (
                <div key={edu.id} className="p-3.5 bg-slate-50 border rounded-xl space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">{edu.degreeName}</h4>
                  <p className="text-slate-600">{edu.institutionName}</p>
                  <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1">
                    <span>University: {edu.universityOrBoard || "University / Board"}</span>
                    <span>Passing Year: <strong className="text-slate-900">{edu.passingYear}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-slate-400 text-center bg-slate-50 rounded-xl">
                No formal education entries recorded.
              </div>
            )}
          </div>

          {/* Interview History & Direct Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Interview Status
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule New
              </button>
            </div>

            {app.interviews?.length > 0 ? (
              app.interviews.map((intv: any) => (
                <div key={intv.id} className="p-4 border rounded-xl bg-slate-50 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">
                      {intv.roundType?.replace(/_/g, " ")} ({intv.interviewMode})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                      {intv.status}
                    </span>
                  </div>

                  <p className="text-slate-600">
                    <strong>Date & Time:</strong> {new Date(intv.scheduledStart).toLocaleString()} ({intv.durationMinutes} mins)
                  </p>

                  <div className="bg-white p-2.5 rounded border text-slate-700 text-[11px] space-y-1">
                    <p><strong>Venue / Address:</strong> {intv.meetingDetails}</p>
                    {intv.instructions && <p className="text-slate-500"><strong>Instructions:</strong> {intv.instructions}</p>}
                    {intv.remarks && (
                      <p className="text-blue-700 bg-blue-50/70 p-1.5 rounded border border-blue-100">
                        <strong>Remarks:</strong> {intv.remarks}
                      </p>
                    )}
                  </div>

                  <div className="pt-1">
                    <a
                      href={`https://api.whatsapp.com/send?phone=91${(candidate?.whatsappNumber || candidate?.mobileNumber || "").replace(/\D/g, "")}&text=${encodeURIComponent(
                        `Hello ${candidate?.fullName}! 👋 Greetings from Emperor Smart Solutions. Your interview is scheduled for ${new Date(intv.scheduledStart).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })} (${intv.roundType?.replace(/_/g, " ")}). Venue: ${intv.meetingDetails}. Instructions: ${intv.instructions || "Please report on time with your credentials."}${intv.remarks ? ` Remarks: ${intv.remarks}` : ""}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition w-full justify-center"
                    >
                      <Send className="w-3.5 h-3.5" /> Resend Interview Details on WhatsApp
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No interview scheduled yet. Click "Schedule Interview" to set date & venue.
              </div>
            )}
          </div>

          {/* Internal HR Notes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Internal HR Notes
            </h3>

            <div className="space-y-2">
              {app.notes?.map((n: any) => (
                <div key={n.id} className="p-2.5 bg-slate-50 border rounded-lg text-xs space-y-0.5">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span className="font-bold text-slate-700">{n.author?.fullName || "HR Admin"}</span>
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-slate-800">{n.note}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-2">
              <textarea
                rows={2}
                placeholder="Add confidential candidate evaluation notes..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                disabled={!newNote.trim() || addNoteMutation.isPending}
                onClick={() => addNoteMutation.mutate(newNote)}
                className="w-full py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Save Internal Note
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Profile Photo Preview & Direct Resume PDF Reader */}
        <div className="lg:col-span-7 space-y-6">
          {/* PROFILE PHOTO CARD */}
          {candidate.profilePhotoDocId && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" /> Candidate Profile Photograph
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/v1/documents/view/${candidate.profilePhotoDocId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Full Size
                  </a>
                  <a
                    href={`/api/v1/documents/download/${candidate.profilePhotoDocId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <img
                  src={`/api/v1/documents/view/${candidate.profilePhotoDocId}`}
                  alt={`${candidate.fullName} profile photograph`}
                  className="max-h-72 w-auto rounded-xl object-contain shadow-md border"
                />
              </div>
            </div>
          )}

          {/* RESUME / CV DOCUMENT PREVIEW CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Candidate Resume / CV (PDF)
                </h3>
                {app.resumeDocId && (
                  <span className="text-[10px] text-slate-400 font-mono">Storage ID: {app.resumeDocId}</span>
                )}
              </div>

              {app.resumeDocId && (
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/v1/documents/view/${app.resumeDocId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                  </a>
                  <a
                    href={`/api/v1/documents/download/${app.resumeDocId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                </div>
              )}
            </div>

            {/* LIVE INLINE EMBEDDED RESUME PREVIEW */}
            {app.resumeDocId ? (
              <div className="space-y-2">
                <iframe
                  src={`/api/v1/documents/view/${app.resumeDocId}#toolbar=0`}
                  title="Candidate Resume Preview"
                  className="w-full h-[420px] sm:h-[600px] lg:h-[700px] rounded-xl border border-slate-200 shadow-inner bg-slate-50"
                />
                <p className="text-[11px] text-slate-400 text-center">
                  Live Resume Preview • If the PDF preview doesn't render in your browser, click "Open in New Tab" or "Download PDF" above.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                No Resume document attached to this application record.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE INTERVIEW MODAL WITH CONFLICT ENGINE */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Schedule Interview for {candidate.fullName}
            </h3>

            {conflictError && (
              <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleScheduleSubmit(e, false)} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Round</label>
                  <select
                    value={scheduleRound}
                    onChange={(e) => setScheduleRound(e.target.value as InterviewRoundType)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value={InterviewRoundType.HR_ROUND}>HR Round</option>
                    <option value={InterviewRoundType.TECHNICAL_ROUND}>Technical Round</option>
                    <option value={InterviewRoundType.MANAGERIAL_ROUND}>Managerial Round</option>
                    <option value={InterviewRoundType.FINAL_ROUND}>Final Round</option>
                    <option value={InterviewRoundType.CUSTOM_ROUND}>Custom Round</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mode</label>
                  <select
                    value={scheduleMode}
                    onChange={(e) => {
                      const mode = e.target.value as InterviewMode;
                      setScheduleMode(mode);
                      if (mode === InterviewMode.OFFLINE) {
                        setMeetingDetails(DEFAULT_OFFICE_ADDRESS);
                        setInstructions(
                          "Please report to the office 10 minutes before the scheduled time with your original credentials.",
                        );
                      } else if (mode === InterviewMode.ONLINE) {
                        setMeetingDetails("Google Meet: https://meet.google.com/ess-interview");
                        setInstructions("Please join with video enabled and screen sharing ready.");
                      } else if (mode === InterviewMode.TELEPHONIC) {
                        setMeetingDetails(`Telephonic Discussion - Candidate Mobile: ${candidate.whatsappNumber || candidate.mobileNumber}`);
                        setInstructions("Our HR team will call you on your registered mobile number.");
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value={InterviewMode.OFFLINE}>Offline (In-Person)</option>
                    <option value={InterviewMode.ONLINE}>Online (Video)</option>
                    <option value={InterviewMode.TELEPHONIC}>Telephonic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date & Start Time <span className="text-red-500">*</span>
                  </label>
                  <PremiumDateTimePicker
                    value={scheduledStart}
                    onChange={setScheduledStart}
                    placeholder="Select Date & Start Time"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Meeting Details / Office Address <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMeetingDetails(DEFAULT_OFFICE_ADDRESS)}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Reset to Office Address
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={meetingDetails}
                  onChange={(e) => setMeetingDetails(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Corporate Office: {DEFAULT_OFFICE_ADDRESS}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Please report to the office 10 minutes before the scheduled time with original documents."
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remark / Internal Notes <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any specific remarks, candidate discussion points, or agenda for this interview..."
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel
                </button>

                {/* Button 1: Save in admin system only - Does NOT open WhatsApp */}
                <button
                  type="button"
                  onClick={(e) => handleScheduleSubmit(e, false)}
                  disabled={scheduleMutation.isPending}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                  title="Save interview details in admin portal without launching WhatsApp"
                >
                  <Save className="w-3.5 h-3.5" />
                  {scheduleMutation.isPending && !pendingOpenWhatsApp ? "Saving..." : "Save (Admin Only)"}
                </button>

                {/* Button 2: Save and automatically open WhatsApp with invite */}
                <button
                  type="button"
                  onClick={(e) => handleScheduleSubmit(e, true)}
                  disabled={scheduleMutation.isPending}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                  title="Save interview details and launch WhatsApp with candidate invitation"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {scheduleMutation.isPending && pendingOpenWhatsApp ? "Scheduling..." : "Schedule & Open WhatsApp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Candidate Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-rose-100 animate-in fade-in duration-150 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Candidate Application</h3>
                <p className="text-xs text-slate-500">Permanent record removal</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-bold text-slate-900">{candidate.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App ID:</span>
                <span className="font-mono font-bold text-slate-800">{app.applicationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Position:</span>
                <span className="font-medium text-slate-800">{app.jobPosition?.title || "N/A"}</span>
              </div>
            </div>

            <p className="text-xs text-rose-600 font-medium">
              Are you sure you want to delete this candidate application? All notes, interview records, and files associated with this application will be permanently removed.
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
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
    </div>
  );
}
