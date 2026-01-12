"use client";
import { useState, useEffect } from "react";
import { 
  User, Ambulance, Save, Loader2, Hospital, Mail, CreditCard, 
  FileText, Upload, Bell, Map, Shield, Lock, Trash2, CheckCircle, AlertCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";

export default function DriverSettings() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Expanded Form State
  const [formData, setFormData] = useState({
    // Personal
    fullName: "",            
    phone: "",              
    email: "",              
    licenseNumber: "",      
    
    // Vehicle
    ambulanceNumber: "",    
    hospitalAffiliation: "", 
    vehicleType: "Non-AC",

    // Preferences (New)
    isInterDistrict: false,
    notificationsEnabled: true,
  });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
        if (!auth.currentUser) return;
        try {
            const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (snap.exists()) {
                const data = snap.data();
                
                setFormData({
                    fullName: data.displayName || "", 
                    phone: data.phone || "",
                    email: data.email || auth.currentUser.email || "",
                    licenseNumber: data.licenseNumber || "",
                    ambulanceNumber: data.ambulanceNumber || "", 
                    hospitalAffiliation: data.hospitalAffiliation || "",
                    vehicleType: data.vehicleType || "Non-AC",
                    isInterDistrict: data.isInterDistrict ?? false,
                    notificationsEnabled: data.notificationsEnabled ?? true,
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setFetching(false);
        }
    };
    fetchProfile();
  }, []);

  // --- 2. SAVE DATA ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (auth.currentUser) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                displayName: formData.fullName,
                phone: formData.phone,
                licenseNumber: formData.licenseNumber,
                ambulanceNumber: formData.ambulanceNumber,
                hospitalAffiliation: formData.hospitalAffiliation,
                vehicleType: formData.vehicleType,
                isInterDistrict: formData.isInterDistrict,
                notificationsEnabled: formData.notificationsEnabled
            });
            alert("Settings Saved Successfully!");
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update settings.");
    }
    setLoading(false);
  };

  // --- STYLING HELPERS ---
  const containerText = darkMode ? "text-slate-100" : "text-slate-900";
  const subText = darkMode ? "text-slate-400" : "text-slate-500";
  const cardClass = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100";
  const inputClass = darkMode 
    ? "bg-slate-950 text-white border-slate-800 focus:ring-slate-600 placeholder:text-slate-600" 
    : "bg-slate-50 text-slate-900 border-transparent focus:ring-blue-500";
  const labelClass = "block text-xs font-bold text-slate-400 uppercase mb-1";

  if (fetching) {
      return (
          <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className={`text-3xl font-black mb-2 ${containerText}`}>Settings & Profile</h1>
        <p className={`${subText}`}>Manage your account, preferences, and documents</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT COLUMN: MAIN FORMS */}
         <div className="lg:col-span-2 space-y-6">
             {/* Personal Info Card */}
             <div className={`p-6 rounded-3xl shadow-sm border ${cardClass}`}>
                <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${containerText}`}>
                    <User className="w-5 h-5 text-blue-500" /> Personal Info
                </h2>
                <div className="grid gap-4">
                    <div>
                        <label className={labelClass}>Full Name (Display Name)</label>
                        <input 
                           required
                           type="text"
                           value={formData.fullName} 
                           onChange={e => setFormData({...formData, fullName: e.target.value})}
                           className={`w-full p-3 rounded-xl outline-none border focus:ring-2 ${inputClass}`}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <input 
                               required
                               type="tel"
                               value={formData.phone} 
                               onChange={e => setFormData({...formData, phone: e.target.value})}
                               className={`w-full p-3 rounded-xl outline-none border focus:ring-2 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <div className="relative opacity-60">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                <input 
                                   disabled
                                   value={formData.email} 
                                   className={`w-full pl-10 p-3 rounded-xl outline-none border cursor-not-allowed ${inputClass}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Vehicle Info Card */}
             <div className={`p-6 rounded-3xl shadow-sm border ${cardClass}`}>
                <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${containerText}`}>
                    <Ambulance className="w-5 h-5 text-red-500" /> Vehicle Details
                </h2>
                <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Number Plate</label>
                            <input 
                               required
                               value={formData.ambulanceNumber} 
                               onChange={e => setFormData({...formData, ambulanceNumber: e.target.value})}
                               className={`w-full p-3 rounded-xl outline-none border focus:ring-2 uppercase tracking-widest font-mono ${inputClass}`}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Vehicle Type</label>
                            <select 
                               value={formData.vehicleType}
                               onChange={e => setFormData({...formData, vehicleType: e.target.value})}
                               className={`w-full p-3 rounded-xl outline-none border focus:ring-2 appearance-none ${inputClass}`}
                            >
                                <option>Non-AC</option>
                                <option>AC Ambulance</option>
                                <option>ICU Ambulance</option>
                                <option>Freezer Van</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Hospital Affiliation</label>
                        <div className="relative">
                            <Hospital className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input 
                               value={formData.hospitalAffiliation} 
                               onChange={e => setFormData({...formData, hospitalAffiliation: e.target.value})}
                               placeholder="Independent / Hospital Name"
                               className={`w-full pl-10 p-3 rounded-xl outline-none border focus:ring-2 ${inputClass}`}
                            />
                        </div>
                    </div>
                </div>
             </div>

             {/* Documents Section (New) */}
             <div className={`p-6 rounded-3xl shadow-sm border ${cardClass}`}>
                <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${containerText}`}>
                    <FileText className="w-5 h-5 text-yellow-500" /> Documents & Verification
                </h2>
                <div className="space-y-4">
                    {[
                        { label: "Driving License", status: "verified", date: "Exp: 12/2028" },
                        { label: "Fitness Certificate", status: "pending", date: "Exp: 08/2026" },
                        { label: "Insurance Policy", status: "missing", date: "Required" }
                    ].map((doc, i) => (
                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-slate-50"}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-900" : "bg-white"}`}>
                                    <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${containerText}`}>{doc.label}</p>
                                    <p className="text-xs text-slate-400">{doc.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {doc.status === 'verified' && <span className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
                                {doc.status === 'pending' && <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Reviewing</span>}
                                {doc.status === 'missing' && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Missing</span>}
                                
                                <button type="button" className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                                    <Upload className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
         </div>

         {/* RIGHT COLUMN: PREFERENCES & SECURITY */}
         <div className="space-y-6">
             
             {/* Preferences Card */}
             <div className={`p-6 rounded-3xl shadow-sm border ${cardClass}`}>
                <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${containerText}`}>
                    <Map className="w-5 h-5 text-purple-500" /> Preferences
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-medium text-sm ${containerText}`}>Inter-District Trips</p>
                            <p className="text-xs text-slate-400">Accept long distance rides</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formData.isInterDistrict}
                                onChange={e => setFormData({...formData, isInterDistrict: e.target.checked})}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-medium text-sm ${containerText}`}>Sound Alerts</p>
                            <p className="text-xs text-slate-400">Play sound on new request</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formData.notificationsEnabled}
                                onChange={e => setFormData({...formData, notificationsEnabled: e.target.checked})}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
             </div>

             {/* Security Card */}
             <div className={`p-6 rounded-3xl shadow-sm border ${cardClass}`}>
                <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${containerText}`}>
                    <Shield className="w-5 h-5 text-green-500" /> Security
                </h2>
                <div className="space-y-3">
                    <button type="button" className={`w-full flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${darkMode ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-600"}`}>
                        <span className="flex items-center gap-3 text-sm font-bold"><Lock className="w-4 h-4" /> Change Password</span>
                    </button>
                    <button type="button" className={`w-full flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:border-red-900/30 dark:hover:bg-red-900/20 transition-colors`}>
                        <span className="flex items-center gap-3 text-sm font-bold"><Trash2 className="w-4 h-4" /> Delete Account</span>
                    </button>
                </div>
             </div>

             {/* Sticky Save Button (Desktop) */}
             <div className="sticky top-24">
                 <button 
                    disabled={loading} 
                    type="submit" 
                    className={`w-full py-4 font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
                    ${darkMode 
                        ? "bg-slate-100 text-slate-900 hover:bg-white" 
                        : "bg-slate-900 text-white hover:bg-slate-800"}`}
                 >
                     {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     {loading ? "Saving..." : "Save All Changes"}
                 </button>
             </div>
         </div>
      </form>
    </div>
  );
}