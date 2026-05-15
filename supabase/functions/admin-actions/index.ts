import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type AdminActionPayload = {
  action: "warn" | "restrict" | "suspend" | "ban" | "close case";
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

  const { error } = await adminClient.from("moderation_actions").insert({
    action: payload.action,
    admin_user_id: user.id,
    incident_id: payload.incidentId,
    notes: payload.notes,
    target_user_id: payload.targetUserId
  });

  if (error) {
    return json({ error: error.message }, 400);
  }

  return json({ ok: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}
