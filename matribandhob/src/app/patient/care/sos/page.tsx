"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ShieldAlert, Phone, Ambulance, Loader2, 
  Volume2, VolumeX, MapPin, Share2, Sun, Moon, Globe 
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import SOSButton from "@/features/patient/components/sos/SOSButton";
import ContactManager from "@/features/patient/components/sos/ContactManager";
import { useTheme } from "@/context/ThemeContext";

export default function SOSPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Set default to Dark Mode with a Pinkish tint for the "Emergency" feel
  const { darkMode, toggleDarkMode } = useTheme();
  const [lang, setLang] = useState<'en'|'bn'>('en');
  
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userRef);
        
        if (snapshot.exists()) {
            const data = snapshot.data();
            // Load language preference but keep theme as requested
            if (data.settings?.language) setLang(data.settings.language);

            let contactList = data.emergencyContacts || [];
            const onboardingPhone = data.basicInfo?.emergencyContact || data.emergencyContact;

            if (onboardingPhone && !contactList.some((c: any) => c.phone === onboardingPhone)) {
                contactList = [
                    { id: "primary_auto", name: "Family (Primary)", phone: onboardingPhone, isPrimary: true }, 
                    ...contactList
                ];
            }
            setContacts(contactList);
        }

        const unsubDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.settings?.language) setLang(data.settings.language);
                
                let contactList = data.emergencyContacts || [];
                const onboardingPhone = data.basicInfo?.emergencyContact || data.emergencyContact;
                if (onboardingPhone && !contactList.some((c: any) => c.phone === onboardingPhone)) {
                    contactList = [{ id: "primary_auto", name: "Family (Primary)", phone: onboardingPhone, isPrimary: true }, ...contactList];
                }
                setContacts(contactList);
            }
        });
        
        setLoading(false);
        return () => unsubDoc();
      } else {
        router.push("/login");
      }
    });
    return () => unsubAuth();
  }, [router]);

  const toggleTheme = () => toggleDarkMode();
  const toggleLang = () => setLang(lang === 'en' ? 'bn' : 'en');

  const toggleSiren = () => {
    if (!audioRef.current) {
        audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
        audioRef.current.loop = true;
    }
    if (isSirenPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsSirenPlaying(false);
    } else {
        audioRef.current.play().catch(() => {});
        setIsSirenPlaying(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#2d0a1a]">
      <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
    </div>
  );

  return (
    <div className={`min-h-screen font-sans relative pb-10 transition-colors duration-700
      ${darkMode ? "bg-[#2d0a1a] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>
        {/* THEME-FIXED BACKGROUND BLOBS */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 transition-colors duration-700 ${darkMode ? "bg-rose-900" : "bg-pink-200"}`} />
            <div className={`absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-30 transition-colors duration-700 ${darkMode ? "bg-pink-800" : "bg-rose-100"}`} />
        </div>

        {/* HEADER */}
        <header className={`fixed top-0 w-full z-40 backdrop-blur-md border-b px-4 py-4 flex justify-between items-center transition-all
            ${darkMode ? "bg-[#2d0a1a]/80 border-white/10" : "bg-[#fff5f7]/80 border-pink-100"}`}
        >
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black tracking-tight text-red-500">SOS</h1>
            </div>

            <div className="flex gap-2">
                <button onClick={toggleLang} className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 ${darkMode ? "bg-white/10 text-white" : "bg-white border border-pink-100"}`}>
                    <Globe className="w-3.5 h-3.5" /> {lang.toUpperCase()}
                </button>
                <button onClick={toggleTheme} className={`p-2 rounded-full ${darkMode ? "bg-white/10 text-yellow-400" : "bg-white border border-pink-100 text-slate-400"}`}>
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>
        </header>

        <main className="pt-24 px-4 max-w-lg mx-auto space-y-8 relative z-10">
            {/* EMERGENCY STATUS BANNER */}
            <div className={`p-4 rounded-3xl border flex gap-4 shadow-2xl transition-all ${darkMode ? "bg-red-950/40 border-red-500/30" : "bg-red-50 border-red-100"}`}>
                <div className="p-3 bg-red-600 rounded-2xl h-fit shadow-lg shadow-red-600/40 animate-pulse">
                    <Ambulance className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-black text-red-500 text-sm uppercase">Emergency Active</h3>
                    <p className={`text-xs mt-1 font-medium leading-relaxed ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
                        Seeking help for danger signs like bleeding or labor. Stay calm and wait for assistance.
                    </p>
                </div>
            </div>

            <SOSButton user={user} contacts={contacts} darkMode={darkMode} />

            {/* QUICK ACTIONS TOOLKIT */}
            <div className="grid grid-cols-3 gap-3">
                <ToolButton icon={isSirenPlaying ? VolumeX : Volume2} label="Siren" active={isSirenPlaying} onClick={toggleSiren} darkMode={darkMode} />
                <ToolButton icon={MapPin} label="Hospitals" onClick={() => window.open("https://www.google.com/maps/search/hospital+near+me")} darkMode={darkMode} />
                <ToolButton icon={Share2} label="Share" onClick={() => navigator.share({title: 'SOS', url: window.location.href})} darkMode={darkMode} />
            </div>

            <ContactManager user={user} contacts={contacts} darkMode={darkMode} />

            <div className="text-center pt-4 pb-10">
                <a href="tel:16263" className="inline-flex items-center gap-4 px-10 py-5 bg-green-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-600/40 hover:scale-105 active:scale-95 transition-all">
                    <Phone className="w-6 h-6 fill-white" /> CALL 16263
                </a>
                <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest opacity-40 ${darkMode ? "text-white" : "text-slate-900"}`}>
                    National Health Batayon [cite: 30]
                </p>
            </div>
        </main>
    </div>
  );
}

function ToolButton({ icon: Icon, label, onClick, darkMode, active }: any) {
    return (
        <button onClick={onClick} className={`p-4 rounded-[2rem] border flex flex-col items-center gap-2 transition-all active:scale-90
            ${active ? "bg-red-600 border-red-500 text-white shadow-red-600/40" : 
            darkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-white border-pink-100 text-slate-600 shadow-sm"}`}
        >
            <Icon className={`w-5 h-5 ${active ? "text-white" : "text-pink-500"}`} />
            <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
        </button>
    );
}