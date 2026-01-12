"use client";
import { useState, useEffect, useRef } from "react";
import { 
  MapPin, Navigation, Phone, Clock, AlertTriangle, 
  User, ArrowRight, Volume2, XCircle, CheckCircle, Car, ShieldCheck 
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, where, onSnapshot, 
  updateDoc, doc, serverTimestamp 
} from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";
import { onAuthStateChanged } from "firebase/auth";

// --- CUSTOM MODAL COMPONENTS ---
const ModalOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
    {children}
  </div>
);

export default function DriverDashboard() {
  const { darkMode } = useTheme();

  // --- 1. STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Data States
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  
  // UI Interaction States
  const [viewRequest, setViewRequest] = useState<any>(null); 
  const [alertMessage, setAlertMessage] = useState<{title: string, msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("Initializing GPS...");

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevReqCount = useRef(0);

  // --- 2. AUTH & AUDIO SETUP ---
  useEffect(() => {
    const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
    audio.volume = 1.0;
    audioRef.current = audio;

    const unsub = onAuthStateChanged(auth, (user) => {
      if(user) setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const playSound = () => {
    if (soundEnabled && audioRef.current) audioRef.current.play().catch(e => console.log("Audio block:", e));
  };

  // --- 3. GPS TRACKING ---
  useEffect(() => {
    if (!("geolocation" in navigator)) { setGpsStatus("GPS Not Supported"); return; }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setGpsStatus("GPS Active");

        if (currentUser) {
           await updateDoc(doc(db, "users", currentUser.uid), {
             currentLocation: { lat: latitude, lng: longitude },
             lastActive: serverTimestamp()
           });
           
           if (activeTrip) {
             await updateDoc(doc(db, "trip_requests", activeTrip.id), {
               driverLocation: { lat: latitude, lng: longitude }
             });
           }
        }
      },
      (err) => setGpsStatus(`GPS Error: ${err.message}`),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentUser, activeTrip]);

  // --- 4. FIREBASE LISTENERS ---
  useEffect(() => {
    if (!currentUser) return;

    // A. LISTEN FOR PENDING REQUESTS
    const qPending = query(
      collection(db, "trip_requests"), 
      where("driverId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubPending = onSnapshot(qPending, (snap) => {
      const reqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (reqs.length > prevReqCount.current) playSound();
      prevReqCount.current = reqs.length;
      
      setIncomingRequests(reqs);

      // Handle Real-time Cancellation
      if (viewRequest) {
        const stillExists = reqs.find(r => r.id === viewRequest.id);
        if (!stillExists) {
            setViewRequest(null); 
            setAlertMessage({ title: "Request Cancelled", msg: "The doctor cancelled this request.", type: "error" });
        }
      }
    });

    // B. LISTEN FOR ACTIVE TRIP
    const qActive = query(
        collection(db, "trip_requests"),
        where("driverId", "==", currentUser.uid),
        where("status", "in", ["accepted", "arrived", "started"])
    );

    const unsubActive = onSnapshot(qActive, (snap) => {
        if (!snap.empty) {
            setActiveTrip({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
            setActiveTrip(null);
        }
    });

    return () => { unsubPending(); unsubActive(); };
  }, [currentUser, soundEnabled, viewRequest]);

  // --- 5. ACTIONS ---
  const handleAccept = async (req: any) => {
    if (!location) {
        setAlertMessage({ title: "GPS Required", msg: "Waiting for location lock...", type: "error" });
        return;
    }
    try {
      await updateDoc(doc(db, "trip_requests", req.id), {
        status: "accepted",
        driverLocation: location,
        acceptedAt: serverTimestamp()
      });
      setViewRequest(null);
      setAlertMessage({ title: "Trip Started", msg: "Navigate to pickup location.", type: "success" });
    } catch (e) {
      console.error(e);
      setAlertMessage({ title: "Error", msg: "Could not accept trip.", type: "error" });
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeTrip) return;
    try {
        await updateDoc(doc(db, "trip_requests", activeTrip.id), { status: newStatus });
        if(newStatus === 'completed') {
            setAlertMessage({ title: "Ride Completed", msg: "Good job! Back to queue.", type: "success" });
        }
    } catch (e) { console.error(e); }
  };

  // --- STYLES ---
  const cardClass = darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const btnPrimary = "bg-slate-900 text-white hover:bg-slate-800";
  const btnSuccess = "bg-green-600 text-white hover:bg-green-700";

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {!soundEnabled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-3 text-center cursor-pointer font-bold shadow-lg" onClick={() => { setSoundEnabled(true); playSound(); }}>
           <Volume2 className="inline w-4 h-4 mr-2" /> Tap here to enable sound alerts
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 space-y-6 pt-12">
        
        {/* HEADER STATS */}
        <div className="grid grid-cols-2 gap-4">
           <div className={`p-5 rounded-2xl border flex items-center gap-3 ${cardClass}`}>
              <div className={`p-3 rounded-full ${location ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                 <Navigation className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs opacity-60 font-bold uppercase">GPS Signal</p>
                 <p className="text-sm font-bold truncate">{gpsStatus}</p>
              </div>
           </div>
           <div className={`p-5 rounded-2xl border flex items-center gap-3 ${cardClass}`}>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                 <Clock className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs opacity-60 font-bold uppercase">Queue</p>
                 <p className="text-sm font-bold">{incomingRequests.length} Pending</p>
              </div>
           </div>
        </div>

        {/* ACTIVE TRIP */}
        {activeTrip ? (
           <div className="rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className={`${activeTrip.status === 'started' ? "bg-blue-600" : "bg-green-600"} p-6 text-white`}>
                 <div className="flex justify-between items-center mb-2">
                    <span className="font-bold uppercase tracking-wider text-xs opacity-80">Current Mission</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold capitalize">{activeTrip.status}</span>
                 </div>
                 <h2 className="text-3xl font-bold">{activeTrip.patientName}</h2>
                 <p className="opacity-90 text-sm flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3" /> {activeTrip.patientPhone}
                 </p>
              </div>
              
              <div className={`p-6 ${cardClass}`}>
                 <div className="flex items-start gap-4 mb-6">
                    <MapPin className="w-6 h-6 text-slate-400 mt-1" />
                    <div>
                        <p className="text-xs font-bold opacity-50 uppercase">Destination</p>
                        {/* SAFE NAVIGATION FIX HERE: Handle missing address safely */}
                        <p className="font-medium text-lg leading-tight mt-1">{activeTrip.pickupAddress || "Location Unknown"}</p>
                        <a 
                           href={`https://www.google.com/maps/dir/?api=1&destination=${activeTrip.pickupCoordinates?.lat},${activeTrip.pickupCoordinates?.lng}`}
                           target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-blue-500 hover:underline"
                        >
                            <Navigation className="w-4 h-4" /> Open Navigation
                        </a>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                    {activeTrip.status === 'accepted' && (
                        <button onClick={() => handleUpdateStatus('arrived')} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg ${btnSuccess}`}>
                            I Have Arrived
                        </button>
                    )}
                    {activeTrip.status === 'arrived' && (
                        <button onClick={() => handleUpdateStatus('started')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg">
                            Start Trip to Hospital
                        </button>
                    )}
                    {activeTrip.status === 'started' && (
                        <button onClick={() => handleUpdateStatus('completed')} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-lg hover:bg-slate-700 shadow-lg">
                            Complete Ride
                        </button>
                    )}
                 </div>
              </div>
           </div>
        ) : (
           /* INCOMING REQUESTS */
           <div className="space-y-4">
              <h3 className="font-bold text-lg opacity-70 px-2">Incoming Requests</h3>
              {incomingRequests.length === 0 ? (
                 <div className="text-center py-12 opacity-40">
                    <Car className="w-12 h-12 mx-auto mb-2" />
                    <p>No requests available</p>
                 </div>
              ) : (
                 incomingRequests.map((req) => (
                    <div key={req.id} className={`p-5 rounded-2xl border transition-all ${cardClass} ${req.priority === 'critical' ? "border-red-500/50 shadow-red-500/10" : ""}`}>
                        <div className="flex justify-between items-start">
                           <div className="flex gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${req.priority === 'critical' ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-600"}`}>
                                 {req.priority === 'critical' ? <AlertTriangle className="w-6 h-6"/> : <User className="w-6 h-6"/>}
                              </div>
                              <div>
                                 <h4 className="font-bold text-lg">{req.priority === 'critical' ? "Emergency SOS" : "Standard Pickup"}</h4>
                                 <p className="text-sm opacity-60">Patient: {req.patientName}</p>
                                 
                                 {/* --- FIX: ADDED NULL CHECK HERE --- */}
                                 <p className="text-xs font-mono mt-1 opacity-50">
                                     {(req.pickupAddress || "").substring(0, 30)}...
                                 </p>
                                 {/* --------------------------------- */}
                              </div>
                           </div>
                           <button onClick={() => setViewRequest(req)} className={`px-4 py-2 rounded-lg font-bold text-sm ${btnPrimary}`}>
                              View
                           </button>
                        </div>
                    </div>
                 ))
              )}
           </div>
        )}
      </div>

      {/* ACCEPT MODAL */}
      {viewRequest && (
         <ModalOverlay>
            <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}>
               <div className="p-6 text-center border-b border-slate-100/10">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${viewRequest.priority==='critical'?"bg-red-100 text-red-600":"bg-slate-100 text-slate-600"}`}>
                     {viewRequest.priority==='critical' ? <AlertTriangle className="w-8 h-8"/> : <User className="w-8 h-8"/>}
                  </div>
                  <h2 className="text-2xl font-bold">{viewRequest.patientName}</h2>
                  <p className="opacity-60 text-sm">Requested by Doctor</p>
               </div>
               
               <div className="p-6 space-y-4">
                  <div className={`p-4 rounded-xl ${darkMode?"bg-slate-900":"bg-slate-50"}`}>
                     <p className="text-xs font-bold opacity-50 uppercase mb-1">Pickup Location</p>
                     <p className="font-medium flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 shrink-0 text-red-500" />
                        {viewRequest.pickupAddress || "Location Unknown"}
                     </p>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setViewRequest(null)} className="flex-1 py-3 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-slate-500">
                        Decline
                     </button>
                     <button onClick={() => handleAccept(viewRequest)} className={`flex-[2] py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 ${viewRequest.priority==='critical'?"bg-red-600 text-white hover:bg-red-700":"bg-green-600 text-white hover:bg-green-700"}`}>
                        Accept Ride <ArrowRight className="w-4 h-4"/>
                     </button>
                  </div>
               </div>
            </div>
         </ModalOverlay>
      )}

      {/* STATUS MODAL */}
      {alertMessage && (
         <ModalOverlay>
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-xl text-center ${darkMode ? "bg-slate-800" : "bg-white"}`}>
               <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 
                  ${alertMessage.type==='success'?"bg-green-100 text-green-600": alertMessage.type==='error'?"bg-red-100 text-red-600":"bg-blue-100 text-blue-600"}`}>
                  {alertMessage.type==='success' ? <CheckCircle className="w-8 h-8"/> : 
                   alertMessage.type==='error' ? <XCircle className="w-8 h-8"/> : <ShieldCheck className="w-8 h-8"/>}
               </div>
               <h3 className="text-xl font-bold mb-1">{alertMessage.title}</h3>
               <p className="text-sm opacity-60 mb-6">{alertMessage.msg}</p>
               <button onClick={() => setAlertMessage(null)} className={`w-full py-3 rounded-xl font-bold text-white ${btnPrimary}`}>
                  Dismiss
               </button>
            </div>
         </ModalOverlay>
      )}

    </div>
  );
}