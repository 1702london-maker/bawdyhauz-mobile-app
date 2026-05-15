import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandBackground } from "@/components/BrandBackground";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Body, Caption, Display, Eyebrow, SerifItalic } from "@/components/Typography";
import { palette, spacing } from "@/theme/tokens";

type StepScaffoldProps = {
  eyebrow: string;
  title: string;
  italic?: string;
  copy: string;
  stepLabel: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function StepScaffold({
  eyebrow,
  title,
  italic,
  copy,
  stepLabel,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary
}: StepScaffoldProps) {
  return (
    <BrandBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={spacing.lg}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Eyebrow>{eyebrow}</Eyebrow>
              <Caption>{stepLabel}</Caption>
            </View>
            <View style={styles.hero}>
              <Display style={styles.title}>{title}</Display>
              {italic ? <SerifItalic style={styles.italic}>{italic}</SerifItalic> : null}
              <Body style={styles.copy}>{copy}</Body>
            </View>
            <View style={styles.body}>{children}</View>
            <View style={styles.actions}>
              <LuxuryButton onPress={onPrimary}>{primaryLabel}</LuxuryButton>
              {secondaryLabel && onSecondary ? (
                <LuxuryButton arrowDirection="left" variant="outline" onPress={onSecondary}>
                  {secondaryLabel}
                </LuxuryButton>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md
  },
  hero: {
    paddingTop: spacing.xxl
  },
  title: {
    fontSize: 48,
    lineHeight: 54
  },
  italic: {
    fontSize: 40,
    lineHeight: 48,
    marginTop: spacing.xs
  },
  copy: {
    marginTop: spacing.lg,
    color: palette.silver
  },
  body: {
    paddingTop: spacing.xl
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl
  }
});
