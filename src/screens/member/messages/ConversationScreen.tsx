import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { CityAutocompleteField, FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { MemberProfile } from "@/data/matchmaking";
import {
  ConciergeRequest,
  loadConciergeRequest,
  loadVenueOptions,
  selectConciergeVenue,
  submitConciergeRequest,
  VenueOption
} from "@/services/concierge";
import {
  getOrCreateThread,
  loadMessages,
  reportMessage,
  sendMessage,
  subscribeToThreadMessages,
  ThreadMessage
} from "@/services/messages";
import {
  completeVideoDate,
  confirmVideoDate,
  loadVideoDate,
  scheduleVideoDate,
  submitPostVideoDecision,
  VideoDate
} from "@/services/videoDates";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

export type ConversationState = {
  conciergeAtmosphere: string;
  conciergeCity: string;
  conciergeDateTime: string;
  conciergeSubmitted: boolean;
  conversationMinutes: number;
  postVideoDecision?: "continue" | "decline" | "concierge";
  scheduledDuration?: 30 | 60;
  scheduledVideo: boolean;
  videoCompleted: boolean;
};

type ConversationScreenProps = {
  conversation?: ConversationState;
  match?: MemberProfile;
  onBackToMatches: () => void;
  onPatchConversation: (patch: Partial<ConversationState>) => void;
};

const venueCategories = ["Restaurant", "Cocktail lounge", "Members club", "Wellness venue"];
const atmosphereOptions = ["Quiet", "Cinematic", "Discreet", "Lively but refined"];

export function ConversationScreen({
  conversation,
  match,
  onBackToMatches,
  onPatchConversation
}: ConversationScreenProps) {
  const [body, setBody] = useState("");
  const [concierge, setConcierge] = useState<ConciergeRequest | undefined>();
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [privacyNotes, setPrivacyNotes] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(match?.threadId);
  const [videoDate, setVideoDate] = useState<VideoDate | undefined>();
  const [venueOptions, setVenueOptions] = useState<VenueOption[]>([]);

  const activeConversation: ConversationState =
    conversation ??
    {
      conciergeAtmosphere: "",
      conciergeCity: match?.preferredIntroductionCity ?? "",
      conciergeDateTime: "",
      conciergeSubmitted: false,
      conversationMinutes: 0,
      scheduledVideo: false,
      videoCompleted: false
    };

  const conversationMinutes = useMemo(
    () => Math.max(activeConversation.conversationMinutes, messages.length * 30),
    [activeConversation.conversationMinutes, messages.length]
  );
  const unlocked = conversationMinutes >= 180;
  const showConcierge = activeConversation.postVideoDecision === "concierge";

  useEffect(() => {
    let alive = true;

    async function hydrate() {
      if (!match) {
        return;
      }
      setLoading(true);
      setError("");
      const thread = await getOrCreateThread(match.matchId, match.threadId);
      if (!alive) {
        return;
      }
      setThreadId(thread.data);
      if (thread.error) {
        setError(thread.error);
      }
      if (thread.data) {
        const messageResult = await loadMessages(thread.data);
        if (alive) {
          setMessages(messageResult.data);
          setError((current) => current || messageResult.error || "");
        }
      }
      const [videoResult, conciergeResult] = await Promise.all([
        loadVideoDate(match.matchId),
        loadConciergeRequest(match.matchId)
      ]);
      if (alive) {
        setVideoDate(videoResult.data);
        setConcierge(conciergeResult.data);
        setLoading(false);
      }
    }

    hydrate();
    return () => {
      alive = false;
    };
  }, [match?.id, match?.matchId, match?.threadId]);

  useEffect(() => {
    if (!threadId) {
      return undefined;
    }

    return subscribeToThreadMessages(threadId, async () => {
      const result = await loadMessages(threadId);
      setMessages(result.data);
    });
  }, [threadId]);

  useEffect(() => {
    if (!showConcierge) {
      return;
    }

    loadVenueOptions(activeConversation.conciergeCity).then((result) => {
      setVenueOptions(result.data);
    });
  }, [activeConversation.conciergeCity, showConcierge]);

  if (!match) {
    return (
      <View>
        <Eyebrow>Messages</Eyebrow>
        <Display style={styles.title}>Private chat</Display>
        <SerifItalic style={styles.italic}>awaits a match.</SerifItalic>
        <Body style={styles.copy}>Select an active match to open the private conversation.</Body>
      </View>
    );
  }

  const submitMessage = async () => {
    if (!threadId || !body.trim()) {
      return;
    }

    const optimistic: ThreadMessage = {
      body: body.trim(),
      createdAt: new Date().toISOString(),
      deliveryStatus: "sending",
      id: `local-${Date.now()}`,
      mine: true
    };
    setMessages((current) => [...current, optimistic]);
    setBody("");
    const result = await sendMessage({ body: optimistic.body, threadId });
    if (result.error) {
      setError(result.error);
    } else {
      const reload = await loadMessages(threadId);
      setMessages(reload.data);
    }
  };

  const submitVideoSchedule = async (scheduledFor: string, durationMinutes: 30 | 60) => {
    const result = await scheduleVideoDate({
      durationMinutes,
      matchId: match.matchId,
      scheduledFor
    });
    setVideoDate(result.data);
    onPatchConversation({ scheduledDuration: durationMinutes, scheduledVideo: true });
    setError(result.error ?? "");
    setScheduleOpen(false);
  };

  const submitDecision = async (decision: "continue" | "decline" | "concierge") => {
    onPatchConversation({ postVideoDecision: decision });
    if (videoDate?.id) {
      await submitPostVideoDecision(videoDate.id, decision);
    }
  };

  const submitConcierge = async () => {
    const result = await submitConciergeRequest({
      atmosphere: activeConversation.conciergeAtmosphere,
      city: activeConversation.conciergeCity,
      dietaryAccessibilityNotes: dietaryNotes,
      idealDateTime: activeConversation.conciergeDateTime,
      matchId: match.matchId,
      privacyPreferences: privacyNotes,
      venueCategory: selectedCategory
    });
    setConcierge(result.data);
    setError(result.error ?? "");
    onPatchConversation({ conciergeSubmitted: true });
  };

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBackToMatches}>
        Back to matches
      </LuxuryButton>
      <Eyebrow>Private conversation</Eyebrow>
      <Display style={styles.title}>{match.name}</Display>
      <SerifItalic style={styles.italic}>chat unlocked.</SerifItalic>
      <Body style={styles.copy}>
        Messages are loaded from Supabase and visible only to thread participants.
      </Body>
      {loading ? <Caption style={styles.feedback}>Loading private thread...</Caption> : null}
      {error ? <Caption style={styles.error}>{error}</Caption> : null}

      <LuxuryCard style={styles.card}>
        <Caption>Typing placeholder · read receipts prepared</Caption>
        {messages.length === 0 ? (
          <PlaceholderPanel
            label="Empty conversation"
            title="Begin privately"
            copy="Your thread is ready. Send a short, considered message to begin."
            style={styles.emptyPanel}
          />
        ) : null}
        {messages.map((message) => (
          <View
            key={message.id}
            style={message.mine ? styles.messageOutbound : styles.messageInbound}
          >
            <Body style={message.mine ? styles.outboundText : undefined}>{message.body}</Body>
            <Caption style={message.mine ? styles.outboundCaption : styles.messageMeta}>
              {message.deliveryStatus ?? "sent"} · {message.readAt ? "read" : "read pending"}
            </Caption>
            {!message.mine && !message.id.startsWith("local-") ? (
              <Pressable onPress={() => reportMessage(message.id, "member flagged message")}>
                <Text style={styles.reportText}>Report quietly</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <View style={styles.placeholderRow}>
          <PlaceholderPill label="Image placeholder" />
          <PlaceholderPill label="Voice note placeholder" />
          <PlaceholderPill label="Moderation hook active" />
        </View>
        <FormField
          label="Message"
          placeholder="Write with discretion..."
          value={body}
          onChangeText={setBody}
          multiline
        />
        <LuxuryButton disabled={!threadId || !body.trim()} onPress={submitMessage}>
          Send message
        </LuxuryButton>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <View style={styles.statusRow}>
          <Caption>Video introduction</Caption>
          <Caption style={styles.status}>{unlocked ? "Available" : "Locked"}</Caption>
        </View>
        <View style={styles.divider} />
        <Body>
          Video scheduling unlocks after approximately 3 hours of private conversation activity.
          Current activity: {conversationMinutes} / 180 minutes.
        </Body>
        <View style={styles.actions}>
          <LuxuryButton
            arrowDirection="none"
            variant="outline"
            onPress={() => onPatchConversation({ conversationMinutes: Math.min(180, conversationMinutes + 30) })}
          >
            Add activity
          </LuxuryButton>
          <LuxuryButton disabled={!unlocked} onPress={() => setScheduleOpen(true)}>
            Schedule Private Introduction
          </LuxuryButton>
        </View>
      </LuxuryCard>

      {videoDate ? (
        <LuxuryCard style={styles.card}>
          <Title style={styles.cardTitle}>Video introduction</Title>
          <Body>
            {videoDate.scheduledFor ? new Date(videoDate.scheduledFor).toLocaleString() : "Time pending"} · {videoDate.durationMinutes} minutes
          </Body>
          <Body>Status: {videoDate.status} · {videoDate.confirmationStatus}</Body>
          <View style={styles.actions}>
            <LuxuryButton
              arrowDirection="none"
              variant="outline"
              onPress={async () => {
                await confirmVideoDate(videoDate.id);
                const refreshed = await loadVideoDate(match.matchId);
                setVideoDate(refreshed.data);
              }}
            >
              Confirm video date
            </LuxuryButton>
            <LuxuryButton
              onPress={async () => {
                await completeVideoDate(videoDate.id);
                const refreshed = await loadVideoDate(match.matchId);
                setVideoDate(refreshed.data);
                onPatchConversation({ videoCompleted: true });
              }}
            >
              Mark video complete
            </LuxuryButton>
          </View>
        </LuxuryCard>
      ) : null}

      {activeConversation.videoCompleted || videoDate?.completedAt ? (
        <LuxuryCard style={styles.card}>
          <Title style={styles.cardTitle}>After the introduction</Title>
          <Body>Choose the next step with clarity and discretion.</Body>
          <View style={styles.actions}>
            <LuxuryButton arrowDirection="none" variant={activeConversation.postVideoDecision === "continue" ? "solid" : "outline"} onPress={() => submitDecision("continue")}>
              Continue privately
            </LuxuryButton>
            <LuxuryButton arrowDirection="none" variant={activeConversation.postVideoDecision === "decline" ? "solid" : "outline"} onPress={() => submitDecision("decline")}>
              Respectfully decline
            </LuxuryButton>
            <LuxuryButton arrowDirection="none" variant={activeConversation.postVideoDecision === "concierge" ? "solid" : "outline"} onPress={() => submitDecision("concierge")}>
              Request concierge introduction
            </LuxuryButton>
          </View>
        </LuxuryCard>
      ) : null}

      {showConcierge ? (
        <LuxuryCard style={styles.card}>
          <Title style={styles.cardTitle}>Concierge request</Title>
          <Body style={styles.conciergeCopy}>
            A human concierge team will coordinate venue options, date/time preferences and private reservation support.
          </Body>
          <Caption>Venue categories</Caption>
          <View style={styles.chips}>
            {venueCategories.map((category) => (
              <OptionChip key={category} selected={selectedCategory === category} onPress={() => setSelectedCategory(category)}>
                {category}
              </OptionChip>
            ))}
          </View>
          <CityAutocompleteField
            label="Preferred city"
            value={activeConversation.conciergeCity}
            onChange={(conciergeCity) => onPatchConversation({ conciergeCity })}
          />
          <Caption>Preferred atmosphere</Caption>
          <View style={styles.chips}>
            {atmosphereOptions.map((atmosphere) => (
              <OptionChip
                key={atmosphere}
                selected={activeConversation.conciergeAtmosphere === atmosphere}
                onPress={() => onPatchConversation({ conciergeAtmosphere: atmosphere })}
              >
                {atmosphere}
              </OptionChip>
            ))}
          </View>
          <FormField label="Ideal date time" placeholder="Friday evening, Saturday lunch..." value={activeConversation.conciergeDateTime} onChangeText={(conciergeDateTime) => onPatchConversation({ conciergeDateTime })} />
          <FormField label="Dietary / accessibility notes" placeholder="Discreet notes for planning" value={dietaryNotes} onChangeText={setDietaryNotes} multiline />
          <FormField label="Privacy preferences" placeholder="Arrival, visibility, table preference..." value={privacyNotes} onChangeText={setPrivacyNotes} multiline />
          <LuxuryButton onPress={submitConcierge}>Submit concierge request</LuxuryButton>
          {concierge ? (
            <PlaceholderPanel
              label="Concierge planning"
              title={`Status: ${concierge.status}`}
              copy="Your request is live in the concierge operations queue."
              style={styles.submittedPanel}
            />
          ) : null}
          {venueOptions.length ? (
            <View style={styles.venueList}>
              <Caption>Venue options from concierge</Caption>
              {venueOptions.map((venue) => (
                <LuxuryCard key={venue.id} style={styles.venueCard}>
                  <Row label={venue.city} value={venue.category ?? "Venue"} />
                  <Title style={styles.venueTitle}>{venue.name}</Title>
                  <Body>{venue.atmosphere ?? "Private atmosphere"}</Body>
                  <LuxuryButton
                    arrowDirection="none"
                    variant={concierge?.selectedVenueId === venue.id ? "solid" : "outline"}
                    onPress={async () => {
                      const result = await selectConciergeVenue(concierge?.id, venue.id);
                      setError(result.error ?? "");
                      const refreshed = await loadConciergeRequest(match.matchId);
                      setConcierge(refreshed.data);
                    }}
                  >
                    Select venue
                  </LuxuryButton>
                </LuxuryCard>
              ))}
            </View>
          ) : null}
        </LuxuryCard>
      ) : null}

      <ScheduleModal
        visible={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSchedule={submitVideoSchedule}
      />
    </View>
  );
}

function PlaceholderPill({ label }: { label: string }) {
  return (
    <View style={styles.placeholderPill}>
      <Text style={styles.placeholderText}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusRow}>
      <Caption>{label}</Caption>
      <Caption style={styles.status}>{value}</Caption>
    </View>
  );
}

function ScheduleModal({
  onClose,
  onSchedule,
  visible
}: {
  onClose: () => void;
  onSchedule: (scheduledFor: string, duration: 30 | 60) => void;
  visible: boolean;
}) {
  const [duration, setDuration] = useState<30 | 60>(30);
  const [scheduledFor, setScheduledFor] = useState("");

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <LuxuryCard style={styles.modalCard}>
          <Eyebrow>Schedule Private Introduction</Eyebrow>
          <Title style={styles.modalTitle}>Choose a private time</Title>
          <Body>
            Scheduling is live; video room provider integration remains a future placeholder.
          </Body>
          <FormField
            label="Preferred date and time"
            placeholder="2026-06-14 19:30"
            value={scheduledFor}
            onChangeText={setScheduledFor}
          />
          <View style={styles.actions}>
            <LuxuryButton arrowDirection="none" variant={duration === 30 ? "solid" : "outline"} onPress={() => setDuration(30)}>
              30 minutes
            </LuxuryButton>
            <LuxuryButton arrowDirection="none" variant={duration === 60 ? "solid" : "outline"} onPress={() => setDuration(60)}>
              1 hour
            </LuxuryButton>
            <LuxuryButton
              disabled={!scheduledFor.trim()}
              onPress={() => {
                const parsed = new Date(scheduledFor);
                onSchedule(
                  Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
                  duration
                );
              }}
            >
              Request time
            </LuxuryButton>
            <LuxuryButton arrowDirection="left" variant="ghost" onPress={onClose}>
              Close
            </LuxuryButton>
          </View>
        </LuxuryCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.sm
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm
  },
  conciergeCopy: {
    marginBottom: spacing.lg
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  emptyPanel: {
    marginTop: spacing.lg
  },
  error: {
    color: palette.pale,
    marginBottom: spacing.md
  },
  feedback: {
    color: palette.white,
    marginBottom: spacing.md
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  messageInbound: {
    alignSelf: "flex-start",
    borderColor: borders.hairline,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.lg,
    maxWidth: "88%",
    padding: spacing.md
  },
  messageMeta: {
    marginTop: spacing.xs
  },
  messageOutbound: {
    alignSelf: "flex-end",
    backgroundColor: palette.white,
    borderRadius: 6,
    marginTop: spacing.md,
    maxWidth: "88%",
    padding: spacing.md
  },
  modalBackdrop: {
    backgroundColor: "rgba(5, 5, 5, 0.86)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  modalCard: {
    backgroundColor: palette.charcoal
  },
  modalTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  },
  outboundCaption: {
    color: palette.void,
    marginTop: spacing.xs,
    opacity: 0.72
  },
  outboundText: {
    color: palette.void
  },
  placeholderPill: {
    borderColor: borders.hairline,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  placeholderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  placeholderText: {
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  reportText: {
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.4,
    marginTop: spacing.sm,
    textTransform: "uppercase"
  },
  status: {
    color: palette.pale
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  submittedPanel: {
    marginTop: spacing.lg
  },
  title: {
    fontSize: 46,
    lineHeight: 54,
    marginTop: spacing.xl
  },
  venueCard: {
    marginTop: spacing.md
  },
  venueList: {
    marginTop: spacing.lg
  },
  venueTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm
  }
});
