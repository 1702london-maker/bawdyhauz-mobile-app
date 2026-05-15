import { AppRoute } from "@/navigation/routes";
import { UserAccessState } from "@/services/types";

export type DeepLinkIntent = {
  email?: string;
  route: AppRoute;
};

export function resolveDeepLink(url: string, accessState: UserAccessState): DeepLinkIntent | undefined {
  try {
    const parsed = new URL(url);
    const target = `${parsed.hostname}${parsed.pathname}`.replace(/^\/+/, "");
    const email = parsed.searchParams.get("email") ?? undefined;

    if (target === "apply") {
      return { email, route: "membershipApplication" };
    }

    if (target === "status") {
      return { email, route: accessState === "anonymous" ? "auth" : "applicationStatus" };
    }

    if (target === "login" || target === "auth") {
      return { email, route: "auth" };
    }

    if (target === "home" || target === "member") {
      return {
        email,
        route: accessState === "approved" || accessState === "admin" ? "approvedMemberShell" : "auth"
      };
    }

    if (target === "beta") {
      return {
        email,
        route: accessState === "approved" || accessState === "admin" ? "approvedMemberShell" : "auth"
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}
