"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Calendar, Clock, MapPin, 
  CheckSquare, QrCode, Share2, Copy, Sun, Moon,
  Stethoscope, Weight, Activity, Download, X, 
  MessageCircle, Link as LinkIcon, Mail, CheckCircle, FileText, MoreHorizontal
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";

// LIBRARIES
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// --- TYPESCRIPT INTERFACES ---
interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  dateDisplay: string;
  type: string;
  status: string;
  queue: number;
  fee: number;
}

interface UserProfile {
  basicInfo?: {
    fullName: string;
    age: string;
    bloodGroup: string;
  }
}

type Lang = 'en' | 'bn';

export default function CheckupDetailsPage() {
  const router = useRouter();
  
  // UI States
  const { darkMode, toggleDarkMode } = useTheme();
  const [lang, setLang] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // FIX: Explicitly type appt as Appointment | null
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  
  // QR & Vitals
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [showShare, setShowShare] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const ticketRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    setMounted(true);
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
            const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (profileSnap.exists()) {
                setProfile(profileSnap.data() as UserProfile);
            }

            const q = query(collection(db, "users", currentUser.uid, "appointments"), orderBy("createdAt", "desc"), limit(1));
            const apptSnap = await getDocs(q);
            
            if (!apptSnap.empty) {
                // FIX: Type cast the data safely
                const data = apptSnap.docs[0].data();
                const apptData: Appointment = { 
                    id: apptSnap.docs[0].id, 
                    doctorName: data.doctorName || "Unknown Doctor",
                    specialty: data.specialty || "General",
                    hospital: data.hospital || "Unknown Clinic",
                    dateDisplay: data.dateDisplay || "Pending",
                    type: data.type || "Visit",
                    status: data.status || "Booked",
                    queue: data.queue || 0,
                    fee: data.fee || 0
                };
                
                setAppt(apptData);
                
                // GENERATE REAL QR CODE
                try {
                    const qrPayload = JSON.stringify({
                        id: apptData.id,
                        uid: currentUser.uid,
                        doc: apptData.doctorName
                    });
                    const url = await QRCode.toDataURL(qrPayload, { margin: 2, color: { dark: '#000000', light: '#ffffff' } });
                    setQrCodeUrl(url);
                } catch (qrError) {
                    console.error("QR Gen Error", qrError);
                }
            }
        } catch (e) {
            console.error("Error fetching ticket data", e);
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
  const saveVitals = async () => {
    if(!user || !weight || !bp) return alert("Please enter both Weight and Blood Pressure.");
    setIsSaving(true);
    try {
        await updateDoc(doc(db, "users", user.uid), {
            "healthLog.latestWeight": weight,
            "healthLog.latestBP": bp,
            "healthLog.lastUpdated": new Date()
        });
        alert("Vitals saved successfully!");
    } catch (e) {
        console.error("Save failed", e);
    } finally {
        setIsSaving(false);
    }
  };

  // --- FIXED PDF DOWNLOAD LOGIC ---
  const handleDownloadPDF = async () => {
    if (!ticketRef.current || !appt) return;
    
    setShowDownload(true);
    setDownloadProgress(10); 

    try {
        const canvas = await html2canvas(ticketRef.current, {
            scale: 3, 
            backgroundColor: darkMode ? '#120a10' : '#ffffff', 
            useCORS: true 
        });
        
        setDownloadProgress(60);

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const pdfWidth = imgWidth * 0.264583;
        const pdfHeight = imgHeight * 0.264583;

        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        setDownloadProgress(90);
        pdf.save(`Ticket_${appt.id.slice(0,6)}.pdf`);
        setDownloadProgress(100);

        setTimeout(() => setShowDownload(false), 2000);

    } catch (error) {
        console.error("PDF Gen Error", error);
        alert("Failed to generate PDF");
        setShowDownload(false);
    }
  };

  const shareLink = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = appt ? `Checkup Appointment: ${appt.doctorName} at ${appt.hospital} on ${appt.dateDisplay}.` : 'My Appointment';

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText} Link: ${shareLink}`);
    alert("Link copied to clipboard!");
    setShowShare(false);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareLink)}`, '_blank');
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=Appointment Details&body=${encodeURIComponent(shareText + "\n\nLink: " + shareLink)}`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Appointment',
          text: shareText,
          url: shareLink,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      alert("Native sharing not supported on this browser.");
    }
  };


  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#120a10] text-white" : "bg-white text-slate-900"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500"></div>
    </div>
  );

  if (!appt) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${darkMode ? "bg-[#120a10] text-white" : "bg-white text-slate-900"}`}>
        <h2 className="text-2xl font-bold mb-2">No Active Appointment</h2>
        <button onClick={() => router.push("/patient/care/find-doctor")} className="px-8 py-3 bg-pink-600 rounded-xl font-bold text-white shadow-lg">Book Now</button>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans relative pb-24 transition-colors duration-500 
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>
      
      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 py-4 flex items-center justify-between transition-all
        ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
              <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Digital Ticket</h1>
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-full border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-pink-100 text-slate-600"}`}>
                {lang.toUpperCase()}
            </button>
            <button 
      onClick={toggleDarkMode} 
      className={`p-2 rounded-full transition-all border ${
        darkMode ? "bg-white/5 text-yellow-400" : "bg-white text-slate-500 shadow-sm"
      }`}
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 px-4 md:px-8 max-w-3xl mx-auto space-y-6">

        {/* 1. TICKET CARD (Capturable Area) */}
        <div className="relative">
            <div ref={ticketRef} className={`w-full rounded-[2.5rem] relative overflow-hidden shadow-2xl border pb-6
                ${darkMode ? "bg-gradient-to-br from-[#1e1b20] to-[#120a10] border-white/10" : "bg-white border-pink-100"}`}
            >
                <div className={`w-full h-3 ${appt.status === 'Confirmed' ? "bg-green-500" : "bg-yellow-500"}`} />
                
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className={`text-2xl font-bold mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>{appt.doctorName}</h2>
                            <p className="text-pink-500 font-medium">{appt.specialty}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Token</span>
                            <span className={`text-4xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>#{appt.queue}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-6 pb-6 border-b border-dashed border-gray-700/30">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Patient</p>
                            <p className={`font-bold ${darkMode ? "text-gray-200" : "text-slate-700"}`}>{profile?.basicInfo?.fullName || "Guest"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Age</p>
                            <p className={`font-bold ${darkMode ? "text-gray-200" : "text-slate-700"}`}>{profile?.basicInfo?.age || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Blood</p>
                            <p className="font-bold text-red-500">{profile?.basicInfo?.bloodGroup || "--"}</p>
                        </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 p-4 rounded-2xl mb-6 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><Calendar className="w-5 h-5" /></div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Date</p>
                                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{appt.dateDisplay}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Clock className="w-5 h-5" /></div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Type</p>
                                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{appt.type}</p>
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><MapPin className="w-5 h-5" /></div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Location</p>
                                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{appt.hospital}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-500/30 pt-6 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Appointment ID</p>
                            <div className="flex items-center gap-2 mb-1">
                                <code className={`px-2 py-1 rounded text-sm font-mono ${darkMode ? "bg-white/10" : "bg-gray-100 text-slate-600"}`}>{appt.id.slice(0, 8).toUpperCase()}</code>
                                <Copy onClick={handleCopy} className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors" />
                            </div>
                            <p className="text-[10px] text-gray-500">Scan to verify at clinic reception.</p>
                        </div>
                        
                        {/* REAL QR CODE DISPLAY */}
                        <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                            {qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="Ticket QR" className="w-20 h-20" />
                            ) : (
                                <div className="w-20 h-20 bg-gray-200 animate-pulse rounded" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. PREP & VITALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-[2rem] border ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-pink-500" /> Preparation
                </h3>
                <div className="space-y-3">
                    <CheckItem text="Bring previous Ultrasound Report" darkMode={darkMode} />
                    <CheckItem text="Bring National ID Copy" darkMode={darkMode} />
                    <CheckItem text="Drink 1L water (for urine test)" darkMode={darkMode} />
                </div>
            </div>

            <div className={`p-6 rounded-[2rem] border ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-500" /> Quick Vitals
                </h3>
                <div className="flex gap-3">
                    <div className={`flex-1 p-3 rounded-xl border flex items-center gap-2 ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                        <Weight className="w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} className={`bg-transparent w-full outline-none text-sm ${darkMode ? "text-white" : "text-slate-900"}`} />
                    </div>
                    <div className={`flex-1 p-3 rounded-xl border flex items-center gap-2 ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                        <Activity className="w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="BP" value={bp} onChange={(e) => setBp(e.target.value)} className={`bg-transparent w-full outline-none text-sm ${darkMode ? "text-white" : "text-slate-900"}`} />
                    </div>
                </div>
                <button onClick={saveVitals} disabled={isSaving} className="w-full mt-3 py-3 rounded-xl bg-blue-600/10 text-blue-500 text-xs font-bold hover:bg-blue-600/20 transition-colors disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save Vitals"}
                </button>
            </div>
        </div>

        {/* 3. ACTION BUTTONS */}
        <div className="flex gap-3 pb-8">
            <button 
                onClick={() => setShowShare(true)}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all
                ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600"}`}
            >
                <Share2 className="w-4 h-4" /> Share
            </button>
            <button 
                onClick={handleDownloadPDF}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all
                ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600"}`}
            >
                <Download className="w-4 h-4" /> Download Ticket
            </button>
        </div>

      </main>

      {/* SHARE MODAL */}
      {mounted && showShare && createPortal(
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowShare(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl relative ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
                <button onClick={() => setShowShare(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"><X className="w-5 h-5 opacity-50" /></button>
                <h3 className="text-xl font-bold mb-6 text-center">Share Ticket</h3>
                <div className="grid grid-cols-4 gap-4">
                    <ShareOption icon={LinkIcon} label="Copy" color="bg-gray-500" onClick={handleCopy} />
                    <ShareOption icon={MessageCircle} label="WhatsApp" color="bg-green-500" onClick={handleWhatsApp} />
                    <ShareOption icon={Mail} label="Email" color="bg-red-500" onClick={handleEmail} />
                    <ShareOption icon={MoreHorizontal} label="More" color="bg-blue-500" onClick={handleNativeShare} />
                </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>, document.body
      )}

      {/* DOWNLOAD PROGRESS MODAL */}
      {mounted && showDownload && createPortal(
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-xs p-8 rounded-3xl text-center ${darkMode ? "bg-[#1e1b20] text-white" : "bg-white text-slate-900"}`}>
                 {downloadProgress < 100 ? (
                    <>
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" opacity={darkMode ? 0.1 : 0.5} />
                                <path className="text-pink-500" strokeDasharray={`${downloadProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            </svg>
                            <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-pink-500" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Generating PDF...</h3>
                        <p className="text-xs text-gray-500">Creating High Quality Ticket</p>
                    </>
                 ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Downloaded!</h3>
                        <p className="text-sm text-gray-500 mb-6">Ticket saved to your device.</p>
                        <button onClick={() => setShowDownload(false)} className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 dark:bg-white/10 dark:text-white">Close</button>
                    </motion.div>
                 )}
             </motion.div>
          </motion.div>
        </AnimatePresence>, document.body
      )}

    </div>
  );
}

// --- HELPER COMPONENTS ---

function CheckItem({ text, darkMode }: { text: string, darkMode: boolean }) {
    const [checked, setChecked] = useState(false);
    return (
        <div onClick={() => setChecked(!checked)} className="flex items-center gap-3 cursor-pointer group select-none">
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checked ? "bg-green-500 border-green-500" : (darkMode ? "border-gray-600 group-hover:border-gray-400" : "border-slate-300 group-hover:border-slate-400")}`}>
                {checked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className={`text-sm ${checked ? "text-gray-500 line-through" : (darkMode ? "text-gray-300" : "text-slate-700")}`}>{text}</span>
        </div>
    )
}

function ShareOption({ icon: Icon, label, color, onClick }: any) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold opacity-70 group-hover:opacity-100">{label}</span>
        </button>
    )
}