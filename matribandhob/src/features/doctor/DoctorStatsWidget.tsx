"use client";
import { Users, Activity, AlertCircle, Stethoscope } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// --- FIX: Define the props interface so TypeScript knows what 'liveStats' is ---
interface DoctorStatsProps {
  patients: any[];
  liveStats?: {
    activeMothers: number;
    onlineDoctors: number;
  };
}

export default function DoctorStatsWidget({ patients, liveStats }: DoctorStatsProps) {
  const { darkMode } = useTheme();

  // 1. Stats from Patient List
  const totalMothers = patients.length;
  const highRiskCount = patients.filter(p => p.status === "High BP" || p.status === "High Risk").length;
  const sosCount = patients.filter(p => p.status === "SOS ALERT").length;
  
  // 2. Real-Time Stats (Defaults to 0 if missing)
  const activeMothers = liveStats?.activeMothers || 0;
  const onlineDoctors = liveStats?.onlineDoctors || 0;

  const stats = [
    { 
      label: "Total Mothers", 
      value: totalMothers, 
      icon: Users, 
      color: "blue" 
    },
    { 
      label: "Critical / SOS", 
      value: sosCount + highRiskCount, 
      icon: AlertCircle, 
      color: sosCount > 0 ? "red" : "orange",
      animate: sosCount > 0 
    },
    { 
      label: "Active Today", 
      value: activeMothers, 
      icon: Activity, 
      color: "teal" 
    },
    { 
      label: "Doctors Online", 
      value: onlineDoctors, 
      icon: Stethoscope, 
      color: "purple" 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className={`p-5 rounded-3xl border shadow-sm flex items-center gap-4 transition-all hover:scale-[1.02]
          ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-slate-100"}`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
            ${stat.color === 'blue' ? "bg-blue-50 text-blue-600" : 
              stat.color === 'red' ? "bg-red-50 text-red-600" :
              stat.color === 'orange' ? "bg-orange-50 text-orange-600" :
              stat.color === 'teal' ? "bg-teal-50 text-teal-600" :
              "bg-purple-50 text-purple-600"
            } ${stat.animate ? "animate-pulse" : ""}`}
          >
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {stat.label}
            </p>
            <h3 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-800"}`}>
              {stat.value}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}