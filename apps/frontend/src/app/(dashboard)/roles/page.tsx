"use client";

import React from "react";
import { ShieldCheck, Lock, UserCheck, Briefcase } from "lucide-react";

export default function RolesPage() {
  const roles = [
    {
      name: "SUPER_ADMIN",
      title: "Super Administrator",
      description: "Full, unrestricted system access across all candidates, interviews, admin users, audit trails, and system settings.",
      permissions: [
        "candidates:read", "candidates:edit", "candidates:export",
        "applications:read", "applications:status:update", "documents:download",
        "jobs:read", "jobs:write", "jobs:delete",
        "interviews:read", "interviews:schedule", "interviews:cancel",
        "feedback:read", "feedback:submit",
        "whatsapp:send", "whatsapp:logs:read",
        "email:logs:read", "users:manage", "audit:read", "settings:manage",
      ],
    },
    {
      name: "HR_ADMIN",
      title: "HR Recruitment Administrator",
      description: "Manages candidate pipeline, applications, status shortlisting/rejection, interview bookings, and WhatsApp notifications.",
      permissions: [
        "candidates:read", "candidates:edit", "candidates:export",
        "applications:read", "applications:status:update", "documents:download",
        "jobs:read", "jobs:write",
        "interviews:read", "interviews:schedule", "interviews:cancel",
        "feedback:read",
        "whatsapp:send", "whatsapp:logs:read", "email:logs:read",
      ],
    },
    {
      name: "INTERVIEWER",
      title: "Technical / Department Interviewer",
      description: "Restricted role strictly limited to assigned candidate profile evaluation, interview attendance, and score submission.",
      permissions: [
        "candidates:read", "documents:download",
        "interviews:read", "feedback:submit", "feedback:read",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Roles & Granular Permissions (RBAC)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Server-enforced role and permission boundaries protecting candidate personal information and administrative privileges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((r) => (
          <div key={r.name} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{r.title}</h3>
              <p className="text-xs font-mono text-blue-600 mt-0.5">{r.name}</p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{r.description}</p>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Granted Permissions ({r.permissions.length})</p>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.map((p) => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
