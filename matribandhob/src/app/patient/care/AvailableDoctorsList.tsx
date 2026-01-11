"use client";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { MessageSquare, Stethoscope, Video } from "lucide-react";
import MotherChatWindow from "./MotherChatWindow"; // We build this next

export default function AvailableDoctorsList() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  // --- FETCH ONLINE DOCTORS ---
  useEffect(() => {
    // Query: Role is doctor
    // (Note: In production, add 'isOnline == true' to query if your index allows, otherwise filter client-side)
    const q = query(
      collection(db, "users"),
      where("role", "==", "doctor")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctors(docs);
    });

    return () => unsubscribe();
  }, []);

  const handleStartChat = (doctor: any) => {
    if (!auth.currentUser) return;
    // Generate the shared Chat ID
    const chatId = [auth.currentUser.uid, doctor.id].sort().join("_");
    setSelectedDoctor({ ...doctor, chatId });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                  <Stethoscope className="w-6 h-6" />
                </div>
                {/* Online Indicator */}
                {doc.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{doc.fullName || "Dr. Unknown"}</h4>
                <p className="text-xs text-slate-500">{doc.specialization || "Gynecologist"}</p>
                {doc.isOnline ? (
                   <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">Online Now</span>
                ) : (
                   <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">Offline</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleStartChat(doc)}
                className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-600/20 active:scale-95 transition-transform"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {doctors.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-400">
            No doctors found in the directory.
          </div>
        )}
      </div>

      {/* CHAT POPUP */}
      {selectedDoctor && (
        <MotherChatWindow 
          doctor={selectedDoctor} 
          onClose={() => setSelectedDoctor(null)} 
        />
      )}
    </>
  );
}