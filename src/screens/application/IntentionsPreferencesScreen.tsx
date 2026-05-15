import { StyleSheet, View } from "react-native";

import { FormField, OptionChip } from "@/components/FormField";
import { StepScaffold } from "@/components/StepScaffold";
import { Navigate } from "@/navigation/routes";
import { ApplicationDraft, ApplicationDraftPatch } from "@/state/application";
import { spacing } from "@/theme/tokens";

type Props = {
  draft: ApplicationDraft;
  navigate: Navigate;
  updateDraft: (patch: ApplicationDraftPatch) => void;
};

const intentionOptions = [
  "Long-term connection",
  "Curated dating",
  "Emotional guidance",
  "Private experiences"
];

export function IntentionsPreferencesScreen({ draft, navigate, updateDraft }: Props) {
  const toggleIntention = (option: string) => {
    const intentions = draft.intentions.includes(option)
      ? draft.intentions.filter((item) => item !== option)
      : [...draft.intentions, option];

    updateDraft({ intentions });
  };

  return (
    <StepScaffold
      eyebrow="Intentions"
      stepLabel="03 / 10"
      title="Seriousness before"
      italic="chemistry."
      copy="BAWDYHAUZ is not designed for casual volume. This step captures the kind of connection a member is mature enough to pursue."
      primaryLabel="Continue"
      onPrimary={() => navigate("lifestyleInterests")}
      secondaryLabel="Back"
      onSecondary={() => navigate("personalDetails")}
    >
      <View style={styles.chips}>
        {intentionOptions.map((option) => (
          <OptionChip
            key={option}
            selected={draft.intentions.includes(option)}
            onPress={() => toggleIntention(option)}
          >
            {option}
          </OptionChip>
        ))}
      </View>
      <FormField
        label="Relationship intention"
        placeholder="Describe what you are genuinely seeking"
        value={draft.relationshipIntention}
        onChangeText={(relationshipIntention) => updateDraft({ relationshipIntention })}
        multiline
      />
      <FormField
        label="Non-negotiables"
        placeholder="Values, boundaries, lifestyle requirements"
        value={draft.nonNegotiables}
        onChangeText={(nonNegotiables) => updateDraft({ nonNegotiables })}
        multiline
      />
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg
  }
});
