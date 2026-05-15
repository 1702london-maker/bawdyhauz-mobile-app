export type ApplicationDraft = {
  city: string;
  intentions: string[];
  relationshipIntention: string;
  nonNegotiables: string;
  lifestyleInterests: string[];
  lifestyleNotes: string;
  preferredIntroductionCity: string;
};

export type ApplicationDraftPatch = Partial<ApplicationDraft>;

export const initialApplicationDraft: ApplicationDraft = {
  city: "",
  intentions: ["Long-term connection"],
  relationshipIntention: "",
  nonNegotiables: "",
  lifestyleInterests: ["Fine dining"],
  lifestyleNotes: "",
  preferredIntroductionCity: ""
};
