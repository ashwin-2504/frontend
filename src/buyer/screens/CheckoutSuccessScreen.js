import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../shared/theme/theme";
import StyledText from "../../shared/components/StyledText";
import PrimaryButton from "../../shared/components/PrimaryButton";
import { formatCurrency } from "../../shared/utils/formatters";

const CheckoutSuccessScreen = ({ route, navigation }) => {
  const { orderId, amount } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="check-circle" size={80} color={theme.COLORS.success} />
        </View>

        <StyledText variant="display" bold style={styles.title}>Order Placed!</StyledText>
        <StyledText variant="bodyPrimary" color={theme.COLORS.textSecondary} style={styles.subtitle}>
          Your order has been confirmed and is being processed by the sellers.
        </StyledText>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Order ID</StyledText>
            <StyledText variant="bodyPrimary" bold>#{orderId?.substring(0, 12).toUpperCase()}</StyledText>
          </View>
          <View style={styles.detailRow}>
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary}>Amount Paid</StyledText>
            <StyledText variant="bodyPrimary" bold color={theme.COLORS.primary}>{formatCurrency(amount)}</StyledText>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton 
            title="View Order Status" 
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: "BuyerActiveOrders" }],
            })}
            style={{ marginBottom: 16 }}
          />

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            })}
          >
            <StyledText variant="button" color={theme.COLORS.primary}>Continue Shopping</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.COLORS.success + "10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: theme.COLORS.background,
    borderRadius: theme.BORDER_RADIUS.lg,
    padding: 20,
    marginBottom: 60,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  footer: {
    width: "100%",
  },
  secondaryBtn: {
    height: 52,
    borderRadius: theme.BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.primary,
  }
});

export default CheckoutSuccessScreen;
