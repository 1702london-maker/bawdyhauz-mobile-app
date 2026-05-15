import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type AdminActionPayload = {
  action: "warn" | "restrict" | "suspend" | "ban_review" | "escalate" | "close_case";
  incidentId?: string;
  notes?: string;
  targetUserId?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Missing server environment configuration." }, 500);
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: authError
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized." }, 401);
  }

  const { data: userRow } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (userRow?.role !== "admin") {
    return json({ error: "Admin access required." }, 403);
  }

  const payload = (await request.json()) as AdminActionPayload;
  const reviewOnly = payload.action === "ban_review";
  const actionText = payload.action === "close_case" ? "close case" : payload.action.replace("_", " ");

  const { error } = await adminClient.from("moderation_actions").insert({
    action: actionText,
    action_category: payload.action === "escalate" ? "escalation" : "moderation",
    admin_user_id: user.id,
    incident_id: payload.incidentId,
    metadata: {
      reviewOnly,
      source: "admin-actions-edge-function"
    },
    notes: payload.notes,
    review_only: reviewOnly,
    target_user_id: payload.targetUserId
  });

  if (error) {
    return json({ error: error.message }, 400);
  }

  if (payload.incidentId) {
    const incidentPatch =
      payload.action === "close_case"
        ? {
            resolution_summary: payload.notes,
            resolved_at: new Date().toISOString(),
            status: "closed"
          }
        : payload.action === "escalate"
          ? {
              escalated_at: new Date().toISOString(),
              escalation_level: 1,
              escalation_reason: payload.notes,
              status: "under_review"
            }
          : {
              reviewer_notes: payload.notes,
              status: "action_taken"
            };

    await adminClient.from("incidents").update(incidentPatch).eq("id", payload.incidentId);
  }

  await adminClient.from("audit_logs").insert({
    action: `moderation.${payload.action}`,
    actor_user_id: user.id,
    entity_id: payload.incidentId,
    entity_type: "incident",
    metadata: {
      reviewOnly,
      targetUserId: payload.targetUserId
    }
  });

  return json({ ok: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}
