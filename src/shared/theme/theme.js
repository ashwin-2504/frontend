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
  PENDING:   { bg: "#FFF3E0", text: "#e60000", icon: "clock" },
  SHIPPED:   { bg: "#E3F2FD", text: "#15ff00", icon: "truck" },
  DELIVERED: { bg: "#E8F5E9", text: "#2E7D32", icon: "check-circle" },
  CANCELLED: { bg: "#FFEBEE", text: "#C62828", icon: "x-circle" },
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 34,
};

export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
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
