"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Mail, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function EmailLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["emailLogs"],
    queryFn: () => apiClient("/email/logs"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transactional Email Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          History of dispatched application receipts, interview invitations, and status notifications
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Recipient</th>
              <th className="p-3">Subject Line</th>
              <th className="p-3">Template</th>
              <th className="p-3">Status</th>
              <th className="p-3">Dispatched Time</th>
              <th className="p-3">Message ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading email logs...
                </td>
              </tr>
            ) : !logs || logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No outgoing email records found.
                </td>
              </tr>
            ) : (
              logs.map((mail: any) => (
                <tr key={mail.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-semibold text-slate-900">{mail.recipient}</td>
                  <td className="p-3 font-medium text-slate-800">{mail.subject}</td>
                  <td className="p-3 font-mono text-slate-500">{mail.templateName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mail.status === "SENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {mail.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(mail.sentAt).toLocaleString()}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">{mail.messageId || "simulated-id"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
