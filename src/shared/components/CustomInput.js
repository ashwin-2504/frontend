import React from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../theme/theme";

const CustomInput = ({
  label,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  style,
  accessibilityHint,
  ...props
}) => {
  return (
    <View style={[styles.container, style]} accessible={true}>
      {label && (
        <Text allowFontScaling={true} style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        accessibilityLabel={label || placeholder}
        accessibilityHint={accessibilityHint}
        allowFontScaling={true}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 52,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});

export default CustomInput;
