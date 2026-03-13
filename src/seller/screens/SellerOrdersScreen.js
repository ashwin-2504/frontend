import React, { useState, useCallback } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS } from "../../shared/theme/theme";
import OrderItem from "../components/OrderItem";
import apiService from "../../shared/services/apiService";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../shared/context/AuthContext";
import { TopBar } from "../../shared/components/ScreenActions";
import { announceMessage } from "../../shared/utils/accessibility";

const SellerOrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const sellerId = user?.id || "seller_123";
      const data = await apiService.getSellerOrders(sellerId);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch seller orders:", error);
      announceMessage("Could not load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Feather name="shopping-bag" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>You don't have any orders yet.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
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
      <TopBar title="All Orders" onBack={() => navigation.goBack()} />

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, ...SHADOWS.light, zIndex: 10
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  backButton: { padding: SPACING.xs },
  listContent: { padding: SPACING.lg },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: "center" }
});

export default SellerOrdersScreen;
