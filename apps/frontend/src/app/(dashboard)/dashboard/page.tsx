"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Users,
  FileCheck,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Loader2,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => apiClient("/reports/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Aggregating real-time recruitment metrics from database...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
        Failed to load recruitment metrics.
      </div>
    );
  }

  const kpis = [
    { label: "Total Applications", value: metrics.totalApplications, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "New Applications", value: metrics.newApplications, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Under Review", value: metrics.underReview, icon: FileCheck, color: "text-indigo-600 bg-indigo-50" },
    { label: "Shortlisted", value: metrics.shortlistedCandidates, icon: UserCheck, color: "text-purple-600 bg-purple-50" },
    { label: "Interviews Scheduled", value: metrics.interviewsScheduled, icon: Calendar, color: "text-cyan-600 bg-cyan-50" },
    { label: "Interviews Completed", value: metrics.interviewsCompleted, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Selected / Hired", value: metrics.selectedCandidates, icon: Award, color: "text-green-600 bg-green-50" },
    { label: "Rejected Candidates", value: metrics.rejectedCandidates, icon: UserX, color: "text-rose-600 bg-rose-50" },
    { label: "Pending Feedback", value: metrics.pendingFeedback, icon: HelpCircle, color: "text-orange-600 bg-orange-50" },
  ];

  const experienceData = [
    { name: "Freshers", value: metrics.fresherVsExperienced.freshers },
    { name: "Experienced", value: metrics.fresherVsExperienced.experienced },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recruitment Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline analytics, applicant throughput, and conversion metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs text-xs font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Conversion Rate: <strong className="text-emerald-700">{metrics.conversionRatePercent}%</strong></span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-2 rounded-lg ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Application Trends */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Monthly Application Trends</h3>
          <div className="h-64">
            {metrics.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly application records found.
              </div>
            )}
          </div>
        </div>

        {/* Recruitment Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Recruitment Status Distribution</h3>
          <div className="h-64">
            {metrics.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {metrics.statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status records found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fresher vs Experienced */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Fresher vs Experienced</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={experienceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  label
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Position-Wise Statistics */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Position-Wise Application Volume</h3>
          <div className="h-56">
            {metrics.positionStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.positionStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} stroke="#94a3b8" />
                  <YAxis dataKey="position" type="category" width={140} fontSize={10} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No positions data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
