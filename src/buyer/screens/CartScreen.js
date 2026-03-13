import React from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from "../../shared/theme/theme";
import { useCart } from "../../shared/context/CartContext";
import { TopBar } from "../../shared/components/ScreenActions";

const CartScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      navigation.navigate("Checkout", { items: cartItems, cartTotal });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem} accessible={true}>
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="box" size={24} color={COLORS.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.itemDetails}>
        <Text allowFontScaling={true} style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text allowFontScaling={true} style={styles.itemPrice}>₹{item.price}</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.controlBtn}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
            accessibilityRole="button"
            accessibilityLabel={`Reduce quantity for ${item.name}`}
            accessibilityHint="Decreases one item from cart"
          >
            <Feather name="minus" size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text allowFontScaling={true} style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.controlBtn}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity for ${item.name}`}
            accessibilityHint="Adds one more item to cart"
          >
            <Feather name="plus" size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeBtn}
        onPress={() => removeFromCart(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name} from cart`}
        accessibilityHint="Removes this item from your cart"
      >
        <Feather name="trash-2" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Shopping Cart" onBack={() => navigation.goBack()} />

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.shopBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text allowFontScaling={true} style={styles.summaryLabel}>Total ({cartItems.length} items):</Text>
              <Text allowFontScaling={true} style={styles.summaryTotal}>₹{cartTotal}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
              accessibilityHint="Move to shipping and order confirmation"
            >
              <Text allowFontScaling={true} style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, ...SHADOWS.light,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  backButton: { padding: SPACING.xs },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.lg },
  shopBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md },
  shopBtnText: { color: COLORS.white, fontWeight: "700" },
  listContent: { padding: SPACING.lg },
  cartItem: {
    flexDirection: "row", backgroundColor: COLORS.white, padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, ...SHADOWS.light,
    alignItems: "center"
  },
  imageContainer: {
    width: 60, height: 60, borderRadius: BORDER_RADIUS.md, overflow: "hidden",
    backgroundColor: COLORS.background, marginRight: SPACING.md
  },
  image: { width: "100%", height: "100%" },
  placeholderImage: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: COLORS.primary, marginBottom: 8 },
  quantityControls: { flexDirection: "row", alignItems: "center" },
  controlBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  quantityText: { marginHorizontal: SPACING.md, fontSize: 16, fontWeight: "600" },
  removeBtn: { padding: SPACING.sm },
  footer: { padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.md },
  summaryLabel: { fontSize: 16, color: COLORS.textSecondary },
  summaryTotal: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  checkoutBtn: { height: 50, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, justifyContent: "center", alignItems: "center" },
  checkoutBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" }
});

export default CartScreen;
