import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { BrandBackground } from "@/components/BrandBackground";
import { FormField } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { AccountStatus, signInWithEmail, signUpWithEmail } from "@/services/auth";
import { palette, spacing } from "@/theme/tokens";

type AuthScreenProps = {
  onAuthenticated: (status: AccountStatus) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.includes("@") && password.length >= 8 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    const result =
      mode === "login"
        ? await signInWithEmail({ email, password })
        : await signUpWithEmail({ email, password });
    setSubmitting(false);

    if (result.error || !result.data) {
      setMessage(result.error ?? "Authentication could not be completed.");
      return;
    }

    onAuthenticated(result.data);
  };

  return (
    <BrandBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.root}
      >
        <View style={styles.content}>
          <Eyebrow>Private access</Eyebrow>
          <Display style={styles.title}>{mode === "login" ? "Return" : "Request"}</Display>
          <SerifItalic style={styles.italic}>
            {mode === "login" ? "to the Hauz." : "member access."}
          </SerifItalic>
          <Body style={styles.copy}>
            Sign in with the email attached to your BAWDYHAUZ membership application.
          </Body>

          <LuxuryCard>
            <Title style={styles.cardTitle}>
              {mode === "login" ? "Member login" : "Create private account"}
            </Title>
            <FormField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="name@example.com"
              value={email}
            />
            <FormField
              label="Password"
              onChangeText={setPassword}
              placeholder="Minimum 8 characters"
              secureTextEntry
              value={password}
            />
            {message ? <Caption style={styles.message}>{message}</Caption> : null}
            <View style={styles.actions}>
              <LuxuryButton disabled={!canSubmit} onPress={submit}>
                {submitting ? "Checking" : mode === "login" ? "Login" : "Create account"}
              </LuxuryButton>
              <LuxuryButton
                arrowDirection="none"
                variant="outline"
                onPress={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Create account" : "I already have access"}
              </LuxuryButton>
            </View>
          </LuxuryCard>
        </View>
      </KeyboardAvoidingView>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg
  },
  cardTitle: {
    marginBottom: spacing.md
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  message: {
    color: palette.pale,
    marginTop: spacing.sm
  },
  root: {
    flex: 1
  },
  title: {
    fontSize: 50,
    lineHeight: 58,
    marginTop: spacing.lg
  }
});
