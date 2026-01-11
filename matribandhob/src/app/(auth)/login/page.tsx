"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LogIn, Lock, Mail, ArrowLeft, AlertCircle, 
  User, Activity, Truck, Check, X 
} from "lucide-react";
import { AuthService } from "@/features/auth/logic/authService";
import { motion, AnimatePresence } from "framer-motion";

// FIREBASE IMPORTS
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

type UserRole = "mother" | "doctor" | "driver";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("mother"); // The UI Toggle state
  const [loading, setLoading] = useState(false);
  
  // Custom Error States
  const [error, setError] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Reset Modal States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // --- AUTO-HIDE ERROR POPUP ---
  useEffect(() => {
    if (showErrorPopup) {
      const timer = setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showErrorPopup]);

  const getRegisterLink = () => {
    if (role === 'mother') return '/register/mother';
    if (role === 'doctor') return '/register/partner?role=doctor';
    if (role === 'driver') return '/register/partner?role=driver';
    return '/';
  };

  const theme = {
    mother: {
      accent: "text-pink-500",
      bgGlow: "bg-pink-600/20",
      borderFocus: "focus:border-pink-500",
      shadowFocus: "focus:shadow-[0_0_20px_rgba(236,72,153,0.4)]",
      btn: "bg-gradient-to-r from-pink-600 to-rose-600 shadow-[0_0_20px_rgba(236,72,153,0.4)]",
      icon: <User className="w-8 h-8 text-white" />
    },
    doctor: {
      accent: "text-yellow-400",
      bgGlow: "bg-yellow-500/20",
      borderFocus: "focus:border-yellow-400",
      shadowFocus: "focus:shadow-[0_0_20px_rgba(250,204,21,0.4)]",
      btn: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]",
      icon: <Activity className="w-8 h-8 text-black" />
    },
    driver: {
      accent: "text-blue-500",
      bgGlow: "bg-blue-600/20",
      borderFocus: "focus:border-blue-500",
      shadowFocus: "focus:shadow-[0_0_20px_rgba(37,99,235,0.4)]",
      btn: "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]",
      icon: <Truck className="w-8 h-8 text-white" />
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowErrorPopup(false);
    setLoading(true);

    try {
      const { role: userRole } = await AuthService.login(formData.email, formData.password);
      
      // --- STRICT ROLE GATE ---
      // Verifies that the actual user role matches the UI selection
      if (userRole !== role) {
        setError(`Access Denied: You are registered as a ${userRole}. Please switch to the ${userRole} portal to login.`);
        setShowErrorPopup(true);
        setLoading(false);
        return;
      }

      // --- REDIRECTION LOGIC ---
      if (userRole === 'mother') {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.settings?.darkMode !== undefined) {
              localStorage.setItem("theme", userData.settings.darkMode ? "dark" : "light");
            }
            return router.push(userData.onboardingComplete ? '/patient/dashboard' : '/patient/onboarding');
          }
        }
      } 
      
      if (userRole === 'doctor') return router.push('/doctor/dashboard');
      if (userRole === 'driver') return router.push('/driver');

    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Invalid email or password. Please try again.");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Success! Check your email for the link.");
      setResetEmail("");
      setTimeout(() => setShowResetModal(false), 3000);
    } catch (error: any) {
      setResetMessage(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* CUSTOM ERROR POPUP UI */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-10 z-[200] flex justify-center px-4 w-full pointer-events-none"
          >
            <div className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl bg-red-950/90 border-red-500/50 text-red-100 max-w-md`}>
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <p className="text-sm font-bold leading-tight">{error}</p>
              <button onClick={() => setShowErrorPopup(false)} className="ml-2 hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className={`absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] transition-colors duration-700 ${theme[role].bgGlow}`}
      />

      <button onClick={() => router.back()} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 z-20">
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Role Switcher */}
      <div className="flex gap-3 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 relative z-10">
        {(['mother', 'doctor', 'driver'] as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => { setRole(r); setShowErrorPopup(false); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                role === r ? `${theme[r].btn} text-white` : 'text-gray-400 hover:text-white'
            } ${role === r && r === 'doctor' ? '!text-black' : ''}`}
          >
            {r}
          </button>
        ))}
      </div>

      <motion.div 
        key={role}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 ${
              role === 'mother' ? 'bg-pink-600' : role === 'doctor' ? 'bg-yellow-500' : 'bg-blue-600'
          }`}>
            {theme[role].icon}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className={`text-sm mt-2 capitalize font-semibold tracking-widest ${theme[role].accent}`}>{role} Portal</p>
        </div>

        {/* MAIN LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1 group">
            <label className="text-xs font-bold ml-1 uppercase text-gray-400 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className={`absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:${theme[role].accent}`} />
              <input 
                type="email" 
                placeholder="name@example.com"
                className={`w-full bg-[#020817] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none transition-all ${theme[role].borderFocus} ${theme[role].shadowFocus}`}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-1 group">
            <label className="text-xs font-bold ml-1 uppercase text-gray-400 tracking-wider">Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:${theme[role].accent}`} />
              <input 
                type="password" 
                placeholder="••••••••"
                className={`w-full bg-[#020817] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none transition-all ${theme[role].borderFocus} ${theme[role].shadowFocus}`}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => setShowResetModal(true)}
              className={`text-[11px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity ${theme[role].accent}`}
            >
              Forgot Password?
            </button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all mt-2 ${theme[role].btn}`}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          Don't have an account? <Link href={getRegisterLink()} className={`font-bold hover:underline ${theme[role].accent}`}>Register as {role}</Link>
        </p>
      </motion.div>

      {/* RESET MODAL */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm border border-white/10 rounded-[2rem] p-8 shadow-2xl bg-[#0f172a]">
              <h3 className="text-xl font-black mb-2 uppercase tracking-tight text-white">Reset Password</h3>
              <p className="text-xs text-gray-400 mb-6">Enter your email and we'll send a recovery link.</p>
              
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <input 
                  type="email"
                  required
                  placeholder="Email Address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-[#020817] border border-gray-700 rounded-xl h-12 px-4 text-sm text-white focus:border-pink-500 outline-none transition-all"
                />
                
                {resetMessage && (
                  <p className={`text-[10px] font-bold flex items-center gap-1 ${resetMessage.includes("Success") ? 'text-green-500' : 'text-red-500'}`}>
                    {resetMessage.includes("Success") && <Check className="w-3 h-3" />} {resetMessage}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-3 text-xs font-bold text-gray-500">Cancel</button>
                  <button type="submit" disabled={resetLoading} className="flex-1 py-3 bg-pink-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-600/20">
                    {resetLoading ? "Sending..." : "Send Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}