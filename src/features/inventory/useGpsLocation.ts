import { useCallback, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const KEY = import.meta.env.VITE_GMAPS_KEY as string | undefined;

interface FixedLocation {
  lat: number;
  lng: number;
  address: string;
}

let configured = false;
let geocoderPromise: Promise<google.maps.Geocoder | null> | null = null;

function ensureGeocoder(): Promise<google.maps.Geocoder | null> {
  if (!KEY) return Promise.resolve(null);
  if (!geocoderPromise) {
    if (!configured) { setOptions({ key: KEY, v: 'weekly' }); configured = true; }
    geocoderPromise = (async () => {
      const lib = await importLibrary('geocoding');
      return new lib.Geocoder();
    })().catch(() => null);
  }
  return geocoderPromise;
}

export function useGpsLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const capture = useCallback(async (): Promise<FixedLocation | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation unavailable (needs HTTPS + device support)');
      return null;
    }
    setError(null);
    setLoading(true);
    abortRef.current = false;

    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        (err) => { setError(err.message); resolve(null); },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
      );
    });

    if (!pos || abortRef.current) { setLoading(false); return null; }
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      const geo = await ensureGeocoder();
      if (geo) {
        const res: google.maps.GeocoderResponse = await geo.geocode({ location: { lat, lng } });
        if (res.results[0]) address = res.results[0].formatted_address;
      }
    } catch { /* geocode optional */ }

    setLoading(false);
    return { lat, lng, address };
  }, []);

  return { capture, loading, error, setError };
}
