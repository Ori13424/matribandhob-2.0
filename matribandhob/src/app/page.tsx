"use client";
import Link from "next/link";
import { ArrowRight, Activity, ShieldCheck, Truck, User, X, CheckCircle, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Footer from "@/components/Footer"; 

// --- CUSTOM TOAST SYSTEM TYPES ---
type ToastType = "success" | "info" | "error";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- HANDLE LOADING STATE ---
  useEffect(() => {
    // Simulate asset loading / intro animation time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2200); 
    return () => clearTimeout(timer);
  }, []);

  // Function to trigger a custom notification
  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80 } }
  };

  return (
    <main className="min-h-screen bg-[#020817] text-white selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* --- INITIAL LOADING SCREEN --- */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-[#020817] flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Pulsating Glow */}
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full"
              />
              
              {/* Logo Icon */}
              <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-2xl font-bold tracking-widest text-white uppercase"
            >
              Matribandhob
            </motion.h1>
            
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
              className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-4"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* 1. Tech Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          {/* 2. Ambient Glow Effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

          {/* --- NOTIFICATION CONTAINER --- */}
          <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
              {toasts.map((toast) => (
                <CustomToast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
              ))}
            </AnimatePresence>
          </div>

          {/* Navbar */}
          <motion.nav 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto relative z-20"
          >
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Matribandhob
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/about" className="hidden md:block text-gray-400 hover:text-white transition-colors text-sm font-medium">About</Link>
              <Link href="/contact" className="hidden md:block text-gray-400 hover:text-white transition-colors text-sm font-medium">Support</Link>
              <Link href="/login" className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium">
                Log in
              </Link>
            </div>
          </motion.nav>

          {/* Hero Section */}
          <motion.section 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center relative z-10"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/40 border border-blue-800/50 text-blue-300 text-xs font-semibold mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              AI-POWERED MATERNAL CARE
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Healthcare that <br/>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Actually Cares.
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform connecting mothers, doctors, and emergency transport. 
              Smart, secure, and always there when you need it.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* FIXED: Default to Mother registration for Get Started */}
              <Link href="/register?role=mother">
                <button 
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40 active:scale-95"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <button 
                onClick={() => showToast("Read more about our mission on the About page!", "info")}
                className="px-8 py-4 bg-gray-900/50 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-medium transition-all backdrop-blur-md active:scale-95"
              >
                Learn More
              </button>
            </motion.div>
          </motion.section>

          {/* Role Selection Grid (Bento Style) */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto px-6 pb-20 relative z-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-800 pb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Select Your Portal</h2>
                  <p className="text-gray-400">Choose the role that describes you best.</p>
                </div>
                <div className="hidden md:block text-sm text-gray-500 font-mono">
                    SECURE ACCESS V2.0
                </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Mother Card -> FIXED LINK */}
                <RoleCard 
                  href="/register?role=mother"
                  title="Mother"
                  subtitle="Patient Care"
                  desc="Track health vitals, consult doctors, and get AI assistance."
                  icon={<User className="w-6 h-6 text-pink-400" />}
                  gradient="from-pink-500/10 to-transparent"
                  borderHover="group-hover:border-pink-500/50"
                  iconBg="bg-pink-500/20"
                  delay={0}
                />

                {/* 2. Doctor Card -> FIXED LINK */}
                <RoleCard 
                  href="/register?role=doctor"
                  title="Doctor"
                  subtitle="Medical Professional"
                  desc="Manage appointments, view patient history, and triage cases."
                  icon={<Activity className="w-6 h-6 text-emerald-400" />}
                  gradient="from-emerald-500/10 to-transparent"
                  borderHover="group-hover:border-emerald-500/50"
                  iconBg="bg-emerald-500/20"
                  delay={0.1}
                />

                {/* 3. Driver Card -> FIXED LINK */}
                <RoleCard 
                  href="/register?role=driver"
                  title="Ambulance"
                  subtitle="Emergency Transport"
                  desc="Receive ride requests with live location tracking."
                  icon={<Truck className="w-6 h-6 text-orange-400" />}
                  gradient="from-orange-500/10 to-transparent"
                  borderHover="group-hover:border-orange-500/50"
                  iconBg="bg-orange-500/20"
                  delay={0.2}
                />
            </div>
          </motion.section>

          {/* Attach Global Footer */}
          <Footer />
        </motion.div>
      )}
    </main>
  );
}

// --- SUB-COMPONENTS ---

function CustomToast({ message, type, onClose }: { message: string, type: ToastType, onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
        error: <Activity className="w-5 h-5 text-red-400" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-[#0f172a]/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl min-w-[300px]"
        >
            {icons[type]}
            <p className="text-sm font-medium text-gray-200 flex-1">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-500" />
            </button>
        </motion.div>
    );
}

function RoleCard({ href, title, subtitle, desc, icon, gradient, borderHover, iconBg, delay }: any) {
  return (
    <Link href={href} className="block h-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.5 }}
          whileHover={{ y: -5 }}
          className={`group relative h-full bg-[#0B1221] border border-gray-800 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 ${borderHover}`}
        >
            {/* Hover Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative p-8 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${iconBg} ring-1 ring-white/10`}>
                        {icon}
                    </div>
                    <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                </div>

                <div className="mt-auto">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{subtitle}</h4>
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        {desc}
                    </p>
                    
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="w-0 h-full bg-white/20 group-hover:w-full transition-all duration-700 ease-out" />
                    </div>
                </div>
            </div>
        </motion.div>
    </Link>
  );
}