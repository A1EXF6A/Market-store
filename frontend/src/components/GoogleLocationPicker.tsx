import React, { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, useLoadScript, Autocomplete } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";

type PickedLocation = {
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  value?: PickedLocation;
  onChange?: (v: PickedLocation) => void;
  height?: number;
  defaultCenter?: { lat: number; lng: number };
};

const DEFAULT_CENTER = { lat: -1.241, lng: -78.619 };

const libraries: Libraries = ["places"];

const GoogleLocationPicker: React.FC<Props> = ({ value, onChange, height = 320, defaultCenter = DEFAULT_CENTER }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey || "", libraries });
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(value ? { lat: value.lat, lng: value.lng } : null);
  const [address, setAddress] = useState<string>(value?.address || "");
  const mapRef = useRef<google.maps.Map | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (value) {
      setPoint({ lat: value.lat, lng: value.lng });
      setAddress(value.address);
    }
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !point) return;
    // center map on point
    if (mapRef.current) {
      mapRef.current.panTo(point);
    }
  }, [isLoaded, point]);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPoint({ lat, lng });

    // reverse geocode
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const formatted = results[0].formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(formatted);
          onChange?.({ address: formatted, lat, lng });
        } else {
          const formatted = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(formatted);
          onChange?.({ address: formatted, lat, lng });
        }
      });
    } catch (err) {
      const formatted = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(formatted);
      onChange?.({ address: formatted, lat, lng });
    }
  };

  const handlePlaceChanged = () => {
    if (!autoRef.current) return;
    const place = autoRef.current.getPlace();
    if (!place.geometry || !place.geometry.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formatted = place.formatted_address || place.name || "";
    setPoint({ lat, lng });
    setAddress(formatted);
    onChange?.({ address: formatted, lat, lng });
    if (mapRef.current) mapRef.current.panTo({ lat, lng });
  };

  if (loadError) {
    return <div className="text-sm text-red-600">Error cargando Google Maps</div>;
  }

  if (!apiKey) {
    return <div className="text-sm text-yellow-600">No se ha configurado la clave de Google Maps.</div>;
  }

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div className="space-y-3">
      <div>
        <Autocomplete
          onLoad={(autocomplete) => {
            autoRef.current = autocomplete;
            // attach listener
            autocomplete.addListener("place_changed", handlePlaceChanged);
          }}
        >
          <input
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
            placeholder="Buscar dirección (Google Places)…"
            defaultValue={address}
          />
        </Autocomplete>
      </div>

      <div style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ height: "100%", width: "100%", borderRadius: 12 }}
          center={point ?? defaultCenter}
          zoom={point ? 15 : 12}
          onLoad={(map: google.maps.Map) => {
            mapRef.current = map;
          }}
          onClick={handleMapClick}
        >
          {point && <Marker position={point} />}
        </GoogleMap>
      </div>

      <input
        readOnly
        value={address}
        className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50"
        placeholder="Selecciona un punto en el mapa o busca una dirección"
      />
    </div>
  );
};

export default GoogleLocationPicker;
