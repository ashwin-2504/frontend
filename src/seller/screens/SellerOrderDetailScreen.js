import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import apiService from "../../shared/services/apiService";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";
import { formatDate } from '../../shared/utils/formatters';

const STATUS_CHOICES = ["PENDING", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const SellerOrderDetailScreen = ({ route, navigation }) => {
  const { order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === order.status) return;

    Alert.alert(
      "Update Order Status",
      `Are you sure you want to change the status to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              setLoading(true);
              const updatedOrder = await apiService.updateOrderStatus(order.orderId, newStatus);
              setOrder({ ...order, status: updatedOrder.status || newStatus });
              setErrorMessage("");
              announceMessage(`Order status changed to ${newStatus}`);
              Alert.alert("Success", "Order status updated successfully!");
            } catch (error) {
              console.error("Failed to update status", error);
              const message = "Could not update order status. Please retry.";
              setErrorMessage(message);
              announceMessage(message);
              Alert.alert("Error", "Could not update order status.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    const sc = theme.STATUS_COLORS[status];
    return sc ? sc.text : theme.COLORS.textSecondary;
  };

  const getStatusBg = (status) => {
    const sc = theme.STATUS_COLORS[status];
    return sc ? sc.bg : theme.COLORS.background;
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Order Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ErrorBanner message={errorMessage} />
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <StyledText variant="bodyPrimary" bold>Order #{order.orderId?.substring(0, 8)}</StyledText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
              <StyledText variant="caption" bold style={{ color: getStatusColor(order.status) }}>{order.status}</StyledText>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Feather name="calendar" size={16} color={theme.COLORS.textSecondary} />
            <StyledText variant="bodySecondary" style={{ marginLeft: 8 }}>
              {formatDate(order.createdAt)}
            </StyledText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="user" size={16} color={theme.COLORS.textSecondary} />
            <StyledText variant="bodySecondary" style={{ marginLeft: 8 }}>{order.buyerName || "Unknown Customer"}</StyledText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="dollar-sign" size={16} color={theme.COLORS.textSecondary} />
            <StyledText variant="bodyPrimary" bold style={{ marginLeft: 8 }}>₹{order.sellerTotal}</StyledText>
          </View>
        </View>

        <StyledText variant="sectionHeader" bold style={{ marginBottom: theme.SPACING.md }}>Update Status</StyledText>
        <View style={styles.statusActions}>
          {STATUS_CHOICES.map((status) => (
            <TouchableOpacity 
              key={status}
              style={[
                styles.statusButton, 
                order.status === status && styles.statusButtonActive,
                { borderColor: getStatusColor(status) }
              ]}
              onPress={() => handleStatusUpdate(status)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={`Mark as ${status}`}
              accessibilityHint="Updates order status"
            >
              {loading && order.status !== status ? (
                <View style={styles.loadingPlaceholder} />
              ) : (
                <StyledText 
                  variant="button" 
                  small
                  color={order.status === status ? theme.COLORS.white : getStatusColor(status)}
                >
                  {status}
                </StyledText>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {loading && <ActivityIndicator style={{ marginTop: theme.SPACING.md }} color={theme.COLORS.primary} />}

        <View style={styles.itemsSection}>
           <StyledText variant="sectionHeader" bold style={{ marginBottom: theme.SPACING.md }}>Order Items</StyledText>
           <View style={styles.card}>
             {order.items && order.items.map((item, index) => (
                <View key={item.productId || index} style={[styles.itemRow, index < order.items.length - 1 && styles.itemBorder]}>
                  <View style={{ flex: 1 }}>
                    <StyledText variant="bodyPrimary" bold>{item.productSnapshot?.name || "Product"}</StyledText>
                    <StyledText variant="caption" color={theme.COLORS.textSecondary}>Qty: {item.qty} × ₹{item.priceAtPurchase}</StyledText>
                  </View>
                  <StyledText variant="bodyPrimary" bold>₹{item.qty * item.priceAtPurchase}</StyledText>
                </View>
             ))}
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.background },
  scrollContent: { padding: theme.SPACING.lg },
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.lg,
    ...theme.SHADOWS.medium,
    marginBottom: theme.SPACING.lg,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
    paddingBottom: theme.SPACING.md,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: theme.SPACING.sm },
  statusActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statusButton: {
    width: "48%",
    paddingVertical: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.SPACING.md,
    backgroundColor: theme.COLORS.white,
  },
  statusButtonActive: {
    backgroundColor: theme.COLORS.textPrimary,
    borderColor: theme.COLORS.textPrimary,
  },
  loadingPlaceholder: { height: 16 },
  itemsSection: { marginTop: theme.SPACING.md },
  itemRow: { flexDirection: "row", paddingVertical: 12, alignItems: "center" },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: theme.COLORS.border },
});

export default SellerOrderDetailScreen;
