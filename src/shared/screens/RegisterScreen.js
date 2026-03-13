import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from "../theme/theme";
import CustomInput from "../components/CustomInput";
import RoleSelector from "../components/RoleSelector";
import { useAuth } from "../context/AuthContext";
import { BottomNextBar, TopBar } from "../components/ScreenActions";
import ErrorBanner from "../components/ErrorBanner";
import { announceMessage } from "../utils/accessibility";

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState("Farmer");
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = () => {
    if (!formData.fullName || !formData.phone || !formData.password) {
      const message = "Please fill your name, phone number, and password before continuing.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }
    setErrorMessage("");
    console.log("Registering as", role, formData);
    login(role);
    if (role === "Farmer") {
      navigation.reset({ index: 0, routes: [{ name: "SellerDashboard" }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: "BuyerDashboard" }] });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Create Account"
        onBack={() => navigation.goBack()}
        backHint="Go back to sign in"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, SHADOWS.medium]}>
            <Text allowFontScaling={true} style={styles.cardTitle}>Create Account</Text>
            <Text allowFontScaling={true} style={styles.instruction}>Join India's largest farming community</Text>
            <ErrorBanner message={errorMessage} />

            <RoleSelector selectedRole={role} onRoleChange={setRole} />

            <CustomInput 
              label="Full Name" 
              placeholder="Enter your full name" 
              value={formData.fullName}
              onChangeText={(text) => handleInputChange("fullName", text)}
              accessibilityHint="Enter your full legal name"
            />
            <CustomInput 
              label="Email" 
              placeholder="your@email.com" 
              keyboardType="email-address" 
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              accessibilityHint="Enter your email if available"
            />
            <CustomInput 
              label="Phone" 
              placeholder="9876543210" 
              keyboardType="phone-pad" 
              value={formData.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              accessibilityHint="Enter your 10-digit phone number"
            />
            <CustomInput 
              label="Address" 
              placeholder="Your location" 
              multiline 
              value={formData.address}
              onChangeText={(text) => handleInputChange("address", text)}
              accessibilityHint="Enter your village or address"
            />
            <CustomInput 
              label="Password" 
              placeholder="........" 
              secureTextEntry 
              value={formData.password}
              onChangeText={(text) => handleInputChange("password", text)}
              accessibilityHint="Create a password to secure your account"
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Login")}
              style={styles.linkButton}
              accessibilityRole="button"
              accessibilityLabel="Go to login"
              accessibilityHint="Return to sign in screen"
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNextBar
          label="Next: Create Account"
          onPress={handleRegister}
          accessibilityHint="Creates account and opens your dashboard"
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
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    width: "100%",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  button: {
    marginTop: SPACING.lg,
  },
  linkButton: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default RegisterScreen;
