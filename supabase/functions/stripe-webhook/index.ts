import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeWebhookSecret) {
    return json({
      error: "Stripe webhook secret is not configured."
    }, 501);
  }

  return json({
    received: false,
    reason: "Webhook handling is scaffolded for the live Stripe checkout phase."
  }, 501);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}
