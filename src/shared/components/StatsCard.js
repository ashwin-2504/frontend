import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from "../theme/theme";
import { Feather } from "@expo/vector-icons";

/**
 * StatsCard with optional color prop for icon background differentiation.
 * color: { bg: '#E8F5E9', icon: '#2E7D32' }  (defaults to green)
 */
const StatsCard = ({ title, value, icon, color, onPress, accessibilityHint }) => {
  const iconBg = color?.bg || COLORS.primaryLight;
  const iconColor = color?.icon || COLORS.primary;

  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      style={[styles.card, SHADOWS.light]}
      accessible={true}
      accessibilityRole={onPress ? "button" : "summary"}
      accessibilityLabel={`${title}: ${value}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text allowFontScaling={true} style={styles.value}>{value}</Text>
        <Text allowFontScaling={true} style={styles.title}>{title}</Text>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    width: "48%",
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    minHeight: 92,
  },
  iconContainer: {
    marginRight: SPACING.sm,
    padding: 12,
    borderRadius: BORDER_RADIUS.sm,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.heavy,
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: 2,
  },
});

export default StatsCard;
