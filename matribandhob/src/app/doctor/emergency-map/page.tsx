"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  collection, query, where, onSnapshot, orderBy, updateDoc, doc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTheme } from "@/context/ThemeContext";
import { 
  Phone, MapPin, Search, Filter, History, Truck,
  Navigation, Car, Ambulance, BatteryCharging, Clock, XCircle, CheckCircle, Ban,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DispatchModal from "@/features/doctor/components/drivers/DispatchModal";

// --- MAP IMPORT ---
const DriverMap = dynamic(
  () => import("@/features/doctor/components/drivers/DriverMap"), 
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center animate-pulse">Loading Map...</div> }
);

const CATEGORIES = ["All", "Ambulance", "CNG", "EasyBike"];

export default function EmergencyMapPage() {
  const { darkMode } = useTheme();
  
  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<'drivers' | 'history'>('drivers');
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // --- DATA STATES ---
  const [drivers, setDrivers] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH DRIVERS (Real-time) ---
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "driver"));
    const unsub = onSnapshot(q, (snapshot) => {
      const driverData = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.displayName || d.basicInfo?.fullName || "Unknown Driver",
          phone: d.phone || "N/A",
          vehicleType: d.vehicleType || "Unknown",
          plateNumber: d.ambulanceNumber || d.vehicleDetails?.plateNumber || "---",
          isOnline: d.isOnline === true,
          location: d.currentLocation || d.location || null,
          lastActive: d.lastActive
        };
      });
      setDrivers(driverData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- 2. FETCH PATIENTS (For Dispatch Modal) ---
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
        const pData = snapshot.docs.map(doc => {
            const d = doc.data();
            if (d.role === 'doctor' || d.role === 'driver') return null;
            return {
                id: doc.id,
                name: d.basicInfo?.fullName || d.fullName || "Unknown",
                phone: d.phoneNumber || d.basicInfo?.phone || "N/A",
                location: d.location || null,
                address: d.basicInfo?.address || "",
                sosTriggered: d.sosTriggered === true
            };
        }).filter(Boolean);
        setPatients(pData);
    });
    return () => unsub();
  }, []);

  // --- 3. FETCH REQUEST HISTORY ---
  useEffect(() => {
    const q = query(collection(db, "trip_requests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
        setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // --- ACTIONS ---
  const handleCancelRequest = async (requestId: string) => {
    if(!confirm("Are you sure you want to cancel this request?")) return;
    try {
        await updateDoc(doc(db, "trip_requests", requestId), { status: 'cancelled' });
    } catch (e) { console.error(e); }
  };

  const handleOpenDispatch = (driver: any, e: any) => {
    e.stopPropagation();
    setSelectedDriver(driver);
    setIsDispatchOpen(true);
  };

  // --- FILTER LOGIC ---
  const filteredDrivers = drivers.filter((driver) => {
    const matchesCategory = selectedCategory === "All" || driver.vehicleType.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- ICONS ---
  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('ambulance')) return <Ambulance className="w-5 h-5" />;
    if (t.includes('easybike') || t.includes('cng')) return <BatteryCharging className="w-5 h-5" />;
    return <Car className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-200 flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
        case 'accepted': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 flex items-center gap-1"><Truck className="w-3 h-3"/> On Way</span>;
        case 'completed': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Done</span>;
        case 'cancelled': return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 flex items-center gap-1"><Ban className="w-3 h-3"/> Cancelled</span>;
        default: return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className={`h-[calc(100vh-6rem)] flex flex-col md:flex-row overflow-hidden ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}>
      
      {/* --- LEFT SIDEBAR --- */}
      <div className={`w-full md:w-[420px] flex flex-col border-r z-10 shadow-xl ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        
        {/* HEADER & TABS */}
        <div className="p-6 pb-2">
            <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>Transport & Dispatch</h1>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Manage drivers and emergency requests.</p>
            
            {/* Toggles */}
            <div className={`mt-6 p-1 rounded-xl flex ${darkMode ? "bg-slate-900" : "bg-slate-100"}`}>
                <button onClick={() => setActiveTab('drivers')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'drivers' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    Find Drivers
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    Request History
                </button>
            </div>
        </div>

        {/* --- TAB CONTENT: DRIVERS --- */}
        {activeTab === 'drivers' && (
            <>
                {/* Search & Filter */}
                <div className="px-6 pb-2 space-y-4">
                    <div className={`flex items-center px-4 py-2.5 rounded-xl border transition-all ${darkMode ? "bg-slate-900 border-slate-700 focus-within:border-slate-500" : "bg-slate-50 border-slate-200 focus-within:border-teal-500"}`}>
                        <Search className="w-4 h-4 text-slate-400 mr-3" />
                        <input type="text" placeholder="Search driver..." className="bg-transparent border-none outline-none text-sm w-full"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="overflow-x-auto no-scrollbar flex gap-2">
                        {CATEGORIES.map((cat) => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === cat ? "bg-teal-600 text-white border-teal-600" : "bg-transparent text-slate-500 border-slate-200"}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Driver List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 mt-2 custom-scrollbar">
                    {loading ? <div className="p-4 text-center text-slate-400 text-xs">Loading drivers...</div> : 
                     filteredDrivers.length === 0 ? <div className="p-10 text-center text-slate-400 text-sm">No drivers found</div> : 
                     (
                        <AnimatePresence>
                            {filteredDrivers.map((driver) => (
                                <motion.div key={driver.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedDriver(driver)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden
                                    ${selectedDriver?.id === driver.id ? "ring-2 ring-teal-500 border-transparent bg-teal-50/50" : (darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 hover:shadow-md")}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${driver.vehicleType.toLowerCase().includes('ambulance') ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-600"}`}>{getIconForType(driver.vehicleType)}</div>
                                            <div>
                                                <h3 className={`font-bold text-sm ${darkMode?"text-slate-200":"text-slate-800"}`}>{driver.name}</h3>
                                                <p className="text-xs text-slate-500">{driver.vehicleType} • {driver.plateNumber}</p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${driver.isOnline ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${driver.isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                                            {driver.isOnline ? "ONLINE" : "OFFLINE"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed border-slate-200">
                                        <a href={`tel:${driver.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border hover:bg-slate-50 transition-colors"><Phone className="w-3 h-3"/> Call</a>
                                        <button onClick={(e) => handleOpenDispatch(driver, e)} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"><Ambulance className="w-3 h-3"/> Dispatch</button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </>
        )}

        {/* --- TAB CONTENT: HISTORY --- */}
        {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <History className="w-8 h-8 mb-2 opacity-50"/>
                        <p className="text-sm">No request history</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 hover:shadow-sm"}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-400 font-mono">#{req.id.slice(0,6)}</span>
                                {getStatusBadge(req.status)}
                            </div>
                            
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><User className="w-4 h-4"/></div>
                                <div>
                                    <h4 className={`text-sm font-bold ${darkMode?"text-slate-200":"text-slate-800"}`}>{req.patientName}</h4>
                                    <p className="text-xs text-slate-500">Driver: {req.driverName}</p>
                                </div>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-lg mb-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5" />
                                    <p className="text-xs text-slate-600 line-clamp-2">{req.pickupAddress}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400">{req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleTimeString() : "Just now"}</span>
                                {req.status === 'pending' && (
                                    <button onClick={() => handleCancelRequest(req.id)} className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Cancel Request
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

      </div>

      {/* --- RIGHT PANEL: MAP --- */}
      <div className="flex-1 relative bg-slate-200">
         <DriverMap 
            drivers={filteredDrivers} 
            selectedDriver={selectedDriver}
            darkMode={darkMode}
         />
      </div>

      {/* --- DISPATCH MODAL --- */}
      {isDispatchOpen && selectedDriver && (
        <DispatchModal 
            driver={selectedDriver}
            patients={patients}
            onClose={() => setIsDispatchOpen(false)}
        />
      )}

    </div>
  );
}