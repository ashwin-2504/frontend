import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import { useAuth } from "../../shared/context/AuthContext";
import apiService from "../../shared/services/apiService";
import OrderItem from "../../seller/components/OrderItem";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";
import EmptyState from "../../shared/components/EmptyState";



const ACTIVE_STATUSES = new Set(["PENDING", "PLACED", "CONFIRMED", "SHIPPED"]);

const BuyerActiveOrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.has(order.status));

  const fetchOrders = async () => {
    if (!user?.id) {
      const message = "Please sign in again to load your active orders.";
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
    } catch (error) {
      const message = "Could not load active orders. Please try again.";
      setErrorMessage(message);
      announceMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchOrders();
      }
    }, [user?.id])
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Active Orders" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <ErrorBanner message={errorMessage} />
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.COLORS.primary} />
          </View>
        ) : activeOrders.length === 0 ? (
          <EmptyState 
            icon="truck"
            title="No Active Orders"
            subtitle="You don't have any active orders right now. Check your past purchases or shop for new items!"
            ctaText="Go to Marketplace"
            onPress={() => navigation.navigate("Marketplace")}
          />
        ) : (

          <FlatList
            data={activeOrders}
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

export default BuyerActiveOrdersScreen;
