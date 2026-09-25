/**
 * Formats a speed in km/h with unit.
 */
export const formatSpeed = (speedKmh: number): string => {
  return `${speedKmh.toFixed(1)} km/h`;
};

/**
 * Formats distance in meters.
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} m`;
};

/**
 * Formats ISO date string to localized time string.
 */
export const formatTimeString = (isoString?: string): string => {
  if (!isoString) return '--:--:--';
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Maps risk score percentage to Tailwind color classes.
 */
export const getRiskScoreColor = (riskPercent: number) => {
  if (riskPercent >= 80) return 'text-red-400 border-red-500/50 bg-red-950/40';
  if (riskPercent >= 50) return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
  return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
};

/**
 * Calculates Haversine distance in meters between two lat/lng points.
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
