"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, FileText,
  Settings, LogOut, Menu, X, Power, Sun, Moon, Stethoscope
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
    } catch (e) { }
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
    { name: "Settings", icon: Settings, path: "/doctor/settings" }
  ];

  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold animate-pulse">Initializing Medical Portal...</div>;

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-500 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-[#f4f7fa] text-slate-900"}`}>

      {/* SIDEBAR BACKGROUND OVERLAY (Mobile) */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 backdrop-blur-xl border-r transition-transform duration-300 ease-out 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0
        ${darkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/80 border-slate-200/60"}`}
      >
        <div className="h-full flex flex-col p-6">
          {/* LOGO */}
          <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="p-2.5 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-lg shadow-teal-500/20 text-white">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none">MatriDoctor</h1>
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest mt-1">Professional</p>
            </div>
          </div>

          {/* NAV */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path} onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group
                    ${pathname === item.path
                    ? "text-teal-600 shadow-lg shadow-teal-500/10 bg-gradient-to-r from-teal-50 to-white dark:from-teal-900/20 dark:to-slate-900"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"}`}
              >
                {pathname === item.path && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-full" />}
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${pathname === item.path ? "text-teal-600" : "opacity-70"}`} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* USER CARD & LOGOUT */}
          <div className={`mt-auto p-4 rounded-3xl border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                {doctorName[0]}
              </div>
              <div className="overflow-hidden">
                <p className={`text-sm font-bold truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`}>Dr. {doctorName.split(' ')[0]}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* TOP BAR */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30 transition-all">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2.5 rounded-xl bg-white shadow-sm text-slate-600 border border-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:scale-105 transition-transform" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${isOnline ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
              {isOnline ? "System Systems Operational" : "Status: Offline"}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400 shadow-lg shadow-yellow-400/10" : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 shadow-sm"}`}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleToggleOnline}
              disabled={loading}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95
                    ${isOnline
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/30"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700"}`}
            >
              <Power className="w-4 h-4" />
              <span className="hidden md:inline">{isOnline ? "GO OFFLINE" : "GO ONLINE"}</span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEW */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}