import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { AgeGateScreen } from "@/screens/AgeGateScreen";
import { AccountStatusScreen } from "@/screens/AccountStatusScreen";
import { IntentionsPreferencesScreen } from "@/screens/application/IntentionsPreferencesScreen";
import { LifestyleInterestsScreen } from "@/screens/application/LifestyleInterestsScreen";
import { ManualReviewSubmissionScreen } from "@/screens/application/ManualReviewSubmissionScreen";
import { MembershipApplicationScreen } from "@/screens/application/MembershipApplicationScreen";
import { PersonalDetailsScreen } from "@/screens/application/PersonalDetailsScreen";
import { PhotoUploadScreen } from "@/screens/application/PhotoUploadScreen";
import { SocialLinksScreen } from "@/screens/application/SocialLinksScreen";
import { ApplicationStatusScreen } from "@/screens/ApplicationStatusScreen";
import { AuthScreen } from "@/screens/AuthScreen";
import { ApprovedMemberShellScreen } from "@/screens/member/ApprovedMemberShellScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { SplashScreen } from "@/screens/SplashScreen";
import { IdVerificationScreen } from "@/screens/verification/IdVerificationScreen";
import { SelfieVerificationScreen } from "@/screens/verification/SelfieVerificationScreen";
import { VerificationIntroScreen } from "@/screens/verification/VerificationIntroScreen";
import { AccountStatus, getAccountStatus, signOut } from "@/services/auth";
import { getAuthGateDestination } from "@/services/authGate";
import { ApplicationDraft, initialApplicationDraft } from "@/state/application";
import { motion, palette } from "@/theme/tokens";

import { AppRoute } from "./routes";

type AppNavigatorProps = {
  fontsLoaded: boolean;
};

export function AppNavigator({ fontsLoaded }: AppNavigatorProps) {
  const [route, setRoute] = useState<AppRoute>("splash");
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({
    isAdmin: false,
    state: "anonymous"
  });
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft>(initialApplicationDraft);
  const fade = useRef(new Animated.Value(1)).current;
  const offset = useRef(new Animated.Value(0)).current;

  const updateApplicationDraft = (patch: Partial<ApplicationDraft>) => {
    setApplicationDraft((current) => ({ ...current, ...patch }));
  };

  const navigate = (nextRoute: AppRoute) => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: motion.standard,
        useNativeDriver: true
      }),
      Animated.timing(offset, {
        toValue: 10,
        duration: motion.standard,
        useNativeDriver: true
      })
    ]).start(() => {
      setRoute(nextRoute);
      offset.setValue(10);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: motion.standard,
          useNativeDriver: true
        }),
        Animated.timing(offset, {
          toValue: 0,
          duration: motion.standard,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const routeForStatus = (status: AccountStatus) => {
    const destination = getAuthGateDestination(status.state);
    if (destination === "auth" || destination === "approvedMemberShell") {
      return destination;
    }

    if (destination === "applicationStatus" && !status.applicationStatus) {
      return "membershipApplication";
    }

    if (destination === "applicationStatus") {
      return "applicationStatus";
    }

    return "accountStatus";
  };

  const refreshAccountStatus = async () => {
    const status = await getAccountStatus();
    setAccountStatus(status.data);
    return status.data;
  };

  const routeAuthenticatedUser = (status: AccountStatus) => {
    setAccountStatus(status);
    navigate(routeForStatus(status));
  };

  const logout = async () => {
    await signOut();
    setAccountStatus({ isAdmin: false, state: "anonymous" });
    navigate("auth");
  };

  useEffect(() => {
    if (!fontsLoaded || route !== "splash") {
      return;
    }

    const timer = setTimeout(async () => {
      const status = await refreshAccountStatus();
      if (status.state === "anonymous") {
        navigate("ageGate");
        return;
      }
      navigate(routeForStatus(status));
    }, 1800);
    return () => clearTimeout(timer);
  }, [fontsLoaded, route]);

  const screen = {
    splash: <SplashScreen fontsLoaded={fontsLoaded} />,
    ageGate: <AgeGateScreen onConfirm={() => navigate("onboarding")} />,
    onboarding: <OnboardingScreen onComplete={() => navigate("auth")} />,
    auth: <AuthScreen onAuthenticated={routeAuthenticatedUser} />,
    membershipApplication: <MembershipApplicationScreen navigate={navigate} />,
    personalDetails: (
      <PersonalDetailsScreen
        draft={applicationDraft}
        navigate={navigate}
        updateDraft={updateApplicationDraft}
      />
    ),
    intentionsPreferences: (
      <IntentionsPreferencesScreen
        draft={applicationDraft}
        navigate={navigate}
        updateDraft={updateApplicationDraft}
      />
    ),
    lifestyleInterests: (
      <LifestyleInterestsScreen
        draft={applicationDraft}
        navigate={navigate}
        updateDraft={updateApplicationDraft}
      />
    ),
    photoUpload: <PhotoUploadScreen navigate={navigate} />,
    socialLinks: <SocialLinksScreen navigate={navigate} />,
    manualReviewSubmission: (
      <ManualReviewSubmissionScreen
        draft={applicationDraft}
        navigate={navigate}
        onSubmitted={refreshAccountStatus}
      />
    ),
    verificationIntro: <VerificationIntroScreen navigate={navigate} />,
    idVerification: <IdVerificationScreen navigate={navigate} />,
    selfieVerification: <SelfieVerificationScreen navigate={navigate} />,
    applicationStatus: (
      <ApplicationStatusScreen
        onLogout={logout}
        onRestart={() => navigate("membershipApplication")}
      />
    ),
    accountStatus: (
      <AccountStatusScreen
        onLogout={logout}
        onStartApplication={() => navigate("membershipApplication")}
        status={accountStatus}
      />
    ),
    approvedMemberShell: (
      <ApprovedMemberShellScreen isAdmin={accountStatus.isAdmin} onLogout={logout} />
    )
  }[route];

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.screen, { opacity: fade, transform: [{ translateY: offset }] }]}
      >
        {screen}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.void
  },
  screen: {
    flex: 1
  }
});
