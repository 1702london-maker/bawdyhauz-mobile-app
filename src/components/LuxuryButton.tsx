import { ReactNode, useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle
} from "react-native";

import { borders, fonts, motion, palette } from "@/theme/tokens";

type LuxuryButtonProps = PressableProps & {
  children: ReactNode;
  arrowDirection?: "left" | "right" | "none";
  variant?: "solid" | "outline" | "ghost";
  style?: StyleProp<ViewStyle>;
};

export function LuxuryButton({
  children,
  arrowDirection = "right",
  variant = "solid",
  style,
  ...props
}: LuxuryButtonProps) {
  const press = useRef(new Animated.Value(0)).current;

  const animate = (toValue: number) => {
    Animated.timing(press, {
      toValue,
      duration: motion.quick,
      useNativeDriver: true
    }).start();
  };

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.98]
  });
  const opacity = press.interpolate({
    inputRange: [0, 1],
    outputRange: [props.disabled ? 0.48 : 1, props.disabled ? 0.48 : 0.78]
  });

  return (
    <Pressable
      {...props}
      disabled={props.disabled}
      onPressIn={(event) => {
        animate(1);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(0);
        props.onPressOut?.(event);
      }}
    >
      <Animated.View
        style={[
          styles.base,
          styles[variant],
          props.disabled && styles.disabled,
          { opacity, transform: [{ scale }] },
          style
        ]}
      >
        {arrowDirection === "left" ? (
          <Text style={[styles.arrow, variant === "solid" && styles.solidLabel]}>{"\u2190"}</Text>
        ) : null}
        <Text style={[styles.label, variant === "solid" && styles.solidLabel]}>{children}</Text>
        {arrowDirection === "right" ? (
          <Text style={[styles.arrow, variant === "solid" && styles.solidLabel]}>{"\u2192"}</Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth
  },
  solid: {
    backgroundColor: palette.white,
    borderColor: palette.white
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: borders.visible
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    paddingHorizontal: 0
  },
  disabled: {
    borderColor: borders.hairline
  },
  label: {
    color: palette.silver,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2.6,
    textTransform: "uppercase"
  },
  solidLabel: {
    color: palette.void
  },
  arrow: {
    color: palette.silver,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 16
  }
});
