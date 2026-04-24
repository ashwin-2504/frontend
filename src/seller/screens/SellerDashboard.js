import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Pressable,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import StatsCard from "../../shared/components/StatsCard";
import { Feather } from "@expo/vector-icons";
import apiService from "../../shared/services/apiService";
import ProductItem from "../components/ProductItem";
import OrderItem from "../components/OrderItem";
import { useAuth } from "../../shared/context/AuthContext";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import EmptyState from "../../shared/components/EmptyState";
import { announceMessage } from "../../shared/utils/accessibility";
import { isCustomerAccessForbiddenError, isSellerRole } from "../../shared/utils/roleUtils";

const SellerDashboard = ({ navigation }) => {
  const { user, confirmFarmLocation, updateUserLocation } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    products: "0",
    orders: "0",
    revenue: "₹0",
    pending: "0",
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [accessBlocked, setAccessBlocked] = useState(false);

  const initLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await updateUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy,
        });
      }
    } catch (_error) {
      console.warn("SellerDashboard initLocation failed:", _error);
    }
  }, [updateUserLocation]);

  const fetchDashboardData = useCallback(async () => {
    if (accessBlocked) {
      return;
    }

    if (!user?.id || !isSellerRole(user?.role)) {
      const message = "Seller access is unavailable for this account.";
      setAccessBlocked(true);
      setErrorMessage(message);
      announceMessage(message);
      return;
    }

    setLoading(true);
    try {
      const sellerId = user.id;
      
      // Fetch stats, products, and orders in parallel
      const [statsData, productsData, ordersData] = await Promise.all([
        apiService.getSellerStats(sellerId),
        apiService.getSellerProducts(sellerId),
        apiService.getSellerOrders(sellerId)
      ]);
      
      setStats({
        products: statsData.productsCount?.toString() || "0",
        orders: statsData.ordersCount?.toString() || "0",
        revenue: `₹${statsData.revenue || 0}`,
        pending: statsData.pendingOrdersCount?.toString() || "0",
      });
      
      setProducts(productsData || []);
      setOrders(ordersData || []);
      setErrorMessage("");
    } catch (_error) {
      if (String(_error?.message || _error).includes("Sign in again")) {
        return; // Silent catch, AuthContext handles redirect
      }
      console.error("Failed to fetch seller dashboard data:", _error);
      if (isCustomerAccessForbiddenError(_error)) {
        const message = "This account is a customer account. Seller dashboard is unavailable.";
        setAccessBlocked(true);
        setErrorMessage(message);
        announceMessage(message);
        return;
      }
      const message = (_error?.message || "Could not load dashboard details. Pull down to retry.")
        .replace(/^\[[^\]]+\]\s*/, "");
      setErrorMessage(message);
      announceMessage("Could not load dashboard details. Use retry to try again.");
    } finally {
      setLoading(false);
    }
  }, [accessBlocked, user?.id, user?.role]);

  useEffect(() => {
    if (user?.id) {
      initLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useFocusEffect(
    useCallback(() => {
      if (user?.id && !accessBlocked) {
        fetchDashboardData();
      }
    }, [accessBlocked, fetchDashboardData, user?.id])
  );

  const handleAddProduct = () => {
    navigation.navigate("AddProduct");
  };

  const handleSetFarmLocation = () => {
    Alert.alert(
      "Set Farm Location",
      "Confirm current GPS coordinates as your permanent Farm Location? Make sure you are at your farm right now.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Set Location", 
          onPress: async () => {
            setLoading(true);
            try {
              let locationToUse = user?.lastKnownLocation;
              
              // If missing, try one fresh fetch
              if (!locationToUse) {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                  const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High, // Higher accuracy for farm set
                  });
                  locationToUse = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                  };
                  await updateUserLocation(locationToUse);
                }
              }

              if (!locationToUse) {
                throw new Error("Wait for GPS signal before setting location.");
              }
              
              await confirmFarmLocation(locationToUse);
              Alert.alert("Success", "Farm location set. Your products are now visible to nearby buyers!");
            } catch (_error) {
              Alert.alert("Location Error", _error.message || "Could not set farm location. Try again with a better signal.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Dashboard"
        rightNode={
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.navigate("Profile")}
            accessibilityRole="button"
            accessibilityLabel="View Profile"
            accessibilityHint="Opens your profile and account settings"
          >
            <Feather name="user" size={20} color={theme.COLORS.textSecondary} />
          </Pressable>
        }
      />

      {!!errorMessage && (
        <View style={styles.errorSection}>
          <ErrorBanner message={errorMessage} />
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchDashboardData}
            accessibilityRole="button"
            accessibilityLabel="Retry loading dashboard"
            accessibilityHint="Attempts to fetch seller stats, products, and orders again"
          >
            <Feather name="refresh-cw" size={16} color={theme.COLORS.white} style={{ marginRight: 8 }} />
            <StyledText variant="button" color={theme.COLORS.white}>Retry</StyledText>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />
        }
      >
        {(!user?.farmLocation?.lat || !user?.farmLocation?.lng) && (
            <TouchableOpacity 
                style={styles.locationWarning} 
                onPress={handleSetFarmLocation}
                activeOpacity={0.8}
            >
                <View style={styles.warningIcon}>
                    <Feather name="map-pin" size={20} color={theme.COLORS.error} />
                </View>
                <View style={{ flex: 1 }}>
                    <StyledText variant="bodyPrimary" bold color={theme.COLORS.error}>
                        Farm Location Missing
                    </StyledText>
                    <StyledText variant="caption" color={theme.COLORS.textSecondary}>
                        Setup your farm location in Profile to make your products visible to nearby buyers.
                    </StyledText>
                </View>
                <Feather name="chevron-right" size={18} color={theme.COLORS.error} />
            </TouchableOpacity>
        )}


        <View style={styles.statsGrid}>
          <StatsCard
            title="Active Products"
            value={stats.products}
            icon="box"
            color={{ bg: "#E8F5E9", icon: "#2E7D32" }}
            onPress={() => navigation.navigate("SellerProducts")}
            accessibilityHint="Open all your products"
          />
          <StatsCard
            title="Total Orders"
            value={stats.orders}
            icon="file-text"
            color={{ bg: "#E3F2FD", icon: "#1565C0" }}
            onPress={() => navigation.navigate("SellerOrders")}
            accessibilityHint="Open your orders list"
          />
          <StatsCard title="Total Revenue" value={stats.revenue} icon="pie-chart" color={{ bg: "#FFF8E1", icon: "#F9A825" }} />
          <StatsCard
            title="Pending Orders"
            value={stats.pending}
            icon="clock"
            color={{ bg: "#FFF3E0", icon: "#E65100" }}
            onPress={() => navigation.navigate("SellerOrders")}
            accessibilityHint="Open pending and recent orders"
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Feather name="box" size={18} color={theme.COLORS.primary} style={styles.sectionIcon} />
            <StyledText variant="sectionHeader" bold>My Products ({stats.products})</StyledText>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddProduct}
          >
            <Feather name="plus" size={16} color={theme.COLORS.white} style={{ marginRight: 4 }} />
            <StyledText variant="button" color={theme.COLORS.white}>Add Product</StyledText>
          </TouchableOpacity>
        </View>

        {loading && products.length === 0 ? (
          <ActivityIndicator size="small" color={theme.COLORS.primary} style={{ marginVertical: theme.SPACING.md }} />
        ) : products.length === 0 ? (
          <EmptyState 
            icon="plus-circle"
            title="No Products Found"
            subtitle="You haven't added any products yet. Start selling by adding your first product!"
            ctaText="Add First Product"
            onPress={handleAddProduct}
          />
        ) : (
          <View style={styles.productList}>
            {products.slice(0, 5).map(product => (
              <ProductItem
                key={product.productId}
                product={product}
                onPress={() => navigation.navigate("EditProduct", { product })}
              />
            ))}
            {products.length > 5 && (
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate("SellerProducts")}
              >
                <StyledText variant="button" color={theme.COLORS.primary}>View All Products</StyledText>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Feather name="list" size={18} color={theme.COLORS.primary} style={styles.sectionIcon} />
            <StyledText variant="sectionHeader" bold>Recent Orders ({stats.orders})</StyledText>
          </View>
        </View>

        {loading && orders.length === 0 ? (
          <ActivityIndicator size="small" color={theme.COLORS.primary} style={{ marginVertical: theme.SPACING.md }} />
        ) : orders.length === 0 ? (
          <EmptyState 
            icon="clipboard"
            title="No Orders Yet"
            subtitle="Your orders will appear here once customers start buying your products."
          />
        ) : (
          <View style={styles.orderList}>
            {orders.slice(0, 5).map(order => (
              <OrderItem 
                key={order.orderId} 
                order={order} 
                onPress={() => navigation.navigate("SellerOrderDetail", { order })}
              />
            ))}
            {orders.length > 5 && (
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate("SellerOrders")}
              >
                <StyledText variant="button" color={theme.COLORS.primary}>View All Orders</StyledText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: theme.SPACING.lg,
  },
  errorSection: {
    paddingHorizontal: theme.SPACING.lg,
    paddingTop: theme.SPACING.md,
  },
  retryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: theme.SPACING.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.SPACING.md,
    marginTop: theme.SPACING.sm,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  addButton: {
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    backgroundColor: theme.COLORS.white,
    padding: theme.SPACING.xl,
    borderRadius: theme.BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderStyle: "dashed",
    marginBottom: theme.SPACING.lg,
  },
  productList: {
    marginBottom: theme.SPACING.md,
  },
  orderList: {
    marginBottom: theme.SPACING.md,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: theme.SPACING.sm,
    backgroundColor: theme.COLORS.white,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.primary,
    marginTop: -theme.SPACING.xs,
    marginBottom: theme.SPACING.md,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: theme.BORDER_RADIUS.lg,
    marginBottom: theme.SPACING.lg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    ...theme.SHADOWS.light,
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});

export default SellerDashboard;
