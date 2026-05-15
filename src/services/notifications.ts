import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  defaultNotificationPreferences,
  EmailEventType,
  NotificationPreferences
} from "@/data/notifications";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";

type PreferenceRow = {
  concierge_updates: boolean;
  marketing_offers: boolean;
  matches: boolean;
  messages: boolean;
  private_experiences: boolean;
  safety_admin_notices: boolean;
  therapist_bookings: boolean;
  video_dates: boolean;
};

function toDbPreferences(preferences: NotificationPreferences) {
  return {
    concierge_updates: preferences.conciergeUpdates,
    marketing_offers: preferences.marketingOffers,
    matches: preferences.matches,
    messages: preferences.messages,
    private_experiences: preferences.privateExperiences,
    safety_admin_notices: preferences.safetyAdminNotices,
    therapist_bookings: preferences.therapistBookings,
    video_dates: preferences.videoDates
  };
}

function fromDbPreferences(row?: PreferenceRow | null): NotificationPreferences {
  if (!row) {
    return defaultNotificationPreferences;
  }

  return {
    conciergeUpdates: row.concierge_updates,
    marketingOffers: row.marketing_offers,
    matches: row.matches,
    messages: row.messages,
    privateExperiences: row.private_experiences,
    safetyAdminNotices: row.safety_admin_notices,
    therapistBookings: row.therapist_bookings,
    videoDates: row.video_dates
  };
}

export async function recordEmailEvent(
  eventType: EmailEventType,
  payload: Record<string, unknown> = {}
): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  const event = await supabase
    .from("notification_events")
    .insert({
      channel: "email",
      event_type: eventType,
      payload,
      status: "queued",
      user_id: user.data
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (!event.error) {
    await supabase.functions.invoke("send-email", {
      body: {
        eventId: event.data?.id,
        eventType,
        payload,
        userId: user.data
      }
    });
  }

  return { data: !event.error, error: event.error?.message, mode: supabaseMode };
}

export async function loadNotificationPreferences(): Promise<ServiceResult<NotificationPreferences>> {
  if (!supabase) {
    return { data: defaultNotificationPreferences, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: defaultNotificationPreferences, error: user.error, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("matches, messages, video_dates, concierge_updates, therapist_bookings, private_experiences, safety_admin_notices, marketing_offers")
    .eq("user_id", user.data)
    .maybeSingle<PreferenceRow>();

  if (!data && !error) {
    await saveNotificationPreferences(defaultNotificationPreferences);
  }

  return { data: fromDbPreferences(data), error: error?.message, mode: supabaseMode };
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<ServiceResult<NotificationPreferences>> {
  if (!supabase) {
    return { data: preferences, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: preferences, error: user.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    ...toDbPreferences(preferences),
    user_id: user.data
  });

  return { data: preferences, error: error?.message, mode: supabaseMode };
}

export async function registerPushToken(): Promise<ServiceResult<string | undefined>> {
  try {
    if (!supabase) {
      return { data: undefined, mode: supabaseMode };
    }

    const user = await requireAuthenticatedUser();
    if (!user.data) {
      return { data: undefined, error: user.error, mode: supabaseMode };
    }

    const permissions = await Notifications.getPermissionsAsync();
    const finalPermission =
      permissions.status === "granted" ? permissions : await Notifications.requestPermissionsAsync();

    if (finalPermission.status !== "granted") {
      return {
        data: undefined,
        error: "Push permission denied. BAWDYHAUZ will continue without push notifications.",
        mode: supabaseMode
      };
    }

    const token = await Notifications.getExpoPushTokenAsync();
    const { error } = await supabase.from("push_tokens").upsert({
      device_label: Platform.OS,
      enabled: true,
      expo_push_token: token.data,
      platform: Platform.OS,
      user_id: user.data
    });

    return { data: token.data, error: error?.message, mode: supabaseMode };
  } catch (error) {
    return {
      data: undefined,
      error: error instanceof Error ? error.message : "Push registration is unavailable.",
      mode: supabaseMode
    };
  }
}
