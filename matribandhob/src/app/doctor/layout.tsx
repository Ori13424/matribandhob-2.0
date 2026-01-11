"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Calendar, FileText, 
  Settings, LogOut, Menu, X, Power, Sun, Moon
} from "lucide-react";
import { auth, db } from "@/lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [doctorName, setDoctorName] = useState("Doctor");
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();

  // --- AUTH & DATA ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().role === 'doctor') {
        setIsAuthorized(true);
        const data = userSnap.data();
        setDoctorName(data.fullName || data.name || "Doctor");
        
        const unsub = onSnapshot(userRef, (s) => {
            if (s.exists()) setIsOnline(s.data().isOnline === true);
        });
        return () => unsub();
      } else {
        await signOut(auth);
        router.push("/login");
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // --- ACTIONS ---
  const handleToggleOnline = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        isOnline: !isOnline, lastActive: serverTimestamp()
      }, { merge: true });
    } catch (e) {} 
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    if (auth.currentUser) await setDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false }, { merge: true });
    await signOut(auth);
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/doctor/dashboard" },
    { name: "My Patients", icon: Users, path: "/doctor/patients" },
    { name: "Appointments", icon: Calendar, path: "/doctor/appointments" },
    { name: "Reports", icon: FileText, path: "/doctor/reports" },
    { name: "Settings", icon: Settings, path: "/doctor/settings" },
  ];

  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading Portal...</div>;

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0
        ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
             <span className="font-bold text-lg">Matri-Doctor</span>
             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
             </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => (
                <Link key={item.path} href={item.path} onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                    ${pathname === item.path ? "bg-teal-500/10 text-teal-500 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <item.icon className="w-5 h-5" /> {item.name}
                </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
             <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl">
               <LogOut className="w-5 h-5" /> Sign Out
             </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER (No BG, Floating Controls) */}
        <header className="h-16 flex items-center justify-between px-6 md:px-8 sticky top-0 z-40 bg-transparent pointer-events-none">
            
            {/* Mobile Menu Trigger */}
            <div className="pointer-events-auto">
                <button className="lg:hidden p-2 -ml-2 rounded-lg bg-white/80 shadow-sm backdrop-blur md:bg-transparent md:shadow-none" onClick={() => setIsSidebarOpen(true)}>
                    <Menu className={`w-6 h-6 ${darkMode ? "text-slate-200" : "text-slate-700"}`} />
                </button>
            </div>
            
            {/* Top Right Controls */}
            <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
                <button onClick={toggleDarkMode} className={`p-2 rounded-full border shadow-sm ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-white border-slate-200 text-slate-400"}`}>
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button 
                    onClick={handleToggleOnline}
                    disabled={loading}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95
                    ${isOnline 
                        ? "bg-green-100 text-green-600 border-green-200" 
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                >
                    {loading ? "..." : (
                        <>
                            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                            <span className="hidden md:inline">{isOnline ? "ONLINE" : "OFFLINE"}</span>
                            <Power className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                        </>
                    )}
                </button>

                <div className={`hidden md:block text-right px-3 py-1 rounded-xl ${darkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
                    <p className={`text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{doctorName}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{isOnline ? "On Duty" : "Away"}</p>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 pt-2">
          {children}
        </div>
      </main>
    </div>
  );
}