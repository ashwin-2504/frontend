import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import StatsCard from "../../shared/components/StatsCard";
import ProductItem from "../../seller/components/ProductItem";
import OrderItem from "../../seller/components/OrderItem";
import apiService from "../../shared/services/apiService";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../shared/context/AuthContext";
import { TopBar } from "../../shared/components/ScreenActions";
import { announceMessage } from "../../shared/utils/accessibility";
import { isSessionAuthError } from "../../shared/utils/authErrors";

const BuyerDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    purchases: "0",
    orders: "0",
    spent: "₹0",
    wishlist: "0",
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [feed, setFeed] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id || user?.role !== "customer") {
      announceMessage("Please sign in again to load your buyer dashboard.");
      return;
    }

    setLoading(true);
    try {
      const buyerId = user.id;
      const [statsData, ordersData, feedData] = await Promise.all([
        apiService.getBuyerStats(buyerId),
        apiService.getBuyerOrders(buyerId),
        apiService.getProductFeed(3)
      ]);
      
      setStats({
        purchases: (statsData?.ordersCount ?? 0).toString(),
        orders: (statsData?.pendingOrdersCount ?? 0).toString(),
        spent: `₹${statsData?.revenue ?? 0}`,
        wishlist: "0",
      });
      setRecentOrders(ordersData || []);
      setFeed(feedData || []);
    } catch (_error) {
      const isAuthErr = isSessionAuthError(_error) || String(_error?.message || _error).includes("Sign in again");
      if (isAuthErr) {
        const message = "Your session expired. Signing you out.";
        setLoading(false);
        announceMessage(message);
        await logout().catch(() => null);
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }
      console.error("Failed to fetch dashboard data:", _error);
      announceMessage("Could not load dashboard. Pull down to try again.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigation, user?.id, user?.role]);

  const handleSearch = () => {
    navigation.navigate("Marketplace");
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchDashboardData();
      }
    }, [fetchDashboardData, user?.id])
  );

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


        <View style={styles.statsGrid}>
          <StatsCard
            title="Total Purchases"
            value={stats.purchases}
            icon="shopping-bag"
            color={{ bg: "#F3E5F5", icon: "#7B1FA2" }}
            onPress={() => navigation.navigate("BuyerPurchases")}
            accessibilityHint="Open your full purchases history"
          />
          <StatsCard
            title="Active Orders"
            value={stats.orders}
            icon="truck"
            color={{ bg: "#E3F2FD", icon: "#1565C0" }}
            onPress={() => navigation.navigate("BuyerActiveOrders")}
            accessibilityHint="Open currently active orders"
          />
          <StatsCard title="Total Spent" value={stats.spent} icon="credit-card" color={{ bg: "#E8F5E9", icon: "#2E7D32" }} />
          <StatsCard
            title="Wishlist Items"
            value={stats.wishlist}
            icon="heart"
            color={{ bg: "#FFEBEE", icon: "#C62828" }}
            onPress={() => navigation.navigate("Marketplace")}
            accessibilityHint="Open marketplace to add items"
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Feather name="award" size={18} color={theme.COLORS.primary} style={styles.sectionIcon} />
            <StyledText variant="sectionHeader" bold>Recommended For You</StyledText>
          </View>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={handleSearch}
            activeOpacity={0.7}
          >
            <Feather name="search" size={14} color={theme.COLORS.white} style={{ marginRight: 6 }} />
            <StyledText variant="button" color={theme.COLORS.white}>Explore All</StyledText>
          </TouchableOpacity>
        </View>

        {feed.length === 0 ? (
          <View style={styles.emptyState}>
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} center>
              Discover fresh produce directly from farmers!
            </StyledText>
          </View>
        ) : (
          <View style={styles.feedList}>
            {feed.map(product => (
              <ProductItem 
                key={product.productId} 
                product={product} 
                context="buyer"
                onPress={() => navigation.navigate("ProductDetail", { product })} 
              />
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Feather name="shopping-bag" size={18} color={theme.COLORS.primary} style={styles.sectionIcon} />
            <StyledText variant="sectionHeader" bold>My Recent Orders ({recentOrders.length})</StyledText>
          </View>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>No orders yet</StyledText>
          </View>
        ) : (
          <View style={styles.orderList}>
            {recentOrders.slice(0, 4).map(order => (
              <OrderItem key={order.orderId} order={order} onPress={() => navigation.navigate("BuyerOrderDetail", { order })} />
            ))}
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
    padding: 10, // Accessibility touch target
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIcon: {
    marginRight: 8,
  },
  exploreButton: {
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 16,
    height: 40, // Balanced for small button text
    borderRadius: theme.BORDER_RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    backgroundColor: theme.COLORS.white,
    padding: 24,
    borderRadius: theme.BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderStyle: "dashed",
    marginBottom: 20,
  },
  feedList: {
    marginBottom: 20,
  },
});

export default BuyerDashboard;
