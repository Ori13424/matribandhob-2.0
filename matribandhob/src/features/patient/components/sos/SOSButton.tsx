"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SOSButton({ user, contacts, onTrigger }: any) {
  const [status, setStatus] = useState<'idle' | 'counting' | 'sending' | 'sent'>('idle');
  const [count, setCount] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sirenRef = useRef<HTMLAudioElement | null>(null);

  // --- SOUND EFFECT SETUP ---
  useEffect(() => {
    sirenRef.current = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_731818292c.mp3?filename=police-siren-one-loop-23263.mp3");
    sirenRef.current.loop = true;
  }, []);

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

  const cancelSOS = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (status === 'counting') {
        setStatus('idle');
        setCount(5);
    }
  };

  // --- SEND ALERT ---
  const triggerAlert = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus('sending');

    try {
      // 1. Play Sound
      playSiren();

      // 2. Get Location (Safe Fallback)
      const position = await new Promise<GeolocationPosition>((resolve) => {
        if (!navigator.geolocation) {
            resolve({ coords: { latitude: 0, longitude: 0 } } as any);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos), 
            () => resolve({ coords: { latitude: 0, longitude: 0 } } as any),
            { enableHighAccuracy: true, timeout: 5000 }
        );
      });

      const loc = { lat: position.coords.latitude, lng: position.coords.longitude };

      // 3. Create Alert Record
      await addDoc(collection(db, "alerts"), {
        patientId: user?.uid || "guest",
        patientName: user?.displayName || "Mother",
        type: "EMERGENCY_SOS",
        status: "active",
        timestamp: serverTimestamp(),
        location: loc,
        notifiedContacts: contacts || []
      });

      // 4. Update User Profile
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
            sosTriggered: true, 
            location: loc,
            lastActive: serverTimestamp()
        });
      }
      
      // 5. Open SMS (Fallback)
      if (contacts && contacts.length > 0) {
        const numbers = contacts.map((c: any) => c.phone).join(',');
        const mapLink = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
        setTimeout(() => {
            window.location.href = `sms:${numbers}?body=${encodeURIComponent(`EMERGENCY! I need help. My location: ${mapLink}`)}`;
        }, 500);
      }

      setStatus('sent');
      if (onTrigger) onTrigger();

    } catch (error) {
      console.error("SOS Error:", error);
      stopSiren();
      alert("Connection Failed. Call 999 immediately.");
      setStatus('idle');
    }
  };

  // --- RESET FUNCTION ---
  const resetSOS = async () => {
    stopSiren();
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
            <p className="mt-6 text-center text-slate-500 font-bold animate-pulse">Siren Active • Doctor Notified</p>
            <button onClick={resetSOS} className="mt-6 px-8 py-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold flex items-center gap-2 transition-colors">
                <RefreshCw className="w-4 h-4" /> Stop Siren & Reset
            </button>
        </div>
      )}
    </div>
  );
}