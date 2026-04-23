import React, { useState, useCallback } from "react";
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import ProductItem from "../components/ProductItem";
import apiService from "../../shared/services/apiService";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../shared/context/AuthContext";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";
import { isCustomerAccessForbiddenError, isSellerRole } from "../../shared/utils/roleUtils";

const SellerProductsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [accessBlocked, setAccessBlocked] = useState(false);

  const fetchProducts = useCallback(async () => {
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

    try {
      setLoading(true);
      const sellerId = user.id;
      const data = await apiService.getSellerProducts(sellerId);
      setProducts(data);
      setErrorMessage("");
    } catch (_error) {
      console.error("Failed to fetch seller products:", _error);
      if (isCustomerAccessForbiddenError(_error)) {
        const message = "This account is a customer account. Seller products are unavailable.";
        setAccessBlocked(true);
        setErrorMessage(message);
        announceMessage(message);
        return;
      }
      const message = (_error?.message || "Could not load products. Please retry.")
        .replace(/^\[[^\]]+\]\s*/, "");
      setErrorMessage(message);
      announceMessage("Could not load products. Use retry to try again.");
    } finally {
      setLoading(false);
    }
  }, [accessBlocked, user?.id, user?.role]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id && !accessBlocked) {
        fetchProducts();
      }
    }, [accessBlocked, fetchProducts, user?.id])
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centerContainer}>
          <Feather name="wifi-off" size={48} color={theme.COLORS.border} />
          <ErrorBanner message={errorMessage} />
          <StyledText variant="bodySecondary" center style={{ marginBottom: theme.SPACING.lg }}>Pull down to refresh or tap retry.</StyledText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={fetchProducts}
            accessibilityRole="button"
            accessibilityLabel="Retry loading products"
            accessibilityHint="Attempts to fetch your products again"
          >
            <StyledText variant="button" color={theme.COLORS.white}>Retry</StyledText>
          </TouchableOpacity>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Feather name="box" size={48} color={theme.COLORS.border} />
          <StyledText variant="bodyPrimary" center style={{ marginTop: theme.SPACING.md, marginBottom: theme.SPACING.lg }}>You haven&apos;t added any products yet.</StyledText>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <StyledText variant="button" color={theme.COLORS.white}>Add Your First Product</StyledText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={products}
        keyExtractor={item => item.productId}
        renderItem={({ item }) => (
          <ProductItem 
            product={item}
            onPress={() => {
              navigation.navigate("EditProduct", { product: item });
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="My Products"
        rightNode={
          <TouchableOpacity
            onPress={() => navigation.navigate("AddProduct")}
            style={styles.headerAction}
            accessibilityRole="button"
            accessibilityLabel="Add product"
            accessibilityHint="Open add product form"
          >
            <Feather name="plus-circle" size={24} color={theme.COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.background },
  headerAction: { padding: theme.SPACING.xs },
  listContent: { padding: theme.SPACING.lg },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.SPACING.xl },
  addButton: { paddingHorizontal: theme.SPACING.lg, paddingVertical: theme.SPACING.md, backgroundColor: theme.COLORS.primary, borderRadius: theme.BORDER_RADIUS.md },
});

export default SellerProductsScreen;
