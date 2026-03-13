import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BORDER_RADIUS, COLORS, FONT_WEIGHTS, SPACING } from "../theme/theme";
import { getLiveRegion } from "../utils/accessibility";

const ErrorBanner = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion={getLiveRegion()}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Feather name="alert-triangle" size={20} color={COLORS.error} />
      <Text allowFontScaling={true} style={styles.text}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.error,
    backgroundColor: "#FDECEA",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  text: {
    flex: 1,
    color: "#7A1E1E",
    fontWeight: FONT_WEIGHTS.semibold,
  },
});

export default ErrorBanner;

