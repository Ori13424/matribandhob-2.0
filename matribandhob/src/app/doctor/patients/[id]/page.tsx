"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Phone, Video, MessageCircle, FileText, 
  Activity, Calendar, MapPin, AlertTriangle, 
  CheckCircle, Baby, HeartPulse, Pill, 
  Thermometer, Weight, User, Droplets, Clock, X, ChevronRight,
  ShieldAlert, Stethoscope, Smile, Meh, Frown, Moon, Sun, Brain 
} from "lucide-react";
import { 
  doc, getDoc, collection, query, where, orderBy, getDocs, 
  serverTimestamp, onSnapshot, updateDoc, deleteDoc, collectionGroup, limit,
  addDoc 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

import DoctorChatDrawer from "@/features/doctor/components/patients/DoctorChatDrawer"; 

// Helper function to safely convert data to an array
const normalizeList = (input: any) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return input.split(',');
    return [String(input)];
};

// Helper for Mood Styling
const getMoodConfig = (mood: string) => {
    const m = mood?.toLowerCase() || "";
    
    // High Energy / Positive
    if (m.includes("happy") || m.includes("good") || m.includes("great") || m.includes("excited")) 
        return { icon: Smile, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-200", label: "Positive" };
    
    // Low Energy / Tired
    if (m.includes("tired") || m.includes("fatigue") || m.includes("sleepy") || m.includes("exhausted")) 
        return { icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-200", label: "Low Energy" };
    
    // Negative / Pain
    if (m.includes("sad") || m.includes("pain") || m.includes("bad") || m.includes("sick")) 
        return { icon: Frown, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-200", label: "Negative" };
    
    // Stress / Anxiety
    if (m.includes("anxious") || m.includes("stress") || m.includes("nervous")) 
        return { icon: Brain, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-200", label: "Anxious" };
    
    // Default
    return { icon: Meh, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200", label: "Neutral" };
};

export default function PatientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { darkMode } = useTheme();
  
  // Data States
  const [patient, setPatient] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [doctorMeds, setDoctorMeds] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]); 
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'appointments'>('overview');
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- APPOINTMENT MANAGEMENT STATES ---
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [actionNote, setActionNote] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [apptType, setApptType] = useState("General Checkup");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState(""); 
  const [declineReason, setDeclineReason] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [apptToDelete, setApptToDelete] = useState<any>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

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

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    if (!id) return;

    // 1. Patient Profile Listener
    const unsubPatient = onSnapshot(doc(db, "users", id as string), (docSnap) => {
      if (docSnap.exists()) {
        setPatient({ id: docSnap.id, ...docSnap.data() });
        setLoading(false); // Stop loading once profile is found
      }
    }, (error) => console.error("Patient Error:", error));

    // 2. Daily Logs Listener (Mental Health & Symptoms)
    // Matches structure: users -> {id} -> dailyLogs -> {dateDoc}
    const qDaily = query(
        collection(db, "users", id as string, "dailyLogs"), 
        orderBy("lastUpdated", "desc"), 
        limit(14)
    );
    const unsubDaily = onSnapshot(qDaily, (snapshot) => {
        setDailyLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Daily Logs Error:", error));

    // 3. Health Logs Listener (Vitals)
    const qLogs = query(collection(db, "users", id as string, "health_logs"), orderBy("timestamp", "desc"));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
        setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Reports Listener
    const qReports = query(collection(db, "reports"), where("patientId", "==", id), orderBy("createdAt", "desc"));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
        setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 5. Doctor Meds Listener
    const qMeds = query(collection(db, "users", id as string, "medicines")); 
    const unsubMeds = onSnapshot(qMeds, (snapshot) => {
        setDoctorMeds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Cleanup listeners on unmount
    return () => {
        unsubPatient();
        unsubDaily();
        unsubLogs();
        unsubReports();
        unsubMeds();
    };
  }, [id]);

  // --- AUTOMATED CRITICAL ALERT SYSTEM (SYNCED) ---
  useEffect(() => {
    const manageCriticalAlerts = async () => {
      // 1. Safety Checks: Need logs, patient data, and current user
      if (dailyLogs.length === 0 || !patient || !auth.currentUser) return;

      // 2. Focus on the most recent log
      const latestLog = dailyLogs[0]; 
      const logId = latestLog.id;

      // 3. Analyze Symptoms for keywords
      const symptoms = normalizeList(latestLog.symptoms).map((s: any) => String(s).toLowerCase());
      const criticalSymptoms = symptoms.filter((s: string) => s.includes('bleeding') || s.includes('fever'));
      const hasCriticalCondition = criticalSymptoms.length > 0;

      try {
        // 4. Check if a notification ALREADY exists for this specific log
        const notifQuery = query(
          collection(db, "notifications"), 
          where("relatedLogId", "==", logId)
        );
        const notifSnap = await getDocs(notifQuery);

        // 5. SYNC LOGIC
        if (hasCriticalCondition) {
          // A. Condition Exists...
          if (notifSnap.empty) {
            // ...but no notification? CREATE IT.
            await addDoc(collection(db, "notifications"), {
              recipientId: auth.currentUser.uid, 
              patientId: patient.id,
              patientName: patient.basicInfo?.fullName || "Patient",
              title: "Critical Symptom Alert",
              message: `Patient reported critical symptoms: ${criticalSymptoms.join(", ")}`,
              type: "critical", 
              isRead: false,
              timestamp: serverTimestamp(),
              relatedLogId: logId,
              link: `/doctor/patients/${patient.id}`
            });
            showToast(`Critical Alert Sent: ${criticalSymptoms.join(", ")}`, "error");
          } 
          // (If notification already exists, do nothing to avoid spamming)
        } else {
          // B. Condition does NOT Exist (e.g. removed by patient)...
          if (!notifSnap.empty) {
            // ...but notification still exists? DELETE IT.
            // (This handles the "remove if symptom removed" requirement)
            const deletePromises = notifSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log("Critical alert resolved/removed.");
          }
        }
      } catch (error) {
        console.error("Alert Sync Error:", error);
      }
    };

    manageCriticalAlerts();
  }, [dailyLogs, patient]); // Re-runs whenever the logs update (real-time)

  // F. Fetch Appointments (Also Real-time)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const q = query(collectionGroup(db, "appointments"), where("doctorId", "==", user.uid));
      
      const unsubSnap = onSnapshot(q, async (snapshot) => {
        const apptList = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const patientId = docSnap.ref.parent.parent?.id; 
          
          if (patientId !== id) return null; 

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

        const filteredAppts = apptList.filter(item => item !== null);
        filteredAppts.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        setAppointments(filteredAppts);
      });
      
      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, [id]);

  // --- APPOINTMENT ACTIONS ---
  const handleUpdateStatus = async (status: string) => {
    if (!selectedAppt) return;
    try {
      const updateData: any = {
        status: status,
        doctorNote: actionNote,
        updatedAt: serverTimestamp()
      };

      if (status === 'Confirmed' || status === 'Rescheduled') {
        if (!selectedDate || !selectedTime) { showToast("Please select Date & Time", "error"); return; }
        const dateStr = selectedDate.toISOString().split('T')[0];
        updateData.dateDisplay = `${selectedDate.toDateString()} at ${selectedTime}`;
        updateData.scheduledTimestamp = new Date(`${dateStr} ${selectedTime}`).toISOString();
        updateData.type = apptType;
        
        if (apptType.includes("Video")) {
            updateData.meetingLink = meetingLink;
            updateData.location = "Online";
        } else {
            updateData.location = location || "Doctor's Chamber";
            updateData.meetingLink = ""; 
        }
      }

      if (status === 'Declined') {
         if (!declineReason) { showToast("Please select a reason", "error"); return; }
         updateData.declineReason = declineReason;
      }

      await updateDoc(doc(db, selectedAppt.path), updateData);
      setSelectedAppt(null);
      resetForm();
      showToast(`Appointment ${status}`, "success");
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
      setMeetingLink(""); setLocation(""); setDeclineReason(""); setIsRescheduling(false);
      setApptType("General Checkup");
  };

  const openModal = (appt: any) => {
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

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!patient) return <div className="p-10 text-center text-slate-500">Patient not found</div>;

  // --- DATA MAPPING ---
  const basic = patient.basicInfo || {};
  const current = patient.currentHealth || {};
  const preg = patient.pregnancyDetails || {};
  const meds = patient.medsAndAllergies || {};
  const history = patient.medicalHistory || {};

  const chatPatient = {
      id: patient.id,
      name: basic.fullName || patient.displayName || "Patient",
      photoURL: patient.photoURL,
      isOnline: patient.isOnline || false
  };

  const conditionsList = normalizeList(history.conditions);
  const patientReportedMeds = normalizeList(meds.medications);

  return (
    <div className={`min-h-screen p-6 md:p-8 font-sans ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"}`}>
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className={`p-2.5 rounded-full border transition-all ${darkMode ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold">Patient Profile</h1>
                <p className="text-sm opacity-60">ID: {patient.id.slice(0, 8).toUpperCase()}</p>
            </div>
        </div>
        <button 
            onClick={() => setIsChatOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold flex items-center gap-2 hover:bg-teal-700 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
        >
            <MessageCircle className="w-4 h-4" /> Quick Chat
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR (Col-4) */}
        <div className="lg:col-span-4 space-y-6">
            <div className={`p-8 rounded-[2rem] border relative overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-32 h-32 rounded-full p-1.5 border-2 border-dashed border-teal-500/30">
                            {patient.photoURL ? (
                                <img src={patient.photoURL} className="w-full h-full rounded-full object-cover" alt="Profile" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-teal-600 text-white flex items-center justify-center text-4xl font-bold font-serif">
                                    {basic.fullName?.[0] || "P"}
                                </div>
                            )}
                        </div>
                        <span className={`absolute bottom-2 right-2 w-6 h-6 border-4 rounded-full ${patient.sosTriggered ? "bg-red-500 border-red-900 animate-pulse" : "bg-green-500 border-slate-900"}`}></span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{basic.fullName || "Unknown"}</h2>
                    <p className="text-sm opacity-50 mb-6">{preg.type || "Pregnancy"} • {basic.bloodGroup || "--"} Blood</p>
                    <div className="grid grid-cols-2 gap-3 w-full mb-8">
                        <ActionButton icon={Phone} label="Call" color="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(`tel:${basic.phone || patient.phone}`)} />
                        <ActionButton icon={Video} label="Video" color="bg-teal-600 hover:bg-teal-700" onClick={() => alert("Video Consult")} />
                    </div>
                    <div className={`w-full space-y-4 text-left p-5 rounded-2xl border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <InfoRow icon={Baby} label="Pregnancy" value={`Week ${preg.currentWeek || "?"}`} darkMode={darkMode} />
                        <InfoRow icon={Calendar} label="Due Date" value={preg.edd || basic.edd || "--"} darkMode={darkMode} />
                        <InfoRow icon={User} label="Age" value={basic.dob ? `${new Date().getFullYear() - new Date(basic.dob).getFullYear()} Years` : "--"} darkMode={darkMode} />
                        <InfoRow icon={MapPin} label="Location" value={patient.address || "Dhaka, BD"} darkMode={darkMode} />
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT CONTENT (Col-8) */}
        <div className="lg:col-span-8 space-y-8">
            {/* VITALS */}
            <div>
                <h3 className="text-xs font-bold uppercase opacity-50 mb-4 flex items-center gap-2 tracking-wider"><Activity className="w-4 h-4"/> Current Vitals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard label="Blood Pressure" value={current.bp || logs[0]?.bp || "--"} unit="mmHg" icon={HeartPulse} color="text-red-500" bg="bg-red-500/10" darkMode={darkMode} />
                    <VitalCard label="Weight" value={current.weight || basic.weight || "--"} unit="kg" icon={Weight} color="text-blue-500" bg="bg-blue-500/10" darkMode={darkMode} />
                    <VitalCard label="Hemoglobin" value={current.hemoglobin || "--"} unit="g/dL" icon={Droplets} color="text-purple-500" bg="bg-purple-500/10" darkMode={darkMode} />
                    <VitalCard label="Blood Sugar" value={current.bloodSugar || "--"} unit="mmol/L" icon={Thermometer} color="text-orange-500" bg="bg-orange-500/10" darkMode={darkMode} />
                </div>
            </div>

            {/* TABS */}
            <div className={`min-h-[400px] rounded-[2rem] border overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className={`flex border-b ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Medical Overview" icon={Activity} darkMode={darkMode} />
                    <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Prescriptions" icon={FileText} darkMode={darkMode} />
                    <TabButton active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} label="Appointments" icon={Calendar} darkMode={darkMode} />
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {/* --- OVERVIEW TAB --- */}
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* 1. Known Conditions */}
                                    <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500"/> Known Conditions</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {conditionsList.length > 0 ? 
                                                conditionsList.map((cond: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20">{cond.trim()}</span>
                                                ))
                                                : <span className="text-xs opacity-50">None reported</span>
                                            }
                                        </div>
                                    </div>

                                    {/* 2. Allergies */}
                                    <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-red-500"/> Allergies
                                        </h4>
                                        <div className="space-y-3">
                                            {meds.drugAllergies && (
                                                <div className="flex items-start gap-2">
                                                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded">Drug</span>
                                                    <span className="text-sm font-medium leading-tight">{meds.drugAllergies}</span>
                                                </div>
                                            )}
                                            {(meds.foodAllergies || meds.allergies) && (
                                                <div className="flex items-start gap-2">
                                                    <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase rounded">Food</span>
                                                    <span className="text-sm font-medium leading-tight">{meds.foodAllergies || meds.allergies}</span>
                                                </div>
                                            )}
                                            {!meds.drugAllergies && !meds.foodAllergies && !meds.allergies && (
                                                <p className="text-xs opacity-50">No known allergies</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Combined Medications Card */}
                                    <div className={`col-span-1 md:col-span-2 p-6 rounded-2xl border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                        <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-600"><Pill className="w-4 h-4"/></div>
                                            Medication Regimen
                                        </h4>
                                        
                                        {/* Doctor's Prescription */}
                                        <div className="mb-8">
                                            <h5 className="text-xs font-bold uppercase opacity-50 mb-3 flex items-center gap-2">
                                                <Stethoscope className="w-3 h-3"/> Prescribed by Doctor
                                            </h5>
                                            {doctorMeds.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {doctorMeds.map((med: any) => (
                                                        <div key={med.id} className={`p-4 rounded-xl border relative overflow-hidden ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h6 className="font-bold text-sm">{med.medicineName || med.name || "Medicine"}</h6>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-500/10 text-teal-500 rounded-full">{med.frequency || "Daily"}</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs opacity-70 flex items-center gap-1"><Clock className="w-3 h-3"/> {med.time || med.timing || "As directed"}</p>
                                                                <p className="text-xs opacity-70 flex items-center gap-1"><Calendar className="w-3 h-3"/> {med.duration || "Ongoing"}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl border border-dashed border-slate-700/30 text-center opacity-50 text-xs">
                                                    No active doctor prescriptions found.
                                                </div>
                                            )}
                                        </div>

                                        {/* Patient Reported */}
                                        <div>
                                            <h5 className="text-xs font-bold uppercase opacity-50 mb-3 flex items-center gap-2">
                                                <User className="w-3 h-3"/> Patient Reported Usage
                                            </h5>
                                            {patientReportedMeds.length > 0 ? (
                                                <div className="flex flex-wrap gap-3">
                                                    {patientReportedMeds.map((med: string, index: number) => (
                                                        <div key={index} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                                                            <Pill className="w-3 h-3 opacity-50" />
                                                            <span className="text-sm font-medium">{med.trim()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs opacity-50 italic">Patient has not reported any self-medication.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 4. NEW: Mental Health & Daily Log Viewer */}
                                    <div className={`col-span-1 md:col-span-2 p-6 rounded-2xl border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                        <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600"><Brain className="w-4 h-4"/></div>
                                            Daily Health Logs
                                        </h4>

                                        {dailyLogs.length > 0 ? (
                                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                                <AnimatePresence>
                                                    {dailyLogs.map((log: any, index: number) => {
                                                        const moodConfig = getMoodConfig(log.mood);
                                                        const Icon = moodConfig.icon;
                                                        
                                                        // Handle Dates
                                                        const lastUpdated = log.lastUpdated?.toDate ? new Date(log.lastUpdated.toDate()) : new Date();
                                                        const timeStr = lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                        
                                                        // Handle Symptoms Array
                                                        const symptoms = normalizeList(log.symptoms);

                                                        return (
                                                            <motion.div 
                                                                key={log.id || index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className={`min-w-[170px] p-5 rounded-3xl border flex flex-col items-center justify-between gap-4 snap-center relative overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-md"}`}
                                                            >
                                                                {/* Top: Date & Time */}
                                                                <div className="text-center w-full pb-3 border-b border-dashed border-opacity-20 border-gray-400">
                                                                    <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">
                                                                        {lastUpdated.toLocaleDateString('en-US', { weekday: 'short' })} • {timeStr}
                                                                    </p>
                                                                    <p className="text-lg font-black leading-none mt-1">
                                                                        {lastUpdated.getDate()} <span className="text-xs font-bold opacity-60 align-top">{lastUpdated.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                                    </p>
                                                                </div>

                                                                {/* Middle: Mood Icon */}
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${moodConfig.bg} ${moodConfig.color} ${moodConfig.border}`}>
                                                                        <Icon className="w-7 h-7" />
                                                                    </div>
                                                                    <p className={`text-sm font-bold ${moodConfig.color}`}>{log.mood || "No Data"}</p>
                                                                </div>

                                                                {/* Bottom: Symptoms */}
                                                                <div className="w-full">
                                                                    {symptoms.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1.5 justify-center">
                                                                           {symptoms.map((sym: string, i: number) => (
                                                                             <span key={i} className={`text-[10px] px-2 py-1 rounded-full font-bold capitalize truncate max-w-full ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                                                               {sym}
                                                                             </span>
                                                                           ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[10px] text-center opacity-30 italic">No symptoms reported</p>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50 border-2 border-dashed rounded-xl border-slate-700/30">
                                                <Brain className="w-8 h-8 mb-2 opacity-30"/>
                                                <p className="text-sm">No daily logs recorded yet.</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                                {reports.filter(r => r.type === 'Prescription').length === 0 ? <div className="text-center py-10 opacity-50">No prescriptions found.</div> : 
                                    reports.filter(r => r.type === 'Prescription').map((report) => (
                                        <div key={report.id} className={`p-4 rounded-xl border flex justify-between items-center ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-200"}`}>
                                            <div><h4 className="font-bold text-sm">{report.title}</h4><p className="text-xs opacity-50">{new Date(report.createdAt?.toDate()).toLocaleDateString()}</p></div>
                                            <a href={report.fileUrl} target="_blank" className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700">View PDF</a>
                                        </div>
                                    ))
                                }
                            </motion.div>
                        )}

                        {/* --- APPOINTMENT MANAGEMENT LIST --- */}
                        {activeTab === 'appointments' && (
                            <motion.div key="appointments" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                                {appointments.length === 0 ? (
                                    <div className="text-center py-10 opacity-50"><Calendar className="w-10 h-10 mx-auto mb-2"/> No appointment history found.</div>
                                ) : (
                                    appointments.map((appt) => (
                                        <div key={appt.id} onClick={() => openModal(appt)} className={`p-4 rounded-xl border cursor-pointer hover:border-teal-500/50 transition-all flex justify-between items-center ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-200"}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500"><Clock className="w-5 h-5"/></div>
                                                <div>
                                                    <h4 className="font-bold text-sm">{appt.type || "Consultation"}</h4>
                                                    <p className="text-xs opacity-50 flex items-center gap-2">
                                                        {appt.dateDisplay || (appt.createdAt?.toDate ? new Date(appt.createdAt.toDate()).toLocaleDateString() : "--")}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${appt.status === 'Requested' ? "bg-amber-500/20 text-amber-500" : "bg-green-500/20 text-green-500"}`}>{appt.status}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 opacity-50"/>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>

      {/* --- APPOINTMENT MODAL --- */}
      <AnimatePresence>
        {selectedAppt && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col ${darkMode ? "bg-[#1A1A1A] border border-white/10" : "bg-white"}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal-500" /> Manage Appointment</h3>
                        <button onClick={() => {setSelectedAppt(null); resetForm();}}><X className="w-5 h-5" /></button>
                    </div>

                    {selectedAppt.status === 'Requested' || isRescheduling ? (
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Type</label><div className="flex flex-wrap gap-2">{appointmentTypes.map(type => (<button key={type} onClick={() => setApptType(type)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${apptType === type ? "bg-teal-600 text-white border-teal-600" : "border-slate-700 hover:bg-slate-800"}`}>{type}</button>))}</div></div>
                            
                            <div><label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Date & Time</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{getNextDays().map((d, i) => (<button key={i} onClick={() => setSelectedDate(d)} className={`min-w-[60px] p-2 rounded-xl border flex flex-col items-center ${selectedDate?.toDateString() === d.toDateString() ? "bg-teal-600 text-white" : "border-slate-700"}`}><span className="text-[10px]">{d.toLocaleDateString('en-US', {weekday:'short'})}</span><span className="text-lg font-bold">{d.getDate()}</span></button>))}</div>
                                <div className="grid grid-cols-3 gap-2 mt-2">{timeSlots.map(t => (<button key={t} onClick={() => setSelectedTime(t)} className={`p-2 rounded-lg text-xs font-bold border ${selectedTime === t ? "bg-teal-600 text-white" : "border-slate-700"}`}>{t}</button>))}</div>
                            </div>

                            <button onClick={() => handleUpdateStatus('Confirmed')} className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 mt-4">Confirm Appointment</button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="opacity-60">This appointment is currently <strong>{selectedAppt.status}</strong>.</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setIsRescheduling(true)} className="px-6 py-2 rounded-full border border-teal-500 text-teal-500 font-bold">Reschedule</button>
                                <button onClick={() => setApptToDelete(selectedAppt)} className="px-6 py-2 rounded-full border border-red-500 text-red-500 font-bold">Delete</button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- QUICK CHAT --- */}
      <AnimatePresence>
        {isChatOpen && <DoctorChatDrawer patient={chatPatient} onClose={() => setIsChatOpen(false)} />}
      </AnimatePresence>

      {/* --- TOAST --- */}
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

    </div>
  );
}

// --- SUB COMPONENTS ---
function ActionButton({ icon: Icon, label, color, onClick }: any) {
    return <button onClick={onClick} className={`flex-1 py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${color}`}><Icon className="w-4 h-4" /> {label}</button>
}

function InfoRow({ icon: Icon, label, value, darkMode }: any) {
    return <div className="flex justify-between items-center text-sm"><span className={`flex items-center gap-3 font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}><Icon className="w-4 h-4 opacity-70" /> {label}</span><span className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{value}</span></div>
}

function VitalCard({ label, value, unit, icon: Icon, color, bg, darkMode }: any) {
    return <div className={`p-5 rounded-2xl border flex flex-col justify-between h-32 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}><div className="flex justify-between items-start"><div className={`p-2 rounded-xl ${bg} ${color}`}><Icon className="w-5 h-5" /></div><span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{label}</span></div><p className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{value} <span className="text-xs font-bold opacity-40 ml-0.5">{unit}</span></p></div>
}

function TabButton({ active, onClick, label, icon: Icon, darkMode }: any) {
    return <button onClick={onClick} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${active ? "border-teal-500 text-teal-500" : `border-transparent hover:bg-slate-800/50 ${darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}`}><Icon className="w-4 h-4" /> {label}</button>
}