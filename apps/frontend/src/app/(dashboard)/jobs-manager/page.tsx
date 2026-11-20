"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Briefcase,
  Plus,
  Copy,
  Check,
  Edit,
  ExternalLink,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";
import { JobStatus, EmploymentType } from "@recruitment/shared";

export default function JobsManagerPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredQualification, setRequiredQualification] = useState("B.Tech / B.E. / MCA or equivalent");
  const [requiredSkills, setRequiredSkills] = useState("React, Node.js, TypeScript");
  const [experienceMinYears, setExperienceMinYears] = useState(2);
  const [openingsCount, setOpeningsCount] = useState(2);
  const [jobLocation, setJobLocation] = useState("Bengaluru / Hybrid");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(EmploymentType.FULL_TIME);
  const [salaryMin, setSalaryMin] = useState(1200000);
  const [salaryMax, setSalaryMax] = useState(2000000);
  const [status, setStatus] = useState<JobStatus>(JobStatus.PUBLISHED);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobsManagerList"],
    queryFn: () => apiClient("/jobs"),
  });

  const createJobMutation = useMutation({
    mutationFn: (newJob: any) =>
      apiClient("/jobs", {
        method: "POST",
        body: JSON.stringify(newJob),
      }),
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["jobsManagerList"] });
      queryClient.invalidateQueries({ queryKey: ["publicJobs"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createJobMutation.mutate({
      title,
      department,
      jobDescription,
      requiredQualification,
      requiredSkills: requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      experienceMinYears: Number(experienceMinYears),
      openingsCount: Number(openingsCount),
      jobLocation,
      employmentType,
      salaryMin: Number(salaryMin),
      salaryMax: Number(salaryMax),
      status,
    });
  };

  const copyShareLink = (jobId: string) => {
    const link = `${window.location.origin}/apply/${jobId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(jobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (jobStatus: string) => {
    switch (jobStatus) {
      case "PUBLISHED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Published (Active)</span>;
      case "DRAFT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Draft</span>;
      case "PAUSED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Paused</span>;
      case "CLOSED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Closed</span>;
      default:
        return <span>{jobStatus}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Job Openings Manager</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, publish, and distribute shareable candidate application links
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create New Job Opening
        </button>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs">Loading positions...</p>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
          No job positions created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job: any) => (
            <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    {job.department}
                  </span>
                  {getStatusBadge(job.status)}
                </div>

                <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                <p className="text-slate-600 text-xs line-clamp-2 mt-1">{job.jobDescription}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {job.jobLocation}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {job.openingsCount} Openings
                  </span>
                  {job.salaryMin && (
                    <span className="font-bold text-slate-700">
                      {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {job._count?.applications || 0} candidate applications
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyShareLink(job.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 font-bold text-slate-700 shadow-xs transition"
                  >
                    {copiedId === job.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Share Link
                      </>
                    )}
                  </button>

                  <Link
                    href={`/apply/${job.id}`}
                    target="_blank"
                    className="p-1.5 rounded border bg-slate-50 hover:bg-slate-100 text-slate-600"
                    title="Open Public Application Form"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Create Corporate Job Opening
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer (NestJS)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Detailed description of requirements, expectations, and role scope..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Qualification</label>
                  <input
                    type="text"
                    value={requiredQualification}
                    onChange={(e) => setRequiredQualification(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Experience (Yrs)</label>
                  <input
                    type="number"
                    value={experienceMinYears}
                    onChange={(e) => setExperienceMinYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Openings</label>
                  <input
                    type="number"
                    value={openingsCount}
                    onChange={(e) => setOpeningsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobStatus)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value={JobStatus.PUBLISHED}>Published (Live)</option>
                    <option value={JobStatus.DRAFT}>Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Salary (Annual INR)</label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Salary (Annual INR)</label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {createJobMutation.isPending ? "Publishing Opening..." : "Publish Job Opening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
