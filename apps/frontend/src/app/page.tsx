"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiClient, uploadDocument } from "@/lib/api";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import {
  Gender,
  EducationCategory,
  GradingSystem,
  DocumentType,
} from "@recruitment/shared";
import {
  Cpu,
  Database,
  Layers,
  Code2,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Loader2,
  Check,
  Upload,
  User,
  GraduationCap,
  FileUp,
  Search,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SECTION 1: Personal Details
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  // SECTION 2: Contact Information
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");

  // SECTION 3: Education
  const [degreeName, setDegreeName] = useState("B.Tech / B.E (Computer Science & Engineering)");
  const [institutionName, setInstitutionName] = useState("");
  const [passingYear, setPassingYear] = useState<number>(new Date().getFullYear());

  // SECTION 4: Documents
  const [resumeDocId, setResumeDocId] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [profilePhotoDocId, setProfilePhotoDocId] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // SECTION 5: Declarations & Consents
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(true);
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  // Resume Upload Handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF document for your Resume.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5 MB limit.");
      return;
    }

    try {
      setIsUploadingResume(true);
      const data = await uploadDocument(file, DocumentType.RESUME);
      setResumeDocId(data.storageKey);
      setResumeFileName(file.name);
    } catch (err: any) {
      alert(`Resume upload failed: ${err.message}`);
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Profile Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo exceeds 5 MB limit.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const data = await uploadDocument(file, DocumentType.PROFILE_PHOTO);
      setProfilePhotoDocId(data.storageKey);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // 1-Page Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim() || !dob) {
      setErrorMessage("Please provide your Full Name and Date of Birth.");
      return;
    }
    if (!gender) {
      setErrorMessage("Gender selection is compulsory to proceed.");
      return;
    }

    const cleanWa = whatsappNumber.replace(/\D/g, "");
    if (cleanWa.length !== 10) {
      setErrorMessage("WhatsApp Number must be exactly 10 numeric digits.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!institutionName.trim()) {
      setErrorMessage("Please enter your College / University name.");
      return;
    }

    if (!resumeDocId) {
      setErrorMessage("Please upload your Resume / CV (PDF format).");
      return;
    }

    if (!accuracyConfirmed) {
      setErrorMessage("Please acknowledge the declaration to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        fatherName: "N/A",
        motherName: "N/A",
        dateOfBirth: dob,
        gender,
        mobileNumber: cleanWa,
        whatsappNumber: cleanWa,
        email: email.trim().toLowerCase(),
        currentAddress: { street: "N/A", city: "N/A", state: "N/A", pinCode: "000000" },
        permanentAddress: { street: "N/A", city: "N/A", state: "N/A", pinCode: "000000" },
        isSameAddress: true,
        profilePhotoDocId,
        education: [
          {
            qualificationType: EducationCategory.GRADUATION,
            degreeName: degreeName || "B.Tech / Degree",
            institutionName: institutionName.trim(),
            universityOrBoard: "University / State Board",
            specialization: "Engineering / Computer Applications",
            passingYear: Number(passingYear) || new Date().getFullYear(),
            gradingSystem: GradingSystem.PERCENTAGE,
          },
        ],
        isFresher: true,
        technicalSkills: ["AI/ML Engineering", "MERN Stack", "MEAN Stack", "PostgreSQL", "Database Logic"],
        professionalSkills: ["Analytical Thinking", "Problem Solving", "Teamwork"],
        languagesKnown: ["English", "Hindi"],
        noticePeriodDays: 0,
        currentEmploymentStatus: "Student / Graduate",
        preferredJobLocation: "Hybrid / Remote / Office",
        expectedSalary: 0,
        resumeDocId,
        accuracyConfirmed: true,
        recruitmentProcessingConsent: true,
        privacyPolicyAcknowledged: true,
        whatsappConsent,
      };

      const res = await apiClient("/applications/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSubmissionSuccess(res);
      const el = document.getElementById("apply-form");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application. Please check details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. BLACK BACKGROUND NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.webp"
              alt="Emperor Smart Solutions"
              className="w-10 h-10 object-contain filter drop-shadow"
            />
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Emperor <span className="text-blue-500">Smart Solutions</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-semibold bg-blue-950/80 text-blue-400 rounded-md border border-blue-800/80">
                Internship Portal
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-4 sm:space-x-6">
            <a
              href="#curriculum"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Curriculum & Benefits
            </a>
            <a
              href="#apply-form"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Application Form
            </a>
            <Link
              href="/track"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Track Status
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900 text-white py-16 sm:py-24 px-4">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Cohort Admissions Now Open
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Advanced Full-Stack, AI/ML & <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Enterprise Engineering Internship
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Fast-track your software engineering career with hands-on enterprise application development.
            Master practical AI integration, MERN & MEAN full-stack architectures, database optimization,
            and production deployment workflows.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#apply-form"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              Apply Online Now <ChevronRight className="w-4 h-4" />
            </a>
            <Link
              href="/track"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition"
            >
              <Search className="w-4 h-4" /> Track Existing Application
            </Link>
          </div>
        </div>
      </section>

      {/* CURRICULUM & KEY HIGHLIGHTS */}
      <section id="curriculum" className="py-16 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Industry Technologies You Will Master
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Gain genuine enterprise development exposure working on scalable production systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Artificial Intelligence & ML</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              LLM integrations, prompt engineering pipelines, autonomous agents, neural model APIs, and intelligent data systems.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">MERN & MEAN Stacks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              React 19, Next.js 15, Angular, Node.js, Express, NestJS, and state management for scalable frontend applications.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Database Logic & Schema</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostgreSQL relational modeling, Prisma ORM, Redis caching, indexing, indexing strategies, and transactional queries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">DevOps & Cloud Deployment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Docker containerization, Nginx reverse proxies, Linux server management, SSL certificates, and CI/CD deployment pipelines.
            </p>
          </div>
        </div>
      </section>

      {/* 2. SINGLE-PAGE APPLICATION FORM */}
      <section id="apply-form" className="py-12 px-4 max-w-4xl mx-auto w-full flex-1">
        {submissionSuccess ? (
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center shadow-xl animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Application Submitted Successfully!</h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-md mx-auto">
              Your application has been registered in the Emperor Smart Solutions recruitment portal.
            </p>

            <div className="my-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl max-w-md mx-auto">
              <p className="text-xs uppercase tracking-widest text-blue-700 font-bold">Your Official Application ID</p>
              <p className="text-3xl font-mono font-extrabold text-blue-950 mt-2 select-all">
                {submissionSuccess.applicationCode}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Save this reference code to track your interview and hiring status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/track"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
              >
                <Search className="w-4 h-4" /> Track Status Now
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmissionSuccess(null);
                }}
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg">
            <div className="text-center mb-8 pb-6 border-b border-slate-100">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct Candidate Application
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Internship Application Form
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Fill in your accurate details below to apply directly for the upcoming internship cohort.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION A: PERSONAL DETAILS */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <User className="w-4 h-4" /> Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <PremiumDatePicker
                      value={dob}
                      onChange={setDob}
                      placeholder="Select Date of Birth"
                      minYear={1975}
                      maxYear={new Date().getFullYear() - 14}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                      <option value="" disabled>-- Select Gender --</option>
                      <option value={Gender.MALE}>Male</option>
                      <option value={Gender.FEMALE}>Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: CONTACT DETAILS */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit WhatsApp number"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition ${
                        whatsappNumber.length === 10 ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: EDUCATION */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Educational Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Degree / Qualification <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={degreeName}
                      onChange={(e) => setDegreeName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                      <option value="B.Tech / B.E (Computer Science & Engineering)">B.Tech / B.E (CSE / IT)</option>
                      <option value="B.Tech / B.E (Other Branch)">B.Tech / B.E (Other)</option>
                      <option value="BCA (Bachelor of Computer Applications)">BCA</option>
                      <option value="MCA (Master of Computer Applications)">MCA</option>
                      <option value="B.Sc (Computer Science / IT)">B.Sc (CS / IT)</option>
                      <option value="Diploma in Engineering">Diploma</option>
                      <option value="Other Graduate / Post-Graduate Degree">Other Degree</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      College / University Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gujarat Technological University"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Passing Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={passingYear}
                      onChange={(e) => setPassingYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                      {[2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION D: DOCUMENT UPLOADS */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <FileUp className="w-4 h-4" /> Resume & Photo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* RESUME UPLOAD */}
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/70 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">
                        Upload Resume / CV <span className="text-red-500">*</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">PDF format only, maximum 5 MB</p>
                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-xs">
                      {isUploadingResume ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{resumeDocId ? "Change Resume PDF" : "Choose Resume PDF"}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={isUploadingResume}
                        onChange={handleResumeUpload}
                        className="sr-only"
                      />
                    </label>

                    {resumeDocId && (
                      <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5 pt-1">
                        <Check className="w-4 h-4" /> Uploaded: {resumeFileName || "resume.pdf"}
                      </div>
                    )}
                  </div>

                  {/* PROFILE PHOTO UPLOAD (OPTIONAL) */}
                  <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50/70 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">
                        Profile Photo <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WEBP (max 5MB)</p>
                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300 transition">
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingPhoto}
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION E: DECLARATIONS & CONSENT */}
              <div className="pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={accuracyConfirmed}
                    onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <span>
                    <strong className="text-slate-900">Information Accuracy:</strong> I confirm that all educational
                    qualifications, credentials, and uploaded documents are genuine and accurate.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <span>
                    <strong className="text-slate-900">WhatsApp Notification Opt-In:</strong> I consent to receive
                    real-time interview scheduling, meeting details, and status updates via WhatsApp.
                  </span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting Application...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Submit Internship Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* 3. BLACK BACKGROUND FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <img
                src="/logo.webp"
                alt="Emperor Smart Solutions"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-sm text-white">Emperor Smart Solutions</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Industry recruitment and internship management platform.
            </p>
            <p className="mt-3 text-slate-500">© {new Date().getFullYear()} Emperor Smart Solutions Pvt Ltd. All rights reserved.</p>
          </div>

          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200 block mb-2">
              Admissions & Office
            </span>
            <p className="text-slate-400 leading-relaxed font-medium">
              202, Shitiratna Complex, Panchvati, Navrangpura, Ahmedabad - 380009, Gujarat, India
            </p>
          </div>

          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200 block mb-2">
              Quick Links
            </span>
            <div className="flex flex-col space-y-2">
              <a href="#curriculum" className="hover:text-white font-medium transition">Internship Program</a>
              <Link href="/track" className="hover:text-white font-medium transition">Application Tracking</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
