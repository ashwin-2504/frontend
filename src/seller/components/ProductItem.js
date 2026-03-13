import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../shared/theme/theme';

/**
 * ProductItem with context-aware stock display.
 * context: "seller" (default) shows exact count, "buyer" shows In/Low/Out badge.
 */
const ProductItem = ({ product, onPress, context = "seller" }) => {
  const getStockDisplay = () => {
    const qty = product.stock_quantity;
    if (context === "buyer") {
      if (qty <= 0) return { text: "Out of Stock", color: COLORS.error, bg: "#FFEBEE" };
      if (qty < 10) return { text: "Low Stock", color: COLORS.warning, bg: "#FFF3E0" };
      return { text: "In Stock", color: COLORS.success, bg: "#E8F5E9" };
    }
    // Seller — show exact count
    if (qty < 5) return { text: `Stock: ${qty}`, color: COLORS.error, bg: "#FFEBEE" };
    return { text: `Stock: ${qty}`, color: COLORS.textSecondary, bg: COLORS.background };
  };

  const stock = getStockDisplay();

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.category}, price rupees ${product.price}`}
      accessibilityHint="Opens product details"
    >
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="box" size={24} color={COLORS.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.details}>
        <Text allowFontScaling={true} style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text allowFontScaling={true} style={styles.category}>{product.category}</Text>
        <View style={styles.footer}>
          <Text allowFontScaling={true} style={styles.price}>₹{product.price}</Text>
          <View style={[styles.stockBadge, { backgroundColor: stock.bg }]}>
            <Text allowFontScaling={true} style={[styles.stockText, { color: stock.color }]}>
              {stock.text}
            </Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.border} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    minHeight: 72,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  category: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.heavy,
    color: COLORS.primary,
  },
  stockBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  stockText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});

export default ProductItem;
