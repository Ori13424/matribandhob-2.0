"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, StopCircle, ChevronRight } from "lucide-react"; 
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext"; // Added Theme Context

export default function SOSHomeWidget() {
  const router = useRouter();
  const { darkMode } = useTheme(); // Get current theme
  
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Quick Access");
  const [watchId, setWatchId] = useState<number | null>(null);
  const sirenRef = useRef<HTMLAudioElement | null>(null);

  // --- SOUND SETUP ---
  useEffect(() => {
    sirenRef.current = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_731818292c.mp3?filename=police-siren-one-loop-23263.mp3");
    sirenRef.current.loop = true;
    
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      sirenRef.current?.pause();
    };
  }, [watchId]);

  // --- NAVIGATION ---
  const handleOpenPage = () => {
    router.push("/patient/care/sos");
  };

  // --- QUICK SOS HANDLER ---
  const handleQuickSOS = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!auth.currentUser) return;
    
    const newState = !isSOSActive;
    setIsSOSActive(newState);
    const userRef = doc(db, "users", auth.currentUser.uid);

    if (newState) {
      // --- ACTIVATE ---
      sirenRef.current?.play().catch(e => console.log("Audio Error", e));
      setLocationStatus("Acquiring GPS...");
      
      await updateDoc(userRef, { sosTriggered: true, lastSOS: serverTimestamp() });
      await addDoc(collection(db, "alerts"), {
         patientId: auth.currentUser.uid,
         type: "EMERGENCY_SOS",
         status: "active",
         timestamp: serverTimestamp()
      });

      if ("geolocation" in navigator) {
        const id = navigator.geolocation.watchPosition(
          async (position) => {
            setLocationStatus("Tracking Live...");
            await updateDoc(userRef, {
              location: { lat: position.coords.latitude, lng: position.coords.longitude, updatedAt: serverTimestamp() }
            });
          },
          () => setLocationStatus("GPS Failed"),
          { enableHighAccuracy: true }
        );
        setWatchId(id);
      }
    } else {
      // --- DEACTIVATE ---
      sirenRef.current?.pause();
      sirenRef.current!.currentTime = 0;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationStatus("Quick Access");
      await updateDoc(userRef, { sosTriggered: false });
    }
  };

  return (
    <motion.div 
      layout
      onClick={handleOpenPage}
      whileHover={{ scale: 1.02 }}
      className={`relative w-full h-full rounded-[2.5rem] border overflow-hidden cursor-pointer group flex flex-col items-center justify-center gap-3 p-6 shadow-lg transition-all duration-500
      ${isSOSActive 
        ? "bg-gradient-to-br from-red-600 via-rose-600 to-red-700 border-red-500 shadow-red-900/50" 
        : darkMode 
          ? "bg-[#1e1b20] border-white/10 hover:border-pink-500/30" // Dark Mode Styles
          : "bg-white/60 border-pink-100 hover:border-pink-300 hover:shadow-pink-100" // Light Mode Styles
      }`}
    >
      
      {/* Active Animation */}
      {isSOSActive && (
        <>
          <motion.div 
             animate={{ scale: [1, 2], opacity: [0.3, 0] }}
             transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
             className="absolute inset-0 bg-white rounded-[2.5rem] z-0"
          />
          <motion.div 
             animate={{ opacity: [0, 0.2, 0] }}
             transition={{ repeat: Infinity, duration: 0.5 }}
             className="absolute inset-0 bg-red-400 mix-blend-overlay z-0"
          />
        </>
      )}

      {/* Arrow Icon */}
      {!isSOSActive && (
        <div className={`absolute top-4 right-4 transition-colors z-10 ${darkMode ? "text-slate-600 group-hover:text-pink-400" : "text-pink-200 group-hover:text-pink-500"}`}>
            <ChevronRight className="w-5 h-5" />
        </div>
      )}

      {/* QUICK ACTION BUTTON */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={handleQuickSOS}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-inner z-10 relative transition-colors
          ${isSOSActive 
            ? "bg-white text-red-600" 
            : darkMode 
              ? "bg-[#120a10] text-red-500 border border-white/5 hover:bg-white/5" 
              : "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100"}`}
      >
        {isSOSActive ? (
          <StopCircle className="w-10 h-10 animate-bounce" />
        ) : (
          <AlertTriangle className="w-10 h-10" />
        )}
      </motion.button>

      {/* TEXT CONTENT */}
      <div className="text-center z-10">
        <h3 className={`font-black text-xl uppercase tracking-wider transition-colors
           ${isSOSActive ? "text-white" : darkMode ? "text-slate-200" : "text-slate-800"}`}>
          {isSOSActive ? "SOS ACTIVE" : "Emergency"}
        </h3>
        
        <p className={`text-xs font-medium mt-1 flex items-center justify-center gap-1 transition-colors
           ${isSOSActive ? "text-red-100" : darkMode ? "text-slate-500" : "text-slate-400"}`}>
          {locationStatus === "Tracking Live..." && <Loader2 className="w-3 h-3 animate-spin" />}
          {locationStatus}
        </p>
      </div>
      
      {isSOSActive ? (
         <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute bottom-4 text-[10px] text-white/90 font-bold uppercase tracking-widest z-10"
         >
            Tap Icon to Stop
         </motion.p>
      ) : (
         <p className={`absolute bottom-4 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity z-10
            ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Tap card for details
         </p>
      )}
    </motion.div>
  );
}