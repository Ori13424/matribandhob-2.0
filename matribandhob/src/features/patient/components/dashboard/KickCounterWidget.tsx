"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom"; // Import Portal
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, RotateCcw, Clock, AlertTriangle } from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface KickCounterProps {
  user: any; 
  darkMode: boolean;
}

export default function KickCounterWidget({ user, darkMode }: KickCounterProps) {
  const [count, setCount] = useState(0);
  const [lastKickTime, setLastKickTime] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState("No kicks today");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [mounted, setMounted] = useState(false); // Track if running on client

  // --- 1. LOAD DATA & HANDLE MOUNT ---
  useEffect(() => {
    setMounted(true); // Enable Portal rendering
    if (!user) return;

    const fetchTodayStats = async () => {
      const today = new Date().toISOString().split('T')[0]; 
      const docRef = doc(db, "users", user.uid, "daily_logs", today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCount(data.kickCount || 0);
        if (data.lastKickTime) {
          setLastKickTime(data.lastKickTime.toDate());
        }
      }
    };

    fetchTodayStats();
  }, [user]);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    if (!lastKickTime) {
      setTimeAgo("No kicks today");
      return;
    }
    const updateTimeAgo = () => {
      const diff = Math.floor((new Date().getTime() - lastKickTime.getTime()) / 60000);
      if (diff < 1) setTimeAgo("Just now");
      else if (diff < 60) setTimeAgo(`${diff}m ago`);
      else setTimeAgo(`${Math.floor(diff / 60)}h ago`);
    };
    updateTimeAgo(); 
    const interval = setInterval(updateTimeAgo, 60000); 
    return () => clearInterval(interval);
  }, [lastKickTime]);

  // --- 3. HANDLERS ---
  const handleKick = async () => {
    const newCount = count + 1;
    setCount(newCount);
    const now = new Date();
    setLastKickTime(now);
    setTimeAgo("Just now");
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, "users", user.uid, "daily_logs", today);
      try {
        await setDoc(docRef, {
          kickCount: increment(1),
          lastKickTime: serverTimestamp(),
          date: today
        }, { merge: true });
      } catch (error) {
        console.error("Failed to save kick:", error);
      }
    }
  };

  const handleResetRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (count > 0) setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setCount(0);
    setLastKickTime(null);
    setTimeAgo("No kicks today");
    setShowResetConfirm(false);
    
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, "users", user.uid, "daily_logs", today);
      await updateDoc(docRef, { kickCount: 0 });
    }
  };

  const goal = 10;
  const progress = Math.min((count / goal) * 100, 100);

  return (
    <>
      {/* --- WIDGET CARD --- */}
      <div className={`h-40 rounded-3xl border relative overflow-hidden transition-all duration-300 group
        ${darkMode 
          ? "bg-[#1e1b20]/50 border-white/5 hover:bg-[#252128] hover:border-purple-500/30" 
          : "bg-white/80 border-purple-100 shadow-sm hover:shadow-md backdrop-blur-md"}`}
      >
        <div className={`absolute top-[-20%] right-[-20%] p-4 transition-opacity pointer-events-none ${darkMode ? "opacity-5" : "opacity-[0.05]"}`}>
          <Footprints className="w-40 h-40 text-purple-500" />
        </div>

        <div className="relative z-10 p-6 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                <Footprints className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold leading-tight ${darkMode ? "text-white" : "text-slate-800"}`}>Kick Counter</h3>
                <p className={`text-[10px] flex items-center gap-1 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                  <Clock className="w-3 h-3" /> {timeAgo}
                </p>
              </div>
            </div>
            <button 
              onClick={handleResetRequest}
              className={`p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${darkMode ? "hover:bg-white/10 text-gray-500 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"}`}
              title="Reset Counter"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div onClick={handleKick} className="cursor-pointer select-none">
              <span className={`text-5xl font-black tracking-tighter block transition-transform duration-100 ${isAnimating ? "scale-110" : "scale-100"} ${darkMode ? "text-white" : "text-slate-900"}`}>
                {count}
              </span>
              <span className={`text-xs font-bold uppercase tracking-widest pl-1 ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                {count >= goal ? "Goal Reached! 🎉" : "Kicks Today"}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleKick}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative group/btn ${darkMode ? "bg-gradient-to-tr from-purple-600 to-pink-600 border border-white/10" : "bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-purple-200"}`}
            >
              {isAnimating && <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />}
              <Footprints className="w-6 h-6 text-white fill-current" />
            </motion.button>
          </div>

          <div className="w-full h-1 bg-gray-200/20 rounded-full mt-auto overflow-hidden relative">
             <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full rounded-full ${count >= goal ? "bg-green-500" : "bg-purple-500"}`} />
          </div>
        </div>
      </div>

      {/* --- PORTAL MODAL (Fixes Positioning) --- */}
      {mounted && showResetConfirm && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Prevent clicking backdrop
              className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl border flex flex-col items-center text-center
                ${darkMode ? "bg-[#1a0b10] border-white/10 text-white" : "bg-white border-white/50 text-slate-900"}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${darkMode ? "bg-red-500/20 text-red-500" : "bg-red-50 text-red-600"}`}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-black mb-2">Reset Counter?</h3>
              <p className={`text-sm mb-6 leading-relaxed ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                This will delete today's kick history. <br/> Are you sure you want to start over?
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors
                    ${darkMode ? "bg-white/5 hover:bg-white/10 text-gray-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReset}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-transform hover:scale-[1.02]"
                >
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}