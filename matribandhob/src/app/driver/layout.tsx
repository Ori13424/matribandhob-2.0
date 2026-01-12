"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Navigation, History, Settings, LogOut, 
  Menu, X, Ambulance, Power, Radio, Sun, Moon, Loader2
} from "lucide-react";
import { auth, db } from "@/lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [driverName, setDriverName] = useState("Ambulance Pilot");
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state
  
  const pathname = usePathname();
  const router = useRouter();
  
  // Theme Context
  const { darkMode, toggleDarkMode } = useTheme();

  // --- PRESENCE & AUTH SYSTEM ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const userRef = doc(db, "users", user.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
             const data = snap.data();
             setDriverName(data.fullName || "Ambulance Driver");
             if (data.isOnline) setIsOnline(true);
          }
          await updateStatus(true, user.uid);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setLoading(false); // Auth check done
      }
    });
    return () => unsub();
  }, [router]);

  const updateStatus = async (status: boolean, uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        isOnline: status,
        lastActive: serverTimestamp()
      });
      setIsOnline(status);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleToggleOnline = () => {
    if (auth.currentUser) updateStatus(!isOnline, auth.currentUser.uid);
  };

  const handleLogout = async () => {
    if (auth.currentUser) await updateStatus(false, auth.currentUser.uid);
    await signOut(auth);
    router.push("/login");
  };

  const menuItems = [
    { name: "Mission Control", icon: LayoutDashboard, path: "/driver/dashboard" },
    { name: "Live Map", icon: Navigation, path: "/driver/map" },
    { name: "Trip History", icon: History, path: "/driver/history" },
    { name: "Settings", icon: Settings, path: "/driver/settings" },
  ];

  // Prevent rendering until auth is checked
  if (loading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center gap-4 ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
        <p className="font-bold tracking-widest animate-pulse">CONNECTING TO MATRIRIDE...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300
      ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out border-r
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0
        ${darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-900 text-white border-slate-800"}`}>
        
        <div className="h-full flex flex-col">
          {/* Brand */}
          <div className="h-20 flex items-center px-8 border-b border-slate-800">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-red-600/20">
              <Ambulance className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white">MatriRide</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">EMERGENCY RESPONSE</p>
            </div>
            <button className="ml-auto lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-200
                  ${isActive 
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/20 translate-x-1" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className={`h-20 backdrop-blur-xl border-b sticky top-0 z-40 px-8 flex items-center justify-between transition-colors
          ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
          
          <button className={`lg:hidden p-2 -ml-2 ${darkMode ? "text-slate-200" : "text-slate-600"}`} onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          {/* Controls */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* THEME TOGGLE */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-full border transition-all hover:scale-105 active:scale-95
                ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900"}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Info */}
            <div className="text-right hidden sm:block">
               <p className={`text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{driverName}</p>
               <p className="text-[11px] font-medium text-slate-400 flex items-center justify-end gap-1">
                 <Radio className={`w-3 h-3 ${isOnline ? "text-green-500 animate-pulse" : "text-slate-400"}`} />
                 {isOnline ? "Signal Active" : "Signal Lost"}
               </p>
            </div>
            
            {/* Duty Toggle */}
            <button 
              onClick={handleToggleOnline}
              className={`relative group flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 rounded-full text-xs font-black tracking-wider transition-all duration-300 shadow-lg
              ${isOnline 
                ? "bg-slate-900 text-white shadow-green-900/20 ring-2 ring-green-500 ring-offset-2" 
                : (darkMode ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50")}`}
            >
              <Power className={`w-4 h-4 ${isOnline ? "text-green-400" : "text-slate-300"}`} />
              <span className="hidden sm:inline">{isOnline ? "ON DUTY" : "OFF DUTY"}</span>
              {isOnline && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />}
            </button>

             {/* Header Sign Out (Mobile/Quick Access) */}
             <button 
              onClick={handleLogout}
              className={`p-2.5 rounded-full border transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-600
                ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}