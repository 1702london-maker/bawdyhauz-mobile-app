import { supabase, supabaseMode } from "@/lib/supabase";
import { isUuid } from "@/lib/ids";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";

export type MessageDraft = {
  body: string;
  threadId: string;
};

export type ThreadMessage = {
  body: string;
  createdAt: string;
  deliveryStatus?: string;
  id: string;
  mine: boolean;
  moderationStatus?: string;
  readAt?: string | null;
};

type MessageRow = {
  body: string | null;
  created_at: string;
  delivery_status?: string | null;
  id: string;
  moderation_status?: string | null;
  read_at?: string | null;
  sender_user_id: string;
};

export async function getOrCreateThread(matchId?: string, fallbackThreadId?: string): Promise<ServiceResult<string | undefined>> {
  if (!supabase) {
    return { data: fallbackThreadId, mode: supabaseMode };
  }

  if (fallbackThreadId && isUuid(fallbackThreadId)) {
    return { data: fallbackThreadId, mode: supabaseMode };
  }

  if (!matchId || !isUuid(matchId)) {
    return {
      data: fallbackThreadId,
      error: "Live thread requires a Supabase match.",
      mode: supabaseMode
    };
  }

  const { data, error } = await supabase.rpc("get_or_create_message_thread", {
    match_uuid: matchId
  });

  return { data: data as string | undefined, error: error?.message, mode: supabaseMode };
}

export async function loadMessages(threadId: string): Promise<ServiceResult<ThreadMessage[]>> {
  if (!supabase) {
    return { data: [], mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("messages")
    .select("id, body, sender_user_id, read_at, created_at, delivery_status, moderation_status")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const messages = ((data ?? []) as MessageRow[]).map((item) => ({
    body: item.body ?? "",
    createdAt: item.created_at,
    deliveryStatus: item.delivery_status ?? "sent",
    id: item.id,
    moderationStatus: item.moderation_status ?? "clear",
    mine: item.sender_user_id === user.data,
    readAt: item.read_at
  }));

  return { data: messages, error: error?.message, mode: supabaseMode };
}

export async function sendMessage(message: MessageDraft): Promise<ServiceResult<MessageDraft>> {
  if (!supabase) {
    return { data: message, mode: supabaseMode };
  }

  if (!isUuid(message.threadId)) {
    return {
      data: message,
      error: "Live message skipped because this is a local fallback thread.",
      mode: supabaseMode
    };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: message, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("messages").insert({
    body: message.body,
    delivery_status: "sent",
    moderation_status: "clear",
    sender_user_id: session.data,
    thread_id: message.threadId
  });

  return { data: message, error: error?.message, mode: supabaseMode };
}

export function subscribeToThreadMessages(
  threadId: string | undefined,
  onChange: () => void
): (() => void) | undefined {
  if (!supabase || !threadId || !isUuid(threadId)) {
    return undefined;
  }

  const client = supabase;
  const channel = client
    .channel(`messages:${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `thread_id=eq.${threadId}`
      },
      onChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export async function reportMessage(messageId: string, reason: string): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const { error } = await supabase.rpc("audit_reported_message", {
    message_uuid: messageId,
    report_reason: reason
  });

  return { data: !error, error: error?.message, mode: supabaseMode };
}
