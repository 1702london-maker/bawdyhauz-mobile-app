import { ReactNode, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from "react-native";

import { Body, Caption, Eyebrow } from "@/components/Typography";
import { cities } from "@/data/cities";
import { borders, fonts, palette, radii, spacing } from "@/theme/tokens";

type FieldProps = TextInputProps & {
  label: string;
  note?: string;
};

type OptionChipProps = {
  children: ReactNode;
  onPress?: () => void;
  selected?: boolean;
};

type CityAutocompleteFieldProps = {
  label: string;
  note?: string;
  onChange: (city: string) => void;
  placeholder?: string;
  value: string;
};

type PlaceholderPanelProps = {
  label: string;
  title: string;
  copy: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function FormField({ label, note, style, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Eyebrow style={styles.label}>{label}</Eyebrow>
      <TextInput
        {...props}
        placeholderTextColor={palette.smoke}
        selectionColor={palette.white}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          props.multiline && styles.multiline,
          style
        ]}
      />
      {note ? <Caption style={styles.note}>{note}</Caption> : null}
    </View>
  );
}

export function OptionChip({ children, onPress, selected = false }: OptionChipProps) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]}>
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function CityAutocompleteField({
  label,
  note,
  onChange,
  placeholder = "Start typing a city",
  value
}: CityAutocompleteFieldProps) {
  const [focused, setFocused] = useState(false);
  const trimmedValue = value.trim().toLowerCase();
  const suggestions =
    trimmedValue.length === 0
      ? []
      : cities
          .filter((city) => city.toLowerCase().includes(trimmedValue))
          .filter((city) => city.toLowerCase() !== trimmedValue)
          .slice(0, 6);

  return (
    <View style={styles.field}>
      <Eyebrow style={styles.label}>{label}</Eyebrow>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={palette.smoke}
        selectionColor={palette.white}
        value={value}
        onChangeText={onChange}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        style={[styles.input, focused && styles.inputFocused]}
      />
      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((city) => (
            <Pressable key={city} onPress={() => onChange(city)}>
              {({ pressed }) => (
                <View style={[styles.suggestion, pressed && styles.suggestionPressed]}>
                  <Text style={styles.suggestionText}>{city}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}
      {note ? <Caption style={styles.note}>{note}</Caption> : null}
    </View>
  );
}

export function PlaceholderPanel({ label, title, copy, children, style }: PlaceholderPanelProps) {
  return (
    <View style={[styles.panel, style]}>
      <Eyebrow>{label}</Eyebrow>
      <Body style={styles.panelTitle}>{title}</Body>
      <Caption>{copy}</Caption>
      {children ? <View style={styles.panelChildren}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  label: {
    color: palette.silver
  },
  input: {
    minHeight: 52,
    borderColor: borders.quiet,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    color: palette.white,
    fontFamily: fonts.sansLight,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  inputFocused: {
    backgroundColor: "rgba(244, 244, 244, 0.025)",
    borderColor: borders.visible
  },
  multiline: {
    minHeight: 118,
    textAlignVertical: "top"
  },
  note: {
    color: palette.smoke
  },
  chip: {
    borderColor: borders.quiet,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipSelected: {
    backgroundColor: palette.white,
    borderColor: palette.white
  },
  chipPressed: {
    opacity: 0.72
  },
  chipText: {
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  chipTextSelected: {
    color: palette.void
  },
  suggestions: {
    borderColor: borders.hairline,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden"
  },
  suggestion: {
    borderBottomColor: borders.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  suggestionPressed: {
    backgroundColor: "rgba(244, 244, 244, 0.05)"
  },
  suggestionText: {
    color: palette.pale,
    fontFamily: fonts.sansLight,
    fontSize: 14,
    letterSpacing: 0.4
  },
  panel: {
    borderColor: borders.hairline,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm
  },
  panelTitle: {
    color: palette.pale,
    fontFamily: fonts.serifRegular,
    fontSize: 24,
    lineHeight: 30
  },
  panelChildren: {
    marginTop: spacing.md
  }
});
