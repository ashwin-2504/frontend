import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Pressable, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import PrimaryButton from "../../shared/components/PrimaryButton";
import apiService from "../../shared/services/apiService";
import { useAuth } from "../../shared/context/AuthContext";
import { useCart } from "../../shared/context/CartContext";
import { TopBar } from "../../shared/components/ScreenActions";
import ErrorBanner from "../../shared/components/ErrorBanner";
import { announceMessage } from "../../shared/utils/accessibility";
import { useFocusEffect } from "@react-navigation/native";
import { formatCurrency } from "../../shared/utils/formatters";
import RazorpayCheckout from "../../shared/components/RazorpayCheckout";


const CheckoutScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { clearCart, setIsLocked } = useCart();

  // Support both old (single product) and new (multi-item) params
  const routeItems = route.params?.items;
  const routeProduct = route.params?.product;
  const initialItems = routeItems
    ? routeItems
    : routeProduct
    ? [{ ...routeProduct, productId: routeProduct.productId, quantity: routeProduct.quantity || 1 }]
    : [];

  const [checkoutItems, setCheckoutItems] = useState(initialItems);
  const [step, setStep] = useState(1); // 1: Review, 2: Shipping, 3: Finalize (Payment + Confirm)
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
  const CHECKOUT_ADDRESS_KEY = `@bharatmandi_checkout_address:${user?.id}`;

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || "",
    address: "",
    phone: user?.phone || "",
    pincode: "",
  });

  // Group items by seller and calculate deliverables
  const sellerGroups = React.useMemo(() => {
    const groups = {};
    checkoutItems.forEach(item => {
      const sId = item.sellerId || 'unknown';
      if (!groups[sId]) {
        groups[sId] = {
          sellerId: sId,
          sellerName: item.sellerName || 'Farmer',
          items: [],
          subtotal: 0,
          deliveryCharge: item.delivery_charge ?? 30, // Fallback to 30
          isDeliverable: true, // Preview logic placeholder
          distance: 0,
          sellerLocation: item.location || { lat: 0, lng: 0 }
        };
      }
      
      const qty = Number(item.quantity || item.qty || 0);
      const price = Number(item.price || item.priceAtPurchase || 0);
      
      groups[sId].items.push(item);
      groups[sId].subtotal += (price * qty);
    });
    return Object.values(groups);
  }, [checkoutItems]);

  const totalSubtotal = sellerGroups.reduce((sum, g) => sum + Number(g.subtotal), 0);
  const totalDelivery = sellerGroups.reduce((sum, g) => sum + Number(g.deliveryCharge), 0);
  const totalAmount = totalSubtotal + totalDelivery;


  useFocusEffect(
    React.useCallback(() => {
      const loadAddresses = async () => {
        try {
          const data = await apiService.getAddresses();
          const addressData = Array.isArray(data) ? data : data.data || [];
          setAddresses(addressData);

          const savedAddressId = await AsyncStorage.getItem(CHECKOUT_ADDRESS_KEY);

          if (addressData.length > 0) {
            let target = addressData.find(a => a.id === savedAddressId);
            if (!target) {
              target = addressData.find(a => a.isDefault) || addressData[0];
            }

            setSelectedAddress(target);
            setShippingInfo(prev => ({
              ...prev,
              address: target.fullAddress,
              pincode: target.pincode,
            }));
          }
        } catch (_error) {
          console.warn("Failed to fetch addresses:", _error);
        }
      };

      loadAddresses();

      // Implement Back Guard
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (loading || paymentLoading || checkoutItems.length === 0) return;

        e.preventDefault();

        Alert.alert(
          "Leave Checkout?",
          "Your cart items will be saved. Do you want to leave?",
          [
            { text: "Stay", style: "cancel", onPress: () => {} },
            {
              text: "Leave",
              style: "destructive",
              onPress: () => navigation.dispatch(e.data.action),
            },
          ]
        );
      });

      return () => unsubscribe();
    }, [navigation, loading, paymentLoading, checkoutItems.length, CHECKOUT_ADDRESS_KEY])
  );

  const handleSelectAddress = async (addr) => {
    setSelectedAddress(addr);
    setShippingInfo({...shippingInfo, address: addr.fullAddress, pincode: addr.pincode});
    if (addr.id) {
       await AsyncStorage.setItem(CHECKOUT_ADDRESS_KEY, addr.id);
    }
  };

  const handleNextToShipping = () => {
    setStep(2);
  };

  const handleNextToFinalize = () => {
    if (!selectedAddress && (!shippingInfo.address || !shippingInfo.pincode)) {
      const message = "Please select or enter shipping address and pincode.";
      setErrorMessage(message);
      announceMessage(message);
      return;
    }
    setErrorMessage("");
    setStep(3);
  };

  // Mock Payment Flow
  const processMockPayment = async () => {
    setPaymentLoading(true);
    setErrorMessage("");
    
    // Simulate gateway delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For MVP/Demo: Always succeed unless specifically testing error paths
    const isSuccess = true; 
    
    if (isSuccess) {
      const mId = `mock_${Date.now()}`;
      setPaymentId(mId);
      setPaymentLoading(false);
      return mId;
    } else {
      setPaymentLoading(false);
      throw new Error("Payment gateway temporarily unavailable. Please try again.");
    }
  };

  const [checkoutPhase, setCheckoutPhase] = useState("READY"); // READY | INITIATING | PAYING | CONFIRMING | SUCCESS | FAILED
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [idempotencyKey] = useState(`order_${Date.now()}_${user?.id}`);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [recoverableOrder, setRecoverableOrder] = useState(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [razorpayVisible, setRazorpayVisible] = useState(false);

  // RECOVERY EFFECT
  useEffect(() => {
    const checkRecovery = async () => {
      if (!user?.id) return;
      try {
        const res = await apiService.getActiveOrder();
        if (res.success && res.order) {
          setRecoverableOrder(res.order);
        }
      } catch (error) {
        console.warn("Recovery lookup failed:", error);
      }
    };
    checkRecovery();
  }, [user?.id]);

  const resumeOrder = (order) => {
    setActiveOrderId(order.orderId);
    setPaymentId(order.paymentId || null);
    setRecoverableOrder(null);
    
    if (order.items) {
      setCheckoutItems(order.items);
    }
    
    // Jump to Finalize step since order & address are already on server
    setStep(3);
    
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'SUCCESS') {
      setPaymentVerified(true);
      Alert.alert("Resuming Order", "Payment was already successful. Finalizing your order now...");
      // The effect of setting state might take a tick, but handleCheckoutSequence 
      // will pick it up when called by the button or an automated trigger.
    } else {
      Alert.alert("Resuming Order", `Picking up order #${order.orderId}`);
    }
  };

  const handleCheckoutSequence = async () => {
    if (!user?.id) {
       Alert.alert("Error", "User session not found.");
       return;
    }

    setLoading(true);
    setErrorMessage("");
    setIsLocked(true); // LOCK CART

    try {
      let currentOrder = null;
      let pId = paymentId;

      // PHASE 1: INITIATE (T1)
      if (!activeOrderId) {
        setCheckoutPhase("INITIATING");
        const payload = {
          uid: user.id,
          idempotency_key: idempotencyKey,
          addressSnapshot: selectedAddress || {
            id: 'manual',
            label: 'Current Location',
            fullAddress: shippingInfo.address,
            pincode: shippingInfo.pincode,
            city: '',
            state: '',
          },
          items: checkoutItems.map(i => ({ 
            productId: i.productId, 
            sellerId: i.sellerId,
            qty: Number(i.quantity || i.qty || 0), 
            priceAtPurchase: Number(i.price || i.priceAtPurchase || 0)
          }))
        };
        const initRes = await apiService.initiateOrder(payload);
        currentOrder = initRes.data;
        setActiveOrderId(currentOrder.orderId);
      } else {
        // Resume logic: Order already exists
        currentOrder = { orderId: activeOrderId, lockedAmount: totalAmount };
      }

      // PHASE 2: PAYMENT INTENT (T2)
      // Call intent if we don't have a paymentId yet
      if (!pId) {
        setCheckoutPhase("PAYING");
        const intentRes = await apiService.createIntent({ 
          orderId: currentOrder.orderId, 
          amount: currentOrder.lockedAmount || totalAmount 
        });
        pId = intentRes.paymentId;
        setPaymentId(pId);
        
        if (intentRes.providerOrderId) {
            setRazorpayOrderId(intentRes.providerOrderId);
            setRazorpayVisible(true);
            setLoading(false); // Stop loading spinner while modal is open
            return; // Wait for Razorpay callback
        }
      }

      // If we are here and have no providerOrderId, it might be a Resume or Mock
      if (!paymentVerified && !razorpayOrderId) {
           await processMockPayment();
           setPaymentVerified(true);
           // After mock payment, we continue to confirm
           handleConfirmPhase(currentOrder.orderId, pId);
      }

    } catch (error) {
      handleCheckoutError(error);
    }
  };

  const handleConfirmPhase = async (orderId, pId, paymentDetails = {}) => {
    setLoading(true);
    setCheckoutPhase("CONFIRMING");
    try {
      const confirmPayload = {
        orderId: orderId,
        paymentId: pId,
        idempotencyKeyConfirm: `confirm_${orderId}_${pId}`,
        ...paymentDetails
      };

      const finalRes = await apiService.confirmOrder(confirmPayload);
      const finalizedOrder = finalRes.data;

      // SUCCESS
      setCheckoutPhase("SUCCESS");
      clearCart();
      announceMessage("Order placed successfully");
      
      navigation.reset({
        index: 0,
        routes: [{ 
          name: "CheckoutSuccess", 
          params: { orderId: finalizedOrder.orderId, amount: finalizedOrder.totalAmount } 
        }],
      });
    } catch (error) {
      handleCheckoutError(error);
    } finally {
      setLoading(false);
      setIsLocked(false);
    }
  };

  const handleCheckoutError = (error) => {
    setCheckoutPhase("FAILED");
    let msg = error.message;
    
    if (msg.includes("POST_PAYMENT_STOCK_FAILURE")) {
      msg = "Payment successful, but items went out of stock. Our team will contact you for a refund.";
      setActiveOrderId(null);
    } else if (msg.includes("INSUFFICIENT_STOCK")) {
      msg = "Some items in your cart are no longer available.";
      setActiveOrderId(null);
    } else if (msg.includes("OUT_OF_RADIUS")) {
      msg = "Delivery not available for some items at your location.";
      setActiveOrderId(null);
    } else if (msg.includes("DUPLICATE_ORDER") || msg.includes("INVALID_ORDER_STATE")) {
      setActiveOrderId(null);
    }

    setErrorMessage(msg);
    Alert.alert("Checkout Failed", msg);
    setLoading(false);
    setIsLocked(false);
  };

  const onRazorpaySuccess = (data) => {
    setRazorpayVisible(false);
    setPaymentVerified(true);
    handleConfirmPhase(activeOrderId, paymentId, data);
  };

  const onRazorpayFailure = (error) => {
    setRazorpayVisible(false);
    Alert.alert("Payment Failed", error.description || "The payment could not be completed.");
    // Notify backend of failure
    apiService.reportPaymentFailure({ 
        orderId: activeOrderId, 
        reason: error.code || "RAZORPAY_FAILURE" 
    });
    setLoading(false);
    setIsLocked(false);
  };

  const renderStepHeader = () => {
    const stepNode = (index, label) => {
      const isCompleted = step > index;
      const isActive = step === index;
      
      return (
        <View style={styles.stepContainer}>
          <Pressable
            onPress={() => {
              if (index < step) {
                setStep(index);
              }
            }}
            style={[
                styles.stepCircle, 
                isActive && styles.activeStep,
                !isActive && !isCompleted && styles.futureStep,
                isCompleted && styles.completedStep
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Step ${index}: ${label}`}
          >
            {isCompleted ? (
              <Feather name="check" size={16} color={theme.COLORS.white} />
            ) : (
              <StyledText variant="caption" bold color={isActive ? theme.COLORS.white : theme.COLORS.textSecondary}>
                {index}
              </StyledText>
            )}
          </Pressable>
          <StyledText variant="caption" style={styles.stepLabel} color={isActive ? theme.COLORS.primary : theme.COLORS.textSecondary} bold={isActive}>{label}</StyledText>
        </View>
      );
    };

    return (
      <View style={styles.stepHeader}>
        {stepNode(1, "Items")}
        <View style={[styles.stepLine, step > 1 && styles.stepLineActive]} />
        {stepNode(2, "Address")}
        <View style={[styles.stepLine, step > 2 && styles.stepLineActive]} />
        {stepNode(3, "Finalize")}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Checkout" onBack={() => navigation.goBack()} />

      <RazorpayCheckout
        visible={razorpayVisible}
        orderId={razorpayOrderId}
        amount={totalAmount}
        keyId={process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}
        onSuccess={onRazorpaySuccess}
        onFailure={onRazorpayFailure}
        onClose={() => {
            setRazorpayVisible(false);
            setLoading(false);
            setIsLocked(false);
        }}
      />

      {/* RECOVERY BANNER */}
      {recoverableOrder && checkoutPhase === "READY" && (
        <View style={styles.recoveryBanner}>
          <StyledText variant="bodySecondary" bold color="#92400E" style={{ flex: 1, marginRight: 10 }}>You have a pending order from a previous session.</StyledText>
          <TouchableOpacity 
            style={styles.resumeButton}
            onPress={() => resumeOrder(recoverableOrder)}
          >
            <StyledText variant="bodySecondary" bold color="#FFF">Resume Checkout</StyledText>
          </TouchableOpacity>
        </View>
      )}

      {renderStepHeader()}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ErrorBanner message={errorMessage} />
        
        {!user?.lastKnownLocation && (
          <View style={[styles.card, { backgroundColor: '#FFF9C4', borderColor: '#FBC02D' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="navigation" size={18} color="#F57F17" />
              <StyledText variant="bodySecondary" bold color="#F57F17" style={{ marginLeft: 8, flex: 1 }}>
                Location Recommended
              </StyledText>
            </View>
            <StyledText variant="caption" color="#F57F17" style={{ marginTop: 4 }}>
              Enable location permissions for faster delivery validation. Falling back to Pincode verification.
            </StyledText>
          </View>
        )}

        {step === 1 && (
          <View>
            {sellerGroups.map((group) => (
              <View key={group.sellerId} style={styles.card}>
                <View style={[styles.cardHeader, { marginBottom: 12 }]}>
                  <Feather name="truck" size={18} color={theme.COLORS.primary} />
                  <StyledText variant="bodyPrimary" bold style={{ marginLeft: 8 }}>
                    Sold by: {group.sellerName}
                  </StyledText>
                </View>

                {group.items.map((item, index) => (
                  <View key={item.productId || index} style={styles.itemRow}>
                    <View style={styles.imageContainer}>
                      {item.imageUrls?.[0] ? (
                        <Image source={{ uri: item.imageUrls[0] }} style={styles.image} />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Feather name="package" size={24} color={theme.COLORS.textSecondary} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: theme.SPACING.md }}>
                      <StyledText variant="bodyPrimary" bold>{item.name}</StyledText>
                      <StyledText variant="bodySecondary" bold color={theme.COLORS.primary} style={{ marginTop: 4 }}>
                        {formatCurrency(item.price)} × {item.quantity}
                      </StyledText>
                    </View>
                  </View>
                ))}

                <View style={styles.sellerSummary}>
                  <View style={styles.summaryRow}>
                    <StyledText variant="caption" color={theme.COLORS.textSecondary}>Seller Subtotal</StyledText>
                    <StyledText variant="caption" bold>{formatCurrency(group.subtotal)}</StyledText>
                  </View>
                  <View style={styles.summaryRow}>
                    <StyledText variant="caption" color={theme.COLORS.textSecondary}>Delivery Fee</StyledText>
                    <StyledText variant="caption" bold color={theme.COLORS.success}>
                      {Number(group.deliveryCharge) === 0 ? "FREE" : formatCurrency(group.deliveryCharge)}
                    </StyledText>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.card}>
              <StyledText variant="sectionHeader" bold color={theme.COLORS.textPrimary} style={{ marginBottom: 16 }}>
                Order Total
              </StyledText>
              <View style={styles.summaryRow}>
                <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Items Total</StyledText>
                <StyledText variant="bodySecondary" bold>{formatCurrency(totalSubtotal)}</StyledText>
              </View>
              <View style={styles.summaryRow}>
                <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Delivery Total</StyledText>
                <StyledText variant="bodySecondary" bold>{formatCurrency(totalDelivery)}</StyledText>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <StyledText variant="bodyPrimary" bold>Grand Total</StyledText>
                <StyledText variant="bodyPrimary" bold color={theme.COLORS.primary} style={{ fontSize: 22 }}>
                  {formatCurrency(totalAmount)}
                </StyledText>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <StyledText variant="sectionHeader" bold color={theme.COLORS.textPrimary} style={{ marginBottom: theme.SPACING.md }}>
              Shipping Details
            </StyledText>
            
            {addresses.length > 0 && (
              <View style={styles.addressSelector}>
                <StyledText variant="label" color={theme.COLORS.textSecondary} style={{ marginBottom: 8 }}>Select Saved Address</StyledText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.SPACING.md }}>
                  {addresses.map((addr) => (
                    <TouchableOpacity 
                      key={addr.id} 
                      style={[styles.addressCard, selectedAddress?.id === addr.id && styles.selectedAddressCard]}
                      onPress={() => handleSelectAddress(addr)}
                    >
                      <StyledText variant="bodySecondary" bold color={selectedAddress?.id === addr.id ? theme.COLORS.primary : theme.COLORS.textPrimary}>
                        {addr.label}
                      </StyledText>
                      <StyledText variant="caption" numberOfLines={1} color={theme.COLORS.textSecondary}>{addr.fullAddress}</StyledText>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={[styles.addressCard, !selectedAddress && styles.selectedAddressCard]}
                    onPress={() => setSelectedAddress(null)}
                  >
                    <StyledText variant="bodySecondary" bold color={!selectedAddress ? theme.COLORS.primary : theme.COLORS.textPrimary}>
                      New Address
                    </StyledText>
                    <StyledText variant="caption" color={theme.COLORS.textSecondary}>Enter details manually</StyledText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {!selectedAddress && (
              <>
                <View style={styles.inputGroup}>
                  <StyledText variant="label" color={theme.COLORS.textSecondary} style={{ marginBottom: 4 }}>Shipping Address</StyledText>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    multiline
                    value={shippingInfo.address}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, address: text})}
                    placeholder="Enter full address"
                    placeholderTextColor={theme.COLORS.textSecondary + "99"}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <StyledText variant="label" color={theme.COLORS.textSecondary} style={{ marginBottom: 4 }}>Pincode</StyledText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={shippingInfo.pincode}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, pincode: text})}
                    placeholder="6-digit pincode"
                    placeholderTextColor={theme.COLORS.textSecondary + "99"}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.checkboxRow} 
                  onPress={() => setSaveAddressForFuture(!saveAddressForFuture)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, saveAddressForFuture && styles.checkboxActive]}>
                    {saveAddressForFuture && <Feather name="check" size={12} color={theme.COLORS.white} />}
                  </View>
                  <StyledText variant="caption" color={theme.COLORS.textPrimary} style={{ marginLeft: 10 }}>
                    Save this address for future orders
                  </StyledText>
                </TouchableOpacity>
              </>
            )}
            
            <View style={styles.inputGroup}>
              <StyledText variant="label" color={theme.COLORS.textSecondary} style={{ marginBottom: 4 }}>Phone Number</StyledText>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={shippingInfo.phone}
                onChangeText={(text) => setShippingInfo({...shippingInfo, phone: text})}
                placeholder="10 digit phone number"
                placeholderTextColor={theme.COLORS.textSecondary + "99"}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <>
          {/* Order Summary */}
          <View style={styles.card}>
            <View style={[styles.cardHeader, { marginBottom: 12 }]}>
              <Feather name="package" size={18} color={theme.COLORS.primary} />
              <StyledText variant="sectionHeader" bold style={{ marginLeft: 8 }}>Order Summary</StyledText>
            </View>
            {checkoutItems.map((item, index) => (
              <View key={item.productId || index} style={[styles.itemRow, { marginBottom: 8 }]}>
                <View style={styles.imageContainer}>
                  {item.imageUrls?.[0] ? (
                    <Image source={{ uri: item.imageUrls[0] }} style={styles.image} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Feather name="package" size={20} color={theme.COLORS.textSecondary} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: theme.SPACING.md }}>
                  <StyledText variant="bodyPrimary" bold numberOfLines={1}>{item.name}</StyledText>
                  <StyledText variant="caption" color={theme.COLORS.textSecondary}>
                    {formatCurrency(item.price || item.priceAtPurchase)} × {item.quantity || item.qty}
                  </StyledText>
                </View>
                <StyledText variant="bodySecondary" bold color={theme.COLORS.primary}>
                  {formatCurrency((item.price || item.priceAtPurchase || 0) * (item.quantity || item.qty || 0))}
                </StyledText>
              </View>
            ))}
          </View>

          {/* Shipping Address */}
          {selectedAddress && (
            <View style={styles.card}>
              <View style={[styles.cardHeader, { marginBottom: 8 }]}>
                <Feather name="map-pin" size={18} color={theme.COLORS.primary} />
                <StyledText variant="sectionHeader" bold style={{ marginLeft: 8 }}>Delivery Address</StyledText>
              </View>
              <StyledText variant="bodyPrimary" bold>{selectedAddress.label}</StyledText>
              <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={{ marginTop: 4 }}>
                {selectedAddress.fullAddress}
              </StyledText>
              {selectedAddress.pincode && (
                <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ marginTop: 2 }}>
                  PIN: {selectedAddress.pincode}
                </StyledText>
              )}
            </View>
          )}

          <View style={styles.card}>
            <View style={{ alignItems: "center", marginBottom: theme.SPACING.lg }}>
               <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.COLORS.primary + "10", justifyContent: "center", alignItems: "center", marginBottom: theme.SPACING.sm }}>
                <Feather name="credit-card" size={32} color={theme.COLORS.primary} />
              </View>
              <StyledText variant="sectionHeader" bold color={theme.COLORS.textPrimary}>Payment Options</StyledText>
            </View>

            <TouchableOpacity 
              style={[styles.paymentMethod, styles.selectedPayment]}
              activeOpacity={0.8}
            >
              <View style={styles.radioActive}>
                <View style={styles.radioInner} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <StyledText variant="bodyPrimary" bold>BharatMandi Secure Payment</StyledText>
                <StyledText variant="caption" color={theme.COLORS.textSecondary}>Pay via Credit/Debit/UPI/Wallets</StyledText>
              </View>
              <Feather name="shield" size={20} color={theme.COLORS.success} />
            </TouchableOpacity>

            <View style={[styles.summaryContainer, { marginTop: 24 }]}>
              <View style={styles.summaryRow}>
                <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Order Amount:</StyledText>
                <StyledText variant="bodySecondary" bold>{formatCurrency(totalSubtotal)}</StyledText>
              </View>
              <View style={styles.summaryRow}>
                <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Shipping Fee:</StyledText>
                <StyledText variant="bodySecondary" bold>{formatCurrency(totalDelivery)}</StyledText>
              </View>
              <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.COLORS.border }]}>
                <StyledText variant="bodyPrimary" bold style={{ fontSize: 18 }}>Payable Amount:</StyledText>
                <StyledText variant="bodyPrimary" bold color={theme.COLORS.primary} style={{ fontSize: 24 }}>{formatCurrency(totalAmount)}</StyledText>
              </View>
            </View>

            {paymentLoading ? (
              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
                <StyledText variant="caption" bold style={{ marginTop: 12 }}>Authenticating with bank...</StyledText>
              </View>
            ) : paymentId ? (
              <View style={[styles.successBox, { marginTop: 24 }]}>
                 <Feather name="check-circle" size={20} color={theme.COLORS.success} />
                 <StyledText variant="caption" bold color={theme.COLORS.success} style={{ marginLeft: 8 }}>
                   Payment Verified (ID: {paymentId.substring(0, 12)}...)
                 </StyledText>
              </View>
            ) : null}

          </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={
            step === 1 ? "Next: Address" : 
            step === 2 ? "Next: Payment" : 
            (checkoutPhase === "PAYING" ? "Processing Payment..." : 
             checkoutPhase === "CONFIRMING" ? "Confirming Order..." : 
             activeOrderId ? "Retry Checkout" : "Pay & Place Order")
          }
          onPress={step === 1 ? handleNextToShipping : step === 2 ? handleNextToFinalize : handleCheckoutSequence}
          disabled={
            loading || 
            paymentLoading || 
            (step === 2 && !selectedAddress && !shippingInfo.address) ||
            checkoutItems.length === 0
          }
          icon={(!loading && !paymentLoading) ? <Feather name="arrow-right" size={20} color={theme.COLORS.white} /> : <ActivityIndicator color={theme.COLORS.white} />}
        />
      </View>

      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
          <StyledText style={styles.loadingText} bold color={theme.COLORS.primary}>
            {checkoutPhase === "INITIATING" ? "Securing items..." :
             checkoutPhase === "PAYING" ? "Verifying payment..." :
             checkoutPhase === "CONFIRMING" ? "Finalizing order..." :
             "Processing..."}
          </StyledText>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.SPACING.lg,
    backgroundColor: theme.COLORS.white,
  },
  stepContainer: {
    alignItems: "center",
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeStep: {
    backgroundColor: theme.COLORS.primary,
  },
  stepNumber: {
    color: theme.COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  futureStep: {
    backgroundColor: theme.COLORS.background,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  completedStep: {
    backgroundColor: theme.COLORS.success,
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: theme.COLORS.border,
    marginHorizontal: theme.SPACING.xs,
    marginTop: -20,
  },
  stepLineActive: {
    backgroundColor: theme.COLORS.success,
  },

  scrollContent: {
    padding: theme.SPACING.lg,
  },
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.lg,
    ...theme.SHADOWS.light,
    marginBottom: theme.SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: theme.SPACING.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.SPACING.lg,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: theme.COLORS.background,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  itemCategory: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.COLORS.primary,
    marginTop: 4,
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
    paddingTop: theme.SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.SPACING.sm,
  },
  summaryLabel: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: theme.COLORS.textPrimary,
    fontWeight: "600",
  },
  totalRow: {
    marginTop: theme.SPACING.sm,
    paddingTop: theme.SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.primary,
  },
  inputGroup: {
    marginBottom: theme.SPACING.md,
  },
  label: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.COLORS.background,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    fontSize: 14,
    color: theme.COLORS.textPrimary,
  },
  confirmationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.SPACING.md,
  },
  confirmLabel: {
    color: theme.COLORS.textSecondary,
  },
  confirmValue: {
    fontWeight: "600",
    color: theme.COLORS.textPrimary,
  },
  confirmTotal: {
    fontWeight: "800",
    fontSize: 18,
    color: theme.COLORS.primary,
  },
  sellerSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.background,
  },
  selectedPayment: {
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primaryLight + '20',
  },
  radioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.COLORS.primary,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.success + '10',
    padding: 12,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.success + '30',
  },
  warningText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: theme.SPACING.lg,
  },
  footer: {
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.white,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  loadingText: {
    marginTop: theme.SPACING.md,
  },
  addressSelector: {
    marginBottom: theme.SPACING.md,
  },
  addressCard: {
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    marginRight: theme.SPACING.sm,
    width: 150,
    backgroundColor: theme.COLORS.white,
  },
  selectedAddressCard: {
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primaryLight,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  selectedText: {
    color: theme.COLORS.primary,
  },
  addressSub: {
    fontSize: 10,
    color: theme.COLORS.textSecondary,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: theme.COLORS.primary,
  },
  recoveryBanner: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoveryText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
    marginRight: 10,
  },
  resumeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;
