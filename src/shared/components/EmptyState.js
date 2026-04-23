import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import StyledText from './StyledText';

const EmptyState = ({ 
  icon = "package", 
  title = "Nothing here yet", 
  subtitle = "Check back later or try a different action.",
  ctaText,
  onPress
}) => {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={styles.iconCircle} importantForAccessibility="no-hide-descendants">
        <Feather name={icon} size={48} color={theme.COLORS.primary} />
      </View>
      <StyledText variant="sectionHeader" bold color={theme.COLORS.textPrimary} style={styles.title} accessibilityRole="header">
        {title}
      </StyledText>
      <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={styles.subtitle}>
        {subtitle}
      </StyledText>
      
      {ctaText && onPress && (
        <TouchableOpacity 
          style={styles.button} 
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={ctaText}
        >
          <StyledText variant="button" color={theme.COLORS.white}>{ctaText}</StyledText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  button: {
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.BORDER_RADIUS.lg,
    ...theme.SHADOWS.medium,
  },
});

export default EmptyState;
