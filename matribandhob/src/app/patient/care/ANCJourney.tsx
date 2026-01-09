"use client";
import { useState, useEffect } from "react";
import { 
  CheckCircle, Clock, Calendar as CalendarIcon, 
  ChevronRight, ChevronLeft, Baby, AlertCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- BANGLADESH GOVT / WHO STANDARD SCHEDULE ---
const ANC_SCHEDULE = [
  { 
    id: 1, 
    week: 12, 
    label: "1st Visit", 
    focus: "Confirm Pregnancy & EDD",
    tests: ["USG Profile", "Blood Group", "Hemoglobin"]
  },
  { 
    id: 2, 
    week: 26, 
    label: "2nd Visit", 
    focus: "Growth Scan & Tika",
    tests: ["TT Vaccine (1st)", "Glucose Test", "Urine R/E"]
  },
  { 
    id: 3, 
    week: 32, 
    label: "3rd Visit", 
    focus: "Maternal Safety",
    tests: ["BP Check", "Iron Folic Supply", "Fetal Movement"]
  },
  { 
    id: 4, 
    week: 36, 
    label: "4th Visit", 
    focus: "Birth Planning",
    tests: ["Position Scan", "Hospital Bag", "Emergency Contact"]
  }
];

export default function ANCJourney({ darkMode }: { darkMode: boolean }) {
  const [loading, setLoading] = useState(true);
  const [lmp, setLmp] = useState<Date | null>(null);
  const [edd, setEdd] = useState<Date | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  
  // Custom Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
            const data = snapshot.data();
            
            // --- FIX: CHECK ROOT LEVEL FIRST, THEN NESTED ---
            // The onboarding form saves to root 'lmp'/'edd' AND 'basicInfo.lmp'/'basicInfo.edd'
            const fetchedLMP = data.lmp || data.basicInfo?.lmp;
            const fetchedEDD = data.edd || data.basicInfo?.edd;

            if (fetchedLMP) {
                const lmpDate = new Date(fetchedLMP);
                setLmp(lmpDate);
                calculateTimeline(lmpDate);
            } else if (fetchedEDD) {
                // If only EDD exists, reverse calculate LMP (EDD - 280 days)
                const eddDate = new Date(fetchedEDD);
                const calcLMP = new Date(eddDate);
                calcLMP.setDate(eddDate.getDate() - 280);
                
                setLmp(calcLMP);
                setEdd(eddDate);
                calculateTimeline(calcLMP);
            }
        }
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const calculateTimeline = (startDate: Date) => {
      const today = new Date();
      
      const calculatedEdd = new Date(startDate);
      calculatedEdd.setDate(startDate.getDate() + 280);
      setEdd(calculatedEdd);

      const calculated = ANC_SCHEDULE.map(visit => {
          const visitDate = new Date(startDate);
          visitDate.setDate(startDate.getDate() + (visit.week * 7));
          
          let status = 'Pending';
          const diffTime = visitDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < -14) status = 'Done';
          else if (diffDays >= -14 && diffDays <= 14) status = 'Upcoming';

          return { ...visit, dateDisplay: visitDate.toDateString(), status, diffDays };
      });

      setTimeline(calculated);
  };

  const handleDateSelect = async () => {
      if (!auth.currentUser) return;
      setIsSaving(true);
      
      try {
          const calculatedEdd = new Date(tempDate);
          calculatedEdd.setDate(tempDate.getDate() + 280);

          // Save to BOTH locations to ensure consistency
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
              "lmp": tempDate.toISOString(),
              "edd": calculatedEdd.toISOString(),
              "basicInfo.lmp": tempDate.toISOString(),
              "basicInfo.edd": calculatedEdd.toISOString()
          });

          setLmp(tempDate);
          calculateTimeline(tempDate);
          setShowDatePicker(false);
      } catch(e) { console.error(e); }
      setIsSaving(false);
  };

  if (loading) return <div className="p-10 text-center opacity-50 text-xs">Syncing Care Data...</div>;

  // --- EMPTY STATE ---
  if (!lmp) return (
      <>
        <div className={`p-6 rounded-[2rem] border text-center ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-pink-100"}`}>
            <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Start Your Journey</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto">
                Select your LMP date to generate your personalized WHO standard care schedule.
            </p>
            
            <button 
                onClick={() => setShowDatePicker(true)}
                className={`w-full p-4 rounded-xl mb-4 text-sm font-bold border flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors
                ${darkMode ? "bg-black/30 border-white/10 text-white hover:bg-white/5" : "bg-slate-50 border-slate-200 text-slate-700"}`}
            >
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                Select Date
            </button>
        </div>

        <AnimatePresence>
            {showDatePicker && (
                <CustomDatePickerModal 
                    date={tempDate} 
                    setDate={setTempDate} 
                    onClose={() => setShowDatePicker(false)}
                    onSave={handleDateSelect}
                    isSaving={isSaving}
                    darkMode={darkMode}
                />
            )}
        </AnimatePresence>
      </>
  );

  // --- TIMELINE VIEW ---
  return (
    <div className="h-full">
        <div className="flex justify-between items-end mb-4 px-2">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-gray-500" : "text-slate-400"}`}>ANC Journey</h3>
            {edd && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${darkMode ? "bg-pink-500/10 text-pink-400" : "bg-pink-50 text-pink-600"}`}>
                    Due: {edd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
            )}
        </div>
        
        <div className={`rounded-[2rem] p-6 border relative overflow-hidden min-h-[500px]
            ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
            
            <div className={`absolute left-[31px] top-8 bottom-8 w-0.5 rounded-full ${darkMode ? "bg-white/5" : "bg-slate-100"}`} />

            <div className="space-y-8 relative">
                {timeline.map((item, index) => {
                    const isDone = item.status === 'Done';
                    const isUpcoming = item.status === 'Upcoming';

                    return (
                        <div key={item.id} className={`relative flex gap-4 items-start group transition-all ${!isDone && !isUpcoming ? "opacity-50 hover:opacity-100" : ""}`}>
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[3px] transition-all shadow-sm
                                ${darkMode ? "border-[#1e1b20]" : "border-white"}
                                ${isDone ? "bg-green-500 text-white" : 
                                  isUpcoming ? "bg-pink-500 text-white animate-pulse scale-110" : 
                                  (darkMode ? "bg-gray-800 text-gray-500" : "bg-slate-100 text-slate-400")}`}
                            >
                                {isDone ? <CheckCircle className="w-4 h-4" /> : 
                                 isUpcoming ? <Clock className="w-4 h-4" /> : 
                                 <span className="text-[10px] font-bold">{index + 1}</span>}
                            </div>

                            <div className="flex-1 pt-0.5">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>{item.label}</h4>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border
                                        ${isDone ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                          isUpcoming ? "bg-pink-500/10 text-pink-500 border-pink-500/20" : 
                                          "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className={`text-[10px] font-mono mb-2 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                                    {new Date(item.dateDisplay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <div className={`p-3 rounded-xl border text-xs 
                                    ${isUpcoming 
                                        ? (darkMode ? "bg-pink-500/10 border-pink-500/20" : "bg-pink-50 border-pink-100") 
                                        : (darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}`}>
                                    <div className="flex items-center gap-2 font-bold mb-2">
                                        <Baby className={`w-3 h-3 ${isUpcoming ? "text-pink-500" : "text-gray-500"}`} />
                                        <span>Focus: {item.focus}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {item.tests.map((test: string, i: number) => (
                                            <div key={i} className="flex items-center gap-2 opacity-80">
                                                <div className={`w-1 h-1 rounded-full ${isUpcoming ? "bg-pink-500" : "bg-gray-400"}`} />
                                                <span>{test}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
}

// --- SUB-COMPONENT: CUSTOM CALENDAR MODAL ---
function CustomDatePickerModal({ date, setDate, onClose, onSave, isSaving, darkMode }: any) {
    const [viewDate, setViewDate] = useState(new Date(date));
    
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const blanks = Array.from({length: firstDay}, (_, i) => i);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.setMonth(viewDate.getMonth() + offset));
        setViewDate(new Date(newDate));
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setDate(newDate);
    };

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold">Select Last Period Date</h3>
                    <p className="text-xs text-gray-500">Usually the first day of bleeding</p>
                </div>

                <div className="flex items-center justify-between mb-4 px-2">
                    <button onClick={() => changeMonth(-1)} className={`p-2 rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}><ChevronLeft className="w-5 h-5"/></button>
                    <span className="font-bold">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                    <button onClick={() => changeMonth(1)} className={`p-2 rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}><ChevronRight className="w-5 h-5"/></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-6">
                    {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-bold text-gray-500 py-2">{d}</span>)}
                    {blanks.map(b => <div key={`blank-${b}`} />)}
                    {days.map(d => {
                        const isSelected = date.getDate() === d && date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear();
                        return (
                            <button 
                                key={d} 
                                onClick={() => handleDayClick(d)}
                                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                ${isSelected ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30" : (darkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-slate-700")}`}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold text-sm ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>Cancel</button>
                    <button onClick={onSave} disabled={isSaving} className="flex-[1.5] py-3 rounded-xl font-bold text-sm bg-pink-600 text-white shadow-lg shadow-pink-600/30">
                        {isSaving ? "Saving..." : "Confirm Date"}
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}