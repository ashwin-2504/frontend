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
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from "../../shared/theme/theme";
import apiService from "../../shared/services/apiService";
import { useAuth } from "../../shared/context/AuthContext";
import { BottomNextBar, TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";

const AddProductScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock_quantity: "",
    image_url: "",
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

  const handleSubmit = async () => {
    const { name, price, category, stock_quantity } = formData;

    if (!name || !price || !category || !stock_quantity) {
      const message = "Fill all required fields: name, price, category, and stock.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", message);
      return;
    }

    setLoading(true);
    try {
      // For now, using a hardcoded seller_id. In a real app, this would come from auth.
      const productPayload = {
        ...formData,
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity, 10),
        seller_id: user?.id || "seller_123",
      };

      await apiService.addProduct(productPayload);
      setErrorMessage("");
      announceMessage("Product created successfully");
      Alert.alert("Success", "Product added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Failed to add product:", error);
      const message = "Failed to add product. Please check details and retry.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Add New Product" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ErrorBanner message={errorMessage} />
          <View style={styles.formGroup}>
            <Text allowFontScaling={true} style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              accessibilityLabel="Product name"
              accessibilityHint="Enter the product title"
            />
          </View>

          <View style={styles.formGroup}>
            <Text allowFontScaling={true} style={styles.label}>Category *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Vegetables, Grains"
              value={formData.category}
              onChangeText={(text) => handleChange("category", text)}
              accessibilityLabel="Product category"
              accessibilityHint="Example vegetables or grains"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.md }]}>
              <Text allowFontScaling={true} style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => handleChange("price", text)}
                accessibilityLabel="Price in rupees"
                accessibilityHint="Enter per-unit price"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text allowFontScaling={true} style={styles.label}>Stock Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={formData.stock_quantity}
                onChangeText={(text) => handleChange("stock_quantity", text)}
                accessibilityLabel="Stock quantity"
                accessibilityHint="Enter available quantity"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text allowFontScaling={true} style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter product description"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              accessibilityLabel="Product description"
              accessibilityHint="Describe product quality and details"
            />
          </View>

          <View style={styles.formGroup}>
            <Text allowFontScaling={true} style={styles.label}>Product Image</Text>
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={pickImage}
              accessibilityRole="button"
              accessibilityLabel="Select product image"
              accessibilityHint="Opens photo library to choose image"
            >
              {formData.image_url ? (
                <Image source={{ uri: formData.image_url }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={32} color={COLORS.textSecondary} />
                  <Text allowFontScaling={true} style={styles.imagePlaceholderText}>Tap to select an image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNextBar
          label={loading ? "Saving..." : "Next: Create Product"}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityHint="Saves this product and returns to previous screen"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  imagePickerContainer: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default AddProductScreen;
