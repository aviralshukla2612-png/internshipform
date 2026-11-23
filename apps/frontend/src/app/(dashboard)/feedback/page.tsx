"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  UserCheck,
  Star,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { InterviewRecommendation } from "@recruitment/shared";

export default function FeedbackPage() {
  const queryClient = useQueryClient();

  const [selectedInterviewId, setSelectedInterviewId] = useState("");
  const [technicalRating, setTechnicalRating] = useState(4);
  const [communicationRating, setCommunicationRating] = useState(4);
  const [problemSolvingRating, setProblemSolvingRating] = useState(4);
  const [experienceRating, setExperienceRating] = useState(4);
  const [overallRating, setOverallRating] = useState(4);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [recommendation, setRecommendation] = useState<InterviewRecommendation>(
    InterviewRecommendation.RECOMMENDED,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: interviews, isLoading } = useQuery({
    queryKey: ["activeInterviewsForFeedback"],
    queryFn: () =>
      apiClient("/interviews/calendar", {
        params: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient("/interview-feedback", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setSuccessMessage("Scorecard submitted successfully! Submitted feedback is now locked against alteration.");
      setStrengths("");
      setWeaknesses("");
      setInterviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterviewId) {
      alert("Please select an interview round.");
      return;
    }

    submitFeedbackMutation.mutate({
      interviewId: selectedInterviewId,
      technicalRating: Number(technicalRating),
      communicationRating: Number(communicationRating),
      problemSolvingRating: Number(problemSolvingRating),
      experienceRating: Number(experienceRating),
      overallRating: Number(overallRating),
      strengths,
      weaknesses,
      interviewNotes,
      recommendation,
    });
  };

  const renderStarInput = (label: string, value: number, onChange: (val: number) => void) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl">
      <span className="font-semibold text-xs text-slate-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onChange(star)}
            className={`p-1 rounded transition ${star <= value ? "text-amber-500" : "text-slate-300"}`}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
        <span className="ml-2 font-bold text-xs text-slate-800 w-4">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interview Evaluation Scorecard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit official rating dimensions, strengths, and hiring recommendations (immutable audit lock upon submission)
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Candidate Interview Round <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedInterviewId}
              onChange={(e) => setSelectedInterviewId(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg bg-white"
            >
              <option value="">-- Choose scheduled interview --</option>
              {interviews?.map((intv: any) => (
                <option key={intv.id} value={intv.id}>
                  {intv.application.candidate.fullName} - {intv.roundType} ({intv.scheduledStart ? new Date(intv.scheduledStart).toLocaleDateString() : "Date TBD"})
                </option>
              ))}
            </select>
          </div>

          {/* 5 Rating Matrices */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 border-b pb-1">Rating Dimensions (1 to 5)</h3>
            {renderStarInput("1. Technical Knowledge & Mastery", technicalRating, setTechnicalRating)}
            {renderStarInput("2. Communication & Articulation", communicationRating, setCommunicationRating)}
            {renderStarInput("3. Problem Solving & Critical Thinking", problemSolvingRating, setProblemSolvingRating)}
            {renderStarInput("4. Relevant Domain Experience", experienceRating, setExperienceRating)}
            {renderStarInput("5. Overall Fit & Caliber", overallRating, setOverallRating)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Key Strengths</label>
              <textarea
                rows={3}
                required
                placeholder="Observed strengths, good answers..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Weaknesses / Areas of Improvement</label>
              <textarea
                rows={3}
                required
                placeholder="Gaps in knowledge, concerns..."
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Interview Notes</label>
            <textarea
              rows={3}
              required
              placeholder="Question summary, coding performance, architectural discussions..."
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hiring Recommendation</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as InterviewRecommendation)}
              className="w-full px-3 py-2.5 border rounded-lg font-bold"
            >
              <option value={InterviewRecommendation.STRONGLY_RECOMMENDED}>Strongly Recommended</option>
              <option value={InterviewRecommendation.RECOMMENDED}>Recommended</option>
              <option value={InterviewRecommendation.HOLD}>Hold (Needs Further Evaluation)</option>
              <option value={InterviewRecommendation.NOT_RECOMMENDED}>Not Recommended</option>
            </select>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={submitFeedbackMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitFeedbackMutation.isPending ? "Locking & Submitting..." : "Lock & Submit Evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
