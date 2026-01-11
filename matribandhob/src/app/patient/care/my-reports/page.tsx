"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, UploadCloud, FileText, 
  Eye, Sun, Moon, Download, 
  CheckCircle, AlertTriangle, User, Pill, X, Loader2, Calendar, Clock,
  PlusCircle 
} from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, where, getDocs, writeBatch, Timestamp, doc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTheme } from "@/context/ThemeContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Tab = 'all' | 'prescriptions' | 'lab';

export default function MyReportsPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [importing, setImporting] = useState(false); // Loading state for schedule import
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const q = query(collection(db, "reports"), where("patientId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const unsubReports = onSnapshot(q, (snapshot) => {
            setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        try {
            const qDocs = query(collection(db, "users"), where("role", "==", "doctor"));
            const docSnap = await getDocs(qDocs);
            const docList = docSnap.docs.map(d => {
                const data = d.data();
                let drName = data.basicInfo?.fullName || data.fullName || data.displayName || data.name || "Doctor";
                if (!drName.toLowerCase().includes('dr')) drName = `Dr. ${drName}`;
                return { id: d.id, name: drName };
            });
            setDoctors(docList);
        } catch (e) { console.error(e); }

        return () => unsubReports();
      } else { router.push("/login"); }
    });
    return () => unsubAuth();
  }, [router]);

  // --- LOGIC: Parse Duration ---
  const parseDuration = (durationStr: string): Date => {
    const now = new Date();
    if (!durationStr) return new Date(now.setDate(now.getDate() + 7)); // Default 7 days

    const num = parseInt(durationStr.match(/\d+/)?.[0] || "7");
    const lower = durationStr.toLowerCase();
    
    if (lower.includes("month")) now.setMonth(now.getMonth() + num);
    else if (lower.includes("week")) now.setDate(now.getDate() + (num * 7));
    else now.setDate(now.getDate() + num); // Default to days
    
    return now;
  };

  // --- LOGIC: Parse Frequency to Times ---
  const mapFrequencyToTimes = (freq: string): string[] => {
    const f = freq.toLowerCase().replace(/\s/g, '');
    // Standard formats
    if (f.includes("1+0+1") || f.includes("bd") || f.includes("b.d")) return ["09:00 AM", "09:00 PM"];
    if (f.includes("1+1+1") || f.includes("tds")) return ["09:00 AM", "02:00 PM", "09:00 PM"];
    if (f.includes("1+0+0") || f.includes("od") || f.includes("morning")) return ["09:00 AM"];
    if (f.includes("0+0+1") || f.includes("night")) return ["09:00 PM"];
    if (f.includes("0+1+0") || f.includes("noon")) return ["02:00 PM"];
    if (f.includes("1+1+0")) return ["09:00 AM", "02:00 PM"];
    if (f.includes("0+1+1")) return ["02:00 PM", "09:00 PM"];
    // Fallback default
    return ["09:00 AM"];
  };

  // --- LOGIC: Import to Medicine Log ---
  const handleImportPrescription = async (report: any) => {
    if (!user || !report.medicines) return;
    setImporting(true);
    
    try {
        const batch = writeBatch(db);
        
        report.medicines.forEach((med: any) => {
            const times = mapFrequencyToTimes(med.freq);
            const endDate = parseDuration(med.duration);
            
            times.forEach(time => {
                const docRef = doc(collection(db, "users", user.uid, "medicines"));
                batch.set(docRef, {
                    name: med.name,
                    type: 'Tablet', // Default, user can edit later
                    time: time,
                    dosage: med.dosage,
                    source: 'doctor', // Key to identify this came from a report
                    takenToday: false,
                    createdAt: serverTimestamp(),
                    durationText: med.duration,
                    endDate: Timestamp.fromDate(endDate),
                    originReportId: report.id
                });
            });
        });

        await batch.commit();
        showToast("Medicines added to Schedule!", "success");
    } catch (error) {
        console.error(error);
        showToast("Failed to import medicines", "error");
    } finally {
        setImporting(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !reportTitle || !selectedDoctor) return showToast("Please fill all fields", "error");
    setIsUploading(true);
    try {
        const storageRef = ref(storage, `reports/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        const isImage = file.type.startsWith('image/');
        const category = isImage ? "Scan/Image" : "Document";
        await addDoc(collection(db, "reports"), {
            type: "Report",
            category: category,
            title: reportTitle,
            fileUrl: url,
            mimeType: file.type,
            patientId: user.uid,
            patientName: user.displayName || "Mother",
            doctorId: selectedDoctor,
            sender: 'patient',
            createdAt: serverTimestamp()
        });
        setShowUploadModal(false);
        setFile(null);
        setReportTitle("");
        showToast("Sent to Doctor!", "success");
    } catch (error) { showToast("Upload failed", "error"); } finally { setIsUploading(false); }
  };

  const downloadPrescriptionPDF = (data: any, e?: any) => {
    if(e) e.stopPropagation();
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 128, 128); 
    doc.text("MEDICAL PRESCRIPTION", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${data.doctorName}`, 14, 35);
    doc.text(`Date: ${new Date(data.createdAt?.toDate()).toLocaleDateString()}`, 180, 35, { align: "right" });
    doc.setLineWidth(0.5);
    doc.line(10, 40, 200, 40);
    doc.setFontSize(12);
    doc.text(`Patient: ${data.patientName}`, 14, 50);
    const tableRows = data.medicines.map((med: any) => [med.name, med.dosage, med.freq, med.duration]);
    autoTable(doc, { startY: 60, head: [["Medicine", "Dosage", "Freq", "Duration"]], body: tableRows, theme: 'grid', headStyles: { fillColor: [0, 128, 128] } });
    if (data.notes) {
        const finalY = (doc as any).lastAutoTable.finalY || 60;
        doc.text(`Notes: ${data.notes}`, 14, finalY + 10);
    }
    doc.save(`Prescription_${data.createdAt?.toDate().toLocaleDateString()}.pdf`);
  };

  const filteredReports = reports.filter(r => {
      if (activeTab === 'all') return true;
      if (activeTab === 'prescriptions') return r.type === 'Prescription';
      if (activeTab === 'lab') return r.type !== 'Prescription';
      return true;
  });

  return (
    <div className={`min-h-screen font-sans relative pb-24 transition-colors duration-500 ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}`}>
      
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 py-4 flex items-center justify-between transition-all ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">Medical Vault</h1>
        </div>
        <button onClick={toggleDarkMode} className={`p-2.5 rounded-full transition-all border ${darkMode ? "bg-white/5 text-yellow-400 border-white/10" : "bg-white text-slate-500 border-pink-100 shadow-sm"}`}>{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
      </header>

      <main className="pt-24 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-6">
            <div><h2 className="text-2xl font-bold">My Records</h2><p className="text-sm opacity-60">Prescriptions & Lab Results</p></div>
            <button onClick={() => setShowUploadModal(true)} className="px-5 py-3 rounded-2xl bg-pink-600 text-white font-bold text-sm shadow-lg hover:bg-pink-700 flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Send Report</button>
        </div>

        <div className={`flex p-1.5 rounded-2xl mb-8 overflow-hidden ${darkMode ? "bg-white/5" : "bg-white border border-pink-100"}`}>
           {[{id: 'all', label: 'All Files'}, {id: 'prescriptions', label: 'Prescriptions'}, {id: 'lab', label: 'Lab Reports'}].map((tab) => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all capitalize ${activeTab === tab.id ? (darkMode ? "bg-pink-600 text-white" : "bg-pink-500 text-white") : "text-gray-500 hover:text-gray-400"}`}>{tab.label}</button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? <div className="flex justify-center col-span-full py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500"/></div> : filteredReports.length === 0 ? <div className="text-center col-span-full py-12 opacity-50"><FileText className="w-16 h-16 mx-auto mb-4 text-pink-200" /><p>No records found.</p></div> : filteredReports.map((report) => (
                <div key={report.id} onClick={() => setSelectedReport(report)} className={`p-4 rounded-[1.5rem] border group relative overflow-hidden hover:shadow-lg transition-all cursor-pointer ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-pink-100"}`}>
                    <div className="flex gap-4 items-start">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${report.type === 'Prescription' ? "bg-teal-100 text-teal-600" : "bg-slate-100"}`}>
                            {report.type === 'Prescription' ? <Pill className="w-6 h-6" /> : <FileText className="w-6 h-6 text-pink-500" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm truncate">{report.title || "Prescription"}</h3>
                            <p className="text-xs opacity-50 mt-0.5">{new Date(report.createdAt?.toDate()).toLocaleDateString()} • {report.sender === 'doctor' ? `${report.doctorName}` : "My Upload"}</p>
                        </div>
                    </div>
                    {report.type === 'Prescription' && report.medicines && (
                        <div className={`mt-4 p-3 rounded-xl text-xs border ${darkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                            {report.medicines.slice(0,3).map((m: any, i: number) => <div key={i} className="flex justify-between"><strong>{m.name}</strong><span className="opacity-60">{m.dosage}</span></div>)}
                            {report.medicines.length > 3 && <p className="text-center opacity-50 pt-1">+ {report.medicines.length - 3} more</p>}
                        </div>
                    )}
                    <div className="flex gap-2 mt-4">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-bold flex items-center justify-center gap-2 text-slate-700 dark:text-white"><Eye className="w-4 h-4" /> View</button>
                        {report.type === 'Prescription' && <button onClick={(e) => downloadPrescriptionPDF(report, e)} className="flex-1 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" /> PDF</button>}
                    </div>
                </div>
            ))}
        </div>
      </main>

      {/* --- UPGRADED REPORT DETAILS POPUP --- */}
      <AnimatePresence>
        {selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 20, scale: 0.98 }} 
                    className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl relative overflow-hidden ${darkMode ? "bg-[#18181b] text-white ring-1 ring-white/10" : "bg-white text-slate-900 ring-1 ring-slate-900/5"}`}
                >
                    {/* 1. STICKY HEADER */}
                    <div className={`p-6 sm:p-8 border-b z-10 flex items-start justify-between backdrop-blur-xl ${darkMode ? "bg-[#18181b]/90 border-white/5" : "bg-white/90 border-pink-50"}`}>
                        <div className="flex gap-5 items-center">
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm ${selectedReport.type === 'Prescription' ? (darkMode ? "bg-teal-500/10 text-teal-400" : "bg-teal-50 text-teal-600") : (darkMode ? "bg-pink-500/10 text-pink-400" : "bg-pink-50 text-pink-600")}`}>
                                {selectedReport.type === 'Prescription' ? <Pill className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${darkMode ? "bg-white/10 text-gray-400" : "bg-slate-100 text-slate-500"}`}>
                                        {selectedReport.category || "General"}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-50 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {new Date(selectedReport.createdAt?.toDate()).toLocaleDateString()}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">{selectedReport.title || "Untitled Record"}</h2>
                            </div>
                        </div>
                        <button onClick={() => setSelectedReport(null)} className={`p-3 rounded-full transition-all ${darkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-900"}`}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* 2. SCROLLABLE CONTENT */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                        {selectedReport.type === 'Prescription' ? (
                            <>
                                {/* Info Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-5 rounded-3xl border relative overflow-hidden group ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><User className="w-20 h-20" /></div>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-2">Doctor</p>
                                        <p className="text-lg font-bold truncate pr-8">{selectedReport.doctorName}</p>
                                        <p className="text-xs opacity-50">General Physician</p>
                                    </div>
                                    <div className={`p-5 rounded-3xl border relative overflow-hidden group ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><User className="w-20 h-20" /></div>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-2">Patient</p>
                                        <p className="text-lg font-bold truncate pr-8">{selectedReport.patientName}</p>
                                        <p className="text-xs opacity-50">ID: {selectedReport.patientId.slice(0,8)}</p>
                                    </div>
                                </div>

                                {/* Medicines List */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Pill className="w-4 h-4 text-teal-500" />
                                        <h3 className="font-bold text-sm uppercase tracking-wider opacity-70">Prescribed Medicines</h3>
                                    </div>
                                    <div className={`rounded-3xl border overflow-hidden ${darkMode ? "border-white/10 divide-white/5" : "border-slate-200 divide-slate-100"}`}>
                                        {/* Table Header (Hidden on small screens) */}
                                        <div className={`hidden sm:grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase opacity-50 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                            <div className="col-span-5">Medicine Name</div>
                                            <div className="col-span-3">Dosage</div>
                                            <div className="col-span-2">Freq</div>
                                            <div className="col-span-2 text-right">Duration</div>
                                        </div>
                                        
                                        {/* Table Rows */}
                                        <div className={`divide-y ${darkMode ? "divide-white/5" : "divide-slate-100"}`}>
                                            {selectedReport.medicines?.map((med: any, i: number) => (
                                                <div key={i} className={`p-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center transition-colors ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                                                    <div className="col-span-5 font-bold text-base sm:text-sm">{med.name}</div>
                                                    <div className="col-span-3 text-sm opacity-80 flex items-center gap-2">
                                                        <span className="sm:hidden text-xs font-bold opacity-50 bg-slate-100 dark:bg-white/10 px-1.5 rounded">Dose:</span>
                                                        {med.dosage}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${darkMode ? "bg-teal-500/10 text-teal-400" : "bg-teal-50 text-teal-700 border border-teal-100"}`}>
                                                            {med.freq}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-left sm:text-right text-sm font-medium opacity-60 flex items-center sm:justify-end gap-2">
                                                        <span className="sm:hidden text-xs font-bold opacity-50">Duration:</span>
                                                        <Clock className="w-3 h-3 hidden sm:inline-block" /> {med.duration}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedReport.notes && (
                                    <div className={`p-5 rounded-3xl border flex gap-4 ${darkMode ? "bg-yellow-500/5 border-yellow-500/10" : "bg-amber-50 border-amber-100"}`}>
                                        <div className="pt-1"><div className="w-2 h-2 rounded-full bg-amber-400" /></div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase mb-1 ${darkMode ? "text-amber-400" : "text-amber-600"}`}>Doctor's Note</p>
                                            <p className={`text-sm italic leading-relaxed ${darkMode ? "text-amber-100/80" : "text-amber-800"}`}>"{selectedReport.notes}"</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Document View
                            <div className={`flex flex-col items-center justify-center p-16 rounded-[2.5rem] border-2 border-dashed transition-all group ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                                <div className="p-6 bg-blue-500/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                                    <FileText className="w-12 h-12 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Attachment Preview</h3>
                                <p className="text-center opacity-60 max-w-xs mb-8">This record contains a file attachment (PDF or Image). Click below to view it.</p>
                                <a href={selectedReport.fileUrl} target="_blank" rel="noreferrer" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Open Document
                                </a>
                            </div>
                        )}
                    </div>

                    {/* 3. STICKY FOOTER ACTIONS */}
                    <div className={`p-4 sm:p-6 border-t mt-auto z-10 backdrop-blur-xl flex flex-col sm:flex-row gap-3 ${darkMode ? "bg-[#18181b]/95 border-white/5" : "bg-white/95 border-slate-100"}`}>
                         {selectedReport.type === 'Prescription' ? (
                            <>
                                <button 
                                    onClick={() => downloadPrescriptionPDF(selectedReport)} 
                                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"}`}
                                >
                                    <Download className="w-4 h-4" /> <span className="hidden sm:inline">Save as</span> PDF
                                </button>
                                <button 
                                    onClick={() => handleImportPrescription(selectedReport)}
                                    disabled={importing}
                                    className="flex-[2] py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-sm shadow-xl shadow-pink-600/20 hover:shadow-pink-600/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {importing ? <Loader2 className="w-5 h-5 animate-spin"/> : <PlusCircle className="w-5 h-5" />}
                                    {importing ? "Syncing..." : "Add to Reminder Schedule"}
                                </button>
                            </>
                         ) : (
                            <button onClick={() => setSelectedReport(null)} className={`w-full py-4 rounded-2xl font-bold ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"}`}>
                                Close Viewer
                            </button>
                         )}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* TOAST & MODAL */}
      <AnimatePresence>
        {toast && <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"><div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${toast.type === 'success' ? "bg-green-600 text-white border-green-500" : "bg-red-600 text-white border-red-500"}`}>{toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}<span className="text-sm font-bold">{toast.msg}</span></div></motion.div>}
      </AnimatePresence>

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-md rounded-[2rem] p-8 shadow-2xl ${darkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-slate-900"}`}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><UploadCloud className="w-6 h-6 text-pink-500" /> Send to Doctor</h2>
                    <div className="space-y-5">
                        <select className={`w-full p-4 rounded-xl outline-none border ${darkMode ? "bg-black/20 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}><option value="">Select Doctor...</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                        <input className={`w-full p-4 rounded-xl text-sm outline-none border ${darkMode ? "bg-black/20 border-white/10 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"}`} placeholder="Title" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                        <div onClick={() => fileInputRef.current?.click()} className={`w-full rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}><input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />{file ? <p className="text-sm font-bold text-green-500">{file.name}</p> : <div className="text-center opacity-50"><UploadCloud className="w-8 h-8 mx-auto mb-2" /><p className="text-xs font-bold">Attach File</p></div>}</div>
                        <button onClick={handleUpload} disabled={isUploading} className="w-full py-4 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 shadow-xl disabled:opacity-50 flex justify-center gap-2">{isUploading && <Loader2 className="w-5 h-5 animate-spin" />} {isUploading ? "Uploading..." : "Send Report"}</button>
                    </div>
                    <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 p-2"><X className="w-5 h-5" /></button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}