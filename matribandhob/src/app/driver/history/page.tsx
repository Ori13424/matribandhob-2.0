"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Calendar, MapPin, DollarSign, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext"; // Import Theme Context

export default function TripHistoryPage() {
  const { darkMode } = useTheme(); // Get dark mode state
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      
      try {
        const q = query(
            collection(db, "ride_requests"),
            where("driverId", "==", auth.currentUser.uid),
            where("status", "in", ["completed", "cancelled"]),
            orderBy("createdAt", "desc")
        );
        
        const snap = await getDocs(q);
        setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("History fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  // --- STYLES HELPER ---
  const textMain = darkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";
  const cardClass = darkMode 
    ? "bg-slate-900 border-slate-800 hover:shadow-slate-900/50" 
    : "bg-white border-slate-100 hover:shadow-md";
  const innerBg = darkMode ? "bg-slate-800" : "bg-slate-50";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
       <div className="flex items-end justify-between">
          <div>
            <h1 className={`text-3xl font-black ${textMain}`}>Trip History</h1>
            <p className={`${textMuted} font-medium`}>Past missions and earnings</p>
          </div>
          <div className="text-right">
             <p className={`text-sm font-bold ${darkMode ? "text-slate-500" : "text-slate-400"}`}>TOTAL EARNED</p>
             <p className="text-2xl font-black text-green-500">৳ {history.reduce((acc, curr) => acc + (curr.fare || 0), 0)}</p>
          </div>
       </div>

       {loading ? (
          <div className={`text-center py-20 ${textMuted}`}>Loading history records...</div>
       ) : (
          <div className="space-y-4">
             {history.length === 0 && (
                 <div className={`p-10 rounded-3xl border border-dashed text-center ${darkMode ? "bg-slate-900 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"}`}>
                     No completed trips found yet.
                 </div>
             )}

             {history.map((ride) => (
                <div key={ride.id} className={`p-6 rounded-3xl shadow-sm border transition-all ${cardClass}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${ride.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${textMain}`}>{ride.patientName || "Unknown Patient"}</h3>
                                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>{ride.status}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className={`text-lg font-black ${textMain}`}>৳ {ride.fare || 0}</p>
                             <p className={`text-xs ${textMuted}`}>{ride.createdAt?.seconds ? new Date(ride.createdAt.seconds * 1000).toLocaleDateString() : 'Date N/A'}</p>
                        </div>
                    </div>
                    
                    <div className={`${innerBg} p-4 rounded-2xl space-y-2`}>
                        <div className="flex items-center gap-3">
                             <div className="w-2 h-2 bg-green-500 rounded-full" />
                             <p className={`text-sm truncate flex-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                {ride.pickupLocationName || "GPS Coordinates"}
                             </p>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="w-2 h-2 bg-red-500 rounded-full" />
                             <p className={`text-sm truncate flex-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                {ride.dropoffLocationName || "Hospital Dropoff"}
                             </p>
                        </div>
                    </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}