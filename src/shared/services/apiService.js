/**
 * API Service for OnlineMarket
 * Handles communication with the Express/Vercel backend
 */

import { auth } from "../../../FirebaseConfig";

const DEFAULT_BASE_URL = "https://backend-one-eta-35.vercel.app";
const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const BASE_URL = (RAW_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

// Circuit Breaker State to prevent error spam
const CIRCUIT_BREAKER_COOLDOWN = 5000; // 5 seconds
const serviceState = {
  isDown: false,
  lastError: null,
  lastErrorTime: 0,
  lastLoggedErrorTime: 0,
};

const recordConnectionFailure = (error) => {
  serviceState.isDown = true;
  serviceState.lastError = error;
  serviceState.lastErrorTime = Date.now();
};

const resetConnectionState = () => {
  serviceState.isDown = false;
  serviceState.lastError = null;
};

const getNetworkHint = () => {
  if (!RAW_BASE_URL) {
    return `EXPO_PUBLIC_API_URL was not set, so the app is using the hosted backend at ${BASE_URL}. Set USE_LOCAL_API=true before running npm run update-ip if you want a LAN backend.`;
  }

  if (/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(RAW_BASE_URL)) {
    return "Real phone cannot use localhost. Use your computer's LAN IP, or switch back to the hosted Vercel backend.";
  }

  return `Check that the backend is reachable at ${BASE_URL}.`;
};

const normalizeNetworkError = (context, error) => {
  const message = error?.message || String(error);
  if (message.includes("No signed-in user") || message.includes("Session expired")) {
    return normalizeAuthError(context, error);
  }

  let normalized;
  if (error?.name === "AbortError" || message.includes("aborted") || message.includes("timeout")) {
    normalized = new Error(`[${context}] Connection timed out. Check if the server is running at ${BASE_URL}.`);
    recordConnectionFailure(normalized);
  } else if (message.includes("Network request failed") || message.includes("TypeError")) {
    normalized = new Error(`[${context}] Can't reach the backend at ${BASE_URL || "the configured API URL"}. ${getNetworkHint()}`);
    recordConnectionFailure(normalized);
  } else {
    normalized = error instanceof Error ? error : new Error(message);
  }

  return normalized;
};

const normalizeAuthError = (context, error) => {
  const message = error?.message || String(error);
  if (message.includes("No signed-in user")) {
    const normalized = new Error(`[${context}] Sign in again before continuing.`);
    normalized.code = "auth/no-current-user";
    return normalized;
  }
  if (message.includes("Unauthorized")) {
    const normalized = new Error(`[${context}] Session expired. Sign in again.`);
    normalized.code = "auth/session-expired";
    return normalized;
  }
  const normalized = error instanceof Error ? error : new Error(message);
  normalized.code = normalized.code || "auth/session-expired";
  return normalized;
};


const logApiError = (context, error) => {
  if (error?.code?.startsWith('auth/') || String(error?.message || '').includes('Sign in again')) {
    console.log('API Auth Note (' + context + '):', error.message);
  } else {
    console.error('API Error (' + context + '):', error);
  }
};

const getIdToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No signed-in user");
  }
  return currentUser.getIdToken(true);
};

const withAuthHeaders = async (context, headers = {}) => {
  const idToken = await getIdToken().catch((error) => {
    throw normalizeAuthError(context, error);
  });

  return {
    ...headers,
    Authorization: `Bearer ${idToken}`,
  };
};

/**
 * Validates a fetch response & parsed JSON body.
 * Throws an informative Error when the server returns a non-OK status
 * or when the JSON body contains `{ success: false }`.
 */
async function _handleResponse(response, context) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const serverMsg =
      data?.message || data?.error || data?.raw || `${response.status} ${response.statusText}`;
    const details = data?.details ? `\nDetails: ${JSON.stringify(data.details)}` : "";
    throw new Error(`[${context}] ${response.status}: ${serverMsg}${details}`);
  }

  if (!text) {
    return {};
  }

  if (data.success === false) {
    const serverMsg =
      data?.message || data?.error || "Unknown server error";
    const details = data?.details ? `\nDetails: ${JSON.stringify(data.details)}` : "";
    throw new Error(`[${context}] ${serverMsg}${details}`);
  }
  return data;
}

/**
 * Enhanced fetch with AbortController timeout and Circuit Breaker
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  // Check Circuit Breaker
  if (serviceState.isDown) {
    const now = Date.now();
    if (now - serviceState.lastErrorTime < CIRCUIT_BREAKER_COOLDOWN) {
      // Still in cooldown, re-throw the last error immediately
      throw serviceState.lastError;
    }
    // Cooldown expired, let's try again
    resetConnectionState();
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    
    // If we got here, the connection is working
    resetConnectionState();
    
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

const apiService = {
  /**
   * Health check to verify connectivity
   */
  async checkHealth() {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/health`);
      return await _handleResponse(response, "checkHealth");
    } catch (error) {
      const normalized = normalizeNetworkError("checkHealth", error);
      logApiError("checkHealth", normalized);
      throw normalized;
    }
  },

  /**
   * Sync the signed-in user's profile to the backend.
   * This is best-effort and should not block local auth state.
   */
  async syncUserProfile(idToken, profileData) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/api/auth/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(profileData),
      });
      return await _handleResponse(response, "syncUserProfile");
    } catch (error) {
      const normalized = normalizeNetworkError("syncUserProfile", error);
      logApiError("syncUserProfile", normalized);
      throw normalized;
    }
  },

  async switchRole(role) {
    try {
      const headers = await withAuthHeaders("switchRole", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/auth/switch-role`, {
        method: "POST",
        headers,
        body: JSON.stringify({ role }),
      });
      return await _handleResponse(response, "switchRole");
    } catch (error) {
      const normalized = normalizeNetworkError("switchRole", error);
      logApiError("switchRole", normalized);
      throw normalized;
    }
  },

  /**
   * Specifically sync user's current GPS location.
   */
  async updateUserLocation(location) {
    try {
      const headers = await withAuthHeaders("updateUserLocation", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/auth/location`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ location }),
      });
      return await _handleResponse(response, "updateUserLocation");
    } catch (error) {
      // Best effort, don't spam errors
      console.warn("API Error (updateUserLocation):", error);
      return null;
    }
  },

  async getActiveOrder() {
    try {
      const headers = await withAuthHeaders("getActiveOrder");
      const response = await fetchWithTimeout(`${BASE_URL}/api/checkout/active`, {
        headers,
      });
      return await _handleResponse(response, "getActiveOrder");
    } catch (error) {
      const normalized = normalizeNetworkError("getActiveOrder", error);
      console.warn("API Error (getActiveOrder):", normalized);
      return { success: false, order: null };
    }
  },

  /**
   * T1: Initiate Order
   */
  async initiateOrder(orderData) {
    try {
      const headers = await withAuthHeaders("initiateOrder", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/checkout/initiate`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });
      return await _handleResponse(response, "initiateOrder");
    } catch (error) {
      const normalized = normalizeNetworkError("initiateOrder", error);
      logApiError("initiateOrder", normalized);
      throw normalized;
    }
  },

  /**
   * T2 Bridge: Create Payment Intent
   */
  async createIntent(paymentData) {
    try {
      const headers = await withAuthHeaders("createIntent", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/checkout/intent`, {
        method: "POST",
        headers,
        body: JSON.stringify(paymentData),
      });
      return await _handleResponse(response, "createIntent");
    } catch (error) {
      const normalized = normalizeNetworkError("createIntent", error);
      logApiError("createIntent", normalized);
      throw normalized;
    }
  },

  /**
   * T3: Confirm Order
   */
  async confirmOrder(confirmData) {
    try {
      const headers = await withAuthHeaders("confirmOrder", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/checkout/confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify(confirmData),
      });
      return await _handleResponse(response, "confirmOrder");
    } catch (error) {
      const normalized = normalizeNetworkError("confirmOrder", error);
      logApiError("confirmOrder", normalized);
      throw normalized;
    }
  },

  /**
   * T2 Failure: Report Payment Failure
   */
  async reportPaymentFailure(failureData) {
    try {
      const headers = await withAuthHeaders("reportPaymentFailure", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/checkout/fail`, {
        method: "POST",
        headers,
        body: JSON.stringify(failureData),
      });
      return await _handleResponse(response, "reportPaymentFailure");
    } catch (error) {
      const normalized = normalizeNetworkError("reportPaymentFailure", error);
      logApiError("reportPaymentFailure", normalized);
      throw normalized;
    }
  },

  /**
   * Add a new product
   */
  async addProduct(productData) {
    try {
      const isFormData = productData instanceof FormData;
      const headers = await withAuthHeaders("addProduct", isFormData ? {} : {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/products`, {
        method: "POST",
        headers,
        body: isFormData ? productData : JSON.stringify(productData),
      });
      return await _handleResponse(response, "addProduct");
    } catch (error) {
      const normalized = normalizeNetworkError("addProduct", error);
      logApiError("addProduct", normalized);
      throw normalized;
    }
  },

  /**
   * Get products for a specific seller
   */
  async getSellerProducts(sellerId) {
    try {
      const headers = await withAuthHeaders("getSellerProducts");
      const response = await fetchWithTimeout(`${BASE_URL}/api/products/seller/${sellerId}`, {
        headers,
      });
      return await _handleResponse(response, "getSellerProducts");
    } catch (error) {
      const normalized = normalizeNetworkError("getSellerProducts", error);
      logApiError("getSellerProducts", normalized);
      throw normalized;
    }
  },

  /**
   * Search for products
   */
  async searchProducts(query, location = {}) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/api/products/search?q=${encodeURIComponent(query)}&lat=${location.lat || ''}&lng=${location.lng || ''}&pincode=${location.pincode || ''}`);
      return await _handleResponse(response, "searchProducts");
    } catch (error) {
      console.error("API Error (searchProducts):", error);
      throw error;
    }
  },

  /**
   * Get all products
   */
  async getAllProducts(location = {}) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/api/products?lat=${location.lat || ''}&lng=${location.lng || ''}&pincode=${location.pincode || ''}`);
      return await _handleResponse(response, "getAllProducts");
    } catch (error) {
      console.error("API Error (getAllProducts):", error);
      throw error;
    }
  },

  /**
   * Get product feed
   */
  async getProductFeed(limit = 10, location = {}) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/api/products/feed?limit=${limit}&lat=${location.lat || ''}&lng=${location.lng || ''}&pincode=${location.pincode || ''}`);
      return await _handleResponse(response, "getProductFeed");
    } catch (error) {
      console.error("API Error (getProductFeed):", error);
      throw error;
    }
  },

  /**
   * Get orders for a specific seller
   */
  async getSellerOrders(sellerId) {
    try {
      const headers = await withAuthHeaders("getSellerOrders");
      const response = await fetchWithTimeout(`${BASE_URL}/api/orders/seller/${sellerId}`, {
        headers,
      });
      return await _handleResponse(response, "getSellerOrders");
    } catch (error) {
      const normalized = normalizeNetworkError("getSellerOrders", error);
      logApiError("getSellerOrders", normalized);
      throw normalized;
    }
  },

  /**
   * Get orders for a specific buyer
   */
  async getBuyerOrders(buyerId) {
    try {
      const headers = await withAuthHeaders("getBuyerOrders");
      const response = await fetchWithTimeout(`${BASE_URL}/api/orders/buyer/${buyerId}`, {
        headers,
      });
      return await _handleResponse(response, "getBuyerOrders");
    } catch (error) {
      const normalized = normalizeNetworkError("getBuyerOrders", error);
      logApiError("getBuyerOrders", normalized);
      throw normalized;
    }
  },

  /**
   * Get statistics for a specific buyer
   */
  async getBuyerStats(buyerId) {
    try {
      const headers = await withAuthHeaders("getBuyerStats");
      const response = await fetchWithTimeout(`${BASE_URL}/api/stats/buyer/${buyerId}`, {
        headers,
      });
      return await _handleResponse(response, "getBuyerStats");
    } catch (error) {
      const normalized = normalizeNetworkError("getBuyerStats", error);
      logApiError("getBuyerStats", normalized);
      throw normalized;
    }
  },

  /**
   * Get statistics for a specific seller
   */
  async getSellerStats(sellerId) {
    try {
      const headers = await withAuthHeaders("getSellerStats");
      const response = await fetchWithTimeout(`${BASE_URL}/api/stats/seller/${sellerId}`, {
        headers,
      });
      return await _handleResponse(response, "getSellerStats");
    } catch (error) {
      const normalized = normalizeNetworkError("getSellerStats", error);
      logApiError("getSellerStats", normalized);
      throw normalized;
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    try {
      const headers = await withAuthHeaders("updateOrderStatus", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      return await _handleResponse(response, "updateOrderStatus");
    } catch (error) {
      const normalized = normalizeNetworkError("updateOrderStatus", error);
      logApiError("updateOrderStatus", normalized);
      throw normalized;
    }
  },

  async cancelOrder(orderId) {
    try {
      const headers = await withAuthHeaders("cancelOrder", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      return await _handleResponse(response, "cancelOrder");
    } catch (error) {
      const normalized = normalizeNetworkError("cancelOrder", error);
      logApiError("cancelOrder", normalized);
      throw normalized;
    }
  },

  /**
   * Update a product
   */
  async updateProduct(productId, productData) {
    try {
      const isFormData = productData instanceof FormData;
      const headers = await withAuthHeaders("updateProduct", isFormData ? {} : {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/products/${productId}`, {
        method: "PUT",
        headers,
        body: isFormData ? productData : JSON.stringify(productData),
      });
      return await _handleResponse(response, "updateProduct");
    } catch (error) {
      const normalized = normalizeNetworkError("updateProduct", error);
      logApiError("updateProduct", normalized);
      throw normalized;
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(productId) {
    try {
      const headers = await withAuthHeaders("deleteProduct");
      const response = await fetchWithTimeout(`${BASE_URL}/api/products/${productId}`, {
        method: "DELETE",
        headers,
      });
      return await _handleResponse(response, "deleteProduct");
    } catch (error) {
      const normalized = normalizeNetworkError("deleteProduct", error);
      logApiError("deleteProduct", normalized);
      throw normalized;
    }
  },

  /**
   * Get addresses for the logged-in user
   */
  async updateFarmLocation(location) {
    try {
      const headers = await withAuthHeaders("updateFarmLocation", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/auth/farm-location`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ location }),
      });
      return await _handleResponse(response, "updateFarmLocation");
    } catch (error) {
      const normalized = normalizeNetworkError("updateFarmLocation", error);
      logApiError("updateFarmLocation", normalized);
      throw normalized;
    }
  },

  async getAddresses() {
    try {
      const headers = await withAuthHeaders("getAddresses");
      const response = await fetchWithTimeout(`${BASE_URL}/api/addresses`, {
        headers,
      });
      return await _handleResponse(response, "getAddresses");
    } catch (error) {
      const normalized = normalizeNetworkError("getAddresses", error);
      logApiError("getAddresses", normalized);
      throw normalized;
    }
  },

  /**
   * Add a new address
   */
  async addAddress(addressData) {
    try {
      const headers = await withAuthHeaders("addAddress", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/addresses`, {
        method: "POST",
        headers,
        body: JSON.stringify(addressData),
      });
      return await _handleResponse(response, "addAddress");
    } catch (error) {
      const normalized = normalizeNetworkError("addAddress", error);
      logApiError("addAddress", normalized);
      throw normalized;
    }
  },

  /**
   * Update an existing address
   */
  async updateAddress(addressId, addressData) {
    try {
      const headers = await withAuthHeaders("updateAddress", {
        "Content-Type": "application/json",
      });
      const response = await fetchWithTimeout(`${BASE_URL}/api/addresses/${addressId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(addressData),
      });
      return await _handleResponse(response, "updateAddress");
    } catch (error) {
      const normalized = normalizeNetworkError("updateAddress", error);
      logApiError("updateAddress", normalized);
      throw normalized;
    }
  },

  /**
   * Delete an address
   */
  async deleteAddress(addressId) {
    try {
      const headers = await withAuthHeaders("deleteAddress");
      const response = await fetchWithTimeout(`${BASE_URL}/api/addresses/${addressId}`, {
        method: "DELETE",
        headers,
      });
      return await _handleResponse(response, "deleteAddress");
    } catch (error) {
      const normalized = normalizeNetworkError("deleteAddress", error);
      logApiError("deleteAddress", normalized);
      throw normalized;
    }
  },

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId) {
    try {
      const headers = await withAuthHeaders("setDefaultAddress");
      const response = await fetchWithTimeout(`${BASE_URL}/api/addresses/${addressId}/default`, {
        method: "PATCH",
        headers,
      });
      return await _handleResponse(response, "setDefaultAddress");
    } catch (error) {
      const normalized = normalizeNetworkError("setDefaultAddress", error);
      logApiError("setDefaultAddress", normalized);
      throw normalized;
    }
  },
};

export default apiService;
