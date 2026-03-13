import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING } from "../../shared/theme/theme";
import { useAuth } from "../../shared/context/AuthContext";
import apiService from "../../shared/services/apiService";
import OrderItem from "../../seller/components/OrderItem";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";

const ACTIVE_STATUSES = new Set(["PENDING", "SHIPPED"]);

const BuyerActiveOrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.has(order.status));

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const buyerId = user?.id || "buyer_default";
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
      fetchOrders();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Active Orders" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <ErrorBanner message={errorMessage} />
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={styles.centerContainer}>
            <Feather name="truck" size={52} color={COLORS.border} />
            <Text allowFontScaling={true} style={styles.emptyText}>No active orders right now.</Text>
          </View>
        ) : (
          <FlatList
            data={activeOrders}
            keyExtractor={(item) => item.id}
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
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  listContent: {
    paddingBottom: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
});

export default BuyerActiveOrdersScreen;
