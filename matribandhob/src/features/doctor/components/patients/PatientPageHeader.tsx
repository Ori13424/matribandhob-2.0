"use client";
import { UserPlus, Download, Users, AlertCircle, MapPin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  total: number;
  highRisk: number;
  sosActive: number;
  onAddPatient: () => void;
  onExport: () => void;
}

export default function PatientPageHeader({ 
  total, highRisk, sosActive, onAddPatient, onExport 
}: HeaderProps) {
  const { darkMode } = useTheme();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
      
      {/* TITLE & STATS CHIPS */}
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>My Patients</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5
            ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}>
            <Users className="w-3 h-3" /> Total: {total}
          </div>

          {highRisk > 0 && (
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> High Risk: {highRisk}
            </div>
          )}

          {sosActive > 0 && (
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white border border-red-600 flex items-center gap-1.5 animate-pulse shadow-lg shadow-red-500/30">
              <MapPin className="w-3 h-3" /> SOS Active: {sosActive}
            </div>
          )}

        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 w-full md:w-auto">
        <button 
          onClick={onExport}
          className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2
            ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          <Download className="w-4 h-4" /> Export
        </button>

        <button 
          onClick={onAddPatient}
          className="flex-1 md:flex-none px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Add Patient
        </button>
      </div>

    </div>
  );
}