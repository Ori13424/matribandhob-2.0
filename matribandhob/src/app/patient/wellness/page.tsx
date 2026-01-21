"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sun, Moon, Home, Stethoscope, Heart, User, Bot,
  Smile, Frown, Meh, CloudRain, Activity, Apple, Music, Wind,
  CheckCircle, AlertCircle, X, PhoneCall, ShieldCheck, Ambulance,
  MessageSquare, AlertTriangle, Loader2, RefreshCw, CheckCircle2, MessageCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, collection } from "firebase/firestore";
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

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState("wellness");

  // --- WELLNESS DATA ---
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [hasLoggedMoodToday, setHasLoggedMoodToday] = useState(false);

  // --- SYMPTOM LOGIC ---
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showDangerAlert, setShowDangerAlert] = useState(false);
  const [showEmergencyHub, setShowEmergencyHub] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setUserName(snap.data().basicInfo?.fullName?.split(" ")[0] || "Ma");
        }

        const dateKey = new Date().toISOString().split('T')[0];
        const logSnap = await getDoc(doc(db, "users", user.uid, "dailyLogs", dateKey));

        if (logSnap.exists()) {
          const data = logSnap.data();
          if (data.mood) {
            setSelectedMood(data.mood);
            setHasLoggedMoodToday(true);
          }
          const history = data.symptomHistory || [];
          setLogCount(history.length);
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
    if (hasLoggedMoodToday) return;
    setSelectedMood(mood);
    setHasLoggedMoodToday(true);
    if (auth.currentUser) {
      const dateKey = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, "users", auth.currentUser.uid, "dailyLogs", dateKey), {
        mood: mood,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
  };

  const toggleSymptom = (id: string, isDanger: boolean) => {
    const newSymptoms = selectedSymptoms.includes(id)
      ? selectedSymptoms.filter(s => s !== id)
      : [...selectedSymptoms, id];

    setSelectedSymptoms(newSymptoms);

    if (isDanger && !selectedSymptoms.includes(id)) {
      setShowDangerAlert(true);
    }
  };

  const submitSymptoms = async () => {
    if (!auth.currentUser || logCount >= 2) return;
    setIsSubmitting(true);
    const dateKey = new Date().toISOString().split('T')[0];
    const docRef = doc(db, "users", auth.currentUser.uid, "dailyLogs", dateKey);
    const docSnap = await getDoc(docRef);
    let currentHistory = docSnap.exists() ? (docSnap.data().symptomHistory || []) : [];

    const newEntry = {
      timestamp: new Date().toISOString(),
      symptoms: selectedSymptoms,
      isDanger: selectedSymptoms.some(s => ['bleeding', 'fever'].includes(s))
    };

    const updatedHistory = [...currentHistory, newEntry];

    await setDoc(docRef, {
      symptomHistory: updatedHistory,
      symptoms: selectedSymptoms,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    setLogCount(updatedHistory.length);
    setSelectedSymptoms([]);
    setIsSubmitting(false);
  };

  const hasDangerSign = selectedSymptoms.some(s => ['bleeding', 'fever'].includes(s));

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#120a10]" : "bg-[#fff5f7]"}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans relative pb-28 transition-colors duration-500 overflow-x-hidden
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>

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
          <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-all border ${darkMode ? "bg-white/5 text-yellow-400" : "bg-white text-slate-500 shadow-sm"}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-[2rem] border flex flex-col items-center gap-4 max-w-sm mx-auto ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-pink-100 shadow-sm"}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Mood Recorded</h3>
                <p className={`text-sm opacity-60`}>You're feeling <span className="font-bold text-pink-500">{selectedMood}</span> today.</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <MoodBtn mood="Happy" icon={Smile} color="text-yellow-500" active={selectedMood === 'Happy'} onClick={() => handleMoodSelect('Happy')} darkMode={darkMode} />
              <MoodBtn mood="Neutral" icon={Meh} color="text-blue-500" active={selectedMood === 'Neutral'} onClick={() => handleMoodSelect('Neutral')} darkMode={darkMode} />
              <MoodBtn mood="Tired" icon={CloudRain} color="text-gray-500" active={selectedMood === 'Tired'} onClick={() => handleMoodSelect('Tired')} darkMode={darkMode} />
              <MoodBtn mood="Sad" icon={Frown} color="text-purple-500" active={selectedMood === 'Sad'} onClick={() => handleMoodSelect('Sad')} darkMode={darkMode} />
            </div>
          )}
        </div>

        {/* 2. SYMPTOM CHECKLIST */}
        <div className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>
                <Activity className="w-4 h-4" /> Physical Check-in
              </h3>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-600" : "text-slate-400"}`}>
                Session {Math.min(logCount + 1, 2)} of 2
              </p>
            </div>
            <div className="flex gap-1">
              <div className={`w-8 h-2 rounded-full ${logCount >= 1 ? "bg-pink-500" : (darkMode ? "bg-white/10" : "bg-slate-200")}`} />
              <div className={`w-8 h-2 rounded-full ${logCount >= 2 ? "bg-pink-500" : (darkMode ? "bg-white/10" : "bg-slate-200")}`} />
            </div>
          </div>

          {logCount >= 2 ? (
            // --- LIMIT REACHED UI ---
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold">Daily Check-in Complete</h3>
              <p className="opacity-60 max-w-xs mx-auto">You've finished your 2 daily sessions. Need urgent help?</p>

              {/* REDIRECT TO EMERGENCY HUB */}
              <button onClick={() => setShowEmergencyHub(true)} className="mt-4 px-6 py-3 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/30 flex items-center gap-2 mx-auto animate-pulse">
                <Ambulance className="w-4 h-4" /> Emergency Help
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
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

              <AnimatePresence>
                {hasDangerSign && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4 items-center">
                      <div className="bg-red-500 text-white p-2 rounded-full shrink-0 animate-pulse">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-red-500 text-sm">Critical Warning</h4>
                        <p className="text-xs opacity-80 text-red-400">High-risk symptom detected.</p>
                      </div>
                      <button onClick={() => setShowEmergencyHub(true)} className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap">
                        Get Help
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={submitSymptoms}
                disabled={selectedSymptoms.length === 0 || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                        ${hasDangerSign
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
                    : "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:opacity-90"}
                        ${(selectedSymptoms.length === 0 || isSubmitting) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" />
                ) : (
                  hasDangerSign ? "Report Danger Signs" : "Save Daily Log"
                )}
              </button>
            </>
          )}
        </div>

        {/* 3. MODULES PLACEHOLDERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WellnessCard icon={Apple} title="Pusti Kotha" subtitle="Nutrition & Diet" color="green" darkMode={darkMode} onClick={() => router.push("/patient/wellness/nutrition")} />
          <WellnessCard icon={Wind} title="Moner Jotno" subtitle="Breathing & Meditation" color="cyan" darkMode={darkMode} onClick={() => router.push("/patient/wellness/mental-health")} />
          <WellnessCard icon={Music} title="Audio Therapy" subtitle="Surah & Nature Sounds" color="purple" darkMode={darkMode} onClick={() => router.push("/patient/wellness/mental-health?tab=listen")} />
          <WellnessCard icon={MessageCircle} title="Community" subtitle="Moms Forum" color="pink" darkMode={darkMode} onClick={() => router.push("/patient/community")} />
        </div>

      </main>

      {/* --- INITIAL DANGER POPUP --- */}
      <AnimatePresence>
        {showDangerAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-sm p-6 rounded-3xl text-center shadow-2xl ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
              <div className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg shadow-red-500/40">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-red-500">Critical Warning</h3>
              <p className="text-sm opacity-80 mb-6 px-2">
                You selected <b>Fever</b> or <b>Bleeding</b>. <br />
                <span className="font-bold">Immediate attention recommended.</span>
              </p>
              <div className="flex flex-col gap-3">
                {/* OPENS THE EMERGENCY HUB */}
                <button
                  onClick={() => { setShowDangerAlert(false); setShowEmergencyHub(true); }}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-red-600 text-white shadow-xl shadow-red-600/30 flex items-center justify-center gap-2"
                >
                  <Ambulance className="w-5 h-5" /> Emergency Options
                </button>
                <button onClick={() => setShowDangerAlert(false)} className={`w-full py-3 rounded-xl font-bold text-sm ${darkMode ? "bg-white/10 text-gray-400 hover:bg-white/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  I understand, dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CUSTOM EMERGENCY HUB WITH REAL SOS --- */}
      <AnimatePresence>
        {showEmergencyHub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/95 p-4 backdrop-blur-md">
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className={`w-full max-w-md p-6 rounded-[2.5rem] relative ${darkMode ? "bg-[#1a1012] border border-red-900/50" : "bg-white"}`}
            >
              <button onClick={() => setShowEmergencyHub(false)} className="absolute top-6 right-6 p-2 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors z-20">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold text-red-500 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> Emergency Hub
              </h2>

              {/* Quick Action Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Option 1: Call Hotline */}
                <a href="tel:16263" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20 active:scale-95 transition-transform">
                  <PhoneCall className="h-6 w-6" />
                  <span className="text-sm font-bold">Call 16263</span>
                </a>

                {/* Option 2: AI Doctor Chat */}
                <button
                  onClick={() => { setShowEmergencyHub(false); setIsChatOpen(true); }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border active:scale-95 transition-transform
                            ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
                >
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                  <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>AI Doctor</span>
                </button>
              </div>

              {/* --- REAL SOS BUTTON COMPONENT (INTEGRATED) --- */}
              <IntegratedSOSButton user={auth.currentUser} darkMode={darkMode} />

              <p className="text-center text-[10px] mt-6 opacity-40">
                Hold SOS for 5 seconds to activate siren and location tracking.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatBotWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} darkMode={darkMode} />

      {/* BOTTOM NAV */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
        <nav className={`w-full max-w-lg backdrop-blur-xl border rounded-[2rem] shadow-2xl flex justify-around items-center h-20 px-2 relative transition-all duration-300
            ${darkMode ? "bg-[#1a0b10]/95 border-white/10" : "bg-white/90 border-pink-100 shadow-rose-200/50"}`}>

          <NavButton icon={Home} label="Home" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); router.push("/patient/dashboard"); }} darkMode={darkMode} />
          <NavButton icon={Stethoscope} label="Care" active={activeTab === 'care'} onClick={() => { setActiveTab('care'); router.push("/patient/care"); }} darkMode={darkMode} />

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

          <NavButton icon={Heart} label="Wellness" active={activeTab === 'wellness'} onClick={() => setActiveTab('wellness')} darkMode={darkMode} />
          <NavButton icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); router.push("/patient/profile"); }} darkMode={darkMode} />
        </nav>
      </div>

    </div>
  );
}

// --- SUB-COMPONENTS ---

// --- 1. INTEGRATED SOS BUTTON (Based on your SOSButton.tsx) ---
function IntegratedSOSButton({ user, darkMode }: any) {
  const [status, setStatus] = useState<'idle' | 'counting' | 'sending' | 'sent'>('idle');
  const [count, setCount] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sirenRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    sirenRef.current = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_731818292c.mp3?filename=police-siren-one-loop-23263.mp3");
    sirenRef.current.loop = true;
    return () => { sirenRef.current?.pause(); };
  }, []);

  const playSiren = () => {
    if (sirenRef.current) {
      sirenRef.current.currentTime = 0;
      sirenRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const stopSiren = () => {
    if (sirenRef.current) {
      sirenRef.current.pause();
      sirenRef.current.currentTime = 0;
    }
  };

  const startSOS = () => {
    if (status !== 'idle') return;
    setStatus('counting');
    setCount(5);

    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          triggerAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (status === 'counting') {
      setStatus('idle');
      setCount(5);
    }
  };

  const triggerAlert = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus('sending');

    try {
      playSiren();

      const position = await new Promise<GeolocationPosition>((resolve) => {
        if (!navigator.geolocation) {
          resolve({ coords: { latitude: 0, longitude: 0 } } as any);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve({ coords: { latitude: 0, longitude: 0 } } as any),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

      const loc = { lat: position.coords.latitude, lng: position.coords.longitude };

      await addDoc(collection(db, "alerts"), {
        patientId: user?.uid || "guest",
        patientName: user?.displayName || "Mother",
        type: "EMERGENCY_SOS",
        status: "active",
        timestamp: serverTimestamp(),
        location: loc,
        notifiedContacts: [] // Logic to fetch contacts can be added here
      });

      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          sosTriggered: true,
          location: loc,
          lastActive: serverTimestamp()
        });
      }

      // --- SMS FALLBACK LOGIC ---
      // (Simplified: In a real app, fetch contacts first. Here we assume generic or rely on DB trigger)
      // const mapLink = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
      // window.location.href = `sms:?body=${encodeURIComponent(`EMERGENCY! I need help. My location: ${mapLink}`)}`;

      setStatus('sent');

    } catch (error) {
      console.error("SOS Error:", error);
      stopSiren();
      alert("Connection Failed. Call 16263 immediately.");
      setStatus('idle');
    }
  };

  const resetSOS = async () => {
    stopSiren();
    if (user?.uid) {
      try {
        await updateDoc(doc(db, "users", user.uid), { sosTriggered: false });
      } catch (e) { console.error("Reset failed", e); }
    }
    setStatus('idle');
    setCount(5);
  };

  return (
    <div className={`flex flex-col items-center justify-center py-4 rounded-3xl border transition-all ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
      {status === 'idle' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onMouseDown={startSOS}
          onTouchStart={startSOS}
          onMouseUp={cancelSOS}
          onTouchEnd={cancelSOS}
          className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-700 shadow-[0_0_40px_rgba(225,29,72,0.4)] flex flex-col items-center justify-center border-4 border-white/30 relative overflow-hidden group select-none"
        >
          <div className="relative z-10 flex flex-col items-center">
            <AlertTriangle className="w-12 h-12 text-white mb-1" />
            <span className="text-2xl font-black text-white tracking-[0.2em]">SOS</span>
            <span className="text-[10px] text-white/90 font-bold uppercase mt-1 bg-black/20 px-2 py-0.5 rounded-full">Hold 5s</span>
          </div>
        </motion.button>
      )}

      {status === 'counting' && (
        <div className="flex flex-col items-center">
          <div className="w-40 h-40 rounded-full bg-red-600 flex items-center justify-center border-4 border-white">
            <span className="text-6xl font-black text-white">{count}</span>
          </div>
          <p className="mt-4 text-red-500 font-black animate-pulse">HOLDING...</p>
        </div>
      )}

      {status === 'sending' && (
        <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-red-600 to-pink-600 flex flex-col items-center justify-center border-4 border-white/20">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-2" />
          <span className="text-white text-xs font-bold tracking-widest">SENDING...</span>
        </div>
      )}

      {status === 'sent' && (
        <div className="flex flex-col items-center w-full px-4">
          <div className="w-40 h-40 rounded-full bg-green-500 flex flex-col items-center justify-center border-4 border-white shadow-2xl mb-4">
            <CheckCircle2 className="w-16 h-16 text-white mb-1" />
            <span className="text-white font-black text-xl tracking-widest">SENT!</span>
          </div>
          <p className="text-center text-red-500 font-bold animate-pulse text-sm mb-4">Siren Active • Location Shared</p>
          <button onClick={resetSOS} className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Stop Siren & Reset
          </button>
        </div>
      )}
    </div>
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