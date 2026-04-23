import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import StyledText from "./StyledText";
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
      <Feather name="alert-triangle" size={20} color={theme.COLORS.error} />
      <StyledText allowFontScaling={true} style={styles.text} color="#7A1E1E" semiBold>
        {message}
      </StyledText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.COLORS.error,
    backgroundColor: "#FDECEA",
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    gap: theme.SPACING.sm,
    marginBottom: theme.SPACING.md,
  },
  text: {
    flex: 1,
  },
});

export default ErrorBanner;

