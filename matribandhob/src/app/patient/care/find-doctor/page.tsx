"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Search, Star, MessageCircle, Video, 
  CalendarCheck, ShieldCheck, X, Send, Paperclip, Eye, EyeOff, Sun, Moon
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";

// --- MOCK DOCTOR DATABASE (Static data for listing) ---
const doctors = [
  { 
    id: 1, 
    name: "Dr. Humaira Khan", 
    specialty: "Gynecologist & Obs", 
    hospital: "Dhaka Medical College", 
    exp: "12 Yrs", 
    rating: 4.9, 
    reviews: 120,
    fee: 1000,
    nextSlot: "Tomorrow, 04:00 PM",
    image: "https://img.freepik.com/free-photo/pleased-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg",
    online: true 
  },
  { 
    id: 2, 
    name: "Dr. Rafiqul Islam", 
    specialty: "Pediatrician", 
    hospital: "Square Hospital", 
    exp: "8 Yrs", 
    rating: 4.7, 
    reviews: 85,
    fee: 1200,
    nextSlot: "Tomorrow, 10:00 AM",
    image: "https://img.freepik.com/free-photo/portrait-smiling-handsome-male-doctor-man_171337-5055.jpg",
    online: false 
  },
  { 
    id: 3, 
    name: "Dr. Nusrat Jahan", 
    specialty: "Nutritionist", 
    hospital: "Labaid Specialized", 
    exp: "5 Yrs", 
    rating: 4.8, 
    reviews: 200,
    fee: 800,
    nextSlot: "Today, 6:30 PM",
    image: "https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg",
    online: true 
  },
  { 
    id: 4, 
    name: "Dr. Farhana Akter", 
    specialty: "Gynecologist", 
    hospital: "Matri Sadan", 
    exp: "15 Yrs", 
    rating: 5.0, 
    reviews: 310,
    fee: 500,
    nextSlot: "Wed, 11:00 AM",
    image: "https://img.freepik.com/free-photo/young-woman-doctor-white-coat-with-stethoscope-smiling-confident_141793-47701.jpg",
    online: false 
  },
];

const categories = ["All", "Gynecologist", "Pediatrician", "Nutritionist", "General"];
type Lang = 'en' | 'bn';

export default function FindDoctorPage() {
  const router = useRouter();
  
  // --- STATES ---
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'find' | 'appointments'>('find');
  const [apptFilter, setApptFilter] = useState<'Requested' | 'Confirmed' | 'Done'>('Confirmed');
  const { darkMode, toggleDarkMode } = useTheme();
  const [lang, setLang] = useState<Lang>('en');
  // Data States
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  
  // Selection States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null); // For Details Modal
  const [isBooking, setIsBooking] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDoctor, setChatDoctor] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");

  // --- 1. AUTH & REAL-TIME LISTENER ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Listen to User's Appointments Collection
        const q = query(
            collection(db, "users", currentUser.uid, "appointments"),
            orderBy("createdAt", "desc")
        );
        const unsubAppt = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyAppointments(data);
        });
        return () => unsubAppt();
      } else {
        // Redirect if not logged in (optional, or handle gracefully)
        // router.push('/login');
      }
    });
    return () => unsubAuth();
  }, [router]);

  // --- 2. BOOKING LOGIC ---
  const handleBook = async () => {
    if (!user || !selectedDoctor) return;
    setIsBooking(true);

    try {
        await addDoc(collection(db, "users", user.uid, "appointments"), {
            doctorName: selectedDoctor.name,
            specialty: selectedDoctor.specialty,
            hospital: selectedDoctor.hospital,
            dateDisplay: selectedDoctor.nextSlot, 
            fee: selectedDoctor.fee,
            type: "Video Consultation", // Defaulting to Video for this flow
            status: "Confirmed", // Auto-confirm for demo/MVP
            queue: Math.floor(Math.random() * 50) + 1, // Random queue number
            createdAt: serverTimestamp()
        });
        
        alert("Appointment Confirmed Successfully!");
        setSelectedDoctor(null); // Close modal
        setActiveTab('appointments'); // Switch to view it
    } catch (error) {
        console.error("Booking Error:", error);
        alert("Failed to book appointment. Please try again.");
    } finally {
        setIsBooking(false);
    }
  };

  // --- 3. FILTER LOGIC ---
  const filteredDoctors = doctors.filter(doc => {
    const matchesCategory = selectedCategory === "All" || doc.specialty.includes(selectedCategory);
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredAppointments = myAppointments.filter((appt: any) => 
    // If your DB doesn't have status yet, default to 'Confirmed' to show something
    (appt.status || 'Confirmed') === apptFilter
  );

  // Chat Handler
  const openChat = (doctor: any) => {
    setSelectedDoctor(null);
    setChatDoctor(doctor);
    setChatOpen(true);
  };

    const togglePrivacy = () => {
        setIsPrivate(!isPrivate);
    };

  return (
    <div className={`min-h-screen font-sans relative pb-24 transition-colors duration-500 
      ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}
    `}>

        
      
      {/* --- HEADER --- */}
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300
        ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`p-2.5 rounded-full ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white shadow-sm hover:bg-pink-50"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Find Doctor</h1>
        </div>

         <div className={`w-[45%] mx-auto flex p-1 rounded-xl ${darkMode ? "bg-white/5" : "bg-white border border-pink-100"}`}>
  <button 
    onClick={() => setActiveTab('find')} 
    className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg transition-all 
      ${activeTab === 'find'
        ? (darkMode ? "bg-pink-600 text-white" : "bg-pink-500 text-white")
        : "text-gray-500"
      }`}
  >
    Find Doctor
  </button>

  <button 
    onClick={() => setActiveTab('appointments')} 
    className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg transition-all 
      ${activeTab === 'appointments'
        ? (darkMode ? "bg-pink-600 text-white" : "bg-pink-500 text-white")
        : "text-gray-500"
      }`}
  >
    My Appointments
  </button>
</div>

    
       

        <div className="flex items-center gap-3">
            {/* PRIVACY TOGGLE */}
            <button 
                onClick={togglePrivacy}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all border relative overflow-hidden group
                ${isPrivate 
                    ? "bg-red-500 border-red-500 text-white animate-pulse" 
                    : (darkMode ? "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10" : "bg-white border-pink-100 text-slate-500 shadow-sm hover:bg-pink-50")}`}
            >
                {isPrivate ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span className="hidden md:inline text-xs font-bold">{isPrivate ? "Privacy ON" : "Privacy"}</span>
            </button> 
    
            {/* THEME TOGGLE */}
            <button 
      onClick={toggleDarkMode} 
      className={`p-2 rounded-full transition-all border ${
        darkMode ? "bg-white/5 text-yellow-400" : "bg-white text-slate-500 shadow-sm"
      }`}
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>

            {/* LANGUAGE TOGGLE */}
            <div className={`relative flex rounded-full p-1 border backdrop-blur-sm ${darkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-pink-100 shadow-sm"}`}>
                <motion.div 
                    className="absolute top-1 bottom-1 w-[34px] bg-gradient-to-tr from-pink-600 to-purple-600 rounded-full shadow-md"
                    initial={false}
                    animate={{ x: lang === 'en' ? 0 : 36 }} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button onClick={() => setLang('en')} className={`relative z-10 w-[34px] h-[26px] text-[10px] font-black rounded-full transition-colors flex items-center justify-center ${lang === 'en' ? 'text-white' : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')}`}>EN</button>
                <button onClick={() => setLang('bn')} className={`relative z-10 w-[34px] h-[26px] text-[10px] font-black rounded-full transition-colors flex items-center justify-center ${lang === 'bn' ? 'text-white' : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')}`}>BN</button>
            </div>
        </div>
      </header>


      {/* --- MAIN CONTENT --- */}
      <main className="pt-36 px-4 md:px-8 max-w-5xl mx-auto">
        
        {activeTab === 'find' ? (
            <>
                {/* Search Bar */}
                <div className={`flex items-center gap-3 p-3 rounded-2xl border mb-6 transition-all focus-within:ring-2 ring-pink-500/50
                    ${darkMode ? "bg-[#1e1b20] border-white/10" : "bg-white border-pink-100 shadow-sm"}`}>
                    <Search className="w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search doctor, specialty..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent flex-1 outline-none text-sm font-medium"
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border
                            ${selectedCategory === cat 
                                ? "bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-600/20" 
                                : (darkMode ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10" : "bg-white border-pink-100 text-slate-500 hover:bg-white")}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Doctor Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map((doc) => (
                        <div 
                            key={doc.id}
                            onClick={() => setSelectedDoctor(doc)} 
                            className={`p-4 rounded-[1.5rem] border relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]
                            ${darkMode ? "bg-[#1e1b20]/50 border-white/5 hover:border-pink-500/30" : "bg-white border-pink-100 shadow-sm hover:shadow-md"}`}
                        >
                            <div className="flex gap-4">
                                <div className="relative">
                                    <img src={doc.image} alt={doc.name} className="w-20 h-20 rounded-2xl object-cover" />
                                    {doc.online && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1e1b20] rounded-full"></span>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 mb-1">
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        <span className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{doc.rating}</span>
                                    </div>
                                    <h3 className={`text-base font-bold leading-tight ${darkMode ? "text-white" : "text-slate-800"}`}>{doc.name}</h3>
                                    <p className={`text-xs font-medium ${darkMode ? "text-pink-400" : "text-pink-600"}`}>{doc.specialty}</p>
                                    <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-500" : "text-slate-500"}`}>{doc.hospital}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-700/30 flex justify-between items-center">
                                <div className="text-xs">
                                     <span className="block text-gray-500 text-[10px] uppercase font-bold">Next Slot</span>
                                     <span className={`font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>{doc.nextSlot}</span>
                                </div>
                                <div className="text-right">
                                     <span className="block text-gray-500 text-[10px] uppercase font-bold">Fee</span>
                                     <span className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>৳ {doc.fee}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        ) : (
            /* --- APPOINTMENTS TAB --- */
            <>
                <div className="flex gap-2 mb-6">
                    {['Requested', 'Confirmed', 'Done'].map((status) => (
                        <button 
                            key={status}
                            onClick={() => setApptFilter(status as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex-1
                            ${apptFilter === status 
                                ? (darkMode ? "bg-white text-black border-white" : "bg-slate-900 text-white border-slate-900")
                                : (darkMode ? "bg-white/5 border-white/10 text-gray-500" : "bg-white border-slate-200 text-slate-500")}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filteredAppointments.map((appt: any) => (
                        <div key={appt.id} className={`p-4 rounded-2xl border flex items-center justify-between
                            ${darkMode ? "bg-[#1e1b20] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${darkMode ? "bg-pink-500/10 text-pink-400" : "bg-pink-50 text-pink-600"}`}>
                                    <CalendarCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>{appt.doctorName}</h3>
                                    <p className={`text-xs ${darkMode ? "text-gray-500" : "text-slate-500"}`}>{appt.dateDisplay} • {appt.type}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border
                                ${appt.status === 'Confirmed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                  appt.status === 'Requested' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                  "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                {appt.status || 'Confirmed'}
                            </span>
                        </div>
                    ))}
                    {filteredAppointments.length === 0 && (
                        <div className="text-center py-12 text-gray-500 text-sm">No {apptFilter.toLowerCase()} appointments found.</div>
                    )}
                </div>
            </>
        )}

      </main>

      {/* --- 1. DOCTOR DETAILS MODAL --- */}
      <AnimatePresence>
        {selectedDoctor && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={() => setSelectedDoctor(null)}
                />
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] p-6 md:p-8 max-h-[85vh] overflow-y-auto
                    ${darkMode ? "bg-[#1a0f15] text-white" : "bg-white text-slate-900"}`}
                >
                    <div className="w-12 h-1 bg-gray-500/30 rounded-full mx-auto mb-6" />

                    <div className="flex gap-5 mb-6">
                        <img src={selectedDoctor.image} className="w-24 h-24 rounded-3xl object-cover shadow-2xl" />
                        <div>
                            <h2 className="text-2xl font-bold mb-1">{selectedDoctor.name}</h2>
                            <p className="text-pink-500 font-medium">{selectedDoctor.specialty}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <ShieldCheck className="w-4 h-4 text-green-500" /> {selectedDoctor.exp} Experience
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-6">
                        {/* Chat Button (No Payment Logic here, just opens sidebar) */}
                        <button 
                            onClick={() => openChat(selectedDoctor)}
                            className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all
                            ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-100 border-slate-200 hover:bg-slate-200"}`}
                        >
                            <MessageCircle className="w-5 h-5" /> Chat
                        </button>
                        
                        {/* Book Button (Triggers DB Write) */}
                        <button 
                            onClick={handleBook}
                            disabled={isBooking}
                            className="flex-1 py-4 rounded-2xl bg-pink-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30"
                        >
                            {isBooking ? (
                                "Processing..."
                            ) : (
                                <><Video className="w-5 h-5" /> Book (৳{selectedDoctor.fee})</>
                            )}
                        </button>
                    </div>

                    <h3 className="font-bold text-sm uppercase tracking-wider mb-2 text-gray-500">About Doctor</h3>
                    <p className={`text-sm leading-relaxed mb-8 ${darkMode ? "text-gray-400" : "text-slate-600"}`}>
                        Dr. {selectedDoctor.name.split(' ')[1]} is a senior specialist at {selectedDoctor.hospital} with over {selectedDoctor.exp} of experience.
                    </p>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* --- 2. DOCTOR CHAT SIDEBAR (FROM LEFT) --- */}
      <AnimatePresence>
        {chatOpen && chatDoctor && (
             <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    onClick={() => setChatOpen(false)}
                />
                <motion.div
                    initial={{ x: "-100%" }} // From Left
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`fixed top-0 left-0 h-full w-[85%] md:w-[400px] shadow-2xl z-[60] flex flex-col border-r
                        ${darkMode ? "bg-[#120a10] border-white/10" : "bg-white border-pink-100"}`}
                >
                    {/* Chat Header */}
                    <div className={`p-4 border-b flex items-center gap-3 ${darkMode ? "border-white/5 bg-[#1a0b10]" : "border-pink-50 bg-pink-50/50"}`}>
                        <div className="relative">
                            <img src={chatDoctor.image} className="w-10 h-10 rounded-full object-cover" />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>{chatDoctor.name}</h3>
                            <p className="text-[10px] text-green-500 font-bold">Online Now</p>
                        </div>
                        <button onClick={() => setChatOpen(false)} className={`p-2 rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${darkMode ? "bg-black/20" : "bg-slate-50"}`}>
                         <div className="text-center text-[10px] text-gray-500 my-4">Today, 10:30 AM</div>
                         
                         {/* Doctor Msg */}
                         <div className="flex gap-3">
                             <img src={chatDoctor.image} className="w-8 h-8 rounded-full object-cover self-end" />
                             <div className={`p-3 rounded-2xl rounded-bl-none text-sm max-w-[75%] ${darkMode ? "bg-[#1e1b20] text-gray-200" : "bg-white border text-slate-700"}`}>
                                 Hello! How can I help you today?
                             </div>
                         </div>
                    </div>

                    {/* Chat Input */}
                    <div className={`p-3 border-t flex items-center gap-2 ${darkMode ? "bg-[#1a0b10] border-white/5" : "bg-white border-slate-100"}`}>
                        <button className={`p-2 rounded-xl ${darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-slate-100 text-slate-400"}`}>
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input 
                            type="text" 
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? "text-white placeholder:text-gray-600" : "text-slate-900"}`}
                        />
                        <button className="p-2.5 rounded-xl bg-pink-600 text-white shadow-lg shadow-pink-600/20">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
             </>
        )}
      </AnimatePresence>

    </div>
  );
}