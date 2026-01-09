"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, Ambulance, ChevronRight } from "lucide-react";

export default function SOSHomeWidget({ onQuickSOS }: { onQuickSOS?: () => void }) {
  const router = useRouter();

  // Zone 1: Quick Trigger (The "EMERGENCY" badge/button)
  const handleQuickTrigger = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the SOS page
    if (onQuickSOS) {
      onQuickSOS();
    } else {
      // Default behavior if no function passed: 
      // Trigger a direct confirm or start countdown logic
      console.log("Quick SOS Triggered");
    }
  };

  // Zone 2: General Area (Opens SOS Page)
  const handleOpenSOSPage = () => {
    router.push('/patient/care/sos');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleOpenSOSPage}
      className="w-full h-full min-h-[160px] relative overflow-hidden group rounded-[2.5rem] cursor-pointer shadow-2xl transition-all duration-500"
    >
      {/* 1. LAYERED BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#dc2626] via-[#991b1b] to-[#7f1d1d]" />
      
      {/* Animated Glowing Ring */}
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"
      />

      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />

      {/* 2. CONTENT LAYOUT */}
      <div className="relative z-10 flex flex-col h-full p-6 justify-between">
        
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            {/* QUICK TRIGGER BUTTON */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleQuickTrigger}
              className="px-3 py-1.5 rounded-full bg-white text-red-700 shadow-lg flex items-center gap-2 border border-white/50"
            >
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Emergency</span>
            </motion.button>
            
            <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
              SOS
            </h3>
          </div>

          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover:bg-white/20 transition-all">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3 text-white/60">
             <Ambulance className="w-5 h-5 opacity-50" />
             <div className="w-1 h-1 rounded-full bg-white/30" />
             <span className="text-xs font-black tracking-widest uppercase">16263</span>
          </div>

          <div className="p-2 bg-white/10 text-white rounded-full backdrop-blur-md group-hover:bg-white/20 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* MESH TEXTURE */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:10px_10px]" />
    </motion.div>
  );
}