export type AppRoute =
  | "splash"
  | "ageGate"
  | "onboarding"
  | "auth"
  | "membershipApplication"
  | "personalDetails"
  | "intentionsPreferences"
  | "lifestyleInterests"
  | "photoUpload"
  | "socialLinks"
  | "manualReviewSubmission"
  | "verificationIntro"
  | "idVerification"
  | "selfieVerification"
  | "applicationStatus"
  | "accountStatus"
  | "approvedMemberShell";

export type Navigate = (route: AppRoute) => void;
