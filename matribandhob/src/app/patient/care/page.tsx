"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sun, Moon, Eye, EyeOff, 
  Calendar, Stethoscope, FileText, Phone, CheckCircle, Clock,
  Home, Heart, User, Bot, AlertCircle
} from "lucide-react";

// --- MOCK DATA ---
const upcomingAppt = {
  doctor: "Dr. Ayesha Siddiqua",
  specialty: "Gynecologist",
  date: "12 Oct, 2025",
  time: "10:30 AM",
  hospital: "Matri Sadan, Dhaka",
  status: "Confirmed"
};

const ancTimeline = [
  { id: 1, title: "ANC Visit 1", weeks: "Week 16", date: "Aug 10, 2025", status: "Done" },
  { id: 2, title: "ANC Visit 2", weeks: "Week 24", date: "Oct 12, 2025", status: "Upcoming" },
  { id: 3, title: "ANC Visit 3", weeks: "Week 32", date: "Dec 05, 2025", status: "Pending" },
  { id: 4, title: "ANC Visit 4", weeks: "Week 36", date: "Jan 02, 2026", status: "Pending" },
  { id: 5, title: "ANC Visit 5", weeks: "Week 38", date: "Feb 15, 2026", status: "Pending" },
];

type Lang = 'en' | 'bn';

export default function CarePage() {
  const router = useRouter();
  
  // --- STATES ---
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useState<Lang>('en');
  const [isPrivate, setIsPrivate] = useState(false); // Privacy Toggle

  // --- HANDLERS ---
  const togglePrivacy = () => setIsPrivate(!isPrivate);

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
            {/* PRIVACY TOGGLE (Purdah Mode) */}
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

            {/* Language */}
            <button onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} className={`w-9 h-9 flex items-center justify-center text-xs font-black rounded-full border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100 text-slate-600"}`}>
                {lang.toUpperCase()}
            </button>

            {/* Theme */}
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-full border ${darkMode ? "bg-white/5 border-white/5 text-yellow-400" : "bg-white border-pink-100 text-slate-500"}`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </div>
      </header>

      {/* --- MAIN CONTENT (Grid Layout) --- */}
      <main className={`pt-24 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6
          ${isPrivate ? "blur-xl scale-95 opacity-50 pointer-events-none select-none" : ""}`}
      >
        
        {/* LEFT COLUMN (Appt + Quick Actions) - Spans 8 cols on desktop */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 1. NEXT APPOINTMENT HERO */}
            <div className={`w-full rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-xl border group min-h-[220px] flex flex-col justify-center
                ${darkMode 
                    ? "bg-gradient-to-br from-pink-900/40 to-[#120a10] border-pink-500/20" 
                    : "bg-white border-pink-100 shadow-rose-100/50"}`}
            >
                {/* BG Decoration */}
                <div className="absolute top-0 right-0 p-6 opacity-10"><Calendar className="w-40 h-40" /></div>
                
                <div className="relative z-10 w-full md:max-w-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500 text-white shadow-lg shadow-pink-500/30">
                            Next Checkup
                        </span>
                        <span className={`text-sm font-bold flex items-center gap-1 ${darkMode ? "text-pink-300" : "text-pink-600"}`}>
                            <Clock className="w-3 h-3" /> {upcomingAppt.date}
                        </span>
                    </div>
                    
                    <h2 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>{upcomingAppt.doctor}</h2>
                    <p className={`text-sm mb-6 flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                        <Stethoscope className="w-4 h-4" /> {upcomingAppt.specialty} 
                        <span className="opacity-30">|</span> 
                        {upcomingAppt.hospital}
                    </p>

                    <div className="flex gap-3">
                        <button className="px-6 py-3 rounded-xl bg-pink-600 text-white font-bold text-sm shadow-lg shadow-pink-600/20 hover:scale-[1.02] transition-transform flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Start Video Call
                        </button>
                        <button className={`px-6 py-3 rounded-xl border font-bold text-sm transition-colors ${darkMode ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                            View Details
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. QUICK ACTIONS GRID (2 cols on mobile, 4 on desktop) */}
            <div>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 pl-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Quick Care</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ActionCard 
                        icon={Stethoscope} title="Find Doctor" subtitle="Book Specialist" 
                        color="blue" darkMode={darkMode} onClick={() => {}} 
                    />
                    <ActionCard 
                        icon={FileText} title="My Reports" subtitle="Upload & View" 
                        color="purple" darkMode={darkMode} onClick={() => {}} 
                    />
                    <ActionCard 
                        icon={Phone} title="Govt. Hotline" subtitle="Call 16263" 
                        color="green" darkMode={darkMode} onClick={() => window.location.href = 'tel:16263'} 
                    />
                    <ActionCard 
                        icon={Calendar} title="Medicine" subtitle="Daily Log" 
                        color="orange" darkMode={darkMode} onClick={() => {}} 
                    />
                </div>
            </div>

             {/* 4. HEALTH ALERTS (Desktop Only Filler) */}
             <div className="hidden lg:block">
                 <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 pl-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Daily Tips</h3>
                 <div className={`p-4 rounded-2xl border flex items-start gap-4 ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                     <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><AlertCircle className="w-6 h-6" /></div>
                     <div>
                        <h4 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>Stay Hydrated!</h4>
                        <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>Drinking 8-10 glasses of water helps maintain healthy amniotic fluid levels.</p>
                     </div>
                 </div>
             </div>

        </div>

        {/* RIGHT COLUMN (Timeline) - Spans 4 cols on desktop */}
        <div className="lg:col-span-4 h-full">
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 pl-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>ANC Journey</h3>
            <div className={`rounded-[2rem] p-6 border h-fit lg:min-h-[600px] relative overflow-hidden
                ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                
                {/* Scrollable Container for Desktop */}
                <div className="space-y-8 relative h-full">
                    {/* Vertical Line */}
                    <div className={`absolute left-[19px] top-2 bottom-2 w-0.5 rounded-full ${darkMode ? "bg-white/10" : "bg-slate-100"}`} />

                    {ancTimeline.map((item, index) => {
                        const isDone = item.status === "Done";
                        const isNext = item.status === "Upcoming";
                        
                        return (
                            <div key={item.id} className="relative flex gap-4 items-start group">
                                {/* Dot Indicator */}
                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 transition-all shadow-md
                                    ${darkMode ? "border-[#1e1b20]" : "border-white"}
                                    ${isDone ? "bg-green-500 text-white" : isNext ? "bg-pink-500 text-white animate-pulse" : (darkMode ? "bg-white/10 text-gray-500" : "bg-slate-100 text-slate-400")}`}
                                >
                                    {isDone ? <CheckCircle className="w-5 h-5" /> : isNext ? <Clock className="w-5 h-5" /> : <span className="text-xs font-bold">{index + 1}</span>}
                                </div>

                                {/* Content */}
                                <div className={`flex-1 pt-1 ${!isDone && !isNext && "opacity-50"}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>{item.title}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full 
                                            ${isDone ? "bg-green-500/10 text-green-500" : isNext ? "bg-pink-500/10 text-pink-500" : "bg-gray-500/10 text-gray-500"}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-slate-500"}`}>{item.weeks} • {item.date}</p>
                                    
                                    {/* Additional Details for Active Item */}
                                    {isNext && (
                                        <div className={`mt-3 p-3 rounded-xl text-xs border ${darkMode ? "bg-pink-500/10 border-pink-500/20 text-pink-200" : "bg-pink-50 border-pink-100 text-pink-700"}`}>
                                            <strong>Focus:</strong> Blood pressure, Weight check, Urine test.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
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

      {/* --- BOTTOM NAV --- */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
        <nav className={`w-full max-w-lg backdrop-blur-xl border rounded-[2rem] shadow-2xl flex justify-around items-center h-20 px-2 relative transition-all duration-300
            ${darkMode ? "bg-[#1a0b10]/95 border-white/10" : "bg-white/90 border-pink-100 shadow-rose-200/50"}`}>
            
            <NavButton 
                icon={Home} 
                label="Home" 
                active={false} 
                onClick={() => router.push("/patient/dashboard")} 
                darkMode={darkMode} 
            />
            
            <NavButton icon={Stethoscope} label="Care" active={true} onClick={() => {}} darkMode={darkMode} />

            <div className="relative -top-6 group">
                <div className={`w-16 h-16 bg-gradient-to-tr from-gray-500 to-slate-600 rounded-full flex items-center justify-center shadow-xl border-[6px] relative z-10 grayscale opacity-50
                        ${darkMode ? "border-[#120a10]" : "border-[#fff5f7]"}`}
                >
                    <Bot className="w-7 h-7 text-white" />
                </div>
                <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap opacity-50
                    ${darkMode ? "text-gray-400" : "text-slate-400"}`}>Ask AI</span>
            </div>

            <NavButton icon={Heart} label="Wellness" active={false} onClick={() => {}} darkMode={darkMode} />
            <NavButton icon={User} label="Profile" active={false} onClick={() => {}} darkMode={darkMode} />
        
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