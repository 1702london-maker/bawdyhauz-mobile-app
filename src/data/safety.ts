export type UserStanding = "clear" | "flagged" | "restricted" | "suspended" | "banned";
export type IncidentStatus = "report received" | "under review" | "action taken" | "closed";
export type ReportReason =
  | "inappropriate behaviour"
  | "harassment"
  | "no-show"
  | "misrepresentation"
  | "unsafe conduct"
  | "other concern";

export type ModerationReport = {
  id: string;
  memberName: string;
  reason: ReportReason;
  status: IncidentStatus;
  summary: string;
  trustScore: number;
  standing: UserStanding;
};

export const reportReasons: ReportReason[] = [
  "inappropriate behaviour",
  "harassment",
  "no-show",
  "misrepresentation",
  "unsafe conduct",
  "other concern"
];

export const userStandings: UserStanding[] = [
  "clear",
  "flagged",
  "restricted",
  "suspended",
  "banned"
];

export const moderationReports: ModerationReport[] = [
  {
    id: "inc-1042",
    memberName: "Member A",
    reason: "misrepresentation",
    status: "under review",
    summary: "Profile context did not match in-person introduction. Manual review required.",
    trustScore: 72,
    standing: "flagged"
  },
  {
    id: "inc-1043",
    memberName: "Member B",
    reason: "no-show",
    status: "report received",
    summary: "Concierge-arranged meeting was missed without prior notice.",
    trustScore: 84,
    standing: "clear"
  }
];
