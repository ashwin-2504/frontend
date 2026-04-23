import React from "react";
import { StyleSheet, View, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import { useCart } from "../../shared/context/CartContext";
import { TopBar } from "../../shared/components/ScreenActions";
import StyledText from "../../shared/components/StyledText";
import EmptyState from "../../shared/components/EmptyState";
import { formatCurrency } from "../../shared/utils/formatters";



const CartScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, estimatedDelivery, isLocked } = useCart();

  const handleCheckout = () => {
    if (cartItems.length > 0 && !isLocked) {
      navigation.navigate("Checkout", { items: cartItems, cartTotal });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem} accessible={true}>
      <View style={styles.imageContainer}>
        {item.imageUrls?.[0] ? (
          <Image source={{ uri: item.imageUrls[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="box" size={24} color={theme.COLORS.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.itemDetails}>
        <StyledText variant="bodyPrimary" bold numberOfLines={1}>{item.name}</StyledText>
        <StyledText variant="bodySecondary" color={theme.COLORS.primary} bold>
          {formatCurrency(item.price)}
          {item.unitType ? <StyledText variant="caption" color={theme.COLORS.textSecondary}> / {item.unitType}</StyledText> : null}
        </StyledText>

        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={[styles.controlBtn, isLocked && { opacity: 0.5 }]}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={isLocked}
            accessibilityRole="button"
            accessibilityLabel={`Reduce quantity for ${item.name}`}
            accessibilityHint="Decreases one item from cart"
            activeOpacity={0.7}
          >
            <Feather name="minus" size={16} color={theme.COLORS.textPrimary} />
          </TouchableOpacity>
          <StyledText variant="bodyPrimary" bold style={{ marginHorizontal: 16 }}>{item.quantity}</StyledText>
          <TouchableOpacity 
            style={[styles.controlBtn, isLocked && { opacity: 0.5 }]}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={isLocked}
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity for ${item.name}`}
            accessibilityHint="Adds one more item to cart"
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color={theme.COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.removeBtn, isLocked && { opacity: 0.3 }]}
        onPress={() => removeFromCart(item.productId)}
        disabled={isLocked}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name} from cart`}
        accessibilityHint="Removes this item from your cart"
        activeOpacity={0.6}
      >
        <Feather name="trash-2" size={20} color={theme.COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Shopping Cart" />

      {cartItems.length === 0 ? (
        <EmptyState 
           icon="shopping-cart"
           title="Your cart is empty"
           subtitle="Add some fresh products from the marketplace to get started!"
           ctaText="Explore Marketplace"
           onPress={() => navigation.navigate("Marketplace")}
        />
      ) : (

        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => item.productId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Items Subtotal:</StyledText>
              <StyledText variant="bodyPrimary" bold>{formatCurrency(cartTotal)}</StyledText>
            </View>
            <View style={styles.summaryRow}>
              <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Est. Delivery ({new Set(cartItems.map(i => i.sellerId)).size} farmers):</StyledText>
              <StyledText variant="bodyPrimary" bold color={theme.COLORS.success}>{formatCurrency(estimatedDelivery)}</StyledText>
            </View>
            <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.COLORS.border }]}>
              <StyledText variant="bodyPrimary" bold>Grand Total:</StyledText>
              <StyledText variant="display" color={theme.COLORS.primary} bold>{formatCurrency(cartTotal + estimatedDelivery)}</StyledText>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
              accessibilityHint="Move to shipping and order confirmation"
              activeOpacity={0.9}
            >
              <StyledText variant="button" color={theme.COLORS.white}>Proceed to Checkout</StyledText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: theme.SPACING.lg, paddingVertical: theme.SPACING.md,
    backgroundColor: theme.COLORS.white, ...theme.SHADOWS.light,
  },
  headerTitle: { ...theme.TYPOGRAPHY.sectionHeader, color: theme.COLORS.textPrimary },
  backButton: { padding: theme.SPACING.xs },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...theme.SHADOWS.light,
  },
  shopBtn: { 
    height: 50,
    paddingHorizontal: 24,
    backgroundColor: theme.COLORS.primary, 
    borderRadius: theme.BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: { padding: 16 },
  cartItem: {
    flexDirection: "row", backgroundColor: theme.COLORS.white, padding: 12,
    borderRadius: theme.BORDER_RADIUS.lg, marginBottom: 12, ...theme.SHADOWS.light,
    alignItems: "center"
  },
  imageContainer: {
    width: 70, height: 70, borderRadius: theme.BORDER_RADIUS.md, overflow: "hidden",
    backgroundColor: theme.COLORS.background, marginRight: 16
  },
  image: { width: "100%", height: "100%" },
  itemDetails: { flex: 1 },
  quantityControls: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  controlBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 8, 
    backgroundColor: theme.COLORS.background, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  removeBtn: { padding: 10 },
  footer: { 
    padding: 20, 
    backgroundColor: theme.COLORS.white, 
    borderTopWidth: 1, 
    borderTopColor: theme.COLORS.border,
    paddingBottom: 34, // Safe area style
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  checkoutBtn: { 
    height: 54, 
    backgroundColor: theme.COLORS.primary, 
    borderRadius: theme.BORDER_RADIUS.md, 
    justifyContent: "center", 
    alignItems: "center",
    ...theme.SHADOWS.medium,
  },
});

export default CartScreen;
