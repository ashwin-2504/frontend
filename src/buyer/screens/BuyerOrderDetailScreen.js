import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import { formatDate } from "../../shared/utils/formatters";
import apiService from "../../shared/services/apiService";

import { TopBar } from "../../shared/components/ScreenActions";

const BuyerOrderDetailScreen = ({ route, navigation }) => {
  const { order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  const handleCancelOrder = async () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.cancelOrder(order.orderId);
              setOrder({ ...order, status: "CANCELLED" });
              Alert.alert("Cancelled", "Order has been cancelled successfully.");
            } catch {
              Alert.alert("Error", "Failed to cancel order. Please try again.");
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

  const orderItems = Array.isArray(order.items) ? order.items : [];

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Order Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order summary card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <StyledText allowFontScaling={true} style={styles.orderId} bold>
              Order #{order.orderId?.substring(0, 8)}
            </StyledText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBg(order.status) },
              ]}
            >
              <StyledText
                allowFontScaling={true}
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
                bold
                variant="caption"
              >
                {order.status}
              </StyledText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Feather
              name="calendar"
              size={16}
              color={theme.COLORS.textSecondary}
            />
            <StyledText
              style={styles.detailText}
              color={theme.COLORS.textSecondary}
            >
              {formatDate(order.createdAt)}
            </StyledText>
          </View>

          <View style={styles.detailRow}>
            <Feather
              name="dollar-sign"
              size={16}
              color={theme.COLORS.textSecondary}
            />
            <StyledText style={styles.detailTextBold} bold>
              ₹{order.totalAmount}
            </StyledText>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name="credit-card"
              size={16}
              color={theme.COLORS.textSecondary}
            />
            <StyledText
              style={styles.detailText}
              color={theme.COLORS.textSecondary}
            >
              Cash on Delivery
            </StyledText>
          </View>
        </View>

        {/* Items list */}
        {orderItems.length > 0 && (
          <>
            <StyledText
              allowFontScaling={true}
              style={styles.sectionTitle}
              bold
            >
              Items
            </StyledText>
            <View style={styles.card}>
              {orderItems.map((item, index) => (
                <View
                  key={item.productId || index}
                  style={[
                    styles.itemRow,
                    index < orderItems.length - 1 && styles.itemBorder,
                  ]}
                >
                  <View style={styles.imageContainer}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Feather
                          name="box"
                          size={18}
                          color={theme.COLORS.primary}
                        />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <StyledText
                      allowFontScaling={true}
                      style={styles.itemName}
                      semiBold
                    >
                      {item.productSnapshot?.name || "Product"}
                    </StyledText>
                    <StyledText
                      allowFontScaling={true}
                      style={styles.itemMeta}
                      color={theme.COLORS.textSecondary}
                      variant="caption"
                    >
                      Qty: {item.qty || 1} × ₹{item.priceAtPurchase || 0}
                    </StyledText>
                  </View>
                  <StyledText
                    allowFontScaling={true}
                    style={styles.itemTotal}
                    bold
                    color={theme.COLORS.primary}
                  >
                    ₹{(item.priceAtPurchase || 0) * (item.qty || 1)}
                  </StyledText>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Status timeline (simple) */}
        <StyledText allowFontScaling={true} style={styles.sectionTitle} bold>
          Order Status
        </StyledText>
        <View style={styles.card}>
          <View
            style={[
              styles.timelineRow,
              { flexDirection: "row", alignItems: "center" },
            ]}
          >
            <View style={[styles.timelineDot, { backgroundColor: "#4CAF50" }]}>
              <Feather name="check" size={8} color="#fff" />
            </View>
            <StyledText allowFontScaling={true} style={styles.timelineText}>
              Order Placed
            </StyledText>
          </View>
          {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
            <View style={styles.timelineRow}>
              <View
                style={[styles.timelineDot, { backgroundColor: "#2196F3" }]}
              >
                <Feather name="truck" size={8} color="#fff" />
              </View>
              <StyledText allowFontScaling={true} style={styles.timelineText}>
                Shipped
              </StyledText>
            </View>
          )}
          {order.status === "DELIVERED" && (
            <View style={styles.timelineRow}>
              <View
                style={[styles.timelineDot, { backgroundColor: "#4CAF50" }]}
              >
                <Feather name="check-circle" size={8} color="#fff" />
              </View>
              <StyledText allowFontScaling={true} style={styles.timelineText}>
                Delivered
              </StyledText>
            </View>
          )}
          {order.status === "CANCELLED" && (
            <View style={styles.timelineRow}>
              <View
                style={[styles.timelineDot, { backgroundColor: "#F44336" }]}
              >
                <Feather name="x" size={8} color="#fff" />
              </View>
              <StyledText allowFontScaling={true} style={styles.timelineText}>
                Cancelled
              </StyledText>
            </View>
          )}
        </View>

        {/* Cancel Button */}
        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
           <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.COLORS.error} />
            ) : (
              <>
                <Feather name="x-circle" size={18} color={theme.COLORS.error} />
                <StyledText variant="button" color={theme.COLORS.error} style={{ marginLeft: 8 }}>
                  Cancel Order
                </StyledText>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.SPACING.lg,
    paddingVertical: theme.SPACING.md,
    backgroundColor: theme.COLORS.white,
    ...theme.SHADOWS.light,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  backButton: { padding: theme.SPACING.xs },
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
  orderId: { fontSize: 16, color: theme.COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: {},
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.SPACING.sm,
  },
  detailText: { marginLeft: 8 },
  detailTextBold: { marginLeft: 8 },
  sectionTitle: { marginBottom: theme.SPACING.md },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.SPACING.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
  },
  imageContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.BORDER_RADIUS.md,
    overflow: "hidden",
    backgroundColor: theme.COLORS.background,
    marginRight: theme.SPACING.md,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: { fontSize: 14, color: theme.COLORS.textPrimary },
  itemMeta: { marginTop: 2 },
  itemTotal: { fontSize: 14 },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.SPACING.md,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: theme.SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineText: { fontSize: 14, color: theme.COLORS.textPrimary },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: theme.BORDER_RADIUS.lg,
    backgroundColor: theme.COLORS.white,
    borderWidth: 1.5,
    borderColor: theme.COLORS.error,
    marginTop: theme.SPACING.sm,
    marginBottom: theme.SPACING.xl,
  },
});

export default BuyerOrderDetailScreen;
