"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wallet, Plus, Building2, TrendingUp, Target, Edit2, CheckCircle, Sun, Moon, Bell } from "lucide-react";
import { doc, collection, query, orderBy, onSnapshot, setDoc, increment, serverTimestamp, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";
type Lang = 'en' | 'bn';
export default function MayerBankPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [targetGoal, setTargetGoal] = useState(50000); // Default Goal
  const [targetName, setTargetName] = useState("General Delivery");
  const [history, setHistory] = useState<any[]>([]);
  
  // UI States

  const [selectedAmount, setSelectedAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState("");
  const [lang, setLang] = useState<Lang>('en'); 
  const { darkMode, toggleDarkMode } = useTheme();

  // Mock Data for Hospital Costs 
  const hospitalCosts = [
    { name: "Dhaka Medical College", type: "Public", cost: 8000, display: "৳ 8,000", distance: "2.5 km" },
    { name: "Matri Sadan", type: "Clinic", cost: 15000, display: "৳ 15,000", distance: "1.2 km" },
    { name: "Square Hospital", type: "Private", cost: 60000, display: "৳ 60,000", distance: "5.2 km" },
  ];

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 1. Listen to Balance & Goal
        const balanceUnsub = onSnapshot(doc(db, "users", currentUser.uid, "savings", "summary"), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setBalance(data.balance || 0);
            if (data.targetGoal) setTargetGoal(data.targetGoal);
            if (data.targetName) setTargetName(data.targetName);
          }
        });

        // 2. Listen to History
        const q = query(collection(db, "users", currentUser.uid, "savings"), orderBy("date", "desc"), limit(10));
        const historyUnsub = onSnapshot(q, (snapshot) => {
          const logs = snapshot.docs
            .filter(d => d.id !== 'summary')
            .map(d => ({ id: d.id, ...d.data() }));
          setHistory(logs);
        });

        return () => { balanceUnsub(); historyUnsub(); };
      } else {
        router.push("/login");
      }
    });
    return () => unsubAuth();
  }, [router]);

  // --- ACTIONS ---

  const handleDeposit = async () => {
    if (!user || selectedAmount <= 0) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid, "savings", "summary"), { 
        balance: increment(selectedAmount) 
      }, { merge: true });

      await setDoc(doc(db, "users", user.uid, "savings", `tx_${Date.now()}`), {
        amount: selectedAmount,
        type: "deposit",
        date: serverTimestamp(),
        method: "Manual Deposit"
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetGoal = async (amount: number, name: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "savings", "summary"), { 
        targetGoal: amount,
        targetName: name
      }, { merge: true });
      setIsEditingGoal(false);
    } catch (error) {
      console.error("Error setting goal:", error);
    }
  };

  const progress = Math.min((balance / targetGoal) * 100, 100);

  return (
    <div className={`min-h-screen p-4 pb-24 font-sans ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}`}>
      
      {/* Header */}
<header
  className={`flex items justify-between mb-6`}
>
  <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Mayer Bank</h1>
        </div>

  <div className="flex items-center gap-2.5">
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-full transition-all border ${
        darkMode
          ? "bg-white/5 text-yellow-400"
          : "bg-white text-slate-500 shadow-sm"
      }`}
    >
      {darkMode ? (
        <Sun className="w-4.5 h-4.5" />
      ) : (
        <Moon className="w-4.5 h-4.5" />
      )}
    </button>

    <div
      className={`relative flex rounded-full p-0.5 border backdrop-blur-sm ${
        darkMode
          ? "bg-black/40 border-white/10"
          : "bg-white/60 border-pink-100 shadow-sm"
      }`}
    >
      <motion.div
        className="absolute top-0.5 bottom-0.5 w-[30px] bg-gradient-to-tr from-pink-600 to-purple-600 rounded-full shadow-md"
        initial={false}
        animate={{ x: lang === "en" ? 0 : 32 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      <button
        onClick={() => setLang("en")}
        className={`relative z-10 w-[30px] h-[22px] text-[9px] font-black rounded-full flex items-center justify-center ${
          lang === "en"
            ? "text-white"
            : darkMode
            ? "text-gray-500 hover:text-gray-300"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        EN
      </button>

      <button
        onClick={() => setLang("bn")}
        className={`relative z-10 w-[30px] h-[22px] text-[9px] font-black rounded-full flex items-center justify-center ${
          lang === "bn"
            ? "text-white"
            : darkMode
            ? "text-gray-500 hover:text-gray-300"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        BN
      </button>
    </div>
  </div>
</header>


      {/* Main Balance Card */}
      <div className="w-full rounded-[2.5rem] bg-gradient-to-br from-amber-600 to-yellow-600 p-8 relative overflow-hidden shadow-2xl mb-8">
        <div className="absolute top-0 right-0 p-6 opacity-20"><Wallet className="w-40 h-40 text-white" /></div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-amber-100 font-medium text-sm mb-1">Total Savings</p>
              <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="bg-black/20 p-2 rounded-full hover:bg-black/30 text-white">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tight">৳ {balance.toLocaleString()}</h2>
          </div>

          {/* Goal Progress Bar */}
          <div>
             <div className="flex justify-between text-xs font-bold text-amber-100 mb-2">
                <span>{progress.toFixed(0)}% Reached</span>
                <span>Goal: ৳{targetGoal.toLocaleString()}</span>
             </div>
             <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-white rounded-full"
                />
             </div>
             <p className="text-[10px] text-amber-200 mt-2 font-medium">Target: {targetName}</p>
          </div>
        </div>
      </div>

      {/* Custom Goal Input (Collapsible) */}
      <AnimatePresence>
        {isEditingGoal && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
             <div className={`p-5 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-pink-100 shadow-sm"}`}>
                <h3 className="text-sm font-bold mb-3">Set Custom Goal</h3>
                <div className="flex gap-2">
                   <input 
                      type="number" 
                      placeholder="Enter amount..." 
                      value={customGoalInput}
                      onChange={(e) => setCustomGoalInput(e.target.value)}
                      className={`flex-1 px-4 py-3 rounded-xl outline-none border ${darkMode ? "bg-black/30 border-white/10 text-white" : "bg-slate-50 border-slate-200"}`}
                   />
                   <button 
                      onClick={() => handleSetGoal(Number(customGoalInput), "Custom Goal")}
                      className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl"
                   >
                      Set
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Section */}
      <section className="mb-8">
        <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Add Money</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[50, 100, 500, 1000].map((amt) => (
            <button
              key={amt}
              onClick={() => setSelectedAmount(amt)}
              className={`py-3 rounded-xl font-bold text-sm transition-all border
                ${selectedAmount === amt 
                  ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                  : (darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100")}`}
            >
              ৳{amt}
            </button>
          ))}
        </div>
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleDeposit}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Processing..." : (<> <Plus className="w-5 h-5" /> Deposit ৳{selectedAmount} </>)}
        </motion.button>
      </section>

      {/* AI Hospital Cost Estimator & Goal Selection */}
      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Hospital Goals</h3>
          <span className="text-[10px] text-pink-500 font-bold bg-pink-500/10 px-2 py-1 rounded">Select a target</span>
        </div>

        <div className="space-y-3">
          {hospitalCosts.map((hospital, idx) => {
            const isSelected = targetGoal === hospital.cost && targetName === hospital.name;
            return (
              <div key={idx} 
                className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all
                ${isSelected 
                    ? (darkMode ? "bg-amber-500/10 border-amber-500" : "bg-amber-50 border-amber-400") 
                    : (darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-slate-100 shadow-sm")}`}
              >
                <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                        <div className={`p-2.5 rounded-xl ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                        <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                        <h4 className="font-bold text-sm">{hospital.name}</h4>
                        <p className={`text-xs ${darkMode ? "text-gray-500" : "text-slate-400"}`}>{hospital.type} • {hospital.distance}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`block font-bold ${darkMode ? "text-amber-400" : "text-amber-600"}`}>{hospital.display}</span>
                    </div>
                </div>
                
                {/* Selection Button */}
                <button 
                    onClick={() => handleSetGoal(hospital.cost, hospital.name)}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors
                    ${isSelected 
                        ? "bg-amber-500 text-black" 
                        : (darkMode ? "bg-white/5 hover:bg-white/10 text-gray-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500")}`}
                >
                    {isSelected ? <><CheckCircle className="w-3 h-3"/> Active Goal</> : <><Target className="w-3 h-3"/> Set as Goal</>}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Recent History</h3>
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No transactions yet</div>
          ) : (
            history.map((tx: any) => (
              <div key={tx.id} className={`p-4 rounded-2xl flex justify-between items-center ${darkMode ? "bg-white/5" : "bg-white border border-slate-100"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${darkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600"}`}>
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{tx.method || "Deposit"}</p>
                    <p className="text-xs text-gray-500">
                      {tx.date ? new Date(tx.date.toDate()).toLocaleDateString() : "Just now"}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-green-500">+ ৳{tx.amount}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}