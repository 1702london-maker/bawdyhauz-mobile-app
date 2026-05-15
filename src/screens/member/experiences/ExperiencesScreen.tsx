import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { CityAutocompleteField, FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { Experience, experienceCategories, experiences } from "@/data/experiences";
import {
  joinExperienceWaitlist,
  loadPrivateExperiences,
  submitExperienceRsvp
} from "@/services/experiences";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type ExperienceView = "landing" | "list" | "detail" | "rsvp" | "waitlist" | "confirmation" | "ticket";
type ExperienceStatus = "invitePending" | "waitlisted" | "confirmed";

type RequestDraft = {
  accessibilityNotes: string;
  guestPreferenceNotes: string;
};

type WaitlistDraft = {
  city: string;
  notes: string;
};

const initialRequest: RequestDraft = {
  accessibilityNotes: "",
  guestPreferenceNotes: ""
};

const initialWaitlist: WaitlistDraft = {
  city: "",
  notes: ""
};

export function ExperiencesScreen() {
  const [view, setView] = useState<ExperienceView>("landing");
  const [experienceList, setExperienceList] = useState<Experience[]>(experiences);
  const [selectedExperienceId, setSelectedExperienceId] = useState(experiences[0]?.id ?? "");
  const [requestDraft, setRequestDraft] = useState<RequestDraft>(initialRequest);
  const [waitlistDraft, setWaitlistDraft] = useState<WaitlistDraft>(initialWaitlist);
  const [statuses, setStatuses] = useState<Record<string, ExperienceStatus>>({
    "wellness-evening": "confirmed"
  });

  const selectedExperience = useMemo(
    () =>
      experienceList.find((experience) => experience.id === selectedExperienceId) ??
      experienceList[0],
    [selectedExperienceId, experienceList]
  );

  useEffect(() => {
    let alive = true;

    loadPrivateExperiences().then((result) => {
      if (!alive) {
        return;
      }
      setExperienceList(result.data);
      setSelectedExperienceId((current) => current || result.data[0]?.id || "");
    });

    return () => {
      alive = false;
    };
  }, []);

  const openDetail = (experience: Experience) => {
    setSelectedExperienceId(experience.id);
    setRequestDraft(initialRequest);
    setWaitlistDraft({ ...initialWaitlist, city: experience.city });
    setView("detail");
  };

  const submitRequest = async () => {
    await submitExperienceRsvp({
      accessibilityNotes: requestDraft.accessibilityNotes,
      experienceId: selectedExperience.id,
      guestPreferenceNotes: requestDraft.guestPreferenceNotes
    });
    setStatuses((current) => ({ ...current, [selectedExperience.id]: "invitePending" }));
    setView("confirmation");
  };

  const submitWaitlist = async () => {
    await joinExperienceWaitlist({
      experienceId: selectedExperience.id,
      notes: waitlistDraft.notes,
      preferredCity: waitlistDraft.city
    });
    setStatuses((current) => ({ ...current, [selectedExperience.id]: "waitlisted" }));
    setView("confirmation");
  };

  if (view === "list") {
    return (
      <ExperienceList
        onBack={() => setView("landing")}
        experiences={experienceList}
        onSelect={openDetail}
        statuses={statuses}
      />
    );
  }

  if (view === "detail") {
    return (
      <ExperienceDetail
        experience={selectedExperience}
        onBack={() => setView("list")}
        onRequest={() => setView("rsvp")}
        onWaitlist={() => setView("waitlist")}
        onViewTicket={() => setView("ticket")}
        status={statuses[selectedExperience.id]}
      />
    );
  }

  if (view === "rsvp") {
    return (
      <RsvpFlow
        draft={requestDraft}
        experience={selectedExperience}
        onBack={() => setView("detail")}
        onPatch={(patch) => setRequestDraft((current) => ({ ...current, ...patch }))}
        onSubmit={submitRequest}
      />
    );
  }

  if (view === "waitlist") {
    return (
      <WaitlistFlow
        draft={waitlistDraft}
        experience={selectedExperience}
        onBack={() => setView("detail")}
        onPatch={(patch) => setWaitlistDraft((current) => ({ ...current, ...patch }))}
        onSubmit={submitWaitlist}
      />
    );
  }

  if (view === "confirmation") {
    return (
      <ExperienceConfirmation
        experience={selectedExperience}
        onDone={() => setView("landing")}
        onViewDetail={() => setView("detail")}
        status={statuses[selectedExperience.id]}
      />
    );
  }

  if (view === "ticket") {
    return (
      <QrTicketPlaceholder
        experience={selectedExperience}
        onBack={() => setView("detail")}
      />
    );
  }

  return <ExperiencesLanding onOpenList={() => setView("list")} />;
}

function ExperiencesLanding({ onOpenList }: { onOpenList: () => void }) {
  return (
    <View>
      <Eyebrow>Private Experiences</Eyebrow>
      <Display style={styles.title}>By arrangement</Display>
      <SerifItalic style={styles.italic}>and invitation.</SerifItalic>
      <Body style={styles.copy}>
        BAWDYHAUZ experiences are private, mature gatherings for members who prefer their social
        life curated with discretion, intention and calm hospitality.
      </Body>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Experience categories</Title>
        <View style={styles.chips}>
          {experienceCategories.map((category) => (
            <OptionChip key={category}>{category}</OptionChip>
          ))}
        </View>
      </LuxuryCard>

      <EmptyState
        label="No current experiences"
        title="Quiet calendar"
        copy="When there are no current invitations, this area remains intentionally calm."
      />

      <LuxuryButton onPress={onOpenList}>View experiences</LuxuryButton>
    </View>
  );
}

function ExperienceList({
  experiences,
  onBack,
  onSelect,
  statuses
}: {
  experiences: Experience[];
  onBack: () => void;
  onSelect: (experience: Experience) => void;
  statuses: Record<string, ExperienceStatus>;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to overview
      </LuxuryButton>
      <Eyebrow>Experiences list</Eyebrow>
      <Display style={styles.title}>Current</Display>
      <SerifItalic style={styles.italic}>private invitations.</SerifItalic>
      <Body style={styles.copy}>
        A local event list foundation. Access status is placeholder-only until approval tooling is
        introduced later.
      </Body>

      {experiences.map((experience) => (
        <LuxuryCard key={experience.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Caption>{experience.category}</Caption>
              <Title style={styles.name}>{experience.title}</Title>
            </View>
            <Badge label={statuses[experience.id] ?? experience.accessType} />
          </View>
          <View style={styles.divider} />
          <Body>
            {experience.city} · {experience.date} · {experience.time}
          </Body>
          <LuxuryButton onPress={() => onSelect(experience)}>View details</LuxuryButton>
        </LuxuryCard>
      ))}
    </View>
  );
}

function ExperienceDetail({
  experience,
  onBack,
  onRequest,
  onViewTicket,
  onWaitlist,
  status
}: {
  experience: Experience;
  onBack: () => void;
  onRequest: () => void;
  onViewTicket: () => void;
  onWaitlist: () => void;
  status?: ExperienceStatus;
}) {
  const confirmed = status === "confirmed";

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to experiences
      </LuxuryButton>
      <View style={styles.imagePlaceholder}>
        <Eyebrow>Venue style placeholder</Eyebrow>
        <Caption>{experience.venueStyle}</Caption>
      </View>
      <Eyebrow>{experience.city}</Eyebrow>
      <Display style={styles.title}>{experience.title}</Display>
      <SerifItalic style={styles.italic}>{experience.date}</SerifItalic>
      <Body style={styles.copy}>{experience.description}</Body>

      <LuxuryCard style={styles.card}>
        <View style={styles.row}>
          <Caption>Access</Caption>
          <Badge label={status ?? experience.accessType} />
        </View>
        <View style={styles.divider} />
        <Title style={styles.cardTitle}>Event tone</Title>
        <Body>Dress code: {experience.dressCode}</Body>
        <Body>Guest tone: {experience.guestTone}</Body>
        <Body>Time: {experience.time}</Body>
      </LuxuryCard>

      <View style={styles.actions}>
        <LuxuryButton onPress={onRequest}>RSVP / request invite</LuxuryButton>
        <LuxuryButton variant="outline" onPress={onWaitlist}>
          Join waitlist
        </LuxuryButton>
        {confirmed ? <LuxuryButton onPress={onViewTicket}>View access QR</LuxuryButton> : null}
      </View>
    </View>
  );
}

function RsvpFlow({
  draft,
  experience,
  onBack,
  onPatch,
  onSubmit
}: {
  draft: RequestDraft;
  experience: Experience;
  onBack: () => void;
  onPatch: (patch: Partial<RequestDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to detail
      </LuxuryButton>
      <Eyebrow>Request invite</Eyebrow>
      <Display style={styles.title}>Confirm</Display>
      <SerifItalic style={styles.italic}>your interest.</SerifItalic>
      <Body style={styles.copy}>
        Request access to {experience.title}. This remains a local placeholder until admin approval
        and member services are connected.
      </Body>

      <LuxuryCard style={styles.card}>
        <FormField
          label="Guest preference notes"
          placeholder="Preferred arrival style, social comfort, guest context..."
          value={draft.guestPreferenceNotes}
          onChangeText={(guestPreferenceNotes) => onPatch({ guestPreferenceNotes })}
          multiline
        />
        <FormField
          label="Dietary / accessibility notes"
          placeholder="Optional private notes"
          value={draft.accessibilityNotes}
          onChangeText={(accessibilityNotes) => onPatch({ accessibilityNotes })}
          multiline
        />
      </LuxuryCard>

      <LuxuryButton onPress={onSubmit}>Submit request</LuxuryButton>
    </View>
  );
}

function WaitlistFlow({
  draft,
  experience,
  onBack,
  onPatch,
  onSubmit
}: {
  draft: WaitlistDraft;
  experience: Experience;
  onBack: () => void;
  onPatch: (patch: Partial<WaitlistDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to detail
      </LuxuryButton>
      <Eyebrow>Waitlist</Eyebrow>
      <Display style={styles.title}>Join quietly</Display>
      <SerifItalic style={styles.italic}>if space opens.</SerifItalic>
      <Body style={styles.copy}>
        Join the waitlist for {experience.title}. Availability remains manually reviewed in future
        phases.
      </Body>

      <LuxuryCard style={styles.card}>
        <CityAutocompleteField
          label="Preferred city"
          value={draft.city}
          onChange={(city) => onPatch({ city })}
        />
        <FormField
          label="Private waitlist notes"
          placeholder="Anything the concierge team should know?"
          value={draft.notes}
          onChangeText={(notes) => onPatch({ notes })}
          multiline
        />
      </LuxuryCard>

      <LuxuryButton onPress={onSubmit}>Join waitlist</LuxuryButton>
    </View>
  );
}

function ExperienceConfirmation({
  experience,
  onDone,
  onViewDetail,
  status
}: {
  experience: Experience;
  onDone: () => void;
  onViewDetail: () => void;
  status?: ExperienceStatus;
}) {
  const label = status === "waitlisted" ? "Waitlisted" : "Invite pending";

  return (
    <View>
      <Eyebrow>Experience request</Eyebrow>
      <Display style={styles.title}>Request received</Display>
      <SerifItalic style={styles.italic}>with discretion.</SerifItalic>
      <Body style={styles.copy}>
        Your request for {experience.title} is saved locally. Future builds will route this to
        member services for approval and confirmation.
      </Body>

      <PlaceholderPanel
        label={label}
        title={status === "waitlisted" ? "Waitlist confirmation" : "Invite pending"}
        copy="This status is a placeholder and does not represent a live reservation."
        style={styles.card}
      />

      <View style={styles.actions}>
        <LuxuryButton onPress={onViewDetail}>Return to detail</LuxuryButton>
        <LuxuryButton variant="outline" onPress={onDone}>
          Back to experiences
        </LuxuryButton>
      </View>
    </View>
  );
}

function QrTicketPlaceholder({
  experience,
  onBack
}: {
  experience: Experience;
  onBack: () => void;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to detail
      </LuxuryButton>
      <Eyebrow>Confirmed invitation</Eyebrow>
      <Display style={styles.title}>Access</Display>
      <SerifItalic style={styles.italic}>confirmed.</SerifItalic>
      <Body style={styles.copy}>
        Present this elegant placeholder at arrival in future builds. No live QR ticketing is
        connected yet.
      </Body>

      <LuxuryCard style={styles.card}>
        <View style={styles.qrBox}>
          <Text style={styles.qrText}>QR</Text>
        </View>
        <View style={styles.divider} />
        <Title style={styles.cardTitle}>{experience.title}</Title>
        <Body>
          Arrive at {experience.time}. Bring government ID if requested by the venue host. Access
          remains subject to private confirmation.
        </Body>
      </LuxuryCard>
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
    marginBottom: spacing.sm
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
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  flex: {
    flex: 1
  },
  imagePlaceholder: {
    alignItems: "center",
    aspectRatio: 1.1,
    borderColor: borders.hairline,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  name: {
    marginTop: spacing.xs
  },
  qrBox: {
    alignItems: "center",
    aspectRatio: 1,
    borderColor: borders.visible,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  qrText: {
    color: palette.pale,
    fontFamily: fonts.serifRegular,
    fontSize: 52,
    letterSpacing: 8
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
