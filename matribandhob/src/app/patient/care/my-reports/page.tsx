"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, UploadCloud, FileText, Image as ImageIcon, 
  Eye, EyeOff, Sun, Moon, Filter, Download, Trash2, 
  CheckCircle, AlertCircle, Stethoscope, User
} from "lucide-react";

import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTheme } from "@/context/ThemeContext";

type Lang = 'en' | 'bn';
type Tab = 'all' | 'doctor' | 'patient';

export default function MyReportsPage() {
  const router = useRouter();
  
  // UI States
  const { darkMode, toggleDarkMode } = useTheme();
  const [lang, setLang] = useState<Lang>('en');
  const [isPrivate, setIsPrivate] = useState(false); // Privacy Shield
  const [activeTab, setActiveTab] = useState<Tab>('all');
  
  // Data States
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FETCH REPORTS ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Listen to Reports Collection
        const q = query(
            collection(db, "users", currentUser.uid, "reports"), 
            orderBy("createdAt", "desc")
        );
        
        const unsubReports = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReports(data);
            setLoading(false);
        });
        return () => unsubReports();
      } else {
        router.push("/login");
      }
    });
    return () => unsubAuth();
  }, [router]);

  // --- 2. UPLOAD HANDLER ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
        // 1. Upload to Firebase Storage
        const storageRef = ref(storage, `reports/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // 2. Determine Type based on extension (simple logic)
        const isImage = file.type.startsWith('image/');
        const category = isImage ? "Scan/Image" : "Document";

        // 3. Save Metadata to Firestore
        await addDoc(collection(db, "users", user.uid, "reports"), {
            title: file.name,
            type: category,
            url: url,
            source: 'patient', // Uploaded by user
            mimeType: file.type,
            createdAt: serverTimestamp()
        });

    } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed. Please try again.");
    } finally {
        setIsUploading(false);
    }
  };

  // --- 3. FILTER LOGIC ---
  const filteredReports = reports.filter(r => {
      if (activeTab === 'all') return true;
      return r.source === activeTab;
  });

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
          <h1 className="text-lg font-bold">Medical Vault</h1>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all
                ${isPrivate 
                    ? "bg-red-500 border-red-500 text-white" 
                    : (darkMode ? "bg-white/5 border-white/5 text-gray-400" : "bg-white border-pink-100 text-slate-500")}`}
            >
                {isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
      <main className="pt-24 px-4 md:px-8 max-w-4xl mx-auto">
        
        {/* UPLOAD HERO */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-[2rem] border-2 border-dashed p-8 mb-8 flex flex-col items-center justify-center cursor-pointer transition-all group
            ${darkMode 
                ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-pink-500/50" 
                : "bg-white border-pink-200 hover:border-pink-400 shadow-sm"}`}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*,.pdf"
            />
            
            {isUploading ? (
                <div className="flex flex-col items-center animate-pulse">
                    <UploadCloud className="w-12 h-12 text-pink-500 mb-2" />
                    <p className="font-bold">Uploading Securely...</p>
                </div>
            ) : (
                <>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110
                        ${darkMode ? "bg-pink-500/20 text-pink-500" : "bg-pink-50 text-pink-600"}`}>
                        <UploadCloud className="w-8 h-8" />
                    </div>
                    <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Upload Report</h2>
                    <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-slate-500"}`}>
                        Tap to upload Prescription, Lab Test, or Ultrasound (PDF/JPG)
                    </p>
                </>
            )}
        </div>

        {/* TABS */}
        <div className={`flex p-1 rounded-xl mb-6 overflow-hidden ${darkMode ? "bg-white/5" : "bg-white border border-pink-100"}`}>
           {(['all', 'doctor', 'patient'] as const).map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)} 
               className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all capitalize
               ${activeTab === tab 
                   ? (darkMode ? "bg-pink-600 text-white" : "bg-pink-500 text-white") 
                   : "text-gray-500 hover:text-gray-400"}`}
             >
               {tab === 'all' ? 'All Files' : tab === 'doctor' ? 'From Doctor' : 'My Uploads'}
             </button>
           ))}
        </div>

        {/* REPORTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
                <p className="text-gray-500 text-center col-span-full py-10">Loading Vault...</p>
            ) : filteredReports.length === 0 ? (
                <div className="text-center col-span-full py-12 opacity-50">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p>No reports found.</p>
                </div>
            ) : (
                filteredReports.map((report) => (
                    <ReportCard 
                        key={report.id} 
                        data={report} 
                        darkMode={darkMode} 
                        isPrivate={isPrivate} 
                    />
                ))
            )}
        </div>

      </main>
    </div>
  );
}

// --- SUB-COMPONENT: REPORT CARD ---
function ReportCard({ data, darkMode, isPrivate }: any) {
    const isImage = data.mimeType?.startsWith('image/');
    
    // Privacy Logic: If private mode is ON, blur scans/images
    const shouldBlur = isPrivate;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if(!confirm("Delete this report?")) return;
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser?.uid}/reports`, data.id));
        } catch(e) { console.error(e); }
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3 rounded-2xl border flex gap-4 items-start group relative overflow-hidden transition-all hover:scale-[1.01]
            ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-pink-100 shadow-sm"}`}
            onClick={() => window.open(data.url, '_blank')}
        >
            {/* THUMBNAIL AREA */}
            <div className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center
                ${darkMode ? "bg-black/30" : "bg-slate-100"}`}>
                
                {isImage ? (
                    <img 
                        src={data.url} 
                        className={`w-full h-full object-cover transition-all duration-500 ${shouldBlur ? "blur-md scale-110 opacity-50" : ""}`} 
                    />
                ) : (
                    <FileText className="w-8 h-8 text-pink-500" />
                )}

                {/* Privacy Shield Icon Overlay */}
                {shouldBlur && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <EyeOff className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                )}
            </div>

            {/* INFO AREA */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block
                        ${data.source === 'doctor' 
                            ? "bg-blue-500/10 text-blue-500" 
                            : "bg-purple-500/10 text-purple-500"}`}>
                        {data.source === 'doctor' ? "Doctor Sent" : "Self Upload"}
                    </span>
                    {/* Delete Button (Only for own uploads) */}
                    {data.source === 'patient' && (
                        <button onClick={handleDelete} className="p-1.5 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <h3 className={`font-bold text-sm truncate pr-4 ${shouldBlur ? "blur-sm select-none opacity-50" : (darkMode ? "text-white" : "text-slate-800")}`}>
                    {shouldBlur ? "Hidden Report Name" : data.title}
                </h3>
                
                <p className={`text-xs truncate ${darkMode ? "text-gray-500" : "text-slate-500"}`}>
                    {new Date(data.createdAt?.toDate()).toLocaleDateString()} • {data.type}
                </p>

                {data.source === 'doctor' && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-500 font-bold">
                        <Stethoscope className="w-3 h-3" />
                        <span>Verified by Dr. Ayesha</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}