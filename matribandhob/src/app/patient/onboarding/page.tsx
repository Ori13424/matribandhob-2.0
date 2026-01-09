"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { 
  Heart, Calendar, User, Phone, ArrowRight, Shield, Activity, Ruler, 
  Plus, Trash2, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, 
  Check, Baby, Pill, Stethoscope
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// --- CUSTOM UI COMPONENTS ---

// 1. ULTIMATE DATE PICKER
const CustomDatePicker = ({ label, value, onChange, error }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [mode, setMode] = useState<'day' | 'month' | 'year'>('day');
  const pickerRef = useRef<HTMLDivElement>(null);
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const generateYears = (centerYear: number) => {
    const start = centerYear - 6;
    return Array.from({ length: 12 }, (_, i) => start + i);
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Use ISO format to avoid timezone issues (YYYY-MM-DD)
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const isoDate = `${year}-${month}-${d}`;
    
    onChange(isoDate);
    setIsOpen(false);
  };

  const handleHeaderNav = (delta: number) => {
    if (mode === 'day') setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
    if (mode === 'month') setViewDate(new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1));
    if (mode === 'year') setViewDate(new Date(viewDate.getFullYear() + (delta * 12), viewDate.getMonth(), 1));
  };

  return (
    <div className="space-y-1 relative group" ref={pickerRef}>
      <label className="text-xs font-bold text-gray-500 ml-1 uppercase">{label}</label>
      <button 
        onClick={() => { setIsOpen(!isOpen); setMode('day'); }}
        className={`w-full flex items-center justify-between bg-[#1a0b10] border rounded-xl h-[50px] px-4 text-white transition-all ${
          error ? 'border-red-500' : isOpen ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <span className={value ? "text-white" : "text-gray-500 text-sm"}>
          {value ? new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "Select Date"}
        </span>
        <Calendar className={`w-5 h-5 ${value ? 'text-pink-500' : 'text-gray-500'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] mt-2 w-full bg-[#1a0b10] border border-gray-700 rounded-xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <button onClick={(e) => { e.stopPropagation(); handleHeaderNav(-1); }} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setMode(mode === 'month' ? 'day' : 'month'); }} className={`text-sm font-bold px-2 py-1 rounded transition-colors ${mode === 'month' ? 'bg-pink-600 text-white' : 'text-white hover:bg-white/10'}`}>{months[viewDate.getMonth()]}</button>
                <button onClick={(e) => { e.stopPropagation(); setMode(mode === 'year' ? 'day' : 'year'); }} className={`text-sm font-bold px-2 py-1 rounded transition-colors ${mode === 'year' ? 'bg-pink-600 text-white' : 'text-white hover:bg-white/10'}`}>{viewDate.getFullYear()}</button>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleHeaderNav(1); }} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>

            <div className="h-[220px]">
                {mode === 'day' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500 font-bold">{['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                           {Array.from({ length: firstDayOfMonth(viewDate) }).map((_, i) => <div key={`empty-${i}`} />)}
                           {Array.from({ length: daysInMonth(viewDate) }).map((_, i) => {
                             const day = i + 1;
                             const year = viewDate.getFullYear();
                             const month = String(viewDate.getMonth() + 1).padStart(2, '0');
                             const d = String(day).padStart(2, '0');
                             const currentDate = `${year}-${month}-${d}`;
                             
                             return (
                               <button key={day} onClick={(e) => { e.stopPropagation(); handleDaySelect(day); }} className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${value === currentDate ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}>{day}</button>
                             );
                           })}
                        </div>
                    </motion.div>
                )}
                {mode === 'month' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-2 h-full content-start">
                        {months.map((m, i) => (<button key={m} onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), i, 1)); setMode('day'); }} className={`py-3 rounded-lg text-sm font-bold transition-all ${i === viewDate.getMonth() ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>{m}</button>))}
                    </motion.div>
                )}
                {mode === 'year' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-2 h-full content-start">
                        {generateYears(viewDate.getFullYear()).map((y) => (<button key={y} onClick={(e) => { e.stopPropagation(); setViewDate(new Date(y, viewDate.getMonth(), 1)); setMode('month'); }} className={`py-3 rounded-lg text-sm font-bold transition-all ${y === viewDate.getFullYear() ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>{y}</button>))}
                    </motion.div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 2. CUSTOM SELECT
const CustomSelect = ({ label, options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: any) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="space-y-1 relative group" ref={containerRef}>
      <label className="text-xs font-bold text-gray-500 ml-1 uppercase">{label}</label>
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between bg-[#1a0b10] border rounded-xl h-[50px] px-4 text-white transition-all ${isOpen ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-gray-700 hover:border-gray-500'}`}>
        <span className={value ? "text-white" : "text-gray-500 text-sm"}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[100] mt-1 w-full bg-[#1a0b10] border border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
            {options.map((opt: string) => (
              <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-pink-900/30 hover:text-pink-400 transition-colors flex items-center justify-between ${value === opt ? 'text-pink-500 font-bold bg-pink-900/10' : 'text-gray-300'}`}>{opt} {value === opt && <Check className="w-4 h-4" />}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 3. CUSTOM INPUT
const CustomInput = ({ label, value, onChange, placeholder, type = "text", icon: Icon }: any) => (
  <div className="space-y-1 relative group">
    <label className="text-xs font-bold text-gray-500 ml-1 uppercase">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-pink-500 transition-colors" />}
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className={`w-full bg-[#1a0b10] border border-gray-700 rounded-xl h-[50px] ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-white placeholder-gray-500 text-sm focus:border-pink-500 focus:outline-none transition-all focus:shadow-[0_0_15px_rgba(236,72,153,0.2)]`}
      />
    </div>
  </div>
);

// 4. CHECKBOX GROUP
const CheckboxGroup = ({ label, options, selected, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-500 ml-1 uppercase">{label}</label>
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt: string) => (
        <label key={opt} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${selected.includes(opt) ? 'bg-pink-900/20 border-pink-500/50' : 'border-gray-800 hover:bg-white/5'}`}>
          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(opt) ? 'bg-pink-600 border-pink-600' : 'border-gray-600'}`}>
            {selected.includes(opt) && <Check className="w-3 h-3 text-white" />}
          </div>
          <input 
            type="checkbox" className="hidden"
            checked={selected.includes(opt)}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, opt]);
              else onChange(selected.filter((s: string) => s !== opt));
            }}
          />
          <span className={`text-xs font-bold ${selected.includes(opt) ? 'text-pink-200' : 'text-gray-400'}`}>{opt}</span>
        </label>
      ))}
    </div>
  </div>
);

// --- MAIN PAGE ---

type Contact = { id: number; name: string; phone: string; relation: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // State
  const [basicInfo, setBasicInfo] = useState({ fullName: "", phone: "", dob: "", bloodGroup: "", height: "", weight: "" });
  
  // --- ADDED LPD TO STATE ---
  const [pregnancyDetails, setPregnancyDetails] = useState({ 
    status: "Pregnant", 
    lmp: "",  // Last Period Date
    edd: "",  // Expected Due Date
    type: "First pregnancy", 
    prevBirths: "0", 
    miscarriages: "0", 
    deliveryPlan: "" 
  });
  
  const [medicalHistory, setMedicalHistory] = useState({ conditions: [] as string[], complications: [] as string[] });
  const [medsAndAllergies, setMedsAndAllergies] = useState({ medications: "", supplements: [] as string[], drugAllergies: "", foodAllergies: "" });
  const [currentHealth, setCurrentHealth] = useState({ bp: "", bloodSugar: "", hemoglobin: "", symptoms: [] as string[] });
  const [contacts, setContacts] = useState<Contact[]>([{ id: 1, name: "", phone: "", relation: "" }]);

  // Validation
  const validateStep = () => {
    setError("");
    if (step === 2) {
      if (!basicInfo.fullName || !basicInfo.phone || !basicInfo.dob || !basicInfo.bloodGroup || !basicInfo.height || !basicInfo.weight) return "Please fill all Basic Information fields.";
    }
    if (step === 3) {
      // Allow either LPD or EDD to be set, but preferably both logic handles it
      if (!pregnancyDetails.edd && !pregnancyDetails.lmp) return "Please enter Last Period Date (LPD) or Expected Due Date (EDD).";
      if (!pregnancyDetails.deliveryPlan) return "Please select a Delivery Plan.";
    }
    if (step === 7) {
      if (contacts.some(c => !c.name || !c.phone || !c.relation)) return "Please complete all Emergency Contact details.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev + 1);
  };

  // --- AUTO-CALCULATE EDD FROM LPD ---
  const handleLMPChange = (date: string) => {
    // 1. Set LPD
    const newState = { ...pregnancyDetails, lmp: date };
    
    // 2. Calculate EDD (LMP + 280 days)
    if (date) {
        const lmpDate = new Date(date);
        const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
        
        // Format to YYYY-MM-DD
        const year = eddDate.getFullYear();
        const month = String(eddDate.getMonth() + 1).padStart(2, '0');
        const d = String(eddDate.getDate()).padStart(2, '0');
        
        newState.edd = `${year}-${month}-${d}`;
    }
    setPregnancyDetails(newState);
  };

  const handleComplete = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      let gestationWeek = 1;
      if (pregnancyDetails.edd) {
        const eddDate = new Date(pregnancyDetails.edd);
        const today = new Date();
        const diffTime = eddDate.getTime() - today.getTime();
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        gestationWeek = Math.max(1, 40 - diffWeeks);
      }

      const userRef = doc(db, "users", auth.currentUser.uid);
      const primaryContact = contacts[0] || {};

      await updateDoc(userRef, {
        basicInfo: { 
            ...basicInfo, 
            emergencyContact: primaryContact.phone,
            lmp: pregnancyDetails.lmp, // Sync LMP
            edd: pregnancyDetails.edd  // Sync EDD
        },
        
        // Root Level Sync (For easy querying)
        phone: basicInfo.phone, 
        emergencyContact: primaryContact.phone,
        edd: pregnancyDetails.edd,
        lmp: pregnancyDetails.lmp,
        
        emergencyContacts: contacts.map(({ id, ...rest }) => rest), 

        pregnancyDetails: { ...pregnancyDetails, currentWeek: gestationWeek },
        medicalHistory,
        medsAndAllergies,
        currentHealth,
        
        onboardingComplete: true,
        gestationWeek,
        stage: pregnancyDetails.status === "Pregnant" ? "pregnancy" : "postpartum"
      });

      router.push("/patient/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0b10] text-white flex flex-col items-center p-4 font-sans relative overflow-x-hidden">
      
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Progress Bar */}
      <div className="w-full max-w-xl sticky top-0 bg-[#1a0b10]/80 backdrop-blur-md pt-6 pb-4 z-[40]">
        <div className="flex justify-between text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-2 px-1">
          <span>Start</span>
          <span>Basic</span>
          <span>Pregnancy</span>
          <span>Medical</span>
          <span>Health</span>
          <span>Safety</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-pink-500 to-rose-500" initial={{ width: "0%" }} animate={{ width: `${((step - 1) / 6) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        
      </div>

      <div className="w-full max-w-xl bg-[#2a151b]/90 backdrop-blur-xl border border-pink-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 flex flex-col mb-10 min-h-[500px]">
        
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}

        

        <AnimatePresence mode="wait">
          
          {/* 1. WELCOME */}
          {step === 1 && (
            <motion.div key={1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col items-center text-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.4)] mb-6 animate-pulse">
                <Heart className="w-12 h-12 text-white" fill="currentColor" />
              </div>
              <h1 className="text-4xl font-black mb-3 text-white">Hello, Ma!</h1>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                Let's build your health profile to give you personalized care and AI insights.
              </p>
              <button onClick={handleNext} className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 group border border-pink-500/50">
                Start Profile <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
              </button>
            </motion.div>
          )}

          {/* 2. BASIC INFO */}
          {step === 2 && (
            <motion.div key={2} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><User className="w-5 h-5"/> Basic Info</h2>
              <CustomInput label="Full Name" value={basicInfo.fullName} onChange={(v:string) => setBasicInfo({...basicInfo, fullName: v})} placeholder="Your Name" icon={User} />
              
              {/* PHONE NUMBER */}
              <CustomInput label="Your Phone Number" value={basicInfo.phone} onChange={(v:string) => setBasicInfo({...basicInfo, phone: v})} placeholder="017..." icon={Phone} />

              <CustomDatePicker label="Date of Birth" value={basicInfo.dob} onChange={(v:string) => setBasicInfo({...basicInfo, dob: v})} />
              <CustomSelect label="Blood Group" placeholder="Select Group" options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} value={basicInfo.bloodGroup} onChange={(v:string) => setBasicInfo({...basicInfo, bloodGroup: v})} />
              <div className="flex gap-4">
                <div className="flex-1"><CustomInput label="Height (cm)" type="number" value={basicInfo.height} onChange={(v:string) => setBasicInfo({...basicInfo, height: v})} placeholder="160" icon={Ruler} /></div>
                <div className="flex-1"><CustomInput label="Weight (kg)" type="number" value={basicInfo.weight} onChange={(v:string) => setBasicInfo({...basicInfo, weight: v})} placeholder="65" icon={Activity} /></div>
              </div>
            </motion.div>
          )}

          {/* 3. PREGNANCY DETAILS */}
          {step === 3 && (
            <motion.div key={3} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Baby className="w-5 h-5"/> Pregnancy Details</h2>
              <div className="flex bg-[#1a0b10] p-1 rounded-xl border border-gray-700">
                 {['Pregnant', 'Postpartum'].map(s => (
                   <button key={s} onClick={() => setPregnancyDetails({...pregnancyDetails, status: s})} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${pregnancyDetails.status === s ? 'bg-pink-600 text-white' : 'text-gray-400'}`}>{s}</button>
                 ))}
              </div>
              
              {/* --- ADDED LPD (Last Period Date) & Auto-Calculation --- */}
              <CustomDatePicker 
                label="Last Period Date (LPD)" 
                value={pregnancyDetails.lmp} 
                onChange={handleLMPChange} 
              />
              
              <CustomDatePicker 
                label="Expected Due Date (EDD)" 
                value={pregnancyDetails.edd} 
                onChange={(v:string) => setPregnancyDetails({...pregnancyDetails, edd: v})} 
              />

              <CustomSelect label="Pregnancy Type" options={["First pregnancy", "Second pregnancy", "Third+ pregnancy"]} value={pregnancyDetails.type} onChange={(v:string) => setPregnancyDetails({...pregnancyDetails, type: v})} />
              <div className="flex gap-4">
                 <div className="flex-1"><CustomInput label="Prev Births" type="number" value={pregnancyDetails.prevBirths} onChange={(v:string) => setPregnancyDetails({...pregnancyDetails, prevBirths: v})} placeholder="0" /></div>
                 <div className="flex-1"><CustomInput label="Miscarriages" type="number" value={pregnancyDetails.miscarriages} onChange={(v:string) => setPregnancyDetails({...pregnancyDetails, miscarriages: v})} placeholder="0" /></div>
              </div>
              <CustomSelect label="Delivery Plan" placeholder="Select Plan" options={["Hospital", "Clinic", "Home Birth"]} value={pregnancyDetails.deliveryPlan} onChange={(v:string) => setPregnancyDetails({...pregnancyDetails, deliveryPlan: v})} />
            </motion.div>
          )}

          {/* 4. MEDICAL HISTORY */}
          {step === 4 && (
            <motion.div key={4} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Activity className="w-5 h-5"/> Medical History</h2>
              <CheckboxGroup 
                label="Pre-existing Conditions" 
                options={["Diabetes", "High BP", "Thyroid", "Asthma", "Heart Disease", "PCOS", "None"]} 
                selected={medicalHistory.conditions} 
                onChange={(v:string[]) => setMedicalHistory({...medicalHistory, conditions: v})} 
              />
              <div className="h-px bg-white/5 my-2"></div>
              <CheckboxGroup 
                label="Past Complications" 
                options={["Gestational Diabetes", "Pre-eclampsia", "Excessive Bleeding", "C-Section History", "Preterm Birth", "None"]} 
                selected={medicalHistory.complications} 
                onChange={(v:string[]) => setMedicalHistory({...medicalHistory, complications: v})} 
              />
            </motion.div>
          )}

          {/* 5. MEDS & ALLERGIES */}
          {step === 5 && (
            <motion.div key={5} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Pill className="w-5 h-5"/> Meds & Allergies</h2>
              <CustomInput label="Current Medications" placeholder="e.g. Insulin..." value={medsAndAllergies.medications} onChange={(v:string) => setMedsAndAllergies({...medsAndAllergies, medications: v})} />
              <CheckboxGroup 
                label="Vitamin Supplements" 
                options={["Iron", "Folic Acid", "Calcium", "Vitamin D", "Multivitamin"]} 
                selected={medsAndAllergies.supplements} 
                onChange={(v:string[]) => setMedsAndAllergies({...medsAndAllergies, supplements: v})} 
              />
              <CustomInput label="Drug Allergies" placeholder="e.g. Penicillin (Optional)" value={medsAndAllergies.drugAllergies} onChange={(v:string) => setMedsAndAllergies({...medsAndAllergies, drugAllergies: v})} />
              <CustomInput label="Food Allergies" placeholder="e.g. Peanuts (Optional)" value={medsAndAllergies.foodAllergies} onChange={(v:string) => setMedsAndAllergies({...medsAndAllergies, foodAllergies: v})} />
            </motion.div>
          )}

          {/* 6. HEALTH STATUS */}
          {step === 6 && (
            <motion.div key={6} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Stethoscope className="w-5 h-5"/> Current Status</h2>
              <div className="flex gap-4">
                 <div className="flex-1"><CustomInput label="BP (mmHg)" placeholder="120/80" value={currentHealth.bp} onChange={(v:string) => setCurrentHealth({...currentHealth, bp: v})} /></div>
                 <div className="flex-1"><CustomInput label="Sugar (mmol/L)" placeholder="5.6" value={currentHealth.bloodSugar} onChange={(v:string) => setCurrentHealth({...currentHealth, bloodSugar: v})} /></div>
              </div>
              <CustomInput label="Hemoglobin (Hb)" placeholder="12 g/dL" value={currentHealth.hemoglobin} onChange={(v:string) => setCurrentHealth({...currentHealth, hemoglobin: v})} />
              <div className="h-px bg-white/5 my-2"></div>
              <CheckboxGroup 
                label="Current Symptoms" 
                options={["Severe Headache", "Swelling", "Bleeding", "Dizziness", "Shortness of Breath", "Nausea", "None"]} 
                selected={currentHealth.symptoms} 
                onChange={(v:string[]) => setCurrentHealth({...currentHealth, symptoms: v})} 
              />
            </motion.div>
          )}

          {/* 7. SAFETY NET */}
          {step === 7 && (
            <motion.div key={7} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Shield className="w-5 h-5"/> Safety Net</h2>
              <p className="text-sm text-gray-400 mb-2">Emergency contacts for SOS alerts.</p>
              
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                   <div key={contact.id} className="bg-[#1a0b10] border border-gray-700 rounded-xl p-4 relative">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-bold text-pink-500 uppercase">Contact #{index + 1}</span>
                         {contacts.length > 1 && (<button onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>)}
                      </div>
                      <div className="space-y-3">
                         <CustomInput placeholder="Name" value={contact.name} onChange={(v:string) => setContacts(contacts.map(c => c.id === contact.id ? { ...c, name: v } : c))} icon={User} />
                         <CustomInput placeholder="Phone" value={contact.phone} onChange={(v:string) => setContacts(contacts.map(c => c.id === contact.id ? { ...c, phone: v } : c))} icon={Phone} />
                         <CustomSelect placeholder="Relation" options={["Husband", "Mother", "Father", "Sister", "Guardian"]} value={contact.relation} onChange={(v:string) => setContacts(contacts.map(c => c.id === contact.id ? { ...c, relation: v } : c))} />
                      </div>
                   </div>
                ))}
                {contacts.length < 3 && (
                  <button onClick={() => setContacts([...contacts, { id: Date.now(), name: "", phone: "", relation: "" }])} className="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 font-bold hover:border-pink-500 hover:text-pink-500 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Contact
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation Buttons */}
        {step > 1 && (
          <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5">Back</button>
            <button 
              onClick={step === 7 ? handleComplete : handleNext} 
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 hover:scale-[1.02] transition-all"
            >
               {loading ? "Saving..." : step === 7 ? "Complete Setup" : "Next Step"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}