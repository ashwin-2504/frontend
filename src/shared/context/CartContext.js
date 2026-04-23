import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const CartContext = createContext();
const CART_STORAGE_KEY = '@bharatmandi_cart';
const CART_OWNER_KEY = '@bharatmandi_cart_owner';

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { user } = useAuth();

  // Hydrate cart from AsyncStorage on mount/auth change
  useEffect(() => {
    const hydrateCart = async () => {
      try {
        const [storedCart, storedOwner] = await Promise.all([
          AsyncStorage.getItem(CART_STORAGE_KEY),
          AsyncStorage.getItem(CART_OWNER_KEY)
        ]);

        const currentUid = user?.id || null;

        if (storedCart && storedOwner === currentUid) {
          setCartItems(JSON.parse(storedCart));
        } else if (storedOwner !== currentUid) {
          // Clear cart if ownership changed
          setCartItems([]);
          await AsyncStorage.removeItem(CART_STORAGE_KEY);
          await AsyncStorage.setItem(CART_OWNER_KEY, currentUid || '');
        }
      } catch (err) {
        console.warn('Failed to hydrate cart:', err);
      } finally {
        setIsCartHydrated(true);
      }
    };

    hydrateCart();
  }, [user?.id]);

  // Persist cart changes to AsyncStorage
  useEffect(() => {
    if (!isCartHydrated) return; // Don't persist during hydration

    const persistCart = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)),
          AsyncStorage.setItem(CART_OWNER_KEY, user?.id || '')
        ]);
      } catch (err) {
        console.warn('Failed to save cart:', err);
      }
    };

    persistCart();
  }, [cartItems, user?.id, isCartHydrated]);

  const getUnitPrice = (item, qty) => {
    if (item.bulkPricing && item.bulkPricing.length > 0) {
      const tier = item.bulkPricing.find(t => qty >= t.min && (!t.max || qty <= t.max));
      if (tier) return tier.price;
    }
    return item.basePrice || item.price;
  };

  const addToCart = (product, quantity = 1) => {
    if (isLocked) return;
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.productId);
      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        return prevItems.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: newQty, price: getUnitPrice(item, newQty) }
            : item
        );
      }
      
      // Use the product's base price (authoritative from server)
      const basePrice = product.basePrice || product.price;
      const initialPrice = getUnitPrice({ ...product, basePrice }, quantity);
      
      return [...prevItems, { 
        ...product, 
        basePrice, 
        price: initialPrice, 
        quantity 
      }];
    });
  };

  const removeFromCart = (productId) => {
    if (isLocked) return;
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (isLocked) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId 
          ? { ...item, quantity, price: getUnitPrice(item, quantity) } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setIsLocked(false);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const cartCount = cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0);

  // Group by seller for estimated delivery charge in demo
  const sellerCount = new Set(cartItems.map(i => i.sellerId)).size;
  const estimatedDelivery = sellerCount * 30; // Using 30 as fixed MVP estimate

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      estimatedDelivery,
      isCartHydrated,
      isLocked,
      setIsLocked
    }}>
      {isCartHydrated ? children : null}
    </CartContext.Provider>
  );
};
