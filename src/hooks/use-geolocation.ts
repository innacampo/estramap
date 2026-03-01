import { useState, useCallback } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        setError(err.code === 1 ? "Location access denied." : "Unable to get your location.");
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setError(null);
  }, []);

  const setManualLocation = useCallback((loc: UserLocation) => {
    setUserLocation(loc);
    setError(null);
  }, []);

  return { userLocation, isLocating, error, requestLocation, clearLocation, setManualLocation };
}

/** Haversine distance in miles */
export function distanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
