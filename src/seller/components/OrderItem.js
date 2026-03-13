import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, STATUS_COLORS, FONT_SIZES, FONT_WEIGHTS } from '../../shared/theme/theme';

const OrderItem = ({ order, onPress }) => {
  const getStatusColor = (status) => {
    const sc = STATUS_COLORS[status];
    return sc ? sc.text : COLORS.textSecondary;
  };

  const getStatusBg = (status) => {
    const sc = STATUS_COLORS[status];
    return sc ? sc.bg : COLORS.background;
  };

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.id.substring(0, 8)}, status ${order.status}, amount rupees ${order.total_amount}`}
      accessibilityHint="Opens detailed order status"
    >
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <Feather name="hash" size={14} color={COLORS.textSecondary} />
          <Text allowFontScaling={true} style={styles.orderId}>{order.id.substring(0, 8)}...</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
          <Text allowFontScaling={true} style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text allowFontScaling={true} style={styles.customerName}>{order.customer_name}</Text>
        <Text allowFontScaling={true} style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
      </View>

      <View style={styles.footer}>
        <Text allowFontScaling={true} style={styles.amount}>₹{order.total_amount}</Text>
        <View style={styles.itemsCount}>
          <Feather name="package" size={12} color={COLORS.textSecondary} />
          <Text allowFontScaling={true} style={styles.countText}>{order.items?.length || 0} items</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    minHeight: 72,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    marginBottom: SPACING.md,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});

export default OrderItem;
