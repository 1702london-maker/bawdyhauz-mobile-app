import { CityAutocompleteField, FormField } from "@/components/FormField";
import { StepScaffold } from "@/components/StepScaffold";
import { Navigate } from "@/navigation/routes";
import { ApplicationDraft, ApplicationDraftPatch } from "@/state/application";

type Props = {
  draft: ApplicationDraft;
  navigate: Navigate;
  updateDraft: (patch: ApplicationDraftPatch) => void;
};

export function PersonalDetailsScreen({ draft, navigate, updateDraft }: Props) {
  return (
    <StepScaffold
      eyebrow="Personal details"
      stepLabel="02 / 10"
      title="Who is entering"
      italic="the Hauz?"
      copy="These fields are placeholders for the future Supabase-backed application form. They establish the private member identity."
      primaryLabel="Continue"
      onPrimary={() => navigate("intentionsPreferences")}
      secondaryLabel="Back"
      onSecondary={() => navigate("membershipApplication")}
    >
      <FormField label="Full name" placeholder="Your legal name" />
      <FormField label="Private email" placeholder="you@example.com" keyboardType="email-address" />
      <CityAutocompleteField
        label="City"
        placeholder="London, Paris, New York..."
        value={draft.city}
        onChange={(city) => updateDraft({ city })}
      />
      <FormField label="Age" placeholder="18+" keyboardType="number-pad" />
    </StepScaffold>
  );
}
