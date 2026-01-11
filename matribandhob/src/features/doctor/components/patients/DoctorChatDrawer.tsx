"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, Paperclip, Check, CheckCheck, Phone } from "lucide-react";
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, serverTimestamp, setDoc, doc 
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";

const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join("_");

export default function DoctorChatDrawer({ patient, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const doctorId = auth.currentUser?.uid || "";
  const patientId = patient?.id || "";
  const chatId = (doctorId && patientId) ? getChatId(doctorId, patientId) : null;

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chatId]);

  const handleSend = async (e?: any) => {
    e?.preventDefault();
    if (!input.trim() || !chatId) return;
    const text = input; setInput("");
    try {
      await setDoc(doc(db, "chats", chatId), { 
        participants: [doctorId, patientId], updatedAt: serverTimestamp(), lastMessage: text
      }, { merge: true });
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text, senderId: doctorId, senderRole: 'doctor', timestamp: serverTimestamp(), read: false
      });
    } catch (err) { console.error("Send failed:", err); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[2px]" />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-2 bottom-2 right-2 w-full md:w-[400px] bg-[#e5ddd5] z-[70] shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
               <img src={patient.photoURL || "https://avatar.iran.liara.run/public/girl"} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
               {patient.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{patient.name}</h3>
              <p className="text-[10px] text-slate-500">{patient.isOnline ? "Online" : "Offline"}</p>
            </div>
          </div>
          <div className="flex gap-1">
             <button className="p-2 hover:bg-slate-100 rounded-full text-teal-600"><Phone className="w-5 h-5"/></button>
             <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-full text-red-500"><X className="w-5 h-5"/></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-10">
          {messages.map((msg) => {
            const isMe = msg.senderRole === 'doctor';
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow-sm relative ${isMe ? "bg-[#d9fdd3] text-slate-900 rounded-tr-none" : "bg-white text-slate-900 rounded-tl-none"}`}>
                  <p>{msg.text}</p>
                  <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1">
                    {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "..."}
                    {isMe && <CheckCheck className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-slate-100 px-4 py-2.5 rounded-full text-sm outline-none focus:ring-1 focus:ring-teal-500" />
          <button type="submit" className="p-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 shadow-md"><Send className="w-5 h-5" /></button>
        </form>
      </motion.div>
    </>
  );
}