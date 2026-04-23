import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../shared/theme/theme';
import StyledText from '../../shared/components/StyledText';
import { formatFreshness } from '../../shared/utils/formatters';

/**
 * ProductItem with context-aware stock display.
 * context: "seller" (default) shows exact count, "buyer" shows In/Low/Out badge.
 */
const ProductItem = ({ product, onPress, context = "seller" }) => {
  const getStockDisplay = () => {
    const qty = product.stockQty;
    if (context === "buyer") {
      if (qty <= 0) return { text: "Out of Stock", color: theme.COLORS.error, bg: "#FFEBEE" };
      if (qty < 10) return { text: "Low Stock", color: theme.COLORS.warning, bg: "#FFF3E0" };
      return { text: "In Stock", color: theme.COLORS.success, bg: "#E8F5E9" };
    }
    // Seller — show exact count
    if (qty < 5) return { text: `Stock: ${qty}`, color: theme.COLORS.error, bg: "#FFEBEE" };
    return { text: `Stock: ${qty}`, color: theme.COLORS.textSecondary, bg: theme.COLORS.background };
  };

  const stock = getStockDisplay();

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.category}, ${product.grade ? 'grade ' + product.grade : ''}, price starting from rupees ${product.price}. Status: ${stock.text}`}
      accessibilityHint="Opens product details"
    >
      <View style={styles.imageContainer}>
        {product.imageUrls?.[0] ? (
          <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="box" size={24} color={theme.COLORS.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.details}>
        <StyledText variant="bodyPrimary" bold numberOfLines={1}>{product.name}</StyledText>
        <View style={styles.badgeRow}>
          <View style={styles.trustBadge}>
            <StyledText variant="caption" bold color={theme.COLORS.primary}>
              {formatFreshness(product.harvestDate)}
            </StyledText>
          </View>
          <View style={[styles.trustBadge, { backgroundColor: theme.COLORS.surface }]}>
            <StyledText variant="caption" bold color={theme.COLORS.secondary}>
              GR {product.grade || 'A'}
            </StyledText>
          </View>
          {product.isOrganic && (
            <Feather name="shield" size={12} color={theme.COLORS.success} style={{ marginLeft: 4 }} />
          )}
        </View>
        
        {product.distance !== undefined && (
          <View style={styles.distanceContainer}>
            <Feather name="map-pin" size={10} color={theme.COLORS.textSecondary} />
            <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ marginLeft: 2 }}>
              {product.distance.toFixed(1)} km
            </StyledText>
          </View>
        )}
        <View style={styles.footer}>
          <View>
            <StyledText variant="bodyPrimary" bold color={theme.COLORS.primary}>
              ₹{product.bulkPricing?.length > 0 
                ? `${Math.min(...product.bulkPricing.map(p => p.price))}-${product.price}`
                : product.price
              }
            </StyledText>
            <StyledText variant="caption" color={theme.COLORS.textSecondary}>
              per {product.unitType || 'unit'}
            </StyledText>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: stock.bg }]}>
            <StyledText variant="caption" bold color={stock.color}>
              {stock.text}
            </StyledText>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.COLORS.border} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.white,
    padding: theme.SPACING.md,
    minHeight: 72,
    borderRadius: theme.BORDER_RADIUS.lg,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.light,
    borderWidth: 1,
    borderColor: theme.COLORS.primaryLight,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: theme.COLORS.background,
    marginRight: theme.SPACING.md,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.BORDER_RADIUS.full,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
    gap: 4,
  },
  trustBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: theme.COLORS.primaryLight,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default ProductItem;
