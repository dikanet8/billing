import React, { useMemo } from 'react';
// @ts-ignore
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons via unpkg to avoid bundler issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Default center
const defaultCenter: [number, number] = [-6.1754, 106.8272];

// Dummy Data
const dummyCustomers = [
    { id: 'CST-001', name: 'Ahmad Net', lat: -6.1730, lng: 106.8250, status: 'Active' },
    { id: 'CST-002', name: 'Budi Home', lat: -6.1745, lng: 106.8290, status: 'Active' },
    { id: 'CST-003', name: 'Siti WiFi', lat: -6.1780, lng: 106.8280, status: 'Offline' },
];

const dummyODP = [
    { id: 'ODP-JKT-01', name: 'ODP Tiang 1', lat: -6.1750, lng: 106.8260 },
    { id: 'ODP-JKT-02', name: 'ODP Tiang 2', lat: -6.1765, lng: 106.8285 },
];

const dummyOLT = [
    { id: 'OLT-01', name: 'NOC Pusat', lat: -6.1710, lng: 106.8220 },
];

// Fiber Line Coordinates
const fiberPath: [number, number][] = [
    [-6.1710, 106.8220],
    [-6.1750, 106.8260],
    [-6.1765, 106.8285],
];

// SVGs for custom icons
const svgMapPin = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
const svgTriangle = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><polygon points="12,7 9,13 15,13"></polygon></svg>`;
const svgSquare = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><rect x="9" y="7" width="6" height="6"></rect></svg>`;

export default function LeafletMap({ 
    showCustomers, 
    showODP, 
    showOLT, 
    showFiber 
}: { 
    showCustomers: boolean, 
    showODP: boolean, 
    showOLT: boolean, 
    showFiber: boolean 
}) {
    // Generate icons inside useMemo to ensure they only run on client render
    const icons = useMemo(() => ({
        customerOnline: L.divIcon({
            className: 'bg-transparent border-none',
            html: `<div class="w-8 h-8 rounded-full bg-blue-500 text-white border-2 border-white flex items-center justify-center shadow-md">${svgMapPin}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        customerOffline: L.divIcon({
            className: 'bg-transparent border-none',
            html: `<div class="w-8 h-8 rounded-full bg-neutral-400 text-white border-2 border-white flex items-center justify-center shadow-md">${svgMapPin}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        odp: L.divIcon({
            className: 'bg-transparent border-none',
            html: `<div class="w-8 h-8 rounded-full bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-md">${svgTriangle}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        olt: L.divIcon({
            className: 'bg-transparent border-none',
            html: `<div class="w-10 h-10 rounded-full bg-purple-500 text-white border-[3px] border-white flex items-center justify-center shadow-lg">${svgSquare}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        })
    }), []);

    return (
        <MapContainer 
            center={defaultCenter} 
            zoom={15} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* OLT Marker */}
            {showOLT && dummyOLT.map(olt => (
                <Marker key={olt.id} position={[olt.lat, olt.lng]} icon={icons.olt}>
                    <Popup className="custom-popup">
                        <div className="p-1 min-w-[150px] text-neutral-900">
                            <h4 className="font-bold text-sm mb-1">{olt.name}</h4>
                            <p className="text-xs text-neutral-500 mb-0">Tipe: OLT • ID: {olt.id}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* ODP Markers */}
            {showODP && dummyODP.map(odp => (
                <Marker key={odp.id} position={[odp.lat, odp.lng]} icon={icons.odp}>
                    <Popup>
                        <div className="p-1 min-w-[150px] text-neutral-900">
                            <h4 className="font-bold text-sm mb-1">{odp.name}</h4>
                            <p className="text-xs text-neutral-500 mb-0">Tipe: ODP • ID: {odp.id}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Customer Markers */}
            {showCustomers && dummyCustomers.map(cst => (
                <Marker key={cst.id} position={[cst.lat, cst.lng]} icon={cst.status === 'Active' ? icons.customerOnline : icons.customerOffline}>
                    <Popup>
                        <div className="p-1 min-w-[150px] text-neutral-900">
                            <h4 className="font-bold text-sm mb-1">{cst.name}</h4>
                            <p className="text-xs text-neutral-500 mb-2">Tipe: Customer • ID: {cst.id}</p>
                            <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded w-fit">
                                Status: {cst.status}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Fiber Line */}
            {showFiber && (
                <Polyline 
                    positions={fiberPath}
                    pathOptions={{ color: '#f97316', weight: 4, opacity: 0.8 }}
                />
            )}
        </MapContainer>
    );
}
