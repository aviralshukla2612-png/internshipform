"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function InterviewsPage() {
  const queryClient = useQueryClient();

  const [startDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  });
  const [endDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString();
  });

  const { data: interviews, isLoading } = useQuery({
    queryKey: ["interviewsCalendar", startDate, endDate],
    queryFn: () =>
      apiClient("/interviews/calendar", {
        params: { startDate, endDate },
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient(`/interviews/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewsCalendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interviews & Calendar Schedule</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conflict-free multi-round interviewer schedules, Google Meet links, and status updates
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs">Loading calendar events...</p>
        </div>
      ) : !interviews || interviews.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
          No scheduled interview appointments found. Open a candidate profile to schedule an interview.
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((intv: any) => (
            <div
              key={intv.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {intv.roundType.replace("_", " ")} ({intv.interviewMode})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      intv.status === "SCHEDULED"
                        ? "bg-indigo-100 text-indigo-800"
                        : intv.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {intv.status}
                  </span>
                </div>

                <div className="text-slate-600">
                  Candidate: <strong>{intv.application.candidate.fullName}</strong> • Position: {intv.application.jobPosition.title}
                </div>

                <div className="flex items-center gap-4 text-slate-500 text-[11px] flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {new Date(intv.scheduledStart).toLocaleString()} ({intv.durationMinutes} mins)
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    Interviewer: {intv.assignments?.[0]?.interviewer?.fullName || "Unassigned"}
                  </span>
                </div>

                {intv.meetingDetails && (
                  <div className="mt-2 text-blue-700 bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    <span>{intv.meetingDetails}</span>
                  </div>
                )}

                {intv.remarks && (
                  <div className="mt-1.5 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded text-[11px]">
                    <span className="font-semibold text-slate-900">Remark:</span> {intv.remarks}
                  </div>
                )}
              </div>

              {intv.status === "SCHEDULED" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const reason = prompt("Enter cancellation reason:");
                      if (reason) {
                        cancelMutation.mutate({ id: intv.id, reason });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold"
                  >
                    Cancel Slot
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
