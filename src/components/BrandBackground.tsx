import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { palette } from "@/theme/tokens";

type BrandBackgroundProps = {
  children: ReactNode;
};

const GRID_LINES = Array.from({ length: 9 }, (_, index) => index);
const GRAIN_POINTS = Array.from({ length: 44 }, (_, index) => index);

export function BrandBackground({ children }: BrandBackgroundProps) {
  return (
    <View style={styles.root}>
      <View style={styles.radialGlow} />
      <View style={styles.grid}>
        {GRID_LINES.map((line) => (
          <View key={`v-${line}`} style={[styles.verticalLine, { left: `${line * 12.5}%` }]} />
        ))}
        {GRID_LINES.map((line) => (
          <View key={`h-${line}`} style={[styles.horizontalLine, { top: `${line * 12.5}%` }]} />
        ))}
      </View>
      <View pointerEvents="none" style={styles.grain}>
        {GRAIN_POINTS.map((point) => (
          <View
            key={point}
            style={[
              styles.grainPoint,
              {
                left: `${(point * 23) % 100}%`,
                top: `${(point * 37) % 100}%`,
                opacity: point % 3 === 0 ? 0.12 : 0.06
              }
            ]}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.void,
    overflow: "hidden"
  },
  radialGlow: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(244, 244, 244, 0.025)"
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.58
  },
  verticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(244, 244, 244, 0.035)"
  },
  horizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(244, 244, 244, 0.035)"
  },
  grain: {
    ...StyleSheet.absoluteFillObject
  },
  grainPoint: {
    position: "absolute",
    width: 1,
    height: 1,
    backgroundColor: palette.white
  }
});
