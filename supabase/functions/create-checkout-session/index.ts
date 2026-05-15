import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    return json({
      error: "Stripe is not configured. Add STRIPE_SECRET_KEY as a Supabase function secret before live checkout."
    }, 501);
  }

  return json({
    error: "Checkout creation is intentionally placeholder-only until live Stripe checkout phase."
  }, 501);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}
