"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  User, Mail, Phone, Lock, Calendar as CalendarIcon, 
  Activity, Truck, ArrowLeft, Shield, 
  Loader2, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight 
} from "lucide-react";
import { AuthService } from "@/features/auth/logic/authService";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type UserRole = "mother" | "doctor" | "driver";

// --- CUSTOM DATE PICKER COMPONENT ---
const CustomDatePicker = ({ value, onChange, themeColor }: { value: string, onChange: (date: string) => void, themeColor: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDayClick = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Adjust for timezone offset to ensure string is correct YYYY-MM-DD
    const offset = selected.getTimezoneOffset();
    const adjustedDate = new Date(selected.getTime() - (offset * 60 * 1000));
    onChange(adjustedDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Input */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer group relative flex items-center bg-slate-950/40 border border-white/5 rounded-xl transition-all duration-300 ring-1 ring-transparent focus-within:ring-pink-500/50 hover:bg-slate-950/60 h-[58px]"
      >
        <div className="pl-4 text-slate-500 group-hover:text-white transition-colors">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div className={`ml-3 text-sm ${value ? 'text-white' : 'text-slate-600'}`}>
          {value || "Select Due Date"}
        </div>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-700 select-none">
          Due Date
        </span>
      </div>

      {/* Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-full bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-white text-sm">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <span key={d} className="text-xs font-bold text-slate-500">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = value && 
                  parseInt(value.split('-')[2]) === day && 
                  parseInt(value.split('-')[1]) === currentDate.getMonth() + 1 &&
                  parseInt(value.split('-')[0]) === currentDate.getFullYear();
                
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`
                      h-8 w-8 rounded-full text-xs font-medium transition-all
                      ${isSelected 
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/30' 
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- COMPONENT CONTENT ---
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [role, setRole] = useState<UserRole>("mother");
  
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "mother" || roleParam === "doctor" || roleParam === "driver") {
      setRole(roleParam);
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPass: "",
    dueDate: "",
    license: ""
  });

  const theme = {
    mother: {
      accent: "text-pink-500",
      bgGradient: "from-pink-500/20 via-rose-500/5 to-transparent",
      ringFocus: "focus-within:ring-pink-500/50",
      btn: "bg-gradient-to-r from-pink-600 to-rose-600 shadow-pink-500/25 text-white",
      icon: <User className="w-6 h-6 text-white" />
    },
    doctor: {
      accent: "text-blue-500",
      bgGradient: "from-blue-500/20 via-cyan-500/5 to-transparent",
      ringFocus: "focus-within:ring-blue-500/50",
      btn: "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/25 text-white",
      icon: <Activity className="w-6 h-6 text-white" />
    },
    driver: {
      accent: "text-amber-400",
      bgGradient: "from-amber-500/20 via-yellow-500/5 to-transparent",
      ringFocus: "focus-within:ring-amber-400/50",
      btn: "bg-gradient-to-r from-amber-400 to-yellow-500 shadow-amber-500/25 text-black font-bold",
      icon: <Truck className="w-6 h-6 text-black" />
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPass) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: role,
      };

      if (role === 'mother') {
        if (!formData.dueDate) throw new Error("Due date is required.");
        payload.dueDate = formData.dueDate;
      } else if (role === 'doctor') {
        if (!formData.license) throw new Error("BMDC Number is required.");
        payload.bmdcNumber = formData.license;
      } else if (role === 'driver') {
        if (!formData.license) throw new Error("License Number is required.");
        payload.licenseNumber = formData.license;
      }

      await AuthService.register(payload);

      if (role === 'mother') router.push('/patient/onboarding');
      else if (role === 'doctor') router.push('/doctor/dashboard');
      else if (role === 'driver') router.push('/driver/dashboard');

    } catch (err: any) {
      console.error("Registration Error:", err);
      const msg = err.message.replace("Firebase: ", "").replace(" (auth/email-already-in-use).", "");
      setError(msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getInputConfig = () => {
    const common = [
      { key: "fullName", label: "Full Name", icon: User, type: "text", ph: "e.g. John Doe" },
      { key: "email", label: "Email Address", icon: Mail, type: "email", ph: "name@example.com" },
      { key: "phone", label: "Phone Number", icon: Phone, type: "tel", ph: "017..." },
    ];

    const passwords = [
      { key: "password", label: "Password", icon: Lock, type: showPassword ? "text" : "password", ph: "••••••" },
      { key: "confirmPass", label: "Confirm Password", icon: Lock, type: showPassword ? "text" : "password", ph: "••••••" },
    ];

    let specific = [];
    if (role === 'mother') {
      // NOTE: Type 'date' here triggers the CustomDatePicker logic in the map below
      specific.push({ key: "dueDate", label: "Estimated Due Date", icon: CalendarIcon, type: "custom-date", ph: "" });
    } else if (role === 'doctor') {
      specific.push({ key: "license", label: "BMDC Number", icon: Shield, type: "text", ph: "Reg. No (e.g. A-1234)" });
    } else {
      specific.push({ key: "license", label: "Driving License", icon: Shield, type: "text", ph: "License ID" });
    }

    return [...common, ...specific, ...passwords];
  };

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-white/20">
      
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, 45, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] bg-gradient-to-bl ${theme[role].bgGradient}`}
      />
      <motion.div 
         animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] bg-gradient-to-tr ${theme[role].bgGradient}`}
      />

      <button onClick={() => router.back()} className="absolute top-6 left-6 p-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 hover:scale-105 transition-all text-gray-400 hover:text-white z-20 group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <motion.div layout className="w-full max-w-[480px] relative z-10 my-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-sm text-slate-400 mt-2">Join Matribandhob AI today</p>
        </div>

        <div className="flex p-1 mb-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl relative shadow-lg">
          {(['mother', 'doctor', 'driver'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(""); }}
              className={`relative flex-1 py-3 text-xs sm:text-sm font-bold capitalize transition-colors duration-300 z-10 
                ${role === r 
                  ? (r === 'driver' ? 'text-black' : 'text-white') 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {role === r && (
                <motion.div
                  layoutId="activeRole"
                  className={`absolute inset-0 rounded-xl ${theme[r].btn} -z-10`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {r}
            </button>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r ${theme[role].bgGradient} blur-sm`} />

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-200 text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {getInputConfig().map((field) => (
                <motion.div 
                  key={field.key + role}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  {field.type === 'custom-date' ? (
                    <CustomDatePicker 
                      value={formData.dueDate}
                      onChange={(date) => handleInputChange("dueDate", date)}
                      themeColor="pink"
                    />
                  ) : (
                    <div className={`group relative flex items-center bg-slate-950/40 border border-white/5 rounded-xl transition-all duration-300 ring-1 ring-transparent ${theme[role].ringFocus} hover:bg-slate-950/60`}>
                      <div className="pl-4 text-slate-500 group-focus-within:text-white transition-colors">
                        <field.icon className="w-5 h-5" />
                      </div>
                      
                      <input 
                        type={field.type} 
                        placeholder={field.ph}
                        value={(formData as any)[field.key]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full bg-transparent border-none py-4 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 [color-scheme:dark]"
                        required
                      />

                      {(field.key === 'password' || field.key === 'confirmPass') && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}

                      {field.key !== 'password' && field.key !== 'confirmPass' && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-700 select-none pointer-events-none group-focus-within:text-slate-500 transition-colors">
                          {field.label}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className={`w-full py-4 mt-6 rounded-xl font-bold uppercase text-sm tracking-wide transition-all shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme[role].btn}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating Account..." : "Sign Up"}
            </motion.button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-slate-500 text-xs">
              Already have an account? 
              <Link href="/login" className={`font-bold hover:underline ml-1.5 ${theme[role].accent} transition-colors`}>
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}