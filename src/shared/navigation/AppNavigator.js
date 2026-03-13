import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SellerDashboard from '../../seller/screens/SellerDashboard';
import SellerProductsScreen from '../../seller/screens/SellerProductsScreen';
import SellerOrdersScreen from '../../seller/screens/SellerOrdersScreen';
import SellerOrderDetailScreen from '../../seller/screens/SellerOrderDetailScreen';
import AddProductScreen from '../../seller/screens/AddProductScreen';
import EditProductScreen from '../../seller/screens/EditProductScreen';
import BuyerDashboard from '../../buyer/screens/BuyerDashboard';
import BuyerPurchasesScreen from '../../buyer/screens/BuyerPurchasesScreen';
import BuyerActiveOrdersScreen from '../../buyer/screens/BuyerActiveOrdersScreen';
import MarketplaceScreen from '../../buyer/screens/MarketplaceScreen';
import ProductDetailScreen from '../../buyer/screens/ProductDetailScreen';
import CheckoutScreen from '../../buyer/screens/CheckoutScreen';
import CartScreen from '../../buyer/screens/CartScreen';
import BuyerOrderDetailScreen from '../../buyer/screens/BuyerOrderDetailScreen';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth flow */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Seller linear flow */}
      <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerOrderDetail" component={SellerOrderDetailScreen} />

      {/* Buyer linear flow */}
      <Stack.Screen name="BuyerDashboard" component={BuyerDashboard} />
      <Stack.Screen name="BuyerPurchases" component={BuyerPurchasesScreen} />
      <Stack.Screen name="BuyerActiveOrders" component={BuyerActiveOrdersScreen} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="BuyerOrderDetail" component={BuyerOrderDetailScreen} />
    </Stack.Navigator>
  );
};
