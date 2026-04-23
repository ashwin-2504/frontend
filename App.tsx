import React from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/shared/navigation/AppNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CartProvider } from "./src/shared/context/CartContext";
import { AuthProvider, useAuth } from "./src/shared/context/AuthContext";
import { COLORS } from "./src/shared/theme/theme";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = true;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = true;

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const AppShell = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const initialRouteName = user ? "Main" : "Login";

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <AppNavigator initialRouteName={initialRouteName} />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});
