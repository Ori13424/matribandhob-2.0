"use client";
import { useState } from "react";
import { AuthService } from "@/features/auth/logic/authService";
import { User, Lock, Calendar, Phone, ArrowLeft, Mail } from "lucide-react"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MotherSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: "", 
    email: "", 
    phone: "", 
    dueDate: "", 
    password: "", 
    confirmPass: "" 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.password !== formData.confirmPass) {
        alert("Passwords do not match!");
        return;
    }
    
    setLoading(true);
    try {
        await AuthService.register({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone,
            role: "mother",
            dueDate: formData.dueDate
        });
        router.push('/patient/dashboard');
    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // Pop-up Animation Variants
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
    <div className="min-h-screen bg-[#1a0b10] text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Pulse Effect */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px]" 
      />

      {/* Header */}
      <div className="p-6 flex items-center gap-4 relative z-10">
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()} 
          className="p-2 bg-white/5 rounded-full"
        >
            <ArrowLeft className="w-5 h-5 text-pink-500" />
        </motion.button>
        <span className="text-sm font-semibold tracking-widest text-pink-500 uppercase shadow-pink-500 drop-shadow-md">
            Matribandhob AI
        </span>
      </div>

      <div className="flex-1 px-6 pb-10 max-w-lg mx-auto w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-8"
        >
            <h1 className="text-3xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">Mother Sign Up</h1>
            <p className="text-gray-400 text-sm">Create your account to start tracking.</p>
        </motion.div>

        {/* Animated Form Container */}
        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
            {[
                { label: "Full Name", icon: User, type: "text", key: "fullName", ph: "Enter full name" },
                { label: "Email Address", icon: Mail, type: "email", key: "email", ph: "name@example.com" },
                { label: "Phone Number", icon: Phone, type: "tel", key: "phone", ph: "017..." },
                { label: "Estimated Due Date", icon: Calendar, type: "date", key: "dueDate", ph: "" },
                { label: "Password", icon: Lock, type: "password", key: "password", ph: "••••••" },
                { label: "Confirm Password", icon: Lock, type: "password", key: "confirmPass", ph: "••••••" },
            ].map((field) => (
                <motion.div variants={itemVariants} key={field.key} className="space-y-1 group">
                    <label className="text-xs font-bold text-pink-400 ml-1 uppercase transition-colors group-hover:text-pink-300">
                        {field.label}
                    </label>
                    <div className="relative">
                        <field.icon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-hover:text-pink-500 transition-colors" />
                        <input 
                            type={field.type} 
                            placeholder={field.ph}
                            className="w-full bg-[#2a151b] border border-pink-500/20 rounded-xl py-3 pl-12 pr-4 text-white 
                                     focus:outline-none focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] 
                                     transition-all duration-300 placeholder:text-gray-600 [color-scheme:dark]"
                            onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                        />
                    </div>
                </motion.div>
            ))}

            <motion.button 
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(236, 72, 153, 0.6)" }}
                whileTap={{ scale: 0.98 }}
                disabled={loading} 
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold shadow-lg mt-6"
            >
                {loading ? "Creating..." : "Create Account →"}
            </motion.button>
        </motion.form>

        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.8 }} 
          className="text-center text-gray-500 text-sm mt-8 pb-8"
        >
            Already have an account? <Link href="/login" className="text-pink-500 font-bold hover:text-pink-400 hover:underline">Log In</Link>
        </motion.p>
      </div>
    </div>
  );
}