"use client";
import { motion } from "framer-motion";
import { Ruler, Weight } from "lucide-react";

// --- TYPES ---
interface WeekData {
  fruit: string;
  color: string;
  icon: string; // Currently using Emojis. You can change this to 'imageSrc' for real PNGs.
  weight: string;
  height: string;
  fact: string;
}

// --- ACCURATE DATA (Weeks 1-42) ---
const growthData: Record<number, WeekData> = {
  1: { fruit: "Tiny Seed", color: "from-gray-700 to-gray-900", icon: "🌱", weight: "<1g", height: "Microscopic", fact: "The journey has just begun!" },
  2: { fruit: "Tiny Seed", color: "from-gray-700 to-gray-900", icon: "🌱", weight: "<1g", height: "Microscopic", fact: "Fertilization is happening." },
  3: { fruit: "Poppy Seed", color: "from-slate-400 to-slate-600", icon: "⚫", weight: "<1g", height: "0.1mm", fact: "The blastocyst is implanting." },
  4: { fruit: "Poppy Seed", color: "from-slate-400 to-slate-600", icon: "⚫", weight: "<1g", height: "1mm", fact: "The neural tube is closing." },
  5: { fruit: "Sesame Seed", color: "from-yellow-200 to-amber-300", icon: "🌾", weight: "<1g", height: "2mm", fact: " The heart starts beating." },
  6: { fruit: "Lentil", color: "from-orange-800 to-orange-950", icon: "🟤", weight: "<1g", height: "5mm", fact: "Nose, mouth, and ears start to take shape." },
  7: { fruit: "Blueberry", color: "from-blue-600 to-indigo-800", icon: "🫐", weight: "<1g", height: "1.3cm", fact: "Hands and feet are emerging." },
  8: { fruit: "Raspberry", color: "from-pink-500 to-rose-600", icon: "🍇", weight: "1g", height: "1.6cm", fact: "Taste buds are forming." },
  9: { fruit: "Cherry", color: "from-red-600 to-red-900", icon: "🍒", weight: "2g", height: "2.3cm", fact: "Baby moves, but you can't feel it yet." },
  10: { fruit: "Strawberry", color: "from-red-400 to-red-600", icon: "🍓", weight: "4g", height: "3.1cm", fact: "Vital organs are functioning." },
  11: { fruit: "Lime", color: "from-green-400 to-green-600", icon: "🍋‍🟩", weight: "7g", height: "4.1cm", fact: "Baby is kicking and stretching." },
  12: { fruit: "Plum", color: "from-purple-500 to-indigo-600", icon: "🟣", weight: "14g", height: "5.4cm", fact: "Reflexes are developing." },
  13: { fruit: "Lemon", color: "from-yellow-300 to-yellow-500", icon: "🍋", weight: "23g", height: "7.4cm", fact: "Fingerprints have formed." },
  14: { fruit: "Orange", color: "from-orange-400 to-orange-600", icon: "🍊", weight: "43g", height: "8.7cm", fact: "Baby can make facial expressions." },
  15: { fruit: "Apple", color: "from-red-500 to-rose-600", icon: "🍎", weight: "70g", height: "10.1cm", fact: "Baby can sense light." },
  16: { fruit: "Avocado", color: "from-green-500 to-emerald-700", icon: "🥑", weight: "100g", height: "11.6cm", fact: "Baby can suck their thumb." },
  17: { fruit: "Turnip", color: "from-purple-300 to-fuchsia-500", icon: "🥔", weight: "140g", height: "13cm", fact: "Skeleton is hardening from cartilage." },
  18: { fruit: "Bell Pepper", color: "from-yellow-400 to-red-500", icon: "🫑", weight: "190g", height: "14.2cm", fact: "Ears are in their final position." },
  19: { fruit: "Mango", color: "from-yellow-400 to-orange-500", icon: "🥭", weight: "240g", height: "15.3cm", fact: "Senses (smell, taste, hearing) developing." },
  20: { fruit: "Banana", color: "from-yellow-300 to-yellow-500", icon: "🍌", weight: "300g", height: "16.4cm", fact: "Halfway there! Baby can swallow." },
  21: { fruit: "Carrot", color: "from-orange-400 to-orange-600", icon: "🥕", weight: "360g", height: "26.7cm", fact: "Digestion system is practicing." },
  22: { fruit: "Coconut", color: "from-stone-500 to-stone-700", icon: "🥥", weight: "430g", height: "27.8cm", fact: "Lips and eyebrows are distinct." },
  23: { fruit: "Grapefruit", color: "from-red-300 to-orange-400", icon: "🍊", weight: "500g", height: "28.9cm", fact: "Hearing your heartbeat and voice." },
  24: { fruit: "Corn", color: "from-yellow-300 to-yellow-600", icon: "🌽", weight: "600g", height: "30cm", fact: "Lungs are developing branches." },
  25: { fruit: "Rutabaga", color: "from-amber-700 to-purple-800", icon: "🍠", weight: "660g", height: "34.6cm", fact: "Hair color and texture forming." },
  26: { fruit: "Scallion", color: "from-green-400 to-green-700", icon: "🥬", weight: "760g", height: "35.6cm", fact: "Baby opens eyes for the first time." },
  27: { fruit: "Cauliflower", color: "from-stone-100 to-stone-300", icon: "🥦", weight: "875g", height: "36.6cm", fact: "Sleep and wake cycles are regular." },
  28: { fruit: "Eggplant", color: "from-purple-700 to-slate-900", icon: "🍆", weight: "1kg", height: "37.6cm", fact: "Eyes can blink now." },
  29: { fruit: "Butternut Squash", color: "from-orange-200 to-orange-400", icon: "🥜", weight: "1.2kg", height: "38.6cm", fact: "Brain is regulating body temp." },
  30: { fruit: "Cabbage", color: "from-green-300 to-green-500", icon: "🥬", weight: "1.3kg", height: "39.9cm", fact: "Skin is smoothing out." },
  31: { fruit: "Coconut", color: "from-stone-500 to-stone-700", icon: "🥥", weight: "1.5kg", height: "41.1cm", fact: "All 5 senses are working." },
  32: { fruit: "Napa Cabbage", color: "from-green-400 to-teal-600", icon: "🥬", weight: "1.7kg", height: "42.4cm", fact: "Practicing breathing movements." },
  33: { fruit: "Pineapple", color: "from-yellow-500 to-orange-600", icon: "🍍", weight: "1.9kg", height: "43.7cm", fact: "Immune system is developing." },
  34: { fruit: "Cantaloupe", color: "from-orange-200 to-orange-400", icon: "🍈", weight: "2.1kg", height: "45cm", fact: "Central nervous system maturing." },
  35: { fruit: "Honeydew", color: "from-green-200 to-green-400", icon: "🍈", weight: "2.4kg", height: "46.2cm", fact: "Kidneys are fully developed." },
  36: { fruit: "Papaya", color: "from-orange-400 to-amber-600", icon: "🥭", weight: "2.6kg", height: "47.4cm", fact: "Lungs are nearly mature." },
  37: { fruit: "Winter Melon", color: "from-green-600 to-emerald-800", icon: "🍉", weight: "2.9kg", height: "48.6cm", fact: "Baby is considered early term." },
  38: { fruit: "Pumpkin", color: "from-orange-500 to-orange-700", icon: "🎃", weight: "3kg", height: "49.8cm", fact: "Grip is strong." },
  39: { fruit: "Watermelon", color: "from-green-500 to-red-500", icon: "🍉", weight: "3.3kg", height: "50.7cm", fact: "Physical development is complete." },
  40: { fruit: "Watermelon", color: "from-green-500 to-red-500", icon: "🍉", weight: "3.5kg", height: "51.2cm", fact: "Happy Due Date!" },
  41: { fruit: "Jackfruit", color: "from-yellow-600 to-green-700", icon: "🍈", weight: "3.7kg", height: "51.7cm", fact: "Overdue but still growing." },
  42: { fruit: "Jackfruit", color: "from-yellow-600 to-green-700", icon: "🍈", weight: "4kg", height: "52cm", fact: "Baby will be here any moment." }
};

interface BabyGrowthProps {
  currentWeek: number;
  darkMode: boolean;
}

export default function BabyGrowthWidget({ currentWeek, darkMode }: BabyGrowthProps) {
  // Clamp week between 1 and 42 to prevent crash
  const safeWeek = Math.max(1, Math.min(currentWeek, 42));
  const data = growthData[safeWeek];
  const progress = Math.min((safeWeek / 40) * 100, 100);

  return (
    <div className={`col-span-1 md:col-span-8 w-full h-64 md:h-72 rounded-[2rem] border relative overflow-hidden group shadow-xl transition-all duration-500
      ${darkMode 
        ? "bg-gradient-to-br from-[#1f121b] to-[#120a10] border-white/5 hover:border-white/10" 
        : "bg-white/80 border-pink-100 shadow-rose-100/50 backdrop-blur-md"}`}
    >
      {/* Background Texture */}
      <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay`} />
      
      {/* Dynamic Gradient Glow based on Fruit Color */}
      <div className={`absolute -right-10 -top-10 w-64 h-64 rounded-full bg-gradient-to-br ${data.color} opacity-20 blur-[80px] pointer-events-none`} />

      <div className="relative z-10 h-full flex flex-row items-center justify-between p-6 md:p-10">
        
        {/* LEFT: Text Info */}
        <div className="flex flex-col justify-center h-full max-w-[60%]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border
              ${darkMode 
                ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                : "bg-pink-50 border-pink-100 text-pink-600"}`}
            >
              Week {safeWeek} Growth
            </span>
            <h2 className={`text-2xl md:text-4xl font-black mb-1 leading-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
              Size of a <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{data.fruit}</span>
            </h2>
            <p className={`text-xs md:text-sm font-medium mt-1 line-clamp-2 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
              {data.fact}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="flex gap-3 md:gap-4 mt-1">
            <div className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-2xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-50 shadow-sm"}`}>
              <Weight className={`w-4 h-4 ${darkMode ? "text-purple-400" : "text-purple-500"}`} />
              <div>
                <p className={`text-[9px] uppercase font-bold ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Weight</p>
                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-700"}`}>{data.weight}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-2xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-50 shadow-sm"}`}>
              <Ruler className={`w-4 h-4 ${darkMode ? "text-blue-400" : "text-blue-500"}`} />
              <div>
                <p className={`text-[9px] uppercase font-bold ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Height</p>
                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-700"}`}>{data.height}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Animated Visual */}
        <div className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48">
          
          {/* Circular Progress Track */}
          <svg className="absolute w-full h-full -rotate-90">
            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className={`${darkMode ? "text-white/5" : "text-slate-200"}`} />
            <motion.circle 
              cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round"
              className={`${darkMode ? "text-pink-500" : "text-pink-500"}`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>

          {/* Floating Object (Emoji or Image) */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl md:text-8xl drop-shadow-2xl filter flex items-center justify-center"
          >
            {/* NOTE: To use real images, replace {data.icon} with: 
                <img src={`/images/weeks/week-${safeWeek}.png`} alt={data.fruit} className="w-24 h-24 object-contain" />
            */}
            {data.icon}
          </motion.div>

          {/* Glowing Aura */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={`absolute inset-0 rounded-full blur-3xl -z-10 bg-gradient-to-tr ${data.color}`}
          />
        </div>

      </div>
    </div>
  );
}