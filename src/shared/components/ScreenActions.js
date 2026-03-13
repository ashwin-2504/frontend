import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BORDER_RADIUS, COLORS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, SPACING } from "../theme/theme";

export const TopBar = ({ title, onBack, backLabel = "Back", backHint = "Go to previous screen", rightNode }) => {
  return (
    <View style={styles.header}>
      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        accessibilityHint={backHint}
      >
        <Feather name="arrow-left-circle" size={24} color={COLORS.textPrimary} />
        <Text allowFontScaling={true} style={styles.backText}>
          Back
        </Text>
      </Pressable>
      <Text allowFontScaling={true} style={styles.headerTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.rightSlot}>{rightNode || null}</View>
    </View>
  );
};

export const BottomNextBar = ({
  label = "Next",
  icon = "arrow-right-circle",
  onPress,
  accessibilityHint,
  disabled = false,
}) => {
  return (
    <View style={styles.footer}>
      <Pressable
        style={[styles.nextButton, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint || "Move to next step"}
      >
        <Text allowFontScaling={true} style={styles.nextText}>
          {label}
        </Text>
        <Feather name={icon} size={20} color={COLORS.white} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    ...SHADOWS.light,
  },
  backButton: {
    minWidth: 88,
    minHeight: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.white,
  },
  backText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginHorizontal: SPACING.sm,
  },
  rightSlot: {
    minWidth: 88,
    alignItems: "flex-end",
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    minHeight: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    ...SHADOWS.light,
  },
  nextText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  disabled: {
    opacity: 0.5,
  },
});
