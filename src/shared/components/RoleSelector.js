import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import StyledText from "./StyledText";

const ROLES = [
  { key: "seller", label: "Farmer", icon: "sun", subtitle: "Sell your produce", color: theme.COLORS.primary },
  { key: "customer", label: "Buyer", icon: "shopping-bag", subtitle: "Shop fresh goods", color: theme.COLORS.info },
];

const RoleSelector = ({ selectedRole, onRoleChange, disabled = false }) => {
  return (
    <View style={styles.container}>
      {ROLES.map((role) => {
        const isSelected = selectedRole === role.key;
        const activeColor = isSelected ? role.color : theme.COLORS.border;
        const bgTint = isSelected ? (role.key === 'seller' ? theme.COLORS.primaryLight : theme.COLORS.info + "10") : theme.COLORS.white;

        return (
          <Pressable
            key={role.key}
            disabled={disabled}
            onPress={() => onRoleChange(role.key)}
            style={[
              styles.roleCard,
              { borderColor: activeColor, backgroundColor: bgTint },
              isSelected && theme.SHADOWS.medium,
              disabled && styles.disabledCard,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled }}
          >
            <View style={[styles.iconBox, { backgroundColor: isSelected ? role.color : theme.COLORS.surface }]}>
              <Feather name={role.icon} size={24} color={isSelected ? theme.COLORS.white : theme.COLORS.textSecondary} />
            </View>
            <View style={styles.textContainer}>
              <StyledText
                variant="bodyPrimary"
                bold
                color={isSelected ? role.color : theme.COLORS.textPrimary}
              >
                {role.label}
              </StyledText>
              <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>{role.subtitle}</StyledText>
            </View>
            {isSelected && (
              <View style={[styles.checkCircle, { backgroundColor: role.color }]}>
                <Feather name="check" size={14} color={theme.COLORS.white} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: theme.SPACING.lg,
    gap: theme.SPACING.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
    borderWidth: 2,
    overflow: 'hidden',
  },
  unselectedCard: {
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
  },
  disabledCard: {
    opacity: 0.6,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: theme.SPACING.md,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
});

export default RoleSelector;
