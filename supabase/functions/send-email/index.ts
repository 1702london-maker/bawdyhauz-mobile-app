import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type EmailPayload = {
  eventId?: string;
  eventType: EmailEventType;
  payload?: Record<string, unknown>;
  to?: string;
  userId?: string;
};

type EmailEventType =
  | "admin_concierge_request_alert"
  | "admin_new_application_alert"
  | "admin_new_safety_report_alert"
  | "application_approved"
  | "application_more_information"
  | "application_received"
  | "application_rejected"
  | "application_waitlisted"
  | "concierge_date_confirmed"
  | "concierge_request_received"
  | "experience_request_received"
  | "match_created"
  | "rsvp_confirmed"
  | "safety_report_received"
  | "therapist_booking_confirmed"
  | "therapist_booking_received"
  | "verification_required"
  | "video_date_scheduled";

const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") ?? "BAWDYHAUZ <notifications@bawdyhauz.com>";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = (await request.json()) as EmailPayload;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase =
    supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : undefined;
  const template = renderEmailTemplate(payload.eventType);
  const recipient = payload.to ?? (await resolveRecipient(supabase, payload.userId));

  if (!payload.eventType || !recipient) {
    await writeLog(supabase, payload, "skipped", template.subject, "Missing event type or recipient.");
    return json({ skipped: true, reason: "Missing event type or recipient." }, 202);
  }

  if (!resendKey || !supabase) {
    await writeLog(
      supabase,
      payload,
      "skipped",
      template.subject,
      "RESEND_API_KEY or Supabase service role is not configured."
    );
    return json({ mode: "placeholder", skipped: true, eventType: payload.eventType }, 202);
  }

  const existing = payload.eventId
    ? await supabase
        .from("email_logs")
        .select("id, status")
        .eq("notification_event_id", payload.eventId)
        .maybeSingle()
    : { data: null };

  if (existing.data?.status === "sent") {
    return json({ duplicate: true, eventType: payload.eventType }, 200);
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: fromAddress,
      html: template.html,
      subject: template.subject,
      text: template.body,
      to: recipient
    }),
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const result = await response.json();

  if (!response.ok) {
    await writeLog(supabase, payload, "failed", template.subject, JSON.stringify(result), recipient);
    return json({ error: result, sent: false }, 502);
  }

  await writeLog(supabase, payload, "sent", template.subject, undefined, recipient, result.id);
  if (payload.eventId) {
    await supabase
      .from("notification_events")
      .update({ processed_at: new Date().toISOString(), status: "sent" })
      .eq("id", payload.eventId);
  }

  return json({ providerId: result.id, sent: true }, 200);
});

async function resolveRecipient(
  supabase: ReturnType<typeof createClient> | undefined,
  userId?: string
) {
  if (!supabase || !userId) {
    return undefined;
  }
  const { data } = await supabase.from("users").select("email").eq("id", userId).maybeSingle();
  return data?.email as string | undefined;
}

async function writeLog(
  supabase: ReturnType<typeof createClient> | undefined,
  payload: EmailPayload,
  status: "queued" | "skipped" | "sent" | "failed",
  subject: string,
  errorMessage?: string,
  recipient?: string,
  providerMessageId?: string
) {
  if (!supabase) {
    return;
  }

  const row = {
    error_message: errorMessage,
    event_type: payload.eventType,
    notification_event_id: payload.eventId,
    provider: "resend",
    provider_message_id: providerMessageId,
    recipient,
    sent_at: status === "sent" ? new Date().toISOString() : null,
    status,
    subject,
    template_key: payload.eventType,
    to_email: recipient,
    user_id: payload.userId
  };

  if (payload.eventId) {
    await supabase.from("email_logs").upsert(row, { onConflict: "notification_event_id" });
    return;
  }

  await supabase.from("email_logs").insert(row);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}

function renderEmailTemplate(eventType: EmailEventType) {
  const subject = subjects[eventType] ?? "BAWDYHAUZ update";
  const body = bodies[eventType] ?? "There is a private update waiting for you inside BAWDYHAUZ.";
  const htmlBody = body
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  return {
    body,
    html: `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f1ec;font-family:Arial,sans-serif;"><main style="max-width:640px;margin:0 auto;padding:48px 28px;background:#0b0b0b;border:1px solid rgba(244,241,236,.12);"><p style="letter-spacing:8px;text-transform:uppercase;color:#a9a4a0;font-size:12px;">BAWDYHAUZ</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:42px;line-height:1.05;margin:48px 0 28px;color:#fff;">${escapeHtml(subject)}</h1><div style="font-size:16px;line-height:1.8;color:#c8c1ba;">${htmlBody}</div></main></body></html>`,
    subject
  };
}

const subjects: Record<EmailEventType, string> = {
  admin_concierge_request_alert: "Concierge request awaiting review",
  admin_new_application_alert: "New BAWDYHAUZ application",
  admin_new_safety_report_alert: "Safety report awaiting review",
  application_approved: "Welcome to BAWDYHAUZ",
  application_more_information: "A little more information is requested",
  application_received: "Application received",
  application_rejected: "BAWDYHAUZ application update",
  application_waitlisted: "Membership waitlist update",
  concierge_date_confirmed: "Concierge date confirmed",
  concierge_request_received: "Concierge request received",
  experience_request_received: "Experience request received",
  match_created: "A private introduction has opened",
  rsvp_confirmed: "RSVP confirmed",
  safety_report_received: "Safety report received",
  therapist_booking_confirmed: "Wellness session confirmed",
  therapist_booking_received: "Wellness request received",
  verification_required: "Verification required",
  video_date_scheduled: "Video introduction scheduled"
};

const bodies: Record<EmailEventType, string> = {
  admin_concierge_request_alert: "A member has requested concierge planning. Please review preferences and prepare suitable venue options.\n\nWith discretion,\nBAWDYHAUZ",
  admin_new_application_alert: "A new membership application is ready for private review.\n\nWith discretion,\nBAWDYHAUZ",
  admin_new_safety_report_alert: "A safety report has been submitted and requires calm, human-led review.\n\nWith discretion,\nBAWDYHAUZ",
  application_approved: "Your BAWDYHAUZ membership has been approved. You may now enter the private members area.\n\nWith discretion,\nBAWDYHAUZ",
  application_more_information: "Our review team would like a little more information before completing your application.\n\nWith discretion,\nBAWDYHAUZ",
  application_received: "Your application has been received and is now in private review.\n\nWith discretion,\nBAWDYHAUZ",
  application_rejected: "Thank you for taking the time to apply. Your application has not been approved at this time.\n\nWith discretion,\nBAWDYHAUZ",
  application_waitlisted: "Your application has been placed on the private waitlist.\n\nWith discretion,\nBAWDYHAUZ",
  concierge_date_confirmed: "Your concierge-arranged date has been confirmed.\n\nWith discretion,\nBAWDYHAUZ",
  concierge_request_received: "Your concierge request has been received for private planning.\n\nWith discretion,\nBAWDYHAUZ",
  experience_request_received: "Your private experience request has been received.\n\nWith discretion,\nBAWDYHAUZ",
  match_created: "A mutual introduction has been confirmed. Private chat is now available inside BAWDYHAUZ.\n\nWith discretion,\nBAWDYHAUZ",
  rsvp_confirmed: "Your RSVP has been confirmed.\n\nWith discretion,\nBAWDYHAUZ",
  safety_report_received: "Your safety report has been received for private human-led review.\n\nWith discretion,\nBAWDYHAUZ",
  therapist_booking_confirmed: "Your relationship wellness session has been confirmed.\n\nWith discretion,\nBAWDYHAUZ",
  therapist_booking_received: "Your wellness booking request has been received.\n\nWith discretion,\nBAWDYHAUZ",
  verification_required: "Verification is required before full membership access can be considered.\n\nWith discretion,\nBAWDYHAUZ",
  video_date_scheduled: "Your private video introduction has been scheduled.\n\nWith discretion,\nBAWDYHAUZ"
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
