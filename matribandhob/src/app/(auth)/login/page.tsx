"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Lock, Mail, ArrowLeft, AlertCircle, User, Activity, Truck } from "lucide-react";
import { AuthService } from "@/features/auth/logic/authService";
import { motion, AnimatePresence } from "framer-motion";

// FIREBASE IMPORTS FOR CHECKING ONBOARDING STATUS
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type UserRole = "mother" | "doctor" | "driver";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("mother");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

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
    setLoading(true);

    try {
      // 1. Perform Login
      const { role: userRole } = await AuthService.login(formData.email, formData.password);
      
      // 2. Check Role & Redirect Logic
      if (userRole === 'mother') {
        // --- NEW LOGIC START ---
        // Check if this mother has completed onboarding
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().onboardingComplete) {
            router.push('/patient/dashboard'); // Go to Dashboard if done
          } else {
            router.push('/patient/onboarding'); // Go to Onboarding if new
          }
        }
        // --- NEW LOGIC END ---
      } 
      else if (userRole === 'doctor') router.push('/dashboard');
      else if (userRole === 'driver') router.push('/driver');
      else router.push('/'); 

    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { staggerChildren: 0.1, duration: 0.4 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className={`absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] transition-colors duration-700 ${
            role === 'mother' ? 'bg-pink-600/20' : role === 'doctor' ? 'bg-yellow-500/20' : 'bg-blue-600/20'
        }`}
      />

      <motion.button 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={() => router.back()} 
        className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition z-20"
      >
        <ArrowLeft className="w-6 h-6" />
      </motion.button>

      <motion.div 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="flex gap-3 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 relative z-10"
      >
        {(['mother', 'doctor', 'driver'] as UserRole[]).map((r) => (
          <motion.button
            key={r}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRole(r)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                role === r 
                ? `${theme[r].btn} text-white` 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            } ${role === r && r === 'doctor' ? '!text-black' : ''}`}
          >
            {r}
          </motion.button>
        ))}
      </motion.div>

      <motion.div 
        key={role}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transition-colors duration-500 ${
              role === 'mother' ? 'bg-pink-600 shadow-pink-500/30' 
              : role === 'doctor' ? 'bg-yellow-500 shadow-yellow-500/30' 
              : 'bg-blue-600 shadow-blue-500/30'
          }`}>
            {theme[role].icon}
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className={`text-sm mt-2 capitalize font-semibold ${theme[role].accent}`}>
            {role} Portal
          </p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div variants={itemVariants} className="space-y-1 group">
            <label className={`text-xs font-bold ml-1 uppercase transition-colors group-hover:text-white text-gray-500`}>Email Address</label>
            <div className="relative">
              <Mail className={`absolute left-4 top-3.5 w-5 h-5 text-gray-500 transition-colors group-hover:${theme[role].accent}`} />
              <input 
                type="email" 
                placeholder="name@example.com"
                className={`w-full bg-[#020817] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white 
                    focus:outline-none focus:ring-0 transition-all duration-300 placeholder:text-gray-600
                    ${theme[role].borderFocus} ${theme[role].shadowFocus}`}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1 group">
            <label className={`text-xs font-bold ml-1 uppercase transition-colors group-hover:text-white text-gray-500`}>Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-3.5 w-5 h-5 text-gray-500 transition-colors group-hover:${theme[role].accent}`} />
              <input 
                type="password" 
                placeholder="••••••••"
                className={`w-full bg-[#020817] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white 
                    focus:outline-none focus:ring-0 transition-all duration-300 placeholder:text-gray-600
                    ${theme[role].borderFocus} ${theme[role].shadowFocus}`}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end">
            <Link href="#" className={`text-xs font-medium hover:underline ${theme[role].accent}`}>
              Forgot Password?
            </Link>
          </motion.div>

          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold transition-all mt-2 ${theme[role].btn}`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </motion.button>
        </form>

        <motion.p variants={itemVariants} className="text-center text-gray-500 text-sm mt-8">
          Don't have an account? <Link href={getRegisterLink()} className={`font-bold hover:underline ${theme[role].accent}`}>Register as {role}</Link>
        </motion.p>

      </motion.div>
    </div>
  );
}