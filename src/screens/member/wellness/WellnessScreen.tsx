import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { TherapistProfile, therapists, wellnessResources } from "@/data/wellness";
import { loadTherapists, requestTherapistSession } from "@/services/therapistBookings";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type WellnessView = "landing" | "therapists" | "profile" | "booking" | "confirmation" | "resources";

type BookingDraft = {
  date: string;
  notes: string;
  sessionType: string;
  time: string;
};

const initialBooking: BookingDraft = {
  date: "",
  notes: "",
  sessionType: "",
  time: ""
};

export function WellnessScreen() {
  const [view, setView] = useState<WellnessView>("landing");
  const [therapistProfiles, setTherapistProfiles] = useState<TherapistProfile[]>(therapists);
  const [selectedTherapistId, setSelectedTherapistId] = useState(therapists[0]?.id ?? "");
  const [booking, setBooking] = useState<BookingDraft>(initialBooking);

  const selectedTherapist = useMemo(
    () =>
      therapistProfiles.find((therapist) => therapist.id === selectedTherapistId) ??
      therapistProfiles[0],
    [selectedTherapistId, therapistProfiles]
  );

  useEffect(() => {
    let alive = true;

    loadTherapists().then((result) => {
      if (!alive) {
        return;
      }
      setTherapistProfiles(result.data);
      setSelectedTherapistId((current) => current || result.data[0]?.id || "");
    });

    return () => {
      alive = false;
    };
  }, []);

  const patchBooking = (patch: Partial<BookingDraft>) => {
    setBooking((current) => ({ ...current, ...patch }));
  };

  const openProfile = (therapist: TherapistProfile) => {
    setSelectedTherapistId(therapist.id);
    setBooking({
      ...initialBooking,
      sessionType: therapist.sessionTypes[0] ?? "",
      time: therapist.availableTimes[0] ?? ""
    });
    setView("profile");
  };

  if (view === "therapists") {
    return (
      <TherapistList
        onBack={() => setView("landing")}
        onSelect={openProfile}
        therapists={therapistProfiles}
      />
    );
  }

  if (view === "profile" && selectedTherapist) {
    return (
      <TherapistProfileView
        therapist={selectedTherapist}
        onBack={() => setView("therapists")}
        onRequest={() => setView("booking")}
      />
    );
  }

  if (view === "booking" && selectedTherapist) {
    return (
      <BookingFlow
        booking={booking}
        onBack={() => setView("profile")}
        onPatch={patchBooking}
        onSubmit={async () => {
          await requestTherapistSession({
            notes: booking.notes,
            preferredDate: booking.date,
            preferredTime: booking.time,
            sessionType: booking.sessionType,
            therapistId: selectedTherapist.id
          });
          setView("confirmation");
        }}
        therapist={selectedTherapist}
      />
    );
  }

  if (view === "confirmation" && selectedTherapist) {
    return (
      <BookingConfirmation
        booking={booking}
        onDone={() => setView("landing")}
        therapist={selectedTherapist}
      />
    );
  }

  if (view === "resources") {
    return <WellnessResources onBack={() => setView("landing")} />;
  }

  return <WellnessLanding onOpenResources={() => setView("resources")} onOpenTherapists={() => setView("therapists")} />;
}

function WellnessLanding({
  onOpenResources,
  onOpenTherapists
}: {
  onOpenResources: () => void;
  onOpenTherapists: () => void;
}) {
  return (
    <View>
      <Eyebrow>Therapist & Wellness</Eyebrow>
      <Display style={styles.title}>Private support</Display>
      <SerifItalic style={styles.italic}>with emotional clarity.</SerifItalic>
      <Body style={styles.copy}>
        Relationship wellness inside BAWDYHAUZ is discreet, reflective support for members
        seeking clarity around dating, communication, boundaries and meaningful connection.
      </Body>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>What this space supports</Title>
        <Body>
          Private therapy access, dating guidance, post-introduction reflection, emotional
          preparation and relationship support. This section makes no medical claims and remains a
          calm route into professional or coaching support.
        </Body>
      </LuxuryCard>

      <View style={styles.actions}>
        <LuxuryButton onPress={onOpenTherapists}>View therapists</LuxuryButton>
        <LuxuryButton variant="outline" onPress={onOpenResources}>
          Wellness resources
        </LuxuryButton>
      </View>
    </View>
  );
}

function TherapistList({
  onBack,
  onSelect,
  therapists
}: {
  onBack: () => void;
  onSelect: (therapist: TherapistProfile) => void;
  therapists: TherapistProfile[];
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to wellness
      </LuxuryButton>
      <Eyebrow>Therapist directory</Eyebrow>
      <Display style={styles.title}>Vetted support</Display>
      <SerifItalic style={styles.italic}>by request.</SerifItalic>
      <Body style={styles.copy}>
        Choose a professional profile to review approach, availability and session formats.
      </Body>

      {therapists.map((therapist) => (
        <LuxuryCard key={therapist.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Caption>{therapist.title}</Caption>
              <Title style={styles.name}>{therapist.name}</Title>
            </View>
            <Badge label={therapist.verified ? "Verified" : "Review"} />
          </View>
          <View style={styles.divider} />
          <Caption>{therapist.availability}</Caption>
          <Body style={styles.bio}>{therapist.bio}</Body>
          <View style={styles.chips}>
            {therapist.specialisms.map((specialism) => (
              <OptionChip key={specialism}>{specialism}</OptionChip>
            ))}
          </View>
          <LuxuryButton onPress={() => onSelect(therapist)}>View profile</LuxuryButton>
        </LuxuryCard>
      ))}
    </View>
  );
}

function TherapistProfileView({
  onBack,
  onRequest,
  therapist
}: {
  onBack: () => void;
  onRequest: () => void;
  therapist: TherapistProfile;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to therapists
      </LuxuryButton>
      <View style={styles.imagePlaceholder}>
        <Eyebrow>Professional profile</Eyebrow>
        <Caption>Portrait pending</Caption>
      </View>
      <Eyebrow>{therapist.title}</Eyebrow>
      <Display style={styles.title}>{therapist.name}</Display>
      <SerifItalic style={styles.italic}>{therapist.availability}</SerifItalic>
      <Body style={styles.copy}>{therapist.bio}</Body>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Qualifications</Title>
        {therapist.qualifications.map((qualification) => (
          <Body key={qualification}>- {qualification}</Body>
        ))}
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Session approach</Title>
        <Body>{therapist.sessionApproach}</Body>
        <View style={styles.divider} />
        <Caption>Available times</Caption>
        <View style={styles.chips}>
          {therapist.availableTimes.map((time) => (
            <OptionChip key={time}>{time}</OptionChip>
          ))}
        </View>
      </LuxuryCard>

      <LuxuryButton onPress={onRequest}>Request session</LuxuryButton>
    </View>
  );
}

function BookingFlow({
  booking,
  onBack,
  onPatch,
  onSubmit,
  therapist
}: {
  booking: BookingDraft;
  onBack: () => void;
  onPatch: (patch: Partial<BookingDraft>) => void;
  onSubmit: () => void;
  therapist: TherapistProfile;
}) {
  const canSubmit = Boolean(booking.sessionType && booking.date && booking.time);

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to profile
      </LuxuryButton>
      <Eyebrow>Session request</Eyebrow>
      <Display style={styles.title}>Request time</Display>
      <SerifItalic style={styles.italic}>with discretion.</SerifItalic>
      <Body style={styles.copy}>
        Submit a private booking request for {therapist.name}. The team will review timing,
        availability and the most appropriate support format.
      </Body>

      <LuxuryCard style={styles.card}>
        <Caption>Session type</Caption>
        <View style={styles.chips}>
          {therapist.sessionTypes.map((type) => (
            <OptionChip
              key={type}
              selected={booking.sessionType === type}
              onPress={() => onPatch({ sessionType: type })}
            >
              {type}
            </OptionChip>
          ))}
        </View>
        <FormField
          label="Preferred date"
          placeholder="Thursday 23 May"
          value={booking.date}
          onChangeText={(date) => onPatch({ date })}
        />
        <Caption>Preferred time</Caption>
        <View style={styles.chips}>
          {therapist.availableTimes.map((time) => (
            <OptionChip
              key={time}
              selected={booking.time === time}
              onPress={() => onPatch({ time })}
            >
              {time}
            </OptionChip>
          ))}
        </View>
        <FormField
          label="Private notes"
          placeholder="What would you like support with?"
          value={booking.notes}
          onChangeText={(notes) => onPatch({ notes })}
          multiline
        />
      </LuxuryCard>

      <LuxuryButton disabled={!canSubmit} onPress={onSubmit}>
        Submit request
      </LuxuryButton>
    </View>
  );
}

function BookingConfirmation({
  booking,
  onDone,
  therapist
}: {
  booking: BookingDraft;
  onDone: () => void;
  therapist: TherapistProfile;
}) {
  return (
    <View>
      <Eyebrow>Booking confirmation</Eyebrow>
      <Display style={styles.title}>Request received</Display>
      <SerifItalic style={styles.italic}>pending review.</SerifItalic>
      <Body style={styles.copy}>
        Your request with {therapist.name} has been received for private review by the member
        services team.
      </Body>

      <LuxuryCard style={styles.card}>
        <View style={styles.row}>
          <Caption>Status</Caption>
          <Badge label="Pending review" />
        </View>
        <View style={styles.divider} />
        <Title style={styles.cardTitle}>{booking.sessionType}</Title>
        <Body>
          Preferred date: {booking.date}. Preferred time: {booking.time}. Final confirmation will
          follow once availability has been reviewed.
        </Body>
      </LuxuryCard>

      <LuxuryButton onPress={onDone}>Return to wellness</LuxuryButton>
    </View>
  );
}

function WellnessResources({ onBack }: { onBack: () => void }) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to wellness
      </LuxuryButton>
      <Eyebrow>Wellness resources</Eyebrow>
      <Display style={styles.title}>Guidance</Display>
      <SerifItalic style={styles.italic}>before the moment.</SerifItalic>
      <Body style={styles.copy}>
        Editorial resources for emotional guidance, relationship preparation, boundaries and
        consent education.
      </Body>

      {wellnessResources.map((resource) => (
        <PlaceholderPanel
          key={resource.id}
          label={resource.category}
          title={resource.title}
          copy={resource.summary}
          style={styles.resource}
        />
      ))}
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
  bio: {
    marginTop: spacing.sm
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
    aspectRatio: 1.08,
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
  resource: {
    marginBottom: spacing.md
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
