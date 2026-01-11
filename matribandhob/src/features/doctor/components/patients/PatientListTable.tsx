"use client";
import { useRouter } from "next/navigation";
import { 
  MoreHorizontal, MessageSquare, MapPin, 
  AlertCircle, ChevronRight, Clock 
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface TableProps {
  patients: any[];
  onLocate: (patient: any) => void;
  onChat: (patient: any) => void;
}

export default function PatientListTable({ patients, onLocate, onChat }: TableProps) {
  const router = useRouter();
  const { darkMode } = useTheme();

  if (patients.length === 0) {
    return (
      <div className={`p-12 text-center rounded-2xl border border-dashed ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
        <p>No patients found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          
          {/* HEADER */}
          <thead className={`font-bold uppercase text-xs tracking-wider ${darkMode ? "bg-slate-900/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-6 py-4">Patient Identity</th>
              <th className="px-6 py-4">Pregnancy Stage</th>
              <th className="px-6 py-4">Status & Risk</th>
              <th className="px-6 py-4 text-center">Location</th>
              <th className="px-6 py-4">Last Active</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-100"}`}>
            {patients.map((patient) => {
              
              // Determine Location Pin Status
              const isSOS = patient.status === "SOS ALERT";
              const isOnline = patient.isOnline; // We will assume this field exists
              
              return (
                <tr key={patient.id} className={`transition-colors group ${darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50/50"}`}>
                  
                  {/* IDENTITY */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${darkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                        {patient.name[0]}
                      </div>
                      <div>
                        <p className={`font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{patient.name}</p>
                        <p className="text-xs text-slate-400">ID: {patient.id.slice(0, 6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>

                  {/* STAGE */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                      Week {patient.week}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">EDD: {patient.edd}</p>
                  </td>

                  {/* RISK STATUS */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                      ${patient.statusColor === 'red' 
                        ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" 
                        : (patient.statusColor === 'yellow' 
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                            : "bg-green-500/10 text-green-500 border-green-500/20")}`}>
                      {patient.statusColor === 'red' && <AlertCircle className="w-3 h-3" />}
                      {patient.status}
                    </span>
                  </td>

                  {/* LIVE LOCATION PIN */}
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onLocate(patient)}
                      disabled={!isOnline && !isSOS}
                      title={isSOS ? "SOS Active: Track Now" : (isOnline ? "Online: View Location" : "Offline")}
                      className={`p-2 rounded-full transition-all mx-auto
                        ${isSOS 
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-bounce" 
                          : (isOnline 
                              ? "bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer" 
                              : "bg-slate-100 text-slate-300 cursor-not-allowed")}`}
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                    {isSOS && <p className="text-[10px] text-red-500 font-bold mt-1">TRACKING</p>}
                  </td>

                  {/* LAST ACTIVE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {patient.lastActive || "2h ago"}
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onChat(patient)}
                        className={`p-2 rounded-lg border transition-colors ${darkMode ? "border-slate-700 text-slate-400 hover:text-teal-400 hover:bg-slate-700" : "border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50"}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                        className={`p-2 rounded-lg border transition-colors ${darkMode ? "border-slate-700 text-slate-400 hover:text-blue-400 hover:bg-slate-700" : "border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50"}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}