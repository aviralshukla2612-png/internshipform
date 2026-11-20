"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MessageSquare, CheckCheck, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { WhatsAppDeliveryStatus } from "@recruitment/shared";

export default function WhatsAppLogsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["whatsAppLogs", statusFilter],
    queryFn: () =>
      apiClient("/whatsapp/logs", {
        params: { status: statusFilter || undefined },
      }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "READ":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">{status}</span>;
      case "SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Sent</span>;
      case "QUEUED":
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{status}</span>;
      case "FAILED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Failed</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meta WhatsApp Cloud API Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery status, webhook updates, and message logs
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-xs bg-white text-slate-700"
        >
          <option value="">All Delivery Statuses</option>
          <option value={WhatsAppDeliveryStatus.SENT}>Sent</option>
          <option value={WhatsAppDeliveryStatus.DELIVERED}>Delivered</option>
          <option value={WhatsAppDeliveryStatus.READ}>Read</option>
          <option value={WhatsAppDeliveryStatus.FAILED}>Failed</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">WhatsApp Number</th>
              <th className="p-3">Message Type</th>
              <th className="p-3">Template</th>
              <th className="p-3">Sent Time</th>
              <th className="p-3">Delivery Status</th>
              <th className="p-3">Meta Message ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading message logs...
                </td>
              </tr>
            ) : !data?.data || data.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No WhatsApp message records found.
                </td>
              </tr>
            ) : (
              data.data.map((msg: any) => (
                <tr key={msg.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900">{msg.candidateName}</td>
                  <td className="p-3 font-mono text-slate-700">{msg.recipientNumber}</td>
                  <td className="p-3 font-medium text-slate-800">{msg.messageType}</td>
                  <td className="p-3 font-mono text-slate-500">{msg.templateName}</td>
                  <td className="p-3 text-slate-500">{msg.sentAt ? new Date(msg.sentAt).toLocaleString() : "Pending"}</td>
                  <td className="p-3">{getStatusBadge(msg.deliveryStatus)}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                    {msg.metaMessageId || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
