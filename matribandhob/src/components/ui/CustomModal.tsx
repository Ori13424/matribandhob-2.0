"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isEmergency?: boolean;
}

export default function CustomModal({ isOpen, onClose, title, children, isEmergency }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[110] 
              bg-white rounded-3xl shadow-2xl overflow-hidden border-2 
              ${isEmergency ? "border-red-500" : "border-slate-100"}`}
          >
            {/* Header */}
            <div className={`px-6 py-4 flex justify-between items-center 
              ${isEmergency ? "bg-red-500 text-white" : "bg-slate-50 text-slate-800"}`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {isEmergency && <span className="animate-pulse">🚨</span>}
                {title}
              </h3>
              <button onClick={onClose} className={`p-1 rounded-full ${isEmergency ? "hover:bg-red-600" : "hover:bg-slate-200"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}