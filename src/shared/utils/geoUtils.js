/**
 * Calculates the Haversine distance between two points in kilometers.
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if the distance between two locations exceeds a threshold.
 */
export function hasMovedSignificantly(loc1, loc2, thresholdKm = 0.5) {
  if (!loc1 || !loc2) return true;
  const distance = getHaversineDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  return distance > thresholdKm;
}
