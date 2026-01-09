"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sun, Moon, Wind, Play, Pause, 
  Music, CloudRain, BookOpen, Volume2, Heart,
  Trees, Waves, Sparkles, MoonStar, Leaf, Eye, AlertCircle,
  Activity, Timer, Info, RotateCcw, Loader2
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// ==========================================
// 1. STABLE AUDIO LIBRARY
// ==========================================
const AUDIO_LIBRARY = {
  nature: [
    { 
      id: 'rain', 
      title: 'Heavy Rain', 
      subtitle: 'Deep Sleep', 
      icon: CloudRain, 
      src: 'https://raw.githubusercontent.com/shritesh/peaceful-sounds/master/src/assets/audio/rain.mp3' 
    },
    { 
      id: 'waves', 
      title: 'Ocean Waves', 
      subtitle: 'Calming Tide', 
      icon: Waves, 
      src: 'https://raw.githubusercontent.com/shritesh/peaceful-sounds/master/src/assets/audio/waves.mp3' 
    },
    { 
      id: 'river', 
      title: 'River Stream', 
      subtitle: 'Gentle Flow', 
      icon: Music, 
      src: 'https://raw.githubusercontent.com/shritesh/peaceful-sounds/master/src/assets/audio/stream.mp3' 
    },
    { 
      id: 'forest', 
      title: 'Forest Birds', 
      subtitle: 'Morning Clarity', 
      icon: Trees, 
      src: 'https://raw.githubusercontent.com/shritesh/peaceful-sounds/master/src/assets/audio/birds.mp3' 
    },
    { 
      id: 'white_noise', 
      title: 'White Noise', 
      subtitle: 'Focus / Block Noise', 
      icon: Wind, 
      src: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' 
    }
  ],
  spiritual: [
    { 
      id: 'surah_maryam', 
      title: 'Surah Maryam', 
      subtitle: 'Ease for Mothers', 
      icon: BookOpen, 
      src: 'https://server8.mp3quran.net/afs/019.mp3' 
    },
    { 
      id: 'surah_rahman', 
      title: 'Surah Ar-Rahman', 
      subtitle: 'The Most Merciful', 
      icon: Heart, 
      src: 'https://server8.mp3quran.net/afs/055.mp3' 
    },
    { 
      id: 'surah_duha', 
      title: 'Surah Ad-Duha', 
      subtitle: 'Hope & Relief', 
      icon: Sun, 
      src: 'https://server8.mp3quran.net/afs/093.mp3' 
    },
    { 
      id: 'surah_inshirah', 
      title: 'Surah Al-Inshirah', 
      subtitle: 'Ease after Hardship', 
      icon: Sparkles, 
      src: 'https://server8.mp3quran.net/afs/094.mp3' 
    },
    { 
      id: 'surah_mulk', 
      title: 'Surah Al-Mulk', 
      subtitle: 'Protection', 
      icon: MoonStar, 
      src: 'https://server8.mp3quran.net/afs/067.mp3' 
    }
  ]
};

// ==========================================
// 2. YOGA GUIDE DATABASE
// ==========================================
const YOGA_GUIDE = {
  beginner: [
    { id: 1, title: "Butterfly Pose", sanskrit: "Baddha Konasana", duration: 120, benefit: "Opens hips & eases delivery", steps: ["Sit with spine straight", "Join feet soles together", "Gently flap knees like wings"] },
    { id: 2, title: "Cat-Cow Stretch", sanskrit: "Marjaryasana", duration: 180, benefit: "Relieves back pain", steps: ["Hands & knees on floor", "Inhale, look up (Cow)", "Exhale, curve back (Cat)"] },
    { id: 9, title: "Kegel Exercise", sanskrit: "Pelvic Floor", duration: 60, benefit: "Prevents leaking", steps: ["Tighten pelvic muscles", "Hold for 5 seconds", "Release for 5 seconds", "Repeat"] }
  ],
  intermediate: [
    { id: 3, title: "Warrior II", sanskrit: "Virabhadrasana II", duration: 60, benefit: "Strengthens legs", steps: ["Stand wide apart", "Turn right foot out", "Bend right knee, arms out"] },
    { id: 4, title: "Tree Pose", sanskrit: "Vrksasana", duration: 45, benefit: "Improves balance", steps: ["Stand on one leg", "Place other foot on calf (not knee)", "Hands in prayer position"] }
  ],
  advanced: [
    { id: 5, title: "Goddess Pose", sanskrit: "Utkata Konasana", duration: 45, benefit: "Pelvic floor strength", steps: ["Wide stance, toes out", "Bend knees deeply", "Arms in cactus shape"] },
    { id: 6, title: "Squat Pose", sanskrit: "Malasana", duration: 90, benefit: "Prepares for labor", steps: ["Feet mat-width apart", "Squat down fully", "Hands in prayer, elbows push knees"] }
  ]
};

const EXERCISES = [
    { id: '478', title: 'Relax (4-7-8)', desc: 'Sleep & Anxiety', color: 'teal' },
    { id: 'box', title: 'Box Breathing', desc: 'Focus & Clarity', color: 'blue' },
    { id: 'grounding', title: '5-4-3-2-1', desc: 'Panic Attack Relief', color: 'orange' },
];

// --- MAIN PAGE WRAPPER ---
export default function MentalHealthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-pink-50" />}>
            <MentalHealthContent />
        </Suspense>
    );
}

function MentalHealthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
 const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'breathe' | 'listen' | 'yoga'>('breathe');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'listen') setActiveTab('listen');
    if (tabParam === 'yoga') setActiveTab('yoga');
  }, [searchParams]);

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
          <h1 className="text-lg font-bold">Moner Jotno (Mind Care)</h1>
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
      <main className="pt-24 px-4 md:px-8 max-w-xl mx-auto pb-10">
        
        {/* TABS NAVIGATION */}
        <div className={`flex p-1 rounded-2xl mb-8 overflow-x-auto ${darkMode ? "bg-white/5" : "bg-white border border-pink-100"}`}>
            {[
                { id: 'breathe', label: 'Breathing', icon: Wind, color: 'teal' },
                { id: 'listen', label: 'Audio', icon: Volume2, color: 'purple' },
                { id: 'yoga', label: 'Yoga', icon: Activity, color: 'pink' },
            ].map((tab: any) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3 px-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap relative z-10
                    ${activeTab === tab.id 
                        ? `text-white` 
                        : "text-gray-500 hover:bg-white/5"}`}
                >
                    {activeTab === tab.id && (
                        <motion.div 
                            layoutId="mainTabPill"
                            className={`absolute inset-0 rounded-xl -z-10 bg-${tab.color}-600 shadow-lg`}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
            ))}
        </div>

        <AnimatePresence mode="wait">
            {activeTab === 'breathe' && <ExerciseHub key="breathe" darkMode={darkMode} />}
            {activeTab === 'listen' && <AudioPlayer key="listen" darkMode={darkMode} />}
            {activeTab === 'yoga' && <YogaSection key="yoga" darkMode={darkMode} />}
        </AnimatePresence>

      </main>
    </div>
  );
}

// ==========================================
// 1. YOGA SECTION
// ==========================================
function YogaSection({ darkMode }: { darkMode: boolean }) {
    const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [activePose, setActivePose] = useState<number | null>(null);

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex justify-center gap-2 mb-6">
                {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button key={lvl} onClick={() => setLevel(lvl as any)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all border ${level === lvl ? "bg-pink-600 border-pink-600 text-white" : (darkMode ? "border-white/10 text-gray-400" : "border-slate-200 text-slate-500")}`}>
                        {lvl}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {YOGA_GUIDE[level].map((pose) => (
                    <div key={pose.id} className={`rounded-[2rem] border overflow-hidden transition-all ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                        <button onClick={() => setActivePose(activePose === pose.id ? null : pose.id)} className="w-full p-6 text-left flex justify-between items-center">
                            <div>
                                <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-slate-800"}`}>{pose.title}</h3>
                                <p className="text-xs text-pink-500 font-medium italic">{pose.sanskrit}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>
                                <Timer className="w-3 h-3" /> {Math.floor(pose.duration / 60)}:{(pose.duration % 60).toString().padStart(2, '0')}
                            </div>
                        </button>

                        <AnimatePresence>
                            {activePose === pose.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 border-t border-dashed border-gray-500/20 pt-4">
                                    <div className="space-y-3 mb-6">
                                        {pose.steps.map((step, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm opacity-80">
                                                <span className="font-bold text-pink-500">{idx + 1}.</span>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <YogaTimer duration={pose.duration} darkMode={darkMode} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function YogaTimer({ duration, darkMode }: { duration: number, darkMode: boolean }) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);
    
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const progress = ((duration - timeLeft) / duration) * 100;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className={`p-4 rounded-2xl flex items-center gap-6 ${darkMode ? "bg-black/20" : "bg-pink-50"}`}>
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-500/10" />
                    <circle 
                        cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                        className="text-pink-500 transition-all duration-1000 ease-linear"
                    />
                </svg>
                <div className="absolute font-mono font-bold text-xl">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
            </div>

            <div className="flex-1 space-y-2">
                <button 
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${isActive ? "bg-red-500/10 text-red-500" : "bg-pink-600 text-white shadow-lg shadow-pink-600/30"}`}
                >
                    {isActive ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Start Timer</>}
                </button>
                <button 
                    onClick={() => { setIsActive(false); setTimeLeft(duration); }}
                    className="w-full py-2 rounded-xl font-bold text-xs opacity-60 hover:opacity-100 flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
            </div>
        </div>
    );
}

// ==========================================
// 2. AUDIO PLAYER (WITH ANIMATION)
// ==========================================
function AudioPlayer({ darkMode }: { darkMode: boolean }) {
    const [category, setCategory] = useState<'nature' | 'spiritual'>('nature');
    const [currentTrack, setCurrentTrack] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = (track: any) => {
        if (!audioRef.current) return;

        if (currentTrack === track.id && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsLoading(true);
            setCurrentTrack(track.id);
            audioRef.current.src = track.src;
            audioRef.current.load();
            
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        setIsLoading(false);
                    })
                    .catch((e) => {
                        console.error("Playback error:", e);
                        setIsLoading(false);
                        setIsPlaying(false);
                    });
            }
        }
    };

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const tracks = AUDIO_LIBRARY[category];

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            
            {/* CATEGORY TOGGLE (ANIMATED) */}
            <div className={`flex p-1 rounded-xl mb-6 w-max mx-auto relative ${darkMode ? "bg-white/10" : "bg-gray-100"}`}>
                <button 
                    onClick={() => setCategory('nature')} 
                    className={`relative z-10 px-6 py-2 rounded-lg text-xs font-bold transition-all ${category === 'nature' ? (darkMode ? "text-black" : "text-black") : "text-gray-500"}`}
                >
                    Nature
                    {category === 'nature' && (
                        <motion.div layoutId="audioTab" className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                </button>
                <button 
                    onClick={() => setCategory('spiritual')} 
                    className={`relative z-10 px-6 py-2 rounded-lg text-xs font-bold transition-all ${category === 'spiritual' ? (darkMode ? "text-black" : "text-black") : "text-gray-500"}`}
                >
                    Spiritual
                    {category === 'spiritual' && (
                        <motion.div layoutId="audioTab" className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                </button>
            </div>

            {/* TRACK LIST (ANIMATED) */}
            <div className="space-y-3 min-h-[350px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {tracks.map((track) => {
                            const isActive = currentTrack === track.id;
                            return (
                                <button key={track.id} onClick={() => togglePlay(track)} className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all group ${isActive ? (darkMode ? "bg-white/10 border-white/20" : "bg-white border-purple-200 shadow-md") : (darkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-slate-100 hover:border-purple-100 shadow-sm")}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-purple-600 text-white" : (darkMode ? "bg-black/30 text-gray-400" : "bg-slate-100 text-slate-500")}`}>
                                        {isActive && isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isActive && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm ${isActive ? "text-purple-500" : (darkMode ? "text-white" : "text-slate-800")}`}>{track.title}</h4>
                                        <p className="text-xs opacity-60">{track.subtitle}</p>
                                    </div>
                                    {isActive && isPlaying && <div className="flex gap-0.5 items-end h-4 mr-2"><span className="w-1 bg-purple-500 animate-bounce h-3 rounded-full"></span><span className="w-1 bg-purple-500 animate-bounce h-5 rounded-full"></span><span className="w-1 bg-purple-500 animate-bounce h-2 rounded-full"></span></div>}
                                </button>
                            )
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ==========================================
// 3. BREATHING
// ==========================================
function ExerciseHub({ darkMode }: { darkMode: boolean }) {
    const [selectedEx, setSelectedEx] = useState('478');
    const [isActive, setIsActive] = useState(false);
    const handleSelect = (id: string) => { setIsActive(false); setSelectedEx(id); };

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {!isActive && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {EXERCISES.map((ex) => (
                        <button key={ex.id} onClick={() => handleSelect(ex.id)} className={`p-4 rounded-2xl border text-left transition-all ${selectedEx === ex.id ? (darkMode ? "bg-white/10 border-teal-500 text-white" : "bg-teal-50 border-teal-500 text-teal-900") : (darkMode ? "bg-transparent border-white/5 text-gray-500 hover:bg-white/5" : "bg-white border-slate-100 text-gray-500 hover:bg-slate-50")}`}>
                            <h4 className="font-bold text-sm mb-1">{ex.title}</h4>
                            <p className="text-[10px] opacity-70 leading-tight">{ex.desc}</p>
                        </button>
                    ))}
                </div>
            )}
            <div className={`p-8 rounded-[2.5rem] relative overflow-hidden text-center min-h-[400px] flex flex-col items-center justify-center ${darkMode ? "bg-gradient-to-br from-[#1e1b20] to-[#120a10] border border-white/5" : "bg-white border border-pink-100 shadow-xl"}`}>
                {selectedEx === '478' && <Breathing478 isActive={isActive} setIsActive={setIsActive} />}
                {selectedEx === 'box' && <BreathingBox isActive={isActive} setIsActive={setIsActive} />}
                {selectedEx === 'grounding' && <Grounding54321 isActive={isActive} setIsActive={setIsActive} darkMode={darkMode} />}
            </div>
        </motion.div>
    )
}

function Breathing478({ isActive, setIsActive }: any) {
    const [phase, setPhase] = useState('Ready');
    const [scale, setScale] = useState(1);
    useEffect(() => {
        if (!isActive) { setPhase('Ready'); setScale(1); return; }
        let mounted = true;
        const cycle = async () => {
            if(!mounted) return; setPhase('Inhale (4s)'); setScale(1.5); await new Promise(r => setTimeout(r, 4000));
            if(!mounted) return; setPhase('Hold (7s)');  setScale(1.5); await new Promise(r => setTimeout(r, 7000));
            if(!mounted) return; setPhase('Exhale (8s)'); setScale(1);   await new Promise(r => setTimeout(r, 8000));
            if(mounted) cycle();
        };
        cycle();
        return () => { mounted = false; };
    }, [isActive]);
    return (
        <>
            <motion.div animate={{ scale }} transition={{ duration: phase.includes('Inhale') ? 4 : phase.includes('Exhale') ? 8 : 0 }} className="w-48 h-48 rounded-full bg-teal-500/20 flex items-center justify-center mb-8 relative">
                <div className="w-32 h-32 bg-teal-500 rounded-full blur-xl absolute opacity-50"></div>
                <div className="relative z-10 font-black text-2xl text-teal-500">{phase}</div>
            </motion.div>
            <button onClick={() => setIsActive(!isActive)} className={`px-8 py-3 rounded-full font-bold transition-all w-48 ${isActive ? "bg-red-500/10 text-red-500" : "bg-teal-600 text-white shadow-lg"}`}>{isActive ? "Stop" : "Start"}</button>
        </>
    )
}

function BreathingBox({ isActive, setIsActive }: any) {
    const [phase, setPhase] = useState('Ready');
    useEffect(() => {
        if (!isActive) { setPhase('Ready'); return; }
        let mounted = true;
        const cycle = async () => {
            const t = 4000;
            if(!mounted) return; setPhase('Inhale'); await new Promise(r => setTimeout(r, t));
            if(!mounted) return; setPhase('Hold'); await new Promise(r => setTimeout(r, t));
            if(!mounted) return; setPhase('Exhale'); await new Promise(r => setTimeout(r, t));
            if(!mounted) return; setPhase('Hold'); await new Promise(r => setTimeout(r, t));
            if(mounted) cycle();
        };
        cycle(); return () => { mounted = false; };
    }, [isActive]);
    return (
        <>
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                <motion.div animate={isActive ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 16, ease: "linear", repeat: Infinity }} className="absolute inset-0 border-4 border-blue-500/30 rounded-3xl" />
                <div className="font-black text-xl text-blue-500">{phase}</div>
            </div>
            <button onClick={() => setIsActive(!isActive)} className={`px-8 py-3 rounded-full font-bold transition-all w-48 ${isActive ? "bg-red-500/10 text-red-500" : "bg-blue-600 text-white shadow-lg"}`}>{isActive ? "Stop" : "Start"}</button>
        </>
    )
}

function Grounding54321({ isActive, setIsActive, darkMode }: any) {
    const [step, setStep] = useState(0);
    const steps = [{count:5,text:"SEE"},{count:4,text:"TOUCH"},{count:3,text:"HEAR"},{count:2,text:"SMELL"},{count:1,text:"TASTE"}];
    return (
        <>
            <div className="mb-8 w-full max-w-xs text-center">
                {isActive ? (
                    <motion.div key={step} initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                        <div className="text-6xl font-black text-orange-500">{steps[step].count}</div>
                        <h3 className={`text-xl font-bold ${darkMode?"text-white":"text-slate-800"}`}>{steps[step].text}</h3>
                        <div className="flex justify-center gap-2 mt-4">
                             {step > 0 && <button onClick={() => setStep(s => s-1)} className="px-4 py-2 rounded-lg bg-white/10 text-xs">Prev</button>}
                             {step < 4 ? <button onClick={() => setStep(s => s+1)} className="px-6 py-2 rounded-lg bg-orange-500 text-white font-bold text-sm">Next</button> : <div className="text-green-500 font-bold">Done!</div>}
                        </div>
                    </motion.div>
                ) : (
                    <div><div className="text-6xl mb-4">🖐️</div><h3 className="font-bold">Panic Relief</h3></div>
                )}
            </div>
            <button onClick={() => {setIsActive(!isActive); setStep(0)}} className={`px-8 py-3 rounded-full font-bold transition-all w-48 ${isActive ? "bg-red-500/10 text-red-500" : "bg-orange-600 text-white shadow-lg"}`}>{isActive ? "Stop" : "Start"}</button>
        </>
    )
}