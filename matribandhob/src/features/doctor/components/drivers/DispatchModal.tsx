"use client";
import { useState } from "react";
import { X, MapPin, AlertTriangle, User, Ambulance, Navigation, Send, CheckCircle2, Loader2 } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DispatchModal({ driver, patients, onClose }: any) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState<any>(null); 
  const [priority, setPriority] = useState("standard");
  
  // UI States
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle"); 
  const [errorMessage, setErrorMessage] = useState("");

  // Sort: SOS patients first
  const sortedPatients = [...patients].sort((a, b) => {
    if (a.sosTriggered && !b.sosTriggered) return -1;
    if (!a.sosTriggered && b.sosTriggered) return 1;
    return 0;
  });

  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    const patient = patients.find((p: any) => p.id === patientId);
    if (patient) {
      if (patient.location) {
          setPickupCoordinates(patient.location);
          setPickupAddress(`GPS: ${patient.location.lat.toFixed(5)}, ${patient.location.lng.toFixed(5)}`);
      } else {
          setPickupCoordinates(null);
          setPickupAddress(patient.address || "");
      }
      setPriority(patient.sosTriggered ? "critical" : "standard");
    }
  };

  const handleDispatch = async () => {
    if (!selectedPatientId || !pickupAddress) return;
    setStatus("submitting");

    try {
      const patient = patients.find((p: any) => p.id === selectedPatientId);
      
      await addDoc(collection(db, "trip_requests"), {
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        vehicleType: driver.vehicleType,
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone || "N/A",
        pickupAddress: pickupAddress,
        pickupCoordinates: pickupCoordinates,
        status: "pending", 
        priority: priority,
        createdAt: serverTimestamp(),
        createdBy: "doctor_portal"
      });

      setStatus("success");
      setTimeout(() => { onClose(); }, 2000); // Auto close

    } catch (error: any) {
      console.error("Error dispatching:", error);
      setErrorMessage("Connection failed. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Request Sent!</h2>
                <p className="text-sm text-slate-500">Driver has been notified.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Dispatch Request</h2>
            <p className="text-xs text-slate-500">Assign {driver.vehicleType} to patient</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {status === 'error' && (
             <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {errorMessage}
             </div>
          )}

          <div className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Ambulance className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Unit Selected</p>
              <h3 className="font-bold text-slate-800">{driver.name}</h3>
              <p className="text-xs text-slate-500">{driver.vehicleType} • {driver.plateNumber}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              Select Patient <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full">Sorted by Urgency</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {sortedPatients.map((patient: any) => (
                <div 
                  key={patient.id}
                  onClick={() => handlePatientChange(patient.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3
                    ${selectedPatientId === patient.id ? "border-teal-500 ring-1 ring-teal-500 bg-teal-50" : "border-slate-100 hover:border-slate-300 bg-white"}`}
                >
                   {patient.sosTriggered ? (
                     <div className="p-2 bg-red-100 text-red-600 rounded-lg animate-pulse"><AlertTriangle className="w-4 h-4" /></div>
                   ) : (
                     <div className="p-2 bg-slate-100 text-slate-500 rounded-lg"><User className="w-4 h-4" /></div>
                   )}
                   <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-slate-800">{patient.name}</p>
                        {patient.sosTriggered && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">SOS ACTIVE</span>}
                      </div>
                      <p className="text-xs text-slate-500">{patient.location ? "GPS Location Available" : "Manual Address"}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Pickup Location</label>
            <div className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl transition-colors ${pickupCoordinates ? "bg-green-50 border-green-200" : "bg-slate-50 focus-within:bg-white focus-within:border-teal-500"}`}>
              <MapPin className={`w-4 h-4 ${pickupCoordinates ? "text-green-600" : "text-slate-400"}`} />
              <input 
                type="text" 
                value={pickupAddress}
                onChange={(e) => { setPickupAddress(e.target.value); setPickupCoordinates(null); }}
                placeholder="Select a patient or type address..."
                className="w-full bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-slate-50 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm">Cancel</button>
            <button 
                onClick={handleDispatch}
                disabled={!selectedPatientId || !pickupAddress || status === 'submitting'}
                className="flex-[2] py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-slate-900/20 transition-all active:scale-95"
            >
                {status === 'submitting' ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Confirm Dispatch</>}
            </button>
        </div>
      </div>
    </div>
  );
}