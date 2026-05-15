export type ServiceResult<T> = {
  data: T;
  error?: string;
  mode: "mock" | "connected";
};

export type UserAccessState =
  | "anonymous"
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "restricted"
  | "banned"
  | "admin";

export type AuthGateDestination =
  | "applicationStatus"
  | "auth"
  | "approvedMemberShell"
  | "membershipApplication"
  | "restrictedAccess"
  | "accountStatus"
  | "adminDashboard";
