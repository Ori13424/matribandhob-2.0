"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Wallet, ArrowRight, RotateCcw, AlertTriangle } from "lucide-react";
import { doc, onSnapshot, setDoc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

interface MayerBankProps {
  user: any;
  darkMode: boolean;
}

export default function MayerBankWidget({ user, darkMode }: MayerBankProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [targetGoal, setTargetGoal] = useState(50000); // Default
  const [isAdding, setIsAdding] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 1. Real-time listener for balance & goal
  useEffect(() => {
    setMounted(true); // Enable Portal
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "savings", "summary");
    const unsub = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBalance(data.balance || 0);
        if (data.targetGoal) setTargetGoal(data.targetGoal);
      }
    });
    return () => unsub();
  }, [user]);

  // 2. Quick Deposit (Fixed 50 BDT)
  const handleQuickDeposit = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!user) return;
    
    setIsAdding(true);
    const amount = 50;

    try {
      const summaryRef = doc(db, "users", user.uid, "savings", "summary");
      await setDoc(summaryRef, { balance: increment(amount) }, { merge: true });

      const historyRef = doc(db, "users", user.uid, "savings", `tx_${Date.now()}`);
      await setDoc(historyRef, {
        amount: amount,
        type: "deposit",
        method: "Quick Add",
        date: serverTimestamp()
      });
    } catch (error) {
      console.error("Deposit failed", error);
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  // 3. Reset Balance Logic
  const handleResetRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (balance > 0) setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    if (!user) return;
    try {
      const summaryRef = doc(db, "users", user.uid, "savings", "summary");
      await updateDoc(summaryRef, { balance: 0 });
      
      // Optional: Add a "Reset" log to history
      const historyRef = doc(db, "users", user.uid, "savings", `tx_${Date.now()}`);
      await setDoc(historyRef, {
        amount: 0,
        type: "reset",
        method: "Balance Reset",
        date: serverTimestamp()
      });
    } catch (error) {
      console.error("Reset failed", error);
    } finally {
      setShowResetConfirm(false);
    }
  };

  const progress = Math.min((balance / targetGoal) * 100, 100);

  return (
    <>
      <div 
        onClick={() => router.push("/patient/mayer-bank")}
        className={`md:col-span-2 lg:col-span-1 h-40 p-6 rounded-3xl relative overflow-hidden shadow-lg group transition-all cursor-pointer border
        ${darkMode 
          ? "bg-gradient-to-br from-[#1c1917] to-[#292524] border-amber-500/10 hover:border-amber-500/30" 
          : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300"}`}
      >
        <div className="absolute top-[-20%] right-[-20%] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet className="w-32 h-32 text-amber-500" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-amber-500/10' : 'bg-white/80'}`}>
                    <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <span className={`font-bold text-sm ${darkMode ? "text-amber-50" : "text-amber-900"}`}>Mayer Bank</span>
              </div>
              
              <div className="flex gap-2">
                <span className={`text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center ${darkMode ? "bg-black/20 text-amber-400" : "bg-white/50 text-amber-700"}`}>
                    Goal: ৳{(targetGoal / 1000).toFixed(0)}k
                </span>
                
                {/* Reset Button */}
                <button 
                  onClick={handleResetRequest}
                  className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${darkMode ? "hover:bg-white/10 text-amber-500/50 hover:text-amber-500" : "hover:bg-amber-100 text-amber-700/50 hover:text-amber-700"}`}
                  title="Reset Balance"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
          </div>
          
          <div>
            <span className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
              ৳ {balance.toLocaleString()}
            </span>
            
            <div className="flex items-center gap-3 mt-2">
              <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickDeposit}
                  className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all
                  ${darkMode 
                      ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black" 
                      : "bg-white text-amber-700 hover:bg-amber-100"}`}
              >
                  {isAdding ? "Adding..." : "+ Quick 50"} 
                  {!isAdding && <ArrowRight className="w-3 h-3" />}
              </motion.button>
              
              {/* Widget Progress Bar */}
              <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-amber-500 rounded-full"
                  />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- RESET CONFIRMATION MODAL --- */}
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
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl border flex flex-col items-center text-center
                ${darkMode ? "bg-[#1a0b10] border-white/10 text-white" : "bg-white border-white/50 text-slate-900"}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${darkMode ? "bg-red-500/20 text-red-500" : "bg-red-50 text-red-600"}`}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-black mb-2">Reset Savings?</h3>
              <p className={`text-sm mb-6 leading-relaxed ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                This will reset your current balance to ৳0. <br/> This action cannot be undone.
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