"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Plus, Minus, Trophy } from "lucide-react";
import { doc, getDoc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WaterWidgetProps {
  user: any;
  darkMode: boolean;
}

export default function WaterIntakeWidget({ user, darkMode }: WaterWidgetProps) {
  const [count, setCount] = useState(0);
  const [bubbles, setBubbles] = useState<{ id: number; left: number }[]>([]);
  const goal = 8;

  // --- 1. LOAD DATA ---
  useEffect(() => {
    if (!user) return;
    const fetchWater = async () => {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, "users", user.uid, "daily_logs", today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCount(docSnap.data().waterCount || 0);
      }
    };
    fetchWater();
  }, [user]);

  // --- 2. HANDLERS ---
  const handleUpdate = async (amount: number) => {
    const newCount = Math.max(0, count + amount); // Prevent negative
    setCount(newCount);

    // Trigger Bubble Animation on Add
    if (amount > 0) {
      const id = Date.now();
      setBubbles(prev => [...prev, { id, left: Math.random() * 80 + 10 }]); // Random pos 10-90%
      setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), 2000); // Remove after 2s
    }

    // Save to DB
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, "users", user.uid, "daily_logs", today);
      try {
        await setDoc(docRef, {
          waterCount: increment(amount),
          lastUpdate: serverTimestamp(),
          date: today
        }, { merge: true });
      } catch (error) {
        console.error("Save failed:", error);
      }
    }
  };

  // Percentage for liquid height (Cap at 100%)
  const fillHeight = Math.min((count / goal) * 100, 100);
  const isGoalReached = count >= goal;

  return (
    <div className={`h-40 rounded-3xl border relative overflow-hidden transition-all duration-300 group
      ${darkMode 
        ? "bg-[#1e1b20]/50 border-white/5 hover:border-blue-500/30" 
        : "bg-white/80 border-blue-100 shadow-sm hover:shadow-md backdrop-blur-md"}`}
    >
      
      {/* --- LIQUID BACKGROUND ANIMATION --- */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-0"
        initial={{ height: "0%" }}
        animate={{ height: `${fillHeight}%` }}
        transition={{ type: "spring", stiffness: 50, damping: 15 }}
      >
        {/* The Liquid Gradient */}
        <div className={`w-full h-full opacity-30 ${darkMode ? "bg-blue-600" : "bg-blue-400"}`} />
        
        {/* The "Wave" Top Border */}
        <div className={`absolute top-0 w-full h-1 opacity-50 ${darkMode ? "bg-blue-400" : "bg-blue-300"}`} />
      </motion.div>

      {/* --- FLOATING BUBBLES --- */}
      <AnimatePresence>
        {bubbles.map(bubble => (
          <motion.div
            key={bubble.id}
            initial={{ bottom: "0%", opacity: 0, scale: 0.5 }}
            animate={{ bottom: "120%", opacity: [0, 1, 0], scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute z-0 w-4 h-4 rounded-full border border-blue-300/50 bg-white/20 backdrop-blur-sm"
            style={{ left: `${bubble.left}%` }}
          />
        ))}
      </AnimatePresence>

      {/* --- STATIC BACKGROUND LOGO --- */}
      <div className={`absolute top-[-20%] right-[-20%] p-4 transition-opacity pointer-events-none z-0 ${darkMode ? "opacity-5 group-hover:opacity-10" : "opacity-[0.05] group-hover:opacity-[0.08]"}`}>
        <Droplet className="w-32 h-32 text-blue-500" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
              {isGoalReached ? <Trophy className="w-5 h-5 animate-bounce" /> : <Droplet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={`text-sm font-bold leading-tight ${darkMode ? "text-white" : "text-slate-800"}`}>Hydration</h3>
              <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                Goal: {goal} glasses
              </p>
            </div>
          </div>

          {/* Quick Decrement (Correction) */}
          <button 
            onClick={() => handleUpdate(-1)}
            disabled={count === 0}
            className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-slate-100 text-slate-400"}`}
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Controls & Display */}
        <div className="flex items-end justify-between mt-1">
          
          {/* Big Number */}
          <div>
            <span className={`text-5xl font-black tracking-tighter block transition-colors duration-300
               ${isGoalReached ? (darkMode ? "text-blue-400" : "text-blue-600") : (darkMode ? "text-white" : "text-slate-900")}`}
            >
              {count}<span className={`text-xl font-medium ${darkMode ? "text-gray-600" : "text-slate-400"}`}>/{goal}</span>
            </span>
            <span className={`text-xs font-bold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-slate-400"}`}>
              {isGoalReached ? "Daily Goal Met! 💧" : "Keep Drinking"}
            </span>
          </div>

          {/* ADD BUTTON */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleUpdate(1)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative group/btn border
              ${darkMode 
                ? "bg-gradient-to-tr from-blue-600 to-cyan-600 border-white/10 text-white" 
                : "bg-gradient-to-tr from-blue-500 to-cyan-500 border-white/20 text-white shadow-blue-200"}`}
          >
            <Plus className="w-7 h-7" />
          </motion.button>
        </div>

      </div>
    </div>
  );
}