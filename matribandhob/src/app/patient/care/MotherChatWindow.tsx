"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";

export default function MotherChatWindow({ doctor, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats", doctor.chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [doctor.chatId]);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!input.trim() || !auth.currentUser) return;

    await addDoc(collection(db, "chats", doctor.chatId, "messages"), {
      text: input,
      senderId: auth.currentUser.uid,
      senderRole: 'patient',
      timestamp: serverTimestamp(),
      read: false
    });
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md h-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
               {doctor.fullName[0]}
             </div>
             <div>
               <h3 className="font-bold">{doctor.fullName}</h3>
               <p className="text-xs text-teal-100">Usually replies in 5m</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((msg) => {
            const isMe = msg.senderRole === 'patient';
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-pink-500 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* INPUT */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 px-4 py-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button type="submit" className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}