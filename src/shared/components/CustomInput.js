import React, { useState, useRef } from "react";
import { View, TextInput, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import StyledText from "./StyledText";
import { theme } from "../theme/theme";

const CustomInput = ({
  label,
  placeholder,
  icon,
  prefix,
  suffix,
  value,
  onChangeText,
  style,
  inputStyle,
  accessibilityHint,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderOpacity = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={[styles.container, style]} accessible={true}>
      {label && (
        <StyledText 
          variant="label" 
          color={isFocused ? theme.COLORS.primary : theme.COLORS.textSecondary}
          style={styles.label}
        >
          {label}
        </StyledText>
      )}
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputWrapperFocused,
        props.multiline && { height: "auto", minHeight: 100, alignItems: 'flex-start', paddingTop: 14 }
      ]}>
        {icon && (
          <Feather 
            name={icon} 
            size={18} 
            color={isFocused ? theme.COLORS.primary : theme.COLORS.textSecondary} 
            style={styles.icon} 
          />
        )}
        
        {prefix && (
          <StyledText 
            variant="bodyPrimary" 
            color={isFocused ? theme.COLORS.primary : theme.COLORS.textSecondary}
            style={styles.prefixSuffix}
            bold
          >
            {prefix}
          </StyledText>
        )}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.COLORS.textSecondary + 'BB'} // Increased contrast for better accessibility
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, inputStyle, props.multiline && { textAlignVertical: 'top' }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label || placeholder}
          accessibilityHint={accessibilityHint}
          allowFontScaling={true}
          {...props}
        />

        {suffix && (
          <StyledText 
            variant="bodyPrimary" 
            color={isFocused ? theme.COLORS.primary : theme.COLORS.textSecondary}
            style={styles.prefixSuffix}
            bold
          >
            {suffix}
          </StyledText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20, // Vertical spacing rule: 8-12dp between blocks, but including label/input combo
  },
  label: {
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
    borderWidth: 1.5,
    borderColor: theme.COLORS.border,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: 16,
    height: 56, // Touch target >= 44
  },
  inputWrapperFocused: {
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primaryLight + '20',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    ...theme.TYPOGRAPHY.bodyPrimary,
    color: theme.COLORS.textPrimary,
  },
  prefixSuffix: {
    marginHorizontal: 4,
  },
});

export default CustomInput;
