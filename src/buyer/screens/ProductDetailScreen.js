import React, { useState } from "react";
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import { useCart } from "../../shared/context/CartContext";
import { TopBar } from "../../shared/components/ScreenActions";
import { announceMessage } from "../../shared/utils/accessibility";
import { useAuth } from "../../shared/context/AuthContext";
import { formatFreshness } from "../../shared/utils/formatters";

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { addToCart, cartCount, isLocked } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(product.minQty || 1);

  // Reactive price calculation
  const getUnitPrice = (qty) => {
    if (product.bulkPricing && product.bulkPricing.length > 0) {
      const tier = product.bulkPricing.find(t => qty >= t.min && (!t.max || qty <= t.max));
      if (tier) return tier.price;
    }
    return product.price;
  };

  const currentPrice = getUnitPrice(quantity);

  const handleBuyNow = () => {
    if (isLocked) return;
    navigation.navigate("Checkout", { 
      product: { 
        ...product, 
        quantity, 
        priceAtPurchase: currentPrice,
        checkoutTotal: currentPrice * quantity 
      } 
    });
  };

  const handleAddToCart = () => {
    if (isLocked) return;
    // We pass the raw product. CartContext handles tiered price calculation
    // to avoid double-discounting or price sync issues.
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
            onPress={() => navigation.navigate("Main", { screen: "Cart" })}
            accessibilityRole="button"
            accessibilityLabel={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            accessibilityHint="Opens your shopping cart"
          >
            <View>
              <Feather name="shopping-cart" size={22} color={theme.COLORS.textPrimary} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <StyledText variant="caption" style={styles.badgeText}>{cartCount}</StyledText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {product.imageUrls?.[0] ? (
            <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={64} color={theme.COLORS.border} />
            </View>
          )}
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <StyledText variant="screenTitle" bold>{product.name}</StyledText>
              <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={{ marginTop: 4 }}>
                {product.category} • {product.unitType}
              </StyledText>
              
              <View style={styles.badgeRow}>
                <View style={[styles.premiumBadge, { backgroundColor: theme.COLORS.primaryLight }]}>
                  <Feather name="clock" size={12} color={theme.COLORS.primary} style={{ marginRight: 4 }} />
                  <StyledText variant="caption" bold color={theme.COLORS.primary}>{formatFreshness(product.harvestDate)}</StyledText>
                </View>
                <View style={[styles.premiumBadge, { backgroundColor: '#E3F2FD' }]}>
                  <Feather name="award" size={12} color="#1565C0" style={{ marginRight: 4 }} />
                  <StyledText variant="caption" bold color="#1565C0">GRADE {product.grade}</StyledText>
                </View>
                {product.isOrganic && (
                  <View style={[styles.premiumBadge, { backgroundColor: "#E8F5E9" }]}>
                    <Feather name="check-circle" size={12} color="#2E7D32" style={{ marginRight: 4 }} />
                    <StyledText variant="caption" bold color="#2E7D32">ORGANIC</StyledText>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.priceContainer}>
              <StyledText variant="caption" color={theme.COLORS.textSecondary} bold>PRICE PER {product.unitType}</StyledText>
              <StyledText variant="sectionHeader" color={theme.COLORS.primary} bold>₹{currentPrice}</StyledText>
              {currentPrice < product.price && (
                <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={{ textDecorationLine: 'line-through' }}>
                  ₹{product.price}
                </StyledText>
              )}
            </View>
          </View>

          {/* Delivery & Distance */}
          {user?.lastKnownLocation && product.distance !== undefined ? (
            <View style={[styles.deliveryWarning, !product.isDeliverable && styles.deliveryError]}>
              <Feather 
                name={product.isDeliverable ? "truck" : "alert-circle"} 
                size={16} 
                color={product.isDeliverable ? theme.COLORS.primary : theme.COLORS.error} 
              />
              <StyledText 
                variant="bodySecondary" 
                bold 
                color={product.isDeliverable ? theme.COLORS.textPrimary : theme.COLORS.error}
                style={{ marginLeft: 8 }}
              >
                {product.isDeliverable 
                  ? `${Math.round(product.distance)} km away • Delivery Available`
                  : `${Math.round(product.distance)} km away • Outside Delivery Zone (${product.deliveryRadius || 10}km limit)`
                }
              </StyledText>
            </View>
          ) : (
            <TouchableOpacity 
                style={[styles.deliveryWarning, { backgroundColor: theme.COLORS.surface }]}
                onPress={() => navigation.navigate("Marketplace")} // Marketplace re-triggers init
            >
              <Feather name="navigation" size={16} color={theme.COLORS.textSecondary} />
              <StyledText 
                variant="bodySecondary" 
                color={theme.COLORS.textSecondary}
                style={{ marginLeft: 8, flex: 1 }}
              >
                {user?.lastKnownLocation 
                  ? "Calculating delivery availability..." 
                  : "Enable location to verify delivery to your door."}
              </StyledText>
              {!user?.lastKnownLocation && (
                  <Feather name="chevron-right" size={16} color={theme.COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          )}

          {/* Tiered Pricing Section */}
          {product.bulkPricing && product.bulkPricing.length > 0 && (
            <View style={styles.bulkPricingSection}>
              <View style={styles.sectionHeader}>
                <Feather name="trending-down" size={20} color={theme.COLORS.primary} />
                <StyledText variant="sectionHeader" bold>Bulk Savings</StyledText>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.tierScroll}
              >
                {product.bulkPricing.map((tier, idx) => {
                  const isActive = quantity >= tier.min && (!tier.max || quantity <= tier.max);
                  return (
                    <View key={idx} style={[styles.tierCard, isActive && styles.tierCardActive]}>
                      <StyledText 
                        variant="caption" 
                        bold 
                        color={isActive ? theme.COLORS.white : theme.COLORS.textSecondary}
                      >
                        {tier.min}{tier.max ? `-${tier.max}` : '+'} {product.unitType}
                      </StyledText>
                      <StyledText 
                        variant="bodyPrimary" 
                        bold 
                        color={isActive ? theme.COLORS.white : theme.COLORS.textPrimary}
                        style={{ marginVertical: 4 }}
                      >
                        ₹{tier.price.toFixed(2)}
                      </StyledText>
                      <StyledText 
                        variant="caption" 
                        bold 
                        color={isActive ? theme.COLORS.white : theme.COLORS.success}
                      >
                        Save {Math.round((1 - tier.price / product.price) * 100)}%
                      </StyledText>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.quantitySection}>
            <View style={styles.quantityLabelContainer}>
              <StyledText variant="bodyPrimary" bold>Quantity</StyledText>
              <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ marginTop: 2 }}>
                Min: {product.minQty || 1} • Max: {product.maxQty || product.stockQty}
              </StyledText>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(Math.max(product.minQty || 1, quantity - 1))}
                activeOpacity={0.6}
              >
                <Feather name="minus" size={18} color={theme.COLORS.primary} />
              </TouchableOpacity>
              <View style={styles.qtyValueContainer}>
                <StyledText variant="sectionHeader" bold>{quantity}</StyledText>
              </View>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(Math.min(product.maxQty || product.stockQty, quantity + 1))}
                activeOpacity={0.6}
              >
                <Feather name="plus" size={18} color={theme.COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Feather name="box" size={18} color={theme.COLORS.primary} />
              <View style={styles.infoTextContainer}>
                <StyledText variant="caption" color={theme.COLORS.textSecondary} bold>STOCK STATUS</StyledText>
                <StyledText variant="bodySecondary" bold color={product.stockQty < 10 ? theme.COLORS.error : theme.COLORS.textPrimary}>
                  {product.stockQty > 0 ? `${product.stockQty} available` : "Out of Stock"}
                </StyledText>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Feather name="user" size={18} color={theme.COLORS.primary} />
              <View style={styles.infoTextContainer}>
                <StyledText variant="caption" color={theme.COLORS.textSecondary} bold>SELLER</StyledText>
                <StyledText variant="bodySecondary" bold>{product.sellerId?.substring(0, 8)}…</StyledText>
              </View>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <StyledText variant="sectionHeader" bold style={{ marginBottom: 12 }}>Description</StyledText>
            <StyledText variant="bodyPrimary" color={theme.COLORS.textSecondary} style={{ lineHeight: 24 }}>
              {product.description || "No description provided for this product. High-quality agricultural produce directly from the source."}
            </StyledText>
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
          <Feather name="shopping-cart" size={18} color={theme.COLORS.primary} />
          <StyledText variant="button" color={theme.COLORS.primary} style={{ marginLeft: 8 }}>Add to Cart</StyledText>
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
          <Feather name="arrow-right-circle" size={18} color={theme.COLORS.white} />
          <StyledText variant="button" color={theme.COLORS.white} style={{ marginLeft: 8 }}>Buy Now</StyledText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  cartButton: {
    padding: theme.SPACING.xs,
  },
  scrollContent: {
    paddingBottom: theme.SPACING.lg,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: theme.COLORS.background,
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
    padding: theme.SPACING.lg,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.SPACING.lg,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.SPACING.xl,
    backgroundColor: theme.COLORS.white,
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.COLORS.primaryLight,
    ...theme.SHADOWS.light,
  },
  quantityLabelContainer: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.background,
    borderRadius: theme.BORDER_RADIUS.full,
    padding: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...theme.SHADOWS.light,
  },
  qtyValueContainer: {
    paddingHorizontal: theme.SPACING.lg,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.COLORS.background,
    borderRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.lg,
    marginBottom: theme.SPACING.xl,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoTextContainer: {
    marginLeft: theme.SPACING.sm,
  },
  descriptionContainer: {
    marginBottom: theme.SPACING.xl,
  },
  footer: {
    flexDirection: "row",
    padding: theme.SPACING.lg,
    paddingBottom: theme.SPACING.lg,
    backgroundColor: theme.COLORS.white,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
    alignItems: "center",
  },
  addToCartButton: {
    flex: 1,
    height: 50,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.white,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.SPACING.sm,
  },
  buyNowButton: {
    marginRight: 0,
    marginLeft: theme.SPACING.sm,
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: theme.COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.white,
  },
  badgeText: {
    color: theme.COLORS.white,
    fontSize: 12,
    fontWeight: theme.FONT_WEIGHTS.semibold,
    paddingHorizontal: 4,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: theme.SPACING.md,
    flexWrap: "wrap",
    gap: theme.SPACING.md,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: 8,
    borderRadius: theme.BORDER_RADIUS.full,
    ...theme.SHADOWS.light,
  },
  premiumBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceContainer: {
    alignItems: "flex-end",
    backgroundColor: theme.COLORS.primaryLight + '40',
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
  },
  deliveryWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    marginTop: theme.SPACING.sm,
    marginBottom: theme.SPACING.lg,
    borderWidth: 1,
    borderColor: theme.COLORS.primaryLight,
  },
  deliveryError: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  bulkPricingSection: {
    marginBottom: theme.SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
    gap: 8,
  },
  tierScroll: {
    paddingRight: theme.SPACING.lg,
    gap: theme.SPACING.md,
  },
  tierCard: {
    width: 120,
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
    backgroundColor: theme.COLORS.white,
    borderWidth: 1.5,
    borderColor: theme.COLORS.border,
    alignItems: 'center',
    ...theme.SHADOWS.light,
  },
  tierCardActive: {
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
});

export default ProductDetailScreen;
