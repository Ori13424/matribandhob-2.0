"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Search, MapPin, Phone, Siren, Filter, Clock, CheckCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

 type Lang = 'en' | 'bn';

export default function BloodRequestPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'find' | 'history'>('find'); // NEW TAB STATE
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
   
  // Mock Donors
  const donors = [
    { id: 1, name: "Dr. Ayesha", group: "O+", distance: "1.2 km", hospital: "Matri Sadan", status: "Available" },
    { id: 2, name: "Rahim Uddin", group: "B+", distance: "3.5 km", hospital: "Community Clinic", status: "Away" },
    { id: 3, name: "City Blood Bank", group: "AB-", distance: "5.0 km", hospital: "Square Hospital", status: "Available" },
  ];
  
  // NEW: Mock Request History
  const history = [
    { id: 101, type: "SOS Broadcast", status: "Resolved", date: "Today, 10:30 AM", donorsFound: 3 },
    { id: 102, type: "Direct Request", status: "Pending", date: "Yesterday, 4:15 PM", donorsFound: 0 },
  ];

  const bloodGroups = ["All", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
        alert("Alert sent to 12 nearby donors!");
        setIsBroadcasting(false);
    }, 2000);
  };

  const filteredDonors = selectedGroup === "All" ? donors : donors.filter(d => d.group === selectedGroup);

  return (
    <div className={`min-h-screen p-4 pb-24 font-sans ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}`}>
      
      <header
  className={`flex items justify-between mb-6`}
>
  <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Blood Bank</h1>
        </div>

  <div className="flex items-center gap-2.5">
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-full transition-all border ${
        darkMode
          ? "bg-white/5 text-yellow-400"
          : "bg-white text-slate-500 shadow-sm"
      }`}
    >
      {darkMode ? (
        <Sun className="w-4.5 h-4.5" />
      ) : (
        <Moon className="w-4.5 h-4.5" />
      )}
    </button>

    <div
      className={`relative flex rounded-full p-0.5 border backdrop-blur-sm ${
        darkMode
          ? "bg-black/40 border-white/10"
          : "bg-white/60 border-pink-100 shadow-sm"
      }`}
    >
      <motion.div
        className="absolute top-0.5 bottom-0.5 w-[30px] bg-gradient-to-tr from-pink-600 to-purple-600 rounded-full shadow-md"
        initial={false}
        animate={{ x: lang === "en" ? 0 : 32 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      <button
        onClick={() => setLang("en")}
        className={`relative z-10 w-[30px] h-[22px] text-[9px] font-black rounded-full flex items-center justify-center ${
          lang === "en"
            ? "text-white"
            : darkMode
            ? "text-gray-500 hover:text-gray-300"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        EN
      </button>

      <button
        onClick={() => setLang("bn")}
        className={`relative z-10 w-[30px] h-[22px] text-[9px] font-black rounded-full flex items-center justify-center ${
          lang === "bn"
            ? "text-white"
            : darkMode
            ? "text-gray-500 hover:text-gray-300"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        BN
      </button>
    </div>
  </div>
</header>

      {/* Tabs */}
      <div className={`flex p-1 rounded-xl mb-6 ${darkMode ? "bg-white/5" : "bg-white border border-pink-100"}`}>
         <button 
           onClick={() => setActiveTab('find')} 
           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'find' ? (darkMode ? "bg-red-600 text-white" : "bg-red-500 text-white") : "text-gray-500"}`}
         >
           Find Donors
         </button>
         <button 
           onClick={() => setActiveTab('history')} 
           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? (darkMode ? "bg-red-600 text-white" : "bg-red-500 text-white") : "text-gray-500"}`}
         >
           My Requests
         </button>
      </div>

      {activeTab === 'find' ? (
        <>
            {/* Hero: Emergency Broadcast */}
            <div className="w-full rounded-[2.5rem] bg-gradient-to-br from-red-600 to-rose-700 p-8 relative overflow-hidden shadow-2xl mb-8 border border-red-500/30">
                <div className="absolute top-0 right-0 p-6 opacity-20"><Siren className="w-40 h-40 text-white" /></div>
                
                <div className="relative z-10 text-center">
                    <h2 className="text-2xl font-black text-white mb-2">Need Blood Urgently?</h2>
                    <p className="text-red-100 text-sm mb-6 max-w-xs mx-auto">
                        This will send an SOS alert to all registered donors and clinics within 5km.
                    </p>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBroadcast}
                        className="w-full py-4 bg-white text-red-600 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 group"
                    >
                        {isBroadcasting ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span> Broadcasting...
                            </span>
                        ) : (
                            <> <Siren className="w-6 h-6 group-hover:animate-wiggle" /> Broadcast Request </>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Filter Section */}
            <section className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Nearby Donors</h3>
                    <button className={`p-2 rounded-lg ${darkMode ? "bg-white/5" : "bg-white shadow-sm"}`}>
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {bloodGroups.map(bg => (
                        <button
                            key={bg}
                            onClick={() => setSelectedGroup(bg)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border
                            ${selectedGroup === bg 
                                ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" 
                                : (darkMode ? "bg-white/5 border-white/10 text-gray-400" : "bg-white border-slate-200 text-slate-600")}`}
                        >
                            {bg}
                        </button>
                    ))}
                </div>
            </section>

            {/* Donor List */}
            <div className="space-y-4">
                {filteredDonors.map((donor) => (
                    <div key={donor.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all
                        ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm
                                    ${darkMode ? "bg-white/10 text-white" : "bg-red-50 text-red-600"}`}>
                                    {donor.group}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 
                                    ${darkMode ? "border-[#1e1b20]" : "border-white"}
                                    ${donor.status === "Available" ? "bg-green-500" : "bg-amber-500"}`} 
                                />
                            </div>
                            
                            <div>
                                <h4 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>{donor.name}</h4>
                                <div className={`flex items-center gap-2 text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-slate-500"}`}>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {donor.distance}</span>
                                    <span>• {donor.hospital}</span>
                                </div>
                            </div>
                        </div>

                        <button className={`p-3 rounded-xl transition-colors
                            ${darkMode 
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                                : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                        >
                            <Phone className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </>
      ) : (
        /* --- HISTORY TAB CONTENT --- */
        <div className="space-y-4">
            <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Past Requests</h3>
            {history.map((req) => (
                <div key={req.id} className={`p-5 rounded-2xl border flex justify-between items-center
                    ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
                >
                    <div className="flex gap-4 items-center">
                        <div className={`p-3 rounded-xl ${req.status === 'Resolved' ? (darkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600") : (darkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600")}`}>
                            {req.status === 'Resolved' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>{req.type}</h4>
                            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-slate-500"}`}>{req.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-xs font-bold block ${req.status === 'Resolved' ? "text-green-500" : "text-amber-500"}`}>{req.status}</span>
                        {req.donorsFound > 0 && <span className="text-[10px] text-gray-400">{req.donorsFound} responses</span>}
                    </div>
                </div>
            ))}
        </div>
      )}

    </div>
  );
}