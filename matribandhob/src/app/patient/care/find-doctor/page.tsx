"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Search, Star, MessageCircle, Video, 
  CalendarCheck, ShieldCheck, X, Send, Sun, Moon,
  FileText, MapPin, Link as LinkIcon, CheckCircle, Clock, Stethoscope, Ban, AlertTriangle, Check
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, setDoc, updateDoc, deleteDoc 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";

// --- HELPER: Consistent Chat ID Generator ---
const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join("_");
};

export default function FindDoctorPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();

  // --- STATES ---
  const [user, setUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDoctor, setChatDoctor] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // App States
  const [activeTab, setActiveTab] = useState<'find' | 'appointments'>('find');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  
  // Booking & Modal States
  const [bookingNote, setBookingNote] = useState(""); 
  const [showBookingModal, setShowBookingModal] = useState(false); 
  const [showSuccessModal, setShowSuccessModal] = useState(false); 
  const [isBooking, setIsBooking] = useState(false);

  // Cancellation States
  const [apptToCancel, setApptToCancel] = useState<any>(null); // Stores the appt object to cancel

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // --- 1. AUTH & DATA LOADING ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // A. Load User's Appointments
        const qAppt = query(collection(db, "users", currentUser.uid, "appointments"), orderBy("createdAt", "desc"));
        const unsubAppt = onSnapshot(qAppt, (snap) => {
            setMyAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        
        // B. Set Mother Online
        updateDoc(doc(db, "users", currentUser.uid), { isOnline: true }).catch(() => {});

        return () => {
            updateDoc(doc(db, "users", currentUser.uid), { isOnline: false }).catch(() => {});
            unsubAppt();
        };
      } else {
        router.push('/login');
      }
    });

    // C. Load Doctors
    const qDoctors = query(collection(db, "users"));
    const unsubDocs = onSnapshot(qDoctors, (snap) => {
        const docList = snap.docs.map(doc => {
            const d = doc.data();
            if (d.role !== 'doctor') return null; 
            
            let rawName = d.fullName || d.name || d.displayName || d.basicInfo?.fullName || "Unknown Doctor";
            if (!rawName.toLowerCase().startsWith("dr") && !rawName.toLowerCase().includes("unknown")) {
                rawName = `Dr. ${rawName}`;
            }

            return {
                id: doc.id,
                name: rawName,
                specialty: d.specialization || d.specialty || d.basicInfo?.specialty || "General Physician",
                image: d.photoURL || "https://img.freepik.com/free-photo/doctor-smiling_144627-40545.jpg",
                fee: d.consultationFee || d.fee || 500,
                rating: 4.8,
                online: d.isOnline === true
            };
        }).filter(Boolean); 

        setDoctors(docList);
        setLoading(false);
    });

    return () => { unsubAuth(); unsubDocs(); };
  }, [router]);

  // --- 2. CHAT LOGIC ---
  useEffect(() => {
    if (!chatOpen || !chatDoctor || !user) return;
    
    const chatId = getChatId(user.uid, chatDoctor.id);
    const qChat = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsubChat = onSnapshot(qChat, (snap) => {
        setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubChat();
  }, [chatOpen, chatDoctor, user]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user || !chatDoctor) return;
    const chatId = getChatId(user.uid, chatDoctor.id);
    const text = chatInput;
    setChatInput(""); 

    try {
        await setDoc(doc(db, "chats", chatId), { 
            participants: [user.uid, chatDoctor.id],
            updatedAt: serverTimestamp(),
            lastMessage: text
        }, { merge: true });

        await addDoc(collection(db, "chats", chatId, "messages"), {
            text,
            senderId: user.uid,
            senderRole: 'patient',
            timestamp: serverTimestamp(),
            read: false
        });
    } catch (e) { console.error("Message failed:", e); }
  };

  // --- 3. HELPER: SHOW TOAST ---
  const showToast = (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
  };

  // --- 4. BOOKING LOGIC ---
  const confirmBooking = async () => {
    if (!user || !selectedDoctor) return;
    setIsBooking(true);
    try {
        await addDoc(collection(db, "users", user.uid, "appointments"), {
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.name,
            specialty: selectedDoctor.specialty,
            dateDisplay: "Pending Confirmation", 
            fee: selectedDoctor.fee,
            type: "Request",
            status: "Requested",
            notes: bookingNote, 
            createdAt: serverTimestamp()
        });
        
        setBookingNote("");
        setShowBookingModal(false);
        setShowSuccessModal(true); 
    } catch (e) { 
        console.error(e); 
        showToast("Booking failed. Please check your connection.", "error");
    }
    setIsBooking(false);
  };

  // --- 5. CANCEL LOGIC (Custom Modal) ---
  const confirmCancellation = async () => {
    if (!user || !apptToCancel) return;
    
    try {
        await updateDoc(doc(db, "users", user.uid, "appointments", apptToCancel.id), {
            status: "Cancelled",
            cancelledAt: serverTimestamp()
        });
        setApptToCancel(null); // Close Modal
        showToast("Appointment cancelled successfully.", "success");
    } catch (e) {
        console.error("Cancellation failed", e);
        showToast("Failed to cancel. Please try again.", "error");
    }
  };

  const filteredDoctors = doctors.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-500 ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}`}>
      
      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 py-4 flex justify-between items-center ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}>
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className={`p-2 rounded-full ${darkMode ? "bg-white/10" : "bg-white shadow-sm"}`}><ArrowLeft className="w-5 h-5"/></button>
            <h1 className="text-xl font-bold">Find Doctor</h1>
        </div>
        <div className={`hidden md:flex p-1 rounded-xl ${darkMode ? "bg-white/5" : "bg-white border border-pink-100"}`}>
          <button onClick={() => setActiveTab('find')} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === 'find' ? "bg-pink-600 text-white" : "text-gray-500"}`}>Doctors</button>
          <button onClick={() => setActiveTab('appointments')} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === 'appointments' ? "bg-pink-600 text-white" : "text-gray-500"}`}>My Appts</button>
        </div>
        <button onClick={toggleDarkMode} className={`p-2 rounded-full border ${darkMode ? "border-white/10 text-yellow-400" : "border-pink-100 text-slate-400"}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE TABS */}
      <div className="md:hidden fixed top-[72px] left-0 w-full px-4 z-30">
          <div className={`flex p-1 rounded-xl shadow-lg ${darkMode ? "bg-[#1a0f15] border border-white/10" : "bg-white border border-pink-100"}`}>
              <button onClick={() => setActiveTab('find')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'find' ? "bg-pink-600 text-white" : "text-gray-500"}`}>Find Doctor</button>
              <button onClick={() => setActiveTab('appointments')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'appointments' ? "bg-pink-600 text-white" : "text-gray-500"}`}>My Appointments</button>
          </div>
      </div>

      <main className="pt-36 px-4 max-w-5xl mx-auto min-h-screen">
        {activeTab === 'find' ? (
            <>
                {/* SEARCH */}
                <div className={`flex items-center gap-3 p-3 rounded-2xl border mb-6 transition-all focus-within:ring-2 ring-pink-500/50 ${darkMode ? "bg-[#1e1b20] border-white/10" : "bg-white border-pink-100 shadow-sm"}`}>
                    <Search className="w-5 h-5 text-gray-400" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search doctor by name..." className="bg-transparent flex-1 outline-none text-sm font-medium" />
                </div>

                {/* DOCTOR LIST */}
                {loading ? (
                    <div className="text-center py-10 opacity-50">Loading Doctors...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDoctors.map((doc) => (
                            <div key={doc.id} onClick={() => setSelectedDoctor(doc)} className={`p-4 rounded-[1.5rem] border relative cursor-pointer hover:scale-[1.02] transition-all ${darkMode ? "bg-[#1e1b20]/50 border-white/5 hover:border-pink-500/30" : "bg-white border-pink-100 shadow-sm hover:shadow-md"}`}>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <img src={doc.image} className="w-20 h-20 rounded-2xl object-cover bg-slate-200" alt={doc.name} />
                                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${doc.online ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /><span className="text-xs font-bold">{doc.rating}</span></div>
                                        <h3 className="text-base font-bold leading-tight">{doc.name}</h3>
                                        <p className="text-xs text-pink-500 font-bold mt-0.5">{doc.specialty}</p>
                                        <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${doc.online ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}>
                                            {doc.online ? "Online Now" : "Offline"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
                 {myAppointments.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <CalendarCheck className="w-16 h-16 mx-auto mb-4 text-pink-300" />
                        <p>No appointments yet.</p>
                    </div>
                 )}
                 
                 {myAppointments.map((appt: any) => (
                    <div key={appt.id} className={`group relative p-5 rounded-[1.5rem] border transition-all hover:shadow-lg
                        ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
                        
                        {/* Status Badge */}
                        <div className="flex justify-between items-start mb-3">
                             <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                ${appt.status === 'Requested' ? "bg-yellow-100 text-yellow-700" : 
                                  appt.status === 'Confirmed' ? "bg-green-100 text-green-700" : 
                                  appt.status === 'Declined' || appt.status === 'Cancelled' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                                {appt.status}
                             </div>
                             <span className="text-xs font-bold opacity-50">{appt.createdAt?.toDate().toLocaleDateString()}</span>
                        </div>

                        {/* Doctor Info */}
                        <div className="flex items-center gap-4 mb-4">
                             <div className="p-3 rounded-2xl bg-pink-50 text-pink-600"><ShieldCheck className="w-6 h-6" /></div>
                             <div>
                                 <h3 className="font-bold text-lg">{appt.doctorName}</h3>
                                 <p className="text-xs text-pink-500 font-medium">{appt.specialty}</p>
                             </div>
                        </div>

                        {/* Details Block */}
                        <div className={`p-4 rounded-xl space-y-3 mb-4 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                             <div className="flex items-center justify-between text-xs">
                                 <span className="opacity-70 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Time</span>
                                 <span className="font-bold">{appt.dateDisplay || "Pending Confirmation"}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                                 <span className="opacity-70 flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5" /> Type</span>
                                 <span className="font-bold">{appt.type || "General"}</span>
                             </div>
                             
                             {/* SHOW DOCTOR CONFIRMATION / NOTE */}
                             {appt.doctorNote && (
                                <div className="pt-3 border-t border-dashed mt-2">
                                    <span className="text-[10px] font-bold text-green-600 uppercase mb-1 block flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" /> Doctor's Message
                                    </span>
                                    <p className="text-xs italic font-medium opacity-80">"{appt.doctorNote}"</p>
                                </div>
                             )}

                             {/* SHOW LOCATION or LINK */}
                             {appt.status === 'Confirmed' && (
                                <div className="pt-2 border-t border-dashed mt-2 space-y-2">
                                    {appt.location && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <MapPin className="w-3.5 h-3.5 text-pink-500" /> {appt.location}
                                        </div>
                                    )}
                                    {appt.meetingLink && (
                                        <a href={appt.meetingLink} target="_blank" className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                            <Video className="w-3.5 h-3.5" /> Join Video Call
                                        </a>
                                    )}
                                </div>
                             )}

                             {/* SHOW REJECTION REASON */}
                             {appt.status === 'Declined' && appt.declineReason && (
                                 <div className="pt-2 border-t border-dashed mt-2">
                                     <span className="text-[10px] font-bold text-red-500 uppercase mb-1 block">Reason for Rejection</span>
                                     <p className="text-xs font-medium text-red-400">"{appt.declineReason}"</p>
                                 </div>
                             )}
                        </div>

                        {/* CANCEL ACTION BUTTON */}
                        {(appt.status === 'Requested' || appt.status === 'Confirmed') && (
                            <button 
                                onClick={() => setApptToCancel(appt)}
                                className="w-full mt-2 py-3 rounded-xl border border-red-100 dark:border-red-900/30 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Ban className="w-3.5 h-3.5" /> Cancel Appointment
                            </button>
                        )}
                    </div>
                 ))}
            </div>
        )}
      </main>

      {/* --- MODALS (ALL CUSTOM UI) --- */}

      {/* 1. DOCTOR DETAILS MODAL */}
      <AnimatePresence>
        {selectedDoctor && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] p-8 max-h-[85vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${darkMode ? "bg-[#1a0f15] text-white" : "bg-white text-slate-900"}`}>
                <div className="w-12 h-1 bg-gray-500/30 rounded-full mx-auto mb-6" />
                <div className="flex gap-5 mb-6">
                    <img src={selectedDoctor.image} className="w-24 h-24 rounded-3xl object-cover shadow-2xl bg-slate-200" />
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{selectedDoctor.name}</h2>
                        <p className="text-pink-500 font-medium">{selectedDoctor.specialty}</p>
                        <div className={`mt-2 flex items-center gap-2 text-sm font-bold ${selectedDoctor.online ? "text-green-500" : "text-gray-400"}`}>
                            <div className={`w-2 h-2 rounded-full ${selectedDoctor.online ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                            {selectedDoctor.online ? "Available Now" : "Currently Offline"}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mb-6">
                    <button onClick={() => { setChatDoctor(selectedDoctor); setChatOpen(true); setSelectedDoctor(null); }} className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"}`}><MessageCircle className="w-5 h-5" /> Chat</button>
                    <button onClick={() => { setShowBookingModal(true); }} className="flex-1 py-4 rounded-2xl bg-pink-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-pink-700 transition-colors"><Video className="w-5 h-5" /> Book (৳{selectedDoctor.fee})</button>
                </div>
                <button onClick={() => setSelectedDoctor(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/10"><X className="w-5 h-5" /></button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BOOKING CONFIRMATION FORM MODAL */}
      <AnimatePresence>
        {showBookingModal && selectedDoctor && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`w-full max-w-md rounded-[2rem] p-6 shadow-2xl ${darkMode ? "bg-[#1A1A1A] text-white" : "bg-white"}`}>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-pink-600" /> Request Appointment</h3>
                    <p className="text-sm opacity-70 mb-4">You are booking with <strong className="text-pink-500">{selectedDoctor.name}</strong>.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Reason for Visit / Note</label>
                            <textarea 
                                className={`w-full p-4 rounded-xl text-sm font-medium outline-none border min-h-[100px] resize-none ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`} 
                                placeholder="Describe your problem or request (e.g. Fever, Checkup)..."
                                value={bookingNote}
                                onChange={(e) => setBookingNote(e.target.value)}
                            />
                        </div>
                        <div className={`p-3 rounded-xl flex justify-between items-center ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                            <span className="text-xs font-bold">Consultation Fee</span>
                            <span className="text-sm font-bold text-pink-600">৳ {selectedDoctor.fee}</span>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowBookingModal(false)} className="flex-1 py-3 rounded-xl font-bold border border-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={confirmBooking} disabled={isBooking} className="flex-[2] py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2">
                                {isBooking ? "Sending..." : "Send Request"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 3. CANCEL CONFIRMATION MODAL (NEW) */}
      <AnimatePresence>
        {apptToCancel && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl ${darkMode ? "bg-[#1A1A1A] text-white" : "bg-white"}`}>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">Cancel Appointment?</h3>
                    <p className="text-sm text-center opacity-60 mb-6">
                        Are you sure you want to cancel your appointment with <strong>{apptToCancel.doctorName}</strong>? This action cannot be undone.
                    </p>
                    
                    <div className="flex gap-3">
                        <button onClick={() => setApptToCancel(null)} className="flex-1 py-3 rounded-xl font-bold border border-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Keep It</button>
                        <button onClick={confirmCancellation} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30">
                            Yes, Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 4. SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.8, opacity: 0 }} 
                    className={`w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden ${darkMode ? "bg-[#1A1A1A] text-white" : "bg-white"}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent pointer-events-none" />
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Request Sent!</h3>
                    <p className="text-sm opacity-60 mb-8">
                        Your appointment request has been sent. You will be notified once confirmed.
                    </p>
                    <button 
                        onClick={() => { setShowSuccessModal(false); setSelectedDoctor(null); setActiveTab('appointments'); }} 
                        className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white dark:text-black text-white font-bold hover:scale-[1.02] transition-transform"
                    >
                        View My Appointments
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 5. TOAST NOTIFICATION (NEW REPLACEMENT FOR ALERTS) */}
      <AnimatePresence>
        {toast && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${toast.type === 'success' ? "bg-green-600 text-white border-green-500" : "bg-red-600 text-white border-red-500"}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT WINDOW */}
      <AnimatePresence>
        {chatOpen && chatDoctor && (
             <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className={`fixed top-0 left-0 h-full w-full md:w-[400px] md:left-auto md:right-0 shadow-2xl z-[80] flex flex-col border-r ${darkMode ? "bg-[#120a10] border-white/10" : "bg-white border-pink-100"}`}>
                <div className={`p-4 border-b flex items-center gap-3 ${darkMode ? "bg-[#1a0b10] border-white/5" : "bg-pink-50/50 border-pink-50"}`}>
                    <img src={chatDoctor.image} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                    <div className="flex-1">
                        <h3 className="font-bold text-sm">{chatDoctor.name}</h3>
                        <p className={`text-[10px] font-bold ${chatDoctor.online ? "text-green-500" : "text-gray-400"}`}>{chatDoctor.online ? "Online" : "Offline"}</p>
                    </div>
                    <button onClick={() => setChatOpen(false)}><X className="w-5 h-5"/></button>
                </div>
                <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${darkMode ? "bg-black/20" : "bg-slate-50"}`}>
                     {chatMessages.length === 0 && <p className="text-center text-xs opacity-40 mt-10">Start conversation...</p>}
                     {chatMessages.map((msg) => {
                         const isMe = msg.senderId === user.uid; 
                         return (
                             <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                                 <div className={`p-3 rounded-2xl text-sm max-w-[75%] ${isMe ? "bg-pink-600 text-white rounded-br-none" : (darkMode ? "bg-[#1e1b20] text-gray-200" : "bg-white border text-slate-700")}`}>
                                     {msg.text}
                                 </div>
                             </div>
                         )
                     })}
                     <div ref={chatScrollRef} />
                </div>
                <div className={`p-3 border-t flex items-center gap-2 ${darkMode ? "bg-[#1a0b10]" : "bg-white"}`}>
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type message..." className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? "text-white" : "text-slate-900"}`} />
                    <button onClick={handleSendMessage} disabled={!chatInput.trim()} className="p-2.5 rounded-xl bg-pink-600 text-white hover:bg-pink-700 transition-colors"><Send className="w-4 h-4" /></button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}