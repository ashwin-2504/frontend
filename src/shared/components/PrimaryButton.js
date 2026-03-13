import React, { useRef } from "react";
import { Pressable, Text, StyleSheet, Animated, View } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONT_WEIGHTS } from "../theme/theme";

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
  icon,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
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
      button: { backgroundColor: COLORS.primary },
      text: { color: COLORS.white },
    },
    outline: {
      button: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: COLORS.primary },
      text: { color: COLORS.primary },
    },
    destructive: {
      button: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: COLORS.error },
      text: { color: COLORS.error },
    },
    ghost: {
      button: { backgroundColor: "transparent" },
      text: { color: COLORS.primary },
    },
  };

  const v = variantStyles[variant] || variantStyles.solid;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.button,
          v.button,
          variant === "solid" && SHADOWS.medium,
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
      >
        <View style={styles.innerContent} accessible={true}>
          {icon && icon}
          <Text allowFontScaling={true} style={[styles.text, v.text, icon && { marginLeft: SPACING.sm }]}>
            {title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
  },
  innerContent: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default PrimaryButton;
