"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Calendar, Clock, MapPin, 
  CheckSquare, QrCode, Share2, Copy, Sun, Moon,
  Stethoscope, Weight, Activity, Download, X, 
  MessageCircle, Link as LinkIcon, Mail, CheckCircle, FileText, MoreHorizontal, Navigation, AlertTriangle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";

// LIBRARIES
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// --- TYPESCRIPT INTERFACES ---
interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  location?: string;
  dateDisplay: string;
  type: string;
  status: string;
  queue: number;
  fee: number;
  meetingLink?: string;
}

interface UserProfile {
  basicInfo?: {
    fullName: string;
    age: string;
    bloodGroup: string;
    phone?: string;
  };
  healthLog?: {
    latestWeight?: string;
    latestBP?: string;
  };
}

export default function CheckupDetailsPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [doctorImg, setDoctorImg] = useState<string>(""); 
  const [loading, setLoading] = useState(true);
  
  // QR & Vitals
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // UI States
  const [showShare, setShowShare] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  const ticketRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    setMounted(true);
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
            // A. Fetch Patient Profile & Health Log
            const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (profileSnap.exists()) {
                const pData = profileSnap.data() as UserProfile;
                setProfile(pData);
                if (pData.healthLog?.latestWeight) setWeight(pData.healthLog.latestWeight);
                if (pData.healthLog?.latestBP) setBp(pData.healthLog.latestBP);
            }

            // B. Fetch Latest *CONFIRMED* Appointment
            const q = query(collection(db, "users", currentUser.uid, "appointments"), orderBy("createdAt", "desc"), limit(5));
            const apptSnap = await getDocs(q);
            
            // --- FIX: Explicitly type as 'any' to avoid TS errors on properties ---
            let foundAppt: any = null;
            
            // Find the first confirmed appointment
            for (const docSnap of apptSnap.docs) {
                const d = docSnap.data();
                if (d.status === 'Confirmed') {
                    foundAppt = { id: docSnap.id, ...d };
                    break;
                }
            }

            if (foundAppt) {
                const apptData: Appointment = { 
                    id: foundAppt.id, 
                    doctorId: foundAppt.doctorId || "",
                    doctorName: foundAppt.doctorName || "Unknown Doctor",
                    specialty: foundAppt.specialty || "General",
                    hospital: foundAppt.hospital || "Main Clinic",
                    location: foundAppt.location || "Doctor's Chamber", 
                    dateDisplay: foundAppt.dateDisplay || "Scheduled", 
                    type: foundAppt.type || "Visit",
                    status: foundAppt.status,
                    queue: foundAppt.queue || Math.floor(Math.random() * 20) + 1, 
                    fee: foundAppt.fee || 0,
                    meetingLink: foundAppt.meetingLink
                };
                setAppt(apptData);

                // C. Fetch Doctor Image
                if (foundAppt.doctorId) {
                    const docSnap = await getDoc(doc(db, "users", foundAppt.doctorId));
                    if (docSnap.exists()) {
                        setDoctorImg(docSnap.data().photoURL || "");
                    }
                }
                
                // D. Generate QR
                try {
                    const qrPayload = JSON.stringify({
                        id: apptData.id,
                        pid: currentUser.uid,
                        status: "Confirmed",
                        time: apptData.dateDisplay
                    });
                    const url = await QRCode.toDataURL(qrPayload, { margin: 1, width: 200, color: { dark: '#000000', light: '#ffffff' } });
                    setQrCodeUrl(url);
                } catch (e) { console.error("QR Error", e); }
            }
        } catch (e) {
            console.error("Error fetching data", e);
        } finally {
            setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubAuth();
  }, [router]);

  // --- 2. HANDLERS ---
  const showToast = (msg: string, type: 'success'|'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const saveVitals = async () => {
    if(!user || !weight || !bp) return showToast("Enter Weight and BP", "error");
    setIsSaving(true);
    try {
        await updateDoc(doc(db, "users", user.uid), {
            "healthLog.latestWeight": weight,
            "healthLog.latestBP": bp,
            "healthLog.lastUpdated": serverTimestamp()
        });
        showToast("Vitals saved!", "success");
    } catch (e) {
        showToast("Failed to save", "error");
    } finally {
        setIsSaving(false);
    }
  };

  const openMap = () => {
      if (appt?.location) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.location)}`, '_blank');
      }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || !appt) return;
    setShowDownload(true);
    setDownloadProgress(10); 

    try {
        await new Promise(r => setTimeout(r, 500));
        const canvas = await html2canvas(ticketRef.current, {
            scale: 3, 
            backgroundColor: darkMode ? '#1e1b20' : '#ffffff', 
            useCORS: true 
        });
        setDownloadProgress(60);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        setDownloadProgress(90);
        pdf.save(`Ticket_${appt.id.slice(0,6)}.pdf`);
        setDownloadProgress(100);

        setTimeout(() => setShowDownload(false), 1500);

    } catch (error) {
        setShowDownload(false);
        showToast("Download failed", "error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Appointment ID: ${appt?.id}`);
    showToast("ID Copied!", "success");
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#120a10] text-white" : "bg-white text-slate-900"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500"></div>
    </div>
  );

  if (!appt) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${darkMode ? "bg-[#120a10] text-white" : "bg-white text-slate-900"}`}>
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Active Ticket</h2>
        <p className="text-sm opacity-60 mb-8 max-w-xs mx-auto">
            You don't have any confirmed checkups. Book a doctor to generate your digital ticket.
        </p>
        <button onClick={() => router.push("/patient/care/find-doctor")} className="px-8 py-3 bg-pink-600 rounded-xl font-bold text-white shadow-xl hover:scale-105 transition-transform">
            Book Appointment
        </button>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans relative pb-24 transition-colors duration-500 ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}`}>
      
      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 py-4 flex items-center justify-between transition-all ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
              <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Digital Ticket</h1>
        </div>
        <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-all border ${darkMode ? "bg-white/5 text-yellow-400 border-white/10" : "bg-white text-slate-500 border-pink-100 shadow-sm"}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 px-4 md:px-8 max-w-3xl mx-auto space-y-8">

        {/* 1. TICKET CARD (Capturable Area) */}
        <div className="relative">
            <div ref={ticketRef} className={`w-full rounded-[2.5rem] relative overflow-hidden shadow-2xl border ${darkMode ? "bg-gradient-to-br from-[#1e1b20] to-[#120a10] border-white/10" : "bg-white border-pink-100"}`}>
                
                {/* Status Bar */}
                <div className="w-full h-14 bg-emerald-600 flex items-center justify-between px-8 text-white">
                    <span className="font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> CONFIRMED
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">Priority Pass</span>
                </div>
                
                <div className="p-8">
                    {/* Doctor & Token */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex gap-4">
                            <img src={doctorImg || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} className="w-20 h-20 rounded-2xl object-cover bg-slate-200 border-2 border-white shadow-sm" alt="Doctor" />
                            <div>
                                <h2 className={`text-xl font-bold leading-tight ${darkMode ? "text-white" : "text-slate-800"}`}>{appt.doctorName}</h2>
                                <p className="text-pink-500 text-sm font-bold mt-1">{appt.specialty}</p>
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    <Clock className="w-3 h-3" /> {appt.dateDisplay}
                                </div>
                            </div>
                        </div>
                        <div className={`text-center p-4 rounded-2xl min-w-[90px] border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100"}`}>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Token No.</span>
                            {/* CUSTOM TOKEN FONT */}
                            <span className={`text-5xl font-mono font-black tracking-tighter ${darkMode ? "text-white" : "text-slate-900"}`}>
                                #{String(appt.queue).padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="flex flex-wrap gap-y-6 gap-x-8 mb-8 pb-8 border-b border-dashed border-gray-500/30">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Patient</p>
                            <p className={`font-bold text-lg ${darkMode ? "text-white" : "text-slate-800"}`}>{profile?.basicInfo?.fullName || "Guest"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Blood Group</p>
                            <p className="font-bold text-lg text-red-500">{profile?.basicInfo?.bloodGroup || "--"}</p>
                        </div>
                        <div className="w-full">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                                {appt.meetingLink ? "Video Meeting Link" : "Clinic Location"}
                            </p>
                            {appt.meetingLink ? (
                                <p className="text-sm font-bold text-blue-500 truncate underline">{appt.meetingLink}</p>
                            ) : (
                                <p className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>{appt.location}</p>
                            )}
                        </div>
                    </div>

                    {/* Footer: ID & QR */}
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] text-gray-400 uppercase">Appointment ID</p>
                            <code className={`block px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${darkMode ? "bg-white/10" : "bg-gray-100 text-slate-700"}`}>
                                {appt.id.slice(0,8).toUpperCase()}
                            </code>
                            {!appt.meetingLink && (
                                <button onClick={openMap} className="mt-2 text-xs font-bold text-blue-500 flex items-center gap-1 hover:underline">
                                    <Navigation className="w-3 h-3" /> Get Directions
                                </button>
                            )}
                        </div>
                        
                        <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                            {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-20 h-20" />}
                        </div>
                    </div>
                </div>
                
                {/* Perforation Effect */}
                <div className="absolute bottom-[6rem] -left-3 w-6 h-6 rounded-full bg-[#120a10] dark:bg-[#120a10]" />
                <div className="absolute bottom-[6rem] -right-3 w-6 h-6 rounded-full bg-[#120a10] dark:bg-[#120a10]" />
            </div>
        </div>

        {/* 2. VITALS & PREP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vitals Input */}
            <div className={`p-6 rounded-[2.5rem] border ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                <h3 className="font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-500" /> Current Vitals
                </h3>
                <div className="flex gap-4 mb-4">
                    <div className={`flex-1 p-4 rounded-2xl border flex items-center gap-3 ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                        <Weight className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Weight (kg)</p>
                            <input type="number" placeholder="00" value={weight} onChange={(e) => setWeight(e.target.value)} className={`bg-transparent w-full outline-none font-bold text-lg ${darkMode ? "text-white" : "text-slate-900"}`} />
                        </div>
                    </div>
                    <div className={`flex-1 p-4 rounded-2xl border flex items-center gap-3 ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                        <Activity className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">BP (sys/dia)</p>
                            <input type="text" placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)} className={`bg-transparent w-full outline-none font-bold text-lg ${darkMode ? "text-white" : "text-slate-900"}`} />
                        </div>
                    </div>
                </div>
                <button onClick={saveVitals} disabled={isSaving} className="w-full py-4 rounded-xl bg-blue-600/10 text-blue-500 text-xs font-bold hover:bg-blue-600/20 transition-colors disabled:opacity-50">
                    {isSaving ? "Saving..." : "Update Health Log"}
                </button>
            </div>

            {/* Preparation */}
            <div className={`p-6 rounded-[2.5rem] border ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                <h3 className="font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-500" /> Preparation
                </h3>
                <div className="space-y-4">
                    <CheckItem text="Bring previous Medical Reports" darkMode={darkMode} />
                    <CheckItem text="Bring National ID / Insurance Card" darkMode={darkMode} />
                    <CheckItem text="Arrive 15 mins before time" darkMode={darkMode} />
                </div>
            </div>
        </div>

        {/* 3. ACTIONS */}
        <div className="flex gap-4 pb-8">
            <button onClick={() => setShowShare(true)} className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50"}`}>
                <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={handleDownloadPDF} className={`flex-[2] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-pink-500/30 transition-all bg-pink-600 hover:bg-pink-700`}>
                <Download className="w-4 h-4" /> Download Ticket
            </button>
        </div>
      </main>

      {/* TOAST NOTIFICATION (Replaces Alert) */}
      <AnimatePresence>
        {toast && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${toast.type === 'success' ? "bg-green-600 text-white border-green-500" : "bg-red-600 text-white border-red-500"}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{toast.msg}</span>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL */}
      {mounted && showShare && createPortal(
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowShare(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm p-6 rounded-[2rem] relative ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
                <button onClick={() => setShowShare(false)} className="absolute top-4 right-4"><X className="w-5 h-5 opacity-50" /></button>
                <h3 className="text-xl font-bold mb-6 text-center">Share Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleCopy} className="p-4 rounded-xl bg-gray-100 dark:bg-white/10 flex flex-col items-center gap-2 font-bold text-xs"><Copy className="w-6 h-6" /> Copy Link</button>
                </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>, document.body
      )}

      {/* DOWNLOAD SPINNER */}
      {mounted && showDownload && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
             <div className="text-white text-center">
                 <div className="w-16 h-16 border-4 border-white/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
                 <p className="font-bold">Generating PDF...</p>
             </div>
        </div>, document.body
      )}

    </div>
  );
}

// --- SUB COMPONENTS ---
function CheckItem({ text, darkMode }: { text: string, darkMode: boolean }) {
    const [checked, setChecked] = useState(false);
    return (
        <div onClick={() => setChecked(!checked)} className="flex items-center gap-3 cursor-pointer select-none opacity-80 hover:opacity-100">
            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${checked ? "bg-green-500 border-green-500" : (darkMode ? "border-gray-600" : "border-slate-300")}`}>
                {checked && <CheckSquare className="w-4 h-4 text-white" />}
            </div>
            <span className={`text-sm font-medium ${checked ? "line-through opacity-50" : ""}`}>{text}</span>
        </div>
    )
}