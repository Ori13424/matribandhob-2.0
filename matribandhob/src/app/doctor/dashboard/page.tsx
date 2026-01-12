"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion"; 
import { 
  collection, query, orderBy, limit, onSnapshot, getDocs, where, updateDoc, doc, 
  collectionGroup, getDoc, addDoc, deleteDoc, serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";
import dynamic from "next/dynamic"; 
import { Users, Truck, Map, X, Bell, AlertTriangle } from "lucide-react"; 

// Components
import DoctorDashboardLoader from "@/features/doctor/components/DoctorDashboardLoader";
// --- 1. IMPORT THE TYPE HERE ---
import DoctorStatsWidget, { LiveStatsData } from "@/features/doctor/DoctorStatsWidget"; 
import PatientWaitingRoom from "@/features/doctor/components/PatientWaitingRoom";
import AddPatientModal from "@/features/doctor/components/patients/AddPatientModal";

const PatientMap = dynamic(
  () => import("@/features/doctor/components/patients/PatientMap"), 
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">Loading...</div> }
);

// Helper to normalize array
const normalizeList = (input: any) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return input.split(',');
    return [String(input)];
};

export default function DoctorDashboard() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  // Data States
  const [loading, setLoading] = useState(true); 
  const [patients, setPatients] = useState<any[]>([]);
  // --- 2. USE THE IMPORTED TYPE HERE ---
  const [liveStats, setLiveStats] = useState<LiveStatsData>({ activeMothers: 0, onlineDoctors: 0 }); 
  
  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Sound Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevAlertCount = useRef(0);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false); 

  // --- 0. INITIALIZE SOUND ---
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  // --- 1. GLOBAL MONITOR: DETECT CRITICAL SYMPTOMS (Bleeding/Fever) ---
  useEffect(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const qGlobalLogs = query(
        collectionGroup(db, 'dailyLogs'),
        where('lastUpdated', '>=', oneDayAgo)
    );

    const unsubGlobal = onSnapshot(qGlobalLogs, async (snapshot) => {
        for (const change of snapshot.docChanges()) {
            if (change.type === 'added' || change.type === 'modified') {
                const logData = change.doc.data();
                const logId = change.doc.id;
                const patientId = change.doc.ref.parent.parent?.id;

                if (!patientId || !auth.currentUser) continue;

                const symptoms = normalizeList(logData.symptoms).map(s => String(s).toLowerCase());
                const criticalSymptoms = symptoms.filter(s => s.includes('bleeding') || s.includes('fever'));
                const hasCriticalCondition = criticalSymptoms.length > 0;

                const notifQuery = query(collection(db, "notifications"), where("relatedLogId", "==", logId));
                const notifSnap = await getDocs(notifQuery);

                if (hasCriticalCondition) {
                    if (notifSnap.empty) {
                        const pDoc = await getDoc(doc(db, "users", patientId));
                        const pData = pDoc.exists() ? pDoc.data() : {};
                        const pName = pData.basicInfo?.fullName || pData.fullName || "Patient";

                        await addDoc(collection(db, "notifications"), {
                            recipientId: auth.currentUser.uid,
                            patientId: patientId,
                            patientName: pName,
                            title: "Critical Symptom Alert",
                            message: `Patient reported critical symptoms: ${criticalSymptoms.join(", ")}`,
                            type: "critical",
                            isRead: false,
                            timestamp: serverTimestamp(),
                            relatedLogId: logId,
                            link: `/doctor/patients/${patientId}`
                        });
                    }
                } else {
                    if (!notifSnap.empty) {
                        notifSnap.forEach(async (d) => await deleteDoc(d.ref));
                    }
                }
            }
        }
    });

    return () => unsubGlobal();
  }, []);

  // --- 2. FETCH PATIENTS & LIVE STATS ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(collection(db, "users"));
        
        const unsubSnapshot = onSnapshot(q, async (snapshot) => {
            let onlineDocs = 0;
            let activeMoms = 0;
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const patientData = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                
                // --- EXCLUSION LOGIC START ---
                if (data.role === 'doctor') {
                    if (data.isOnline === true) onlineDocs++;
                    return null;
                }
                if (data.role === 'driver') {
                    return null;
                }
                // --- EXCLUSION LOGIC END ---

                if (data.lastActive?.toDate() > oneDayAgo) {
                    activeMoms++;
                }

                const healthQ = query(collection(db, "users", doc.id, "health_logs"), orderBy("timestamp", "desc"), limit(1));
                const healthSnap = await getDocs(healthQ);
                const lastVital = healthSnap.empty ? null : healthSnap.docs[0].data();

                let status = "Normal";
                let statusColor = "green";
                let sosTriggered = data.sosTriggered === true; 
                
                if (lastVital?.bp) {
                    const [sys, dia] = lastVital.bp.split('/').map(Number);
                    if (sys >= 140 || dia >= 90) { status = "High BP"; statusColor = "red"; }
                }
                if (sosTriggered) { status = "SOS ALERT"; statusColor = "red"; }

                return {
                    id: doc.id,
                    name: data.basicInfo?.fullName || data.fullName || "Unknown",
                    week: data.pregnancyDetails?.currentWeek || 0,
                    edd: data.pregnancyDetails?.edd || "N/A",
                    bloodGroup: data.basicInfo?.bloodGroup || "--",
                    location: data.location || null, 
                    sosTriggered: sosTriggered,      
                    lastVital, status, statusColor,
                    phone: data.basicInfo?.phone || "N/A"
                };
            }));
            
            setPatients(patientData.filter(p => p !== null));
            setLiveStats({ activeMothers: activeMoms, onlineDoctors: onlineDocs });

            setTimeout(() => { setLoading(false); }, 2500);
        });
        return () => unsubSnapshot();
      } else { router.push("/login"); }
    });
    return () => unsubAuth();
  }, [router]);

  // --- 3. FETCH NOTIFICATIONS ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(20)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => unsub();
    });
    return () => unsubAuth();
  }, []);

  // --- 4. SOUND EFFECT LOGIC ---
  useEffect(() => {
    const sosCount = patients.filter(p => p.status === 'SOS ALERT').length;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const currentTotal = sosCount + unreadCount;

    if (currentTotal > prevAlertCount.current) {
        audioRef.current?.play().catch(e => console.log("Audio interaction needed:", e));
    }
    prevAlertCount.current = currentTotal;
  }, [patients, notifications]);

  // --- HANDLERS ---
  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
      }
      setShowNotifDropdown(false);
      if (notif.link) router.push(notif.link);
    } catch (e) {
      console.error("Error updating notification", e);
    }
  };

  const sosCount = patients.filter(p => p.status === 'SOS ALERT').length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalAlerts = sosCount + unreadCount;

  return (
    <>
      <AnimatePresence>
        {loading && (
            <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[200] bg-white">
                <DoctorDashboardLoader />
            </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
          
          {/* HEADER */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-2">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                    <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Dashboard</h1>
                    
                    {/* NOTIFICATION BELL */}
                    <div className="relative z-50">
                        <div 
                           onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                           className={`relative p-2 rounded-full cursor-pointer transition-colors ${totalAlerts > 0 ? "bg-red-100 text-red-600 animate-pulse" : (darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500")}`}
                        >
                            <Bell className="w-5 h-5" />
                            {totalAlerts > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                                    {totalAlerts}
                                </span>
                            )}
                        </div>

                        {/* Dropdown */}
                        <AnimatePresence>
                            {showNotifDropdown && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className={`absolute left-0 mt-3 w-80 md:w-96 rounded-2xl shadow-2xl border overflow-hidden origin-top-left z-[60] ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
                                >
                                    <div className={`p-4 border-b flex justify-between items-center ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                                        <h3 className="font-bold text-sm">Notifications</h3>
                                        <button onClick={() => setShowNotifDropdown(false)}><X className="w-4 h-4 opacity-50"/></button>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        
                                        {/* SOS ALERTS */}
                                        {patients.filter(p => p.status === 'SOS ALERT').map(p => (
                                            <div key={p.id} onClick={() => router.push(`/doctor/patients/${p.id}`)} className="p-4 border-b border-red-100 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors group">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 p-1.5 bg-red-500 text-white rounded-full h-fit animate-pulse"><Bell className="w-3 h-3" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-red-700">SOS TRIGGERED</p>
                                                        <p className="text-xs text-red-600 mb-1">{p.name} has triggered an emergency SOS.</p>
                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-white/50 rounded text-red-800 border border-red-200">Immediate Action Required</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* SYMPTOM ALERTS */}
                                        {notifications.length > 0 ? (
                                            notifications.map((notif) => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`p-4 border-b cursor-pointer transition-colors flex gap-3 ${!notif.isRead ? (darkMode ? "bg-slate-800 border-slate-700" : "bg-blue-50/50 border-slate-100") : (darkMode ? "hover:bg-slate-800 border-slate-800" : "hover:bg-slate-50 border-slate-100")}`}
                                                >
                                                    <div className={`mt-1 p-1.5 rounded-full h-fit ${notif.type === 'critical' ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"}`}>
                                                        {notif.type === 'critical' ? <AlertTriangle className="w-3 h-3" /> : <Users className="w-3 h-3"/>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start w-full">
                                                            <p className={`text-sm font-bold ${!notif.isRead ? (darkMode?"text-white":"text-slate-900") : "opacity-70"}`}>{notif.title}</p>
                                                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></span>}
                                                        </div>
                                                        <p className="text-xs opacity-70 mb-1 line-clamp-2">{notif.message}</p>
                                                        <p className="text-[10px] opacity-40">{notif.timestamp?.toDate ? new Date(notif.timestamp.toDate()).toLocaleString() : "Just now"}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            sosCount === 0 && <div className="p-8 text-center opacity-50 text-xs">No new notifications</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Overview of active patients and emergency requests.</p>
            </div>
            
            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <button onClick={() => setIsMapOpen(true)} className="flex-1 lg:flex-none px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <Map className="w-4 h-4" /> Live Map
                </button>
                <button onClick={() => router.push('/doctor/emergency-map')} className="flex-1 lg:flex-none px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <Truck className="w-4 h-4" /> Drivers
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="flex-1 lg:flex-none px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <Users className="w-4 h-4" /> Add Patient
                </button>
            </div>
          </div>

          <DoctorStatsWidget patients={patients} liveStats={liveStats} />
          <PatientWaitingRoom patients={patients} />

        </div>
      )}

      {/* MODALS */}
      {isAddModalOpen && <AddPatientModal onClose={() => setIsAddModalOpen(false)} />}
      
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
             <div className="flex justify-between items-center px-6 py-4 border-b bg-white z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full"><Map className="w-5 h-5" /></div>
                   <div><h3 className="font-bold text-lg text-slate-800">Live Patient Cluster</h3><p className="text-xs text-slate-500">Real-time GPS tracking network</p></div>
                </div>
                <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6" /></button>
             </div>
             <div className="flex-1 relative bg-slate-100"><PatientMap patients={patients} /></div>
          </div>
        </div>
      )}
    </>
  );
}