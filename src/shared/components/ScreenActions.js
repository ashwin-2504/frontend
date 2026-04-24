import React from "react";
import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import StyledText from "./StyledText";
import { theme } from "../theme/theme";

export const TopBar = ({ title, onBack, showBack, backLabel = "Back", backHint = "Go to previous screen", rightNode }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    }
  };

  const hasBack = Boolean(onBack || showBack);

  return (
    <View style={styles.header}>
      {hasBack ? (
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          accessibilityHint={backHint}
        >
          <Feather name="chevron-left" size={28} color={theme.COLORS.primary} />
          <StyledText variant="button" color={theme.COLORS.primary} bold>
            Back
          </StyledText>
        </Pressable>
      ) : (
        <View style={styles.backButtonSpacer} />
      )}
      <StyledText variant="screenTitle" style={styles.headerTitle} accessibilityRole="header" bold>
        {title}
      </StyledText>
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
  loading = false,
}) => {
  return (
    <View style={styles.footer}>
      <Pressable
        style={[styles.nextButton, (disabled || loading) && styles.disabled]}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint || "Move to next step"}
      >
        {loading ? (
          <ActivityIndicator color={theme.COLORS.white} />
        ) : (
          <>
            <StyledText variant="button" color={theme.COLORS.white} style={styles.nextText}>
              {label}
            </StyledText>
            <Feather name={icon} size={20} color={theme.COLORS.white} />
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
    ...theme.SHADOWS.light,
  },
  backButton: {
    minWidth: 80,
    minHeight: 44, // Touch target
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonSpacer: {
    minWidth: 80,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  rightSlot: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  footer: {
    padding: 16,
    backgroundColor: theme.COLORS.white,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
    ...theme.SHADOWS.medium,
  },
  nextButton: {
    minHeight: 52, // Touch target
    borderRadius: theme.BORDER_RADIUS.md,
    backgroundColor: theme.COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  nextText: {
    marginRight: 4,
  },
  disabled: {
    opacity: 0.5,
  },
});
