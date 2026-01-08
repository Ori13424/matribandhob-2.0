"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Droplet, Siren, Activity, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BloodWidgetProps {
  darkMode: boolean;
}

export default function BloodRequestWidget({ darkMode }: BloodWidgetProps) {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleEmergencyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmEmergency = () => {
    setShowConfirm(false);
    setIsRequesting(true);
    
    // Simulate Broadcast
    setTimeout(() => {
      setIsRequesting(false);
    }, 2000);
  };

  return (
    <>
      <div 
        onClick={() => router.push("/patient/blood-request")}
        className={`md:col-span-2 lg:col-span-1 h-40 p-6 rounded-3xl relative overflow-hidden shadow-lg group transition-all cursor-pointer border
        ${darkMode
          ? "bg-[#1a0f0f] border-red-900/30 hover:border-red-500/30"
          : "bg-gradient-to-br from-red-50 to-rose-50 border-red-100 hover:border-red-200 shadow-sm"}`}
      >
          {/* Background Icon */}
          <div className="absolute top-[-20%] right-[-20%] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Droplet className="w-32 h-32 text-red-500" />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Header */}
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${darkMode ? 'bg-red-500/10' : 'bg-white/80'}`}>
                          <Droplet className="w-5 h-5 text-red-500" />
                      </div>
                      <span className={`font-bold text-sm ${darkMode ? "text-red-100" : "text-red-900"}`}>Blood Bank</span>
                  </div>
                  
                  {/* Live Badge */}
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${darkMode ? "bg-red-500/10 border-red-500/20" : "bg-white border-red-100"}`}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className={`text-[9px] font-bold uppercase ${darkMode ? "text-red-400" : "text-red-600"}`}>Live</span>
                  </div>
              </div>

              {/* Content */}
              <div>
                  <p className={`text-xs mb-3 font-medium ${darkMode ? "text-gray-500" : "text-red-900/60"}`}>
                      Find donors or request blood instantly.
                  </p>
                  
                  {/* Emergency Button */}
                  <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEmergencyClick}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border shadow-lg relative overflow-hidden
                      ${darkMode 
                          ? "bg-[#2a1212] border-red-500/30 text-red-400 hover:bg-red-900/40" 
                          : "bg-white border-red-200 text-red-600 hover:bg-red-50"}`}
                  >
                      {isRequesting ? (
                          <span className="flex items-center gap-2 animate-pulse"><Activity className="w-4 h-4" /> Broadcasting...</span>
                      ) : (
                          <><Siren className="w-4 h-4" /> Emergency Request</>
                      )}
                  </motion.button>
              </div>
          </div>
      </div>

      {/* --- CUSTOM SOS CONFIRMATION MODAL --- */}
      {mounted && showConfirm && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl border flex flex-col items-center text-center
                ${darkMode ? "bg-[#1a0f0f] border-red-500/30 text-white" : "bg-white border-red-100 text-slate-900"}`}
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 relative">
                 <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
                 <Siren className="w-10 h-10 text-red-500 relative z-10" />
              </div>
              
              <h3 className="text-2xl font-black mb-2 text-red-500">SEND SOS?</h3>
              <p className={`text-sm mb-8 leading-relaxed ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                This will alert all donors and ambulances within 5km of your location. Use only in emergencies.
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className={`flex-1 py-4 rounded-xl font-bold text-sm transition-colors
                    ${darkMode ? "bg-white/5 hover:bg-white/10 text-gray-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmEmergency}
                  className="flex-1 py-4 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" /> CONFIRM
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