"use client";
import { useState } from "react";
import { X, User, Mail, Phone, Calendar, HeartPulse, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AddPatientModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    age: "",
    bloodGroup: "A+",
    currentWeek: "1",
    edd: "",
    isHighRisk: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Generate a temporary ID (In real app, use Auth UID)
      // Since we can't create Auth user without logging out doctor, 
      // we create the DB profile first. Mother can "claim" it later via email.
      const newPatientRef = doc(collection(db, "users"));
      
      await setDoc(newPatientRef, {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        role: "mother", // Critical for filtering
        isOnline: false,
        createdAt: serverTimestamp(),
        basicInfo: {
            fullName: formData.fullName,
            bloodGroup: formData.bloodGroup,
            age: formData.age
        },
        pregnancyDetails: {
            currentWeek: parseInt(formData.currentWeek),
            edd: formData.edd
        },
        isHighRisk: formData.isHighRisk,
        sosTriggered: false
      });

      alert("Patient Profile Created Successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to create patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Add New Patient</h2>
            <p className="text-xs text-slate-500">Create a profile for monitoring</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-transparent focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                    <User className="w-4 h-4 text-slate-400" />
                    <input required type="text" placeholder="Jane Doe" className="flex-1 bg-transparent text-sm outline-none" 
                        value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Phone</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-transparent focus-within:bg-white focus-within:border-teal-500 transition-all">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <input required type="tel" placeholder="+880..." className="flex-1 bg-transparent text-sm outline-none" 
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Email Address (Login ID)</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-transparent focus-within:bg-white focus-within:border-teal-500 transition-all">
                <Mail className="w-4 h-4 text-slate-400" />
                <input required type="email" placeholder="patient@example.com" className="flex-1 bg-transparent text-sm outline-none" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Pregnancy Week</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-transparent focus-within:bg-white focus-within:border-teal-500 transition-all">
                    <HeartPulse className="w-4 h-4 text-slate-400" />
                    <input type="number" min="1" max="42" placeholder="Week 12" className="flex-1 bg-transparent text-sm outline-none" 
                        value={formData.currentWeek} onChange={e => setFormData({...formData, currentWeek: e.target.value})} />
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Expected Date (EDD)</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-transparent focus-within:bg-white focus-within:border-teal-500 transition-all">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input type="date" className="flex-1 bg-transparent text-sm outline-none" 
                        value={formData.edd} onChange={e => setFormData({...formData, edd: e.target.value})} />
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
             <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-500">Blood Group</label>
                <select className="w-full px-3 py-2 bg-slate-100 rounded-xl text-sm outline-none"
                    value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
             </div>
             <div className="flex-1 flex items-center gap-2 mt-5">
                <input type="checkbox" id="highRisk" className="w-4 h-4 text-teal-600 rounded" 
                    checked={formData.isHighRisk} onChange={e => setFormData({...formData, isHighRisk: e.target.checked})} />
                <label htmlFor="highRisk" className="text-sm font-bold text-slate-700 cursor-pointer">Mark as High Risk</label>
             </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
             <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}