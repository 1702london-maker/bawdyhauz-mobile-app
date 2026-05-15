import { useEffect, useMemo, useState } from "react";

import { MemberShell } from "@/components/MemberShell";
import { memberProfiles, MemberProfile } from "@/data/matchmaking";
import { MemberTab } from "@/navigation/memberTabs";
import { trackAnalyticsEvent } from "@/services/analytics";
import { expressInterest, loadApprovedMatches } from "@/services/matches";
import { registerPushToken } from "@/services/notifications";
import { loadDiscoverProfiles } from "@/services/profiles";

import { ApprovedMemberHomeScreen } from "./ApprovedMemberHomeScreen";
import { AdminDashboardScreen } from "./admin/AdminDashboardScreen";
import { BetaLaunchScreen } from "./beta/BetaLaunchScreen";
import { DiscoverScreen, InterestState } from "./discover/DiscoverScreen";
import { ExperiencesScreen } from "./experiences/ExperiencesScreen";
import { MatchCreatedScreen } from "./discover/MatchCreatedScreen";
import { MembershipScreen } from "./membership/MembershipScreen";
import { ProfilePreviewScreen } from "./discover/ProfilePreviewScreen";
import { MatchesScreen } from "./matches/MatchesScreen";
import { ConversationScreen, ConversationState } from "./messages/ConversationScreen";
import { MemberPlaceholderScreen } from "./MemberPlaceholderScreen";
import { ProfileMediaScreen } from "./profile/ProfileMediaScreen";
import { SafetyScreen } from "./safety/SafetyScreen";
import { NotificationPreferencesScreen } from "./settings/NotificationPreferencesScreen";
import { WellnessScreen } from "./wellness/WellnessScreen";

type DiscoverView = "list" | "profile" | "matchCreated";

const quietScreens = {
  messages: (
    <MemberPlaceholderScreen
      eyebrow="Messages"
      title="Private chat"
      italic="after a match."
      copy="Private conversation opens once a mutual introduction has been confirmed."
    />
  ),
  profile: <ProfileMediaScreen />,
  settings: <NotificationPreferencesScreen />
};

type ApprovedMemberShellScreenProps = {
  isAdmin: boolean;
  onLogout: () => void;
};

export function ApprovedMemberShellScreen({
  isAdmin,
  onLogout
}: ApprovedMemberShellScreenProps) {
  const [activeTab, setActiveTab] = useState<MemberTab>("home");
  const [discoverView, setDiscoverView] = useState<DiscoverView>("list");
  const [selectedProfile, setSelectedProfile] = useState<MemberProfile | undefined>();
  const [profiles, setProfiles] = useState<MemberProfile[]>(memberProfiles);
  const [matchedProfileIds, setMatchedProfileIds] = useState<string[]>(["amelia", "marcus"]);
  const [archivedMatchIds, setArchivedMatchIds] = useState<string[]>(["celeste"]);
  const [blockedMatchIds, setBlockedMatchIds] = useState<string[]>([]);
  const [interestStates, setInterestStates] = useState<Record<string, InterestState>>({});
  const [selectedConversationProfile, setSelectedConversationProfile] = useState<
    MemberProfile | undefined
  >();
  const [conversationStates, setConversationStates] = useState<Record<string, ConversationState>>({
    amelia: {
      conciergeAtmosphere: "",
      conciergeCity: "London",
      conciergeDateTime: "",
      conciergeSubmitted: false,
      conversationMinutes: 120,
      scheduledVideo: false,
      videoCompleted: false
    },
    marcus: {
      conciergeAtmosphere: "",
      conciergeCity: "Manchester",
      conciergeDateTime: "",
      conciergeSubmitted: false,
      conversationMinutes: 180,
      scheduledDuration: 30,
      scheduledVideo: false,
      videoCompleted: false
    }
  });

  const matches = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          matchedProfileIds.includes(profile.id) &&
          !archivedMatchIds.includes(profile.id) &&
          !blockedMatchIds.includes(profile.id)
      ),
    [archivedMatchIds, blockedMatchIds, matchedProfileIds, profiles]
  );

  const archivedMatches = useMemo(
    () => profiles.filter((profile) => archivedMatchIds.includes(profile.id)),
    [archivedMatchIds, profiles]
  );

  const blockedMatches = useMemo(
    () => profiles.filter((profile) => blockedMatchIds.includes(profile.id)),
    [blockedMatchIds, profiles]
  );

  useEffect(() => {
    let alive = true;

    const loadLiveData = async () => {
      const profileResult = await loadDiscoverProfiles();
      if (!alive) {
        return;
      }

      setProfiles(profileResult.data);
      const fallbackMatches = profileResult.data.filter((profile) =>
        matchedProfileIds.includes(profile.id)
      );
      const matchResult = await loadApprovedMatches(fallbackMatches);
      if (!alive) {
        return;
      }

      setMatchedProfileIds(matchResult.data.map((profile) => profile.id));
    };

    loadLiveData();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    registerPushToken();
    trackAnalyticsEvent("member.shell_opened", "member", { isAdmin });
  }, []);

  const changeTab = (tab: MemberTab) => {
    if (tab === "admin" && !isAdmin) {
      setActiveTab("home");
      return;
    }

    setActiveTab(tab);
    trackAnalyticsEvent("member.tab_viewed", "member", { tab });
    if (tab !== "discover") {
      setDiscoverView("list");
    }
  };

  const selectProfile = (profile: MemberProfile) => {
    setSelectedProfile(profile);
    setDiscoverView("profile");
  };

  const setInterestState = (profileId: string, state: InterestState) => {
    setInterestStates((current) => ({ ...current, [profileId]: state }));
    const profile = profiles.find((item) => item.id === profileId);
    if (state === "interested" && profile?.mutualInterestReady) {
      requestIntroduction(profile, true);
    }
  };

  const requestIntroduction = async (profile: MemberProfile, skipInterestPatch = false) => {
    if (!skipInterestPatch) {
      setInterestStates((current) => ({ ...current, [profile.id]: "interested" }));
    }
    await expressInterest(profile.id);
    setMatchedProfileIds((current) =>
      current.includes(profile.id) ? current : [...current, profile.id]
    );
    setSelectedProfile(profile);
    setDiscoverView("matchCreated");
  };

  const openConversation = (profile: MemberProfile) => {
    setSelectedConversationProfile(profile);
    setConversationStates((current) => ({
      ...current,
      [profile.id]: current[profile.id] ?? {
        conciergeAtmosphere: "",
        conciergeCity: profile.preferredIntroductionCity,
        conciergeDateTime: "",
        conciergeSubmitted: false,
        conversationMinutes: 0,
        scheduledVideo: false,
        videoCompleted: false
      }
    }));
    setActiveTab("messages");
  };

  const patchConversation = (patch: Partial<ConversationState>) => {
    if (!selectedConversationProfile) {
      return;
    }

    setConversationStates((current) => ({
      ...current,
      [selectedConversationProfile.id]: {
        ...current[selectedConversationProfile.id],
        ...patch
      }
    }));
  };

  const archiveMatch = (profileId: string) => {
    setArchivedMatchIds((current) => (current.includes(profileId) ? current : [...current, profileId]));
    setBlockedMatchIds((current) => current.filter((id) => id !== profileId));
  };

  const blockMatch = (profileId: string) => {
    setBlockedMatchIds((current) => (current.includes(profileId) ? current : [...current, profileId]));
    setArchivedMatchIds((current) => current.filter((id) => id !== profileId));
  };

  const renderActiveScreen = () => {
    if (activeTab === "home") {
      return <ApprovedMemberHomeScreen />;
    }

    if (activeTab === "discover") {
      if (discoverView === "profile" && selectedProfile) {
        return (
          <ProfilePreviewScreen
            profile={selectedProfile}
            onBack={() => setDiscoverView("list")}
            onRequestIntroduction={requestIntroduction}
          />
        );
      }

      if (discoverView === "matchCreated" && selectedProfile) {
        return (
          <MatchCreatedScreen
            profile={selectedProfile}
            onBackToDiscover={() => setDiscoverView("list")}
            onViewMatches={() => setActiveTab("matches")}
          />
        );
      }

      return (
        <DiscoverScreen
          profiles={profiles}
          interestStates={interestStates}
          onSelectProfile={selectProfile}
          onSetInterestState={setInterestState}
        />
      );
    }

    if (activeTab === "matches") {
      return (
        <MatchesScreen
          archivedMatches={archivedMatches}
          blockedMatches={blockedMatches}
          matches={matches}
          onArchiveMatch={archiveMatch}
          onBlockMatch={blockMatch}
          onOpenChat={openConversation}
        />
      );
    }

    if (activeTab === "messages") {
      return (
        <ConversationScreen
          match={selectedConversationProfile}
          conversation={
            selectedConversationProfile
              ? conversationStates[selectedConversationProfile.id]
              : undefined
          }
          onBackToMatches={() => setActiveTab("matches")}
          onPatchConversation={patchConversation}
        />
      );
    }

    if (activeTab === "membership") {
      return <MembershipScreen />;
    }

    if (activeTab === "beta") {
      return <BetaLaunchScreen />;
    }

    if (activeTab === "wellness") {
      return <WellnessScreen />;
    }

    if (activeTab === "safety") {
      return <SafetyScreen />;
    }

    if (activeTab === "experiences") {
      return <ExperiencesScreen />;
    }

    if (activeTab === "admin" && isAdmin) {
      return <AdminDashboardScreen />;
    }

    if (activeTab === "profile" || activeTab === "settings") {
      return quietScreens[activeTab];
    }

    return <ApprovedMemberHomeScreen />;
  };

  return (
    <MemberShell activeTab={activeTab} isAdmin={isAdmin} onLogout={onLogout} onTabChange={changeTab}>
      {renderActiveScreen()}
    </MemberShell>
  );
}
