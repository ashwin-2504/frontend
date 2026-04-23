import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { theme } from "../theme/theme";
import StyledText from "./StyledText";
import { Feather } from "@expo/vector-icons";

/**
 * StatsCard with optional color prop for icon background differentiation.
 * color: { bg: '#E8F5E9', icon: '#2E7D32' }  (defaults to green)
 */
const StatsCard = ({ title, value, icon, color, onPress, accessibilityHint }) => {
  const iconBg = color?.bg || theme.COLORS.primaryLight;
  const iconColor = color?.icon || theme.COLORS.primary;

  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      style={[styles.card, theme.SHADOWS.light]}
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
        <StyledText variant="sectionHeader" bold>{value}</StyledText>
        <StyledText variant="caption" color={theme.COLORS.textSecondary}>{title}</StyledText>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.white,
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
    width: "48%",
    marginBottom: theme.SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.primaryLight,
    minHeight: 92,
  },
  iconContainer: {
    marginRight: theme.SPACING.sm,
    padding: 12,
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  content: {
    flex: 1,
  },
});

export default StatsCard;
