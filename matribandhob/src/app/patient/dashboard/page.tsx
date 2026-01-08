"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Added updateDoc
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Home, Stethoscope, Heart, User, Bell, 
  Baby, Bot, X, Send, Wallet, Droplet, ArrowRight, Activity, ShieldAlert,
  Mic, Image as ImageIcon, Loader2, Plus, Minus
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
  const [lang, setLang] = useState<Lang>('en'); 

  // --- WIDGET STATES ---
  const [kickCount, setKickCount] = useState(0);
  const [waterCount, setWaterCount] = useState(0);
  const [isKicking, setIsKicking] = useState(false); // For animation trigger

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
            // Restore daily counts if saved (Optional: You can save these to DB later)
            // setKickCount(data.dailyStats?.kicks || 0);
            // setWaterCount(data.dailyStats?.water || 0);
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
    setTimeout(() => setIsKicking(false), 300); // Reset animation
  };

  const handleWater = () => {
    if (waterCount < 8) setWaterCount(prev => prev + 1);
    else setWaterCount(0); // Reset if full (or handle differently)
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    if(!isRecording) setTimeout(() => setIsRecording(false), 3000); 
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#120a10] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#120a10] text-white font-sans relative pb-28 overflow-x-hidden selection:bg-pink-500/30">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-30 bg-[#120a10]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 ring-1 ring-white/10">
            <Baby className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">
              Week {profile?.currentWeek}
            </p>
            <h1 className="text-lg font-bold leading-none text-white/90">
              Hi, {profile?.fullName.split(' ')[0]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* LANGUAGE TOGGLE */}
          <div className="relative flex bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-sm">
            <motion.div 
              className="absolute top-1 bottom-1 w-[34px] bg-gradient-to-tr from-pink-600 to-purple-600 rounded-full shadow-lg"
              initial={false}
              animate={{ x: lang === 'en' ? 0 : 36 }} 
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button onClick={() => setLang('en')} className={`relative z-10 w-[34px] h-[26px] text-[10px] font-black rounded-full transition-colors flex items-center justify-center ${lang === 'en' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>EN</button>
            <button onClick={() => setLang('bn')} className={`relative z-10 w-[34px] h-[26px] text-[10px] font-black rounded-full transition-colors flex items-center justify-center ${lang === 'bn' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>BN</button>
          </div>

          <button className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 relative transition-colors border border-white/5">
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#1a0b10]"></span>
          </button>
        </div>
      </header>

      {/* --- MAIN DASHBOARD --- */}
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* TOP ROW */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* HERO SECTION */}
            <div className="md:col-span-8 w-full h-56 md:h-64 rounded-[2rem] bg-gradient-to-br from-[#1f121b] to-[#120a10] border border-white/5 relative overflow-hidden group shadow-2xl transition-all hover:border-white/10">
                <div className="absolute inset-0 bg-[url('https://cdn.dribbble.com/users/1770290/screenshots/6183149/bg_4x.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120a10] to-transparent opacity-90" />
                <div className="relative z-10 h-full flex flex-col justify-end p-8">
                    <span className="inline-block px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-wider w-fit mb-2">
                        Baby Growth
                    </span>
                    <h2 className="text-3xl font-bold text-white mb-2">Size of a Mango 🥭</h2>
                    <p className="text-sm text-gray-400 max-w-md">Your baby can now hear your voice!</p>
                </div>
            </div>

            {/* SOS BUTTON */}
            <div className="md:col-span-4 h-full">
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full h-56 md:h-64 rounded-[2rem] bg-gradient-to-r from-red-600 to-rose-700 relative overflow-hidden shadow-lg shadow-red-900/40 group flex flex-col items-center justify-center gap-4 border border-red-500/30"
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
            
            {/* 1. KICK COUNTER (Animated) */}
            <motion.div 
                onClick={handleKick}
                whileTap={{ scale: 0.95 }}
                className="h-40 rounded-3xl bg-[#1e1b20]/50 border border-white/5 p-6 flex flex-col justify-between hover:bg-[#252128] transition-colors cursor-pointer group hover:border-purple-500/30 relative overflow-hidden"
            >
                {/* Ripple Effect on Click */}
                {isKicking && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 rounded-full animate-ping" />
                )}

                <div className="flex justify-between items-start">
                    <motion.div 
                        animate={isKicking ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                        className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400"
                    >
                        <Activity className="w-6 h-6" />
                    </motion.div>
                    <div className="bg-purple-500/10 px-2 py-1 rounded-lg text-[10px] font-bold text-purple-400">
                        Tap to Count
                    </div>
                </div>
                
                <div>
                    <span className="text-4xl font-black text-white block tracking-tighter">
                        {kickCount}
                    </span>
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Kick Counter</span>
                </div>
            </motion.div>

            {/* 2. WATER TRACKER (Filling Effect) */}
            <motion.div 
                onClick={handleWater}
                whileTap={{ scale: 0.95 }}
                className="h-40 rounded-3xl bg-[#1e1b20]/50 border border-white/5 relative overflow-hidden cursor-pointer group hover:border-blue-500/30"
            >
                {/* Animated Liquid Background */}
                <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-blue-600/20"
                    initial={{ height: "0%" }}
                    animate={{ height: `${(waterCount / 8) * 100}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                />
                
                <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Droplet className="w-6 h-6" />
                        </div>
                        <div className="bg-blue-500/10 px-2 py-1 rounded-lg text-[10px] font-bold text-blue-400">
                            Goal: 8
                        </div>
                    </div>
                    <div>
                        <span className="text-4xl font-black text-white block tracking-tighter">
                            {waterCount}<span className="text-gray-600 text-xl font-medium">/8</span>
                        </span>
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Water Intake</span>
                    </div>
                </div>
            </motion.div>

            {/* Mayer Bank */}
            <div className="md:col-span-2 lg:col-span-1 h-40 p-6 rounded-3xl bg-gradient-to-br from-[#1c1917] to-[#292524] border border-amber-500/10 relative overflow-hidden shadow-xl group hover:border-amber-500/30 transition-all cursor-pointer">
                <div className="absolute top-[-20%] right-[-20%] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Wallet className="w-32 h-32 text-amber-500" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-amber-500" />
                        <span className="text-amber-50 font-bold text-sm">Mayer Bank</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white">৳ 0.00</span>
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-amber-500 cursor-pointer hover:underline">
                             + Start Saving <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Blood Request */}
            <div className="md:col-span-2 lg:col-span-1 h-40 p-6 rounded-3xl bg-[#1a0f0f] border border-red-900/30 relative overflow-hidden group hover:border-red-500/30 transition-all cursor-pointer">
                 <div className="absolute top-[-20%] right-[-20%] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Droplet className="w-32 h-32 text-red-500" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-500" />
                        <span className="text-red-100 font-bold text-sm">Blood Request</span>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs mb-3">Find donors nearby instantly.</p>
                        <button className="px-4 py-2 bg-[#2a1212] border border-red-500/30 text-red-400 hover:bg-red-900/40 rounded-lg font-bold text-xs transition-all w-full">
                            Request
                        </button>
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* --- AI CHAT SIDEBAR --- */}
      <AnimatePresence>
        {isChatOpen && (
            <>
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
                    className="fixed top-0 right-0 h-full w-[90%] md:w-[450px] bg-[#0f0a0d] border-l border-white/10 shadow-2xl z-[60] flex flex-col"
                >
                    <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1a0b10]">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-900/50">
                                <Bot className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Matri-Bot AI</h3>
                                <p className="text-[10px] text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-[#0f0a0d] to-[#120a10]">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-pink-600/20 rounded-full flex items-center justify-center shrink-0 border border-pink-500/20 mt-1">
                                <Bot className="w-4 h-4 text-pink-400" />
                            </div>
                            <div className="bg-[#1e1b20] border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-gray-300 max-w-[85%] shadow-sm leading-relaxed">
                                Hello Ma! ❤️ I'm here to help. You can send voice notes or photos of reports too!
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#1a0b10]">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                        {isRecording && (
                           <div className="mb-2 text-xs text-pink-400 font-bold animate-pulse flex items-center gap-2 justify-center">
                              <span className="w-2 h-2 bg-pink-500 rounded-full"></span> Listening...
                           </div>
                        )}
                        <div className="flex items-center gap-2 bg-[#0f0a0d] border border-gray-800 rounded-2xl p-2 pl-4 transition-colors focus-within:border-pink-500/50">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask about symptoms..." 
                                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-gray-600"
                            />
                            <button onClick={handleImageClick} className="p-2 text-gray-500 hover:text-pink-400 hover:bg-white/5 rounded-xl transition-colors">
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleMicClick} className={`p-2 rounded-xl transition-colors ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-pink-400 hover:bg-white/5'}`}>
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
        <nav className="w-full max-w-lg bg-[#1a0b10]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex justify-around items-center h-20 px-2 relative">
            
            <NavButton icon={Home} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
            <NavButton icon={Stethoscope} label="Care" active={activeTab === "care"} onClick={() => setActiveTab("care")} />

            <div className="relative -top-6 group">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsChatOpen(true)}
                    className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.5)] border-[6px] border-[#120a10] z-50 group-hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] transition-shadow duration-300 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <Bot className="w-7 h-7 text-white relative z-10" />
                </motion.button>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 group-hover:text-pink-400 transition-colors whitespace-nowrap">Ask AI</span>
            </div>

            <NavButton icon={Heart} label="Wellness" active={activeTab === "wellness"} onClick={() => setActiveTab("wellness")} />
            <NavButton icon={User} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        
        </nav>
      </div>

    </div>
  );
}

const NavButton = ({ icon: Icon, label, active, onClick }: any) => {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-1.5 w-14 pt-1 group">
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -top-1 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"
        />
      )}
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'text-white translate-y-[-2px]' : 'text-gray-500 group-hover:text-gray-300'}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} className={`transition-all ${active ? 'drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : ''}`}/>
      </div>
      <span className={`text-[9px] font-bold transition-colors ${active ? 'text-pink-400' : 'text-gray-600'}`}>{label}</span>
    </button>
  );
};