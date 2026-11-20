"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Settings, Save, CheckCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: () => apiClient("/settings"),
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiClient(`/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      }),
    onSuccess: () => {
      setSuccessMessage("Setting updated successfully and logged in audit trail.");
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings & Integrations</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure company branding, WhatsApp reminder timings, and maximum upload thresholds
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs divide-y divide-slate-100">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading settings...</p>
          </div>
        ) : !settings || settings.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No system settings initialized.</div>
        ) : (
          settings.map((s: any) => (
            <div key={s.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-sm font-mono">{s.key}</span>
                <p className="text-slate-500 text-xs">{s.description || "System configuration variable"}</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={s.value}
                  onBlur={(e) => {
                    if (e.target.value !== s.value) {
                      updateSettingMutation.mutate({ key: s.key, value: e.target.value });
                    }
                  }}
                  className="px-3 py-1.5 border rounded-lg text-xs font-mono w-64 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
