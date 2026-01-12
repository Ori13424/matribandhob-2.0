"use client";
import { motion } from "framer-motion";
import { Brain, Heart, Map, ArrowRight } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer"; // Import your footer

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white selection:bg-blue-500/30">
      
      {/* Header */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto text-center">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-900/20 border border-blue-800 text-blue-400 text-xs font-semibold"
         >
            OUR MISSION
         </motion.div>
         <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
         >
            Bridging the Gap in <br/>
            <span className="text-blue-500">Maternal Healthcare</span>
         </motion.h1>
         <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            We combine advanced AI diagnostics with real-time logistics to ensure no mother in Bangladesh is left without care during critical moments.
         </p>
      </section>

      {/* Feature Grid */}
      <section className="px-6 pb-24 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
         <FeatureCard 
            icon={<Brain className="w-8 h-8 text-purple-400" />}
            title="AI Triage System"
            desc="Our LLM-powered chatbot analyzes symptoms in Bengali and English to categorize risk levels instantly."
            delay={0.2}
         />
         <FeatureCard 
            icon={<Map className="w-8 h-8 text-blue-400" />}
            title="Geolocation Routing"
            desc="Nearest ambulance dispatch algorithms ensure the fastest possible route to the hospital."
            delay={0.3}
         />
         <FeatureCard 
            icon={<Heart className="w-8 h-8 text-pink-400" />}
            title="Continuous Care"
            desc="Digital health records that follow the patient, giving doctors a complete history upon arrival."
            delay={0.4}
         />
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-950/20 border-y border-blue-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl font-bold mb-6">Ready to join the network?</h2>
            <div className="flex justify-center gap-4">
                <Link href="/get-started">
                    <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all">
                        Get Started
                    </button>
                </Link>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="p-8 bg-[#0B1221] border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-colors"
        >
            <div className="mb-4 bg-gray-900 w-16 h-16 rounded-xl flex items-center justify-center">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
    );
}