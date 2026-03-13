import React, { useState, useCallback } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from "../../shared/theme/theme";
import ProductItem from "../components/ProductItem";
import apiService from "../../shared/services/apiService";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../shared/context/AuthContext";
import { TopBar } from "../../shared/components/ScreenActions";
import { announceMessage } from "../../shared/utils/accessibility";

const SellerProductsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const sellerId = user?.id || "seller_123";
      const data = await apiService.getSellerProducts(sellerId);
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch seller products:", error);
      announceMessage("Could not load products. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Feather name="box" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>You haven't added any products yet.</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <Text style={styles.addButtonText}>Add Your First Product</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={products}
        keyExtractor={item => item.id}
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
        onBack={() => navigation.goBack()}
        rightNode={
          <TouchableOpacity
            onPress={() => navigation.navigate("AddProduct")}
            style={styles.headerAction}
            accessibilityRole="button"
            accessibilityLabel="Add product"
            accessibilityHint="Open add product form"
          >
            <Feather name="plus-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, ...SHADOWS.light, zIndex: 10
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  backButton: { padding: SPACING.xs },
  headerAction: { padding: SPACING.xs },
  listContent: { padding: SPACING.lg },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.lg, textAlign: "center" },
  addButton: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md },
  addButtonText: { color: COLORS.white, fontWeight: "700" }
});

export default SellerProductsScreen;
