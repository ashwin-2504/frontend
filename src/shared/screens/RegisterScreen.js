import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme/theme";
import StyledText from "../components/StyledText";
import CustomInput from "../components/CustomInput";
import RoleSelector from "../components/RoleSelector";
import { useAuth } from "../context/AuthContext";
import { BottomNextBar, TopBar } from "../components/ScreenActions";
import ErrorBanner from "../components/ErrorBanner";
import { announceMessage } from "../utils/accessibility";

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState("seller");
  const { register } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    pincode: "",
    password: "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.addressLine || !formData.pincode) {
      const message = "Please fill all required fields, including street address and pincode.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }

    if (formData.pincode.length !== 6) {
      const message = "Pincode must be exactly 6 digits.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }

    if (formData.password.length < 6) {
      const message = "Password must be at least 6 characters long.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }

    setErrorMessage("");
    setLoading(true);
    try {
      console.log("Registering as", role, formData.email);
      const addressData = {
        addressLine: formData.addressLine,
        city: formData.city,
        pincode: formData.pincode
      };
      await register(formData.email, formData.password, role, formData.fullName, formData.phone, addressData);
      
      if (role === "seller" || role === "customer") {
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create account.");
      console.error(error);
    } finally {
      setLoading(false);
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
          <View style={[styles.card, theme.SHADOWS.medium]}>
            <StyledText variant="screenTitle" bold style={{ textAlign: "center", marginBottom: 4 }}>
              Create Account
            </StyledText>
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={{ textAlign: "center", marginBottom: 16 }}>
              Join India&apos;s largest farming community
            </StyledText>
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
              label="Street Address / Village" 
              placeholder="e.g. 123 Farm Road or Village Name" 
              value={formData.addressLine}
              onChangeText={(text) => handleInputChange("addressLine", text)}
              accessibilityHint="Enter your street level address"
            />
            <View style={{ flexDirection: 'row', gap: theme.SPACING.md }}>
              <CustomInput 
                label="City" 
                placeholder="City" 
                style={{ flex: 1 }}
                value={formData.city}
                onChangeText={(text) => handleInputChange("city", text)}
              />
              <CustomInput 
                label="Pincode" 
                placeholder="400001" 
                keyboardType="numeric"
                maxLength={6}
                style={{ flex: 1 }}
                value={formData.pincode}
                onChangeText={(text) => handleInputChange("pincode", text)}
              />
            </View>
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
              <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>
                Already have an account? <StyledText bold color={theme.COLORS.primary}>Login</StyledText>
              </StyledText>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNextBar
          label={loading ? "Creating Account..." : "Create Account"}
          onPress={handleRegister}
          disabled={loading}
          loading={loading}
          icon="user-plus"
          accessibilityHint="Creates account and opens your dashboard"
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
    padding: theme.SPACING.md,
    paddingVertical: theme.SPACING.lg,
  },
  card: {
    backgroundColor: theme.COLORS.white,
    padding: 24,
    borderRadius: theme.BORDER_RADIUS.xl,
    width: "100%",
  },
  linkButton: {
    marginTop: 24,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
});

export default RegisterScreen;
