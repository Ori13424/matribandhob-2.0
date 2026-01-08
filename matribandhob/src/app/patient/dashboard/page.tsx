"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import BabyGrowthWidget from "@/features/patient/components/dashboard/BabyGrowthWidget";
import KickCounterWidget from "@/features/patient/components/dashboard/KickCounterWidget";
import WaterIntakeWidget from "@/features/patient/components/dashboard/WaterIntakeWidget";
import MayerBankWidget from "@/features/patient/components/dashboard/MayerBankWidget";
import BloodRequestWidget from "@/features/patient/components/dashboard/BloodRequestWidget";

import { 
  Home, Stethoscope, Heart, User, Bell, 
  Baby, Bot, X, Send, Wallet, Droplet, ArrowRight, ShieldAlert,
  Mic, Image as ImageIcon, Loader2, Footprints, Activity,
  Sun, Moon
} from "lucide-react";


// --- TYPES ---
interface UserProfile {
  fullName: string;
  currentWeek: number;
  edd: string;
}

type Lang = 'en' | 'bn';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // --- SETTINGS STATES ---
  const [lang, setLang] = useState<Lang>('en'); 
  const [darkMode, setDarkMode] = useState(true); // Default to Dark

  // --- WIDGET STATES ---
  const [kickCount, setKickCount] = useState(0);
  const [waterCount, setWaterCount] = useState(0);
  const [isKicking, setIsKicking] = useState(false); 

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.onboardingComplete) {
              router.push("/patient/onboarding");
              return;
            }
            setProfile({
              fullName: data.basicInfo?.fullName || "Ma",
              currentWeek: data.pregnancyDetails?.currentWeek || 1,
              edd: data.pregnancyDetails?.edd || "",
            });
          } else {
            router.push("/patient/onboarding");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // --- HANDLERS ---
  const handleKick = () => {
    setKickCount(prev => prev + 1);
    setIsKicking(true);
    setTimeout(() => setIsKicking(false), 300); 
  };

  const handleWater = () => {
    if (waterCount < 8) setWaterCount(prev => prev + 1);
    else setWaterCount(0); 
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    if(!isRecording) setTimeout(() => setIsRecording(false), 3000); 
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#120a10]" : "bg-[#fff5f7]"}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans relative pb-28 overflow-x-hidden selection:bg-pink-500/30 transition-colors duration-500
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>
      
      {/* BACKGROUND EFFECTS (Adaptive) */}
      <div className={`fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-colors duration-500 
        ${darkMode ? "bg-pink-600/10" : "bg-pink-300/20"}`} 
      />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-colors duration-500
        ${darkMode ? "bg-purple-600/10" : "bg-purple-300/20"}`} 
      />

      {/* --- HEADER --- */}
      <header className={`fixed top-0 w-full z-30 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center transition-all duration-300
        ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 ring-1 ring-white/10">
            <Baby className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">
              Week {profile?.currentWeek}
            </p>
            <h1 className={`text-lg font-bold leading-none ${darkMode ? "text-white/90" : "text-slate-800"}`}>
              Hi, {profile?.fullName.split(' ')[0]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {/* THEME TOGGLE */}
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full transition-all border ${darkMode ? "bg-white/5 border-white/5 hover:bg-white/10 text-yellow-400" : "bg-white border-pink-100 hover:bg-pink-50 text-slate-500 shadow-sm"}`}
            >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* LANGUAGE TOGGLE */}
            <div className={`relative flex rounded-full p-1 border backdrop-blur-sm ${darkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-pink-100 shadow-sm"}`}>
                <motion.div 
                    className="absolute top-1 bottom-1 w-[34px] bg-gradient-to-tr from-pink-600 to-purple-600 rounded-full shadow-md"
                    initial={false}
                    animate={{ x: lang === 'en' ? 0 : 36 }} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button onClick={() => setLang('en')} className={`relative z-10 w-[34px] h-[26px] text-[10px] font-black rounded-full transition-colors flex items-center justify-center ${lang === 'en' ? 'text-white' : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')}`}>EN</button>
                <button onClick={() => setLang('bn')} className={`relative z-10 w-[34px] h-[26px] text-[10px] font-black rounded-full transition-colors flex items-center justify-center ${lang === 'bn' ? 'text-white' : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')}`}>BN</button>
            </div>

            <button className={`p-2.5 rounded-full relative transition-colors border ${darkMode ? "bg-white/5 hover:bg-white/10 border-white/5" : "bg-white hover:bg-pink-50 border-pink-100 shadow-sm"}`}>
                <Bell className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-slate-500"}`} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#1a0b10]"></span>
            </button>
        </div>
      </header>

      {/* --- MAIN DASHBOARD --- */}
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* TOP ROW */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* HERO SECTION */}
                          <BabyGrowthWidget 
                           currentWeek={profile?.currentWeek || 1} 
                           darkMode={darkMode} 
                              />

            {/* SOS BUTTON */}
            <div className="md:col-span-4 h-full">
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full h-56 md:h-64 rounded-[2rem] bg-gradient-to-r from-red-600 to-rose-700 relative overflow-hidden shadow-xl shadow-red-900/30 group flex flex-col items-center justify-center gap-4 border border-red-500/30"
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-32 h-32 bg-white/10 rounded-full animate-ping opacity-75"></span>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm z-10 border border-white/20 shadow-xl">
                        <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center z-10">
                        <h3 className="text-2xl font-black text-white tracking-wider">SOS EMERGENCY</h3>
                        <p className="text-xs text-red-100 font-medium mt-1 opacity-90">Tap to alert contacts & drivers</p>
                    </div>
                </motion.button>
            </div>
        </div>

        {/* MIDDLE ROW: INTERACTIVE WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. KICK COUNTER */}
            
               <KickCounterWidget user={auth.currentUser} darkMode={darkMode} />
            {/* 2. WATER TRACKER */}
            <WaterIntakeWidget user={auth.currentUser} darkMode={darkMode} />

            {/* Mayer Bank - Adaptive */}
            <MayerBankWidget user={auth.currentUser} darkMode={darkMode} />

            {/* Blood Request - Adaptive */}
            <BloodRequestWidget darkMode={darkMode} />
        </div>

      </main>

      {/* --- AI CHAT SIDEBAR --- */}
      <AnimatePresence>
        {isChatOpen && (
            <>
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsChatOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />
                
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`fixed top-0 right-0 h-full w-[90%] md:w-[450px] shadow-2xl z-[60] flex flex-col border-l
                        ${darkMode ? "bg-[#0f0a0d] border-white/10" : "bg-white border-pink-100"}`}
                >
                    <div className={`p-5 border-b flex justify-between items-center ${darkMode ? "bg-[#1a0b10] border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-900/50">
                                <Bot className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className={`font-bold text-base ${darkMode ? "text-white" : "text-slate-900"}`}>Matri-Bot AI</h3>
                                <p className="text-[10px] text-green-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-pink-50 text-slate-400 hover:text-slate-600"}`}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className={`flex-1 p-5 overflow-y-auto space-y-4 ${darkMode ? "bg-gradient-to-b from-[#0f0a0d] to-[#120a10]" : "bg-[#fff5f7]"}`}>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-pink-600/20 rounded-full flex items-center justify-center shrink-0 border border-pink-500/20 mt-1">
                                <Bot className="w-4 h-4 text-pink-500" />
                            </div>
                            <div className={`p-4 rounded-2xl rounded-tl-none text-sm max-w-[85%] shadow-sm leading-relaxed border
                                ${darkMode ? "bg-[#1e1b20] border-white/5 text-gray-300" : "bg-white border-pink-100 text-slate-700"}`}>
                                Hello Ma! ❤️ I'm here to help. You can send voice notes or photos of reports too!
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 border-t ${darkMode ? "border-white/5 bg-[#1a0b10]" : "border-pink-100 bg-[#fff5f7]"}`}>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                        {isRecording && (
                           <div className="mb-2 text-xs text-pink-500 font-bold animate-pulse flex items-center gap-2 justify-center">
                              <span className="w-2 h-2 bg-pink-500 rounded-full"></span> Listening...
                           </div>
                        )}
                        <div className={`flex items-center gap-2 border rounded-2xl p-2 pl-4 transition-colors focus-within:border-pink-500/50
                            ${darkMode ? "bg-[#0f0a0d] border-gray-800" : "bg-white border-pink-200"}`}>
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask about symptoms, diet..." 
                                className={`flex-1 bg-transparent text-sm focus:outline-none ${darkMode ? "text-white placeholder:text-gray-600" : "text-slate-900 placeholder:text-slate-400"}`}
                            />
                            <button onClick={handleImageClick} className={`p-2 rounded-xl transition-colors ${darkMode ? "text-gray-500 hover:text-pink-400 hover:bg-white/5" : "text-slate-400 hover:text-pink-600 hover:bg-pink-50"}`}>
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleMicClick} className={`p-2 rounded-xl transition-colors ${isRecording ? 'text-red-500 bg-red-500/10' : (darkMode ? 'text-gray-500 hover:text-pink-400 hover:bg-white/5' : 'text-slate-400 hover:text-pink-600 hover:bg-pink-50')}`}>
                                {isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button className="p-2.5 bg-pink-600 rounded-xl hover:bg-pink-500 transition-colors shadow-lg shadow-pink-900/20">
                                <Send className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* --- BOTTOM NAV --- */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
        <nav className={`w-full max-w-lg backdrop-blur-xl border rounded-[2rem] shadow-2xl flex justify-around items-center h-20 px-2 relative transition-all duration-300
            ${darkMode ? "bg-[#1a0b10]/95 border-white/10" : "bg-white/90 border-pink-100 shadow-rose-200/50"}`}>
            
            <NavButton icon={Home} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} darkMode={darkMode} />
           {/* CARE: Navigate to Care Page */}
            <NavButton 
                icon={Stethoscope} 
                label="Care" 
                active={false} 
                onClick={() => router.push("/patient/care")} 
                darkMode={darkMode} 
            />
            <div className="relative -top-6 group">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsChatOpen(true)}
                    className={`w-16 h-16 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.5)] border-[6px] z-50 group-hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] transition-shadow duration-300 relative overflow-hidden
                        ${darkMode ? "border-[#120a10]" : "border-[#fff5f7]"}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <Bot className="w-7 h-7 text-white relative z-10" />
                </motion.button>
                <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-colors whitespace-nowrap
                    ${darkMode ? "text-gray-400 group-hover:text-pink-400" : "text-slate-400 group-hover:text-pink-600"}`}>Ask AI</span>
            </div>

            <NavButton icon={Heart} label="Wellness" active={activeTab === "wellness"} onClick={() => setActiveTab("wellness")} darkMode={darkMode} />
            <NavButton icon={User} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} darkMode={darkMode} />
        
        </nav>
      </div>

    </div>
  );
}

const NavButton = ({ icon: Icon, label, active, onClick, darkMode }: any) => {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-1.5 w-14 pt-1 group">
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -top-1 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"
        />
      )}
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'text-white translate-y-[-2px]' : (darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-slate-400 group-hover:text-slate-600')}`}>
        <Icon 
            size={24} 
            strokeWidth={active ? 2.5 : 2} 
            color={active ? (darkMode ? "white" : "#db2777") : "currentColor"} 
            className={`transition-all ${active ? 'drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : ''}`}
        />
      </div>
      <span className={`text-[9px] font-bold transition-colors ${active ? 'text-pink-500' : (darkMode ? 'text-gray-600' : 'text-slate-400')}`}>{label}</span>
    </button>
  );
};