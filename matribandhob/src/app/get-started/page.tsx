"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { User, Stethoscope, Ambulance } from "lucide-react";
import Footer from "@/components/Footer";

export default function GetStarted() {
  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <div className="flex-grow flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-5xl">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Let's get you set up.</h1>
            <p className="text-gray-400">Select how you will use Matribandhob.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectionCard 
              href="/register/mother"
              icon={<User className="w-10 h-10 text-pink-400" />}
              title="I am a Mother"
              desc="I need care, health tracking, and emergency support."
              color="pink"
            />
            <SelectionCard 
              href="/register/partner?role=doctor"
              icon={<Stethoscope className="w-10 h-10 text-emerald-400" />}
              title="I am a Doctor"
              desc="I want to provide consultation and view patient records."
              color="emerald"
            />
            <SelectionCard 
              href="/register/partner?role=driver"
              icon={<Ambulance className="w-10 h-10 text-orange-400" />}
              title="I am a Driver"
              desc="I have an ambulance and want to receive ride requests."
              color="orange"
            />
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-500">Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Log in here</Link></p>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}

function SelectionCard({ href, icon, title, desc, color }: any) {
  return (
    <Link href={href} className="block group">
      <motion.div 
        whileHover={{ y: -5 }}
        className={`h-full p-8 bg-gray-900/50 border border-gray-800 rounded-3xl text-center hover:bg-gray-900 transition-all hover:border-${color}-500/50`}
      >
        <div className={`mx-auto w-20 h-20 bg-${color}-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{desc}</p>
      </motion.div>
    </Link>
  );
}