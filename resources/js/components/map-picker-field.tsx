import { useEffect, useRef, useCallback } from 'react';
import { LocateFixed, Map, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface MapPickerFieldProps {
    latitude: string;
    longitude: string;
    isGpsLoading: boolean;
    onGetGPS: () => void;
    onChangeLatLng: (lat: string, lng: string) => void;
    errorLatitude?: string;
    errorLongitude?: string;
}

// Default center: center of Indonesia
const DEFAULT_CENTER: [number, number] = [-2.5489, 118.0149];
const DEFAULT_ZOOM = 5;
const MARKER_ZOOM = 16;

function loadLeaflet(): Promise<any> {
    return new Promise((resolve, reject) => {
        const win = window as any;
        if (win.L) { resolve(win.L); return; }

        if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        const scriptId = 'leaflet-cdn-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            document.body.appendChild(script);
        }

        if (script.dataset.loaded) { resolve(win.L); return; }

        script.addEventListener('load', () => {
            script!.dataset.loaded = '1';
            resolve(win.L);
        });
        script.addEventListener('error', () => reject(new Error('Failed to load Leaflet')));
    });
}

export default function MapPickerField({
    latitude,
    longitude,
    isGpsLoading,
    onGetGPS,
    onChangeLatLng,
    errorLatitude,
    errorLongitude,
}: MapPickerFieldProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const isMapReady = useRef(false);

    // Parse valid coords from props
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng)
        && parsedLat >= -90 && parsedLat <= 90
        && parsedLng >= -180 && parsedLng <= 180;

    // Build or update the map
    const initMap = useCallback((L: any) => {
        if (!mapContainerRef.current || mapRef.current) return;

        const center: [number, number] = hasValidCoords
            ? [parsedLat, parsedLng]
            : DEFAULT_CENTER;
        const zoom = hasValidCoords ? MARKER_ZOOM : DEFAULT_ZOOM;

        const map = L.map(mapContainerRef.current, {
            center,
            zoom,
            zoomControl: true,
        });

        // Google Maps Tile Layers
        const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google Maps'
        });

        const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google Maps Satellite'
        });

        // Set Google Streets as default base layer
        googleStreets.addTo(map);

        // Add Layer Control so user can toggle between Google Streets & Google Satellite
        const baseMaps = {
            "Google Streets": googleStreets,
            "Google Satellite": googleHybrid,
        };
        L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

        // Custom marker icon (fix Leaflet default icon path issue with bundlers)
        const markerIcon = L.divIcon({
            className: '',
            html: `<div style="
                width:32px;height:40px;
                display:flex;align-items:center;justify-content:center;
                filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));
            ">
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 34' fill='none' width='32' height='40'>
                    <path d='M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22C24 5.373 18.627 0 12 0z' fill='#2563eb'/>
                    <circle cx='12' cy='12' r='5' fill='white'/>
                </svg>
            </div>`,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
        });

        // Place marker if coords exist
        if (hasValidCoords) {
            const marker = L.marker([parsedLat, parsedLng], { icon: markerIcon, draggable: true }).addTo(map);
            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                onChangeLatLng(pos.lat.toFixed(7), pos.lng.toFixed(7));
            });
            markerRef.current = marker;
        }

        // Click on map to place/move marker
        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                const marker = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(map);
                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    onChangeLatLng(pos.lat.toFixed(7), pos.lng.toFixed(7));
                });
                markerRef.current = marker;
            }
            onChangeLatLng(lat.toFixed(7), lng.toFixed(7));
        });

        mapRef.current = map;
        isMapReady.current = true;

        // Fix map size (dialog may not have rendered fully)
        setTimeout(() => map.invalidateSize(), 200);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Init map on mount
    useEffect(() => {
        let cancelled = false;
        loadLeaflet()
            .then((L) => { if (!cancelled) initMap(L); })
            .catch(() => {});
        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
                isMapReady.current = false;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync map when lat/lng props change (e.g. GPS button, manual typing)
    useEffect(() => {
        if (!isMapReady.current || !mapRef.current) return;
        const map = mapRef.current;
        const win = window as any;
        const L = win.L;
        if (!L) return;

        if (hasValidCoords) {
            if (markerRef.current) {
                markerRef.current.setLatLng([parsedLat, parsedLng]);
            } else {
                const markerIcon = L.divIcon({
                    className: '',
                    html: `<div style="width:32px;height:40px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 34' fill='none' width='32' height='40'>
                            <path d='M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22C24 5.373 18.627 0 12 0z' fill='#2563eb'/>
                            <circle cx='12' cy='12' r='5' fill='white'/>
                        </svg>
                    </div>`,
                    iconSize: [32, 40],
                    iconAnchor: [16, 40],
                });
                const marker = L.marker([parsedLat, parsedLng], { icon: markerIcon, draggable: true }).addTo(map);
                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    onChangeLatLng(pos.lat.toFixed(7), pos.lng.toFixed(7));
                });
                markerRef.current = marker;
            }
            map.setView([parsedLat, parsedLng], Math.max(map.getZoom(), MARKER_ZOOM));
        }
    }, [latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col gap-2 md:col-span-2">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <Label className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Lokasi GPS / Peta (Opsional)
                </Label>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isGpsLoading}
                    onClick={onGetGPS}
                    className="h-7 text-xs gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                >
                    {isGpsLoading ? (
                        <><Spinner className="w-3 h-3" /> Mengambil GPS...</>
                    ) : (
                        <><LocateFixed className="w-3 h-3" /> Ambil Lokasi GPS</>
                    )}
                </Button>
            </div>

            {/* Hint */}
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 -mt-1">
                Klik pada peta atau seret marker untuk menentukan lokasi, atau isi manual di bawah.
            </p>

            {/* Map container */}
            <div
                ref={mapContainerRef}
                className="w-full h-52 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-900"
                style={{ zIndex: 0 }}
            />

            {/* Manual inputs */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="latitude" className="text-xs text-neutral-500 dark:text-neutral-400">Latitude</Label>
                    <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={e => onChangeLatLng(e.target.value, longitude)}
                        placeholder="-6.1754321"
                        className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm"
                    />
                    {errorLatitude && <span className="text-red-500 text-xs">{errorLatitude}</span>}
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="longitude" className="text-xs text-neutral-500 dark:text-neutral-400">Longitude</Label>
                    <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={e => onChangeLatLng(latitude, e.target.value)}
                        placeholder="106.8271921"
                        className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm"
                    />
                    {errorLongitude && <span className="text-red-500 text-xs">{errorLongitude}</span>}
                </div>
            </div>

            {/* Google Maps link */}
            {hasValidCoords && (
                <a
                    href={`https://www.google.com/maps?q=${parsedLat},${parsedLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <Map className="w-3 h-3" /> Lihat di Google Maps
                </a>
            )}
        </div>
    );
}

