"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, MapPin } from "lucide-react";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendSOSNotification } from "@/app/sos";

export default function SOSButton({ user, contacts, onTrigger }: any) {
  const [status, setStatus] = useState<'idle' | 'counting' | 'sending' | 'sent'>('idle');
  const [count, setCount] = useState(5);
  
  // Store the live location locally
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sirenRef = useRef<HTMLAudioElement | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // --- 1. INITIALIZE AUDIO & START GPS TRACKING IMMEDIATELY ---
  useEffect(() => {
    // Setup Siren
    sirenRef.current = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_731818292c.mp3?filename=police-siren-one-loop-23263.mp3");
    sirenRef.current.loop = true;

    // Start Watching Location Immediately (Warms up GPS)
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Update local state
          setCurrentLocation({ lat: latitude, lng: longitude });

          // If an alert is ALREADY active, update the DB in real-time (Live Tracking)
          if (activeAlertId) {
            updateLiveLocation(activeAlertId, latitude, longitude);
          }
        },
        (error) => console.error("GPS Watch Error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [activeAlertId]); // Re-run if activeAlertId changes so the closure captures it

  // Helper to push live updates to Firestore
  const updateLiveLocation = async (alertId: string, lat: number, lng: number) => {
    try {
      const alertRef = doc(db, "alerts", alertId);
      await updateDoc(alertRef, {
        location: { lat, lng },
        googleMapsLink: `http://maps.google.com/?q=${lat},${lng}`,
        lastUpdate: serverTimestamp()
      });
      // Also update user profile for redundancy
      if (user?.uid) {
         await updateDoc(doc(db, "users", user.uid), {
            lastKnownLocation: { lat, lng }
         });
      }
    } catch (e) {
      console.error("Live update failed", e);
    }
  };

  const playSiren = () => {
    if (sirenRef.current) {
        sirenRef.current.currentTime = 0;
        sirenRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const stopSiren = () => {
    if (sirenRef.current) {
        sirenRef.current.pause();
        sirenRef.current.currentTime = 0;
    }
  };

  // --- 2. SOS INTERACTION LOGIC ---
  const startSOS = () => {
    if (status !== 'idle') return;
    setStatus('counting');
    setCount(5);
    
    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          triggerAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (status === 'counting') {
        setStatus('idle');
        setCount(5);
    }
  };

  // --- 3. TRIGGER ALERT WITH BEST AVAILABLE LOCATION ---
  const triggerAlert = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus('sending');

    try {
      playSiren();

      // Use the location we have been watching. 
      // If still null (rare, unless GPS is broken), try one last force fetch.
      let finalLat = currentLocation?.lat || 0;
      let finalLng = currentLocation?.lng || 0;

      if (finalLat === 0) {
         // Fallback: One desperate attempt to get location if watch failed
         try {
             const pos: any = await new Promise((resolve, reject) => {
                 navigator.geolocation.getCurrentPosition(resolve, reject, {enableHighAccuracy: true, timeout: 3000});
             });
             finalLat = pos.coords.latitude;
             finalLng = pos.coords.longitude;
             setCurrentLocation({ lat: finalLat, lng: finalLng });
         } catch (e) {
             console.warn("Could not fetch fallback location");
         }
      }

      const mapsLink = `http://maps.google.com/?q=${finalLat},${finalLng}`;
      const patientName = user?.name || user?.displayName || "Unknown Patient";
      const patientPhone = user?.phone || user?.phoneNumber || user?.basicInfo?.phone || user?.contact || "N/A";

      // Create Alert Record in Firestore
      const docRef = await addDoc(collection(db, "alerts"), {
        patientId: user?.uid || "guest",
        patientName: patientName,
        phone: patientPhone,
        type: "EMERGENCY_SOS",
        priority: "CRITICAL",
        status: "OPEN",
        timestamp: serverTimestamp(),
        location: { lat: finalLat, lng: finalLng }, // Initial Location
        googleMapsLink: mapsLink,
        notifiedContacts: contacts || [],
        deviceInfo: navigator.userAgent || "Unknown Device"
      });

      // Save the ID so the `watchPosition` effect can start updating it live
      setActiveAlertId(docRef.id);

      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
            sosTriggered: true, 
            lastKnownLocation: { lat: finalLat, lng: finalLng },
            lastEmergencyTime: serverTimestamp()
        });
      }
      
      // Send Twilio SMS (Server Action)
      if (contacts && contacts.length > 0) {
         sendSOSNotification(
            contacts, 
            { name: patientName, phone: patientPhone }, 
            mapsLink
         );
      }

      setStatus('sent');
      if (onTrigger) onTrigger();

    } catch (error) {
      console.error("SOS Failure:", error);
      alert("Network Warning: Check internet. Siren is active.");
      setStatus('sent'); 
    }
  };

  const resetSOS = async () => {
    stopSiren();
    setActiveAlertId(null); // Stop live DB updates
    
    if (user?.uid) {
        try {
            await updateDoc(doc(db, "users", user.uid), { sosTriggered: false });
        } catch (e) { console.error("Reset failed", e); }
    }
    setStatus('idle');
    setCount(5);
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {/* GPS STATUS INDICATOR (Optional visual to see if GPS is locked) */}
      <div className={`absolute top-0 right-0 m-4 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${currentLocation ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
        <MapPin className="w-3 h-3" />
        {currentLocation ? "GPS LOCKED" : "SEARCHING GPS..."}
      </div>

      {status === 'idle' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onMouseDown={startSOS}
          onTouchStart={startSOS}
          onMouseUp={cancelSOS}
          onTouchEnd={cancelSOS}
          className="w-64 h-64 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-700 shadow-[0_0_60px_rgba(225,29,72,0.4)] flex flex-col items-center justify-center border-8 border-white/30 relative overflow-hidden group select-none"
        >
          <div className="relative z-10 flex flex-col items-center">
             <AlertTriangle className="w-24 h-24 text-white mb-2" />
             <span className="text-4xl font-black text-white tracking-[0.2em]">SOS</span>
             <span className="text-xs text-white/90 font-bold uppercase mt-3 bg-black/20 px-3 py-1 rounded-full">Hold 5s</span>
          </div>
        </motion.button>
      )}

      {status === 'counting' && (
        <div className="flex flex-col items-center">
            <div className="w-64 h-64 rounded-full bg-red-600 flex items-center justify-center border-8 border-white">
                <span className="text-8xl font-black text-white">{count}</span>
            </div>
            <p className="mt-8 text-red-500 font-black animate-pulse text-xl">HOLDING...</p>
        </div>
      )}

      {status === 'sending' && (
        <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-red-600 to-pink-600 flex flex-col items-center justify-center border-8 border-white/20">
            <Loader2 className="w-20 h-20 text-white animate-spin mb-4" />
            <span className="text-white font-bold tracking-widest">SENDING...</span>
        </div>
      )}

      {status === 'sent' && (
        <div className="flex flex-col items-center animate-in zoom-in duration-300">
             <div className="w-64 h-64 rounded-full bg-green-500 flex flex-col items-center justify-center border-8 border-white shadow-2xl">
                <CheckCircle2 className="w-24 h-24 text-white mb-3" />
                <span className="text-white font-black text-2xl tracking-widest">SENT!</span>
            </div>
            <p className="mt-6 text-center text-slate-500 font-bold animate-pulse">Siren Active • Live Tracking On</p>
            <button onClick={resetSOS} className="mt-6 px-8 py-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold flex items-center gap-2 transition-colors">
                <RefreshCw className="w-4 h-4" /> Stop Siren & Reset
            </button>
        </div>
      )}
    </div>
  );
}