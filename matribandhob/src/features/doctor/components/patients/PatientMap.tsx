"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// --- FIX: Custom Icons Setup ---
// We define these outside the component to prevent re-creation on render
const iconBase = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/";

const blueIcon = new L.Icon({
  iconUrl: `${iconBase}marker-icon-2x-blue.png`,
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: `${iconBase}marker-icon-2x-red.png`,
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "animate-bounce-marker" // Custom class if you want extra CSS animation
});

// --- HELPER: Auto-Zoom to fit all patients ---
function MapBounds({ patients }: { patients: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (patients.length === 0) return;
    const bounds = L.latLngBounds(patients.map(p => [p.location.lat, p.location.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [patients, map]);
  
  return null;
}

export default function PatientMap({ patients }: { patients: any[] }) {
  // Filter for valid locations only
  const validPatients = patients.filter(p => p.location && p.location.lat && p.location.lng);
  
  // Default Center (Dhaka)
  const defaultCenter = [23.8103, 90.4125] as [number, number];

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden shadow-lg border border-slate-200 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={7} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds patients={validPatients} />

        {validPatients.map((patient) => (
          <Marker 
            key={patient.id} 
            position={[patient.location.lat, patient.location.lng]}
            // LOGIC: If SOS is true, use RED icon. Otherwise BLUE.
            icon={patient.sosTriggered ? redIcon : blueIcon} 
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <div className="flex items-center gap-2 mb-2">
                    <strong className="text-sm font-bold">{patient.name}</strong>
                    {patient.sosTriggered && (
                        <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                            SOS
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 m-0">
                    Week {patient.week} • {patient.status}
                </p>
                <a 
                  href={`https://www.google.com/maps?q=${patient.location.lat},${patient.location.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 font-bold mt-2 block hover:underline"
                >
                    Open in Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-md z-[1000] text-xs font-bold text-slate-600 flex flex-col gap-2">
         <div className="flex items-center gap-2">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" className="w-3 h-5"/>
            <span>Normal</span>
         </div>
         <div className="flex items-center gap-2">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" className="w-3 h-5"/>
            <span className="text-red-600">SOS Emergency</span>
         </div>
      </div>
    </div>
  );
}