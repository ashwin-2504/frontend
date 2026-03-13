import React, { useState } from "react";
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from "../../shared/theme/theme";
import { useCart } from "../../shared/context/CartContext";
import { TopBar } from "../../shared/components/ScreenActions";
import { announceMessage } from "../../shared/utils/accessibility";

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { addToCart, cartCount } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleBuyNow = () => {
    // Navigate to checkout with product info directly
    navigation.navigate("Checkout", { product: { ...product, quantity, checkoutTotal: product.price * quantity } });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    announceMessage(`${quantity} ${product.name} added to cart`);
    Alert.alert("Added to Cart", `${quantity} × ${product.name} added to your cart.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Product Details"
        onBack={() => navigation.goBack()}
        rightNode={
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate("Cart")}
            accessibilityRole="button"
            accessibilityLabel={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            accessibilityHint="Opens your shopping cart"
          >
            <View>
              <Feather name="shopping-cart" size={22} color={COLORS.textPrimary} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text allowFontScaling={true} style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={64} color={COLORS.border} />
            </View>
          )}
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={true} style={styles.name}>{product.name}</Text>
              <Text allowFontScaling={true} style={styles.category}>{product.category}</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text allowFontScaling={true} style={styles.price}>₹{product.price}</Text>
            </View>
          </View>

          <View style={styles.quantitySection}>
            <Text allowFontScaling={true} style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                accessibilityHint="Reduces the quantity by one"
              >
                <Feather name="minus" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text allowFontScaling={true} style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                accessibilityHint="Increases the quantity by one"
              >
                <Feather name="plus" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Feather name="box" size={18} color={COLORS.primary} />
              <View style={styles.infoTextContainer}>
                <Text allowFontScaling={true} style={styles.infoLabel}>Stock Status</Text>
                <Text allowFontScaling={true} style={[styles.infoValue, product.stock_quantity < 10 && styles.lowStock]}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} available` : "Out of Stock"}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Feather name="user" size={18} color={COLORS.primary} />
              <View style={styles.infoTextContainer}>
                <Text allowFontScaling={true} style={styles.infoLabel}>Seller</Text>
                <Text allowFontScaling={true} style={styles.infoValue}>{product.seller_id?.substring(0, 8)}…</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text allowFontScaling={true} style={styles.sectionTitle}>Description</Text>
            <Text allowFontScaling={true} style={styles.description}>
              {product.description || "No description provided for this product. High-quality agricultural produce directly from the source."}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add to cart"
          accessibilityHint="This will save this product to your cart"
        >
          <Feather name="shopping-cart" size={18} color={COLORS.primary} />
          <Text allowFontScaling={true} style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addToCartButton, styles.buyNowButton]}
          onPress={handleBuyNow}
          activeOpacity={0.8}
          disabled={product.stock_quantity <= 0}
          accessibilityRole="button"
          accessibilityLabel="Buy now"
          accessibilityHint="Go directly to checkout"
        >
          <Feather name="arrow-right-circle" size={18} color={COLORS.white} />
          <Text allowFontScaling={true} style={[styles.addToCartText, styles.buyNowText]}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  backButton: {
    padding: SPACING.xs,
  },
  cartButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: COLORS.background,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsSection: {
    padding: SPACING.lg,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  category: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  priceBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  price: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.heavy,
    color: COLORS.primary,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  quantityLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtn: {
    padding: SPACING.sm,
    width: 40,
    alignItems: "center",
  },
  qtyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    minWidth: 30,
    textAlign: "center",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoTextContainer: {
    marginLeft: SPACING.sm,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  lowStock: {
    color: "#F44336",
  },
  descriptionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    padding: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  addToCartButton: {
    flex: 1,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  buyNowButton: {
    marginRight: 0,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buyNowText: {
    color: COLORS.white,
  },
  addToCartText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.sm,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    paddingHorizontal: 4,
  },
});

export default ProductDetailScreen;
