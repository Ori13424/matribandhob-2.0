"use client";
import { motion } from "framer-motion";
import { Activity, Stethoscope } from "lucide-react";

export default function DoctorDashboardLoader() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Ambience - Medical Teal/Blue */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[120px]" />
      
      <div className="relative">
        {/* Pulsing Medical Rings */}
        <motion.div 
          animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-teal-500/30"
        />
        <motion.div 
          animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-cyan-500/20"
        />

        {/* Central Icon */}
        <motion.div
          animate={{ rotate: [0, 0, 10, -10, 0] }} // Subtle "checking" animation
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.3)] relative z-10"
        >
          <Stethoscope className="w-12 h-12 text-white" />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center"
      >
        <h2 className="text-white font-bold text-xl tracking-widest uppercase">Matri-Doctor</h2>
        <div className="flex items-center justify-center gap-2 mt-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>Synchronizing Patient Records</span>
        </div>
      </motion.div>
    </motion.div>
  );
}