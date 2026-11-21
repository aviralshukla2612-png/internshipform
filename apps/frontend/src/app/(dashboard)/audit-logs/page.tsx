"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { History, Search, ShieldCheck, Loader2 } from "lucide-react";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["auditLogs", page, actionFilter, entityFilter],
    queryFn: () =>
      apiClient("/audit-logs", {
        params: {
          page,
          limit: 25,
          action: actionFilter || undefined,
          entityType: entityFilter || undefined,
        },
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Compliance & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-resistant immutable event records for security audits, logins, candidate updates, and data exports
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-4">
        <input
          type="text"
          placeholder="Filter by action (e.g. LOGIN_SUCCESS, INTERVIEW_SCHEDULED)..."
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-3 py-2 border rounded-lg text-xs outline-none"
        />
        <input
          type="text"
          placeholder="Filter by entity (e.g. JobApplication, Interview)..."
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-3 py-2 border rounded-lg text-xs outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action Type</th>
              <th className="p-3">Target Entity</th>
              <th className="p-3">Target ID</th>
              <th className="p-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading audit events...
                </td>
              </tr>
            ) : !data?.data || data.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No audit logs recorded for the selected filter.
                </td>
              </tr>
            ) : (
              data.data.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-slate-900">
                    {log.actor?.fullName || "System / Unauthenticated"}
                  </td>
                  <td className="p-3">
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">{log.entityType}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">{log.entityId}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-500">{log.ipAddress || "Internal"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
