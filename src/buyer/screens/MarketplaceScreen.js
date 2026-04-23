import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { theme } from "../../shared/theme/theme";
import apiService from "../../shared/services/apiService";
import ProductItem from "../../seller/components/ProductItem"; // Reusing the ProductItem component
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import EmptyState from "../../shared/components/EmptyState";
import { announceMessage } from "../../shared/utils/accessibility";
import StyledText from "../../shared/components/StyledText";
import { useAuth } from "../../shared/context/AuthContext";

const MarketplaceScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const { user, updateUserLocation } = useAuth();
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    initMarketplace();
  }, []);

  const initMarketplace = async () => {
    let locationData = null;
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        locationData = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        // Sync with global context
        await updateUserLocation(locationData);
      }
    } catch (error) {
      console.warn("Location permission or fetch failed:", error);
    } finally {
      setLocationLoading(false);
      fetchAllProducts(locationData || user?.lastKnownLocation);
    }
  };

  const fetchAllProducts = async (location = user?.lastKnownLocation) => {
    setLoading(true);
    try {
      // Use getProductFeed (distance sorted) if location exists, else regular feed
      const data = await apiService.getProductFeed(20, {
          lat: location?.lat,
          lng: location?.lng,
          pincode: user?.pincode
      });
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
      const data = await apiService.searchProducts(searchQuery, user?.lastKnownLocation || { pincode: user?.pincode });
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
        title="Mandi Marketplace"
      />

      <View style={styles.searchContainer}>
        <ErrorBanner message={errorMessage} />
        <View style={styles.searchInputWrapper}>
          <Feather name="search" size={20} color={theme.COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, categories..."
            placeholderTextColor={theme.COLORS.textSecondary + "80"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); fetchAllProducts(); }}>
              <Feather name="x" size={18} color={theme.COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {user?.lastKnownLocation ? (
          <View style={styles.locationHint}>
            <Feather name="navigation" size={10} color={theme.COLORS.primary} />
            <StyledText variant="caption" bold color={theme.COLORS.primary} style={{ marginLeft: 4 }}>
              Nearby Products Active
            </StyledText>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.locationHint, { backgroundColor: theme.COLORS.background, borderWidth: 1, borderColor: theme.COLORS.border }]} 
            onPress={initMarketplace}
            disabled={locationLoading}
          >
            <Feather name="map-pin" size={10} color={theme.COLORS.textSecondary} />
            <StyledText variant="caption" bold color={theme.COLORS.textSecondary} style={{ marginLeft: 4 }}>
              {locationLoading ? "Checking..." : "Enable Location for Nearby Products"}
            </StyledText>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState 
          icon="search"
          title="No Products Found"
          subtitle="We couldn't find any products matching your search or location. Try broadening your search!"
          ctaText="Show All Products"
          onPress={() => { setSearchQuery(""); fetchAllProducts(); }}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.productId}
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
    backgroundColor: theme.COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.SPACING.lg,
    paddingVertical: theme.SPACING.md,
    backgroundColor: theme.COLORS.white,
    ...theme.SHADOWS.light,
  },
  searchContainer: {
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.background,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.COLORS.textPrimary,
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
    padding: 24,
  },
  listContent: {
    padding: 16,
  },
  locationHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: theme.COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.BORDER_RADIUS.full,
    alignSelf: "flex-start",
  },
});

export default MarketplaceScreen;
