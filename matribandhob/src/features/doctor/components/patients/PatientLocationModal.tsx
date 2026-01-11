"use client";
import { X, MapPin, ExternalLink, Navigation } from "lucide-react";

export default function PatientLocationModal({ patient, onClose }: any) {
  
  // 1. Get Real Coordinates from Database (or default to Dhaka if missing)
  // We check if patient.location exists first.
  const hasLocation = patient.location && patient.location.lat && patient.location.lng;
  
  const lat = hasLocation ? patient.location.lat : 23.8103; 
  const lng = hasLocation ? patient.location.lng : 90.4125;

  // 2. Free OpenStreetMap URL (Dynamic)
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  
  // 3. Google Maps Direct Link (For Navigation)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl h-[600px] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header / Controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
            {/* Status Badge */}
            <div className={`pointer-events-auto px-4 py-2 rounded-xl shadow-lg backdrop-blur-md border flex items-center gap-3
                ${hasLocation ? "bg-white/90 border-teal-100" : "bg-red-50/90 border-red-100"}`}>
                <div className={`w-3 h-3 rounded-full ${hasLocation ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">{patient.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500">
                        {hasLocation ? "Live Location Active" : "Location Not Shared"}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 pointer-events-auto">
                {hasLocation && (
                    <a href={googleMapsUrl} target="_blank" rel="noreferrer" 
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-colors">
                        <Navigation className="w-4 h-4" /> Navigate
                    </a>
                )}
                <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-700 shadow-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* The Map */}
        <div className="flex-1 bg-slate-100 relative w-full h-full">
          {hasLocation ? (
             <iframe 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               scrolling="no" 
               src={osmEmbedUrl}
               className="w-full h-full"
             ></iframe>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                <MapPin className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">No GPS Data Available</p>
                <p className="text-xs">The patient has not enabled location sharing.</p>
             </div>
          )}
          
          {/* Coordinates Footer */}
          {hasLocation && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-xl border border-slate-200 text-xs font-mono font-bold text-slate-600">
                 LAT: {lat.toFixed(5)} | LNG: {lng.toFixed(5)}
              </div>
          )}
        </div>

      </div>
    </div>
  );
}