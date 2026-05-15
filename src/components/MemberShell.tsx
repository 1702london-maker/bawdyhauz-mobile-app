import { ReactNode, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandBackground } from "@/components/BrandBackground";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Caption, Eyebrow } from "@/components/Typography";
import { memberTabs, MemberTab } from "@/navigation/memberTabs";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type MemberShellProps = {
  activeTab: MemberTab;
  onTabChange: (tab: MemberTab) => void;
  children: ReactNode;
  isAdmin?: boolean;
  onLogout: () => void;
};

export function MemberShell({
  activeTab,
  children,
  isAdmin = false,
  onLogout,
  onTabChange
}: MemberShellProps) {
  const [shopOpening, setShopOpening] = useState(false);
  const visibleTabs = memberTabs.filter((tab) => isAdmin || tab.key !== "admin");

  const openShop = async () => {
    setShopOpening(true);
    try {
      await Linking.openURL("https://www.bawdyhauz.com/shop");
    } finally {
      setShopOpening(false);
    }
  };

  return (
    <BrandBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={spacing.lg}
          style={styles.keyboard}
        >
          <View style={styles.header}>
            <View>
              <Eyebrow>BAWDYHAUZ</Eyebrow>
              <Caption>Private member access</Caption>
            </View>
            <LuxuryButton variant="ghost" onPress={openShop}>
              {shopOpening ? "Opening" : "Shop"}
            </LuxuryButton>
            <LuxuryButton arrowDirection="left" variant="ghost" onPress={onLogout}>
              Logout
            </LuxuryButton>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          <View style={styles.tabs}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tabTrack}>
                {visibleTabs.map((tab) => {
                  const isActive = tab.key === activeTab;
                  return (
                    <Pressable key={tab.key} onPress={() => onTabChange(tab.key)}>
                      {({ pressed }) => (
                        <View style={[styles.tab, isActive && styles.activeTab, pressed && styles.tabPressed]}>
                          <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                            {tab.label}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
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
  header: {
    alignItems: "center",
    borderBottomColor: borders.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  tabs: {
    borderTopColor: borders.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm
  },
  tabTrack: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  tab: {
    borderColor: borders.hairline,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 92,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeTab: {
    backgroundColor: palette.white,
    borderColor: palette.white
  },
  tabPressed: {
    opacity: 0.72
  },
  tabText: {
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.8,
    textAlign: "center",
    textTransform: "uppercase"
  },
  activeTabText: {
    color: palette.void
  }
});
