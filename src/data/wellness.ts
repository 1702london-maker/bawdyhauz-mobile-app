export type TherapistProfile = {
  id: string;
  name: string;
  title: string;
  availability: string;
  bio: string;
  qualifications: string[];
  sessionApproach: string;
  sessionTypes: string[];
  specialisms: string[];
  availableTimes: string[];
  verified: boolean;
};

export type WellnessResource = {
  id: string;
  title: string;
  category: string;
  summary: string;
};

export const therapists: TherapistProfile[] = [
  {
    id: "elena",
    name: "Dr Elena Ward",
    title: "Relationship Therapist",
    availability: "This week",
    bio: "Elena supports members with emotional clarity, communication patterns and relationship readiness in a calm, confidential setting.",
    qualifications: ["UKCP registration under review", "Relationship therapy specialist", "Private practice background"],
    sessionApproach:
      "Reflective, structured and discreet. Sessions focus on patterns, boundaries and the emotional context around dating.",
    sessionTypes: ["Private therapy", "Dating guidance", "Post-date reflection"],
    specialisms: ["Attachment patterns", "Communication", "Relationship readiness"],
    availableTimes: ["Tuesday 18:00", "Thursday 12:30", "Saturday 10:00"],
    verified: true
  },
  {
    id: "marina",
    name: "Marina Vale",
    title: "Intimacy & Communication Coach",
    availability: "Limited",
    bio: "Marina works with members preparing for intentional connection, helping clarify needs, expectations and conversational confidence.",
    qualifications: ["Certified coaching background", "Communication facilitation", "Couples support background"],
    sessionApproach:
      "Gentle, practical and values-led. Sessions are designed for members seeking clarity before or after meaningful introductions.",
    sessionTypes: ["Relationship coaching", "Emotional preparation", "Boundary setting"],
    specialisms: ["Boundaries", "Consent education", "Dating confidence"],
    availableTimes: ["Monday 19:00", "Wednesday 17:30", "Friday 13:00"],
    verified: true
  },
  {
    id: "samuel",
    name: "Samuel King",
    title: "Relationship Wellness Practitioner",
    availability: "Next week",
    bio: "Samuel offers reflective support for members navigating private connection, closure and mature relationship decisions.",
    qualifications: ["Wellness practitioner background", "Conflict navigation", "Private client work"],
    sessionApproach:
      "Measured and grounded. Sessions focus on emotional steadiness, respectful closure and communication repair.",
    sessionTypes: ["Wellness session", "Debrief", "Relationship support"],
    specialisms: ["Closure", "Conflict repair", "Emotional regulation"],
    availableTimes: ["Tuesday 09:30", "Thursday 16:00", "Sunday 11:00"],
    verified: true
  }
];

export const wellnessResources: WellnessResource[] = [
  {
    id: "clarity",
    title: "Before an intentional introduction",
    category: "Relationship preparation",
    summary: "Questions for clarifying readiness, expectations and emotional availability."
  },
  {
    id: "boundaries",
    title: "Boundaries without performance",
    category: "Boundaries",
    summary: "A discreet guide to naming limits clearly and calmly."
  },
  {
    id: "consent",
    title: "Consent as ongoing communication",
    category: "Consent education",
    summary: "A mature framing of consent, pacing and mutual comfort."
  },
  {
    id: "debrief",
    title: "Post-date emotional debrief",
    category: "Emotional guidance",
    summary: "How to reflect honestly after a meaningful first meeting."
  }
];
