import { useEffect, useRef, useCallback } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

interface CustomerDetailMapProps {
    latitude: string | number | null | undefined;
    longitude: string | number | null | undefined;
    customerName?: string;
    address?: string;
}

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

export default function CustomerDetailMap({
    latitude,
    longitude,
    customerName,
    address,
}: CustomerDetailMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);

    const parsedLat = typeof latitude === 'number' ? latitude : parseFloat(String(latitude || ''));
    const parsedLng = typeof longitude === 'number' ? longitude : parseFloat(String(longitude || ''));

    const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng)
        && parsedLat >= -90 && parsedLat <= 90
        && parsedLng >= -180 && parsedLng <= 180;

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

        // Set Google Streets as default
        googleStreets.addTo(map);

        const baseMaps = {
            "Google Streets": googleStreets,
            "Google Satellite": googleHybrid,
        };
        L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

        if (hasValidCoords) {
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

            const marker = L.marker([parsedLat, parsedLng], { icon: markerIcon }).addTo(map);

            if (customerName || address) {
                const popupContent = `
                    <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
                        ${customerName ? `<strong style="font-size: 13px; color: #111827;">${customerName}</strong><br/>` : ''}
                        ${address ? `<span style="color: #6b7280;">${address}</span><br/>` : ''}
                        <span style="font-family: monospace; color: #2563eb; font-size: 11px;">${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}</span>
                    </div>
                `;
                marker.bindPopup(popupContent, { autoPan: false });
            }
        }

        mapRef.current = map;

        // Invalidate size to ensure clean tile rendering in dialog
        setTimeout(() => {
            map.invalidateSize();
        }, 250);
    }, [hasValidCoords, parsedLat, parsedLng, customerName, address]);

    useEffect(() => {
        let cancelled = false;
        loadLeaflet()
            .then((L) => {
                if (!cancelled) initMap(L);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [initMap]);

    if (!hasValidCoords) {
        return (
            <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 p-6 flex flex-col items-center justify-center text-center bg-neutral-50/50 dark:bg-neutral-900/20">
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-400 mb-2">
                    <MapPin className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Lokasi GPS Belum Diset</div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">
                    Pelanggan ini belum memiliki koordinat latitude dan longitude. Anda dapat menambahkannya melalui menu Edit Pelanggan.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Lokasi GPS Pelanggan</span>
                    <span className="font-mono text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 ml-0.5">
                        ({parsedLat.toFixed(5)}, {parsedLng.toFixed(5)})
                    </span>
                </div>
                <a
                    href={`https://www.google.com/maps?q=${parsedLat},${parsedLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Buka Google Maps <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            <div
                ref={mapContainerRef}
                className="w-full h-44 sm:h-56 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-inner bg-neutral-100 dark:bg-neutral-900"
                style={{ zIndex: 0 }}
            />
        </div>
    );
}

