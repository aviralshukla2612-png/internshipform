"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Briefcase, MapPin, Clock, ArrowRight, Loader2 } from "lucide-react";

interface JobOpening {
  id: string;
  title: string;
  slug: string;
  department: string;
  jobDescription: string;
  requiredQualification: string;
  requiredSkills: string[];
  jobLocation: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  openingsCount: number;
}

export default function JobsPage() {
  const { data: jobs, isLoading, error } = useQuery<JobOpening[]>({
    queryKey: ["publicJobs"],
    queryFn: () => apiClient("/jobs/public"),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900">
              Enterprise<span className="text-blue-600">Talent</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/track" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Track Application
            </Link>
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Current Job Openings
          </h1>
          <p className="mt-3 text-slate-600">
            Join our mission-driven team. Find the role that matches your skills and passion.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p>Loading available positions...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
            Failed to load job listings. Please check back shortly.
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="text-center py-20 bg-white border rounded-xl p-8 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800">No Open Positions Currently</h3>
            <p className="text-slate-500 text-sm mt-1">Please check back soon for upcoming openings.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 hover:border-blue-300 hover:shadow-md transition flex flex-col sm:flex-row justify-between sm:items-center gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {job.department}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {job.employmentType.replace("_", " ")}
                    </span>
                    {job.openingsCount > 1 && (
                      <span className="text-xs text-slate-500">
                        {job.openingsCount} openings
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                  <p className="text-slate-600 text-sm line-clamp-2">{job.jobDescription}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.jobLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Full Time
                    </span>
                    {job.salaryMin && (
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
                      </span>
                    )}
                  </div>

                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      {job.requiredSkills.slice(0, 5).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Link
                    href={`/apply/${job.id}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm w-full sm:w-auto"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
