import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import StyledText from "../components/StyledText";
import RoleSelector from "../components/RoleSelector";
import CustomInput from "../components/CustomInput";
import ErrorBanner from "../components/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import { BottomNextBar } from "../components/ScreenActions";

const LoginScreen = ({ navigation }) => {
  const [role, setRole] = useState("seller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();

  useEffect(() => {
    if (user?.role) {
      if (user.role === "seller" || user.role === "customer") {
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      }
      setRole(user.role);
    }
  }, [user?.role]);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setErrorMessage("");
    setLoading(true);
    try {
      const profile = await login(email, password, role);
      if (profile?.role === "seller" || profile?.role === "customer") {
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to sign in. Please check your credentials.");
      console.error(error);
    } finally {
      setLoading(false);
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
              <Feather name="globe" size={32} color={theme.COLORS.white} />
            </View>
            <StyledText variant="display" color={theme.COLORS.primary} bold style={{ textAlign: "center" }}>
              BharatMandi
            </StyledText>
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={{ marginTop: 4 }}>
              Empowering India's Agriculture
            </StyledText>
          </View>

          {/* Login card */}
          <View style={[styles.card, theme.SHADOWS.strong]}>
            <StyledText variant="screenTitle" bold style={{ textAlign: "center", marginBottom: 4 }}>
              Get Started
            </StyledText>
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={{ textAlign: "center", marginBottom: 24 }}>
              Choose your role and sign in
            </StyledText>

            <ErrorBanner message={errorMessage} />

            <RoleSelector
              selectedRole={user?.role || role}
              onRoleChange={setRole}
              disabled={!!user?.role}
            />
            {!!user?.role && (
              <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ textAlign: "center", marginBottom: 12 }}>
                Account role locked to {user.role}
              </StyledText>
            )}

            <CustomInput 
              label="Email" 
              placeholder="your@email.com" 
              keyboardType="email-address" 
              value={email}
              onChangeText={setEmail}
              accessibilityHint="Enter your email"
            />
            <CustomInput 
              label="Password" 
              placeholder="........" 
              secureTextEntry 
              value={password}
              onChangeText={setPassword}
              accessibilityHint="Enter your password"
            />

            <View style={styles.footer}>
              <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>New here? </StyledText>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                accessibilityHint="Open registration screen"
                style={{ padding: 4 }}
              >
                <StyledText variant="bodySecondary" bold color={theme.COLORS.primary}>Create Account</StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <BottomNextBar
          label={loading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          disabled={loading}
          loading={loading}
          icon="log-in"
          accessibilityHint="Signs you in and opens your dashboard"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.SPACING.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.SPACING.xl,
  },
  brandCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...theme.SHADOWS.strong,
  },
  card: {
    backgroundColor: theme.COLORS.white,
    padding: 24,
    borderRadius: theme.BORDER_RADIUS.xl,
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    minHeight: 44, // Touch target
  },
});

export default LoginScreen;
