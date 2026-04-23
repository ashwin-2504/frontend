import React, { useRef } from "react";
import { View, Pressable, StyleSheet, Animated, ActivityIndicator } from "react-native";
import StyledText from "./StyledText";
import { theme } from "../theme/theme";

/**
 * PrimaryButton with variant support and press scale animation.
 *
 * Variants: "solid" (default), "outline", "destructive", "ghost"
 */
const PrimaryButton = ({
  title,
  onPress,
  style,
  variant = "solid",
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const variantStyles = {
    solid: {
      button: { backgroundColor: theme.COLORS.primary },
      text: theme.COLORS.white,
      loader: theme.COLORS.white,
    },
    outline: {
      button: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: theme.COLORS.primary },
      text: theme.COLORS.primary,
      loader: theme.COLORS.primary,
    },
    destructive: {
      button: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: theme.COLORS.error },
      text: theme.COLORS.error,
      loader: theme.COLORS.error,
    },
    ghost: {
      button: { backgroundColor: "transparent" },
      text: theme.COLORS.primary,
      loader: theme.COLORS.primary,
    },
  };

  const v = variantStyles[variant] || variantStyles.solid;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.button,
          v.button,
          variant === "solid" && theme.SHADOWS.medium,
          (disabled || loading) && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        <View style={styles.innerContent} accessible={true}>
          {loading ? (
            <ActivityIndicator size="small" color={v.loader} />
          ) : (
            <>
              {icon && <View style={{ marginRight: theme.SPACING.sm }}>{icon}</View>}
              <StyledText 
                variant="button" 
                color={v.text}
              >
                {title}
              </StyledText>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48, // Ensuring >= 44dp
    paddingVertical: 14, // 12-16dp
    paddingHorizontal: 18, // 16-20dp
    borderRadius: theme.BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  innerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default PrimaryButton;
