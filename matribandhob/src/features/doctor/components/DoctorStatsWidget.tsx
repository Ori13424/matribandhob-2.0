"use client";
import { Users, Activity, AlertCircle, Baby } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function DoctorStatsWidget({ patients }: { patients: any[] }) {
  const { darkMode } = useTheme();

  // --- 1. REAL-TIME CALCULATIONS ---
  const totalMothers = patients.length;
  
  const highRiskCount = patients.filter(p => p.statusColor === "red").length;

  // Calculate "Due This Week" by parsing EDD
  const dueThisWeekCount = patients.filter(p => {
    if (!p.edd || p.edd === "N/A") return false;
    const today = new Date();
    const eddDate = new Date(p.edd); // Ensure EDD is stored as YYYY-MM-DD or standard format
    const diffTime = eddDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  // Calculate "Active Today" (Patients with vitals logged in last 24h)
  const activeTodayCount = patients.filter(p => {
    if (!p.lastVital?.timestamp) return false;
    const vitalTime = new Date(p.lastVital.timestamp.seconds * 1000); // Firebase Timestamp
    const now = new Date();
    const hoursSince = (now.getTime() - vitalTime.getTime()) / (1000 * 60 * 60);
    return hoursSince < 24;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard 
        icon={Users} 
        label="Total Mothers" 
        value={totalMothers} 
        color="bg-blue-500" 
        darkMode={darkMode} 
      />
      <StatCard 
        icon={AlertCircle} 
        label="High Risk / SOS" 
        value={highRiskCount} 
        color="bg-red-500" 
        pulse={highRiskCount > 0} 
        darkMode={darkMode} 
      />
      <StatCard 
        icon={Activity} 
        label="Active Today" 
        value={activeTodayCount} 
        color="bg-teal-500" 
        darkMode={darkMode} 
      />
      <StatCard 
        icon={Baby} 
        label="Due This Week" 
        value={dueThisWeekCount} 
        color="bg-purple-500" 
        darkMode={darkMode} 
      />
    </div>
  );
}

// Sub-component for individual cards
function StatCard({ icon: Icon, label, value, color, pulse, darkMode }: any) {
  return (
    <div className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md 
      ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
      <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
        <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <h3 className={`text-3xl font-black mt-1 ${darkMode ? "text-white" : "text-slate-800"}`}>{value}</h3>
      </div>
    </div>
  );
}