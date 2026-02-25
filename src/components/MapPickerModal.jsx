import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons not loading correctly in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks and setting the pin
const LocationMarker = ({ position, onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
};

const MapPickerModal = ({ isOpen, onClose, onConfirm, initialPosition }) => {
    const defaultCenter = [18.5204, 73.8567]; // Pune as fallback default
    const [loading, setLoading] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(initialPosition || null);

    if (!isOpen) return null;

    const handleMapClick = async (latlng) => {
        const lat = latlng.lat;
        const lng = latlng.lng;

        setSelectedPosition([lat, lng]);

        try {
            setLoading(true);
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            const address = data?.display_name || "";

            onConfirm({
                lat,
                lng,
                address
            });
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            onConfirm({
                lat,
                lng,
                address: ""
            });
        } finally {
            setLoading(false);
            onClose(); // Auto-close once resolved following user prompt logic
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Background overlay */}
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-neutral-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Vertical centering hack */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal panel */}
                <div
                    className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <div className="mt-3 text-center sm:mt-0 sm:text-left">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-medium text-neutral-900" id="modal-title">
                                    Select Location
                                </h3>
                                {loading && <span className="text-sm text-primary-600 font-medium">Fetching address...</span>}
                            </div>
                            <div className="mt-2">
                                <p className="text-sm text-neutral-500 mb-4">
                                    Click on the map to pin the exact location.
                                </p>

                                <div className="h-[400px] w-full rounded-md border border-neutral-300 overflow-hidden relative">
                                    <MapContainer
                                        center={initialPosition || defaultCenter}
                                        zoom={12}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationMarker position={selectedPosition} onMapClick={handleMapClick} />
                                    </MapContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPickerModal;
