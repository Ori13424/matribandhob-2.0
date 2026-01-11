"use client";
import { Search, Filter, LayoutList, Map } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface FilterProps {
  search: string;
  setSearch: (val: string) => void;
  riskFilter: string;
  setRiskFilter: (val: string) => void;
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
}

export default function PatientFilters({
  search, setSearch, riskFilter, setRiskFilter, viewMode, setViewMode
}: FilterProps) {
  const { darkMode } = useTheme();

  return (
    <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-4 justify-between items-center
      ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
    >
      
      {/* SEARCH BAR */}
      <div className="relative w-full md:max-w-md">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or ID..." 
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all
            ${darkMode ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"}`}
        />
      </div>

      {/* FILTER & VIEW TOGGLE */}
      <div className="flex gap-3 w-full md:w-auto">
        
        {/* Risk Dropdown */}
        <div className="relative">
          <select 
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className={`appearance-none pl-9 pr-8 py-2.5 rounded-xl border text-sm font-bold focus:outline-none cursor-pointer
              ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <option value="all">All Risks</option>
            <option value="high">High Risk Only</option>
            <option value="sos">SOS Active</option>
            <option value="normal">Normal</option>
          </select>
          <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
        </div>

        {/* View Toggle */}
        <div className={`flex p-1 rounded-xl border ${darkMode ? "bg-slate-900 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' 
              ? (darkMode ? "bg-slate-700 text-white shadow" : "bg-white text-teal-600 shadow") 
              : "text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'map' 
              ? (darkMode ? "bg-slate-700 text-white shadow" : "bg-white text-teal-600 shadow") 
              : "text-slate-400 hover:text-slate-600"}`}
          >
            <Map className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}