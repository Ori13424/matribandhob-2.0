"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthService } from "@/features/auth/logic/authService";
import { User, Activity, Truck, ArrowLeft, Shield, Mail, Lock, Phone } from "lucide-react"; 
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PartnerSignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "driver" ? "driver" : "doctor";
  
  const [role, setRole] = useState<"doctor" | "driver">(initialRole);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: "", 
    email: "", 
    phone: "", 
    license: "", 
    password: "" 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await AuthService.register({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone,
            role: role,
            ...(role === 'doctor' ? { bmdcNumber: formData.license } : { licenseNumber: formData.license })
        });
        role === 'doctor' ? router.push('/doctor/dashboard') : router.push('/driver');
    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // Colors based on role
  const theme = {
    doctor: {
      accent: "text-yellow-400",
      glow: "focus:shadow-[0_0_15px_rgba(250,204,21,0.4)]",
      border: "focus:border-yellow-400",
      btn: "bg-yellow-400 text-black hover:bg-yellow-500 shadow-yellow-400/20"
    },
    driver: {
      accent: "text-blue-500",
      glow: "focus:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
      border: "focus:border-blue-500",
      btn: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30"
    }
  };

  const currentTheme = theme[role];

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col relative overflow-hidden font-sans">
        
        {/* Animated Background Neon */}
        <motion.div 
            animate={{ 
                background: role === 'doctor' 
                    ? 'radial-gradient(circle, rgba(234,179,8,0.15) 0%, rgba(0,0,0,0) 70%)' 
                    : 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)'
            }}
            className="absolute top-[-10%] right-[-20%] w-[800px] h-[800px] rounded-full blur-[100px] transition-all duration-700"
        />

        <div className="p-6 flex items-center justify-between relative z-10">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold">Partner Sign Up</h1>
            <div className="w-6"></div> 
        </div>

        <div className="flex-1 px-6 pb-10 max-w-lg mx-auto w-full relative z-10">
            
            {/* Neon Role Toggle */}
            <div className="bg-[#162032] p-1.5 rounded-xl flex mb-8 border border-gray-800 gap-2">
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole("doctor")}
                    className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all duration-300 ${
                        role === 'doctor' 
                        ? 'bg-yellow-400 text-black font-bold shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    <Activity className="w-5 h-5" /> <span className="text-xs">I am a Doctor</span>
                </motion.button>
                
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole("driver")}
                    className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all duration-300 ${
                        role === 'driver' 
                        ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    <Truck className="w-5 h-5" /> <span className="text-xs">I am a Driver</span>
                </motion.button>
            </div>

            {/* Form with Pop-up Stagger */}
            <AnimatePresence mode="wait">
                <motion.form 
                    key={role}
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                >
                    {[
                        { label: "Full Name", icon: User, type: "text", key: "fullName", ph: "e.g., Dr. Ayesha" },
                        { label: "Email Address", icon: Mail, type: "email", key: "email", ph: "doctor@hospital.com" },
                        { label: "Phone Number", icon: Phone, type: "tel", key: "phone", ph: "017..." },
                        { label: role === 'doctor' ? "BMDC Number" : "License Number", icon: Shield, type: "text", key: "license", ph: "Registration ID" },
                    ].map((field, i) => (
                        <motion.div 
                            key={field.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="space-y-1 group"
                        >
                            <label className={`text-sm font-semibold transition-colors group-hover:${role === 'doctor' ? 'text-yellow-200' : 'text-blue-200'}`}>
                                {field.label}
                            </label>
                            <div className="bg-[#162032] border border-gray-700 rounded-lg flex items-center px-4 py-3 group-hover:border-gray-500 transition-colors">
                                <field.icon className={`w-5 h-5 mr-3 transition-colors ${role === 'doctor' ? 'text-yellow-500/70 group-hover:text-yellow-400' : 'text-blue-500/70 group-hover:text-blue-400'}`} />
                                <input 
                                    type={field.type} 
                                    placeholder={field.ph}
                                    className={`bg-transparent w-full focus:outline-none text-white placeholder:text-gray-600`}
                                    onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                                />
                            </div>
                        </motion.div>
                    ))}
                    
                    <motion.div 
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.4 }}
                         className="space-y-1 group"
                    >
                         <label className="text-sm font-semibold">Password</label>
                         <div className="bg-[#162032] border border-gray-700 rounded-lg flex items-center px-4 py-3 group-hover:border-gray-500 transition-colors">
                            <Lock className={`w-5 h-5 mr-3 transition-colors ${role === 'doctor' ? 'text-yellow-500/70 group-hover:text-yellow-400' : 'text-blue-500/70 group-hover:text-blue-400'}`} />
                            <input 
                                type="password" 
                                placeholder="Create a secure password"
                                className="bg-transparent w-full focus:outline-none text-white placeholder:text-gray-600"
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </motion.div>

                    <motion.button 
                        whileHover={{ scale: 1.02, boxShadow: role === 'doctor' ? "0 0 20px rgba(250,204,21,0.5)" : "0 0 20px rgba(37,99,235,0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading} 
                        className={`w-full py-4 rounded-xl font-bold transition-all mt-6 shadow-lg ${currentTheme.btn}`}
                    >
                        {loading ? "Registering..." : "Register Now"}
                    </motion.button>
                </motion.form>
            </AnimatePresence>

            <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-center text-gray-500 text-sm mt-8 pb-8"
            >
                Already have an account? <Link href="/login" className={`font-bold hover:underline ${currentTheme.accent}`}>Log In</Link>
            </motion.p>
        </div>
    </div>
  );
}