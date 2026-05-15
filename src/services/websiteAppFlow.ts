import { supabase, supabaseMode } from "@/lib/supabase";

import { ServiceResult } from "./types";

export type WebsiteLeadInput = {
  city?: string;
  email: string;
  intention?: string;
  name?: string;
  referralSource?: string;
  source?: string;
};

export type WebsiteLeadResult = {
  appLoginUrl: string;
  id?: string;
  status: "received" | "offline";
};

export const appDeepLinks = {
  applicationStatus: "bawdyhauz://status",
  apply: "bawdyhauz://apply",
  home: "bawdyhauz://home",
  login: "bawdyhauz://login",
  privateBeta: "bawdyhauz://beta"
};

export function buildAppLoginLink(email?: string) {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return `${appDeepLinks.login}${query}`;
}

export async function submitWebsiteWaitlistLead(
  input: WebsiteLeadInput
): Promise<ServiceResult<WebsiteLeadResult>> {
  if (!supabase) {
    return {
      data: {
        appLoginUrl: buildAppLoginLink(input.email),
        status: "offline"
      },
      mode: supabaseMode
    };
  }

  const { data, error } = await supabase
    .from("website_waitlist")
    .insert({
      city: input.city,
      email: input.email.trim().toLowerCase(),
      intention: input.intention,
      name: input.name,
      referral_source: input.referralSource ?? input.source,
      status: "received"
    })
    .select("id")
    .single<{ id: string }>();

  return {
    data: {
      appLoginUrl: buildAppLoginLink(input.email),
      id: data?.id,
      status: error ? "offline" : "received"
    },
    error: error?.message,
    mode: supabaseMode
  };
}
