import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from "../../shared/theme/theme";
import PrimaryButton from "../../shared/components/PrimaryButton";
import apiService from "../../shared/services/apiService";
import { useAuth } from "../../shared/context/AuthContext";
import { useCart } from "../../shared/context/CartContext";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";

const CheckoutScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { clearCart } = useCart();

  // Support both old (single product) and new (multi-item) params
  const routeItems = route.params?.items;
  const routeProduct = route.params?.product;
  const items = routeItems
    ? routeItems
    : routeProduct
    ? [{ ...routeProduct, quantity: routeProduct.quantity || 1 }]
    : [];

  const totalAmount = route.params?.cartTotal
    ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  
  const [step, setStep] = useState(1); // 1: Select, 2: Init, 3: Confirm
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [flowId, setFlowId] = useState(null);
  const [flowReady, setFlowReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // On mount: let the backend create a session & flow
  useEffect(() => {
    let cancelled = false;
    const initFlow = async () => {
      setLoading(true);
      try {
        const result = await apiService.createFlow("agricultural_flow_1");
        if (cancelled) return;
        setSessionId(result.data.sessionId);
        setFlowId(result.data.flowId);
        setTransactionId(result.data.transactionId);
        setFlowReady(true);
      } catch (error) {
        if (cancelled) return;
        const message = "Could not initialize checkout. Please go back and try again.";
        setErrorMessage(message);
        announceMessage(message);
        Alert.alert("Connection Error", "Could not initialize checkout: " + error.message, [
          { text: "Go Back", onPress: () => navigation.goBack() },
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initFlow();
    return () => { cancelled = true; };
  }, []);

  // Step 1: Select (use first item as primary for ONDC flow)
  const handleSelect = async () => {
    if (!transactionId) {
      const message = "Transaction not ready. Please wait a few seconds.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", message);
      return;
    }
    setLoading(true);
    try {
      await apiService.select(transactionId, { 
        item_id: items[0]?.id,
        quantity: items[0]?.quantity 
      });
      setErrorMessage("");
      setStep(2);
    } catch (error) {
      const message = "Could not confirm selected items.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", "Failed to select item: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Init
  const handleInit = async () => {
    if (!transactionId) {
      const message = "Transaction ID is missing. Please restart checkout.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", message);
      return;
    }
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.phone) {
      const message = "Please fill all shipping details before moving ahead.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }
    setLoading(true);
    try {
      await apiService.init(transactionId, { 
        billing: shippingInfo,
        fulfillment: { type: "DELIVERY" }
      });
      setErrorMessage("");
      setStep(3);
    } catch (error) {
      const message = "Could not save your shipping details.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", "Failed to initialize order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Confirm
  const handleConfirm = async () => {
    if (!transactionId) {
      const message = "Transaction missing. Please restart checkout.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", message);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        customer_name: shippingInfo.name || "Demo Buyer",
        total_amount: totalAmount,
        seller_id: items[0]?.seller_id || "unknown_seller",
        buyer_id: user?.id || "buyer_default",
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        payment: { type: "COD", status: "PENDING" }
      };
      
      const result = await apiService.confirm(transactionId, payload);
      
      clearCart();
      setErrorMessage("");
      announceMessage("Order placed successfully");
      Alert.alert("Success", "Order placed successfully!", [
        { text: "OK", onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: "BuyerDashboard" }],
        }) }
      ]);
    } catch (error) {
      const message = "Order could not be confirmed. Please try again.";
      setErrorMessage(message);
      announceMessage(message);
      Alert.alert("Error", "Failed to confirm order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepHeader = () => {
    const stepNode = (index, label) => (
      <View style={styles.stepContainer}>
        <Pressable
          onPress={() => {
            if (index <= step) {
              setStep(index);
            }
          }}
          style={[styles.stepCircle, step >= index && styles.activeStep]}
          accessibilityRole="button"
          accessibilityLabel={`Step ${index}: ${label}`}
          accessibilityHint={index <= step ? "Open this completed step" : "Complete previous steps first"}
        >
          <Text allowFontScaling={true} style={styles.stepNumber}>{index}</Text>
        </Pressable>
        <Text allowFontScaling={true} style={styles.stepLabel}>{label}</Text>
      </View>
    );

    return (
      <View style={styles.stepHeader}>
        {stepNode(1, "Select")}
        <View style={styles.stepLine} />
        {stepNode(2, "Details")}
        <View style={styles.stepLine} />
        {stepNode(3, "Confirm")}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Checkout" onBack={() => navigation.goBack()} />

      {renderStepHeader()}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ErrorBanner message={errorMessage} />
        {step === 1 && (
          <View style={styles.card}>
            <Text allowFontScaling={true} style={styles.cardTitle}>Review Items ({items.length})</Text>
            {items.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={styles.itemImagePlaceholder}>
                  <Feather name="box" size={24} color={COLORS.textSecondary} />
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text allowFontScaling={true} style={styles.itemName}>{item.name}</Text>
                  <Text allowFontScaling={true} style={styles.itemCategory}>{item.category}</Text>
                  <Text allowFontScaling={true} style={styles.itemPrice}>₹{item.price} × {item.quantity}</Text>
                </View>
              </View>
            ))}
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{totalAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>₹0</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{totalAmount}</Text>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
              <Text allowFontScaling={true} style={styles.cardTitle}>Shipping Details</Text>
            <View style={styles.inputGroup}>
              <Text allowFontScaling={true} style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.name}
                onChangeText={(text) => setShippingInfo({...shippingInfo, name: text})}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text allowFontScaling={true} style={styles.label}>Shipping Address</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={shippingInfo.address}
                onChangeText={(text) => setShippingInfo({...shippingInfo, address: text})}
                placeholder="Enter your address"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text allowFontScaling={true} style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={shippingInfo.phone}
                onChangeText={(text) => setShippingInfo({...shippingInfo, phone: text})}
                placeholder="Enter your phone"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <View style={{ alignItems: "center", marginBottom: SPACING.lg }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.success + "20", justifyContent: "center", alignItems: "center", marginBottom: SPACING.sm }}>
                <Feather name="check" size={32} color={COLORS.success} />
              </View>
              <Text allowFontScaling={true} style={styles.cardTitle}>Ready to Place Order</Text>
              <Text allowFontScaling={true} style={{ textAlign: "center", color: COLORS.textSecondary, marginTop: 4 }}>Review your final details below.</Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text allowFontScaling={true} style={styles.confirmLabel}>Payment Method:</Text>
              <Text allowFontScaling={true} style={styles.confirmValue}>Cash on Delivery</Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text allowFontScaling={true} style={styles.confirmLabel}>Total Amount:</Text>
              <Text allowFontScaling={true} style={styles.confirmTotal}>₹{totalAmount}</Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text allowFontScaling={true} style={styles.confirmLabel}>Delivery to:</Text>
              <Text allowFontScaling={true} style={styles.confirmValue}>{shippingInfo.name || "Not provided"}</Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text allowFontScaling={true} style={styles.confirmLabel}>Items:</Text>
              <Text allowFontScaling={true} style={styles.confirmValue}>{items.length} item(s)</Text>
            </View>
            <Text allowFontScaling={true} style={styles.warningText}>Please verify your details before placing the order.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={step === 3 ? "Place Order" : "Proceed"}
          onPress={step === 1 ? handleSelect : step === 2 ? handleInit : handleConfirm}
          disabled={loading}
          icon={!loading ? <Feather name="arrow-right" size={20} color={COLORS.white} /> : <ActivityIndicator color={COLORS.white} />}
          accessibilityHint={step === 3 ? "This will place your order" : "This will save progress and move to the next step"}
        />
      </View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Communicating with ONDC Network...</Text>
        </View>
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
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  stepContainer: {
    alignItems: "center",
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeStep: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
    marginTop: -15,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 4,
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  totalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  quantityControls: { 
    flexDirection: "row", 
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  controlBtn: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: COLORS.background, 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityText: { 
    marginHorizontal: SPACING.md, 
    fontSize: 14, 
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  confirmationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  confirmLabel: {
    color: COLORS.textSecondary,
  },
  confirmValue: {
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  confirmTotal: {
    fontWeight: "800",
    fontSize: 18,
    color: COLORS.primary,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: SPACING.lg,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default CheckoutScreen;
