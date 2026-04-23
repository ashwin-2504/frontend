import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../shared/theme/theme';
import StyledText from '../../shared/components/StyledText';
import { formatDate, formatCurrency } from '../../shared/utils/formatters';



const OrderItem = ({ order, onPress }) => {
  const getStatusColor = (status) => {
    const sc = theme.STATUS_COLORS[status];
    return sc ? sc.text : theme.COLORS.textSecondary;
  };

  const getStatusBg = (status) => {
    const sc = theme.STATUS_COLORS[status];
    return sc ? sc.bg : theme.COLORS.background;
  };

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderId?.substring(0, 8)}, status ${order.status}, amount rupees ${order.totalAmount || order.sellerTotal}`}
      accessibilityHint="Opens detailed order status"
    >
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <Feather name="hash" size={14} color={theme.COLORS.textSecondary} />
          <StyledText variant="caption" color={theme.COLORS.textSecondary} style={styles.orderId}>
            {order.orderId?.substring(0, 8)}
          </StyledText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
          <StyledText 
            variant="caption" 
            bold 
            color={getStatusColor(order.status)} 
          >
            {order.status}
          </StyledText>
        </View>
      </View>
      
      <View style={styles.content}>
        <StyledText variant="bodyPrimary" bold>{order.buyerName || 'My Order'}</StyledText>
        <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ marginTop: 2 }}>
          {formatDate(order.createdAt)}
        </StyledText>

      </View>
 
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <StyledText variant="bodySecondary" bold color={theme.COLORS.textPrimary}>
            {order.items && order.items.length > 0 
              ? `${order.items.slice(0, 2).map(i => i.name).join(', ')}${order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}`
              : 'Order Details'}
          </StyledText>
          <StyledText variant="sectionHeader" bold color={theme.COLORS.primary} style={{ marginTop: 4 }}>
            {formatCurrency(order.totalAmount || order.sellerTotal)}
          </StyledText>
        </View>
        <View style={styles.itemsCount}>
          <Feather name="package" size={14} color={theme.COLORS.textSecondary} />
          <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ marginLeft: 4 }}>
            {order.itemCount || order.items?.length || 0} items
          </StyledText>
        </View>
      </View>

    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.white,
    padding: theme.SPACING.md,
    minHeight: 72,
    borderRadius: theme.BORDER_RADIUS.lg,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.light,
    borderWidth: 1,
    borderColor: theme.COLORS.primaryLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  content: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
    paddingTop: 10,
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default OrderItem;
