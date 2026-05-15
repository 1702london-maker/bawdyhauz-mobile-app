import { EmailEventType } from "@/data/notifications";

type EmailTemplate = {
  body: string;
  preheader: string;
  subject: string;
};

const signOff = "With discretion,\nBAWDYHAUZ";

const templates: Record<EmailEventType, EmailTemplate> = {
  admin_concierge_request_alert: {
    body: `A member has requested concierge planning. Please review the request, confirm preferences and prepare suitable venue options.\n\n${signOff}`,
    preheader: "A concierge request is ready for review.",
    subject: "Concierge request awaiting review"
  },
  admin_new_application_alert: {
    body: `A new membership application is ready for private review. Please assess fit, safety, verification readiness and reviewer notes before taking action.\n\n${signOff}`,
    preheader: "A new applicant is awaiting private review.",
    subject: "New BAWDYHAUZ application"
  },
  admin_new_safety_report_alert: {
    body: `A safety report has been submitted and requires calm, human-led review. Please assess the report queue and record any action discreetly.\n\n${signOff}`,
    preheader: "A safety report requires review.",
    subject: "Safety report awaiting review"
  },
  application_approved: {
    body: `Your BAWDYHAUZ membership has been approved. You may now enter the private members area and continue your curated introduction journey.\n\n${signOff}`,
    preheader: "Your private membership has been approved.",
    subject: "Welcome to BAWDYHAUZ"
  },
  application_more_information: {
    body: `Our review team would like a little more information before completing your application. Please return to your application when convenient.\n\n${signOff}`,
    preheader: "A small update is needed to continue review.",
    subject: "A little more information is requested"
  },
  application_received: {
    body: `Your application has been received. The BAWDYHAUZ team will review your details privately and carefully before access is considered.\n\n${signOff}`,
    preheader: "Your application is now in private review.",
    subject: "Application received"
  },
  application_rejected: {
    body: `Thank you for taking the time to apply. Your application has not been approved at this time. We appreciate the care you brought to the process.\n\n${signOff}`,
    preheader: "A private update about your application.",
    subject: "BAWDYHAUZ application update"
  },
  application_waitlisted: {
    body: `Your application has been placed on the private waitlist. We will contact you if a suitable membership opening becomes available.\n\n${signOff}`,
    preheader: "Your application is on the private waitlist.",
    subject: "Membership waitlist update"
  },
  concierge_date_confirmed: {
    body: `Your concierge-arranged date has been confirmed. Details will remain discreet and available through your member experience.\n\n${signOff}`,
    preheader: "Your private date has been confirmed.",
    subject: "Concierge date confirmed"
  },
  concierge_request_received: {
    body: `Your concierge request has been received. Our team will review your preferences and prepare the next step with care.\n\n${signOff}`,
    preheader: "Your concierge request is now with the team.",
    subject: "Concierge request received"
  },
  experience_request_received: {
    body: `Your request for a private experience has been received. Invitations and access remain curated by the BAWDYHAUZ team.\n\n${signOff}`,
    preheader: "Your private experience request was received.",
    subject: "Experience request received"
  },
  match_created: {
    body: `A mutual introduction has been confirmed. Private chat is now available inside BAWDYHAUZ.\n\n${signOff}`,
    preheader: "A private introduction is ready.",
    subject: "A private introduction has opened"
  },
  rsvp_confirmed: {
    body: `Your RSVP has been confirmed. Please review arrival details inside the app before attending.\n\n${signOff}`,
    preheader: "Your invitation has been confirmed.",
    subject: "RSVP confirmed"
  },
  safety_report_received: {
    body: `Your safety report has been received. It will be reviewed privately by the BAWDYHAUZ team. If there is immediate danger, please contact local emergency services first.\n\n${signOff}`,
    preheader: "Your report is now under private review.",
    subject: "Safety report received"
  },
  therapist_booking_confirmed: {
    body: `Your relationship wellness session has been confirmed. Session details will remain discreet within your member experience.\n\n${signOff}`,
    preheader: "Your wellness session is confirmed.",
    subject: "Wellness session confirmed"
  },
  therapist_booking_received: {
    body: `Your wellness booking request has been received. The team will review availability and respond with the next step.\n\n${signOff}`,
    preheader: "Your wellness request is being reviewed.",
    subject: "Wellness request received"
  },
  verification_required: {
    body: `Verification is required before full membership access can be considered. Please complete the private verification steps in BAWDYHAUZ.\n\n${signOff}`,
    preheader: "Verification is needed to continue.",
    subject: "Verification required"
  },
  video_date_scheduled: {
    body: `Your private video introduction has been scheduled. The session is designed for a calm, considered first conversation.\n\n${signOff}`,
    preheader: "Your private video introduction is scheduled.",
    subject: "Video introduction scheduled"
  }
};

export function renderEmailTemplate(eventType: EmailEventType, values: Record<string, string> = {}) {
  const template = templates[eventType];
  const replace = (input: string) =>
    Object.entries(values).reduce(
      (current, [key, value]) => current.replaceAll(`{{${key}}}`, value),
      input
    );

  return {
    body: replace(template.body),
    html: renderHtml(replace(template.subject), replace(template.preheader), replace(template.body)),
    preheader: replace(template.preheader),
    subject: replace(template.subject)
  };
}

function renderHtml(subject: string, preheader: string, body: string) {
  const paragraphs = body
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#050505;color:#f4f1ec;font-family:Jost,Arial,sans-serif;">
    <div style="display:none;opacity:0;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
    <main style="max-width:640px;margin:0 auto;padding:48px 28px;background:#0b0b0b;border:1px solid rgba(244,241,236,0.12);">
      <p style="letter-spacing:8px;text-transform:uppercase;color:#a9a4a0;font-size:12px;">BAWDYHAUZ</p>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:42px;line-height:1.05;margin:48px 0 28px;color:#fff;">${escapeHtml(subject)}</h1>
      <div style="font-size:16px;line-height:1.8;color:#c8c1ba;">${paragraphs}</div>
    </main>
  </body>
</html>`;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
