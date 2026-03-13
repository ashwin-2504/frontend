import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, STATUS_COLORS, FONT_SIZES, FONT_WEIGHTS } from "../../shared/theme/theme";
import { TopBar } from "../../shared/components/ScreenActions";

const BuyerOrderDetailScreen = ({ route, navigation }) => {
  const { order } = route.params;

  const getStatusColor = (status) => {
    const sc = STATUS_COLORS[status];
    return sc ? sc.text : COLORS.textSecondary;
  };

  const getStatusBg = (status) => {
    const sc = STATUS_COLORS[status];
    return sc ? sc.bg : COLORS.background;
  };

  const getStatusIcon = (status) => {
    const sc = STATUS_COLORS[status];
    return sc ? sc.icon : "circle";
  };

  const orderItems = Array.isArray(order.items) ? order.items : [];

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Order Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order summary card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <Text allowFontScaling={true} style={styles.orderId}>Order #{order.id?.substring(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
              <Text allowFontScaling={true} style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Feather name="calendar" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="dollar-sign" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailTextBold}>₹{order.total_amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="credit-card" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>Cash on Delivery</Text>
          </View>
        </View>

        {/* Items list */}
        {orderItems.length > 0 && (
          <>
          <Text allowFontScaling={true} style={styles.sectionTitle}>Items</Text>
            <View style={styles.card}>
              {orderItems.map((item, index) => (
                <View key={item.id || index} style={[styles.itemRow, index < orderItems.length - 1 && styles.itemBorder]}>
                  <View style={styles.itemIcon}>
                    <Feather name="box" size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={true} style={styles.itemName}>{item.name || "Product"}</Text>
                    <Text allowFontScaling={true} style={styles.itemMeta}>Qty: {item.quantity || 1} × ₹{item.price || 0}</Text>
                  </View>
                  <Text allowFontScaling={true} style={styles.itemTotal}>₹{(item.price || 0) * (item.quantity || 1)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Status timeline (simple) */}
        <Text allowFontScaling={true} style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.card}>
            <View style={[styles.timelineRow, { flexDirection: "row", alignItems: "center" }]}>
              <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]}>
                <Feather name="check" size={8} color="#fff" />
              </View>
              <Text allowFontScaling={true} style={styles.timelineText}>Order Placed</Text>
            </View>
            {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: '#2196F3' }]}>
                  <Feather name="truck" size={8} color="#fff" />
                </View>
                <Text allowFontScaling={true} style={styles.timelineText}>Shipped</Text>
              </View>
            )}
            {order.status === 'DELIVERED' && (
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]}>
                  <Feather name="check-circle" size={8} color="#fff" />
                </View>
                <Text allowFontScaling={true} style={styles.timelineText}>Delivered</Text>
              </View>
            )}
            {order.status === 'CANCELLED' && (
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: '#F44336' }]}>
                  <Feather name="x" size={8} color="#fff" />
                </View>
                <Text allowFontScaling={true} style={styles.timelineText}>Cancelled</Text>
              </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, ...SHADOWS.light, zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  backButton: { padding: SPACING.xs },
  scrollContent: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    marginBottom: SPACING.lg,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
  },
  orderId: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "700" },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  detailText: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 8 },
  detailTextBold: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACING.md },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  itemName: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  itemMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineText: { fontSize: 14, color: COLORS.textPrimary },
});

export default BuyerOrderDetailScreen;
