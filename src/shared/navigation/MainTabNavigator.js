import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { isSellerRole } from '../utils/roleUtils';

// Buyer Screens
import BuyerDashboard from '../../buyer/screens/BuyerDashboard';
import MarketplaceScreen from '../../buyer/screens/MarketplaceScreen';
import CartScreen from '../../buyer/screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Seller Screens
import SellerDashboard from '../../seller/screens/SellerDashboard';
import SellerProductsScreen from '../../seller/screens/SellerProductsScreen';
import SellerOrdersScreen from '../../seller/screens/SellerOrdersScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const insets = useSafeAreaInsets();

  const isSeller = isSellerRole(user?.role);
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.COLORS.primary,
        tabBarInactiveTintColor: theme.COLORS.textSecondary,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 10,
        },
        tabBarStyle: {
          paddingBottom: bottomInset,
          paddingTop: 6,
          height: 56 + bottomInset,
          backgroundColor: theme.COLORS.white,
          borderTopColor: theme.COLORS.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home' || route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Marketplace' || route.name === 'Products') iconName = 'grid';
          else if (route.name === 'Cart') iconName = 'shopping-cart';
          else if (route.name === 'Orders') iconName = 'package';
          else if (route.name === 'Profile') iconName = 'user';
          
          return <Feather name={iconName} size={size} color={color} />;
        },
      })}
    >
      {isSeller ? (
        <>
          <Tab.Screen name="Dashboard" component={SellerDashboard} />
          <Tab.Screen name="Products" component={SellerProductsScreen} />
          <Tab.Screen name="Orders" component={SellerOrdersScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={BuyerDashboard} />
          <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
          <Tab.Screen 
            name="Cart" 
            component={CartScreen} 
            options={{ 
              tabBarBadge: cartCount > 0 ? cartCount : null,
              tabBarBadgeStyle: { backgroundColor: theme.COLORS.primary, color: 'white' }
            }} 
          />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
