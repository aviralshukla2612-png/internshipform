import {
  Gender,
  EducationCategory,
  GradingSystem,
  EmploymentType,
  JobStatus,
  ApplicationStatus,
  InterviewRoundType,
  InterviewMode,
  InterviewStatus,
  InterviewRecommendation,
  DocumentType,
  WhatsAppMessageType,
  WhatsAppDeliveryStatus,
  UserRoleType,
  AuditActionType,
  AddressType,
} from '../enums';

export interface AddressDto {
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface EducationEntryDto {
  qualificationType: EducationCategory;
  degreeName: string;
  institutionName: string;
  universityOrBoard: string;
  specialization?: string;
  passingYear: number;
  totalMarks?: number;
  obtainedMarks?: number;
  percentage?: number;
  cgpa?: number;
  gradingSystem: GradingSystem;
  marksheetDocId?: string;
}

export interface ExperienceEntryDto {
  companyName: string;
  companyAddress: string;
  companyWebsite?: string;
  designation: string;
  department: string;
  employmentType: EmploymentType;
  joiningDate: string; // ISO date string
  leavingDate?: string; // ISO date string (empty if currently working)
  currentlyWorking: boolean;
  totalExperienceMonths: number;
  lastDrawnSalary?: number;
  expectedSalary?: number;
  reasonForLeaving?: string;
  jobResponsibilities: string;
  hrContactInfo?: string;
  experienceCertDocId?: string;
}

export interface CandidateApplicationSubmissionDto {
  jobId?: string;
  
  // Section A: Personal Information
  fullName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth: string; // ISO date string
  gender: Gender; // MANDATORY
  mobileNumber?: string;
  whatsappNumber: string;
  email: string;
  currentAddress?: Partial<AddressDto>;
  permanentAddress?: Partial<AddressDto>;
  isSameAddress?: boolean;
  profilePhotoDocId?: string;

  // Section B: Education
  education: EducationEntryDto[];

  // Section C: Work Experience
  isFresher: boolean;
  experiences?: ExperienceEntryDto[];

  // Section D: Skills & Additional
  technicalSkills: string[];
  professionalSkills: string[];
  languagesKnown: string[];
  certifications?: string[];
  noticePeriodDays: number;
  currentEmploymentStatus: string;
  preferredJobLocation: string;
  expectedSalary: number;
  availabilityToJoinDate?: string;
  additionalInformation?: string;

  // Section E: Documents
  resumeDocId: string;
  additionalDocIds?: string[];

  // Section F: Consent & Declaration
  accuracyConfirmed: boolean;
  recruitmentProcessingConsent: boolean;
  privacyPolicyAcknowledged: boolean;
  whatsappConsent: boolean; // Captured separately
}

export interface ApplicationTrackingResponseDto {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  jobDepartment: string;
  appliedDate: string;
  status: ApplicationStatus;
  statusHistory: Array<{
    status: ApplicationStatus;
    changedAt: string;
    remarks?: string;
  }>;
  scheduledInterviews?: Array<{
    roundType: InterviewRoundType;
    mode: InterviewMode;
    scheduledAt: string;
    durationMinutes: number;
    meetingDetails?: string;
    status: InterviewStatus;
  }>;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminUserResponseDto {
  id: string;
  email: string;
  fullName: string;
  roles: UserRoleType[];
  permissions: string[];
  createdAt: string;
}

export interface ScheduleInterviewDto {
  applicationId: string;
  roundType: InterviewRoundType;
  interviewMode: InterviewMode;
  scheduledDate?: string; // YYYY-MM-DD (Optional)
  startTime?: string; // HH:mm (Optional)
  durationMinutes: number;
  interviewerId: string;
  meetingDetails: string;
  instructions?: string;
  remarks?: string;
  sendCandidateWhatsApp: boolean;
  sendCandidateEmail: boolean;
}

export interface SubmitFeedbackDto {
  interviewId: string;
  technicalRating: number; // 1-5
  communicationRating: number; // 1-5
  problemSolvingRating: number; // 1-5
  experienceRating: number; // 1-5
  overallRating: number; // 1-5
  strengths: string;
  weaknesses: string;
  interviewNotes: string;
  recommendation: InterviewRecommendation;
}

export interface DashboardMetricsDto {
  totalApplications: number;
  newApplications: number;
  underReview: number;
  shortlistedCandidates: number;
  rejectedCandidates: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  selectedCandidates: number;
  pendingFeedback: number;
  monthlyTrends: Array<{ month: string; count: number }>;
  statusDistribution: Array<{ status: ApplicationStatus; count: number }>;
  fresherVsExperienced: { freshers: number; experienced: number };
  educationDistribution: Array<{ category: EducationCategory; count: number }>;
  positionStats: Array<{ position: string; count: number }>;
  conversionRatePercent: number;
}
