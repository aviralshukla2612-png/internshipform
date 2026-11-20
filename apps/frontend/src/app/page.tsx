"use client";

import Link from "next/link";
import { Briefcase, Search, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              Enterprise<span className="text-blue-600">Talent</span>
            </span>
          </div>

          <nav className="flex items-center space-x-6">
            <Link
              href="/jobs"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Careers & Openings
            </Link>
            <Link
              href="/track"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Track Application
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
            >
              HR / Admin Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 lg:py-28 px-4 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" /> Next-Gen Enterprise Recruitment Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Build Your Career With Our <br className="hidden sm:inline" />
            <span className="text-blue-600">World-Class Team</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Explore exciting career opportunities, submit your comprehensive application through our secure portal, and track every stage of your hiring journey in real time.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
            >
              Explore Job Openings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/track"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition shadow-sm"
            >
              <Search className="w-4 h-4" /> Track Existing Application
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Seamless Multi-Step Flow</h3>
              <p className="mt-2 text-sm text-slate-600">
                Intuitive application wizard with auto-calculated percentages, education records, and secure document upload verification.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Instant Application ID</h3>
              <p className="mt-2 text-sm text-slate-600">
                Receive an immediate reference ID with real-time status tracking across HR review, technical interviews, and final selection.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">WhatsApp & Email Updates</h3>
              <p className="mt-2 text-sm text-slate-600">
                Official Meta WhatsApp Cloud API integration delivers instant interview invitations, calendar reminders, and feedback updates.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-slate-400 py-10 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Enterprise Talent Solutions. All rights reserved.</p>
        <p className="mt-1 text-xs text-slate-500">Enterprise Recruitment & Applicant Management Architecture</p>
      </footer>
    </div>
  );
}
