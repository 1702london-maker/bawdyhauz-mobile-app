import { supabase, supabaseMode } from "@/lib/supabase";
import { ServiceResult, UserAccessState } from "@/services/types";

type UserRow = {
  role?: "member" | "admin";
  standing?: "clear" | "flagged" | "restricted" | "suspended" | "banned";
};

type ApplicationRow = {
  status?:
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "waitlisted"
    | "more_information";
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AccountStatus = {
  applicationStatus?: string;
  email?: string;
  isAdmin: boolean;
  state: UserAccessState;
  standing?: string;
};

export async function signUpWithEmail(
  credentials: AuthCredentials
): Promise<ServiceResult<AccountStatus | undefined>> {
  if (!supabase) {
    return {
      data: {
        isAdmin: false,
        state: "approved"
      },
      mode: supabaseMode
    };
  }

  const { error } = await supabase.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password
  });

  if (error) {
    return { data: undefined, error: error.message, mode: supabaseMode };
  }

  return getAccountStatus();
}

export async function signInWithEmail(
  credentials: AuthCredentials
): Promise<ServiceResult<AccountStatus | undefined>> {
  if (!supabase) {
    return {
      data: {
        isAdmin: false,
        state: "approved"
      },
      mode: supabaseMode
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password
  });

  if (error) {
    return { data: undefined, error: error.message, mode: supabaseMode };
  }

  return getAccountStatus();
}

export async function getCurrentUserId(): Promise<ServiceResult<string | undefined>> {
  if (!supabase) {
    return { data: undefined, mode: supabaseMode };
  }

  const { data, error } = await supabase.auth.getUser();
  return { data: data.user?.id, error: error?.message, mode: supabaseMode };
}

export async function requireAuthenticatedUser(): Promise<ServiceResult<string | undefined>> {
  if (!supabase) {
    return { data: undefined, mode: supabaseMode };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      data: undefined,
      error: error?.message ?? "Please sign in to continue.",
      mode: supabaseMode
    };
  }

  return { data: data.user.id, mode: supabaseMode };
}

export async function getAccountStatus(): Promise<ServiceResult<AccountStatus>> {
  if (!supabase) {
    return {
      data: {
        isAdmin: false,
        state: "approved"
      },
      mode: supabaseMode
    };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return {
      data: {
        isAdmin: false,
        state: "anonymous"
      },
      error: authError?.message,
      mode: supabaseMode
    };
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("role, standing")
    .eq("id", authData.user.id)
    .maybeSingle<UserRow>();

  if (userError) {
    return {
      data: {
        email: authData.user.email,
        isAdmin: false,
        state: "pending"
      },
      error: userError.message,
      mode: supabaseMode
    };
  }

  if (userRow?.role === "admin") {
    return {
      data: {
        email: authData.user.email,
        isAdmin: true,
        standing: userRow.standing,
        state: "admin"
      },
      mode: supabaseMode
    };
  }

  if (userRow?.standing === "banned" || userRow?.standing === "suspended") {
    return {
      data: {
        email: authData.user.email,
        isAdmin: false,
        standing: userRow.standing,
        state: "banned"
      },
      mode: supabaseMode
    };
  }

  if (userRow?.standing === "restricted") {
    return {
      data: {
        email: authData.user.email,
        isAdmin: false,
        standing: userRow.standing,
        state: "restricted"
      },
      mode: supabaseMode
    };
  }

  const { data: approvedProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", authData.user.id)
    .eq("is_approved", true)
    .maybeSingle<{ id: string }>();

  if (approvedProfile?.id) {
    return {
      data: {
        email: authData.user.email,
        isAdmin: false,
        standing: userRow?.standing,
        state: "approved"
      },
      mode: supabaseMode
    };
  }

  const { data: application } = await supabase
    .from("membership_applications")
    .select("status")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ApplicationRow>();

  const status = application?.status;
  const state: UserAccessState =
    status === "approved"
      ? "approved"
      : status === "rejected"
        ? "rejected"
        : status === "waitlisted"
          ? "waitlisted"
          : "pending";

  return {
    data: {
      applicationStatus: status,
      email: authData.user.email,
      isAdmin: false,
      standing: userRow?.standing,
      state
    },
    mode: supabaseMode
  };
}

export async function getCurrentAccessState(): Promise<ServiceResult<UserAccessState>> {
  const status = await getAccountStatus();
  return {
    data: status.data.state,
    error: status.error,
    mode: status.mode
  };
}

export async function signOut(): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const { error } = await supabase.auth.signOut();
  return { data: !error, error: error?.message, mode: supabaseMode };
}
