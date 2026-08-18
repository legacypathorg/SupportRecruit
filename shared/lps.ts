/** Legacy Path Solutions — shared domain constants */

export const APPLICATION_STATUSES = [
  "New Application",
  "Under Review",
  "Additional Information Needed",
  "Interview Requested",
  "Interview Scheduled",
  "Approved",
  "Agreement Pending",
  "Registration Pending",
  "Training Pending",
  "Active Support Specialist",
  "Waitlisted",
  "Declined",
  "Withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  "New Application": "bg-blue-100 text-blue-800",
  "Under Review": "bg-amber-100 text-amber-800",
  "Additional Information Needed": "bg-orange-100 text-orange-800",
  "Interview Requested": "bg-purple-100 text-purple-800",
  "Interview Scheduled": "bg-violet-100 text-violet-800",
  "Approved": "bg-emerald-100 text-emerald-800",
  "Agreement Pending": "bg-cyan-100 text-cyan-800",
  "Registration Pending": "bg-teal-100 text-teal-800",
  "Training Pending": "bg-sky-100 text-sky-800",
  "Active Support Specialist": "bg-green-100 text-green-900",
  "Waitlisted": "bg-yellow-100 text-yellow-800",
  "Declined": "bg-red-100 text-red-800",
  "Withdrawn": "bg-gray-200 text-gray-700",
};

export const EMAIL_TEMPLATE_KEYS = [
  "application_received",
  "additional_info_requested",
  "interview_invitation",
  "application_approved",
  "agreement_registration",
  "training_invitation",
  "application_waitlisted",
  "application_declined",
  "specialist_activated",
] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  application_received: "Application Received",
  additional_info_requested: "Additional Information Requested",
  interview_invitation: "Interview Invitation",
  application_approved: "Application Approved",
  agreement_registration: "Agreement & Registration Instructions",
  training_invitation: "Training Invitation",
  application_waitlisted: "Application Waitlisted",
  application_declined: "Application Declined",
  specialist_activated: "Support Specialist Activated",
};

/** Statuses that auto-trigger a lifecycle email when set */
export const STATUS_EMAIL_MAP: Partial<Record<ApplicationStatus, EmailTemplateKey>> = {
  "Additional Information Needed": "additional_info_requested",
  "Interview Requested": "interview_invitation",
  "Approved": "application_approved",
  "Agreement Pending": "agreement_registration",
  "Training Pending": "training_invitation",
  "Waitlisted": "application_waitlisted",
  "Declined": "application_declined",
  "Active Support Specialist": "specialist_activated",
};

export const WEEKLY_AVAILABILITY = ["5-10 Hours", "10-20 Hours", "20+ Hours"] as const;

export const WORKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Other",
] as const;

export const EXPERIENCE_OPTIONS = [
  "Client support/customer service",
  "Administrative or virtual assistant work",
  "Real estate, mortgage or title services",
  "Estate planning or legal-adjacent services (non-legal)",
  "Document organization/intake processing",
  "CRM or online platforms",
] as const;

export const DOCUMENT_TYPES = ["Resume", "ID", "Certification", "Other"] as const;

export const MILESTONE_STATUS = ["Not Started", "Pending", "Sent", "Received", "Signed", "Paid", "Waived", "In Progress", "Completed"] as const;

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota",
  "Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
  "Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah",
  "Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
] as const;

export const BRAND = {
  name: "Legacy Path Solutions",
  navy: "#0F2044",
  navyLight: "#1C3260",
  gold: "#C9A227",
  goldLight: "#E3C767",
  cream: "#FAF7F0",
} as const;
