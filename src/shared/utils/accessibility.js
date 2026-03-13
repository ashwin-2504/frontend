import { AccessibilityInfo, Platform } from "react-native";

export const announceMessage = (message) => {
  if (!message) {
    return;
  }
  AccessibilityInfo.announceForAccessibility(message);
};

export const getLiveRegion = () => {
  return Platform.OS === "android" ? "assertive" : "none";
};

