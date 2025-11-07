import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Icono por defecto de Leaflet (necesario en bundlers modernos)
const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

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

const DEFAULT_CENTER = { lat: -1.241, lng: -78.619 }; // Ambato

// Pequeño debounce utilitario
function debounce<T extends (...args: any[]) => void>(fn: T, ms = 500) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Reverse geocoding: lat/lng -> dirección (Nominatim)
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      // Nominatim pide un user-agent/referer válido; el navegador ya envía uno.
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

// Geocoding: texto -> (lat/lng, dirección) (Nominatim)
async function forwardGeocode(q: string): Promise<PickedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      q,
    )}&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    const item = data[0];
    return {
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
  } catch {
    return null;
  }
}

function ClickCatcher({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationPicker: React.FC<Props> = ({
  value,
  onChange,
  height = 320,
  defaultCenter = DEFAULT_CENTER,
}) => {
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  );
  const [address, setAddress] = useState<string>(value?.address || "");
  const [search, setSearch] = useState<string>("");

  // Cuando cambia value desde fuera, sincronizamos
  useEffect(() => {
    if (value) {
      setPoint({ lat: value.lat, lng: value.lng });
      setAddress(value.address);
    }
  }, [value]);

  // Manejar click en el mapa
  const handlePick = async (lat: number, lng: number) => {
    setPoint({ lat, lng });
    // intentamos reverse geocoding para rellenar la dirección
    const addr = (await reverseGeocode(lat, lng)) ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setAddress(addr);
    onChange?.({ address: addr, lat, lng });
  };

  // Buscar por texto (con debounce)
  const doSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!q || q.trim().length < 3) return;
        const result = await forwardGeocode(q.trim());
        if (result) {
          setPoint({ lat: result.lat, lng: result.lng });
          setAddress(result.address);
          onChange?.(result);
        }
      }, 600),
    [onChange],
  );

  // Actualiza búsqueda
  useEffect(() => {
    doSearch(search);
  }, [search, doSearch]);

  const center = point ?? defaultCenter;

  return (
    <div className="space-y-3">
      {/* Buscador */}
      <div className="flex gap-2">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
          placeholder="Buscar dirección (OpenStreetMap)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => setSearch((s) => s.trim())}
        >
          Buscar
        </button>
      </div>

      {/* Mapa */}
      <div style={{ height }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%", borderRadius: 12 }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={handlePick} />
          {point && <Marker position={[point.lat, point.lng]} />}
        </MapContainer>
      </div>

      {/* Dirección seleccionada (solo lectura) */}
      <input
        readOnly
        value={address}
        className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50"
        placeholder="Selecciona un punto en el mapa o busca una dirección"
      />
    </div>
  );
};

export default LocationPicker;
