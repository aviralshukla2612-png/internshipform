"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiClient, uploadDocument } from "@/lib/api";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import {
  Gender,
  EducationCategory,
  GradingSystem,
  EmploymentType,
  DocumentType,
} from "@recruitment/shared";
import {
  Cpu,
  Database,
  Layers,
  Server,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Check,
  Upload,
  User,
  GraduationCap,
  Briefcase,
  FileUp,
  ArrowRight,
  Search,
  Sparkles,
  Terminal,
  ShieldCheck,
  Code2,
} from "lucide-react";

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SECTION A: Personal Information
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhotoDocId, setProfilePhotoDocId] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // SECTION B: Educational Information
  const [educationList, setEducationList] = useState<any[]>([
    {
      qualificationType: EducationCategory.GRADUATION,
      degreeName: "",
      institutionName: "",
      universityOrBoard: "",
      specialization: "",
      passingYear: new Date().getFullYear(),
      totalMarks: "",
      obtainedMarks: "",
      percentage: "",
      cgpa: "",
      gradingSystem: GradingSystem.PERCENTAGE,
      marksheetDocId: "",
    },
  ]);

  // SECTION C: Work Experience
  const [isFresher, setIsFresher] = useState(true);
  const [experienceList, setExperienceList] = useState<any[]>([
    {
      companyName: "",
      companyAddress: "",
      companyWebsite: "",
      designation: "",
      department: "",
      employmentType: EmploymentType.FULL_TIME,
      joiningDate: "",
      leavingDate: "",
      currentlyWorking: false,
      totalExperienceMonths: 12,
      lastDrawnSalary: "",
      expectedSalary: "",
      reasonForLeaving: "",
      jobResponsibilities: "",
      hrContactInfo: "",
      experienceCertDocId: "",
    },
  ]);

  // SECTION D: Document Uploads (previously Step 5)
  const [resumeDocId, setResumeDocId] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");

  // SECTION E: Declarations & Consents (previously Step 6)
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [recruitmentProcessingConsent, setRecruitmentProcessingConsent] = useState(false);
  const [privacyPolicyAcknowledged, setPrivacyPolicyAcknowledged] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);

  // Marksheet Document Type mapper
  const getDocTypeForEdu = (qType: EducationCategory): DocumentType => {
    switch (qType) {
      case EducationCategory.CLASS_10:
        return DocumentType.MARKSHEET_10;
      case EducationCategory.CLASS_12:
        return DocumentType.MARKSHEET_12;
      case EducationCategory.GRADUATION:
        return DocumentType.MARKSHEET_GRADUATION;
      case EducationCategory.POST_GRADUATION:
        return DocumentType.MARKSHEET_POST_GRADUATION;
      default:
        return DocumentType.OTHER_CERTIFICATE;
    }
  };

  // File Upload Handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: DocumentType,
    onSuccess: (storageKey: string, fileName: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds the 5 MB limit.");
      return;
    }

    try {
      const data = await uploadDocument(file, type);
      onSuccess(data.storageKey, file.name);

      if (type === DocumentType.PROFILE_PHOTO) {
        setPhotoPreview(URL.createObjectURL(file));
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  // Education Helpers
  const updateEducationField = (index: number, field: string, val: any) => {
    const updated = [...educationList];
    updated[index][field] = val;

    if (field === "totalMarks" || field === "obtainedMarks") {
      const tot = parseFloat(field === "totalMarks" ? val : updated[index].totalMarks);
      const obt = parseFloat(field === "obtainedMarks" ? val : updated[index].obtainedMarks);
      if (tot > 0 && obt >= 0 && obt <= tot) {
        updated[index].percentage = ((obt / tot) * 100).toFixed(2);
      }
    }

    setEducationList(updated);
  };

  const addEducation = () => {
    setEducationList([
      ...educationList,
      {
        qualificationType: EducationCategory.OTHER,
        degreeName: "",
        institutionName: "",
        universityOrBoard: "",
        specialization: "",
        passingYear: new Date().getFullYear(),
        totalMarks: "",
        obtainedMarks: "",
        percentage: "",
        cgpa: "",
        gradingSystem: GradingSystem.PERCENTAGE,
        marksheetDocId: "",
      },
    ]);
  };

  const removeEducation = (index: number) => {
    if (educationList.length <= 1) return;
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  // Experience Helpers
  const updateExperienceField = (index: number, field: string, val: any) => {
    const updated = [...experienceList];
    updated[index][field] = val;
    if (field === "currentlyWorking" && val === true) {
      updated[index].leavingDate = "";
    }
    setExperienceList(updated);
  };

  const addExperience = () => {
    setExperienceList([
      ...experienceList,
      {
        companyName: "",
        companyAddress: "",
        companyWebsite: "",
        designation: "",
        department: "",
        employmentType: EmploymentType.FULL_TIME,
        joiningDate: "",
        leavingDate: "",
        currentlyWorking: false,
        totalExperienceMonths: 12,
        lastDrawnSalary: "",
        expectedSalary: "",
        reasonForLeaving: "",
        jobResponsibilities: "",
        hrContactInfo: "",
        experienceCertDocId: "",
      },
    ]);
  };

  const removeExperience = (index: number) => {
    if (experienceList.length <= 1) return;
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  // Step Validation (5-step flow)
  const validateStep = (currentStep: number): boolean => {
    setErrorMessage(null);

    // Step 1: Personal Details
    if (currentStep === 1) {
      if (!fullName.trim() || !fatherName.trim() || !motherName.trim() || !dob) {
        setErrorMessage("Please complete your Full Name, Father's Name, Mother's Name, and Date of Birth.");
        return false;
      }
      if (!gender) {
        setErrorMessage("Gender selection is compulsory to proceed.");
        return false;
      }
      const cleanMob = mobileNumber.replace(/\D/g, "");
      if (cleanMob.length !== 10) {
        setErrorMessage("Mobile Number must be exactly 10 digits.");
        return false;
      }
      const cleanWa = whatsappNumber.replace(/\D/g, "");
      if (cleanWa.length !== 10) {
        setErrorMessage("WhatsApp Number must be exactly 10 digits.");
        return false;
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMessage("Please enter a valid email address.");
        return false;
      }
    }
    // Step 2: Education
    else if (currentStep === 2) {
      for (const edu of educationList) {
        if (!edu.degreeName.trim() || !edu.institutionName.trim() || !edu.passingYear) {
          setErrorMessage("Please provide degree, institution, and passing year details.");
          return false;
        }
        if (edu.totalMarks && edu.obtainedMarks) {
          if (parseFloat(edu.obtainedMarks) > parseFloat(edu.totalMarks)) {
            setErrorMessage(`Obtained marks cannot exceed total marks for ${edu.degreeName}`);
            return false;
          }
        }
      }
    }
    // Step 3: Experience
    else if (currentStep === 3) {
      if (!isFresher) {
        for (const exp of experienceList) {
          if (!exp.companyName.trim() || !exp.designation.trim() || !exp.joiningDate) {
            setErrorMessage("Please enter company name, designation, and valid joining date.");
            return false;
          }
          if (!exp.currentlyWorking && exp.leavingDate) {
            if (new Date(exp.leavingDate) < new Date(exp.joiningDate)) {
              setErrorMessage(`Leaving date cannot be earlier than joining date for ${exp.companyName}`);
              return false;
            }
          }
        }
      }
    }
    // Step 4: Documents (previously step 5)
    else if (currentStep === 4) {
      if (!resumeDocId) {
        setErrorMessage("A valid Resume/CV (PDF) upload is required.");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      const el = document.getElementById("apply-form");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setErrorMessage(null);
    setStep((s) => s - 1);
    const el = document.getElementById("apply-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accuracyConfirmed || !recruitmentProcessingConsent || !privacyPolicyAcknowledged) {
      setErrorMessage("You must agree to the declarations and privacy terms to submit your application.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      fullName: fullName.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      dateOfBirth: dob,
      gender,
      mobileNumber: mobileNumber.replace(/\D/g, ""),
      whatsappNumber: whatsappNumber.replace(/\D/g, ""),
      email: email.trim().toLowerCase(),
      currentAddress: { street: "", city: "", state: "", pinCode: "" },
      permanentAddress: { street: "", city: "", state: "", pinCode: "" },
      isSameAddress: true,
      profilePhotoDocId,
      education: educationList.map((e) => ({
        ...e,
        passingYear: Number(e.passingYear),
        totalMarks: e.totalMarks ? parseFloat(e.totalMarks) : undefined,
        obtainedMarks: e.obtainedMarks ? parseFloat(e.obtainedMarks) : undefined,
        percentage: e.percentage ? parseFloat(e.percentage) : undefined,
        cgpa: e.cgpa ? parseFloat(e.cgpa) : undefined,
      })),
      isFresher,
      experiences: isFresher
        ? []
        : experienceList.map((exp) => ({
            ...exp,
            totalExperienceMonths: Number(exp.totalExperienceMonths) || 0,
            lastDrawnSalary: exp.lastDrawnSalary ? parseFloat(exp.lastDrawnSalary) : undefined,
            expectedSalary: exp.expectedSalary ? parseFloat(exp.expectedSalary) : undefined,
          })),
      technicalSkills: ["AI/ML", "Full-Stack (MERN / MEAN)", "Database Architecture & Systems"],
      professionalSkills: ["Problem Solving", "Team Collaboration", "System Design Logic"],
      languagesKnown: ["English", "Hindi"],
      noticePeriodDays: 0,
      currentEmploymentStatus: isFresher ? "Fresher / Student" : "Experienced",
      preferredJobLocation: "Hybrid / Remote",
      expectedSalary: 0,
      additionalInformation: "Direct Internship Cohort 2026 Application",
      resumeDocId,
      accuracyConfirmed,
      recruitmentProcessingConsent,
      privacyPolicyAcknowledged,
      whatsappConsent,
    };

    try {
      const res = await apiClient("/applications/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSubmissionSuccess(res);
      window.scrollTo({ top: 300, behavior: "smooth" });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application. Please check your entries.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER / NAVIGATION */}
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.webp"
              alt="Emperor Smart Solutions Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm"
            />
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Emperor <span className="text-blue-600">Smart Solutions</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                Internship Portal
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-4 sm:space-x-6">
            <a
              href="#curriculum"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Curriculum & Benefits
            </a>
            <a
              href="#apply-form"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Application Form
            </a>
            <Link
              href="/track"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Track Status
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-3.5 py-1.5 border border-slate-200 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
            >
              Admin Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900 text-white py-16 sm:py-24 px-4">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" /> 2026 Practical Full-Stack & AI Engineering Cohort
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Accelerate Your Tech Career With <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-300">
              Real-World Industry Engineering
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Gain practical, production-level experience in modern engineering. Work directly with 
            senior architects on <strong>AI/ML Integration</strong>, <strong>MERN & MEAN Stacks</strong>, 
            and <strong>Enterprise Database Systems</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#apply-form"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 text-sm"
            >
              Fill Application Form Directly <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#curriculum"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 font-semibold hover:bg-slate-800 transition text-sm"
            >
              <Terminal className="w-4 h-4 text-blue-400" /> Explore What You Learn
            </a>
          </div>
        </div>
      </section>

      {/* CURRICULUM & BENEFITS GRID */}
      <section id="curriculum" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest text-blue-600 font-bold">Comprehensive Curriculum</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Master the Most In-Demand Technologies in 2026
            </p>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Learn practical skills directly applied on live production architectures with mentor code reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI & ML */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI & Machine Learning (AI / ML)</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Hands-on Generative AI, Large Language Model (LLM) orchestration, prompt engineering, agentic tools, vector search (RAG), and neural network automation pipelines.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["LLMs", "LangChain", "Vector RAG", "Python ML", "Computer Vision"].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-md border border-blue-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* MERN & MEAN STACKS */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Full-Stack MERN & MEAN</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                React 19 & Next.js 15 App Router, Angular reactive architectures, Express & NestJS microservices, and end-to-end TypeScript type safety.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["React 19", "Next.js 15", "Angular", "NestJS", "Node.js", "TypeScript"].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-semibold rounded-md border border-teal-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* DATABASE LOGIC */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Database Logic & Architecture</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Relational schema design with PostgreSQL & Prisma, NoSQL with MongoDB, distributed caching with Redis, message queues (BullMQ), and ACID business logic.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["PostgreSQL", "MongoDB", "Redis", "BullMQ", "ACID Logic", "Indexing"].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-md border border-indigo-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* DEVOPS & PRODUCTION */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">DevOps & Cloud Systems</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Multi-stage Docker containerization, Linux VPS administration, Nginx reverse proxy configuration, SSL certificates, and automated CI/CD workflows.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Docker", "Nginx", "Linux VPS", "CI/CD", "SSL/TLS", "Microservices"].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-md border border-amber-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* CERTIFICATE & RECOMMENDATION */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Certificate & Letter of Recommendation</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Receive an official, verifiable Certificate of Internship Completion and an architectural Letter of Recommendation (LOR) for top performers.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Verified Certificate", "LOR", "GitHub Portfolio", "Code Reviews"].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* MENTORSHIP & REAL WORK */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real Production Codebase</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                No trivial toy apps. You write real code deployed to real servers, handle live API integrations, and review pull requests with seasoned lead architects.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Live Projects", "Production VPS", "Team PRs", "1-on-1 Guidance"].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded-md border border-purple-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIRECT APPLICATION FORM SECTION */}
      <section id="apply-form" className="py-16 px-4 max-w-4xl mx-auto w-full flex-1">
        {submissionSuccess ? (
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
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
                  setStep(1);
                }}
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct Candidate Application
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Internship Application Form
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Fill in your accurate details to apply directly for the upcoming internship cohort.
              </p>
            </div>

            {/* 5-Step Wizard Progress Bar (Skills removed) */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
              {[
                { num: 1, label: "Personal", icon: User },
                { num: 2, label: "Education", icon: GraduationCap },
                { num: 3, label: "Experience", icon: Briefcase },
                { num: 4, label: "Documents", icon: FileUp },
                { num: 5, label: "Consent", icon: CheckCircle2 },
              ].map((item) => (
                <div
                  key={item.num}
                  className={`p-2.5 rounded-xl border transition ${
                    step === item.num
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : step > item.num
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  <item.icon className="w-4 h-4 mx-auto mb-1" />
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Container Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
              {/* STEP 1: PERSONAL INFORMATION */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" /> Section A: Personal Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Candidate full name"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Father's Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="Father's full name"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mother's Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Mother's full name"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PREMIUM DATE OF BIRTH PICKER */}
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

                    {/* MANDATORY GENDER SELECTION */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender <span className="text-red-500">* (MANDATORY)</span>
                      </label>
                      <select
                        required
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium shadow-sm"
                      >
                        <option value="" disabled>
                          -- Select Compulsory Gender Option --
                        </option>
                        <option value={Gender.MALE}>Male</option>
                        <option value={Gender.FEMALE}>Female</option>
                        <option value={Gender.OTHER}>Other</option>
                        <option value={Gender.PREFER_NOT_TO_DISCLOSE}>Prefer not to disclose</option>
                      </select>
                    </div>
                  </div>

                  {/* 10-DIGIT VALIDATED MOBILE & WHATSAPP NUMBERS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-[10px] font-bold ${mobileNumber.length === 10 ? "text-emerald-600" : "text-slate-400"}`}>
                          {mobileNumber.length === 10 ? "10/10 ✓" : `${mobileNumber.length}/10 digits`}
                        </span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition ${
                          mobileNumber.length === 10 ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-300"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          WhatsApp Number <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setWhatsappNumber(mobileNumber)}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Same as Mobile
                        </button>
                      </div>
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
                      <div className="mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="candidate@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Profile Photograph (JPG, PNG, WEBP max 5MB)
                    </label>
                    <div className="flex items-center gap-4">
                      {photoPreview && (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                        />
                      )}
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition shadow-sm">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, DocumentType.PROFILE_PHOTO, (id) =>
                              setProfilePhotoDocId(id),
                            )
                          }
                        />
                      </label>
                      {profilePhotoDocId && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Uploaded & Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: EDUCATION */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" /> Section B: Educational Qualifications
                    </h3>
                    <button
                      type="button"
                      onClick={addEducation}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Qualification
                    </button>
                  </div>

                  {educationList.map((edu, idx) => (
                    <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-4 relative">
                      {educationList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(idx)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                          <select
                            value={edu.qualificationType}
                            onChange={(e) => updateEducationField(idx, "qualificationType", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                          >
                            <option value={EducationCategory.CLASS_10}>10th Standard</option>
                            <option value={EducationCategory.CLASS_12}>12th Standard</option>
                            <option value={EducationCategory.DIPLOMA}>Diploma</option>
                            <option value={EducationCategory.GRADUATION}>Graduation (B.E/B.Tech/BCA/B.Sc)</option>
                            <option value={EducationCategory.POST_GRADUATION}>Post Graduation (MCA/M.Tech/MBA)</option>
                            <option value={EducationCategory.OTHER}>Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Course</label>
                          <input
                            type="text"
                            placeholder="e.g. B.Tech Computer Science"
                            value={edu.degreeName}
                            onChange={(e) => updateEducationField(idx, "degreeName", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                          <input
                            type="text"
                            placeholder="e.g. Software Engineering"
                            value={edu.specialization}
                            onChange={(e) => updateEducationField(idx, "specialization", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">College / School</label>
                          <input
                            type="text"
                            placeholder="Institution name"
                            value={edu.institutionName}
                            onChange={(e) => updateEducationField(idx, "institutionName", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">University / Board</label>
                          <input
                            type="text"
                            placeholder="e.g. AKTU / CBSE"
                            value={edu.universityOrBoard}
                            onChange={(e) => updateEducationField(idx, "universityOrBoard", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Year</label>
                          <input
                            type="number"
                            value={edu.passingYear}
                            onChange={(e) => updateEducationField(idx, "passingYear", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* Marks & Auto Percentage */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Grading System</label>
                          <select
                            value={edu.gradingSystem}
                            onChange={(e) => updateEducationField(idx, "gradingSystem", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                          >
                            <option value={GradingSystem.PERCENTAGE}>Percentage</option>
                            <option value={GradingSystem.CGPA_10}>CGPA (10-point)</option>
                            <option value={GradingSystem.CGPA_4}>CGPA (4-point)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Total Marks</label>
                          <input
                            type="number"
                            placeholder="e.g. 1000"
                            value={edu.totalMarks}
                            onChange={(e) => updateEducationField(idx, "totalMarks", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Obtained Marks</label>
                          <input
                            type="number"
                            placeholder="e.g. 850"
                            value={edu.obtainedMarks}
                            onChange={(e) => updateEducationField(idx, "obtainedMarks", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Calculated Percentage</label>
                          <input
                            type="text"
                            readOnly
                            placeholder="Auto-calculated"
                            value={edu.percentage ? `${edu.percentage}%` : ""}
                            className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-100 font-bold text-blue-700"
                          />
                        </div>
                      </div>

                      {/* Marksheet Upload */}
                      <div className="pt-2 flex items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Marksheet</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, getDocTypeForEdu(edu.qualificationType), (id) =>
                                updateEducationField(idx, "marksheetDocId", id),
                              )
                            }
                          />
                        </label>
                        {edu.marksheetDocId && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Marksheet Uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 3: WORK EXPERIENCE */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" /> Section C: Experience / Fresher Status
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900">Are you a Fresher or Experienced?</span>
                      <p className="text-xs text-slate-500">
                        Select Fresher if you are a student or haven't held a previous full-time corporate role.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsFresher(true)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                          isFresher
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white border text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Fresher
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFresher(false)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                          !isFresher
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white border text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Experienced
                      </button>
                    </div>
                  </div>

                  {!isFresher && (
                    <div className="space-y-4">
                      {experienceList.map((exp, idx) => (
                        <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-4 relative">
                          {experienceList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeExperience(idx)}
                              className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                              <input
                                type="text"
                                placeholder="Company name"
                                value={exp.companyName}
                                onChange={(e) => updateExperienceField(idx, "companyName", e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                              <input
                                type="text"
                                placeholder="e.g. Junior Developer"
                                value={exp.designation}
                                onChange={(e) => updateExperienceField(idx, "designation", e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                              <input
                                type="text"
                                placeholder="e.g. Engineering"
                                value={exp.department}
                                onChange={(e) => updateExperienceField(idx, "department", e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                              <input
                                type="date"
                                value={exp.joiningDate}
                                onChange={(e) => updateExperienceField(idx, "joiningDate", e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Leaving Date</label>
                              <input
                                type="date"
                                disabled={exp.currentlyWorking}
                                value={exp.leavingDate}
                                onChange={(e) => updateExperienceField(idx, "leavingDate", e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-xs disabled:bg-slate-100"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <input
                                type="checkbox"
                                id={`curWork-${idx}`}
                                checked={exp.currentlyWorking}
                                onChange={(e) => updateExperienceField(idx, "currentlyWorking", e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <label htmlFor={`curWork-${idx}`} className="text-xs font-semibold text-slate-700">
                                Currently Working Here
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addExperience}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Another Experience
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: DOCUMENT UPLOADS */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-blue-600" /> Section D: Document Uploads
                  </h3>

                  <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-extrabold text-base text-slate-900 block">Upload Your Resume / CV</span>
                      <p className="text-xs text-slate-500 mt-1">PDF format only, maximum allowed size 5 MB</p>
                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>{resumeDocId ? "Change Resume PDF" : "Choose Resume PDF"}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, DocumentType.RESUME, (storageKey, fileName) => {
                            setResumeDocId(storageKey);
                            setResumeFileName(fileName);
                          })
                        }
                      />
                    </label>

                    {resumeDocId && (
                      <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5 pt-2">
                        <Check className="w-4 h-4" /> Verified & Uploaded: {resumeFileName || "resume.pdf"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: DECLARATION & CONSENT */}
              {step === 5 && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" /> Section E: Declaration & Consent
                  </h3>

                  <div className="space-y-4 text-xs text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={accuracyConfirmed}
                        onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <span>
                        <strong className="text-slate-900">Information Accuracy:</strong> I declare that all 
                        information, educational credentials, and documents provided in this form are genuine and accurate.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={recruitmentProcessingConsent}
                        onChange={(e) => setRecruitmentProcessingConsent(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <span>
                        <strong className="text-slate-900">Data Processing:</strong> I authorize Emperor Smart Solutions 
                        to process my recruitment application data for assessment and internship selection.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={privacyPolicyAcknowledged}
                        onChange={(e) => setPrivacyPolicyAcknowledged(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <span>
                        <strong className="text-slate-900">Privacy Policy:</strong> I acknowledge and agree to 
                        the enterprise data privacy terms and security guidelines.
                      </span>
                    </label>

                    <div className="pt-2 border-t border-slate-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={whatsappConsent}
                          onChange={(e) => setWhatsappConsent(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded mt-0.5"
                        />
                        <span>
                          <strong className="text-slate-900">WhatsApp Notification Opt-In (Optional):</strong> I 
                          consent to receive real-time interview reminders and application status updates via WhatsApp.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Nav Buttons (5 steps total) */}
              <div className="mt-8 pt-6 border-t flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Complete & Submit Application
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/logo.webp"
                alt="Emperor Smart Solutions"
                className="w-7 h-7 object-contain"
              />
              <span className="font-bold text-sm text-slate-900">Emperor Smart Solutions</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Industry recruitment and internship management platform.
            </p>
            <p className="mt-3 text-slate-400">© {new Date().getFullYear()} Emperor Smart Solutions Pvt Ltd. All rights reserved.</p>
          </div>

          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900 block mb-2">
              Admissions & Office
            </span>
            <p className="text-slate-600 leading-relaxed font-medium">
              202, Shitiratna Complex, Panchvati, Navrangpura, Ahmedabad - 380009, Gujarat, India
            </p>
          </div>

          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900 block mb-2">
              Quick Links
            </span>
            <div className="flex flex-col space-y-2">
              <a href="#curriculum" className="hover:text-blue-600 font-medium">Internship Program</a>
              <Link href="/track" className="hover:text-blue-600 font-medium">Application Tracking</Link>
              <Link href="/login" className="hover:text-blue-600 font-medium">HR Management Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
