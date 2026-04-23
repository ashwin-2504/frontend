import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';

// Sub-screens (not in tabs)
import SellerOrderDetailScreen from '../../seller/screens/SellerOrderDetailScreen';
import AddProductScreen from '../../seller/screens/AddProductScreen';
import EditProductScreen from '../../seller/screens/EditProductScreen';
import ProductDetailScreen from '../../buyer/screens/ProductDetailScreen';
import CheckoutScreen from '../../buyer/screens/CheckoutScreen';
import BuyerOrderDetailScreen from '../../buyer/screens/BuyerOrderDetailScreen';
import BuyerPurchasesScreen from '../../buyer/screens/BuyerPurchasesScreen';
import BuyerActiveOrdersScreen from '../../buyer/screens/BuyerActiveOrdersScreen';
import CheckoutSuccessScreen from '../../buyer/screens/CheckoutSuccessScreen';


const Stack = createStackNavigator();

export const AppNavigator = ({ initialRouteName = "Login" }) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth flow */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Main Authenticated Flow */}
      <Stack.Screen name="Main" component={MainTabNavigator} />

      {/* Sub-flows (Stack) */}
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="SellerOrderDetail" component={SellerOrderDetailScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="BuyerOrderDetail" component={BuyerOrderDetailScreen} />
      <Stack.Screen name="BuyerPurchases" component={BuyerPurchasesScreen} />
      <Stack.Screen name="BuyerActiveOrders" component={BuyerActiveOrdersScreen} />
      <Stack.Screen name="CheckoutSuccess" component={CheckoutSuccessScreen} />
    </Stack.Navigator>

  );
};
