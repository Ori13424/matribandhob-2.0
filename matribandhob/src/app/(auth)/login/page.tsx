"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock, Mail, ArrowLeft, AlertCircle,
  User, Activity, Truck, Check, X, Loader2
} from "lucide-react";
import { AuthService } from "@/features/auth/logic/authService";
import { motion, AnimatePresence } from "framer-motion";

// FIREBASE IMPORTS
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useTranslation } from "@/hooks/useTranslation";

type UserRole = "mother" | "doctor" | "driver";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslation();
  const [role, setRole] = useState<UserRole>("mother");
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
      const timer = setTimeout(() => setShowErrorPopup(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showErrorPopup]);

  // --- UPDATED LINK LOGIC ---
  const getRegisterLink = () => {
    // Points to the new unified register page, passing the current role for UX continuity
    return `/register?role=${role}`;
  };

  // --- THEME CONFIGURATION ---
  const theme = {
    mother: {
      accent: "text-pink-500",
      bgGradient: "from-pink-500/20 via-rose-500/5 to-transparent",
      ringFocus: "focus-within:ring-pink-500/50",
      btn: "bg-gradient-to-r from-pink-600 to-rose-600 shadow-pink-500/25 text-white",
      icon: <User className="w-6 h-6 text-white" />,
      label: t.landing.roles.mother.title
    },
    doctor: {
      accent: "text-blue-500",
      bgGradient: "from-blue-500/20 via-cyan-500/5 to-transparent",
      ringFocus: "focus-within:ring-blue-500/50",
      btn: "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/25 text-white",
      icon: <Activity className="w-6 h-6 text-white" />,
      label: t.landing.roles.doctor.title
    },
    driver: {
      accent: "text-amber-400",
      bgGradient: "from-amber-500/20 via-yellow-500/5 to-transparent",
      ringFocus: "focus-within:ring-amber-400/50",
      btn: "bg-gradient-to-r from-amber-400 to-yellow-500 shadow-amber-500/25 text-black font-bold",
      icon: <Truck className="w-6 h-6 text-black" />,
      label: t.landing.roles.driver.title
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
      if (userRole !== role) {
        setError(t.auth.wrongPortal.replace("{role}", userRole));
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
      if (userRole === 'driver') return router.push('/driver/dashboard');

    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Invalid credentials. Please check your email/password.");
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
      setResetMessage(t.auth.checkEmail);
      setResetEmail("");
      setTimeout(() => setShowResetModal(false), 3000);
    } catch (error: any) {
      setResetMessage(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-white/20">

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className={`absolute top-[-30%] left-[-20%] w-[800px] h-[800px] rounded-full blur-[100px] bg-gradient-to-br ${theme[role].bgGradient}`}
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] bg-gradient-to-tl ${theme[role].bgGradient}`}
      />

      {/* --- ERROR TOAST --- */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 z-50 flex justify-center w-full px-4 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md bg-red-500/10 border border-red-500/20 text-red-200 ring-1 ring-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setShowErrorPopup(false)} className="ml-2 hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => router.back()} className="absolute top-6 left-6 p-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 hover:scale-105 transition-all text-gray-400 hover:text-white z-20 group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* --- MAIN CARD --- */}
      <motion.div
        layout
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Role Switcher */}
        <div className="flex p-1 mb-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl relative">
          {(['mother', 'doctor', 'driver'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setShowErrorPopup(false); }}
              className={`relative flex-1 py-2.5 text-sm font-semibold capitalize transition-colors duration-300 z-10 
                ${role === r
                  ? (r === 'driver' ? 'text-black' : 'text-white')
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {role === r && (
                <motion.div
                  layoutId="activeRole"
                  className={`absolute inset-0 rounded-xl ${theme[r].btn} -z-10`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {theme[r].label}
            </button>
          ))}
        </div>

        {/* Login Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top glow accent inside card */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r ${theme[role].bgGradient} blur-sm`} />

          <div className="text-center mb-8">
            <motion.div
              key={role}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 bg-gradient-to-br ${theme[role].btn}`}
            >
              {theme[role].icon}
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{t.auth.welcomeBack}</h1>
            <p className="text-sm text-slate-400 mt-1">{t.auth.signInToAccess}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email Input */}
            <div className={`group relative flex items-center bg-slate-950/50 border border-white/5 rounded-xl transition-all duration-300 ring-1 ring-transparent ${theme[role].ringFocus}`}>
              <div className="pl-4 text-slate-500 group-focus-within:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder={t.auth.emailPlaceholder}
                className="w-full bg-transparent border-none py-4 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password Input */}
            <div className={`group relative flex items-center bg-slate-950/50 border border-white/5 rounded-xl transition-all duration-300 ring-1 ring-transparent ${theme[role].ringFocus}`}>
              <div className="pl-4 text-slate-500 group-focus-within:text-white transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                className="w-full bg-transparent border-none py-4 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-0"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className={`text-xs font-semibold text-slate-400 hover:text-white transition-colors`}
              >
                {t.auth.forgotPassword}
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold uppercase text-sm tracking-wide transition-all shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme[role].btn}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t.auth.verifying : t.auth.signIn}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs">
              {t.auth.newHere} <Link href={getRegisterLink()} className={`font-bold hover:underline ml-1 ${theme[role].accent}`}>{t.auth.createAccount}</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* --- RESET PASSWORD MODAL --- */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-white">{t.auth.resetPassword}</h3>
                <p className="text-xs text-slate-400 mt-1 px-4">{t.auth.resetDesc}</p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl h-12 px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600"
                />

                {resetMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`text-xs font-medium px-1 flex items-center gap-1.5 ${resetMessage.includes("Success") ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {resetMessage.includes("Success") ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {resetMessage}
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="py-3 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? t.auth.sending : t.auth.sendLink}
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