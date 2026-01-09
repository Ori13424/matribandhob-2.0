"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sun, Moon, Eye, EyeOff, 
  Calendar, Stethoscope, FileText, Phone, CheckCircle, Clock,
  Home, Heart, User, Bot, AlertCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import DailyTipsCard from "./DailyTipsCard"
import ANCJourney from "./ANCJourney";
import ChatBotWidget from "@/features/patient/components/dashboard/ChatBotWidget"; 
import { useTheme } from "@/context/ThemeContext";

// --- MOCK DATA FOR TIMELINE (Static for now, can be dynamic later) ---
const ancTimeline = [
  { id: 1, title: "ANC Visit 1", weeks: "Week 16", date: "Aug 10, 2025", status: "Done" },
  { id: 2, title: "ANC Visit 2", weeks: "Week 24", date: "Oct 12, 2025", status: "Upcoming" },
  { id: 3, title: "ANC Visit 3", weeks: "Week 32", date: "Dec 05, 2025", status: "Pending" },
  { id: 4, title: "ANC Visit 4", weeks: "Week 36", date: "Jan 02, 2026", status: "Pending" },
];

type Lang = 'en' | 'bn';

export default function CarePage() {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("care");

  

  
  // --- STATES ---
  const { darkMode, toggleDarkMode } = useTheme();
  const [lang, setLang] = useState<Lang>('en');
  const [isPrivate, setIsPrivate] = useState(false); // Privacy Toggle
  
  // REAL DATA STATE
  const [nextAppt, setNextAppt] = useState<any>(null);

  // --- HANDLERS ---
  const togglePrivacy = () => setIsPrivate(!isPrivate);

  // --- FETCH NEXT APPOINTMENT ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Query: Get the most recently created appointment
        const q = query(
            collection(db, "users", user.uid, "appointments"),
            orderBy("createdAt", "desc"), 
            limit(1)
        );
        
        const unsubAppt = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setNextAppt(data);
            } else {
                setNextAppt(null);
            }
        });
        return () => unsubAppt();
      }
    });
    return () => unsubAuth();
  }, []);

  return (
    <div className={`min-h-screen font-sans relative pb-28 transition-colors duration-500 overflow-x-hidden
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>
      
      {/* --- BACKGROUND BLOBS --- */}
      <div className={`fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none`}>
        <div className={`absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-40 transition-colors duration-500 
          ${darkMode ? "bg-pink-900" : "bg-pink-200"}`} />
        <div className={`absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-30 transition-colors duration-500
          ${darkMode ? "bg-purple-900" : "bg-purple-200"}`} />
      </div>

      {/* --- HEADER --- */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300
        ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Care Center</h1>
        </div>

        <div className="flex items-center gap-3">
            {/* PRIVACY TOGGLE */}
            <button 
                onClick={togglePrivacy}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all border relative overflow-hidden group
                ${isPrivate 
                    ? "bg-red-500 border-red-500 text-white animate-pulse" 
                    : (darkMode ? "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10" : "bg-white border-pink-100 text-slate-500 shadow-sm hover:bg-pink-50")}`}
            >
                {isPrivate ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span className="hidden md:inline text-xs font-bold">{isPrivate ? "Privacy ON" : "Privacy"}</span>
            </button> 
    
            {/* THEME TOGGLE */}
            <button 
      onClick={toggleDarkMode} 
      className={`p-2 rounded-full transition-all border ${
        darkMode ? "bg-white/5 text-yellow-400" : "bg-white text-slate-500 shadow-sm"
      }`}
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
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={`pt-24 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6
          ${isPrivate ? "blur-xl scale-95 opacity-50 pointer-events-none select-none" : ""}`}
      >
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 1. DYNAMIC NEXT APPOINTMENT HERO */}
            <div className={`w-full rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-xl border group min-h-[220px] flex flex-col justify-center
                ${darkMode 
                    ? "bg-gradient-to-br from-pink-900/40 to-[#120a10] border-pink-500/20" 
                    : "bg-white border-pink-100 shadow-rose-100/50"}`}
            >
                <div className="absolute top-0 right-0 p-6 opacity-10"><Calendar className="w-40 h-40" /></div>
                
                <div className="relative z-10 w-full md:max-w-xl">
                    {nextAppt ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500 text-white shadow-lg shadow-pink-500/30">
                                    Next Checkup
                                </span>
                                <span className={`text-sm font-bold flex items-center gap-1 ${darkMode ? "text-pink-300" : "text-pink-600"}`}>
                                    <Clock className="w-3 h-3" /> {nextAppt.dateDisplay || "Upcoming"}
                                </span>
                            </div>
                            
                            <h2 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>{nextAppt.doctorName}</h2>
                            <p className={`text-sm mb-6 flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                                <Stethoscope className="w-4 h-4" /> {nextAppt.specialty} 
                                <span className="opacity-30">|</span> 
                                {nextAppt.hospital}
                            </p>

                            <div className="flex gap-3">
                                <button className="px-6 py-3 rounded-xl bg-pink-600 text-white font-bold text-sm shadow-lg shadow-pink-600/20 hover:scale-[1.02] transition-transform flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Start Video Call
                                </button>
                                <button 
                                    onClick={() => router.push("/patient/care/checkup-details")}
                                    className={`px-6 py-3 rounded-xl border font-bold text-sm transition-colors ${darkMode ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                                >
                                    View Ticket
                                </button>
                            </div>
                        </>
                    ) : (
                        /* EMPTY STATE (No Appointment) */
                        <div className="text-center md:text-left py-4">
                            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>No Upcoming Visits</h2>
                            <p className={`text-sm mb-6 max-w-md ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                                Regular checkups are vital for you and your baby's health. Book a specialist consultation today.
                            </p>
                            <button 
                                onClick={() => router.push("/patient/care/find-doctor")}
                                className="px-6 py-3 rounded-xl bg-pink-600 text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                Book Appointment
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. QUICK ACTIONS GRID */}
            <div>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 pl-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Quick Care</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ActionCard 
                        icon={Stethoscope} title="Find Doctor" subtitle="Book Specialist" 
                        color="blue" darkMode={darkMode} onClick={() => router.push("/patient/care/find-doctor")} 
                    />
                    <ActionCard 
                        icon={FileText} title="My Reports" subtitle="Upload & View" 
                        color="purple" darkMode={darkMode} onClick={() => router.push("/patient/care/my-reports")}
                    />
                    <ActionCard 
                        icon={Phone} title="Govt. Hotline" subtitle="Call 16263" 
                        color="green" darkMode={darkMode} onClick={() => window.location.href = 'tel:16263'} 
                    />
                    <ActionCard 
                        icon={Calendar} title="Medicine" subtitle="Daily Log" 
                        color="orange" darkMode={darkMode} onClick={() => router.push("/patient/care/medicine")}
                    />
                </div>
            </div>

             {/* 3. HEALTH ALERTS */}
             <div className="hidden lg:block">
        <DailyTipsCard darkMode={darkMode} />
    </div>

        </div>

        {/* RIGHT COLUMN (ANC Timeline) */}
        <div className="lg:col-span-4 h-full">
            <ANCJourney darkMode={darkMode} />
           
        </div>

      </main>

      {/* --- PRIVACY SCREEN OVERLAY --- */}
      <AnimatePresence>
        {isPrivate && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md"
                onClick={togglePrivacy}
            >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${darkMode ? "bg-white/10" : "bg-white"}`}>
                    <EyeOff className="w-10 h-10 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Privacy Mode On</h2>
                <p className="text-white/70 text-sm">Tap anywhere to reveal medical data</p>
            </motion.div>
        )}
      </AnimatePresence>
      
        
          <ChatBotWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} darkMode={darkMode} />

      {/* --- BOTTOM NAV --- */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
              <nav className={`w-full max-w-lg backdrop-blur-xl border rounded-[2rem] shadow-2xl flex justify-around items-center h-20 px-2 relative transition-all duration-300
                  ${darkMode ? "bg-[#1a0b10]/95 border-white/10" : "bg-white/90 border-pink-100 shadow-rose-200/50"}`}>
                  
                  <NavButton 
                      icon={Home} 
                      label="Home" 
                      active={activeTab === 'home'} 
                      onClick={() => { setActiveTab('home'); router.push("/patient/dashboard"); }} 
                      darkMode={darkMode} 
                  />
      
                  <NavButton 
                      icon={Stethoscope} 
                      label="Care" 
                      active={activeTab === 'care'} 
                      onClick={() => { setActiveTab('care'); router.push("/patient/care"); }} 
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
                  
                  <NavButton 
                      icon={Heart} 
                      label="Wellness" 
                      active={activeTab === 'wellness'} 
                       onClick={() => { setActiveTab('wellness'); router.push("/patient/wellness"); }} 
                      darkMode={darkMode}
                  />
      
                  <NavButton 
                      icon={User} 
                      label="Profile" 
                      active={activeTab === 'profile'} 
                      onClick={() => { setActiveTab('profile'); router.push("/patient/profile"); }} 
                      darkMode={darkMode} 
                  />
              
              </nav>
            </div>
      
          </div>
  );
}



// --- REUSABLE COMPONENTS ---

function ActionCard({ icon: Icon, title, subtitle, color, darkMode, onClick }: any) {
    const colors: any = {
        blue: darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600",
        purple: darkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600",
        green: darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600",
        orange: darkMode ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600",
    };

    return (
        <button 
            onClick={onClick}
            className={`p-4 rounded-[1.5rem] border text-left transition-all hover:scale-[1.02] active:scale-95 group
            ${darkMode ? "bg-[#1e1b20]/50 border-white/5 hover:bg-[#252128]" : "bg-white border-pink-100 shadow-sm hover:shadow-md"}`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h4 className={`font-bold text-sm mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>{title}</h4>
            <p className={`text-[10px] font-medium ${darkMode ? "text-gray-500 group-hover:text-gray-400" : "text-slate-500"}`}>{subtitle}</p>
        </button>
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