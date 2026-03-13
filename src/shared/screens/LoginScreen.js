import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from "../theme/theme";
import RoleSelector from "../components/RoleSelector";
import { useAuth } from "../context/AuthContext";
import { BottomNextBar } from "../components/ScreenActions";

const LoginScreen = ({ navigation }) => {
  const [role, setRole] = useState("Farmer");
  const { login } = useAuth();

  const handleLogin = () => {
    login(role);
    if (role === "Farmer") {
      navigation.reset({ index: 0, routes: [{ name: "SellerDashboard" }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: "BuyerDashboard" }] });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.header}>
            <View style={styles.brandCircle}>
              <Feather name="globe" size={36} color={COLORS.white} />
            </View>
            <Text allowFontScaling={true} style={styles.title}>BharatMandi</Text>
            <Text allowFontScaling={true} style={styles.subtitle}>Empowering India's Agriculture</Text>
          </View>

          {/* Login card */}
          <View style={[styles.card, SHADOWS.strong]}>
            <Text allowFontScaling={true} style={styles.cardTitle}>Get Started</Text>
            <Text allowFontScaling={true} style={styles.instruction}>
              Choose your role to continue
            </Text>

            <RoleSelector selectedRole={role} onRoleChange={setRole} />

            <View style={styles.footer}>
              <Text allowFontScaling={true} style={styles.footerText}>New here? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                accessibilityHint="Open registration screen"
              >
                <Text allowFontScaling={true} style={styles.link}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <BottomNextBar
          label="Next: Open Dashboard"
          onPress={handleLogin}
          accessibilityHint="Signs you in and opens your dashboard"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  brandCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    ...SHADOWS.strong,
  },
  title: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.heavy,
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    width: "100%",
  },
  cardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  instruction: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  link: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },
});

export default LoginScreen;

