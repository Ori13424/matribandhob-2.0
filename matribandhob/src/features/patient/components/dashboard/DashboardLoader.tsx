"use client";
import { motion } from "framer-motion";
import { Baby, Heart } from "lucide-react";

export default function DashboardLoader() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#120a10] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px]" />
      
      <div className="relative">
        {/* Pulsing Rings */}
        <motion.div 
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-pink-500/30"
        />
        <motion.div 
          animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-pink-500/20"
        />

        {/* Central Icon */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.4)] relative z-10"
        >
          <Baby className="w-12 h-12 text-white" />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-white font-black text-xl tracking-widest uppercase">Matri-Care</h2>
        <div className="flex items-center justify-center gap-2 mt-2 text-pink-500/60 font-bold text-xs uppercase tracking-tighter">
          <Heart className="w-3 h-3 fill-current" />
          <span>Synchronizing your health data</span>
        </div>
      </motion.div>
    </motion.div>
  );
}