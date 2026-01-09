"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ChefHat, Sparkles, Coins, Leaf, Fish, 
  Flame, Utensils, Sun, Moon, Send, Loader2, Bot,
  Info,
  Activity
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";

export default function NutritionPage() {
  const router = useRouter();
  
  // --- UI STATES ---
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'result'>('form'); // Default to form, but useEffect might change it
  
  // --- USER DATA ---
  const [profile, setProfile] = useState<any>(null);

  // --- FORM INPUTS ---
  const [budget, setBudget] = useState("medium");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [healthTags, setHealthTags] = useState<string[]>([]);

  // --- AI RESULT DATA ---
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true); // New state to prevent flash of form

  // --- 1. FETCH PROFILE & EXISTING DIET PLAN ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch Profile
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfile(snap.data());

        // Fetch Saved Diet Plan
        const planSnap = await getDoc(doc(db, "users", user.uid, "dietPlan", "latest"));
        if (planSnap.exists()) {
            setAiResponse(planSnap.data());
            setStep('result'); // Auto-switch to result if plan exists
        }
        setPageLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // --- HANDLERS ---
  const toggleSelection = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  const generateDietPlan = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    
    // SIMULATING AI GENERATION
    setTimeout(async () => {
        const newPlan = {
            title: "Balanced Bengali Diet",
            summary: `Based on your ${profile?.pregnancyDetails?.currentWeek || 20}th week and ${budget} budget, here is a simplified plan rich in Iron and Calcium.`,
            meals: [
                { time: "Sokal (Breakfast)", food: "Ruti (2pcs) + Bhaji + 1 Egg", icon: "🍳", benefit: "Protein boost" },
                { time: "Dupur (Lunch)", food: "Plain Rice + Shak (Spinach) + Small Fish (Mola)", icon: "🐟", benefit: "Calcium for baby's bones" },
                { time: "Bikal (Snack)", food: "Muri Makha (Puffed Rice) + Chola or 1 Fruit", icon: "🍌", benefit: "Energy" },
                { time: "Raat (Dinner)", food: "Rice/Ruti + Dal + Chicken/Vegetables", icon: "🍲", benefit: "Light digestion" }
            ],
            marketTip: "Tip: Hilsa prices are high this week. Buy Rui or Pangas for cheaper protein options.",
            createdAt: new Date().toISOString()
        };

        // SAVE TO FIREBASE (PERSISTENCE)
        if (auth.currentUser) {
            await setDoc(doc(db, "users", auth.currentUser.uid, "dietPlan", "latest"), newPlan);
        }

        setAiResponse(newPlan);
        setLoading(false);
        setStep('result');
    }, 2500);
  };

  const handleCreateNew = () => {
    // Just switch view to form. We don't delete data yet, so if they refresh, old plan comes back.
    // Use clear logic if you want strict reset.
    setStep('form');
  };

  if (pageLoading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#120a10]" : "bg-[#fff5f7]"}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans relative transition-colors duration-500 overflow-x-hidden
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>
      
      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 py-4 flex justify-between items-center transition-all
        ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Pusti Kotha (Nutrition)</h1>
        </div>
       <button 
      onClick={toggleDarkMode} 
      className={`p-2 rounded-full transition-all border ${
        darkMode ? "bg-white/5 text-yellow-400" : "bg-white text-slate-500 shadow-sm"
      }`}
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 px-4 md:px-8 max-w-2xl mx-auto pb-10">
        
        {step === 'form' ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* HERO */}
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-gradient-to-tr from-green-500 to-teal-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-green-900/20 mb-4">
                        <ChefHat className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Build Your Diet Plan</h2>
                    <p className="text-sm opacity-60 max-w-xs mx-auto">AI-powered nutrition based on local Bangladeshi markets & your health needs.</p>
                </div>

                {/* 1. BUDGET SELECTOR */}
                <div className={`p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100"}`}>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                        <Coins className="w-4 h-4" /> Daily Budget
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {['Low', 'Medium', 'High'].map((b) => (
                            <button 
                                key={b} 
                                onClick={() => setBudget(b.toLowerCase())}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all
                                ${budget === b.toLowerCase() 
                                    ? "bg-green-600 border-green-600 text-white shadow-lg" 
                                    : (darkMode ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50")}`}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. PREFERENCES */}
                <div className={`p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100"}`}>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                        <Utensils className="w-4 h-4" /> Preferences
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {['Vegetables (Shak)', 'Small Fish', 'Meat', 'Egg', 'Milk', 'Bhorta'].map((item) => (
                            <button 
                                key={item}
                                onClick={() => toggleSelection(preferences, setPreferences, item)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2
                                ${preferences.includes(item)
                                    ? "bg-teal-600 border-teal-600 text-white"
                                    : (darkMode ? "border-white/10 text-gray-400" : "border-slate-200 text-slate-600")}`}
                            >
                                {preferences.includes(item) && <Leaf className="w-3 h-3" />}
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. HEALTH TAGS */}
                <div className={`p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100"}`}>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Health Focus
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {['Anemia (Low Iron)', 'Diabetes', 'High BP', 'Weakness'].map((item) => (
                            <button 
                                key={item}
                                onClick={() => toggleSelection(healthTags, setHealthTags, item)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2
                                ${healthTags.includes(item)
                                    ? "bg-pink-600 border-pink-600 text-white"
                                    : (darkMode ? "border-white/10 text-gray-400" : "border-slate-200 text-slate-600")}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GENERATE BUTTON */}
                <button 
                    onClick={generateDietPlan}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg shadow-xl shadow-green-900/30 active:scale-95 transition-transform flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    {loading ? "Asking AI..." : "Generate Diet Plan"}
                </button>
                
                {/* Cancel/Back Button if plan exists */}
                {aiResponse && (
                    <button onClick={() => setStep('result')} className="w-full py-3 text-sm font-bold opacity-50 hover:opacity-100">
                        Cancel & View Saved Plan
                    </button>
                )}

            </motion.div>
        ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                
                {/* RESULT HEADER */}
                <div className={`p-6 rounded-[2rem] border relative overflow-hidden ${darkMode ? "bg-gradient-to-br from-[#1e1b20] to-[#120a10] border-white/10" : "bg-white border-pink-100 shadow-xl"}`}>
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                            <Bot className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-1">{aiResponse.title}</h2>
                            <p className="text-xs opacity-70 leading-relaxed">{aiResponse.summary}</p>
                        </div>
                    </div>
                    
                    {/* MARKET TIP */}
                    <div className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${darkMode ? "bg-yellow-500/10 text-yellow-200 border border-yellow-500/20" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        {aiResponse.marketTip}
                    </div>
                </div>

                {/* MEAL CARDS */}
                <div className="space-y-3">
                    {aiResponse.meals.map((meal: any, i: number) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className={`p-4 rounded-2xl border flex items-center gap-4 ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-50"}`}
                        >
                            <div className="text-2xl">{meal.icon}</div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold uppercase opacity-50 mb-1">{meal.time}</h4>
                                <p className="font-bold text-sm">{meal.food}</p>
                            </div>
                            <div className={`text-[10px] px-2 py-1 rounded-lg font-bold ${darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700"}`}>
                                {meal.benefit}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <button 
                    onClick={handleCreateNew}
                    className={`w-full py-4 rounded-2xl font-bold border transition-colors ${darkMode ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                >
                    Create New Plan
                </button>

            </motion.div>
        )}

      </main>
    </div>
  );
}