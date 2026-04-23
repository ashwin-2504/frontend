import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

/**
 * A reusable typography component that enforces the design system's strict typography scale.
 * Supports variants: display, screenTitle, sectionHeader, bodyPrimary, bodySecondary, label, caption, button
 */
const StyledText = ({ 
  children, 
  variant = 'bodyPrimary', 
  color = theme.COLORS.textPrimary,
  style,
  align = 'left',
  bold,
  numberOfLines,
  ...props 
}) => {
  const variantStyle = theme.TYPOGRAPHY[variant] || theme.TYPOGRAPHY.bodyPrimary;
  
  const textStyle = [
    styles.base,
    variantStyle,
    { color, textAlign: align },
    bold && { fontWeight: '700' }, // Override for specific cases
    style,
  ];

  return (
    <Text 
      style={textStyle} 
      allowFontScaling={true} // Strict accessibility requirement
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System', // Using system default as per user request
  },
});

export default StyledText;
