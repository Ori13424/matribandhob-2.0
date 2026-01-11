"use client";
import { useState, useEffect, useRef } from "react";
import { 
  collection, query, where, onSnapshot, 
  addDoc, serverTimestamp, orderBy, deleteDoc, doc, getDocs 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";
import { 
  FileText, Upload, Plus, Search, 
  Download, Eye, Pill, X, User, Trash2, 
  CheckCircle, ChevronDown, Stethoscope, File, AlertCircle, Loader2, Calendar, Clock, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data States
  const [reports, setReports] = useState<any[]>([]);
  const [mothers, setMothers] = useState<any[]>([]);
  const [filteredMothers, setFilteredMothers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal States
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [motherSearch, setMotherSearch] = useState(""); 
  const [showMotherDropdown, setShowMotherDropdown] = useState(false);
  
  // Form States
  const [selectedMother, setSelectedMother] = useState<{id: string, name: string} | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [prescriptionNote, setPrescriptionNote] = useState("");
  const [medicines, setMedicines] = useState<{name: string, dosage: string, freq: string, duration: string, instruction: string}[]>([]);
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New Medicine Input
  const [newMed, setNewMed] = useState({ name: "", dosage: "", freq: "", duration: "", instruction: "" });

  // Quick Tags
  const freqTags = ["1-0-1", "1-1-1", "1-0-0", "0-0-1", "SOS", "Before Food", "After Food"];

  // UI States
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  // --- 1. INITIAL DATA FETCHING ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setCurrentUser(user);

      try {
        const qMothers = query(collection(db, "users"), where("role", "==", "mother")); 
        const snap = await getDocs(qMothers);
        
        const motherList = snap.docs.map(d => {
            const data = d.data();
            return { 
                id: d.id, 
                name: data.basicInfo?.fullName || data.fullName || data.name || "Mother",
                email: data.email || ""
            };
        });

        setMothers(motherList);
        setFilteredMothers(motherList);
      } catch (e) { console.error("Error fetching mothers", e); }

      const qReports = query(
        collection(db, "reports"), 
        where("doctorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubReports = onSnapshot(qReports, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(data);
        setLoading(false);
      });

      return () => unsubReports();
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!motherSearch) {
        setFilteredMothers(mothers);
    } else {
        setFilteredMothers(mothers.filter(m => m.name.toLowerCase().includes(motherSearch.toLowerCase())));
    }
  }, [motherSearch, mothers]);

  // --- 2. ACTIONS ---
  const handleAddMedicine = () => {
    if (!newMed.name || !newMed.dosage) return showToast("Medicine name & dosage required", "error");
    setMedicines([...medicines, newMed]);
    setNewMed({ name: "", dosage: "", freq: "", duration: "", instruction: "" });
  };

  const handleRemoveMedicine = (index: number) => {
    const newMeds = [...medicines];
    newMeds.splice(index, 1);
    setMedicines(newMeds);
  };

  const submitPrescription = async () => {
    if (!selectedMother) return showToast("Select a mother", "error");
    if (medicines.length === 0) return showToast("Add medicines", "error");
    
    try {
      await addDoc(collection(db, "reports"), {
        type: "Prescription",
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || currentUser.name || "Doctor",
        patientId: selectedMother.id, 
        patientName: selectedMother.name,
        medicines: medicines,
        notes: prescriptionNote,
        sender: "doctor",
        createdAt: serverTimestamp()
      });
      setIsPrescribeOpen(false);
      resetForms();
      showToast("Prescription Sent!", "success");
    } catch (e) { console.error(e); showToast("Failed to send.", "error"); }
  };

  const submitReport = async () => {
    if (!selectedMother || !file || !reportTitle) return showToast("Fill all fields", "error");
    
    setIsUploading(true);
    try {
      const fileRef = ref(storage, `medical_reports/${selectedMother.id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "reports"), {
        type: "Report",
        title: reportTitle,
        fileUrl: url,
        mimeType: file.type,
        doctorId: currentUser.uid,
        patientId: selectedMother.id,
        patientName: selectedMother.name,
        sender: "doctor",
        createdAt: serverTimestamp()
      });
      
      setIsUploadOpen(false);
      resetForms();
      showToast("Report Uploaded Successfully!", "success");
    } catch (e: any) { 
        console.error("Upload Error:", e);
        showToast(`Upload failed: ${e.message}`, "error"); 
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
      try {
          await deleteDoc(doc(db, "reports", id));
          showToast("Deleted", "success");
      } catch(e) { showToast("Delete failed", "error"); }
  }

  const downloadPrescriptionPDF = (data: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 128, 128); 
    doc.text("MEDICAL PRESCRIPTION", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Dr. ${data.doctorName}`, 14, 35);
    doc.text(`Date: ${new Date(data.createdAt?.toDate()).toLocaleDateString()}`, 180, 35, { align: "right" });
    doc.setLineWidth(0.5);
    doc.line(10, 40, 200, 40);

    doc.setFontSize(12);
    doc.text(`Patient: ${data.patientName}`, 14, 50);

    const tableColumn = ["Medicine Name", "Dosage", "Frequency", "Duration"];
    const tableRows = data.medicines.map((med: any) => [
        med.name, med.dosage, med.freq, med.duration
    ]);

    autoTable(doc, {
        startY: 60,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 128, 128] },
    });

    if (data.notes) {
        const finalY = (doc as any).lastAutoTable.finalY || 60;
        doc.setFontSize(10);
        doc.text("Notes / Instructions:", 14, finalY + 10);
        doc.setFont("helvetica", "italic");
        doc.text(data.notes, 14, finalY + 16);
    }

    doc.save(`Prescription_${data.patientName}.pdf`);
  };

  const resetForms = () => {
    setMedicines([]);
    setNewMed({ name: "", dosage: "", freq: "", duration: "", instruction: "" });
    setPrescriptionNote("");
    setReportTitle("");
    setFile(null);
    setSelectedMother(null);
    setMotherSearch("");
  };

  const filteredReports = reports.filter(r => {
    const matchesTab = activeTab === 'received' ? r.sender === 'patient' : r.sender === 'doctor';
    const matchesSearch = (r.patientName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className={`min-h-screen p-6 md:p-8 font-sans ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-teal-700 dark:text-teal-400">Medical Records</h1>
           <p className={`text-sm mt-1 font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Manage patient reports and prescriptions.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setIsUploadOpen(true)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border flex items-center gap-2 transition-all hover:shadow-md ${darkMode ? "border-white/10 hover:bg-white/5" : "bg-white border-slate-200 hover:border-teal-500"}`}>
                <Upload className="w-4 h-4" /> Upload Report
            </button>
            <button onClick={() => setIsPrescribeOpen(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> New Prescription
            </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl mb-6 w-fit">
          {['received', 'sent'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? "bg-white dark:bg-slate-800 text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                  {tab === 'received' ? "Patient Reports" : "Sent History"}
              </button>
          ))}
      </div>

      {/* REPORT LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReports.map((item) => (
              <motion.div layout key={item.id} className={`p-5 rounded-2xl border group transition-all hover:shadow-md ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-slate-100"}`}>
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${item.type === 'Prescription' ? "bg-teal-50 text-teal-600 dark:bg-teal-900/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"}`}>
                              {item.type === 'Prescription' ? <Pill className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                          </div>
                          <div>
                              <h3 className="font-bold text-base">{item.title || "Medical Prescription"}</h3>
                              <p className="text-xs font-medium opacity-60 flex items-center gap-1 mt-1">
                                  <User className="w-3 h-3" /> {item.patientName}
                              </p>
                          </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                          <span className="text-[10px] font-bold opacity-50 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">{item.createdAt?.toDate().toLocaleDateString()}</span>
                          <button onClick={() => handleDeleteReport(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                  </div>

                  {/* PREVIEW */}
                  <div className={`p-4 rounded-xl text-xs mb-4 border ${darkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                      {item.type === 'Prescription' ? (
                          <div className="space-y-2">
                              {item.medicines?.slice(0,3).map((med: any, i: number) => (
                                  <div key={i} className="flex justify-between border-b border-dashed border-gray-200 dark:border-white/5 last:border-0 pb-1 last:pb-0">
                                      <span className="font-bold">{med.name}</span>
                                      <span className="opacity-70">{med.dosage} • {med.freq}</span>
                                  </div>
                              ))}
                              {item.medicines?.length > 3 && <p className="text-[10px] opacity-50 text-center pt-1">+ {item.medicines.length - 3} more</p>}
                          </div>
                      ) : (
                          <p className="flex items-center gap-2 py-2 font-medium"><File className="w-4 h-4" /> Document Attached</p>
                      )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                      {item.fileUrl && (
                          <a href={item.fileUrl} target="_blank" className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                              <Eye className="w-4 h-4" /> Open File
                          </a>
                      )}
                      {item.type === 'Prescription' && (
                          <button onClick={() => downloadPrescriptionPDF(item)} className="flex-1 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors">
                              <Download className="w-4 h-4" /> Download PDF
                          </button>
                      )}
                  </div>
              </motion.div>
          ))}
      </div>

      {/* --- PROFESSIONAL PRESCRIPTION MODAL --- */}
      <AnimatePresence>
        {isPrescribeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col ${darkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-slate-900"}`}>
                    
                    {/* Header: Rx Pad Style */}
                    <div className="flex justify-between items-start p-8 border-b border-gray-100 dark:border-white/10 bg-teal-600/5">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-2 text-teal-700 dark:text-teal-400 font-serif">Rx Prescription</h2>
                            <p className="text-sm opacity-60 mt-1 font-medium">Digital Medical Record • {new Date().toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => setIsPrescribeOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="p-8 space-y-8 flex-1">
                        
                        {/* 1. Patient Selection */}
                        <div className="relative">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Patient Details</label>
                            {selectedMother ? (
                                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-500/20 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xl font-serif">
                                            {selectedMother.name.charAt(0)}
                                        </div>
                                        <div>
                                            {/* FIX: Ensure high contrast text for both light and dark mode */}
                                            <p className="font-bold text-lg leading-tight text-teal-900 dark:text-teal-100">{selectedMother.name}</p>
                                            <p className="text-xs font-mono text-teal-700/60 dark:text-teal-200/60">ID: {selectedMother.id.slice(0,8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedMother(null)} className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline px-4 py-2">Change Patient</button>
                                </div>
                            ) : (
                                <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                                    <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-transparent">
                                        <Search className="w-5 h-5 text-gray-400" />
                                        <input 
                                            placeholder="Search patient by name..." 
                                            className="bg-transparent outline-none text-sm w-full font-medium h-8"
                                            value={motherSearch}
                                            onChange={(e) => setMotherSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {filteredMothers.map(m => (
                                            <div key={m.id} onClick={() => setSelectedMother(m)} className="p-3 hover:bg-teal-500/10 rounded-lg cursor-pointer flex items-center gap-3 transition-colors group">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold group-hover:bg-teal-500 group-hover:text-white transition-colors">{m.name.charAt(0)}</div>
                                                <span className="text-sm font-medium truncate">{m.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Medicine Adder */}
                        <div className={`p-6 rounded-2xl border-2 border-dashed ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/50"}`}>
                            <div className="flex items-center gap-2 mb-4 text-teal-600 dark:text-teal-400">
                                <Activity className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Add Medication</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                                <div className="md:col-span-5">
                                    <label className="text-[10px] font-bold uppercase opacity-50 mb-1 block">Medicine Name</label>
                                    <input placeholder="e.g. Paracetamol" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-medium outline-none border focus:border-teal-500 transition-colors ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold uppercase opacity-50 mb-1 block">Dosage</label>
                                    <input placeholder="e.g. 500mg" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-medium outline-none border focus:border-teal-500 transition-colors ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase opacity-50 mb-1 block">Frequency</label>
                                    <input placeholder="1-0-1" value={newMed.freq} onChange={(e) => setNewMed({...newMed, freq: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-medium outline-none border focus:border-teal-500 transition-colors ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase opacity-50 mb-1 block">Days</label>
                                    <input placeholder="5 Days" value={newMed.duration} onChange={(e) => setNewMed({...newMed, duration: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-medium outline-none border focus:border-teal-500 transition-colors ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`} />
                                </div>
                            </div>

                            {/* Quick Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {freqTags.map(tag => (
                                    <button 
                                        key={tag} 
                                        onClick={() => setNewMed({...newMed, freq: tag})}
                                        className="px-3 py-1 rounded-full text-[10px] font-bold border hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-colors dark:border-white/10"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            <button onClick={handleAddMedicine} className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                                <Plus className="w-4 h-4" /> Add to Prescription
                            </button>
                        </div>

                        {/* 3. Prescription Table */}
                        {medicines.length > 0 && (
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase font-bold opacity-70">
                                        <tr>
                                            <th className="p-4">Medicine</th>
                                            <th className="p-4">Dosage</th>
                                            <th className="p-4">Freq</th>
                                            <th className="p-4">Duration</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {medicines.map((med, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                                                <td className="p-4 font-bold">{med.name}</td>
                                                <td className="p-4 opacity-80">{med.dosage}</td>
                                                <td className="p-4"><span className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-1 rounded text-xs font-bold">{med.freq}</span></td>
                                                <td className="p-4 opacity-80">{med.duration}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleRemoveMedicine(index)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 4. Footer & Signature */}
                        <div className="pt-4">
                            <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Doctor's Clinical Note</label>
                            <textarea 
                                className={`w-full p-4 rounded-xl text-sm outline-none border h-24 resize-none ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`}
                                placeholder="Additional instructions, dietary advice, etc..."
                                value={prescriptionNote}
                                onChange={(e) => setPrescriptionNote(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
                            <div className="text-right mr-auto">
                                <p className="text-xs opacity-50">Authorized by</p>
                                <p className="font-bold font-serif text-teal-700 dark:text-teal-400">Dr. {currentUser?.displayName || "Medical Officer"}</p>
                            </div>
                            <button onClick={submitPrescription} className="px-8 py-4 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xl shadow-teal-600/20 active:scale-95 transition-all flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Issue Prescription
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- UPLOAD REPORT MODAL --- */}
      <AnimatePresence>
        {isUploadOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-md rounded-[2rem] p-8 shadow-2xl ${darkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-slate-900"}`}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Upload className="w-5 h-5 text-blue-500" /> Send Document</h2>
                    <div className="space-y-5">
                        
                        {/* Mother Select */}
                        <select 
                            className={`w-full p-4 rounded-xl outline-none border ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`}
                            onChange={(e) => setSelectedMother(mothers.find(m => m.id === e.target.value) || null)}
                            value={selectedMother?.id || ""}
                        >
                            <option value="">Select Patient...</option>
                            {mothers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>

                        <input className={`w-full p-4 rounded-xl text-sm outline-none border ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`} placeholder="Report Title" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                        
                        <div onClick={() => fileInputRef.current?.click()} className={`w-full rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                            <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" accept="image/*,.pdf" />
                            {file ? <p className="text-sm font-bold text-green-500 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> {file.name}</p> : <div className="text-center opacity-50"><Upload className="w-8 h-8 mx-auto mb-2" /><p className="text-xs font-bold">Tap to attach file</p></div>}
                        </div>

                        <button onClick={submitReport} disabled={isUploading} className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xl disabled:opacity-50 flex justify-center gap-2">
                            {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isUploading ? "Uploading..." : "Send Document"}
                        </button>
                    </div>
                    <button onClick={() => setIsUploadOpen(false)} className="absolute top-6 right-6 p-2"><X className="w-5 h-5" /></button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${toast.type === 'success' ? "bg-green-600 text-white border-green-500" : "bg-red-600 text-white border-red-500"}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{toast.msg}</span>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}