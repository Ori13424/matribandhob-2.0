"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2, Navigation, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css"; // Essential for map styling
import { useTheme } from "@/context/ThemeContext"; // Import Theme Context

// 1. Dynamic Import for Map (Fixes SSR Issue)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

// 2. Fix for Default Leaflet Icons
import L from "leaflet";
const iconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

const customIcon = L.icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function DriverMapPage() {
  const { darkMode } = useTheme(); // Get dark mode state
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // --- GET LIVE LOCATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPos({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        () => setLoading(false)
      );
    }
  }, []);

  // --- STYLES HELPER ---
  const headingClass = darkMode ? "text-slate-100" : "text-slate-800";
  const subHeadingClass = darkMode ? "text-slate-400" : "text-slate-500";
  const badgeClass = darkMode 
    ? "bg-slate-900 border-slate-800 shadow-slate-900/50" 
    : "bg-white border-slate-100 shadow-sm";
  const mapContainerClass = darkMode ? "border-slate-800" : "border-white";
  const emptyStateClass = darkMode ? "bg-slate-900 text-slate-500" : "bg-slate-100 text-slate-500";

  if (loading) return (
      <div className="h-[80vh] flex items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin" />
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className={`text-2xl font-black ${headingClass}`}>Live Navigation</h1>
           <p className={`${subHeadingClass} text-sm`}>OpenStreetMap Satellite View</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${badgeClass}`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className={`text-xs font-bold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>GPS ACTIVE</span>
        </div>
      </div>

      <div className={`h-[75vh] w-full rounded-3xl overflow-hidden shadow-2xl border-4 relative z-0 ${mapContainerClass}`}>
        {!currentPos ? (
            <div className={`flex h-full items-center justify-center font-bold ${emptyStateClass}`}>
                <MapPin className="w-6 h-6 mr-2" /> Location Access Needed
            </div>
        ) : (
            <MapContainer 
                center={[currentPos.lat, currentPos.lng]} 
                zoom={15} 
                style={{ height: "100%", width: "100%" }}
            >
                {/* Free OpenStreetMap Tiles */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Driver Marker */}
                <Marker position={[currentPos.lat, currentPos.lng]} icon={customIcon}>
                    <Popup>
                        {/* Note: Leaflet popups are white by default, so we keep text dark here */}
                        <div className="text-center">
                            <b className="text-slate-900">You are here</b> <br /> 
                            <span className="text-slate-600">Ambulance 12</span>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        )}
      </div>
    </div>
  );
}