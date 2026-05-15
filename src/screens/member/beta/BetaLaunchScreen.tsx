import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { submitBetaFeedback } from "@/services/betaLaunch";
import { createSupportTicket } from "@/services/operations";
import { palette, spacing } from "@/theme/tokens";

const feedbackTypes = ["experience", "bug", "conduct", "idea"] as const;
const sentiments = ["neutral", "strong", "low"] as const;

export function BetaLaunchScreen() {
  const [feedbackType, setFeedbackType] = useState<(typeof feedbackTypes)[number]>("experience");
  const [sentiment, setSentiment] = useState<(typeof sentiments)[number]>("neutral");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportDetails, setSupportDetails] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const submitFeedback = async () => {
    setError("");
    setFeedback("");
    const result = await submitBetaFeedback({
      details,
      sentiment,
      title: title || "Private beta feedback",
      type: feedbackType
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    setDetails("");
    setTitle("");
    setFeedback("Thank you. Your note has been sent to the private beta team.");
  };

  const submitSupport = async () => {
    setError("");
    setFeedback("");
    const result = await createSupportTicket({
      details: supportDetails,
      subject: supportSubject || "Member support request"
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    setSupportDetails("");
    setSupportSubject("");
    setFeedback("Your support request has been received for private review.");
  };

  return (
    <View>
      <Eyebrow>Private beta</Eyebrow>
      <Display style={styles.title}>Refine the Hauz.</Display>
      <SerifItalic style={styles.italic}>with quiet candour.</SerifItalic>
      <Body style={styles.copy}>
        You are part of a private review circle. Please test the member journey with care,
        discretion and honest notes on what feels elegant, unclear or unfinished.
      </Body>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>What to review</Title>
        <Body>
          Application clarity, member navigation, introductions, messages, wellness requests,
          private experiences, safety reporting and concierge status.
        </Body>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Member conduct</Title>
        <Body>
          Keep all testing respectful, private and precise. Do not share screenshots, personal
          details or member context outside the approved beta circle.
        </Body>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Caption>Experience feedback</Caption>
        <Title style={styles.cardTitle}>Tell us what needs attention.</Title>
        <View style={styles.chips}>
          {feedbackTypes.map((type) => (
            <OptionChip
              key={type}
              selected={feedbackType === type}
              onPress={() => setFeedbackType(type)}
            >
              {type}
            </OptionChip>
          ))}
        </View>
        <View style={styles.chips}>
          {sentiments.map((item) => (
            <OptionChip key={item} selected={sentiment === item} onPress={() => setSentiment(item)}>
              {item}
            </OptionChip>
          ))}
        </View>
        <FormField label="Short title" value={title} onChangeText={setTitle} />
        <FormField
          label="Private note"
          multiline
          value={details}
          onChangeText={setDetails}
        />
        <LuxuryButton onPress={submitFeedback}>Send feedback</LuxuryButton>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Caption>Support</Caption>
        <Title style={styles.cardTitle}>Report an issue.</Title>
        <FormField label="Subject" value={supportSubject} onChangeText={setSupportSubject} />
        <FormField
          label="What happened?"
          multiline
          value={supportDetails}
          onChangeText={setSupportDetails}
        />
        <LuxuryButton variant="outline" onPress={submitSupport}>
          Send support request
        </LuxuryButton>
      </LuxuryCard>

      {feedback ? (
        <PlaceholderPanel label="Received" title="Thank you" copy={feedback} style={styles.panel} />
      ) : null}
      {error ? <Caption style={styles.error}>{error}</Caption> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  error: {
    color: palette.pale,
    marginTop: spacing.md
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  panel: {
    marginTop: spacing.md
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
