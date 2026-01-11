"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ChefHat, Sparkles, Coins, Leaf, 
  Utensils, Sun, Moon, Loader2, Bot, Info, Activity, ShieldCheck,
  Share2, Download, CalendarCheck
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
  const [step, setStep] = useState<'form' | 'result'>('form');
  
  // --- USER DATA ---
  const [profile, setProfile] = useState<any>(null);

  // --- FORM INPUTS ---
  const [budget, setBudget] = useState("medium");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [healthTags, setHealthTags] = useState<string[]>([]);

  // --- AI RESULT DATA ---
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // --- 1. FETCH PROFILE & EXISTING DIET PLAN ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfile(snap.data());

        const planSnap = await getDoc(doc(db, "users", user.uid, "dietPlan", "latest"));
        if (planSnap.exists()) {
            setAiResponse(planSnap.data());
            setStep('result');
        }
        setPageLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const toggleSelection = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  // --- 2. PREGNANCY-SAFE AI GENERATION ---
  const generateDietPlan = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const userContext = `
        Pregnancy Week: ${profile?.pregnancyDetails?.currentWeek || "Unknown"}
        Budget: ${budget}
        Dietary Preferences: ${preferences.join(", ") || "None"}
        Health Issues: ${healthTags.join(", ") || "None"}
      `;

      const prompt = `
        ACT AS A CLINICAL PREGNANCY NUTRITIONIST for a woman in Bangladesh. 
        Generate a safe, balanced diet plan JSON.

        USER PROFILE:
        ${userContext}

        STRICT SAFETY RULES:
        1. ⛔ NO Raw Papaya, Undercooked Meat, High-Mercury Fish.
        2. ✅ PRIORITIZE Iron, Calcium, Folic Acid.
        3. ✅ HYDRATION IS KEY.

        CRITICAL: Return JSON in 'data':
        {
          "title": "Title String",
          "summary": "Summary String",
          "marketTip": "Tip String",
          "meals": [
            { "time": "Sokal", "food": "Menu", "icon": "🍳", "benefit": "Benefit" },
            { "time": "Dupur", "food": "Menu", "icon": "🍛", "benefit": "Benefit" },
            { "time": "Bikal", "food": "Menu", "icon": "🍎", "benefit": "Benefit" },
            { "time": "Raat", "food": "Menu", "icon": "🌙", "benefit": "Benefit" }
          ]
        }
        Set 'action' to 'LOG_HEALTH'.
      `;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: [],
          userProfile: { 
            name: profile?.basicInfo?.fullName || "Ma", 
            week: profile?.pregnancyDetails?.currentWeek,
            uid: auth.currentUser.uid 
          },
          language: 'en' 
        }),
      });

      const result = await response.json();
      let finalPlan = result.data;

      if (!finalPlan || !finalPlan.meals) {
        finalPlan = {
           title: "Safe Pregnancy Basics",
           summary: "A medically safe balanced diet rich in protein and hydration.",
           marketTip: "Wash all vegetables thoroughly to remove chemicals.",
           meals: [
             { time: "Sokal", food: "2 Ruti + Mixed Veg + 1 Boiled Egg (Fully Cooked)", icon: "🍳", benefit: "Protein for baby's growth" },
             { time: "Dupur", food: "Rice + Lentil (Dal) + Mola Fish (Calcium)", icon: "🍛", benefit: "Calcium for bones" },
             { time: "Bikal", food: "1 Orange or Apple + Handful of Nuts", icon: "🍎", benefit: "Vitamin C & Energy" },
             { time: "Raat", food: "Rice/Ruti + Chicken Stew + Papaya (RIPE only)", icon: "🌙", benefit: "Easy digestion" }
           ]
        };
      }

      finalPlan.createdAt = new Date().toISOString();
      await setDoc(doc(db, "users", auth.currentUser.uid, "dietPlan", "latest"), finalPlan);

      setAiResponse(finalPlan);
      setStep('result');

    } catch (error) {
      console.error("Diet Gen Error:", error);
      alert("Could not generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => setStep('form');

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
          <h1 className="text-lg font-bold">Pusti Kotha</h1>
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
                <div className="text-center space-y-3 mb-8">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 mb-6 rotate-3">
                        <ChefHat className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Personalized Nutrition</h2>
                    <p className="text-sm opacity-60 max-w-xs mx-auto leading-relaxed">
                        AI-crafted diet plans using safe, local ingredients for you and your baby.
                    </p>
                </div>

                {/* 1. BUDGET */}
                <div className={`p-6 rounded-[2.5rem] border transition-all ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-500" /> Daily Budget
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {['Low', 'Medium', 'High'].map((b) => (
                            <button 
                                key={b} 
                                onClick={() => setBudget(b.toLowerCase())}
                                className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all
                                ${budget === b.toLowerCase() 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg scale-105" 
                                    : (darkMode ? "border-white/10 hover:bg-white/5" : "border-slate-100 hover:border-emerald-200 bg-slate-50")}`}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. PREFERENCES */}
                <div className={`p-6 rounded-[2.5rem] border transition-all ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-orange-500" /> Preferences
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                        {['Vegetables (Shak)', 'Small Fish', 'Meat', 'Egg', 'Milk', 'Bhorta'].map((item) => (
                            <button 
                                key={item}
                                onClick={() => toggleSelection(preferences, setPreferences, item)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2
                                ${preferences.includes(item)
                                    ? "bg-orange-500 border-orange-500 text-white shadow-md"
                                    : (darkMode ? "border-white/10 text-gray-400 bg-white/5" : "border-slate-100 text-slate-600 bg-slate-50")}`}
                            >
                                {preferences.includes(item) && <Leaf className="w-3 h-3" />}
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. HEALTH TAGS */}
                <div className={`p-6 rounded-[2.5rem] border transition-all ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-pink-500" /> Health Focus
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                        {['Anemia (Low Iron)', 'Diabetes', 'High BP', 'Weakness'].map((item) => (
                            <button 
                                key={item}
                                onClick={() => toggleSelection(healthTags, setHealthTags, item)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2
                                ${healthTags.includes(item)
                                    ? "bg-pink-600 border-pink-600 text-white shadow-md"
                                    : (darkMode ? "border-white/10 text-gray-400 bg-white/5" : "border-slate-100 text-slate-600 bg-slate-50")}`}
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
                    className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all hover:shadow-2xl flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    {loading ? "Consulting Specialist AI..." : "Generate My Plan"}
                </button>
                
                {aiResponse && (
                    <button onClick={() => setStep('result')} className="w-full py-3 text-sm font-bold opacity-50 hover:opacity-100 transition-opacity">
                        View Saved Plan
                    </button>
                )}

            </motion.div>
        ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                
                {/* --- RESULT HEADER CARD --- */}
                <div className={`relative p-8 rounded-[2.5rem] overflow-hidden border ${darkMode ? "bg-gradient-to-br from-[#1e1b20] to-[#120a10] border-white/10" : "bg-white border-pink-100 shadow-xl shadow-pink-500/5"}`}>
                    
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-teal-400/20 blur-3xl rounded-full pointer-events-none" />

                    <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-500">
                      <ShieldCheck className="w-3.5 h-3.5" /> Pregnancy Safe
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black leading-tight mb-2">{aiResponse?.title}</h2>
                            <p className="text-sm opacity-70 leading-relaxed max-w-sm">{aiResponse?.summary}</p>
                        </div>

                        {aiResponse?.marketTip && (
                            <div className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-3 ${darkMode ? "bg-amber-500/10 text-amber-200 border border-amber-500/20" : "bg-amber-50 text-amber-800 border border-amber-100"}`}>
                                <Info className="w-5 h-5 shrink-0 text-amber-500" />
                                <div>
                                    <span className="block font-bold mb-1 text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px]">Market Tip</span>
                                    {aiResponse.marketTip}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- TIMELINE MEAL CARDS --- */}
                <div className="relative pl-4 space-y-6 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:to-transparent before:content-['']">
                    {aiResponse?.meals?.map((meal: any, i: number) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            key={i}
                            className="relative pl-8"
                        >
                            {/* Timeline Dot */}
                            <div className={`absolute left-0 top-6 w-3 h-3 rounded-full border-2 z-10 ${darkMode ? "bg-[#120a10] border-emerald-500" : "bg-white border-emerald-500"}`} />

                            <div className={`group p-5 rounded-[2rem] border transition-all hover:scale-[1.02] ${darkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-pink-50 shadow-sm hover:shadow-md hover:border-pink-100"}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl bg-gray-100 dark:bg-white/10 w-12 h-12 flex items-center justify-center rounded-2xl">{meal.icon}</div>
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-emerald-500">{meal.time}</h4>
                                            <h3 className="font-bold text-base">{meal.food}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${darkMode ? "bg-emerald-400" : "bg-emerald-600"}`} />
                                    <p className={`text-xs font-medium ${darkMode ? "text-emerald-200" : "text-emerald-700"}`}>
                                        {meal.benefit}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* --- ACTION BUTTONS --- */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-colors ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-colors ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
                        <Download className="w-4 h-4" /> Save PDF
                    </button>
                </div>

                <button 
                    onClick={handleCreateNew}
                    className={`w-full py-4 rounded-2xl font-bold border-2 border-dashed transition-all mt-2 ${darkMode ? "border-white/10 hover:border-white/30 hover:bg-white/5 text-gray-400" : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600"}`}
                >
                    Generate a New Plan
                </button>

            </motion.div>
        )}

      </main>
    </div>
  );
}