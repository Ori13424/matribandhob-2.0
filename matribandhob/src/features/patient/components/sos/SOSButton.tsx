"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; // <--- Using Client SDK (Works!)

export default function SOSButton({ user, contacts, onTrigger }: any) {
  const [status, setStatus] = useState<'idle' | 'counting' | 'sending' | 'sent'>('idle');
  const [count, setCount] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- START HOLD TIMER ---
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

  // --- CANCEL IF RELEASED EARLY ---
  const cancelSOS = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (status === 'counting') {
        setStatus('idle');
        setCount(5);
    }
  };

  // --- SEND ALERT TO FIREBASE ---
  const triggerAlert = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus('sending');

    try {
      // 1. Get Location (Browser Native)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) resolve({ coords: { latitude: 0, longitude: 0 } } as any);
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
            console.warn("Location failed", err);
            resolve({ coords: { latitude: 0, longitude: 0 } } as any);
        }, { timeout: 5000 });
      });

      // 2. Write to Firestore 'alerts' collection
      // The Doctor Dashboard listens to this collection automatically.
      await addDoc(collection(db, "alerts"), {
        patientId: user?.uid || "guest",
        patientName: user?.displayName || "Mother",
        photoURL: user?.photoURL || "",
        type: "EMERGENCY_SOS",
        status: "active", // This triggers the red alarm on doctor side
        timestamp: serverTimestamp(),
        location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        },
        notifiedContacts: contacts || []
      });

      // 3. Open SMS on Phone (Fallback notification)
      if (contacts && contacts.length > 0) {
        const numbers = contacts.map((c: any) => c.phone).join(',');
        const mapLink = `http://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
        
        // Slight delay to allow UI to update
        setTimeout(() => {
            window.location.href = `sms:${numbers}?body=${encodeURIComponent(`EMERGENCY! I need help. My location: ${mapLink}`)}`;
        }, 500);
      }

      setStatus('sent');
      if (onTrigger) onTrigger();

    } catch (error) {
      console.error("SOS Error:", error);
      alert("Internet Connection Failed. Please call 16263 directly.");
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      
      {/* IDLE STATE - BIG RED BUTTON */}
      {status === 'idle' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onMouseDown={startSOS}
          onTouchStart={startSOS}
          onMouseUp={cancelSOS}
          onTouchEnd={cancelSOS}
          onMouseLeave={cancelSOS}
          className="w-64 h-64 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-700 shadow-[0_0_60px_rgba(225,29,72,0.4)] flex flex-col items-center justify-center border-8 border-white/30 relative overflow-hidden group select-none transition-all active:shadow-[0_0_80px_rgba(225,29,72,0.6)]"
        >
          {/* Subtle Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <div className="relative z-10 flex flex-col items-center">
             <AlertTriangle className="w-24 h-24 text-white drop-shadow-md mb-2" />
             <span className="text-4xl font-black text-white tracking-[0.2em] drop-shadow-md">SOS</span>
             <span className="text-xs text-white/90 font-bold uppercase mt-3 tracking-widest bg-black/20 px-3 py-1 rounded-full">
                Hold for 5s
             </span>
          </div>
        </motion.button>
      )}

      {/* COUNTDOWN STATE */}
      {status === 'counting' && (
        <div className="flex flex-col items-center">
            <div className="w-64 h-64 rounded-full bg-red-600 flex items-center justify-center relative shadow-[0_0_100px_rgba(220,38,38,0.8)] border-8 border-white">
                <motion.div 
                    animate={{ scale: [1, 1.4, 1] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="absolute inset-0 rounded-full border-4 border-white opacity-40"
                />
                <span className="text-8xl font-black text-white tabular-nums">{count}</span>
            </div>
            <p className="mt-8 text-red-500 font-black animate-pulse text-xl tracking-widest">SENDING ALERT...</p>
            <p className="text-xs text-slate-400 font-bold uppercase">Release to Cancel</p>
        </div>
      )}

      {/* SENDING LOADING STATE */}
      {status === 'sending' && (
        <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-red-600 to-pink-600 flex flex-col items-center justify-center shadow-xl border-8 border-white/20">
            <Loader2 className="w-20 h-20 text-white animate-spin mb-4" />
            <span className="text-white font-bold text-xl tracking-widest">LOCATING...</span>
        </div>
      )}

      {/* SUCCESS STATE */}
      {status === 'sent' && (
        <div className="flex flex-col items-center animate-in zoom-in duration-300">
             <div className="w-64 h-64 rounded-full bg-green-500 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.5)] border-8 border-white">
                <CheckCircle2 className="w-24 h-24 text-white mb-3" />
                <span className="text-white font-black text-2xl tracking-widest">SENT!</span>
            </div>
            <p className="mt-6 text-center text-slate-500 font-medium max-w-xs">
                Emergency Alert sent to Doctor Dashboard & Contacts.
            </p>
            <button 
                onClick={() => setStatus('idle')} 
                className="mt-6 px-8 py-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-sm font-bold transition-colors"
            >
                Reset Button
            </button>
        </div>
      )}
    </div>
  );
}