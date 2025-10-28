import env from "@/config/env";
import { cn } from "@/lib/utils";
import { MapPin, X } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";

interface LocationSelectorProps {
  value?: { latitude: number; longitude: number; address?: string } | null;
  onChange?: (
    location: { latitude: number; longitude: number; address?: string } | null,
  ) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  className,
  placeholder = "Seleccionar ubicación",
  disabled = false,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState(value || null);
  const [addressInput, setAddressInput] = React.useState(value?.address || "");
  const [mapCenter, setMapCenter] = React.useState({
    lat: 0,
    lng: 0,
  }); // Coordenadas 0,0 (punto neutral)
  const [googleMapsLoaded, setGoogleMapsLoaded] = React.useState(false);
  const [userLocationDetected, setUserLocationDetected] = React.useState(false);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<google.maps.Map | null>(null);
  const markerRef = React.useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const GOOGLE_MAPS_API_KEY = env.googleMapsApiKey;

  // Load Google Maps API
  React.useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    
    const loadGoogleMaps = async () => {
      try {
        // Check if Google Maps is already loaded
        if (window.google?.maps) {
          setGoogleMapsLoaded(true);
          return;
        }

        // Load Google Maps using script tag
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=maps,marker&v=beta`;
        script.async = true;
        script.defer = true;

        // Set up callback
        (window as any).initMap = () => {
          setGoogleMapsLoaded(true);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    loadGoogleMaps();
  }, [GOOGLE_MAPS_API_KEY]);

  // Initialize map when loaded and dialog opens
  React.useEffect(() => {
    if (!googleMapsLoaded || !isOpen || !mapRef.current || !GOOGLE_MAPS_API_KEY) return;

    try {
      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 2, // Zoom más amplio para vista mundial
        mapId: 'location-selector-map',
      });

      mapInstanceRef.current = map;

      // Add click listener
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const latitude = event.latLng.lat();
          const longitude = event.latLng.lng();

          // Update marker
          if (markerRef.current) {
            markerRef.current.position = event.latLng;
          } else {
            markerRef.current = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: event.latLng,
            });
          }

          // Reverse geocoding
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: event.latLng },
            (results, status) => {
              if (status === 'OK' && results?.[0]) {
                const address = results[0].formatted_address;
                setSelectedLocation({ latitude, longitude, address });
                setAddressInput(address);
              } else {
                setSelectedLocation({ latitude, longitude });
                setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              }
            },
          );
        }
      });

      // Add existing location marker if any
      if (selectedLocation) {
        const position = { lat: selectedLocation.latitude, lng: selectedLocation.longitude };
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position,
        });
        map.setCenter(position);
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [googleMapsLoaded, isOpen, mapCenter, GOOGLE_MAPS_API_KEY]);

  const handleMapClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (GOOGLE_MAPS_API_KEY && googleMapsLoaded) return; // Google Maps handles this
      
      // Fallback for simple map
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Convert to approximate coordinates (this is a simple approximation)
      const latitude = -1.2491 + (y - rect.height / 2) * 0.001;
      const longitude = -78.6167 + (x - rect.width / 2) * 0.001;
      
      setSelectedLocation({ latitude, longitude });
      setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    },
    [GOOGLE_MAPS_API_KEY, googleMapsLoaded],
  );

  const handleConfirm = () => {
    onChange?.(selectedLocation);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedLocation(null);
    setAddressInput("");
    onChange?.(null);
    setIsOpen(false);
  };

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;

    if (GOOGLE_MAPS_API_KEY && googleMapsLoaded && window.google?.maps?.Geocoder) {
      // Use Google Maps Geocoding
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: addressInput }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          const latitude = location.lat();
          const longitude = location.lng();
          const address = results[0].formatted_address;

          setSelectedLocation({ latitude, longitude, address });
          setMapCenter({ lat: latitude, lng: longitude });
          
          // Update map and marker if available
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
            
            if (markerRef.current) {
              markerRef.current.position = { lat: latitude, lng: longitude };
            } else {
              markerRef.current = new google.maps.marker.AdvancedMarkerElement({
                map: mapInstanceRef.current,
                position: { lat: latitude, lng: longitude },
              });
            }
          }
        }
      });
    } else {
      // Fallback: Simple coordinate parsing
      const coords = addressInput.split(',').map(c => parseFloat(c.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const [latitude, longitude] = coords;
        setSelectedLocation({ latitude, longitude, address: addressInput });
        setMapCenter({ lat: latitude, lng: longitude });
      } else {
        // Just use the text as address
        setSelectedLocation({ 
          latitude: mapCenter.lat, 
          longitude: mapCenter.lng, 
          address: addressInput 
        });
      }
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className={className}>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full justify-start text-left font-normal"
            >
              <MapPin className="mr-2 h-4 w-4" />
              {value?.address || placeholder}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ingresar Ubicación</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  placeholder="Ej: Ambato, Ecuador o coordenadas: -1.2491, -78.6167"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Puedes ingresar una dirección o coordenadas en formato: latitud, longitud
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClear}>
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (addressInput.trim()) {
                      const coords = addressInput.split(',').map(c => parseFloat(c.trim()));
                      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                        onChange?.({ latitude: coords[0], longitude: coords[1], address: addressInput });
                      } else {
                        onChange?.({ latitude: -1.2491, longitude: -78.6167, address: addressInput });
                      }
                      setIsOpen(false);
                    }
                  }}
                  disabled={!addressInput.trim()}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start text-left font-normal"
          >
            <MapPin className="mr-2 h-4 w-4" />
            {value?.address || placeholder}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Seleccionar Ubicación</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Address search input */}
            <div className="flex gap-2">
              <Input
                placeholder="Buscar dirección... (ej: Ambato, Ecuador)"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
              />
              <Button 
                type="button" 
                onClick={handleAddressSearch}
              >
                Buscar
              </Button>
            </div>

            {/* Map container */}
            <div className="h-[500px] w-full border rounded-md overflow-hidden">
              {GOOGLE_MAPS_API_KEY && googleMapsLoaded ? (
                <div ref={mapRef} className="w-full h-full" />
              ) : GOOGLE_MAPS_API_KEY ? (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando Google Maps...</p>
                  </div>
                </div>
              ) : (
                <div 
                  className="w-full h-full bg-gray-100 flex items-center justify-center cursor-crosshair relative"
                  onClick={handleMapClick}
                >
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Haz clic para seleccionar ubicación</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Selector de ubicación simplificado
                    </p>
                  </div>
                  
                  {selectedLocation && (
                    <div 
                      className="absolute bg-red-500 w-3 h-3 rounded-full border-2 border-white shadow-lg"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Selected location info */}
            {selectedLocation && (
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm">
                  <strong>Ubicación seleccionada:</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation.address ||
                    `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClear}>
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedLocation}
              >
                Confirmar Ubicación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
