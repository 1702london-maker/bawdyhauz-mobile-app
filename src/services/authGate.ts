import { AuthGateDestination, UserAccessState } from "@/services/types";

export function getAuthGateDestination(state: UserAccessState): AuthGateDestination {
  if (state === "anonymous") {
    return "auth";
  }

  if (state === "admin") {
    return "approvedMemberShell";
  }

  if (state === "approved") {
    return "approvedMemberShell";
  }

  if (state === "banned") {
    return "accountStatus";
  }

  if (state === "restricted" || state === "rejected" || state === "waitlisted") {
    return "accountStatus";
  }

  return "applicationStatus";
}
