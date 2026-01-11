"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sun, Moon, Home, Stethoscope, Heart, User, Bot, 
  Smile, Frown, Meh, CloudRain, Activity, Apple, Music, Wind, 
  CheckCircle, AlertCircle, X, History, CalendarDays
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import ChatBotWidget from "@/features/patient/components/dashboard/ChatBotWidget"; 
import { useTheme } from "@/context/ThemeContext";

type Lang = 'en' | 'bn';
type Mood = 'Happy' | 'Tired' | 'Sad' | 'Anxious' | 'Neutral';

const SYMPTOMS_LIST = [
    { id: 'headache', label: 'Headache', icon: '🤕' },
    { id: 'nausea', label: 'Nausea', icon: '🤢' },
    { id: 'swelling', label: 'Swelling', icon: '🦶' },
    { id: 'bleeding', label: 'Bleeding', icon: '🩸', danger: true },
    { id: 'fever', label: 'Fever', icon: '🤒', danger: true },
    { id: 'cramps', label: 'Cramps', icon: '⚡' },
];

export default function WellnessPage() {
  const router = useRouter();
  
  // --- UI STATES ---
  const { darkMode, toggleDarkMode } = useTheme();
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Ma");
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // --- NAVIGATION STATE (Fixed Animation) ---
  const [activeTab, setActiveTab] = useState("wellness");

  // --- WELLNESS DATA ---
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [hasLoggedMoodToday, setHasLoggedMoodToday] = useState(false); // New state for locking input
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showDangerAlert, setShowDangerAlert] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // --- FETCH USER & TODAY'S LOG ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. Get User Name
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            setUserName(snap.data().basicInfo?.fullName?.split(" ")[0] || "Ma");
        }

        // 2. Check if already logged today
        const dateKey = new Date().toISOString().split('T')[0];
        const logSnap = await getDoc(doc(db, "users", user.uid, "dailyLogs", dateKey));
        if (logSnap.exists()) {
            const data = logSnap.data();
            if (data.mood) {
                setSelectedMood(data.mood);
                setHasLoggedMoodToday(true); // Lock input if mood exists
            }
            if (data.symptoms) setSelectedSymptoms(data.symptoms);
        }

        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // --- HANDLERS ---
  const handleMoodSelect = async (mood: Mood) => {
    if (hasLoggedMoodToday) return; // Prevent change if already logged

    setSelectedMood(mood);
    setHasLoggedMoodToday(true); // Lock UI immediately

    if (auth.currentUser) {
        const dateKey = new Date().toISOString().split('T')[0];
        await setDoc(doc(db, "users", auth.currentUser.uid, "dailyLogs", dateKey), {
            mood: mood,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    }
  };

  const toggleSymptom = async (id: string, isDanger: boolean) => {
    const newSymptoms = selectedSymptoms.includes(id)
        ? selectedSymptoms.filter(s => s !== id)
        : [...selectedSymptoms, id];
    
    setSelectedSymptoms(newSymptoms);

    if (isDanger && !selectedSymptoms.includes(id)) {
        setShowDangerAlert(true);
    }

    if (auth.currentUser) {
        const dateKey = new Date().toISOString().split('T')[0];
        await setDoc(doc(db, "users", auth.currentUser.uid, "dailyLogs", dateKey), {
            symptoms: newSymptoms,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#120a10]" : "bg-[#fff5f7]"}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans relative pb-28 transition-colors duration-500 overflow-x-hidden
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>
      
      {/* BACKGROUND BLOBS */}
      <div className={`fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none`}>
        <div className={`absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-40 transition-colors duration-500 ${darkMode ? "bg-teal-900" : "bg-teal-200"}`} />
        <div className={`absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-30 transition-colors duration-500 ${darkMode ? "bg-blue-900" : "bg-blue-200"}`} />
      </div>

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300
        ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Wellness Center</h1>
        </div>

        <div className="flex items-center gap-3">
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

      {/* MAIN CONTENT */}
      <main className="pt-24 px-4 md:px-8 max-w-4xl mx-auto space-y-8">

        {/* 1. MOOD TRACKER */}
        <div className="text-center space-y-6 py-4">
            <div>
                <h2 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>How are you feeling, {userName}?</h2>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-slate-500"}`}>Track your mental well-being daily</p>
            </div>
            
            {hasLoggedMoodToday ? (
                // --- LOCKED STATE UI ---
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-8 rounded-[2rem] border flex flex-col items-center gap-4 max-w-sm mx-auto
                    ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-pink-100 shadow-sm"}`}
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
                            Check-in Complete
                        </h3>
                        <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                            You're feeling <span className="font-bold text-pink-500">{selectedMood}</span> today.
                            <br />Your mood log has been saved.
                        </p>
                    </div>
                    <div className={`text-xs px-4 py-2 rounded-full font-medium ${darkMode ? "bg-white/10 text-gray-400" : "bg-slate-100 text-slate-500"}`}>
                        Updates enabled tomorrow
                    </div>
                </motion.div>
            ) : (
                // --- ACTIVE INPUT STATE UI ---
                <div className="flex flex-wrap justify-center gap-4">
                    <MoodBtn mood="Happy" icon={Smile} color="text-yellow-500" active={selectedMood === 'Happy'} onClick={() => handleMoodSelect('Happy')} darkMode={darkMode} />
                    <MoodBtn mood="Neutral" icon={Meh} color="text-blue-500" active={selectedMood === 'Neutral'} onClick={() => handleMoodSelect('Neutral')} darkMode={darkMode} />
                    <MoodBtn mood="Tired" icon={CloudRain} color="text-gray-500" active={selectedMood === 'Tired'} onClick={() => handleMoodSelect('Tired')} darkMode={darkMode} />
                    <MoodBtn mood="Sad" icon={Frown} color="text-purple-500" active={selectedMood === 'Sad'} onClick={() => handleMoodSelect('Sad')} darkMode={darkMode} />
                </div>
            )}
        </div>

        {/* 2. SYMPTOM CHECKLIST */}
        <div className={`p-6 rounded-[2rem] border relative overflow-hidden ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
             <h3 className={`text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>
                <Activity className="w-4 h-4" /> Physical Check-in
             </h3>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SYMPTOMS_LIST.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom.id);
                    return (
                        <button 
                            key={symptom.id}
                            onClick={() => toggleSymptom(symptom.id, !!symptom.danger)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3
                            ${isSelected 
                                ? (symptom.danger ? "bg-red-500 border-red-500 text-white" : "bg-teal-600 border-teal-600 text-white") 
                                : (darkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700")}`}
                        >
                            <span className="text-2xl">{symptom.icon}</span>
                            <span className="text-sm font-bold">{symptom.label}</span>
                            {isSelected && <CheckCircle className="w-4 h-4 ml-auto" />}
                        </button>
                    )
                })}
             </div>
        </div>

        {/* 3. MODULES PLACEHOLDERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WellnessCard icon={Apple} title="Pusti Kotha" subtitle="Nutrition & Diet" color="green" darkMode={darkMode} onClick={() => router.push("/patient/wellness/nutrition")} />
            <WellnessCard icon={Wind} title="Moner Jotno" subtitle="Breathing & Meditation" color="cyan" darkMode={darkMode} onClick={() => router.push("/patient/wellness/mental-health")} />
            <WellnessCard icon={Music} title="Audio Therapy" subtitle="Surah & Nature Sounds" color="purple" darkMode={darkMode} onClick={() => router.push("/patient/wellness/mental-health?tab=listen")} />
        </div>

      </main>

      {/* --- HISTORY MODAL --- */}
      <AnimatePresence>
        {showHistory && (
            <HistoryModal onClose={() => setShowHistory(false)} darkMode={darkMode} />
        )}
      </AnimatePresence>

      {/* DANGER ALERT MODAL */}
      <AnimatePresence>
        {showDangerAlert && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-sm p-6 rounded-3xl text-center shadow-2xl ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-red-500">Warning Sign</h3>
                    <p className="text-sm opacity-80 mb-6">You selected a danger sign. Please contact your doctor immediately or call the hotline.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDangerAlert(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm ${darkMode ? "bg-white/10" : "bg-gray-100"}`}>Dismiss</button>
                        <button onClick={() => window.location.href = "tel:16263"} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 text-white shadow-lg shadow-red-600/30">Call 16263</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <ChatBotWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} darkMode={darkMode} />

      {/* --- BOTTOM NAV (FIXED ANIMATION) --- */}
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
                onClick={() => setActiveTab('wellness')} 
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

// --- SUB-COMPONENTS ---

function HistoryModal({ onClose, darkMode }: any) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!auth.currentUser) return;
            const q = query(
                collection(db, "users", auth.currentUser.uid, "dailyLogs"),
                orderBy("lastUpdated", "desc"),
                limit(7)
            );
            const snap = await getDocs(q);
            setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        fetchHistory();
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-[2rem] h-[60vh] flex flex-col ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5 text-pink-500" /> Recent History</h3>
                    <button onClick={onClose}><X className="w-6 h-6 opacity-50" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {loading ? <p className="text-center opacity-50 mt-10">Loading logs...</p> : 
                     history.length === 0 ? <p className="text-center opacity-50 mt-10">No logs found yet.</p> :
                     history.map((log) => (
                        <div key={log.id} className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold opacity-50">{log.id}</span>
                                {log.mood && <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500">{log.mood}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {log.symptoms?.map((s: string) => (
                                    <span key={s} className={`text-[10px] px-2 py-1 rounded-lg ${darkMode ? "bg-white/10" : "bg-white shadow-sm"}`}>
                                        {SYMPTOMS_LIST.find(sl => sl.id === s)?.icon} {SYMPTOMS_LIST.find(sl => sl.id === s)?.label}
                                    </span>
                                ))}
                                {!log.symptoms?.length && <span className="text-xs opacity-50">No symptoms logged.</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

function MoodBtn({ mood, icon: Icon, color, active, onClick, darkMode }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 w-24
            ${active 
                ? `${darkMode ? "bg-white/10 border-white/20" : "bg-white shadow-md border-pink-100"} scale-110` 
                : `${darkMode ? "border-transparent opacity-50 hover:opacity-100 hover:bg-white/5" : "border-transparent opacity-50 hover:opacity-100 hover:bg-slate-50"}`}`}
        >
            <Icon className={`w-8 h-8 ${active ? color : (darkMode ? "text-gray-400" : "text-slate-400")}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-xs font-bold ${active ? (darkMode ? "text-white" : "text-slate-900") : "hidden"}`}>{mood}</span>
        </button>
    )
}

function WellnessCard({ icon: Icon, title, subtitle, color, darkMode, onClick }: any) {
    const colors: any = {
        green: darkMode ? "text-green-400 bg-green-500/10" : "text-green-600 bg-green-50",
        cyan: darkMode ? "text-cyan-400 bg-cyan-500/10" : "text-cyan-600 bg-cyan-50",
        purple: darkMode ? "text-purple-400 bg-purple-500/10" : "text-purple-600 bg-purple-50",
    };

    return (
        <button 
            onClick={onClick}
            className={`p-5 rounded-[2rem] border text-left flex flex-col gap-4 transition-all hover:scale-[1.02]
            ${darkMode ? "bg-[#1e1b20]/50 border-white/5 hover:bg-[#252128]" : "bg-white border-pink-100 shadow-sm hover:shadow-md"}`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h4 className={`font-bold text-lg ${darkMode ? "text-white" : "text-slate-800"}`}>{title}</h4>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-slate-500"}`}>{subtitle}</p>
            </div>
        </button>
    )
}

function NavButton({ icon: Icon, label, active, onClick, darkMode }: any) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-1.5 w-14 pt-1 group">
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -top-1 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"
        />
      )}
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'text-white translate-y-[-2px]' : (darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-slate-400 group-hover:text-slate-600')}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} color={active ? (darkMode ? "white" : "#db2777") : "currentColor"} />
      </div>
      <span className={`text-[9px] font-bold transition-colors ${active ? 'text-pink-500' : (darkMode ? 'text-gray-600' : 'text-slate-400')}`}>{label}</span>
    </button>
  );
}