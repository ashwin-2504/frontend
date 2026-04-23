import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../shared/context/AuthContext";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import apiService from "../../shared/services/apiService";
import { TopBar, BottomNextBar } from "../../shared/components/ScreenActions";
import PrimaryButton from "../../shared/components/PrimaryButton";
import { announceMessage } from "../../shared/utils/accessibility";
import ErrorBanner from "../../shared/components/ErrorBanner";
import CustomInput from "../../shared/components/CustomInput";
import { isCustomerAccessForbiddenError, isSellerRole } from "../../shared/utils/roleUtils";

const EditProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: product.name || "",
    description: product.description || "",
    price: product.price?.toString() || "",
    category: product.category || "Vegetables",
    stockQty: product.stockQty?.toString() || "",
    imageUrls: product.imageUrls || [],
    unitType: product.unitType || "kg",
    isOrganic: product.isOrganic ?? false,
    isChemicalFree: product.isChemicalFree ?? false,
    deliveryMode: product.deliveryMode || "SELF",
    deliveryRadius: (product.deliveryRadius || 10).toString(),
    minQty: (product.minQty || 1).toString(),
    maxQty: (product.maxQty || 100).toString(),
    freshness: product.freshness || "TODAY",
    grade: product.grade || "A",
    discountPercentage: (product.discountPercentage || 0).toString(),
    bulkPricing: product.bulkPricing || [],
    harvestDate: product.harvestDate || new Date().toISOString().split('T')[0],
    delivery_charge: product.delivery_charge?.toString() || "30",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleChange("harvestDate", selectedDate.toISOString().split('T')[0]);
    }
  };

  const [newTier, setNewTier] = useState({ min: "", max: "", price: "" });

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
      handleChange("imageUrls", [result.assets[0].uri]);
      setErrorMessage("");
    }
  };

  const addTier = () => {
    if (!newTier.min || !newTier.price) {
      Alert.alert("Error", "Min Quantity and Price are required.");
      return;
    }
    const tier = {
      min: parseInt(newTier.min),
      max: newTier.max ? parseInt(newTier.max) : null,
      price: parseFloat(newTier.price),
    };
    setFormData(prev => ({
      ...prev,
      bulkPricing: [...prev.bulkPricing, tier].sort((a, b) => a.min - b.min)
    }));
    setNewTier({ min: "", max: "", price: "" });
  };

  const removeTier = (index) => {
    setFormData(prev => ({
      ...prev,
      bulkPricing: prev.bulkPricing.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    const { name, price, category, stockQty, unitType } = formData;

    if (!name || !price || !category || !stockQty || !unitType) {
      const message = "Please fill all required fields before saving.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", message);
      return;
    }

    if (!user?.id || !isSellerRole(user?.role)) {
      const message = "Only a signed-in seller can edit products.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Access denied", message);
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Append core fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("price", price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("stockQty", stockQty);
      formDataToSend.append("unitType", formData.unitType);
      formDataToSend.append("isOrganic", String(formData.isOrganic));
      formDataToSend.append("isChemicalFree", String(formData.isChemicalFree));
      formDataToSend.append("deliveryMode", formData.deliveryMode);
      formDataToSend.append("deliveryRadius", formData.deliveryRadius);
      formDataToSend.append("minQty", formData.minQty);
      formDataToSend.append("maxQty", formData.maxQty);
      formDataToSend.append("freshness", formData.freshness);
      formDataToSend.append("grade", formData.grade);
      formDataToSend.append("discountPercentage", formData.discountPercentage);
      formDataToSend.append("harvestDate", formData.harvestDate);
      formDataToSend.append("delivery_charge", formData.delivery_charge);
      formDataToSend.append("sellerId", user.id);

      // Serialize array objects
      formDataToSend.append("bulkPricing", JSON.stringify(formData.bulkPricing));

      // Separate existing URLs from new local URIs
      const existingRemoteUrls = [];
      const localImageUris = [];

      formData.imageUrls.forEach(url => {
        if (url.startsWith('http')) {
          existingRemoteUrls.push(url);
        } else {
          localImageUris.push(url);
        }
      });

      // Send existing URLs as quantized JSON
      formDataToSend.append("imageUrls", JSON.stringify(existingRemoteUrls));

      // Append new images as files
      localImageUris.forEach((uri, index) => {
        const fileName = uri.split('/').pop() || `update_${index}.jpg`;
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formDataToSend.append("images", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: fileName,
          type: type,
        });
      });

      await apiService.updateProduct(product.productId, formDataToSend);
      setErrorMessage("");
      announceMessage("Product updated successfully");
      Alert.alert("Success", "Product updated!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Failed to update product:", error);
      if (isCustomerAccessForbiddenError(error)) {
        const message = "This account is a customer account. Seller product editing is unavailable.";
        setErrorMessage(message);
        announceMessage(message);
        Alert.alert("Access denied", message);
        return;
      }
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
            if (!user?.id || !isSellerRole(user?.role)) {
              const message = "Only a signed-in seller can delete products.";
              setErrorMessage(message);
              announceMessage(message);
              Alert.alert("Access denied", message);
              return;
            }

            setLoading(true);
            try {
              await apiService.deleteProduct(product.productId, user.id);
              announceMessage("Product deleted");
              Alert.alert("Deleted", "Product has been removed.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Failed to delete product:", error);
              if (isCustomerAccessForbiddenError(error)) {
                const message = "This account is a customer account. Seller product deletion is unavailable.";
                setErrorMessage(message);
                announceMessage(message);
                Alert.alert("Access denied", message);
                return;
              }
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
          {/* Overhauled Image picker */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={styles.imagePickerHero}
              onPress={pickImage}
              activeOpacity={0.9}
            >
              {formData.imageUrls && formData.imageUrls.length > 0 ? (
                <>
                  <Image source={{ uri: formData.imageUrls[0] }} style={styles.heroImage} />
                  <View style={styles.imageOverlay}>
                    <Feather name="camera" size={18} color={theme.COLORS.white} />
                    <StyledText variant="caption" bold color={theme.COLORS.white}>Change Photo</StyledText>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholderHero}>
                  <View style={styles.cameraCircle}>
                    <Feather name="camera" size={32} color={theme.COLORS.primary} />
                  </View>
                  <StyledText variant="sectionHeader" color={theme.COLORS.primary} bold>Add Product Photo</StyledText>
                  <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ marginTop: 4 }}>
                    Real photos increase trust by 80%
                  </StyledText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Core Info Section */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Feather name="info" size={20} color={theme.COLORS.primary} />
              <StyledText variant="sectionHeader" bold>Core Listing Info</StyledText>
            </View>
            
            <CustomInput
              label="Product Name"
              placeholder="e.g. Fresh Tomatoes"
              icon="shopping-bag"
              value={formData.name}
              onChangeText={(t) => handleChange("name", t)}
            />

            <View style={styles.row}>
              <CustomInput
                label="Category"
                placeholder="Vegetables"
                icon="grid"
                style={{ flex: 1, marginRight: theme.SPACING.md }}
                value={formData.category}
                onChangeText={(t) => handleChange("category", t)}
              />
              <CustomInput
                label="Unit"
                placeholder="kg"
                icon="layers"
                style={{ flex: 1 }}
                value={formData.unitType}
                onChangeText={(t) => handleChange("unitType", t)}
              />
            </View>

            <View style={styles.row}>
              <CustomInput
                label="Price"
                placeholder="0.00"
                icon="tag"
                prefix="₹"
                suffix={`/${formData.unitType}`}
                keyboardType="numeric"
                style={{ flex: 1.2, marginRight: theme.SPACING.md }}
                value={formData.price}
                onChangeText={(t) => handleChange("price", t)}
              />
              <CustomInput
                label="Stock"
                placeholder="100"
                icon="package"
                keyboardType="numeric"
                style={{ flex: 1 }}
                value={formData.stockQty}
                onChangeText={(t) => handleChange("stockQty", t)}
              />
            </View>
          </View>

          {/* Quality & Trust Section */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Feather name="shield" size={20} color={theme.COLORS.primary} />
              <StyledText variant="sectionHeader" bold>Quality & Trust</StyledText>
            </View>

            <View style={{ marginBottom: 20 }}>
              <StyledText variant="label" color={theme.COLORS.textSecondary} style={{ marginBottom: 8 }}>
                Harvest / Picking Date
              </StyledText>
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Feather name="calendar" size={18} color={theme.COLORS.primary} />
                <StyledText style={{ marginLeft: 10 }}>
                  {formData.harvestDate || "Select Date"}
                </StyledText>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={formData.harvestDate ? new Date(formData.harvestDate) : new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
            </View>

            <StyledText variant="label" color={theme.COLORS.textSecondary} style={{ marginBottom: 8 }}>
              Quality Grade
            </StyledText>
            <View style={styles.pillSelector}>
              {["A", "B", "MIXED"].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.pill, formData.grade === val && styles.pillActive]}
                  onPress={() => handleChange("grade", val)}
                  activeOpacity={0.7}
                >
                  <Feather 
                    name={val === "A" ? "star" : val === "B" ? "thumbs-up" : "package"} 
                    size={14} 
                    color={formData.grade === val ? theme.COLORS.white : theme.COLORS.textSecondary} 
                    style={{ marginRight: 6 }}
                  />
                  <StyledText 
                    variant="caption" 
                    bold 
                    color={formData.grade === val ? theme.COLORS.white : theme.COLORS.textSecondary}
                  >
                    {val}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <StyledText variant="bodyPrimary" bold>Organic Certified</StyledText>
                  <StyledText variant="caption" color={theme.COLORS.textSecondary}>
                    Grown without synthetic pesticides
                  </StyledText>
                </View>
                <Switch
                  value={formData.isOrganic}
                  onValueChange={(val) => handleChange("isOrganic", val)}
                  trackColor={{ true: theme.COLORS.primary, false: theme.COLORS.border }}
                  thumbColor={formData.isOrganic ? theme.COLORS.white : '#f4f3f4'}
                />
              </View>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <StyledText variant="bodyPrimary" bold>Chemical Free</StyledText>
                  <StyledText variant="caption" color={theme.COLORS.textSecondary}>
                    No post-harvest chemical treatment
                  </StyledText>
                </View>
                <Switch
                  value={formData.isChemicalFree}
                  onValueChange={(val) => handleChange("isChemicalFree", val)}
                  trackColor={{ true: theme.COLORS.primary, false: theme.COLORS.border }}
                  thumbColor={formData.isChemicalFree ? theme.COLORS.white : '#f4f3f4'}
                />
              </View>
            </View>
          </View>

          {/* Logistics Section */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Feather name="truck" size={20} color={theme.COLORS.primary} />
              <StyledText variant="sectionHeader" bold>Logistics & Delivery</StyledText>
            </View>

            <View style={styles.row}>
              <CustomInput
                label="Min Order"
                placeholder="1"
                icon="minus-circle"
                suffix={formData.unitType}
                keyboardType="numeric"
                style={{ flex: 1, marginRight: theme.SPACING.md }}
                value={formData.minQty}
                onChangeText={(t) => handleChange("minQty", t)}
              />
              <CustomInput
                label="Max Order"
                placeholder="100"
                icon="plus-circle"
                suffix={formData.unitType}
                keyboardType="numeric"
                style={{ flex: 1 }}
                value={formData.maxQty}
                onChangeText={(t) => handleChange("maxQty", t)}
              />
            </View>
            <View style={styles.row}>
              <CustomInput
                label="Delivery Radius"
                placeholder="10"
                icon="map-pin"
                suffix="km"
                keyboardType="numeric"
                style={{ flex: 1, marginRight: theme.SPACING.md }}
                value={formData.deliveryRadius}
                onChangeText={(t) => handleChange("deliveryRadius", t)}
              />
              <CustomInput
                label="Delivery Charge"
                placeholder="30"
                icon="truck"
                prefix="₹"
                keyboardType="numeric"
                style={{ flex: 1 }}
                value={formData.delivery_charge}
                onChangeText={(t) => handleChange("delivery_charge", t)}
              />
            </View>
          </View>

          {/* Bulk Pricing Section */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Feather name="trending-down" size={20} color={theme.COLORS.primary} />
              <StyledText variant="sectionHeader" bold>Bulk Pricing (Optional)</StyledText>
            </View>

            {formData.bulkPricing.map((tier, index) => (
              <View key={index} style={styles.bulkTierCard}>
                <View style={styles.tierInfo}>
                  <StyledText variant="bodySecondary" bold color={theme.COLORS.primary}>
                    {tier.min}{tier.max ? `-${tier.max}` : '+'} {formData.unitType}
                  </StyledText>
                  <StyledText variant="bodyPrimary" bold>₹{tier.price.toFixed(2)}</StyledText>
                </View>
                <TouchableOpacity onPress={() => removeTier(index)} style={styles.removeTierBtn}>
                  <Feather name="x-circle" size={18} color={theme.COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addTierCard}>
              <View style={styles.row}>
                <CustomInput
                  placeholder="Min"
                  keyboardType="numeric"
                  style={{ flex: 1, marginRight: theme.SPACING.sm, marginBottom: 0 }}
                  inputStyle={{ height: 48 }}
                  value={newTier.min}
                  onChangeText={(t) => setNewTier(prev => ({ ...prev, min: t }))}
                />
                <CustomInput
                  placeholder="Max"
                  keyboardType="numeric"
                  style={{ flex: 1, marginRight: theme.SPACING.sm, marginBottom: 0 }}
                  inputStyle={{ height: 48 }}
                  value={newTier.max}
                  onChangeText={(t) => setNewTier(prev => ({ ...prev, max: t }))}
                />
                <CustomInput
                  placeholder="Price"
                  keyboardType="numeric"
                  prefix="₹"
                  style={{ flex: 1.5, marginRight: theme.SPACING.sm, marginBottom: 0 }}
                  inputStyle={{ height: 48 }}
                  value={newTier.price}
                  onChangeText={(t) => setNewTier(prev => ({ ...prev, price: t }))}
                />
                <TouchableOpacity style={styles.addTierIconButton} onPress={addTier}>
                  <Feather name="plus" size={22} color={theme.COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Delete Action at the bottom */}
          <View style={{ paddingVertical: theme.SPACING.xl, alignItems: 'center' }}>
            <PrimaryButton 
              title="Delete This Product"
              variant="destructive"
              icon={<Feather name="trash-2" size={18} color={theme.COLORS.error} />}
              onPress={handleDelete}
              style={{ width: '80%' }}
            />
          </View>
        </ScrollView>
        <BottomNextBar
          label={loading ? "Saving..." : "Save Changes"}
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
    backgroundColor: theme.COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.SPACING.xxl,
  },
  imageSection: {
    padding: theme.SPACING.md,
  },
  imagePickerHero: {
    height: 240,
    borderRadius: theme.BORDER_RADIUS.lg,
    backgroundColor: theme.COLORS.white,
    ...theme.SHADOWS.medium,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.COLORS.white,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: theme.SPACING.md,
    right: theme.SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.full,
    gap: 8,
  },
  imagePlaceholderHero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.primaryLight + '50',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: theme.COLORS.primary,
    borderRadius: theme.BORDER_RADIUS.lg,
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.SHADOWS.light,
    marginBottom: theme.SPACING.md,
  },
  cardSection: {
    backgroundColor: theme.COLORS.white,
    marginHorizontal: theme.SPACING.md,
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    borderRadius: theme.BORDER_RADIUS.lg,
    ...theme.SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.lg,
    gap: theme.SPACING.sm,
  },
  row: {
    flexDirection: 'row',
  },
  pillSelector: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.background,
    padding: 4,
    borderRadius: theme.BORDER_RADIUS.full,
    marginBottom: 20,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  pillActive: {
    backgroundColor: theme.COLORS.primary,
    ...theme.SHADOWS.light,
  },
  switchGroup: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  bulkTierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.primaryLight + '30',
    padding: 14,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.COLORS.primaryLight,
  },
  tierInfo: {
    flex: 1,
  },
  removeTierBtn: {
    padding: 10,
  },
  addTierCard: {
    marginTop: 16,
    backgroundColor: theme.COLORS.background,
    padding: 14,
    borderRadius: theme.BORDER_RADIUS.md,
  },
  addTierIconButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.COLORS.primary,
    borderRadius: theme.BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.SHADOWS.light,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background,
    padding: 14,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    minHeight: 48,
  },
});

export default EditProductScreen;
