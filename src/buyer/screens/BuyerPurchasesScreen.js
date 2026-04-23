import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../../shared/theme/theme";
import { useAuth } from "../../shared/context/AuthContext";
import apiService from "../../shared/services/apiService";
import OrderItem from "../../seller/components/OrderItem";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";
import EmptyState from "../../shared/components/EmptyState";
import { isSessionAuthError } from "../../shared/utils/authErrors";



const BuyerPurchasesScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      const message = "Please sign in again to load your purchases.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }

    setLoading(true);
    try {
      const buyerId = user.id;
      const data = await apiService.getBuyerOrders(buyerId);
      setOrders(Array.isArray(data) ? data : []);
      setErrorMessage("");
    } catch (_error) {
      const isAuthErr = isSessionAuthError(_error) || String(_error?.message || _error).includes("Sign in again");
      if (isAuthErr) {
        const message = "Your session expired. Signing you out.";
        setErrorMessage(message);
        announceMessage(message);
        await logout().catch(() => null);
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }
      const message = "Could not load purchases. Please try again.";
      setErrorMessage(message);
      announceMessage(message);
    } finally {
      setLoading(false);
    }
    }, [user?.id, logout, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchOrders();
      }
    }, [fetchOrders, user?.id])
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Total Purchases" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <ErrorBanner message={errorMessage} />
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.COLORS.primary} />
          </View>
        ) : orders.length === 0 ? (
          <EmptyState 
            icon="shopping-bag" 
            title="No Purchases Yet"
            subtitle="You haven't made any purchases. Explore the marketplace to find fresh products!"
            ctaText="Go to Marketplace"
            onPress={() => navigation.navigate("Marketplace")}
          />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.orderId}
            renderItem={({ item }) => (
              <OrderItem
                order={item}
                onPress={() => navigation.navigate("BuyerOrderDetail", { order: item })}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  content: {
    flex: 1,
    padding: theme.SPACING.lg,
  },
  listContent: {
    paddingBottom: theme.SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.SPACING.xl,
  },
  emptyText: {
    marginTop: theme.SPACING.md,
  },
});

export default BuyerPurchasesScreen;
