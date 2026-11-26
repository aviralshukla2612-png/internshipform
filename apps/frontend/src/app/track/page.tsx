"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Briefcase,
  CheckCircle,
  Clock,
  Calendar,
  Video,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function TrackPage() {
  const [applicationCode, setApplicationCode] = useState("");
  const [contact, setContact] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<{ code: string; contact: string } | null>(null);

  const { data: trackData, isLoading, error } = useQuery({
    queryKey: ["trackApplication", submittedQuery],
    queryFn: () =>
      apiClient("/applications/track", {
        params: {
          code: submittedQuery?.code,
          contact: submittedQuery?.contact,
        },
      }),
    enabled: !!submittedQuery,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (applicationCode.trim() && contact.trim()) {
      setSubmittedQuery({
        code: applicationCode.trim(),
        contact: contact.trim(),
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-xs">Application Submitted</span>;
      case "UNDER_REVIEW":
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold text-xs">Under HR Review</span>;
      case "SHORTLISTED":
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold text-xs">Shortlisted for Next Round</span>;
      case "INTERVIEW_SCHEDULED":
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-semibold text-xs">Interview Scheduled</span>;
      case "INTERVIEW_IN_PROGRESS":
        return <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full font-semibold text-xs">Interview In Progress</span>;
      case "SELECTED":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-xs">Selected / Offer Extended</span>;
      case "REJECTED":
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-semibold text-xs">Not Shortlisted</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full font-semibold text-xs">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shadow-md shrink-0">
              <img
                src="/logo.webp"
                alt="Emperor Smart Solutions"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Emperor <span className="text-blue-600">Smart Solutions</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                Internship Portal
              </span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600">
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Track Your Application</h1>
          <p className="mt-2 text-slate-600 text-sm">
            Enter your Application ID along with your registered Email or Mobile Number.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Application Reference ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APP-20261120-XXXX"
                value={applicationCode}
                onChange={(e) => setApplicationCode(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Registered Email or Mobile
              </label>
              <input
                type="text"
                required
                placeholder="e.g. candidate@example.com or 9876543210"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Records...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Check Real-Time Status
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Display */}
        {error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="font-semibold text-sm">{(error as any)?.message || "No application found matching these details."}</p>
            <p className="text-xs text-red-600 mt-1">Please verify your Application ID and registered email or phone.</p>
          </div>
        ) : trackData ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                  Application ID: {trackData.applicationCode}
                </p>
                <h2 className="text-xl font-bold mt-1">{trackData.candidateName}</h2>
                <p className="text-sm text-slate-300">
                  Applied for: <strong>{trackData.jobTitle}</strong> ({trackData.department})
                </p>
              </div>
              <div>{getStatusBadge(trackData.currentStatus)}</div>
            </div>

            {/* Interviews Scheduled Card */}
            {trackData.interviews && trackData.interviews.length > 0 && (
              <div className="p-6 border-b bg-indigo-50/50">
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-indigo-600" /> Scheduled Interview Rounds
                </h3>
                <div className="space-y-3">
                  {trackData.interviews.map((intv: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-slate-900">
                          {intv.roundType.replace("_", " ")} ({intv.interviewMode})
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium">
                          {intv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {intv.scheduledStart ? (
                          <>
                            {new Date(intv.scheduledStart).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })} ({intv.durationMinutes} mins)
                          </>
                        ) : (
                          <span>Date & Time to be confirmed</span>
                        )}
                      </p>
                      {intv.meetingDetails && (
                        <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          <span>Meeting / Location: {intv.meetingDetails}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History Timeline */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" /> Activity History Timeline
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {trackData.statusHistory?.map((hist: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {hist.newStatus.replace("_", " ")}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(hist.createdAt)}</p>
                      {hist.reason && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                          {hist.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
