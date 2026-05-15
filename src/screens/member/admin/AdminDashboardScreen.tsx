import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  AdminApplicationAction,
  AdminApplicationStatus,
  BookingStatus,
  ConciergeStatus,
  ExperienceGuestStatus,
  ModerationAction,
  VerificationStatus
} from "@/data/admin";
import {
  AdminQueues,
  fallbackQueues,
  loadAdminQueues,
  performApplicationAction,
  recordAdminAction
} from "@/services/adminActions";
import { updateConciergeStatus } from "@/services/concierge";
import { AdminSubscriptionRow, loadAdminSubscriptions, markFoundingMember } from "@/services/membership";
import { borders, fonts, palette, spacing } from "@/theme/tokens";
import { pickAndUploadMedia } from "@/services/media";
import { loadAdminAiRecommendations, markAiRecommendationReviewed, AiRecommendation } from "@/services/aiConcierge";
import { updateAdminProfileVisibility } from "@/services/profileIntelligence";

type AdminView =
  | "home"
  | "applications"
  | "verifications"
  | "concierge"
  | "therapist"
  | "subscriptions"
  | "experiences"
  | "ai"
  | "safety";

const applicationActions: AdminApplicationAction[] = [
  "approve",
  "reject",
  "waitlist",
  "more information",
  "restrict",
  "ban"
];
const verificationActions: VerificationStatus[] = [
  "id reviewed",
  "selfie reviewed",
  "verified",
  "manual hold"
];
const bookingActions: BookingStatus[] = ["requested", "planning", "options_sent", "confirmed", "completed", "cancelled"];
const moderationActions: ModerationAction[] = ["warn", "restrict", "suspend", "ban", "close case"];

export function AdminDashboardScreen() {
  const [view, setView] = useState<AdminView>("home");
  const [applicationStatuses, setApplicationStatuses] = useState<Record<string, AdminApplicationStatus>>({});
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, VerificationStatus>>({});
  const [conciergeStatuses, setConciergeStatuses] = useState<Record<string, ConciergeStatus | BookingStatus>>({});
  const [therapistStatuses, setTherapistStatuses] = useState<Record<string, BookingStatus>>({});
  const [experienceStatuses, setExperienceStatuses] = useState<Record<string, ExperienceGuestStatus>>({});
  const [moderationAction, setModerationAction] = useState<Record<string, ModerationAction>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [busyApplicationId, setBusyApplicationId] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [queues, setQueues] = useState<AdminQueues>(fallbackQueues());
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  const [visibilityProfileId, setVisibilityProfileId] = useState("");
  const [visibilityNote, setVisibilityNote] = useState("");

  const refreshQueues = async () => {
    setLoading(true);
    setError("");
    const result = await loadAdminQueues();
    const subscriptionResult = await loadAdminSubscriptions();
    const aiResult = await loadAdminAiRecommendations();
    setQueues(result.data);
    setSubscriptions(subscriptionResult.data);
    setAiRecommendations(aiResult.data);
    setError(result.error ?? subscriptionResult.error ?? aiResult.error ?? "");
    setLoading(false);
  };

  useEffect(() => {
    refreshQueues();
  }, []);

  const metrics = useMemo(
    () => [
      ["Pending applications", queues.applications.length],
      ["Pending verifications", queues.verifications.length],
      ["Active matches", 2],
      ["Video introductions", queues.conciergeRequests.filter((item) => item.requestType === "video follow-up").length],
      ["Concierge requests", queues.conciergeRequests.length],
      ["Therapist bookings", queues.therapistBookings.length],
      ["Experience RSVPs", queues.experienceGuests.length],
      ["Subscriptions", subscriptions.length],
      ["Assistant reviews", aiRecommendations.length],
      ["Safety reports", queues.safetyReports.length]
    ],
    [aiRecommendations.length, queues, subscriptions.length]
  );

  const applyApplicationAction = async (
    applicationId: string,
    targetUserId: string | undefined,
    action: AdminApplicationAction
  ) => {
    if (!targetUserId) {
      setError("This application is missing a linked user.");
      return;
    }

    setBusyApplicationId(applicationId);
    setError("");
    setFeedback("");
    const result = await performApplicationAction({
      action,
      applicationId,
      followUpNeeded: followUpNeeded[applicationId],
      note: adminNotes[applicationId],
      targetUserId
    });
    setBusyApplicationId("");

    if (result.error) {
      setError(result.error);
      return;
    }

    setApplicationStatuses((current) => ({
      ...current,
      [applicationId]: actionLabel(action)
    }));
    setFeedback(`Application ${action} recorded.`);
    await refreshQueues();
  };

  if (view === "applications") {
    return (
      <QueueScreen
        error={error}
        feedback={feedback}
        italic="approval queue."
        loading={loading}
        onBack={() => setView("home")}
        title="Membership"
      >
        {queues.applications.length === 0 ? (
          <PlaceholderPanel
            label="Empty queue"
            title="No pending applications"
            copy="Submitted membership applications will appear here for private review."
          />
        ) : null}
        {queues.applications.map((applicant) => (
          <LuxuryCard key={applicant.id} style={styles.card}>
            <Row
              label={applicant.createdAt ?? applicant.city}
              value={applicationStatuses[applicant.id] ?? applicant.status}
            />
            <Title style={styles.cardTitle}>{applicant.name}</Title>
            <Body>{applicant.summary}</Body>
            <Body>Profile: {applicant.profileSummary}</Body>
            <Body>Intention: {applicant.intention}</Body>
            <Body>Verification: {applicant.verificationStatus ?? "pending"}</Body>
            <Body>City: {applicant.city}</Body>

            {applicant.notes?.length ? (
              <PlaceholderPanel
                label="Previous notes"
                title={`${applicant.notes.length} internal note${applicant.notes.length === 1 ? "" : "s"}`}
                copy={applicant.notes.map((note) => `${note.followUpNeeded ? "Follow-up: " : ""}${note.note}`).join(" / ")}
                style={styles.notesPanel}
              />
            ) : null}

            <FormField
              label="Internal note"
              placeholder="Decision reason or follow-up note"
              value={adminNotes[applicant.id] ?? ""}
              onChangeText={(note) =>
                setAdminNotes((current) => ({ ...current, [applicant.id]: note }))
              }
              multiline
            />
            <LuxuryButton
              arrowDirection="none"
              variant={followUpNeeded[applicant.id] ? "solid" : "outline"}
              onPress={() =>
                setFollowUpNeeded((current) => ({
                  ...current,
                  [applicant.id]: !current[applicant.id]
                }))
              }
            >
              {followUpNeeded[applicant.id] ? "Follow-up marked" : "Mark follow-up"}
            </LuxuryButton>
            <ActionChips
              actions={applicationActions}
              disabled={busyApplicationId === applicant.id}
              onSelect={(action) => applyApplicationAction(applicant.id, applicant.userId, action)}
            />
          </LuxuryCard>
        ))}
      </QueueScreen>
    );
  }

  if (view === "verifications") {
    return (
      <QueueScreen italic="review queue." loading={loading} onBack={() => setView("home")} title="Verification">
        {queues.verifications.map((verification) => (
          <LuxuryCard key={verification.id} style={styles.card}>
            <Row label={verification.memberName} value={verificationStatuses[verification.id] ?? verification.status} />
            <Body>{verification.idPlaceholder}</Body>
            <Body>{verification.selfiePlaceholder}</Body>
            <ActionChips
              actions={verificationActions}
              selected={verificationStatuses[verification.id]}
              onSelect={(status) =>
                setVerificationStatuses((current) => ({ ...current, [verification.id]: status }))
              }
            />
          </LuxuryCard>
        ))}
      </QueueScreen>
    );
  }

  if (view === "concierge") {
    return (
      <QueueScreen italic="operations." loading={loading} onBack={() => setView("home")} title="Concierge">
        {queues.conciergeRequests.map((request) => (
          <LuxuryCard key={request.id} style={styles.card}>
            <Row label={request.city} value={String(conciergeStatuses[request.id] ?? request.bookingStatus)} />
            <Title style={styles.cardTitle}>{request.memberNames}</Title>
            <Body>Request: {request.requestType}</Body>
            <Body>Booking status: {conciergeStatuses[request.id] ?? request.bookingStatus}</Body>
            <ActionChips
              actions={bookingActions}
              selected={conciergeStatuses[request.id] as BookingStatus | undefined}
              onSelect={async (status) => {
                setConciergeStatuses((current) => ({ ...current, [request.id]: status }));
                const result = await updateConciergeStatus(request.id, status, "Admin concierge queue update");
                setError(result.error ?? "");
                if (!result.error) {
                  setFeedback(`Concierge request marked ${status}.`);
                  await refreshQueues();
                }
              }}
            />
          </LuxuryCard>
        ))}
      </QueueScreen>
    );
  }

  if (view === "therapist") {
    return (
      <QueueScreen italic="booking queue." loading={loading} onBack={() => setView("home")} title="Therapist">
        {queues.therapistBookings.map((booking) => (
          <LuxuryCard key={booking.id} style={styles.card}>
            <Row label={booking.memberName} value={therapistStatuses[booking.id] ?? booking.status} />
            <Title style={styles.cardTitle}>{booking.therapistName}</Title>
            <Body>{booking.sessionType}</Body>
            <ActionChips
              actions={bookingActions}
              selected={therapistStatuses[booking.id]}
              onSelect={(status) =>
                setTherapistStatuses((current) => ({ ...current, [booking.id]: status }))
              }
            />
          </LuxuryCard>
        ))}
      </QueueScreen>
    );
  }

  if (view === "experiences") {
    return (
      <QueueScreen italic="guest queue." loading={loading} onBack={() => setView("home")} title="Experiences">
        <LuxuryCard style={styles.card}>
          <Title style={styles.cardTitle}>Experience imagery</Title>
          <Body>Upload approved imagery for private experience presentation.</Body>
          <LuxuryButton
            variant="outline"
            onPress={async () => {
              const result = await pickAndUploadMedia({
                bucket: "experience-images",
                kind: "experience-image"
              });
              setError(result.error ?? "");
              if (result.data) {
                setFeedback("Experience image uploaded for review.");
              }
            }}
          >
            Upload experience image
          </LuxuryButton>
        </LuxuryCard>
        {queues.experienceGuests.map((guest) => (
          <LuxuryCard key={guest.id} style={styles.card}>
            <Row label={guest.memberName} value={experienceStatuses[guest.id] ?? guest.status} />
            <Title style={styles.cardTitle}>{guest.experienceTitle}</Title>
            <ActionChips
              actions={["rsvp request", "waitlist request", "confirmed guest"]}
              selected={experienceStatuses[guest.id]}
              onSelect={(status) =>
                setExperienceStatuses((current) => ({ ...current, [guest.id]: status }))
              }
            />
          </LuxuryCard>
        ))}
      </QueueScreen>
    );
  }

  if (view === "subscriptions") {
    return (
      <QueueScreen italic="membership status." loading={loading} onBack={() => setView("home")} title="Subscriptions">
        {subscriptions.length === 0 ? (
          <PlaceholderPanel
            label="Empty state"
            title="No subscription records"
            copy="Subscriptions will populate when Stripe checkout or manual founding member status is applied."
          />
        ) : null}
        {subscriptions.map((subscription) => (
          <LuxuryCard key={subscription.id} style={styles.card}>
            <Row label={subscription.userId.slice(0, 8)} value={subscription.status} />
            <Title style={styles.cardTitle}>{subscription.foundingMember ? "Founding Member" : subscription.tier}</Title>
            <Body>Billing: {subscription.billingNote ?? "Placeholder billing state"}</Body>
            <Body>Payment status: {subscription.status}</Body>
            <LuxuryButton
              arrowDirection="none"
              variant={subscription.foundingMember ? "solid" : "outline"}
              onPress={async () => {
                await markFoundingMember(subscription.userId);
                await refreshQueues();
              }}
            >
              {subscription.foundingMember ? "Founding marked" : "Mark founding member"}
            </LuxuryButton>
          </LuxuryCard>
        ))}
      </QueueScreen>
    );
  }

  if (view === "safety") {
    return (
      <QueueScreen italic="incident queue." loading={loading} onBack={() => setView("home")} title="Safety">
        {queues.safetyReports.map((report) => (
          <LuxuryCard key={report.id} style={styles.card}>
            <Row label={report.reason} value={moderationAction[report.id] || report.status} />
            <Title style={styles.cardTitle}>{report.memberName}</Title>
            <Body>{report.summary}</Body>
            <Body>User history placeholder: prior notes and reports appear here.</Body>
            <Body>Trust score placeholder: {report.trustScore}/100</Body>
            <ActionChips
              actions={moderationActions}
              selected={moderationAction[report.id]}
              onSelect={(action) => {
                setModerationAction((current) => ({ ...current, [report.id]: action }));
                recordAdminAction({ action, notes: report.summary });
              }}
            />
          </LuxuryCard>
        ))}
      </QueueScreen>
    );
  }

  if (view === "ai") {
    return (
      <QueueScreen italic="review only." loading={loading} onBack={() => setView("home")} title="Assistant">
        <PlaceholderPanel
          label="Human-led rule"
          title="Recommendations never decide"
          copy="Assistant suggestions must be reviewed by an admin before any action. No approval, ban or moderation action is automatic."
          style={styles.card}
        />
        {aiRecommendations.length === 0 ? (
          <PlaceholderPanel
            label="Quiet queue"
            title="No assistant recommendations"
            copy="When AI-ready services create suggestions, they will appear here for human review."
          />
        ) : null}
        {aiRecommendations.map((item) => (
          <LuxuryCard key={item.id} style={styles.card}>
            <Row label={item.requestType} value={item.status} />
            <Title style={styles.cardTitle}>{item.title}</Title>
            <Body>{item.summary}</Body>
            <LuxuryButton
              variant="outline"
              onPress={async () => {
                await markAiRecommendationReviewed(item.id);
                await refreshQueues();
              }}
            >
              Mark reviewed
            </LuxuryButton>
          </LuxuryCard>
        ))}
        <LuxuryCard style={styles.card}>
          <Title style={styles.cardTitle}>Profile visibility controls</Title>
          <Body>Admin-only controls for featured, hidden and public-safe profile state.</Body>
          <FormField
            label="Profile ID"
            placeholder="Paste profile id"
            value={visibilityProfileId}
            onChangeText={setVisibilityProfileId}
          />
          <FormField
            label="Internal note"
            placeholder="Why this visibility action is being taken"
            value={visibilityNote}
            onChangeText={setVisibilityNote}
            multiline
          />
          <View style={styles.actions}>
            <LuxuryButton
              variant="outline"
              onPress={() => updateAdminProfileVisibility({ isFeatured: true, notes: visibilityNote, profileId: visibilityProfileId })}
            >
              Mark featured
            </LuxuryButton>
            <LuxuryButton
              variant="outline"
              onPress={() => updateAdminProfileVisibility({ discoverHidden: true, notes: visibilityNote, profileId: visibilityProfileId })}
            >
              Hide from Discover
            </LuxuryButton>
            <LuxuryButton
              variant="outline"
              onPress={() => updateAdminProfileVisibility({ isPublicSafe: true, notes: visibilityNote, profileId: visibilityProfileId })}
            >
              Mark public-safe
            </LuxuryButton>
          </View>
        </LuxuryCard>
      </QueueScreen>
    );
  }

  return (
    <View>
      <Eyebrow>Admin Operations</Eyebrow>
      <Display style={styles.title}>Control room</Display>
      <SerifItalic style={styles.italic}>for private operations.</SerifItalic>
      <Body style={styles.copy}>
        Live Supabase approval operations for human-led review, account standing and member access.
      </Body>
      {error ? <Caption style={styles.error}>{error}</Caption> : null}

      <View style={styles.metricGrid}>
        {metrics.map(([label, value]) => (
          <LuxuryCard key={label} style={styles.metricCard}>
            <Caption>{label}</Caption>
            <Text style={styles.metricValue}>{value}</Text>
          </LuxuryCard>
        ))}
      </View>

      <View style={styles.actions}>
        <LuxuryButton onPress={() => setView("applications")}>Applications</LuxuryButton>
        <LuxuryButton variant="outline" onPress={() => setView("verifications")}>
          Verifications
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={() => setView("concierge")}>
          Concierge
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={() => setView("therapist")}>
          Therapist bookings
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={() => setView("experiences")}>
          Experiences
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={() => setView("subscriptions")}>
          Subscriptions
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={() => setView("ai")}>
          Assistant review
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={() => setView("safety")}>
          Safety reports
        </LuxuryButton>
      </View>
    </View>
  );
}

function actionLabel(action: AdminApplicationAction): AdminApplicationStatus {
  if (action === "approve") {
    return "approved";
  }
  if (action === "reject") {
    return "rejected";
  }
  if (action === "waitlist") {
    return "waitlisted";
  }
  if (action === "more information") {
    return "more information";
  }
  return "under review";
}

function QueueScreen({
  children,
  error,
  feedback,
  italic,
  loading,
  onBack,
  title
}: {
  children: React.ReactNode;
  error?: string;
  feedback?: string;
  italic: string;
  loading?: boolean;
  onBack: () => void;
  title: string;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to admin
      </LuxuryButton>
      <Eyebrow>Admin queue</Eyebrow>
      <Display style={styles.title}>{title}</Display>
      <SerifItalic style={styles.italic}>{italic}</SerifItalic>
      <Body style={styles.copy}>
        {loading ? "Loading live Supabase queue..." : "Actions update live records, notes and audit logs."}
      </Body>
      {error ? <Caption style={styles.error}>{error}</Caption> : null}
      {feedback ? <Caption style={styles.feedback}>{feedback}</Caption> : null}
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Caption>{label}</Caption>
      <Badge label={value} />
    </View>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function ActionChips<T extends string>({
  actions,
  disabled = false,
  onSelect,
  selected
}: {
  actions: T[];
  disabled?: boolean;
  onSelect: (action: T) => void;
  selected?: T;
}) {
  return (
    <View style={styles.chips}>
      {actions.map((action) => (
        <OptionChip
          key={action}
          selected={selected === action}
          onPress={disabled ? undefined : () => onSelect(action)}
        >
          {disabled ? "Working" : action}
        </OptionChip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  badge: {
    borderColor: borders.visible,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: palette.pale,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
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
  metricCard: {
    flex: 1,
    minWidth: 142
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  metricValue: {
    color: palette.white,
    fontFamily: fonts.serifRegular,
    fontSize: 42,
    lineHeight: 48,
    marginTop: spacing.sm
  },
  notesPanel: {
    marginVertical: spacing.lg
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
