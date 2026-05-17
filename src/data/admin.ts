export type AdminApplicationStatus =
  | "pending"
  | "submitted"
  | "under review"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "more information";
export type AdminApplicationAction =
  | "approve"
  | "reject"
  | "waitlist"
  | "more information"
  | "restrict"
  | "ban";
export type VerificationStatus = "pending" | "id reviewed" | "selfie reviewed" | "verified" | "manual hold";
export type BookingStatus = "pending" | "requested" | "planning" | "options_sent" | "confirmed" | "cancelled" | "completed";
export type ConciergeStatus = "video follow-up" | "physical date request" | "venue selection" | "booking pending" | "confirmed";
export type ExperienceGuestStatus = "rsvp request" | "waitlist request" | "confirmed guest";
export type ModerationAction = "warn" | "restrict" | "suspend" | "ban" | "close case" | "";

export type AdminApplicant = {
  city: string;
  createdAt?: string;
  id: string;
  intention: string;
  name: string;
  notes?: Array<{
    followUpNeeded: boolean;
    id: string;
    note: string;
  }>;
  profileSummary?: string;
  summary: string;
  status: AdminApplicationStatus;
  userId?: string;
  verificationStatus?: string;
    email?: string;
    isWebsiteApplicant?: boolean;
};

export type AdminVerification = {
  id: string;
  memberName: string;
  idPlaceholder: string;
  selfiePlaceholder: string;
  status: VerificationStatus;
};

export type AdminConciergeRequest = {
  id: string;
  memberNames: string;
  city: string;
  requestType: ConciergeStatus;
  bookingStatus: BookingStatus;
};

export type AdminTherapistBooking = {
  id: string;
  memberName: string;
  therapistName: string;
  sessionType: string;
  status: BookingStatus;
};

export type AdminExperienceGuest = {
  id: string;
  memberName: string;
  experienceTitle: string;
  status: ExperienceGuestStatus;
};

export const adminApplicants: AdminApplicant[] = [
  {
    id: "app-201",
    name: "Serena L.",
    city: "London",
    intention: "Long-term connection",
    summary: "Values-led applicant with complete profile and private social context.",
    status: "pending"
  },
  {
    id: "app-202",
    name: "Julian R.",
    city: "Paris",
    intention: "Curated dating",
    summary: "Strong lifestyle fit; reviewer requested additional verification context.",
    status: "pending"
  }
];

export const adminVerifications: AdminVerification[] = [
  {
    id: "ver-301",
    memberName: "Amelia",
    idPlaceholder: "Passport image placeholder",
    selfiePlaceholder: "Live selfie placeholder",
    status: "pending"
  },
  {
    id: "ver-302",
    memberName: "Marcus",
    idPlaceholder: "Driving licence placeholder",
    selfiePlaceholder: "Live selfie placeholder",
    status: "id reviewed"
  }
];

export const adminConciergeRequests: AdminConciergeRequest[] = [
  {
    id: "con-401",
    memberNames: "Amelia + Marcus",
    city: "London",
    requestType: "video follow-up",
    bookingStatus: "pending"
  },
  {
    id: "con-402",
    memberNames: "Celeste + Nathaniel",
    city: "Paris",
    requestType: "venue selection",
    bookingStatus: "confirmed"
  }
];

export const adminTherapistBookings: AdminTherapistBooking[] = [
  {
    id: "ther-501",
    memberName: "Member A",
    therapistName: "Dr Elena Ward",
    sessionType: "Dating guidance",
    status: "pending"
  },
  {
    id: "ther-502",
    memberName: "Member B",
    therapistName: "Marina Vale",
    sessionType: "Boundary setting",
    status: "confirmed"
  }
];

export const adminExperienceGuests: AdminExperienceGuest[] = [
  {
    id: "exp-601",
    memberName: "Serena L.",
    experienceTitle: "The Mayfair Table",
    status: "rsvp request"
  },
  {
    id: "exp-602",
    memberName: "Julian R.",
    experienceTitle: "Dubai Members Mixer",
    status: "waitlist request"
  },
  {
    id: "exp-603",
    memberName: "Amelia",
    experienceTitle: "Quiet Wellness Evening",
    status: "confirmed guest"
  }
];
