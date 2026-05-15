export type MembershipTier = "standard" | "black" | "elite" | "founding";
export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "cancelled" | "expired";

export type MembershipPlan = {
  benefits: string[];
  description: string;
  id: string;
  name: string;
  pricePlaceholder: string;
  tier: MembershipTier;
};

export type MemberSubscription = {
  billingNote?: string;
  currentPeriodEnd?: string;
  foundingMember: boolean;
  status: SubscriptionStatus;
  tier: MembershipTier;
};

export const fallbackPlans: MembershipPlan[] = [
  {
    benefits: ["Curated matchmaking access", "Private member profile", "Wellness resources", "Safety review system"],
    description: "Approved member access to the private ecosystem.",
    id: "standard",
    name: "Standard",
    pricePlaceholder: "TBC",
    tier: "standard"
  },
  {
    benefits: ["Priority review", "Premium discovery", "Concierge date planning", "Therapist and wellness access"],
    description: "Priority discovery and concierge-supported introductions.",
    id: "black",
    name: "Black",
    pricePlaceholder: "TBC",
    tier: "black"
  },
  {
    benefits: ["Elevated visibility", "Private experiences", "Concierge priority", "Exclusive member gatherings"],
    description: "Elevated matchmaking, private experiences and concierge priority.",
    id: "elite",
    name: "Elite",
    pricePlaceholder: "TBC",
    tier: "elite"
  },
  {
    benefits: ["Founding member status", "Early-access privileges", "Priority concierge review", "Exclusive member experiences"],
    description: "Lifetime early-access status for founding members.",
    id: "founding",
    name: "Founding Member",
    pricePlaceholder: "Lifetime status",
    tier: "founding"
  }
];
