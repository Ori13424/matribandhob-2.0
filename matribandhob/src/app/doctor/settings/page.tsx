"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Camera, Moon, Sun, 
  LogOut, Lock, CheckCircle, AlertTriangle, X, 
  CreditCard, Stethoscope, Building2, Bell, Shield, 
  Activity, Globe, ChevronRight, Save, Trash2, HeartPulse
} from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTheme } from "@/context/ThemeContext";

export default function DoctorSettingsPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Data States
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isPassResetOpen, setIsPassResetOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  // --- HELPER: TOAST ---
  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
            const docSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (docSnap.exists()) {
                setProfile(docSnap.data());
            }
        } catch (e) { console.error(e); }
        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // --- 2. HANDLERS ---
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
        await updateDoc(doc(db, "users", user.uid), {
            ...profile,
            updatedAt: serverTimestamp()
        });
        showToast("Settings saved successfully!", "success");
    } catch (e) {
        showToast("Failed to save changes.", "error");
    } finally {
        setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setUploadingImg(true);
      try {
          const storageRef = ref(storage, `avatars/${user.uid}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          
          await updateDoc(doc(db, "users", user.uid), { photoURL: url });
          setProfile({ ...profile, photoURL: url });
          showToast("Profile photo updated!", "success");
      } catch (error) {
          showToast("Image upload failed.", "error");
      } finally {
          setUploadingImg(false);
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
      router.push("/login");
  };

  const handlePasswordReset = async () => {
      if (!user?.email) return;
      try {
          await sendPasswordResetEmail(auth, user.email);
          setIsPassResetOpen(false);
          showToast(`Reset email sent to ${user.email}`, "success");
      } catch (e) {
          showToast("Could not send email.", "error");
      }
  };

  const toggleAvailability = async () => {
      const newStatus = !profile.isOnline;
      setProfile({ ...profile, isOnline: newStatus });
      try {
          await updateDoc(doc(db, "users", user.uid), { isOnline: newStatus });
          showToast(newStatus ? "You are now Online" : "You are now Offline", "success");
      } catch(e) { console.error(e); }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500"></div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-500 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"}`}>
      
      {/* HEADER */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center transition-all ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <h1 className="text-xl font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2">
            <User className="w-5 h-5" /> Doctor Profile
        </h1>
        <div className="flex gap-2">
            <button onClick={handleSave} disabled={isSaving} className="hidden md:flex px-6 py-2 rounded-xl bg-teal-600 text-white font-bold text-sm items-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
                {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-all ${darkMode ? "bg-slate-900 border-slate-800 text-yellow-400" : "bg-white border-slate-200 text-slate-500 shadow-sm"}`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </div>
      </header>

      <main className="pt-28 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COL: PROFILE CARD (Sticky) */}
            <div className="lg:col-span-1 space-y-6">
                <div className={`p-6 rounded-[2rem] border sticky top-28 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <div className="w-32 h-32 rounded-full p-1.5 border-2 border-dashed border-teal-500/30">
                                <img 
                                    src={profile.photoURL || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} 
                                    className="w-full h-full rounded-full object-cover bg-slate-100" 
                                />
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImg}
                                className={`absolute bottom-0 right-0 p-3 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-transform hover:scale-110 border-4 ${darkMode ? "border-slate-900" : "border-white"}`}
                            >
                                {uploadingImg ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Camera className="w-4 h-4" />}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        </div>
                        
                        <h2 className="text-xl font-bold mb-1">{profile.fullName || "Dr. Unknown"}</h2>
                        <p className="text-sm opacity-50 mb-4">{profile.specialty || "General Physician"}</p>
                        
                        {/* Status Toggle */}
                        <div onClick={toggleAvailability} className={`cursor-pointer px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all ${profile.isOnline ? "bg-teal-500/10 text-teal-600 border border-teal-500/20" : "bg-slate-500/10 text-slate-500 border border-slate-500/20"}`}>
                            <div className={`w-2 h-2 rounded-full ${profile.isOnline ? "bg-teal-500 animate-pulse" : "bg-slate-500"}`} />
                            {profile.isOnline ? "Available Now" : "Currently Offline"}
                        </div>
                    </div>

                    <div className={`mt-8 pt-6 border-t border-dashed space-y-4 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                        <div className="flex justify-between items-center text-sm">
                            <span className="opacity-60 flex items-center gap-2"><Mail className="w-4 h-4"/> Email</span>
                            <span className="font-medium truncate max-w-[150px]">{user.email}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="opacity-60 flex items-center gap-2"><Phone className="w-4 h-4"/> Phone</span>
                            <span className="font-medium">{profile.phoneNumber || "--"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</span>
                            <span className="font-medium truncate max-w-[150px]">{profile.hospital || "--"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COL: SETTINGS FORM */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. PROFESSIONAL DETAILS */}
                <div className={`p-8 rounded-[2rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-teal-600">
                        <Stethoscope className="w-5 h-5" /> Professional Info
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <CustomFloatingInput 
                            label="Full Name" 
                            icon={User} 
                            value={profile.fullName} 
                            onChange={(v:string) => setProfile({...profile, fullName: v})} 
                            darkMode={darkMode}
                        />
                        <CustomFloatingInput 
                            label="Phone Number" 
                            icon={Phone} 
                            value={profile.phoneNumber} 
                            onChange={(v:string) => setProfile({...profile, phoneNumber: v})} 
                            darkMode={darkMode}
                        />
                        <CustomFloatingInput 
                            label="Specialty" 
                            icon={HeartPulse} 
                            value={profile.specialty} 
                            onChange={(v:string) => setProfile({...profile, specialty: v})} 
                            darkMode={darkMode}
                        />
                        <CustomFloatingInput 
                            label="Consultation Fee (৳)" 
                            icon={CreditCard} 
                            value={profile.fee} 
                            onChange={(v:string) => setProfile({...profile, fee: v})} 
                            darkMode={darkMode}
                            type="number"
                        />
                    </div>
                    <div className="mb-5">
                        <CustomFloatingInput 
                            label="Hospital / Clinic Address" 
                            icon={Building2} 
                            value={profile.hospital} 
                            onChange={(v:string) => setProfile({...profile, hospital: v})} 
                            darkMode={darkMode}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase opacity-50 mb-2 block ml-1">About Me / Bio</label>
                        <textarea 
                            className={`w-full p-4 rounded-xl text-sm outline-none border h-32 resize-none transition-all focus:ring-2 focus:ring-teal-500/20 ${darkMode ? "bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
                            placeholder="Write a short bio about your experience, education, and services..."
                            value={profile.bio || ""}
                            onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        />
                    </div>
                </div>

                {/* 2. PREFERENCES */}
                <div className={`p-8 rounded-[2rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-500">
                        <Activity className="w-5 h-5" /> Preferences
                    </h3>
                    
                    <div className="space-y-4">
                        <div className={`flex items-center justify-between p-4 rounded-xl border border-dashed transition-colors ${darkMode ? "border-slate-800 hover:bg-slate-950/30" : "border-slate-200 hover:bg-slate-50"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-slate-800" : "bg-blue-50 text-blue-600"}`}>
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Notifications</p>
                                    <p className="text-xs opacity-50">Email & Push alerts</p>
                                </div>
                            </div>
                            {/* Toggle Switch UI */}
                            <div className="w-12 h-6 rounded-full bg-teal-500 p-1 flex justify-end cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-xl border border-dashed transition-colors ${darkMode ? "border-slate-800 hover:bg-slate-950/30" : "border-slate-200 hover:bg-slate-50"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-slate-800" : "bg-orange-50 text-orange-600"}`}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Language</p>
                                    <p className="text-xs opacity-50">App language preference</p>
                                </div>
                            </div>
                            <select className={`text-xs font-bold p-2 rounded-lg outline-none border cursor-pointer ${darkMode ? "bg-slate-950/50 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700"}`}>
                                <option>English</option>
                                <option>Bangla</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3. SECURITY & DANGER ZONE */}
                <div className={`p-8 rounded-[2rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-500">
                        <Shield className="w-5 h-5" /> Security
                    </h3>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => setIsPassResetOpen(true)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-colors group ${darkMode ? "border-slate-800 hover:bg-slate-950/30" : "border-slate-200 hover:bg-slate-50"}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"}`}><Lock className="w-4 h-4" /></div>
                                <div>
                                    <span className="font-bold text-sm block text-left">Change Password</span>
                                    <span className="text-xs opacity-50 block text-left">Reset via email link</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>

                        <button 
                            onClick={() => setIsLogoutOpen(true)}
                            className={`w-full p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><LogOut className="w-4 h-4 text-red-600 dark:text-red-400" /></div>
                                <div>
                                    <span className="font-bold text-sm text-red-600 dark:text-red-400 block text-left">Log Out</span>
                                    <span className="text-xs opacity-50 block text-left">End your session</span>
                                </div>
                            </div>
                        </button>

                        <button className="w-full p-4 rounded-xl border border-dashed border-red-300 dark:border-red-900/30 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group mt-4 opacity-70 hover:opacity-100">
                            <div className="flex items-center gap-3">
                                <Trash2 className="w-5 h-5 text-red-600" />
                                <span className="font-bold text-sm text-red-700 dark:text-red-400">Delete Account</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Save Button */}
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="md:hidden w-full py-4 rounded-xl bg-teal-600 text-white font-bold shadow-lg flex items-center justify-center gap-2"
                >
                    {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>

            </div>
        </div>
      </main>

      {/* --- LOGOUT MODAL --- */}
      <AnimatePresence>
        {isLogoutOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl text-center border ${darkMode ? "bg-slate-900 text-white border-slate-800" : "bg-white border-slate-100"}`}>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Log Out?</h3>
                    <p className="text-sm opacity-60 mb-6">Are you sure you want to sign out?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setIsLogoutOpen(false)} className={`flex-1 py-3 rounded-xl font-bold border transition-colors ${darkMode ? "hover:bg-white/5 border-slate-800" : "hover:bg-slate-100"}`}>Cancel</button>
                        <button onClick={handleLogout} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Logout</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- PASSWORD RESET MODAL --- */}
      <AnimatePresence>
        {isPassResetOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl text-center border ${darkMode ? "bg-slate-900 text-white border-slate-800" : "bg-white border-slate-100"}`}>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Reset Password</h3>
                    <p className="text-sm opacity-60 mb-6">We will send a reset link to <strong>{user?.email}</strong>.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setIsPassResetOpen(false)} className={`flex-1 py-3 rounded-xl font-bold border transition-colors ${darkMode ? "hover:bg-white/5 border-slate-800" : "hover:bg-slate-100"}`}>Cancel</button>
                        <button onClick={handlePasswordReset} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors">Send</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* TOAST */}
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

// --- CUSTOM INPUT COMPONENT ---
function CustomFloatingInput({ label, icon: Icon, value, onChange, darkMode, type = "text" }: any) {
    return (
        <div className="relative group">
            <div className={`absolute top-0 left-0 w-full h-full rounded-xl border pointer-events-none transition-colors ${darkMode ? "border-slate-800 group-focus-within:border-teal-500/50" : "border-slate-200 group-focus-within:border-teal-500"}`} />
            <div className="relative flex items-center px-4 py-3.5">
                <Icon className={`w-5 h-5 mr-3 transition-colors ${darkMode ? "text-slate-500 group-focus-within:text-teal-400" : "text-slate-400 group-focus-within:text-teal-600"}`} />
                <div className="flex-1">
                    <label className={`block text-[10px] font-bold uppercase transition-colors ${darkMode ? "text-slate-500 group-focus-within:text-teal-400" : "text-slate-400 group-focus-within:text-teal-600"}`}>
                        {label}
                    </label>
                    <input 
                        type={type}
                        value={value || ""} 
                        onChange={(e) => onChange(e.target.value)}
                        className={`bg-transparent outline-none w-full text-sm font-bold transition-colors ${darkMode ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-300"}`} 
                        placeholder={`Enter ${label}...`}
                    />
                </div>
            </div>
        </div>
    )
}