"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    collection, doc, writeBatch, serverTimestamp
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";
import dynamic from "next/dynamic";
import { Users, Truck, Map, X, Bell, AlertTriangle, CheckCircle, Trash2, AlertOctagon, Send } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Components
import DoctorStatsWidget from "@/features/doctor/DoctorStatsWidget";
import PatientWaitingRoom from "@/features/doctor/components/PatientWaitingRoom";
import AddPatientModal from "@/features/doctor/components/patients/AddPatientModal";
import PatientAnalyticsWidget from "@/features/doctor/components/dashboard/PatientAnalyticsWidget";
import { PatientService, Patient, DashboardStats } from "@/services/patient.service";

const PatientMap = dynamic(
    () => import("@/features/doctor/components/patients/PatientMap"),
    { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-3xl">Loading Map...</div> }
);

export default function DoctorDashboard() {
    const router = useRouter();
    const { darkMode } = useTheme();
    const t = useTranslation();

    // State
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [liveStats, setLiveStats] = useState<DashboardStats>({ activeMothers: 0, onlineDoctors: 0 });
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Modals
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);
    const [advisoryText, setAdvisoryText] = useState("");
    const [sendingAdvisory, setSendingAdvisory] = useState(false);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', title: '', message: '' });
    const [clearing, setClearing] = useState(false);

    // Auth Check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) router.push('/login');
        });
        return () => unsubscribe();
    }, [router]);

    // Data Subscription
    useEffect(() => {
        const unsubscribe = PatientService.subscribeToPatients(
            (updatedPatients, updatedStats) => {
                setPatients(updatedPatients);
                setLiveStats(updatedStats);
                setLoading(false);
                generateNotifications(updatedPatients);
            },
            (err) => {
                console.error("Error fetching patients:", err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // Generate Notifications from Patient Data
    const generateNotifications = (patientList: Patient[]) => {
        const newNotifs: any[] = [];
        patientList.forEach(p => {
            if (p.status === 'SOS ALERT') {
                newNotifs.push({
                    id: `sos-${p.id}`,
                    type: 'critical',
                    title: `SOS: ${p.name}`,
                    message: `${p.name} has triggered an SOS alert.`,
                    timestamp: new Date(),
                    isRead: false
                });
            } else if (p.status === 'High Risk' || p.isHighRisk) {
                newNotifs.push({
                    id: `bp-${p.id}`,
                    type: 'warning',
                    title: `High Risk: ${p.name}`,
                    message: `Patient flagged as High Risk. Check vitals.`,
                    timestamp: new Date(),
                    isRead: false
                });
            }
        });
        setNotifications(newNotifs);
    };

    // --- SEND ADVISORY LOGIC ---
    const sendAdvisory = async () => {
        if (!auth.currentUser || !advisoryText.trim()) return;
        setSendingAdvisory(true);
        try {
            const batch = writeBatch(db);
            const newDoc = doc(collection(db, "announcements"));
            batch.set(newDoc, {
                title: "Doctor's Advisory",
                message: advisoryText,
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || "Dr. Matribandhob",
                audience: 'all',
                timestamp: serverTimestamp(),
                type: 'medical'
            });
            await batch.commit();
            setAdvisoryText("");
            setIsAdvisoryOpen(false);
            alert("Medical Advisory Broadcasted Successfully.");
        } catch (e) {
            console.error("Advisory Error", e);
            alert("Failed to send advisory.");
        }
        setSendingAdvisory(false);
    };

    // Handlers
    const promptResolveSOS = () => {
        setConfirmModal({
            isOpen: true,
            type: 'sos',
            title: "Resolve All SOS Alerts?",
            message: "This will mark all current SOS alerts as resolved and return patients to normal monitoring status. Ensure all emergencies are handled first."
        });
    };

    const promptClearNotifications = () => {
        setNotifications([]); // Client side clear for now
    };

    const handleConfirmAction = async () => {
        setClearing(true);
        try {
            if (confirmModal.type === 'sos') {
                // Implement Real Resolution
                const batch = writeBatch(db);
                let count = 0;
                patients.filter(p => p.status === 'SOS ALERT' || p.sosTriggered).forEach(p => {
                    const ref = doc(db, 'users', p.id);
                    batch.update(ref, { sosTriggered: false, status: 'Active' });
                    count++;
                });

                if (count > 0) {
                    await batch.commit();
                    // Refetch handled by subscription
                }
            }
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setClearing(false);
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const sosCount = patients.filter(p => p.status === 'SOS ALERT' || p.sosTriggered).length;

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className={`font-bold ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Syncing Patient Data...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* DASHBOARD ACTIONS HEADER */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
                <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Overview</h2>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Welcome back, here is today's summary.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* NOTIFICATION BELL */}
                    <div className="relative z-20">
                        <button
                            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            className={`p-3 rounded-2xl transition-all relative border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Bell className={`w-5 h-5 ${notifications.some(n => !n.isRead) ? "animate-swing origin-top" : ""}`} />
                            {notifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                            )}
                        </button>
                        <AnimatePresence>
                            {showNotifDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`absolute right-0 mt-3 w-96 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
                                >
                                    <div className={`p-4 border-b flex justify-between items-center ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                                        <h3 className="font-bold text-sm">Notifications</h3>
                                        <div className="flex gap-2">
                                            {sosCount > 0 && <button onClick={promptResolveSOS} className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full hover:bg-red-200">RESOLVE SOS</button>}
                                            <button onClick={() => setShowNotifDropdown(false)}><X className="w-4 h-4 opacity-50" /></button>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center opacity-40 text-sm">No new alerts</div>
                                        ) : notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b flex gap-3 ${darkMode ? "border-slate-800 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50"}`}>
                                                <div className={`mt-1 p-1.5 rounded-full h-fit ${n.type === 'critical' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                                                    {n.type === 'critical' ? <AlertOctagon className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{n.title}</p>
                                                    <p className="text-xs opacity-60">{n.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={() => setIsMapOpen(true)} className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                        <Map className="w-4 h-4 text-teal-500" /> Live Cluster
                    </button>
                    <button onClick={() => setIsAdvisoryOpen(true)} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95">
                        <Send className="w-4 h-4" /> Broadcast Advisory
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all active:scale-95">
                        <Users className="w-4 h-4" /> Register Patient
                    </button>
                </div>
            </div>

            {/* STATS WIDGET */}
            <DoctorStatsWidget patients={patients} liveStats={liveStats} />

            {/* ANALYTICS & WAITING ROOM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[450px]">
                    <PatientAnalyticsWidget patients={patients} />
                </div>
                <div className="lg:col-span-1 h-[450px]">
                    <PatientWaitingRoom patients={patients} />
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* ADVISORY MODAL */}
            <AnimatePresence>
                {isAdvisoryOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className={`w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative overflow-hidden ${darkMode ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setIsAdvisoryOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><X className="w-5 h-5 opacity-50" /></button>
                            </div>
                            <div className="mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                                    <Send className="w-6 h-6" />
                                </div>
                                <h3 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>Send Advisory</h3>
                                <p className="text-slate-500 font-medium">Broadcast health tips or alerts to all mothers.</p>
                            </div>

                            <textarea
                                value={advisoryText}
                                onChange={(e) => setAdvisoryText(e.target.value)}
                                placeholder="Type your message here (e.g. 'Heatwave warning: stay hydrated')..."
                                className={`w-full h-32 p-4 rounded-xl border outline-none font-medium text-sm resize-none mb-6 transition-all focus:ring-2 focus:ring-indigo-500
                                ${darkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                            />

                            <button
                                onClick={sendAdvisory}
                                disabled={sendingAdvisory || !advisoryText.trim()}
                                className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {sendingAdvisory ? "Sending..." : "Blast Message"} <Send className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className={`w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 text-center ${darkMode ? "bg-slate-900 border border-red-500/30" : "bg-white"}`}
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <AlertOctagon className="w-8 h-8" />
                            </div>
                            <h3 className={`text-2xl font-black mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>{confirmModal.title}</h3>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{confirmModal.message}</p>

                            <div className="flex gap-3">
                                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                                <button onClick={handleConfirmAction} disabled={clearing} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 active:scale-95 transition-transform">
                                    {clearing ? "Processing..." : "Confirm Action"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OTHER MODALS */}
            {isAddModalOpen && <AddPatientModal onClose={() => setIsAddModalOpen(false)} />}

            {isMapOpen && (
                <div className="fixed inset-0 z-[150] bg-slate-900/90 backdrop-blur-sm p-4 flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 px-4 text-white">
                        <h3 className="text-2xl font-black">Cluster Map</h3>
                        <button onClick={() => setIsMapOpen(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 rounded-3xl overflow-hidden bg-slate-100 relative shadow-2xl border border-white/10">
                        <PatientMap patients={patients} />
                    </div>
                </div>
            )}
        </div>
    );
}