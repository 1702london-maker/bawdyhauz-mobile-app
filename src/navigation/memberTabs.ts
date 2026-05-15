export type MemberTab =
  | "home"
  | "discover"
  | "matches"
  | "messages"
  | "membership"
  | "safety"
  | "wellness"
  | "experiences"
  | "admin"
  | "profile"
  | "settings";

export const memberTabs: Array<{ key: MemberTab; label: string }> = [
  { key: "home", label: "Home" },
  { key: "discover", label: "Discover" },
  { key: "matches", label: "Matches" },
  { key: "messages", label: "Messages" },
  { key: "membership", label: "Membership" },
  { key: "safety", label: "Safety" },
  { key: "wellness", label: "Wellness" },
  { key: "experiences", label: "Experiences" },
  { key: "admin", label: "Admin" },
  { key: "profile", label: "Profile" },
  { key: "settings", label: "Settings" }
];
