import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from "../../shared/theme/theme";
import apiService from "../../shared/services/apiService";
import ProductItem from "../../seller/components/ProductItem"; // Reusing the ProductItem component
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";

const MarketplaceScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAllProducts();
      setProducts(data);
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to fetch products:", error);
      const message = "Could not load products. Please try again.";
      setErrorMessage(message);
      announceMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchAllProducts();
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.searchProducts(searchQuery);
      setProducts(data);
      setErrorMessage("");
    } catch (error) {
      console.error("Search failed:", error);
      const message = "Search failed. Check your network and try again.";
      setErrorMessage(message);
      announceMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Marketplace"
        onBack={() => navigation.goBack()}
        rightNode={
          <TouchableOpacity
            onPress={() => navigation.navigate("Cart")}
            accessibilityRole="button"
            accessibilityLabel="Open cart"
            accessibilityHint="Go to shopping cart"
          >
            <Feather name="shopping-cart" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchContainer}>
        <ErrorBanner message={errorMessage} />
        <View style={styles.searchInputWrapper}>
          <Feather name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); fetchAllProducts(); }}>
              <Feather name="x" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductItem 
              product={item} 
              context="buyer"
              onPress={() => navigation.navigate("ProductDetail", { product: item })} 
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  backButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  listContent: {
    padding: SPACING.lg,
  },
});

export default MarketplaceScreen;
