export type EmailEventType =
  | "application_received"
  | "application_approved"
  | "application_rejected"
  | "application_waitlisted"
  | "application_more_information"
  | "verification_required"
  | "match_created"
  | "video_date_scheduled"
  | "concierge_request_received"
  | "concierge_date_confirmed"
  | "therapist_booking_received"
  | "therapist_booking_confirmed"
  | "experience_request_received"
  | "rsvp_confirmed"
  | "safety_report_received"
  | "admin_new_application_alert"
  | "admin_new_safety_report_alert"
  | "admin_concierge_request_alert";

export type PushPreferenceKey =
  | "matches"
  | "messages"
  | "videoDates"
  | "conciergeUpdates"
  | "therapistBookings"
  | "privateExperiences"
  | "safetyAdminNotices"
  | "marketingOffers";

export type NotificationPreferences = Record<PushPreferenceKey, boolean>;

export type PushEventType =
  | "match_created"
  | "message_received"
  | "video_date_scheduled"
  | "concierge_update"
  | "therapist_booking_update"
  | "event_rsvp_update"
  | "safety_report_update"
  | "admin_new_application_alert"
  | "admin_new_safety_report_alert"
  | "admin_concierge_request_alert";

export const defaultNotificationPreferences: NotificationPreferences = {
  conciergeUpdates: true,
  marketingOffers: false,
  matches: true,
  messages: true,
  privateExperiences: true,
  safetyAdminNotices: true,
  therapistBookings: true,
  videoDates: true
};

export const preferenceLabels: Array<{ key: PushPreferenceKey; label: string }> = [
  { key: "matches", label: "Matches" },
  { key: "messages", label: "Messages" },
  { key: "videoDates", label: "Video dates" },
  { key: "conciergeUpdates", label: "Concierge updates" },
  { key: "therapistBookings", label: "Therapist bookings" },
  { key: "privateExperiences", label: "Private experiences" },
  { key: "safetyAdminNotices", label: "Safety/admin notices" },
  { key: "marketingOffers", label: "Marketing/offers" }
];
