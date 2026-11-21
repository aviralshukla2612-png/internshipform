"use client";

import React, { useState, useEffect } from "react";
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
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout, hasRole, hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sticky Sidebar (Hidden on mobile/tablet < lg) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col border-r border-slate-800 shrink-0 sticky top-0 h-screen z-30 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
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

      {/* Mobile Drawer (Only on screens < lg when mobileMenuOpen is true) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col shadow-2xl border-r border-slate-800 z-50 animate-in slide-in-from-left duration-300">
            {/* Header with Logo and Close button */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center min-w-0">
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

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
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

            {/* User Profile Card & Sign Out */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user.fullName.charAt(0)}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                  <p className="text-[10px] text-blue-400 truncate">{user.roles.join(", ")}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 text-xs font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger button for Mobile/Tablet (< lg) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 truncate">
              <span className="hidden sm:inline">Emperor Smart Solutions</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-900 font-bold capitalize truncate">
                {pathname.replace("/", "").replace("-", " ") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50/80 hover:bg-blue-100 transition"
            >
              <span className="hidden sm:inline">Open Internship Portal</span>
              <span className="sm:hidden">Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
