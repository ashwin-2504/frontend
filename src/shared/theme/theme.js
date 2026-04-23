import { ms } from '../utils/responsive';

export const COLORS = {
  primary: "#1F6B4A",
  primaryLight: "#E5F3EC",
  primaryDark: "#144731",
  secondary: "#5EA889",
  background: "#F3F6F4",
  surface: "#EAF1ED",
  white: "#FFFFFF",
  textPrimary: "#1A1F1C",
  textSecondary: "#4E5B55",
  border: "#D3DED7",
  error: "#B3261E",
  success: "#2E7D32",
  warning: "#A86500",
  accent: "#C98A18",
  info: "#1C6EB6",
};

export const STATUS_COLORS = {
  PENDING:   { bg: "#FFF4E5", text: "#FF8C00", icon: "clock" },

  CONFIRMED: { bg: "#E3F2FD", text: "#1976D2", icon: "check-circle" },
  SHIPPED:   { bg: "#E3F2FD", text: "#1976D2", icon: "truck" },

  DELIVERED: { bg: "#E8F5E9", text: "#2E7D32", icon: "package" },

  CANCELLED: { bg: "#FFEBEE", text: "#C62828", icon: "x-circle" },
};

export const FONT_SIZES = {
  caption: ms(14),
  bodySecondary: ms(16),
  bodyPrimary: ms(18),
  button: ms(18),
  sectionHeader: ms(22),
  screenTitle: ms(26),
  display: ms(32),
};

export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export const LINE_HEIGHTS = {
  caption: ms(18),
  bodySecondary: ms(22),
  bodyPrimary: ms(24),
  button: ms(22),
  sectionHeader: ms(28),
  screenTitle: ms(32),
  display: ms(38),
};

export const TYPOGRAPHY = {
  display: {
    fontSize: FONT_SIZES.display,
    lineHeight: LINE_HEIGHTS.display,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  screenTitle: {
    fontSize: FONT_SIZES.screenTitle,
    lineHeight: LINE_HEIGHTS.screenTitle,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  sectionHeader: {
    fontSize: FONT_SIZES.sectionHeader,
    lineHeight: LINE_HEIGHTS.sectionHeader,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  bodyPrimary: {
    fontSize: FONT_SIZES.bodyPrimary,
    lineHeight: LINE_HEIGHTS.bodyPrimary,
    fontWeight: FONT_WEIGHTS.regular,
  },
  bodySecondary: {
    fontSize: FONT_SIZES.bodySecondary,
    lineHeight: LINE_HEIGHTS.bodySecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },
  label: {
    fontSize: FONT_SIZES.bodySecondary,
    lineHeight: LINE_HEIGHTS.bodySecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  caption: {
    fontSize: FONT_SIZES.caption,
    lineHeight: LINE_HEIGHTS.caption,
    fontWeight: FONT_WEIGHTS.regular,
  },
  button: {
    fontSize: FONT_SIZES.button,
    lineHeight: LINE_HEIGHTS.button,
    fontWeight: FONT_WEIGHTS.medium,
  },
};

export const SPACING = {
  xs: ms(4),
  sm: ms(8),
  md: ms(16),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(48),
};

export const BORDER_RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  full: 999,
};

export const SHADOWS = {
  light: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  strong: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
export const theme = {
  COLORS,
  STATUS_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
};

export default theme;
