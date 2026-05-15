import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAdminUser } from "./auth";
import { ServiceResult } from "./types";

export type SupportedCity = {
  city: string;
  conciergeCoverage: string;
  country: string;
  currencyCode: string;
  id: string;
  launchNotes?: string;
  launchStatus: string;
  localeCode: string;
  therapistCoverage: string;
  timezone: string;
  venueCoverage: string;
};

export type ScalingChecklist = {
  cityLaunch: string[];
  conciergeHiring: string[];
  moderationStaffing: string[];
  technical: string[];
  therapistOnboarding: string[];
  venueOnboarding: string[];
};

const fallbackCities: SupportedCity[] = [
  {
    city: "London",
    conciergeCoverage: "limited",
    country: "United Kingdom",
    currencyCode: "GBP",
    id: "city-london",
    launchNotes: "First private beta city.",
    launchStatus: "private_beta",
    localeCode: "en-GB",
    therapistCoverage: "limited",
    timezone: "Europe/London",
    venueCoverage: "limited"
  },
  {
    city: "Paris",
    conciergeCoverage: "planned",
    country: "France",
    currencyCode: "EUR",
    id: "city-paris",
    launchNotes: "Partner and venue review market.",
    launchStatus: "planned",
    localeCode: "fr-FR",
    therapistCoverage: "planned",
    timezone: "Europe/Paris",
    venueCoverage: "planned"
  }
];

export const scalingChecklist: ScalingChecklist = {
  cityLaunch: [
    "Confirm legal, safety and privacy requirements for the city.",
    "Prepare first concierge shortlist and venue partner map.",
    "Invite a small reviewed beta cohort before public expansion.",
    "Run weekly incident, support and satisfaction review."
  ],
  conciergeHiring: [
    "Hire city lead with private hospitality experience.",
    "Train on BAWDYHAUZ tone, privacy and audit logging.",
    "Prepare venue outreach and escalation playbooks."
  ],
  moderationStaffing: [
    "Keep approvals, safety reports and bans human-led.",
    "Review trust signals daily during beta.",
    "Maintain clear audit notes for every account action."
  ],
  technical: [
    "Review RLS query plans before each city expansion.",
    "Add indexes for high-volume city filters.",
    "Separate staging and production migration pipelines.",
    "Validate backup restore before launch campaigns."
  ],
  therapistOnboarding: [
    "Verify credentials and private-practice fit.",
    "Document availability, approach and boundaries.",
    "Keep wellness copy away from medical claims."
  ],
  venueOnboarding: [
    "Confirm privacy level, guest tone and arrival flow.",
    "Capture booking contact and capacity.",
    "Review member feedback after every booking."
  ]
};

type CityRow = {
  city: string;
  concierge_coverage: string;
  country: string;
  currency_code: string;
  id: string;
  launch_notes: string | null;
  launch_status: string;
  locale_code: string;
  therapist_coverage: string;
  timezone: string;
  venue_coverage: string;
};

export async function loadSupportedCities(): Promise<ServiceResult<SupportedCity[]>> {
  if (!supabase) {
    return { data: fallbackCities, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("supported_cities")
    .select(
      "id, city, country, launch_status, concierge_coverage, therapist_coverage, venue_coverage, timezone, currency_code, locale_code, launch_notes"
    )
    .order("city", { ascending: true })
    .limit(50);

  if (error) {
    return { data: fallbackCities, error: error.message, mode: supabaseMode };
  }

  return {
    data: ((data ?? []) as CityRow[]).map((city) => ({
      city: city.city,
      conciergeCoverage: city.concierge_coverage,
      country: city.country,
      currencyCode: city.currency_code,
      id: city.id,
      launchNotes: city.launch_notes ?? undefined,
      launchStatus: city.launch_status,
      localeCode: city.locale_code,
      therapistCoverage: city.therapist_coverage,
      timezone: city.timezone,
      venueCoverage: city.venue_coverage
    })),
    mode: supabaseMode
  };
}

export async function updateCityLaunchStatus(
  cityId: string,
  launchStatus: string
): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("supported_cities")
    .update({ launch_status: launchStatus })
    .eq("id", cityId);

  return { data: !error, error: error?.message, mode: supabaseMode };
}
