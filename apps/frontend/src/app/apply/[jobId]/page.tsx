"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient, uploadDocument } from "@/lib/api";
import {
  Gender,
  EducationCategory,
  GradingSystem,
  EmploymentType,
  DocumentType,
} from "@recruitment/shared";
import {
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  FileUp,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Check,
  Upload,
} from "lucide-react";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ["jobDetail", jobId],
    queryFn: () => apiClient(`/jobs/${jobId}`),
    enabled: !!jobId,
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  // Section A: Personal
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

  // Addresses
  const [currentAddress, setCurrentAddress] = useState({
    street: "",
    city: "",
    state: "",
    pinCode: "",
  });
  const [isSameAddress, setIsSameAddress] = useState(true);
  const [permanentAddress, setPermanentAddress] = useState({
    street: "",
    city: "",
    state: "",
    pinCode: "",
  });

  // Section B: Education
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

  // Section C: Experience
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

  // Section D: Skills & Additional
  const [technicalSkillsInput, setTechnicalSkillsInput] = useState("React, TypeScript, Node.js");
  const [professionalSkillsInput, setProfessionalSkillsInput] = useState("Agile, Problem Solving, Communication");
  const [languagesInput, setLanguagesInput] = useState("English, Hindi");
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [currentEmploymentStatus, setCurrentEmploymentStatus] = useState("Employed");
  const [preferredJobLocation, setPreferredJobLocation] = useState("Bengaluru / Remote");
  const [expectedSalary, setExpectedSalary] = useState(1200000);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");

  // Section E: Documents
  const [resumeDocId, setResumeDocId] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");

  // Section F: Consent
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [recruitmentProcessingConsent, setRecruitmentProcessingConsent] = useState(false);
  const [privacyPolicyAcknowledged, setPrivacyPolicyAcknowledged] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);

  // File Upload Helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: DocumentType,
    onSuccess: (docId: string, fileName: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds maximum allowed 5 MB limit.");
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

    // Auto-calculate percentage if total and obtained marks are entered
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

  // Step Validation
  const validateStep = (currentStep: number): boolean => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!fullName.trim() || !fatherName.trim() || !motherName.trim() || !dob) {
        setErrorMessage("Please complete all required personal details.");
        return false;
      }
      if (!gender) {
        setErrorMessage("Gender selection is compulsory to proceed.");
        return false;
      }
      if (!mobileNumber.trim() || !email.trim() || !whatsappNumber.trim()) {
        setErrorMessage("Valid contact numbers and email are required.");
        return false;
      }
      if (!currentAddress.street || !currentAddress.city || !currentAddress.pinCode) {
        setErrorMessage("Please complete your current address.");
        return false;
      }
    } else if (currentStep === 2) {
      for (const edu of educationList) {
        if (!edu.degreeName.trim() || !edu.institutionName.trim() || !edu.passingYear) {
          setErrorMessage("Please provide complete degree, institution, and passing year details.");
          return false;
        }
        if (edu.totalMarks && edu.obtainedMarks) {
          if (parseFloat(edu.obtainedMarks) > parseFloat(edu.totalMarks)) {
            setErrorMessage(`Obtained marks cannot exceed total marks for ${edu.degreeName}`);
            return false;
          }
        }
      }
    } else if (currentStep === 3) {
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
    } else if (currentStep === 5) {
      if (!resumeDocId) {
        setErrorMessage("A valid Resume/CV (PDF) upload is mandatory.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setErrorMessage(null);
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accuracyConfirmed || !recruitmentProcessingConsent || !privacyPolicyAcknowledged) {
      setErrorMessage("You must acknowledge all mandatory declaration consents before submission.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      jobId,
      fullName,
      fatherName,
      motherName,
      dateOfBirth: dob,
      gender,
      mobileNumber,
      whatsappNumber,
      email,
      currentAddress,
      permanentAddress: isSameAddress ? currentAddress : permanentAddress,
      isSameAddress,
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
      technicalSkills: technicalSkillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      professionalSkills: professionalSkillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      languagesKnown: languagesInput.split(",").map((s) => s.trim()).filter(Boolean),
      noticePeriodDays: Number(noticePeriodDays) || 0,
      currentEmploymentStatus,
      preferredJobLocation,
      expectedSalary: Number(expectedSalary) || 0,
      availabilityToJoinDate: availabilityDate || undefined,
      additionalInformation,
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
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Application Submitted!</h2>
          <p className="text-slate-600 text-sm mt-2">
            Your application for <strong>{job?.title || "the position"}</strong> has been received by our recruitment team.
          </p>

          <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">Your Application ID</p>
            <p className="text-2xl font-mono font-bold text-blue-950 mt-1 select-all">
              {submissionSuccess.applicationCode}
            </p>
            <p className="text-xs text-blue-600 mt-1">Please save this ID to track your hiring status.</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/track"
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Track Application Progress
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <Link href="/jobs" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mb-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to open positions
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Apply for {job?.title || "Job Position"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {job?.department} • {job?.jobLocation}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              Step {step} of 6
            </span>
          </div>
        </div>

        {/* Multi-Step Wizard Progress */}
        <div className="grid grid-cols-6 gap-2 mb-8 text-center text-xs font-medium">
          {[
            { num: 1, label: "Personal", icon: User },
            { num: 2, label: "Education", icon: GraduationCap },
            { num: 3, label: "Experience", icon: Briefcase },
            { num: 4, label: "Skills", icon: Wrench },
            { num: 5, label: "Documents", icon: FileUp },
            { num: 6, label: "Consent", icon: CheckCircle2 },
          ].map((item) => (
            <div
              key={item.num}
              className={`p-2.5 rounded-lg border transition ${
                step === item.num
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wizard Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> Section A: Personal Information
              </h2>

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
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* MANDATORY GENDER SELECTION */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                  >
                    <option value="" disabled>
                      -- Select Compulsory Gender Option --
                    </option>
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="candidate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition">
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
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Uploaded & Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold text-slate-900">Current Residential Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Street Address / House No."
                      value={currentAddress.street}
                      onChange={(e) =>
                        setCurrentAddress({ ...currentAddress, street: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      value={currentAddress.city}
                      onChange={(e) =>
                        setCurrentAddress({ ...currentAddress, city: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State"
                      value={currentAddress.state}
                      onChange={(e) =>
                        setCurrentAddress({ ...currentAddress, state: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={currentAddress.pinCode}
                      onChange={(e) =>
                        setCurrentAddress({ ...currentAddress, pinCode: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="sameAddr"
                    checked={isSameAddress}
                    onChange={(e) => setIsSameAddress(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="sameAddr" className="text-xs font-medium text-slate-700">
                    Permanent Address is the same as Current Address
                  </label>
                </div>

                {!isSameAddress && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Permanent Street Address"
                        value={permanentAddress.street}
                        onChange={(e) =>
                          setPermanentAddress({ ...permanentAddress, street: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="City"
                        value={permanentAddress.city}
                        onChange={(e) =>
                          setPermanentAddress({ ...permanentAddress, city: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="State"
                        value={permanentAddress.state}
                        onChange={(e) =>
                          setPermanentAddress({ ...permanentAddress, state: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="PIN Code"
                        value={permanentAddress.pinCode}
                        onChange={(e) =>
                          setPermanentAddress({ ...permanentAddress, pinCode: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" /> Section B: Educational Information
                </h2>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Qualification
                </button>
              </div>

              {educationList.map((edu, idx) => (
                <div key={idx} className="p-5 border rounded-xl bg-slate-50/60 space-y-4 relative">
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
                        <option value={EducationCategory.GRADUATION}>Graduation (B.E/B.Tech/B.Sc/etc)</option>
                        <option value={EducationCategory.POST_GRADUATION}>Post Graduation (M.Tech/MCA/MBA)</option>
                        <option value={EducationCategory.OTHER}>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Course Name</label>
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">School / College</label>
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
                        placeholder="e.g. CBSE / VTU / Mumbai Univ"
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

                  {/* Marks & Calculation */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Marks</label>
                      <input
                        type="number"
                        placeholder="1000"
                        value={edu.totalMarks}
                        onChange={(e) => updateEducationField(idx, "totalMarks", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Obtained Marks</label>
                      <input
                        type="number"
                        placeholder="850"
                        value={edu.obtainedMarks}
                        onChange={(e) => updateEducationField(idx, "obtainedMarks", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Percentage (Auto)
                      </label>
                      <input
                        type="number"
                        placeholder="85.00"
                        value={edu.percentage}
                        onChange={(e) => updateEducationField(idx, "percentage", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-100 font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">CGPA (if applicable)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="8.5"
                        value={edu.cgpa}
                        onChange={(e) => updateEducationField(idx, "cgpa", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: WORK EXPERIENCE */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" /> Section C: Work Experience
                </h2>
              </div>

              {/* Fresher vs Experienced Choice */}
              <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Are you a Fresher or Experienced?</p>
                  <p className="text-xs text-slate-500">Freshers can proceed without experience records.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFresher(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      isFresher
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border"
                    }`}
                  >
                    I am a Fresher
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFresher(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      !isFresher
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border"
                    }`}
                  >
                    I have Experience
                  </button>
                </div>
              </div>

              {!isFresher && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addExperience}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Company
                    </button>
                  </div>

                  {experienceList.map((exp, idx) => (
                    <div key={idx} className="p-5 border rounded-xl bg-slate-50/60 space-y-4 relative">
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
                            required
                            placeholder="Current or previous employer"
                            value={exp.companyName}
                            onChange={(e) => updateExperienceField(idx, "companyName", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Software Engineer"
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
                            required
                            value={exp.joiningDate}
                            onChange={(e) => updateExperienceField(idx, "joiningDate", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">Leaving Date</label>
                            <label className="text-xs text-blue-600 flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={exp.currentlyWorking}
                                onChange={(e) => updateExperienceField(idx, "currentlyWorking", e.target.checked)}
                                className="w-3.5 h-3.5 text-blue-600 rounded"
                              />
                              Currently Working
                            </label>
                          </div>
                          <input
                            type="date"
                            disabled={exp.currentlyWorking}
                            value={exp.leavingDate}
                            onChange={(e) => updateExperienceField(idx, "leavingDate", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs disabled:bg-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Last Drawn Salary (Annual)</label>
                          <input
                            type="number"
                            placeholder="800000"
                            value={exp.lastDrawnSalary}
                            onChange={(e) => updateExperienceField(idx, "lastDrawnSalary", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Key Job Responsibilities</label>
                        <textarea
                          rows={2}
                          placeholder="Brief summary of duties and technologies used..."
                          value={exp.jobResponsibilities}
                          onChange={(e) => updateExperienceField(idx, "jobResponsibilities", e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SKILLS & DETAILS */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" /> Section D: Skills & Additional Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technical Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={technicalSkillsInput}
                    onChange={(e) => setTechnicalSkillsInput(e.target.value)}
                    placeholder="React, TypeScript, NestJS, PostgreSQL"
                    className="w-full px-3.5 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={professionalSkillsInput}
                    onChange={(e) => setProfessionalSkillsInput(e.target.value)}
                    placeholder="Leadership, Teamwork, Critical Thinking"
                    className="w-full px-3.5 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Location</label>
                  <input
                    type="text"
                    value={preferredJobLocation}
                    onChange={(e) => setPreferredJobLocation(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Salary (Annual)</label>
                  <input
                    type="number"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Information / Cover Note</label>
                <textarea
                  rows={3}
                  value={additionalInformation}
                  onChange={(e) => setAdditionalInformation(e.target.value)}
                  placeholder="Any additional awards, portfolio links, or statements..."
                  className="w-full px-3.5 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 5: DOCUMENT UPLOADS */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-blue-600" /> Section E: Secure Document Uploads
              </h2>

              <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center">
                <FileUp className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Resume / CV (PDF Format Only, Max 5MB)</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  File signatures are checked via magic bytes to prevent masquerading scripts.
                </p>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>Choose Resume PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, DocumentType.RESUME, (key, name) => {
                        setResumeDocId(key);
                        setResumeFileName(name);
                      })
                    }
                  />
                </label>

                {resumeDocId && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg inline-flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Verified & Attached: {resumeFileName || resumeDocId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: DECLARATION & CONSENT */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Section F: Declaration & Consent
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accuracyConfirmed}
                      onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5"
                    />
                    <span className="text-xs text-slate-700">
                      <strong>Truth & Accuracy Confirmation:</strong> I hereby declare that all the information provided in this application form is true, complete, and accurate to the best of my knowledge.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recruitmentProcessingConsent}
                      onChange={(e) => setRecruitmentProcessingConsent(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5"
                    />
                    <span className="text-xs text-slate-700">
                      <strong>Data Processing Consent:</strong> I agree to the processing and verification of my personal, educational, and professional data for recruitment and evaluation purposes.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyPolicyAcknowledged}
                      onChange={(e) => setPrivacyPolicyAcknowledged(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5"
                    />
                    <span className="text-xs text-slate-700">
                      <strong>Privacy Policy:</strong> I acknowledge and agree to the company privacy and data retention policies.
                    </span>
                  </label>
                </div>

                {/* SEPARATE WHATSAPP CONSENT */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappConsent}
                      onChange={(e) => setWhatsappConsent(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                    />
                    <span className="text-xs text-emerald-900">
                      <strong>Meta WhatsApp Communication Opt-In (Separate Consent):</strong> I explicitly authorize the company to send me interview schedules, calendar reminders, and recruitment updates via WhatsApp Business.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 border-t mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-1 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Final Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
