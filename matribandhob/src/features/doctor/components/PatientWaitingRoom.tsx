"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Filter, Droplets, AlertCircle, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Sparkline from "@/components/Sparkline";

export default function PatientWaitingRoom({ patients }: { patients: any[] }) {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  // --- FILTERING LOGIC ---
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to extract systolic BP for sparkline
  const getBpTrend = (history: any[]) => {
    if (!history || history.length < 2) return [];
    return history.map(h => {
      if (!h.bp) return 0;
      const sys = parseInt(h.bp.split('/')[0]) || 0;
      return sys;
    }).filter(v => v > 0);
  };

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>

      {/* HEADER & SEARCH */}
      <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-800"}`}>
          <Users className="w-5 h-5 text-teal-500" /> Waiting Room
        </h2>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, ID..."
              className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 
              ${darkMode ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" : "bg-white border-slate-200 text-slate-800"}`}
            />
          </div>
          <button className={`p-2 border rounded-lg ${darkMode ? "border-slate-700 text-slate-400 hover:bg-slate-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className={`font-bold uppercase text-xs tracking-wider ${darkMode ? "bg-slate-900/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-6 py-4">Patient Name</th>
              <th className="px-6 py-4">Pregnancy Stage</th>
              <th className="px-6 py-4">Latest Vitals</th>
              <th className="px-6 py-4">Risk Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-100"}`}>
            {filteredPatients.map((patient) => {
              const bpTrend = getBpTrend(patient.vitalHistory);

              return (
                <tr key={patient.id} className={`transition-colors group ${darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50/50"}`}>

                  {/* NAME & BLOOD */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shrink-0 ${darkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200 text-slate-500"}`}>
                        {patient.name[0]}
                      </div>
                      <div>
                        <p className={`font-bold transition-colors ${darkMode ? "text-slate-200 group-hover:text-teal-400" : "text-slate-800 group-hover:text-teal-700"}`}>{patient.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Droplets className="w-3 h-3" /> Blood: {patient.bloodGroup}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* STAGE & EDD */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 font-bold text-xs border border-blue-500/20">
                        Week {patient.week}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">EDD: {patient.edd}</span>
                    </div>
                  </td>

                  {/* VITALS + SPARKLINE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {patient.lastVital ? (
                        <div className="min-w-[80px]">
                          <p className={`text-xs font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>BP: {patient.lastVital.bp || "--"}</p>
                          <p className="text-xs text-slate-500">Wt: {patient.lastVital.weight || "--"}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No logs yet</span>
                      )}

                      {/* Sparkline */}
                      {bpTrend.length > 1 && (
                        <div className="hidden sm:block">
                          <Sparkline
                            data={bpTrend}
                            width={80}
                            height={30}
                            color={patient.statusColor === 'red' ? "#ef4444" : "#3b82f6"}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* STATUS BADGE */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                    ${patient.statusColor === 'green'
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"}`}>
                      {patient.statusColor === 'red' && <AlertCircle className="w-3 h-3" />}
                      {patient.status}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                      className={`px-3 py-2 border rounded-lg transition-all shadow-sm flex items-center gap-1 ml-auto
                      ${darkMode ? "bg-slate-800 border-slate-600 text-slate-400 hover:text-teal-400 hover:border-teal-500/50" : "bg-white border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200"}`}
                    >
                      View <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className={`p-12 text-center italic ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
            No patients found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}