import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from "../../shared/theme/theme";
import apiService from "../../shared/services/apiService";
import { useAuth } from "../../shared/context/AuthContext";
import { BottomNextBar, TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";

const EditProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: product.name || "",
    description: product.description || "",
    price: product.price?.toString() || "",
    category: product.category || "",
    stock_quantity: product.stock_quantity?.toString() || "",
    image_url: product.image_url || "",
  });

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleChange("image_url", result.assets[0].uri);
      setErrorMessage("");
    }
  };

  const handleSave = async () => {
    const { name, price, category, stock_quantity } = formData;

    if (!name || !price || !category || !stock_quantity) {
      const message = "Please fill all required fields before saving.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", message);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity, 10),
        seller_id: user?.id || "seller_123",
      };

      await apiService.updateProduct(product.id, payload);
      setErrorMessage("");
      announceMessage("Product updated successfully");
      Alert.alert("Success", "Product updated!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Failed to update product:", error);
      const message = "Could not update product. Please retry.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await apiService.deleteProduct(product.id, user?.id || "seller_123");
              announceMessage("Product deleted");
              Alert.alert("Deleted", "Product has been removed.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Failed to delete product:", error);
              announceMessage("Could not delete product");
              Alert.alert("Error", "Failed to delete product.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <TopBar title="Edit Product" onBack={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ErrorBanner message={errorMessage} />
          {/* Image picker */}
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            accessibilityRole="button"
            accessibilityLabel="Change product image"
            accessibilityHint="Open image library to update photo"
          >
            {formData.image_url ? (
              <Image source={{ uri: formData.image_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="camera" size={32} color={COLORS.textSecondary} />
                <Text allowFontScaling={true} style={styles.imageText}>Tap to change image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form fields */}
          <Text allowFontScaling={true} style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(v) => handleChange("name", v)}
            placeholder="Enter product name"
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text allowFontScaling={true} style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={formData.description}
            onChangeText={(v) => handleChange("description", v)}
            placeholder="Enter description"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text allowFontScaling={true} style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(v) => handleChange("price", v)}
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text allowFontScaling={true} style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.stock_quantity}
                onChangeText={(v) => handleChange("stock_quantity", v)}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text allowFontScaling={true} style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(v) => handleChange("category", v)}
            placeholder="e.g. Vegetables, Fruits"
            placeholderTextColor={COLORS.textSecondary}
          />

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Delete button — bottom, red outlined */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Delete product"
            accessibilityHint="Removes this product permanently"
          >
            <Feather name="trash-2" size={18} color={COLORS.error} />
            <Text allowFontScaling={true} style={styles.deleteButtonText}>Delete Product</Text>
          </TouchableOpacity>
        </ScrollView>
        <BottomNextBar
          label={loading ? "Saving..." : "Next: Save Changes"}
          onPress={handleSave}
          disabled={loading}
          accessibilityHint="Saves product changes"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  imagePicker: {
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multiline: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.xl,
    ...SHADOWS.medium,
  },
  disabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.sm,
  },
});

export default EditProductScreen;
