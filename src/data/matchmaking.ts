export type MatchStatus = "chatActive" | "videoLocked" | "videoAvailable" | "conciergeEligible";

export type MemberProfile = {
  id: string;
  name: string;
  age: number;
  location: string;
  intention: string;
  bio: string;
  interests: string[];
  lifestyleNotes: string;
  preferredIntroductionCity: string;
  compatibilitySignals?: string[];
  completionPercentage?: number;
  imageUrl?: string;
  isFeatured?: boolean;
  verified: boolean;
  visibilityWeight?: number;
  matchStatus?: MatchStatus;
  matchId?: string;
  mutualInterestReady?: boolean;
  threadId?: string;
};

export const memberProfiles: MemberProfile[] = [
  {
    id: "amelia",
    name: "Amelia",
    age: 34,
    location: "London",
    intention: "Long-term connection",
    bio: "A private gallery director with a measured social rhythm, drawn to conversation, design hotels and thoughtful introductions.",
    interests: ["Contemporary art", "Fine dining", "Wellness", "Members lounges"],
    lifestyleNotes:
      "Prefers quiet restaurants, late museum evenings and weekends split between London and the coast.",
    preferredIntroductionCity: "London",
    verified: true,
    matchStatus: "chatActive",
    mutualInterestReady: true
  },
  {
    id: "marcus",
    name: "Marcus",
    age: 39,
    location: "Manchester",
    intention: "Curated dating",
    bio: "Founder, collector and early riser. Values warmth, directness and a partner with a life already fully in motion.",
    interests: ["Architecture", "Private dinners", "Travel", "Culture"],
    lifestyleNotes:
      "Enjoys boutique hotels, slow Sundays and restaurants where the room is as considered as the menu.",
    preferredIntroductionCity: "Manchester",
    verified: true,
    matchStatus: "videoLocked",
    mutualInterestReady: true
  },
  {
    id: "celeste",
    name: "Celeste",
    age: 31,
    location: "Paris",
    intention: "Emotionally intelligent partnership",
    bio: "Consultant and amateur pianist. Looking for someone emotionally articulate, discreet and genuinely present.",
    interests: ["Classical music", "Wellness", "Paris", "Fine dining"],
    lifestyleNotes:
      "Splits time between Paris and London, prefers intimate lounges and intentional introductions.",
    preferredIntroductionCity: "Paris",
    verified: true,
    matchStatus: "videoAvailable",
    mutualInterestReady: true
  },
  {
    id: "nathaniel",
    name: "Nathaniel",
    age: 42,
    location: "Dubai",
    intention: "Serious companionship",
    bio: "Hospitality operator with a calm temperament. Interested in shared rituals, travel and private members events.",
    interests: ["Hospitality", "Travel", "Members clubs", "Wellness"],
    lifestyleNotes:
      "Based between Dubai and London, with a preference for refined venues and gentle pacing.",
    preferredIntroductionCity: "Dubai",
    verified: true,
    matchStatus: "conciergeEligible",
    mutualInterestReady: false
  }
];

export const matchStatusLabels: Record<MatchStatus, string> = {
  chatActive: "Chat active",
  videoLocked: "Video locked",
  videoAvailable: "Video available",
  conciergeEligible: "Concierge eligible"
};
