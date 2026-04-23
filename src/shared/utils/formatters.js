/**
 * Centralized formatting utilities for the BharatMandi application
 */

/**
 * Formats a numeric amount to Indian Rupee currency string
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return `₹${num.toFixed(0)}`;
};

/**
 * Formats a Firebase Timestamp or JavaScript Date into a readable string
 * @param {any} timestamp 
 * @returns {string}
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return "Recent";

  try {
    // Handle Firebase Timestamp formats (both standard and serialized)
    const seconds = timestamp.seconds || timestamp._seconds;
    if (seconds) {
      return new Date(seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    }
    
    // Handle plain numeric timestamp
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    }

    // Handle JS Date or ISO string
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });
  } catch (error) {
    console.error("formatDate error:", error);
    return "Recent";
  }
};

/**
 * Calculates relative freshness based on harvest date
 * @param {string|Date} harvestDate 
 * @returns {string}
 */
export const formatFreshness = (harvestDate) => {
  if (!harvestDate) return "TODAY";

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const harvest = new Date(harvestDate);
    harvest.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - harvest.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "TODAY";
    if (diffDays === 1) return "1 DAY AGO";
    return `${diffDays}+ DAYS`;
  } catch (error) {
    return "TODAY";
  }
};
