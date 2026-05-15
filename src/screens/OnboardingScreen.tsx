import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandBackground } from "@/components/BrandBackground";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { borders, palette, spacing } from "@/theme/tokens";

type OnboardingScreenProps = {
  onComplete: () => void;
};

const slides = [
  {
    eyebrow: "01 — Membership",
    title: "Closed access, manually reviewed.",
    italic: "No instant entry.",
    copy: "Every applicant is considered by the BAWDYHAUZ team before access is granted. Quality, safety and intention come first.",
    note: "Apply. Be reviewed. Enter only when approved."
  },
  {
    eyebrow: "02 — Matchmaking",
    title: "Introductions, not endless swiping.",
    italic: "Human-led chemistry.",
    copy: "Discover is curated around seriousness, compatibility and emotional intelligence. Mutual interest opens private conversation.",
    note: "Chat first. Video next. Concierge only when both agree."
  },
  {
    eyebrow: "03 — Ecosystem",
    title: "Therapy, experiences and support.",
    italic: "Discreetly arranged.",
    copy: "Wellness guidance, private events and concierge dating all sit inside one mature members ecosystem.",
    note: "The app is a private house, not a public marketplace."
  }
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <BrandBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Eyebrow>{slide.eyebrow}</Eyebrow>
            <Caption>{index + 1} / {slides.length}</Caption>
          </View>

          <View style={styles.hero}>
            <Display style={styles.title}>{slide.title}</Display>
            <SerifItalic style={styles.italic}>{slide.italic}</SerifItalic>
            <Body style={styles.copy}>{slide.copy}</Body>
          </View>

          <LuxuryCard style={styles.card}>
            <Title style={styles.cardTitle}>The standard</Title>
            <Body>{slide.note}</Body>
          </LuxuryCard>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {slides.map((item, dotIndex) => (
                <View
                  key={item.eyebrow}
                  style={[styles.dot, dotIndex === index && styles.activeDot]}
                />
              ))}
            </View>
            <LuxuryButton
              onPress={() => {
                if (isLast) {
                  onComplete();
                  return;
                }
                setIndex((current) => current + 1);
              }}
            >
              {isLast ? "Begin application" : "Continue"}
            </LuxuryButton>
          </View>
        </View>
      </SafeAreaView>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  container: {
    flex: 1,
    padding: spacing.xl
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xxl
  },
  title: {
    fontSize: 48,
    lineHeight: 56
  },
  italic: {
    fontSize: 40,
    lineHeight: 48,
    marginTop: spacing.sm
  },
  copy: {
    marginTop: spacing.xl
  },
  card: {
    marginBottom: spacing.xl
  },
  cardTitle: {
    marginBottom: spacing.sm
  },
  footer: {
    gap: spacing.lg
  },
  dots: {
    flexDirection: "row",
    gap: spacing.sm
  },
  dot: {
    width: 28,
    height: StyleSheet.hairlineWidth,
    backgroundColor: borders.hairline
  },
  activeDot: {
    backgroundColor: palette.white
  }
});
