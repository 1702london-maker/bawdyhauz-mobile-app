import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

import { fonts, palette } from "@/theme/tokens";

type TextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export function Eyebrow({ children, style }: TextProps) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

export function Display({ children, style }: TextProps) {
  return (
    <Text adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.display, style]}>
      {children}
    </Text>
  );
}

export function SerifItalic({ children, style }: TextProps) {
  return (
    <Text adjustsFontSizeToFit minimumFontScale={0.84} style={[styles.serifItalic, style]}>
      {children}
    </Text>
  );
}

export function Title({ children, style }: TextProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Body({ children, style }: TextProps) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Caption({ children, style }: TextProps) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  eyebrow: {
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 3.2,
    lineHeight: 16,
    textTransform: "uppercase"
  },
  display: {
    color: palette.white,
    fontFamily: fonts.serifLight,
    fontSize: 66,
    letterSpacing: -1.2,
    lineHeight: 72,
    includeFontPadding: false
  },
  serifItalic: {
    color: palette.silver,
    fontFamily: fonts.serifItalic,
    fontSize: 58,
    lineHeight: 64,
    includeFontPadding: false
  },
  title: {
    color: palette.white,
    fontFamily: fonts.serifRegular,
    fontSize: 31,
    lineHeight: 36
  },
  body: {
    color: palette.silver,
    fontFamily: fonts.sansLight,
    fontSize: 15,
    lineHeight: 28
  },
  caption: {
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 18
  }
});
