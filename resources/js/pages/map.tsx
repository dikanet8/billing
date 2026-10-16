import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import { Search, Layers, Info, CheckCircle2, AlertTriangle, LocateFixed, Users, MapPin, Phone, Router, Package, ChevronRight, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PelangganMapItem {
    id: number;
    nomor_pelanggan?: string;
    nama: string;
    telepon?: string;
    alamat?: string;
    status?: string;
    latitude: string | number;
    longitude: string | number;
    modem?: string;
    id_area?: number;
    id_paket?: number;
    area?: { id_area: number; nama_area: string };
    paket?: { id_paket: number; paket_nama: string; paket_tarif: number };
}

interface NetworkMapProps {
    dataPelanggan?: PelangganMapItem[];
    dataArea?: any[];
    dataPaket?: any[];
    totalPelangganSemua?: number;
    totalPelangganBerkoordinat?: number;
}

// Default center: Indonesia
const DEFAULT_CENTER: [number, number] = [-2.5489, 118.0149];
const DEFAULT_ZOOM = 5;

const formatRupiah = (number: number) => {
    return 'Rp ' + Number(number || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const svgMapPin = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

export default function NetworkMap({
    dataPelanggan = [],
    dataArea = [],
    dataPaket = [],
    totalPelangganSemua = 0,
    totalPelangganBerkoordinat = 0,
}: NetworkMapProps) {
    const { auth } = usePage().props;

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const layerGroupRef = useRef<any>(null);

    const [isMapReady, setIsMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [areaFilter, setAreaFilter] = useState('Semua');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedPelanggan, setSelectedPelanggan] = useState<PelangganMapItem | null>(null);

    // Filter pelanggan valid dengan koordinat
    const customersWithCoords = useMemo(() => {
        return (dataPelanggan || []).filter(c => {
            const lat = typeof c.latitude === 'number' ? c.latitude : parseFloat(String(c.latitude || ''));
            const lng = typeof c.longitude === 'number' ? c.longitude : parseFloat(String(c.longitude || ''));
            return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        });
    }, [dataPelanggan]);

    // Pelanggan setelah search dan filter status/area
    const filteredCustomers = useMemo(() => {
        return customersWithCoords.filter(c => {
            const matchesSearch = !searchQuery ||
                c.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.nomor_pelanggan && c.nomor_pelanggan.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.telepon && c.telepon.includes(searchQuery)) ||
                (c.alamat && c.alamat.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'Semua' || (c.status || '').toUpperCase() === statusFilter.toUpperCase();
            const matchesArea = areaFilter === 'Semua' || String(c.id_area) === String(areaFilter);

            return matchesSearch && matchesStatus && matchesArea;
        });
    }, [customersWithCoords, searchQuery, statusFilter, areaFilter]);

    // Inisialisasi Vanilla Leaflet Map via CDN Script Injection
    useEffect(() => {
        let isCancelled = false;

        const handleInit = (L: any) => {
            if (!mapContainerRef.current || mapInstanceRef.current || !L) return;

            try {
                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });

                // Hitung center awal dari pelanggan pertama yang berkoordinat, jika ada
                let initialCenter: [number, number] = DEFAULT_CENTER;
                let initialZoom = DEFAULT_ZOOM;

                if (customersWithCoords.length > 0) {
                    const first = customersWithCoords[0];
                    initialCenter = [
                        typeof first.latitude === 'number' ? first.latitude : parseFloat(String(first.latitude)),
                        typeof first.longitude === 'number' ? first.longitude : parseFloat(String(first.longitude))
                    ];
                    initialZoom = 13;
                }

                const map = L.map(mapContainerRef.current, {
                    center: initialCenter,
                    zoom: initialZoom,
                    zoomControl: false,
                });

                L.control.zoom({ position: 'topright' }).addTo(map);

                // Tile Layers (Google Streets Default)
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

                const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                });

                googleStreets.addTo(map);

                const baseMaps = {
                    "Google Streets": googleStreets,
                    "Google Satellite": googleHybrid,
                    "OpenStreetMap": osmLayer
                };
                L.control.layers(baseMaps, undefined, { position: 'bottomright' }).addTo(map);

                layerGroupRef.current = L.layerGroup().addTo(map);
                mapInstanceRef.current = { map, L };
                setIsMapReady(true);

                // Auto fit bounds jika ada data pelanggan
                if (customersWithCoords.length > 1) {
                    const bounds = L.latLngBounds(customersWithCoords.map(c => [
                        typeof c.latitude === 'number' ? c.latitude : parseFloat(String(c.latitude)),
                        typeof c.longitude === 'number' ? c.longitude : parseFloat(String(c.longitude))
                    ]));
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                }
            } catch (err: any) {
                console.error("Leaflet Init Error:", err);
                setMapError(err.message || "Gagal membangun peta.");
            }
        };

        if ((window as any).L) {
            handleInit((window as any).L);
            return;
        }

        if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        const scriptId = 'leaflet-cdn-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            document.body.appendChild(script);
        }

        const handleLoad = () => {
            if (isCancelled) return;
            handleInit((window as any).L);
        };

        const handleError = () => {
            if (isCancelled) return;
            setMapError("Gagal mengunduh script peta dari internet (CDN).");
        };

        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        return () => {
            isCancelled = true;
            script?.removeEventListener('load', handleLoad);
            script?.removeEventListener('error', handleError);
            if (mapInstanceRef.current?.map) {
                mapInstanceRef.current.map.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Render Markers Pelanggan Real
    useEffect(() => {
        if (!isMapReady || !mapInstanceRef.current) return;
        const { map, L } = mapInstanceRef.current;
        const layerGroup = layerGroupRef.current;

        layerGroup.clearLayers();

        const createIcon = (bgClass: string) => {
            return L.divIcon({
                className: 'bg-transparent border-none',
                html: `<div class="w-8 h-8 rounded-full ${bgClass} text-white border-2 border-white flex items-center justify-center shadow-lg transition-transform hover:scale-110">${svgMapPin}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            });
        };

        const iconAktif = createIcon('bg-blue-600');
        const iconIsolir = createIcon('bg-rose-600');
        const iconBerhenti = createIcon('bg-neutral-500');

        filteredCustomers.forEach(cst => {
            const lat = typeof cst.latitude === 'number' ? cst.latitude : parseFloat(String(cst.latitude));
            const lng = typeof cst.longitude === 'number' ? cst.longitude : parseFloat(String(cst.longitude));

            const st = (cst.status || 'AKTIF').toUpperCase();
            const icon = st === 'AKTIF' ? iconAktif : st === 'ISOLIR' ? iconIsolir : iconBerhenti;

            const statusBadge = st === 'AKTIF'
                ? '<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;">Aktif</span>'
                : st === 'ISOLIR'
                    ? '<span style="background:#ffe4e6;color:#e11d48;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;">Isolir</span>'
                    : '<span style="background:#f3f4f6;color:#4b5563;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;">Berhenti</span>';

            const popupContent = `
                <div style="font-family:inherit;min-width:200px;padding:2px 0;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-size:10px;font-family:monospace;color:#6b7280;font-weight:bold;">${cst.nomor_pelanggan || ('ID #' + cst.id)}</span>
                        ${statusBadge}
                    </div>
                    <h4 style="font-weight:700;font-size:14px;color:#111827;margin:0 0 4px 0;">${cst.nama}</h4>
                    <p style="font-size:11px;color:#4b5563;margin:0 0 6px 0;line-height:1.4;">${cst.alamat || '-'}</p>
                    <div style="font-size:11px;color:#374151;border-top:1px solid #e5e7eb;padding-top:6px;display:flex;flex-direction:column;gap:3px;">
                        <div><strong>Paket:</strong> ${cst.paket?.paket_nama ? `${cst.paket.paket_nama} (${formatRupiah(cst.paket.paket_tarif)})` : '-'}</div>
                        <div><strong>Area:</strong> ${cst.area?.nama_area || '-'}</div>
                        ${cst.telepon ? `<div><strong>Telp:</strong> ${cst.telepon}</div>` : ''}
                    </div>
                    <div style="margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
                        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#2563eb;text-decoration:none;font-weight:600;">Buka Google Maps &rarr;</a>
                    </div>
                </div>
            `;

            const marker = L.marker([lat, lng], { icon }).addTo(layerGroup);
            marker.bindPopup(popupContent, { autoPan: true });

            marker.on('click', () => {
                setSelectedPelanggan(cst);
            });
        });

        // User Location GPS Marker
        if (userLocation) {
            const iconUser = L.divIcon({
                className: 'bg-transparent border-none',
                html: `<div class="w-8 h-8 rounded-full bg-rose-500 text-white border-2 border-white flex items-center justify-center shadow-lg animate-bounce">${svgMapPin}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            });
            L.marker([userLocation.lat, userLocation.lng], { icon: iconUser })
                .bindPopup(`<div style="padding:4px;min-width:120px;"><h4 style="font-weight:bold;font-size:13px;color:#e11d48;margin:0 0 2px 0;">Lokasi Anda</h4><p style="font-size:11px;color:#6b7280;margin:0;">Berdasarkan GPS Perangkat</p></div>`)
                .addTo(layerGroup);
        }
    }, [isMapReady, filteredCustomers, userLocation]);

    // Handle GPS Button
    const handleLocate = () => {
        if (!mapInstanceRef.current?.map) return;
        const { map } = mapInstanceRef.current;

        map.locate({ setView: true, maxZoom: 16 });

        map.once('locationfound', (e: any) => {
            setUserLocation(e.latlng);
        });

        map.once('locationerror', () => {
            alert("Gagal mendeteksi lokasi GPS: Pastikan GPS perangkat menyala dan izin akses lokasi telah diberikan.");
        });
    };

    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

    return (
        <div className="flex h-full flex-1 flex-col gap-0 p-0 overflow-hidden relative">
            <Head title="Peta Pelanggan & Jaringan" />

            <style>{`
                .leaflet-control-container .leaflet-top { top: 12px; }
                .leaflet-control-container .leaflet-right { right: 12px; }
                @media (max-width: 640px) {
                    .leaflet-control-container .leaflet-top { top: 60px; }
                    .leaflet-control-container .leaflet-right { right: 12px; }
                }
            `}</style>

            {/* Top Bar Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3.5 border-b border-sidebar-border/70 bg-white dark:bg-neutral-950 z-20 shadow-sm relative shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-900 shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h1 className="text-sm sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                                Peta Pelanggan
                            </h1>
                            <span className="text-[10px] sm:text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 sm:px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                {customersWithCoords.length}/{totalPelangganSemua || (dataPelanggan || []).length} Titik
                            </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block truncate">
                            Visualisasi lokasi geografis rumah pelanggan yang terintegrasi database billing.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Mobile toggle button for filter/search */}
                    <Button
                        variant={isMobilePanelOpen ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsMobilePanelOpen(prev => !prev)}
                        className={`sm:hidden h-8 px-2.5 text-xs gap-1.5 font-medium ${isMobilePanelOpen ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-900'}`}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filter</span>
                        {filteredCustomers.length !== customersWithCoords.length && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                        )}
                    </Button>

                    <Link href="/pelanggan">
                        <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-xs gap-1 sm:gap-1.5 bg-white dark:bg-neutral-950">
                            <Users className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Kelola Pelanggan</span>
                            <span className="sm:hidden">Data</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative bg-neutral-100 dark:bg-neutral-950">
                {/* Floating Left Panel - Controls & Filters (Desktop always visible, Mobile toggleable) */}
                <div className={`
                    absolute top-0 left-0 w-full sm:w-[320px] max-w-full sm:max-w-[calc(100%-2rem)] flex-shrink-0 z-20 
                    p-2.5 sm:m-4 sm:p-0 flex flex-col gap-2.5 sm:gap-3 pointer-events-none transition-all duration-200
                    ${isMobilePanelOpen ? 'pointer-events-auto block bg-white/90 sm:bg-transparent dark:bg-neutral-950/90 sm:dark:bg-transparent backdrop-blur-md sm:backdrop-blur-none max-h-[85vh] overflow-y-auto sm:overflow-visible shadow-xl sm:shadow-none border-b sm:border-none border-neutral-200 dark:border-neutral-800' : 'pointer-events-none hidden sm:flex'}
                `}>
                    {/* Search & GPS */}
                    <div className="flex gap-2 pointer-events-auto">
                        <Card className="flex flex-col border border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl p-2 flex-1">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama, ID, alamat..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-neutral-50 dark:bg-neutral-950 pl-8 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 h-8 sm:h-9 text-xs sm:text-sm"
                                />
                            </div>
                        </Card>
                        <Button
                            onClick={handleLocate}
                            variant="outline"
                            className="bg-white/95 dark:bg-neutral-900/95 shadow-md border-neutral-200 dark:border-neutral-800 h-auto w-10 sm:w-11 shrink-0 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors rounded-xl"
                            title="Lacak Lokasi Saya (GPS)"
                        >
                            <LocateFixed className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Filter Card */}
                    <Card className="flex flex-col border border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md pointer-events-auto rounded-xl p-3 sm:p-3.5 gap-2.5 sm:gap-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-blue-500" />
                                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">Filter Pelanggan</h3>
                            </div>
                            <span className="text-[11px] font-mono text-neutral-500 font-medium">
                                {filteredCustomers.length} tampil
                            </span>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Status Layanan</span>
                            <div className="grid grid-cols-4 gap-1">
                                {['Semua', 'AKTIF', 'ISOLIR', 'BERHENTI'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-1 py-1 text-[11px] rounded-md font-medium transition-colors text-center ${statusFilter === st
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                            }`}
                                    >
                                        {st === 'Semua' ? 'Semua' : st === 'AKTIF' ? 'Aktif' : st === 'ISOLIR' ? 'Isolir' : 'Non'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Area Filter */}
                        {dataArea.length > 0 && (
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Area Wilayah</span>
                                <select
                                    value={areaFilter}
                                    onChange={e => setAreaFilter(e.target.value)}
                                    className="h-8 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 text-neutral-800 dark:text-neutral-200"
                                >
                                    <option value="Semua">Semua Area</option>
                                    {dataArea.map((a: any) => (
                                        <option key={a.id_area} value={a.id_area}>{a.nama_area}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                                <span>Aktif</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>
                                <span>Isolir</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-500"></div>
                                <span>Berhenti</span>
                            </div>
                        </div>

                        {/* Mobile quick close button */}
                        <div className="sm:hidden pt-1">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsMobilePanelOpen(false)}
                                className="w-full text-xs h-8 text-neutral-600 dark:text-neutral-300"
                            >
                                Tutup & Lihat Peta
                            </Button>
                        </div>
                    </Card>

                    {/* Notification card if no coordinates are set */}
                    {customersWithCoords.length === 0 && (
                        <Card className="flex flex-col border border-amber-200 dark:border-amber-900/40 bg-amber-50/95 dark:bg-amber-950/40 backdrop-blur-md shadow-md pointer-events-auto rounded-xl p-3 gap-2">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                                    Belum ada pelanggan dengan koordinat GPS. Buka menu <strong>Pelanggan &rarr; Edit</strong> lalu tentukan lokasi pada peta untuk menampilkan titik di halaman ini.
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* The Map Container div */}
                <div className="absolute inset-0 z-0 bg-neutral-100 flex items-center justify-center">
                    {!isMapReady && (
                        <div className="flex flex-col items-center justify-center gap-3 absolute z-10">
                            {mapError ? (
                                <div className="text-rose-600 flex flex-col items-center p-4 bg-rose-50 border border-rose-200 rounded-lg">
                                    <AlertTriangle className="w-8 h-8 mb-2" />
                                    <p className="font-bold">{mapError}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    <span className="text-neutral-500 font-medium text-sm">Memuat Peta Pelanggan...</span>
                                </>
                            )}
                        </div>
                    )}
                    <div ref={mapContainerRef} className="w-full h-full" />
                </div>
            </div>
        </div>
    );
}

NetworkMap.layout = {
    breadcrumbs: [
        {
            title: 'Peta Pelanggan',
            href: '/map',
        },
    ],
};
