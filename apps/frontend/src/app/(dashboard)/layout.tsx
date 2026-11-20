"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckCircle,
  Calendar,
  MessageSquare,
  Mail,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  FileText,
  UserCheck,
  Sliders,
  History,
  Loader2,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout, hasRole, hasPermission } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 15 Standard Navigation Items with granular RBAC visibility
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { label: "Applications", href: "/applications", icon: FileText, show: hasPermission("applications:read") },
    { label: "Candidates", href: "/candidates", icon: Users, show: hasPermission("candidates:read") },
    { label: "Job Positions", href: "/jobs-manager", icon: Briefcase, show: hasPermission("jobs:read") },
    { label: "Shortlisted", href: "/applications?status=SHORTLISTED", icon: CheckCircle, show: hasPermission("applications:read") },
    { label: "Interviews", href: "/interviews", icon: Calendar, show: hasPermission("interviews:read") },
    { label: "Interview Calendar", href: "/interviews/calendar", icon: Calendar, show: hasPermission("interviews:read") },
    { label: "Interview Feedback", href: "/feedback", icon: UserCheck, show: hasPermission("feedback:read") || hasPermission("feedback:submit") },
    { label: "WhatsApp Messages", href: "/whatsapp-logs", icon: MessageSquare, show: hasPermission("whatsapp:logs:read") },
    { label: "Email Notifications", href: "/email-logs", icon: Mail, show: hasPermission("email:logs:read") },
    { label: "Reports & Analytics", href: "/reports", icon: BarChart3, show: hasPermission("applications:read") },
    { label: "Admin Users", href: "/users", icon: ShieldCheck, show: hasRole("SUPER_ADMIN") },
    { label: "Roles & Permissions", href: "/roles", icon: Sliders, show: hasRole("SUPER_ADMIN") },
    { label: "Audit Logs", href: "/audit-logs", icon: History, show: hasPermission("audit:read") },
    { label: "Settings", href: "/settings", icon: Settings, show: hasPermission("settings:manage") },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sticky Fixed Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 sticky top-0 h-screen z-30">
        <div className="h-16 px-5 flex items-center border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center p-1 mr-3 shrink-0 shadow-sm">
            <img
              src="/logo.webp"
              alt="Emperor Smart Solutions"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-white text-sm tracking-tight block truncate">
              Emperor Smart Solutions
            </span>
            <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">HR Console</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
              {user.fullName.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-blue-400 truncate">{user.roles.join(", ")}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Emperor Smart Solutions</span>
            <span>/</span>
            <span className="text-slate-900 font-bold capitalize">
              {pathname.replace("/", "").replace("-", " ") || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Open Internship Portal &rarr;
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
