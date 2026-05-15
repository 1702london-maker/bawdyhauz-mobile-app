import { StyleSheet, View } from "react-native";

import { CityAutocompleteField, FormField, OptionChip } from "@/components/FormField";
import { StepScaffold } from "@/components/StepScaffold";
import { Navigate } from "@/navigation/routes";
import { ApplicationDraft, ApplicationDraftPatch } from "@/state/application";
import { spacing } from "@/theme/tokens";

type Props = {
  draft: ApplicationDraft;
  navigate: Navigate;
  updateDraft: (patch: ApplicationDraftPatch) => void;
};

const lifestyleOptions = [
  "Fine dining",
  "Members lounges",
  "Wellness",
  "Travel",
  "Culture",
  "Private events"
];

export function LifestyleInterestsScreen({ draft, navigate, updateDraft }: Props) {
  const toggleLifestyleInterest = (option: string) => {
    const lifestyleInterests = draft.lifestyleInterests.includes(option)
      ? draft.lifestyleInterests.filter((item) => item !== option)
      : [...draft.lifestyleInterests, option];

    updateDraft({ lifestyleInterests });
  };

  return (
    <StepScaffold
      eyebrow="Lifestyle"
      stepLabel="04 / 10"
      title="Taste, rhythm,"
      italic="and private life."
      copy="The application should feel editorial and considered, collecting lifestyle signals without turning the member into a swipe profile."
      primaryLabel="Continue"
      onPrimary={() => navigate("photoUpload")}
      secondaryLabel="Back"
      onSecondary={() => navigate("intentionsPreferences")}
    >
      <View style={styles.chips}>
        {lifestyleOptions.map((option) => (
          <OptionChip
            key={option}
            selected={draft.lifestyleInterests.includes(option)}
            onPress={() => toggleLifestyleInterest(option)}
          >
            {option}
          </OptionChip>
        ))}
      </View>
      <FormField
        label="Lifestyle notes"
        placeholder="How do you prefer to spend your private time?"
        value={draft.lifestyleNotes}
        onChangeText={(lifestyleNotes) => updateDraft({ lifestyleNotes })}
        multiline
      />
      <CityAutocompleteField
        label="Preferred city for introductions"
        placeholder="Primary city"
        value={draft.preferredIntroductionCity}
        onChange={(preferredIntroductionCity) => updateDraft({ preferredIntroductionCity })}
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
