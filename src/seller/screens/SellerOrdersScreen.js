import React, { useState, useCallback } from "react";
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import OrderItem from "../components/OrderItem";
import apiService from "../../shared/services/apiService";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../shared/context/AuthContext";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";

const SellerOrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchOrders();
      }
    }, [user?.id])
  );

  const fetchOrders = async () => {
    if (!user?.id || user?.role !== "seller") {
      const message = "Please sign in as a farmer to view seller orders.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }

    try {
      setLoading(true);
      const sellerId = user.id;
      const data = await apiService.getSellerOrders(sellerId);
      setOrders(data);
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to fetch seller orders:", error);
      const message = (error?.message || "Could not load orders. Please try again.")
        .replace(/^\[[^\]]+\]\s*/, "");
      setErrorMessage(message);
      announceMessage("Could not load orders. Use retry to try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centerContainer}>
          <Feather name="wifi-off" size={48} color={theme.COLORS.border} />
          <ErrorBanner message={errorMessage} />
          <StyledText variant="bodySecondary" center style={{ marginBottom: theme.SPACING.lg }}>Pull down to refresh or tap retry.</StyledText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrders}
            accessibilityRole="button"
            accessibilityLabel="Retry loading orders"
            accessibilityHint="Attempts to fetch your orders again"
          >
            <StyledText variant="button" color={theme.COLORS.white}>Retry</StyledText>
          </TouchableOpacity>
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Feather name="shopping-bag" size={48} color={theme.COLORS.border} />
          <StyledText variant="bodyPrimary" center style={{ marginTop: theme.SPACING.md }}>You don't have any orders yet.</StyledText>
        </View>
      );
    }

    return (
      <FlatList
        data={orders}
        keyExtractor={item => item.orderId}
        renderItem={({ item }) => (
          <OrderItem 
            order={item}
            onPress={() => navigation.navigate("SellerOrderDetail", { order: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="All Orders" />

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.background },
  listContent: { padding: theme.SPACING.lg },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.SPACING.xl },
  retryButton: {
    marginTop: theme.SPACING.lg,
    paddingHorizontal: theme.SPACING.lg,
    paddingVertical: theme.SPACING.md,
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
  },
});

export default SellerOrdersScreen;
