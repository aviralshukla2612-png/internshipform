"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, Plus, UserPlus, Key, Mail, Building, Loader2 } from "lucide-react";
import { UserRoleType } from "@recruitment/shared";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRoleType>(UserRoleType.HR_ADMIN);
  const [department, setDepartment] = useState("Human Resources");
  const [designation, setDesignation] = useState("Recruitment Lead");

  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsersList"],
    queryFn: () => apiClient("/auth/users"),
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient("/auth/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setIsModalOpen(false);
      setEmail("");
      setFullName("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["adminUsersList"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      email,
      fullName,
      password,
      role,
      department,
      designation,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Admin & Staff Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controlled account provisioning for HR Administrators and Interviewers (Super Admin restricted)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" /> Provision Admin Account
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Department & Role</th>
              <th className="p-3">Assigned RBAC Role</th>
              <th className="p-3">Account Status</th>
              <th className="p-3">Created Date</th>
              <th className="p-3">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading admin users...
                </td>
              </tr>
            ) : !users || users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No accounts found.
                </td>
              </tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800 font-medium">{u.designation || "N/A"}</div>
                    <div className="text-[10px] text-slate-500">{u.department || "Enterprise"}</div>
                  </td>
                  <td className="p-3">
                    {u.userRoles?.map((ur: any) => (
                      <span
                        key={ur.id}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mr-1"
                      >
                        {ur.role.name}
                      </span>
                    ))}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Provision Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Provision Internal Account
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRoleType)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-bold"
                >
                  <option value={UserRoleType.HR_ADMIN}>HR Admin (Manage applications & interviews)</option>
                  <option value={UserRoleType.INTERVIEWER}>Interviewer (Evaluate assigned candidates)</option>
                  <option value={UserRoleType.SUPER_ADMIN}>Super Admin (Full system access)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
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
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
