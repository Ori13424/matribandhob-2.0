"use client";
import { useState, useEffect } from "react";
import { 
  collectionGroup, query, where, onSnapshot, 
  doc, updateDoc, deleteDoc, getDoc, serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";
import { 
  Calendar, Clock, CheckCircle, XCircle, 
  FileText, User, ChevronRight, X, Link as LinkIcon,
  MapPin, Trash2, Filter, Stethoscope, Video, AlertTriangle,
  ClipboardCheck, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppointmentsPage() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'scheduled' | 'history'>('requests');
  
  // --- FORM STATES ---
  const [actionNote, setActionNote] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [apptType, setApptType] = useState("General Checkup");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState(""); 
  const [declineReason, setDeclineReason] = useState("");
  
  // --- UI STATES ---
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false); // NEW: State for completion flow
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [apptToDelete, setApptToDelete] = useState<any>(null);

  // Constants
  const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"];
  const appointmentTypes = ["Video Consultation", "Physical Visit", "Follow-up", "Emergency", "Lab Review"];

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      
      const q = query(collectionGroup(db, "appointments"), where("doctorId", "==", user.uid));
      
      const unsubSnap = onSnapshot(q, async (snapshot) => {
        const apptList = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const patientId = docSnap.ref.parent.parent?.id; 
          let patientData = { name: "Unknown", week: "?", risk: "Normal", blood: "--" };
          
          if (patientId) {
            try {
                const pDoc = await getDoc(doc(db, "users", patientId));
                if (pDoc.exists()) {
                  const p = pDoc.data();
                  patientData = {
                      name: p.basicInfo?.fullName || p.fullName || "Mother",
                      week: p.pregnancyDetails?.currentWeek || 0,
                      risk: p.sosTriggered ? "SOS" : (p.isHighRisk ? "High" : "Normal"),
                      blood: p.basicInfo?.bloodGroup || "N/A"
                  };
                }
            } catch (e) { console.error(e); }
          }
          return { id: docSnap.id, patientId, ...data, patient: patientData, path: docSnap.ref.path };
        }));

        apptList.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAppointments(apptList);
        setLoading(false);
      });
      return () => unsubSnap();
    });
    return () => unsubAuth();
  }, []);

  // --- 2. ACTIONS ---
  const handleUpdateStatus = async (status: string) => {
    if (!selectedAppt) return;
    try {
      const updateData: any = {
        status: status,
        updatedAt: serverTimestamp()
      };

      // Handle Scheduling
      if (status === 'Confirmed' || status === 'Rescheduled') {
        if (!selectedDate || !selectedTime) { showToast("Please select Date & Time", "error"); return; }
        const dateStr = selectedDate.toISOString().split('T')[0];
        updateData.dateDisplay = `${selectedDate.toDateString()} at ${selectedTime}`;
        updateData.scheduledTimestamp = new Date(`${dateStr} ${selectedTime}`).toISOString();
        updateData.type = apptType;
        updateData.doctorNote = actionNote; // Note is optional
        
        if (apptType.includes("Video")) {
            updateData.meetingLink = meetingLink;
            updateData.location = "Online";
        } else {
            updateData.location = location || "Doctor's Chamber";
            updateData.meetingLink = ""; 
        }
      }

      // Handle Decline
      if (status === 'Declined') {
         if (!declineReason) { showToast("Please select a reason", "error"); return; }
         updateData.declineReason = declineReason;
      }

      // Handle Completion (Done)
      if (status === 'Done') {
          updateData.completedAt = serverTimestamp();
          // We save the completion note as 'doctorNote' or a specific 'summary' field
          if (actionNote) updateData.postConsultationSummary = actionNote; 
      }

      await updateDoc(doc(db, selectedAppt.path), updateData);
      
      showToast(status === 'Done' ? "Appointment Completed!" : `Appointment ${status}`, "success");
      setSelectedAppt(null);
      resetForm();

    } catch (e) { 
        console.error(e);
        showToast("Failed to update.", "error"); 
    }
  };

  const confirmDelete = async () => {
    if (!apptToDelete) return;
    try {
        await deleteDoc(doc(db, apptToDelete.path));
        setApptToDelete(null);
        setSelectedAppt(null);
        showToast("Record Deleted", "success");
    } catch (e) { showToast("Delete Failed", "error"); }
  };

  const resetForm = () => {
      setActionNote(""); setSelectedDate(null); setSelectedTime("");
      setMeetingLink(""); setLocation(""); setDeclineReason(""); 
      setIsRescheduling(false); setIsCompleting(false);
      setApptType("General Checkup");
  };

  const openModal = (appt: any) => {
      resetForm(); // Reset states before opening
      setSelectedAppt(appt);
      setApptType(appt.type || "General Checkup");
      if (appt.scheduledTimestamp) {
          const d = new Date(appt.scheduledTimestamp);
          setSelectedDate(d);
          setSelectedTime(d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
      }
      setMeetingLink(appt.meetingLink || "");
      setLocation(appt.location || "");
  };

  const filteredAppts = appointments.filter(a => {
    if (activeTab === 'requests') return a.status === 'Requested';
    if (activeTab === 'scheduled') return ['Confirmed', 'Rescheduled'].includes(a.status);
    return ['Done', 'Declined', 'Cancelled'].includes(a.status);
  });

  return (
    <div className={`min-h-screen p-6 md:p-8 font-sans ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Appointments 
              <span className={`text-xs px-2.5 py-1 rounded-full border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"}`}>
                  {filteredAppts.length}
              </span>
           </h1>
           <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Organize patient visits, video calls, and emergency requests.
           </p>
        </div>
        
        {/* TABS */}
        <div className={`flex p-1.5 rounded-2xl border ${darkMode ? "bg-[#1A1A1A] border-white/10" : "bg-white border-slate-200"}`}>
            {[
                { id: 'requests', label: 'Requests', icon: FileText },
                { id: 'scheduled', label: 'Upcoming', icon: Calendar },
                { id: 'history', label: 'History', icon: Clock }
            ].map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all
                    ${activeTab === tab.id 
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20" 
                        : "text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* APPOINTMENT LIST */}
      {loading ? (
        <div className="flex items-center justify-center h-64 opacity-50">Loading...</div>
      ) : filteredAppts.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-96 rounded-[2rem] border border-dashed
            ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
            <Filter className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-400 font-medium">No {activeTab} appointments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAppts.map((appt) => (
                <motion.div 
                    layout
                    key={appt.id}
                    onClick={() => openModal(appt)}
                    className={`group relative p-5 rounded-[1.5rem] border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between
                    ${darkMode 
                        ? "bg-[#1e1b20] border-white/5 hover:border-teal-500/30" 
                        : "bg-white border-slate-100 hover:border-teal-100 shadow-sm"}`}
                >
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                ${appt.status === 'Requested' ? "bg-amber-100 text-amber-700" :
                                appt.status === 'Confirmed' ? "bg-teal-100 text-teal-700" :
                                appt.status === 'Done' ? "bg-green-100 text-green-700" :
                                "bg-slate-100 text-slate-500"}`}>
                                {appt.status}
                            </div>
                            {appt.patient.risk === 'SOS' && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> SOS
                                </span>
                            )}
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold text-lg leading-tight truncate">{appt.patient.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                Week {appt.patient.week} • {appt.patient.blood}
                            </p>
                        </div>

                        <div className={`p-3 rounded-xl space-y-2.5 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                            <div className="flex items-center gap-2 text-xs font-medium opacity-80">
                                <Clock className="w-3.5 h-3.5 text-teal-500" />
                                <span className="truncate">{appt.dateDisplay || "Pending Time"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium opacity-80">
                                {appt.type?.includes("Video") ? <Video className="w-3.5 h-3.5 text-blue-500" /> : <Stethoscope className="w-3.5 h-3.5 text-teal-500" />}
                                <span className="truncate">{appt.type || "General Checkup"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed opacity-80 group-hover:opacity-100 transition-opacity flex justify-between items-center text-xs font-bold text-teal-600">
                         <span>
                             {appt.status === 'Requested' ? "Review Request" : 
                              appt.status === 'Confirmed' ? "Manage / Complete" : "View Details"}
                         </span>
                         <ChevronRight className="w-4 h-4" />
                    </div>
                </motion.div>
            ))}
        </div>
      )}

      {/* --- SPLIT MODAL --- */}
      <AnimatePresence>
        {selectedAppt && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={`w-full max-w-5xl h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row
                        ${darkMode ? "bg-[#1A1A1A] border border-white/10" : "bg-white"}`}
                >
                    {/* LEFT PANEL: Patient Info */}
                    <div className={`md:w-1/3 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden
                         ${darkMode ? "bg-[#121212]" : "bg-slate-50"}`}>
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl"><User className="w-8 h-8" /></div>
                                <div>
                                    <h2 className="text-2xl font-bold leading-none">{selectedAppt.patient.name}</h2>
                                    <p className="text-xs text-slate-400 mt-1">ID: {selectedAppt.id.slice(0,8)}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <InfoItem label="Pregnancy" value={`Week ${selectedAppt.patient.week}`} darkMode={darkMode} />
                                <InfoItem label="Blood Group" value={selectedAppt.patient.blood} darkMode={darkMode} />
                                <InfoItem label="Risk Status" value={selectedAppt.patient.risk} highlight={selectedAppt.patient.risk === 'SOS'} darkMode={darkMode} />
                            </div>
                        </div>
                        <div className="mt-6 space-y-4">
                            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
                                <span className="text-[10px] font-bold text-yellow-600 uppercase mb-1 block">Patient Request</span>
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">"{selectedAppt.notes || "No notes."}"</p>
                            </div>
                            
                            {/* Doctor Notes Display */}
                            {(selectedAppt.doctorNote || selectedAppt.postConsultationSummary) && (
                                <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/20">
                                    <span className="text-[10px] font-bold text-teal-600 uppercase mb-1 block">
                                        {selectedAppt.status === 'Done' ? "Consultation Summary" : "Your Message"}
                                    </span>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                        "{selectedAppt.postConsultationSummary || selectedAppt.doctorNote}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Actions */}
                    <div className="md:w-2/3 p-6 md:p-8 flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-teal-500" /> 
                                {isCompleting ? "Complete Appointment" : 
                                 selectedAppt.status === 'Requested' || isRescheduling ? "Configure Appointment" : 
                                 "Appointment Details"}
                            </h3>
                            <button onClick={() => {setSelectedAppt(null); resetForm();}} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        {/* MODE 1: REQUESTED or RESCHEDULING */}
                        {(selectedAppt.status === 'Requested' || isRescheduling) && !isCompleting ? (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* ... [Existing Form Fields remain same, just condensed for brevity] ... */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Appointment Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {appointmentTypes.map(type => (
                                            <button key={type} onClick={() => setApptType(type)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${apptType === type ? "bg-teal-600 text-white border-teal-600" : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"}`}>{type}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Date & Time</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                                        {getNextDays().map((d, i) => (
                                            <button key={i} onClick={() => setSelectedDate(d)} className={`min-w-[70px] p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${selectedDate?.toDateString() === d.toDateString() ? "bg-teal-600 text-white border-teal-600 shadow-md" : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                                                <span className="text-[10px] opacity-70">{d.toLocaleDateString('en-US', {weekday:'short'})}</span>
                                                <span className="text-lg font-bold">{d.getDate()}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {timeSlots.map(t => (
                                            <button key={t} onClick={() => setSelectedTime(t)} className={`p-2 rounded-lg text-xs font-bold border transition-all ${selectedTime === t ? "bg-teal-600 text-white border-teal-600" : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"}`}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">{apptType.includes("Video") ? "Video Meeting Link" : "Physical Location"}</label>
                                    {apptType.includes("Video") ? (
                                        <div className="relative"><LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input type="text" placeholder="Zoom / Meet URL" value={meetingLink} onChange={e=>setMeetingLink(e.target.value)} className={`w-full pl-9 p-3 rounded-xl text-xs font-medium outline-none border focus:border-teal-500 ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`} /></div>
                                    ) : (
                                        <div className="relative"><MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input type="text" placeholder="e.g. Room 302, City Hospital" value={location} onChange={e=>setLocation(e.target.value)} className={`w-full pl-9 p-3 rounded-xl text-xs font-medium outline-none border focus:border-teal-500 ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`} /></div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Note (Optional)</label>
                                    <textarea className={`w-full p-4 rounded-xl text-sm outline-none border focus:border-teal-500 min-h-[80px] ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`} placeholder="Instructions..." value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button onClick={() => handleUpdateStatus('Confirmed')} className="flex-1 py-3.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xl shadow-teal-500/20 active:scale-95 transition-all">{isRescheduling ? "Update Booking" : "Confirm Appointment"}</button>
                                    {isRescheduling && <button onClick={() => setIsRescheduling(false)} className="px-6 py-3.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Cancel</button>}
                                </div>
                                {!isRescheduling && (
                                    <div className="pt-2 border-t border-dashed">
                                        <select onChange={(e) => { setDeclineReason(e.target.value); if(e.target.value) handleUpdateStatus('Declined'); }} className="w-full text-xs text-red-500 bg-transparent border-none outline-none cursor-pointer hover:underline text-center">
                                            <option value="">Or Decline Request...</option>
                                            <option value="Slot Unavailable">Slot Unavailable</option>
                                            <option value="Doctor Unavailable">I am Unavailable</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        ) : isCompleting ? (
                            /* MODE 2: COMPLETING APPOINTMENT (New Feature) */
                            <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                                <div className="flex-1 space-y-4">
                                    <div className={`p-4 rounded-xl flex items-center gap-4 ${darkMode ? "bg-teal-900/20 border border-teal-900/30" : "bg-teal-50 border border-teal-100"}`}>
                                        <ClipboardCheck className="w-8 h-8 text-teal-600" />
                                        <div>
                                            <h4 className="font-bold text-teal-700 dark:text-teal-400">Marking as Completed</h4>
                                            <p className="text-xs opacity-70">This will move the appointment to history.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Post-Consultation Summary (Optional)</label>
                                        <textarea 
                                            className={`w-full p-5 rounded-xl text-sm outline-none border focus:border-teal-500 min-h-[150px] resize-none ${darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"}`} 
                                            placeholder="Enter diagnosis, prescription summary, or next steps for the patient..." 
                                            value={actionNote} 
                                            onChange={(e) => setActionNote(e.target.value)} 
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => {setIsCompleting(false); setActionNote("");}} className="px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">Back</button>
                                    <button onClick={() => handleUpdateStatus('Done')} className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Confirm Completion
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* MODE 3: VIEW STATUS SUMMARY */
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-80">
                                <div className={`p-4 rounded-full 
                                    ${selectedAppt.status === 'Confirmed' ? "bg-teal-100 text-teal-600" : 
                                      selectedAppt.status === 'Done' ? "bg-green-100 text-green-600" :
                                      "bg-red-100 text-red-600"}`}>
                                    {selectedAppt.status === 'Confirmed' ? <CheckCircle className="w-10 h-10" /> : 
                                     selectedAppt.status === 'Done' ? <ClipboardCheck className="w-10 h-10" /> :
                                     <AlertTriangle className="w-10 h-10" />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{selectedAppt.status}</h3>
                                    <p className="text-sm mt-1">{selectedAppt.dateDisplay}</p>
                                </div>

                                {/* ACTION BUTTONS FOR CONFIRMED APPOINTMENTS */}
                                {selectedAppt.status === 'Confirmed' && (
                                    <div className="flex flex-col w-full max-w-xs gap-3 pt-6">
                                        <button 
                                            onClick={() => { setActionNote(""); setIsCompleting(true); }}
                                            className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Complete Visit <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsRescheduling(true)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold hover:bg-slate-50 dark:hover:bg-white/5 text-xs">Reschedule</button>
                                            <button onClick={() => setApptToDelete(selectedAppt)} className="flex-1 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 text-xs">Cancel</button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* ACTIONS FOR HISTORY ITEMS */}
                                {selectedAppt.status !== 'Confirmed' && (
                                    <div className="flex gap-3 pt-6">
                                         <button onClick={() => setApptToDelete(selectedAppt)} className="px-6 py-2 rounded-full border border-red-500 text-red-500 font-bold hover:bg-red-50">Delete Record</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- TOAST NOTIFICATION --- */}
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

      {/* --- DELETE CONFIRM MODAL --- */}
      <AnimatePresence>
        {apptToDelete && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${darkMode ? "bg-[#1A1A1A] text-white" : "bg-white"}`}>
                    <h3 className="text-xl font-bold text-center mb-2">Delete Record?</h3>
                    <p className="text-sm text-center opacity-60 mb-6">This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setApptToDelete(null)} className="flex-1 py-3 rounded-xl font-bold border border-transparent hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
                        <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700">Delete</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper UI Component
const InfoItem = ({ label, value, highlight, darkMode }: any) => (
    <div className={`flex justify-between p-3 rounded-xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-slate-100"}`}>
        <span className="text-xs font-bold text-slate-500">{label}</span>
        <span className={`text-sm font-bold ${highlight ? "text-red-500 animate-pulse" : ""}`}>{value}</span>
    </div>
);