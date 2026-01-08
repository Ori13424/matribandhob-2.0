"use client";
import Link from "next/link";
import { ArrowRight, Activity, ShieldCheck, Truck, User } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.2 } // Delay between each item appearing
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <main className="min-h-screen bg-[#020817] text-white selection:bg-blue-500/30 overflow-hidden">
      
      {/* Background Animated Gradient */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] animate-pulse" />
      
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex justify-between items-center px-6 py-5 max-w-7xl mx-auto relative z-10"
      >
        <div className="flex items-center gap-2">
           <motion.div 
             whileHover={{ rotate: 360 }}
             transition={{ duration: 0.8 }}
             className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50"
           >
             <ShieldCheck className="w-5 h-5 text-white" />
           </motion.div>
           <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
             Matribandhob.AI
           </span>
        </div>
        <Link href="/login" className="text-gray-400 hover:text-white font-medium transition-colors">
          Log in
        </Link>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-3xl mx-auto px-6 pt-10 pb-16 text-center relative z-10"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-semibold mb-6">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
           LIVE 24/7 SUPPORT
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Healthcare that <br/>
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Understands You.
          </span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Connect effortlessly with specialists, emergency transport, and personalized maternal care powered by AI.
        </motion.p>

        <motion.button 
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 mx-auto shadow-lg shadow-blue-900/20"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.section>

      {/* Role Selection Grid */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto px-6 pb-24 relative z-10"
      >
        <div className="text-left mb-8">
            <h2 className="text-2xl font-bold">Choose your portal</h2>
            <p className="text-gray-500">Select your role to access tailored services.</p>
        </div>

        <div className="space-y-4">
            
            {/* 1. Mother Card */}
            <RoleCard 
              href="/register/mother"
              title="Mother"
              desc="Instant access to doctors, health tracking, and safe transport."
              icon={<User className="w-5 h-5 text-pink-500" />}
              bgImage="https://images.unsplash.com/photo-1620658421074-e8aa6509f636?q=80&w=1000&auto=format&fit=crop"
              accentColor="pink"
            />

            {/* 2. Doctor Card */}
            <RoleCard 
              href="/register/partner?role=doctor"
              title="Doctor"
              desc="Manage patients with AI triage and optimized scheduling."
              icon={<Activity className="w-5 h-5 text-yellow-500" />}
              bgImage="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1000&auto=format&fit=crop"
              accentColor="yellow"
              reverse
            />

            {/* 3. Driver Card */}
            <RoleCard 
              href="/register/partner?role=driver"
              title="Driver"
              desc="Receive emergency ride requests and optimize your routes."
              icon={<Truck className="w-5 h-5 text-blue-500" />}
              bgImage="https://images.unsplash.com/photo-1599708153386-62e5dc8155d0?q=80&w=1000&auto=format&fit=crop"
              accentColor="blue"
            />
        </div>
      </motion.section>
    </main>
  );
}

// Reusable Animated Card Component
function RoleCard({ href, title, desc, icon, bgImage, accentColor, reverse }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-[#0f172a] rounded-2xl p-1 border border-gray-800 hover:border-gray-600 transition-colors group cursor-pointer"
    >
        <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6`}>
            {/* Image Side */}
            <div className="w-full md:w-1/3 h-48 bg-gray-800 rounded-xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"/>
               <motion.div 
                 className="w-full h-full bg-cover bg-center opacity-80"
                 style={{ backgroundImage: `url('${bgImage}')` }}
                 whileHover={{ scale: 1.1 }}
                 transition={{ duration: 0.5 }}
               />
            </div>
            
            {/* Text Side */}
            <div className="flex-1 p-4 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 bg-${accentColor}-500/10 rounded-lg`}>
                        {icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6 max-w-sm">{desc}</p>
                <Link href={href}>
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="w-full md:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white text-center rounded-lg font-medium border border-gray-700"
                    >
                        Login as {title}
                    </motion.button>
                </Link>
            </div>
        </div>
    </motion.div>
  );
}