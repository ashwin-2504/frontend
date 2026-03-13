import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONT_WEIGHTS } from "../theme/theme";

const ROLES = [
  { key: "Farmer", icon: "sun", subtitle: "Sell your produce", color: COLORS.primary },
  { key: "Buyer", icon: "shopping-bag", subtitle: "Shop fresh goods", color: COLORS.info },
];

const RoleSelector = ({ selectedRole, onRoleChange }) => {
  return (
    <View style={styles.container}>
      {ROLES.map((role) => {
        const isSelected = selectedRole === role.key;
        return (
          <Pressable
            key={role.key}
            onPress={() => onRoleChange(role.key)}
            style={[
              styles.roleBtn,
              isSelected
                ? [styles.selectedBtn, { borderColor: role.color, backgroundColor: role.color + "10" }]
                : styles.unselectedBtn,
              isSelected && SHADOWS.light,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${role.key} role`}
            accessibilityHint={`Select ${role.key} to ${role.subtitle.toLowerCase()}`}
          >
            <View style={[styles.iconCircle, { backgroundColor: isSelected ? role.color + "20" : COLORS.background }]}>
              <Feather name={role.icon} size={22} color={isSelected ? role.color : COLORS.textSecondary} />
            </View>
            <Text
              allowFontScaling={true}
              style={[
                styles.roleText,
                isSelected ? { color: role.color } : styles.unselectedText,
              ]}
            >
              {role.key}
            </Text>
            <Text allowFontScaling={true} style={styles.subtitle}>{role.subtitle}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginVertical: SPACING.lg,
  },
  roleBtn: {
    flex: 0.48,
    paddingVertical: SPACING.lg,
    minHeight: 84,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  selectedBtn: {
    borderColor: COLORS.primary,
  },
  unselectedBtn: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  roleText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  unselectedText: {
    color: COLORS.textSecondary,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default RoleSelector;
