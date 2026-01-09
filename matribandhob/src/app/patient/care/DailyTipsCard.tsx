"use client";
import { useState, useEffect } from "react";
import { 
  Lightbulb, AlertCircle, Info, Moon, 
  CheckCircle, GlassWater, Apple, ShieldAlert 
} from "lucide-react";

// --- TIPS DATABASE (Bangladeshi Context) ---
const healthTips = [
  {
    category: "Nutrition",
    title: "Iron Boost",
    content: "Eat 'Kochu Shak' (Taro leaves) and Liver to prevent anemia. They are rich natural sources of iron!",
    color: "green",
    icon: Apple
  },
  {
    category: "Warning Sign",
    title: "Watch for Swelling",
    content: "If you notice sudden swelling in your face or hands, visit the clinic immediately. It could be Pre-eclampsia.",
    color: "red",
    icon: AlertCircle
  },
  {
    category: "Bone Health",
    title: "Calcium Source",
    content: "Include small fish (like Mola/Dhela) with bones in your diet. They are the best local source of calcium for your baby.",
    color: "blue",
    icon: Info
  },
  {
    category: "Rest",
    title: "Sleep Position",
    content: "Try sleeping on your left side. It improves blood flow to the placenta and helps the baby grow.",
    color: "purple",
    icon: Moon
  },
  {
    category: "Hygiene",
    title: "Infection Control",
    content: "Always wash hands with soap before eating. Prevention is better than cure!",
    color: "orange",
    icon: CheckCircle
  },
  {
    category: "Hydration",
    title: "Stay Hydrated",
    content: "Drink 8-10 glasses of water daily. Coconut water (Daab) is also great for electrolytes.",
    color: "cyan",
    icon: GlassWater
  },
  {
    category: "Emergency",
    title: "Govt. Hotline",
    content: "Save the number 16263. You can call this free government hotline 24/7 for any medical emergency.",
    color: "pink",
    icon: ShieldAlert
  }
];

export default function DailyTipsCard({ darkMode }: { darkMode: boolean }) {
  const [todaysTip, setTodaysTip] = useState(healthTips[0]);

  useEffect(() => {
    // ALGORITHM: Get Day of the Year (1-365)
    // This ensures the tip stays the same for 24 hours for everyone
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Cycle through tips based on the day
    const tipIndex = dayOfYear % healthTips.length;
    setTodaysTip(healthTips[tipIndex]);
  }, []);

  // Dynamic Styles based on category color
  const colors: any = {
    green:  darkMode ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-50 text-green-700 border-green-100",
    red:    darkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-100",
    blue:   darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-100",
    purple: darkMode ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-700 border-purple-100",
    orange: darkMode ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-orange-50 text-orange-700 border-orange-100",
    cyan:   darkMode ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-50 text-cyan-700 border-cyan-100",
    pink:   darkMode ? "bg-pink-500/10 text-pink-400 border-pink-500/20" : "bg-pink-50 text-pink-700 border-pink-100",
  };

  const Icon = todaysTip.icon;

  return (
    <div className="mt-6">
         <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 pl-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>
            Tip of the Day
         </h3>
         <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all hover:scale-[1.01] duration-300
             ${colors[todaysTip.color]}`}>
             
             <div className={`p-3 rounded-xl shrink-0 ${darkMode ? "bg-black/20" : "bg-white/60"}`}>
                 <Icon className="w-6 h-6" />
             </div>
             
             <div>
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm mb-1">{todaysTip.title}</h4>
                    <span className="text-[9px] font-bold uppercase opacity-60 tracking-wider border px-1.5 py-0.5 rounded-md">
                        {todaysTip.category}
                    </span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                    {todaysTip.content}
                </p>
             </div>
         </div>
    </div>
  );
}