"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker icons in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

// Custom Icons based on vehicle type
const getIcon = (type: string, isOnline: boolean) => {
  const color = isOnline ? "green" : "gray";
  // You can replace these URLs with custom SVG pins if you have them
  return new L.Icon({
    iconUrl: isOnline 
      ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
      : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function DriverMap({ drivers, selectedDriver, darkMode }: any) {
  // Rajshahi Default Center
  const defaultCenter: [number, number] = [24.3636, 88.6241]; 
  const activeCenter = selectedDriver?.location 
    ? [selectedDriver.location.lat, selectedDriver.location.lng] as [number, number]
    : defaultCenter;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full"
        style={{ background: darkMode ? "#0f172a" : "#f1f5f9" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={darkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        <MapUpdater center={activeCenter} />

        {drivers.map((driver: any) => {
            if(!driver.location) return null;
            return (
                <Marker 
                    key={driver.id} 
                    position={[driver.location.lat, driver.location.lng]}
                    icon={getIcon(driver.vehicleType, driver.isOnline)}
                >
                <Popup className="custom-popup">
                    <div className="p-1">
                        <strong className="block text-sm font-bold text-slate-800">{driver.name}</strong>
                        <span className="text-xs text-slate-500 capitalize">{driver.vehicleType} • {driver.plateNumber}</span>
                        <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded w-fit text-white ${driver.isOnline ? "bg-green-500" : "bg-slate-400"}`}>
                            {driver.isOnline ? "Available" : "Offline"}
                        </div>
                    </div>
                </Popup>
                </Marker>
            )
        })}
      </MapContainer>
    </div>
  );
}