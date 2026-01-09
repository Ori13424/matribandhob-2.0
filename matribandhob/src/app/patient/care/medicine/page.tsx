"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Plus, Pill, Syringe, GlassWater, Clock, 
  CheckCircle, Trash2, Sun, Moon, X, Droplet, BellRing, CalendarDays
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";

type MedType = 'Tablet' | 'Syrup' | 'Injection' | 'Drops';
type DurationUnit = 'Days' | 'Weeks' | 'Months';

export default function MedicineLogPage() {
  const router = useRouter();
  
  // UI States
  const { darkMode, toggleDarkMode } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAlarm, setShowAlarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [user, setUser] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  
  // Form States
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<MedType>('Tablet');
  const [newDosage, setNewDosage] = useState("1 pc");
  
  // New Duration States
  const [durationNum, setDurationNum] = useState("7");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('Days');
  
  // Time State
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- 1. SETUP ---
  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) Notification.requestPermission();
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const q = query(collection(db, "users", currentUser.uid, "medicines"), orderBy("time", "asc"));
        
        const unsubMeds = onSnapshot(q, (snapshot) => {
            const todayStart = new Date();
            todayStart.setHours(0,0,0,0);
            const now = new Date();

            const data = snapshot.docs.map(docSnap => {
                const med = docSnap.data();
                
                // 1. Check if Course Ended
                let isExpired = false;
                if (med.endDate && med.endDate.toDate() < now) {
                    isExpired = true;
                }

                // 2. Daily Reset Logic
                let isTakenToday = med.takenToday;
                if (med.lastTaken && med.lastTaken.toDate() < todayStart) {
                   isTakenToday = false; 
                }
                
                return { id: docSnap.id, ...med, takenToday: isTakenToday, isExpired };
            })
            // Filter out expired medicines from the active view
            .filter((m: any) => !m.isExpired);

            setMedicines(data);
            setLoading(false);
        });
        return () => unsubMeds();
      } else {
        router.push("/login");
      }
    });

    const timer = setInterval(checkSchedule, 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. LOGIC ---
  const checkSchedule = () => {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes();
      const am = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${am}`;

      medicines.forEach(med => {
          if (med.time === timeString && !med.takenToday) triggerAlarm(med);
      });
  };

  const triggerAlarm = (med: any) => {
      setShowAlarm(med);
      if(audioRef.current) {
          audioRef.current.loop = true;
          audioRef.current.play().catch(e => console.log(e));
      }
      if (Notification.permission === "granted") {
          new Notification(`Time for ${med.name}!`, { body: `Take ${med.dosage} now.` });
      }
  };

  const snoozeAlarm = () => {
      if(audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
      setShowAlarm(null);
  };

  const handleAddMedicine = async () => {
    if (!user || !newName) return;
    const finalTime = `${hour}:${minute} ${ampm}`;
    
    // Calculate End Date
    const start = new Date();
    const end = new Date(start);
    const num = parseInt(durationNum) || 7;
    
    if (durationUnit === 'Days') end.setDate(start.getDate() + num);
    if (durationUnit === 'Weeks') end.setDate(start.getDate() + (num * 7));
    if (durationUnit === 'Months') end.setMonth(start.getMonth() + num);

    try {
        await addDoc(collection(db, "users", user.uid, "medicines"), {
            name: newName,
            type: newType,
            time: finalTime,
            dosage: newDosage,
            source: 'patient',
            takenToday: false,
            createdAt: serverTimestamp(),
            durationText: `${num} ${durationUnit}`, // UI display
            endDate: Timestamp.fromDate(end) // Logic
        });
        setShowAddModal(false);
        setNewName("");
    } catch (error) {
        console.error("Error adding med", error);
    }
  };

  const toggleTaken = async (medId: string, currentStatus: boolean) => {
    if (!user) return;
    if (showAlarm && showAlarm.id === medId) snoozeAlarm();
    try {
        await updateDoc(doc(db, "users", user.uid, "medicines", medId), {
            takenToday: !currentStatus,
            lastTaken: !currentStatus ? serverTimestamp() : null 
        });
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
      if(!user || !showDeleteConfirm) return;
      try {
          await deleteDoc(doc(db, "users", user.uid, "medicines", showDeleteConfirm));
          setShowDeleteConfirm(null);
      } catch(e) { console.error(e); }
  };

  // Helper to calculate days left
  const getDaysLeft = (endDate: any) => {
      if (!endDate) return "";
      const diff = endDate.toDate().getTime() - new Date().getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      return days > 0 ? `${days} days left` : "Last day";
  };

  const totalMeds = medicines.length;
  const takenMeds = medicines.filter(m => m.takenToday).length;
  const progressPercent = totalMeds === 0 ? 0 : Math.round((takenMeds / totalMeds) * 100);

  return (
    <div className={`min-h-screen font-sans relative pb-24 transition-colors duration-500 
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>
      
      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 py-4 flex items-center justify-between transition-all
        ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
              <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-none">Medicine Log</h1>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Active Course Tracking</p>
          </div>
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
      <main className="pt-24 px-4 md:px-8 max-w-3xl mx-auto">
        
        {/* PROGRESS */}
        <div className={`w-full p-6 rounded-[2rem] mb-8 flex items-center justify-between relative overflow-hidden transition-colors
            ${darkMode ? "bg-gradient-to-r from-blue-900 to-purple-900" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-1">Today's Progress</h2>
                <p className="text-blue-100 text-xs mb-4 opacity-90">
                    {totalMeds === 0 ? "No active medicines." : `You have taken ${takenMeds} of ${totalMeds} meds.`}
                </p>
                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden max-w-[150px]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-white rounded-full" />
                </div>
            </div>
            <div className="relative z-10 text-right">
                <div className="text-4xl font-black text-white">{progressPercent}%</div>
                <div className="text-[10px] uppercase font-bold text-blue-200">Completed</div>
            </div>
            <Pill className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-45" />
        </div>

        {/* LIST */}
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Active Schedule</h3>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-xs font-bold text-pink-500 bg-pink-500/10 px-3 py-1.5 rounded-full hover:bg-pink-500 hover:text-white transition-colors">
                    <Plus className="w-3 h-3" /> Add Med
                </button>
            </div>

            {loading ? <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-t-2 border-pink-500 rounded-full mx-auto"/></div> : 
             medicines.length === 0 ? (
                <div className="text-center py-10 opacity-50 border-2 border-dashed rounded-3xl border-gray-500/20">
                    <Pill className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-bold">No active medicines.</p>
                </div>
             ) : (
                medicines.map((med) => (
                    <motion.div key={med.id} layout className={`p-4 rounded-2xl border flex items-center justify-between group transition-all
                        ${med.takenToday 
                            ? (darkMode ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200") 
                            : (darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-pink-100 shadow-sm")}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative transition-colors
                                ${med.takenToday ? "bg-green-500 text-white" : (darkMode ? "bg-white/5 text-gray-400" : "bg-slate-100 text-slate-500")}`}>
                                {getIcon(med.type)}
                            </div>
                            <div className={med.takenToday ? "opacity-50" : ""}>
                                <h4 className={`font-bold text-base ${med.takenToday && "line-through"} ${darkMode ? "text-white" : "text-slate-800"}`}>{med.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1 font-mono bg-gray-500/10 px-1.5 py-0.5 rounded"><Clock className="w-3 h-3" /> {med.time}</span>
                                    <span>• {med.dosage}</span>
                                    {med.endDate && (
                                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                                            <CalendarDays className="w-3 h-3" /> {getDaysLeft(med.endDate)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => toggleTaken(med.id, med.takenToday)} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${med.takenToday ? "bg-green-500 border-green-500 text-white scale-105" : (darkMode ? "border-gray-600 hover:border-green-500 text-gray-600" : "border-slate-200 hover:border-green-500 text-slate-300")}`}>
                                <CheckCircle className="w-6 h-6" />
                            </button>
                            {med.source === 'patient' && (
                                <button onClick={() => setShowDeleteConfirm(med.id)} className="p-3 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))
            )}
        </div>
      </main>

      {/* --- ADD MEDICINE MODAL --- */}
      {mounted && showAddModal && createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-sm p-6 rounded-[2.5rem] relative shadow-2xl overflow-hidden ${darkMode ? "bg-[#1a0f15] text-white" : "bg-white text-slate-900"}`}
                >
                    <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-500/10"><X className="w-5 h-5 text-gray-500"/></button>
                    <h2 className="text-xl font-bold mb-4">Add Medicine</h2>
                    
                    <div className="space-y-4">
                        <div className={`p-3 rounded-2xl border ${darkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                            <label className="text-[10px] font-bold uppercase text-gray-500 ml-1 block mb-1">Medicine Name</label>
                            <input type="text" placeholder="e.g. Napa Extra" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-transparent outline-none font-bold text-lg" />
                        </div>

                        {/* CLOCK */}
                        <div className="mb-2">
                             <AnalogTimePicker hour={hour} setHour={setHour} minute={minute} setMinute={setMinute} ampm={ampm} setAmpm={setAmpm} darkMode={darkMode} />
                        </div>

                        {/* Duration & Dosage */}
                        <div className="flex gap-3">
                             {/* Dosage */}
                            <div className={`flex-[1.2] p-3 rounded-2xl border ${darkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                                <label className="text-[10px] font-bold uppercase text-gray-500 ml-1 block mb-1">Dosage</label>
                                <input type="text" value={newDosage} onChange={(e) => setNewDosage(e.target.value)} className="w-full bg-transparent outline-none font-bold text-sm" />
                            </div>

                            {/* DURATION INPUT */}
                            <div className={`flex-[2] p-3 rounded-2xl border flex items-end gap-2 ${darkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1 block mb-1">For</label>
                                    <input 
                                        type="number" value={durationNum} onChange={(e) => setDurationNum(e.target.value)}
                                        className="w-10 bg-transparent outline-none font-bold text-sm text-center border-b border-gray-500/30"
                                    />
                                </div>
                                <select 
                                    value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as any)}
                                    className={`bg-transparent outline-none text-xs font-bold pb-1 cursor-pointer ${darkMode ? "text-gray-300" : "text-slate-600"}`}
                                >
                                    <option value="Days">Days</option>
                                    <option value="Weeks">Weeks</option>
                                    <option value="Months">Months</option>
                                </select>
                            </div>
                        </div>

                        {/* Type */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {(['Tablet', 'Syrup', 'Injection'] as MedType[]).map(type => (
                                <button key={type} onClick={() => setNewType(type)} className={`flex-1 p-3 rounded-xl border flex items-center justify-center transition-all ${newType === type ? "bg-pink-500 border-pink-500 text-white" : "border-transparent bg-gray-500/10 text-gray-500"}`}>
                                    {getIcon(type)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleAddMedicine} className="w-full mt-6 py-3.5 rounded-2xl font-bold bg-pink-600 text-white shadow-lg shadow-pink-600/30 active:scale-95 transition-transform">
                        Start Course
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>, document.body
      )}

      {/* --- ALARM POPUP --- */}
      {mounted && showAlarm && createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6">
                <motion.div className="w-full max-w-xs text-center relative">
                    <div className="w-32 h-32 mx-auto bg-pink-500 rounded-full flex items-center justify-center relative mb-8">
                        <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-50"></div>
                        <BellRing className="w-16 h-16 text-white animate-wiggle relative z-10" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">It's Time!</h2>
                    <p className="text-gray-300 text-lg mb-8">Take <span className="text-pink-400 font-bold">{showAlarm.dosage}</span> of <span className="text-white font-bold">{showAlarm.name}</span></p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => toggleTaken(showAlarm.id, false)} className="w-full py-4 rounded-2xl font-bold bg-green-500 text-white text-lg">Mark as Taken</button>
                        <button onClick={snoozeAlarm} className="text-gray-500 font-bold text-sm py-2">Snooze (10m)</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>, document.body
      )}

      {/* --- DELETE CONFIRM --- */}
      {mounted && showDeleteConfirm && createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setShowDeleteConfirm(null)}>
                <motion.div className={`w-full max-w-sm p-6 rounded-3xl text-center shadow-2xl ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
                    <h3 className="text-xl font-bold mb-6">Delete Medicine?</h3>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(null)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>Cancel</button>
                        <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white">Delete</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>, document.body
      )}

    </div>
  );
}

// --- ANALOG CLOCK COMPONENT ---
function AnalogTimePicker({ hour, setHour, minute, setMinute, ampm, setAmpm, darkMode }: any) {
    const [mode, setMode] = useState<'hour' | 'minute'>('hour');
    const hours = Array.from({length: 12}, (_, i) => i + 1);
    const minutes = Array.from({length: 12}, (_, i) => i * 5);

    const handleSelect = (val: number) => {
        if (mode === 'hour') {
            setHour(val.toString().padStart(2, '0'));
            setMode('minute');
        } else {
            setMinute(val.toString().padStart(2, '0'));
        }
    };

    return (
        <div className={`p-4 rounded-3xl border flex flex-col items-center ${darkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center justify-center gap-2 mb-6 text-3xl font-black">
                <button onClick={() => setMode('hour')} className={`${mode === 'hour' ? "text-pink-500 scale-110" : "text-gray-500 opacity-50"} transition-all`}>{hour}</button>
                <span className="text-gray-500 text-lg mb-1">:</span>
                <button onClick={() => setMode('minute')} className={`${mode === 'minute' ? "text-pink-500 scale-110" : "text-gray-500 opacity-50"} transition-all`}>{minute}</button>
                <div className="flex flex-col ml-3 gap-1">
                    {['AM', 'PM'].map(p => (
                        <button key={p} onClick={() => setAmpm(p)} className={`px-2 py-0.5 text-[10px] rounded border ${ampm === p ? "bg-pink-500 border-pink-500 text-white" : "border-gray-500/30 text-gray-500"}`}>{p}</button>
                    ))}
                </div>
            </div>
            <div className={`w-52 h-52 rounded-full relative flex items-center justify-center shadow-inner ${darkMode ? "bg-black/40 shadow-black/50" : "bg-white shadow-gray-200"}`}>
                <div className="w-2 h-2 bg-pink-500 rounded-full z-20"></div>
                {(mode === 'hour' ? hours : minutes).map((num, i) => {
                    const rotation = (i + 1) * 30; 
                    const isSelected = mode === 'hour' ? parseInt(hour) === num : parseInt(minute) === num;
                    return (
                        <div key={num} onClick={() => handleSelect(num)} className="absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold cursor-pointer transition-all z-10" style={{ transform: `rotate(${rotation}deg) translate(0, -85px) rotate(-${rotation}deg)` }}>
                            <span className={`w-full h-full flex items-center justify-center rounded-full ${isSelected ? "bg-pink-500 text-white shadow-lg shadow-pink-500/40 scale-125" : (darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black")}`}>{mode === 'minute' && num === 0 ? "00" : num}</span>
                        </div>
                    );
                })}
                <motion.div className="absolute w-1 h-24 bg-gradient-to-t from-pink-500 to-transparent origin-bottom bottom-1/2 left-1/2 -ml-0.5 opacity-30 pointer-events-none rounded-full" animate={{ rotate: (mode === 'hour' ? parseInt(hour) * 30 : parseInt(minute) * 6) }} />
            </div>
        </div>
    )
}

function getIcon(type: string) {
    switch(type) {
        case 'Syrup': return <GlassWater className="w-4 h-4" />;
        case 'Injection': return <Syringe className="w-4 h-4" />;
        case 'Drops': return <Droplet className="w-4 h-4" />;
        default: return <Pill className="w-4 h-4" />;
    }
}