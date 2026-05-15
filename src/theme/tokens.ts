export const palette = {
  void: "#050505",
  black: "#0c0c0c",
  charcoal: "#181818",
  iron: "#242424",
  graphite: "#303030",
  smoke: "#4a4a4a",
  mid: "#6a6a6a",
  ash: "#8c8c8c",
  silver: "#b0b0b0",
  pale: "#d0d0d0",
  fog: "#e8e8e8",
  white: "#f4f4f4"
} as const;

export const fonts = {
  serifLight: "CormorantGaramond_300Light",
  serifItalic: "CormorantGaramond_300Light_Italic",
  serifRegular: "CormorantGaramond_400Regular",
  serifMedium: "CormorantGaramond_500Medium",
  sansLight: "Jost_300Light",
  sansRegular: "Jost_400Regular",
  sansMedium: "Jost_500Medium"
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72
} as const;

export const radii = {
  none: 0,
  sm: 2,
  md: 4,
  card: 6
} as const;

export const borders = {
  hairline: "rgba(244, 244, 244, 0.08)",
  quiet: "rgba(244, 244, 244, 0.14)",
  visible: "rgba(244, 244, 244, 0.22)"
} as const;

export const motion = {
  quick: 180,
  standard: 360,
  slow: 720
} as const;
