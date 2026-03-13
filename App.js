import React from "react";
import { Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/shared/navigation/AppNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CartProvider } from "./src/shared/context/CartContext";
import { AuthProvider } from "./src/shared/context/AuthContext";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = true;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = true;

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
