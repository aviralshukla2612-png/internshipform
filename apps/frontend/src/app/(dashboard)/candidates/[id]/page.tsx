"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
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
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    | "personal"
    | "education"
    | "experience"
    | "documents"
    | "interviews"
    | "notes"
    | "communications"
    | "timeline"
  >("personal");

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
  const [conflictError, setConflictError] = useState<string | null>(null);

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

  // Schedule Interview Mutation with Conflict Engine
  const scheduleMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/interviews/schedule", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setIsScheduleModalOpen(false);
      setConflictError(null);
      queryClient.invalidateQueries({ queryKey: ["candidateDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
    onError: (err: any) => {
      setConflictError(err.message || "Failed to schedule interview due to scheduling conflict.");
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading candidate profile & 8-tab record...</p>
      </div>
    );
  }

  if (!app) {
    return <div className="p-8 text-center text-slate-500">Candidate application record not found.</div>;
  }

  const candidate = app.candidate;

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const interviewerId = selectedInterviewerId || interviewers?.[0]?.id;
    if (!interviewerId) {
      setConflictError("Please select an interviewer.");
      return;
    }

    scheduleMutation.mutate({
      applicationId: app.id,
      roundType: scheduleRound,
      interviewMode: scheduleMode,
      scheduledStart,
      durationMinutes: Number(durationMinutes),
      interviewerId,
      meetingDetails,
      instructions,
    });
  };

  const tabs = [
    { key: "personal", label: "1. Personal Details", icon: User },
    { key: "education", label: "2. Education", icon: GraduationCap },
    { key: "experience", label: "3. Work Experience", icon: Briefcase },
    { key: "documents", label: "4. Documents", icon: FileText },
    { key: "interviews", label: "5. Interview History", icon: Calendar },
    { key: "notes", label: "6. Internal Notes", icon: MessageSquare },
    { key: "communications", label: "7. Communications", icon: Send },
    { key: "timeline", label: "8. Activity Timeline", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <Link href="/applications" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mb-2">
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
            Applied for <strong>{app.jobPosition.title}</strong> ({app.jobPosition.department}) • Applied on {formatDate(app.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
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
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition"
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
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>

      {/* 8-Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-2 bg-white px-4 pt-3 rounded-xl shadow-xs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-1.5 transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* TAB 1: PERSONAL DETAILS */}
        {activeTab === "personal" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Personal & Contact Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Full Name</span>
                <p className="text-slate-900 font-bold mt-1 text-sm">{candidate.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Father's Name</span>
                <p className="text-slate-900 font-medium mt-1">{candidate.fatherName}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Mother's Name</span>
                <p className="text-slate-900 font-medium mt-1">{candidate.motherName}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Gender (Mandatory Field)</span>
                <p className="text-slate-900 font-bold mt-1 text-blue-800">{candidate.gender}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Date of Birth</span>
                <p className="text-slate-900 font-medium mt-1">{formatDate(candidate.dateOfBirth)}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Email Address</span>
                <p className="text-slate-900 font-medium mt-1">{candidate.email}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Mobile Number</span>
                <p className="text-slate-900 font-mono font-medium mt-1">{candidate.mobileNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">WhatsApp Number</span>
                <p className="text-slate-900 font-mono font-medium mt-1">{candidate.whatsappNumber}</p>
              </div>
            </div>

            {/* Address Records */}
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 pt-4">Addresses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {candidate.addresses?.map((addr: any) => (
                <div key={addr.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 block mb-1">
                    {addr.type} Address
                  </span>
                  <p className="font-semibold text-slate-900">{addr.street}</p>
                  <p className="text-slate-600">{addr.city}, {addr.state} - {addr.pinCode}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{addr.country}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EDUCATION */}
        {activeTab === "education" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Educational Qualifications</h3>
            {candidate.educations?.map((edu: any) => (
              <div key={edu.id} className="p-4 bg-slate-50 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {edu.qualificationType.replace("_", " ")}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{edu.degreeName}</h4>
                  <p className="text-slate-600">{edu.institutionName} • {edu.universityOrBoard}</p>
                  {edu.specialization && <p className="text-slate-500 mt-0.5">Specialization: {edu.specialization}</p>}
                </div>

                <div className="text-right sm:border-l sm:pl-6 space-y-1">
                  <div className="text-slate-500">Year of Passing: <strong>{edu.passingYear}</strong></div>
                  {edu.percentage && (
                    <div className="font-bold text-blue-900">Percentage: {edu.percentage}%</div>
                  )}
                  {edu.cgpa && <div className="text-slate-700">CGPA: {edu.cgpa}</div>}
                  {edu.totalMarks && edu.obtainedMarks && (
                    <div className="text-[10px] text-slate-400">
                      Marks: {edu.obtainedMarks} / {edu.totalMarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: WORK EXPERIENCE */}
        {activeTab === "experience" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Professional Experience</h3>
              <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold">
                Status: {app.isFresher ? "Fresher" : "Experienced"}
              </span>
            </div>

            {app.isFresher ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
                Candidate applied as a Fresher with no prior corporate employment records.
              </div>
            ) : candidate.experiences?.length > 0 ? (
              candidate.experiences.map((exp: any) => (
                <div key={exp.id} className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{exp.designation}</h4>
                      <p className="text-slate-700 font-semibold">{exp.companyName} ({exp.department})</p>
                      <p className="text-slate-500">{exp.companyAddress}</p>
                    </div>
                    <span className="text-slate-500 text-right">
                      {formatDate(exp.joiningDate)} &rarr; {exp.currentlyWorking ? "Present" : formatDate(exp.leavingDate)}
                    </span>
                  </div>

                  {exp.jobResponsibilities && (
                    <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-200 mt-2">
                      {exp.jobResponsibilities}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    {exp.lastDrawnSalary && <span>Last Drawn: {formatCurrency(exp.lastDrawnSalary)}</span>}
                    {exp.reasonForLeaving && <span>Reason for Leaving: {exp.reasonForLeaving}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-slate-500">No experience records attached.</div>
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center justify-between">
              <span>Candidate Submitted Documents</span>
              <span className="text-xs text-slate-500 font-normal">Stored privately • Tokenized download link</span>
            </h3>

            {/* Resume */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-900 block">Resume / Curriculum Vitae</span>
                <span className="text-[11px] text-blue-700 font-mono">Storage Key: {app.resumeDocId}</span>
              </div>
              <a
                href={`http://localhost:4000/api/v1/documents/download/${app.resumeDocId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
            </div>

            {/* Uploaded Documents List */}
            {candidate.documents?.map((doc: any) => (
              <div key={doc.id} className="p-4 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{doc.documentType.replace("_", " ")}</span>
                  <span className="text-slate-500">{doc.originalFileName} ({(doc.fileSizeBytes / 1024).toFixed(0)} KB)</span>
                  <div className="text-[10px] text-slate-400 font-mono">Signature: {doc.fileSignatureHex}</div>
                </div>
                <a
                  href={`http://localhost:4000/api/v1/documents/download/${doc.storageKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-100 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: INTERVIEW HISTORY */}
        {activeTab === "interviews" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Scheduled & Completed Interview Rounds</h3>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule New Round
              </button>
            </div>

            {app.interviews?.length > 0 ? (
              app.interviews.map((intv: any) => (
                <div key={intv.id} className="p-5 border rounded-xl bg-slate-50 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {intv.roundType.replace("_", " ")} ({intv.interviewMode})
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        {new Date(intv.scheduledStart).toLocaleString()} ({intv.durationMinutes} mins)
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                      {intv.status}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded border text-slate-700">
                    <p><strong>Location / Video Link:</strong> {intv.meetingDetails}</p>
                    {intv.instructions && <p className="mt-1 text-slate-500"><strong>Instructions:</strong> {intv.instructions}</p>}
                  </div>

                  {/* Interviewer assignments */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-slate-600">
                      <strong>Assigned Interviewer:</strong>{" "}
                      {intv.assignments?.[0]?.interviewer?.fullName || "Unassigned"}
                    </div>

                    <button
                      onClick={() => sendWhatsAppMutation.mutate(intv.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Trigger WhatsApp Invite
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No interviews scheduled yet. Click "Schedule Interview" to assign an interviewer.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: INTERNAL NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Internal HR Evaluation Notes</h3>

            <div className="space-y-3">
              {app.notes?.map((n: any) => (
                <div key={n.id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span className="font-bold text-slate-700">{n.author.fullName}</span>
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-slate-800">{n.note}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Add Confidential Note</label>
              <textarea
                rows={3}
                placeholder="Type internal candidate evaluation notes here (visible only to HR and Interviewers)..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                disabled={!newNote.trim() || addNoteMutation.isPending}
                onClick={() => addNoteMutation.mutate(newNote)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                Save Internal Note
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: COMMUNICATIONS */}
        {activeTab === "communications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3">WhatsApp Message History</h3>
              {app.whatsAppMessages?.length > 0 ? (
                <div className="space-y-2">
                  {app.whatsAppMessages.map((msg: any) => (
                    <div key={msg.id} className="p-3 border rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{msg.messageType}</span>
                        <p className="text-slate-500">To: {msg.recipientNumber} • Template: {msg.templateName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {msg.deliveryStatus}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No WhatsApp messages dispatched for this application.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3">Transactional Email Logs</h3>
              {app.emailLogs?.length > 0 ? (
                <div className="space-y-2">
                  {app.emailLogs.map((mail: any) => (
                    <div key={mail.id} className="p-3 border rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{mail.subject}</span>
                        <p className="text-slate-500">Recipient: {mail.recipient}</p>
                      </div>
                      <span className="text-slate-400 text-[10px]">{formatDate(mail.sentAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No email records found.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: ACTIVITY TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Application Lifecycle Audit Trail</h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {app.statusHistory?.map((hist: any) => (
                <div key={hist.id} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{hist.newStatus.replace("_", " ")}</span>
                    <span className="text-[11px] text-slate-400">{new Date(hist.createdAt).toLocaleString()}</span>
                  </div>
                  {hist.changedBy && (
                    <p className="text-[11px] text-slate-500">Action taken by: {hist.changedBy.fullName}</p>
                  )}
                  {hist.reason && (
                    <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                      {hist.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE INTERVIEW MODAL WITH CONFLICT ENGINE */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border">
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

            <form onSubmit={handleScheduleSubmit} className="space-y-4 mt-4 text-xs">
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
                        setMeetingDetails(`Telephonic Discussion - Candidate Mobile: ${candidate.mobileNumber}`);
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
                <label className="block font-semibold text-slate-700 mb-1">Assign Interviewer</label>
                <select
                  value={selectedInterviewerId}
                  onChange={(e) => setSelectedInterviewerId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">-- Choose Assigned Interviewer --</option>
                  {interviewers?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.designation || u.email})
                    </option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {scheduleMutation.isPending ? "Validating Conflicts..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
