"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, X, Mic, StopCircle, Image as ImageIcon, Sparkles, Languages, AlertCircle, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter, usePathname } from "next/navigation";

export default function ChatBotWidget({ isOpen, onClose, userProfile, darkMode }: any) {
  const { lang, toggleLang } = useLanguage(); 
  const router = useRouter();
  const pathname = usePathname();
  
  const [messages, setMessages] = useState<any[]>([
    { 
      role: "bot", 
      content: lang === 'bn' 
        ? "হ্যালো মা! আমি মাতৃ-কেয়ার এআই। আপনার শরীর কেমন লাগছে? আমি আপনাকে সাধারণ ঔষধের তথ্য দিতে পারি, তবে মনে রাখবেন ডাক্তার দেখানোটাই সেরা।" 
        : "Hello Ma! I am your Matri-Care Companion. I can help with basic medicine info, but always consult a doctor for safety. How are you feeling?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- VOICE RECOGNITION (Same Robust Logic) ---
  const startListening = () => {
    setErrorMsg("");
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = lang === 'bn' ? 'bn-IN' : 'en-US';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') setErrorMsg("Please allow microphone access.");
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.start();
    } else {
      alert("Voice not supported.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !selectedImage) return;

    setMessages(prev => [...prev, { role: "user", content: textToSend, image: selectedImage }]);
    setInput("");
    setSelectedImage(null);
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          userProfile: { ...userProfile, uid: "CURRENT_USER" },
          language: lang,
          image: selectedImage,
          pageContext: { url: pathname }
        }),
      });

      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "bot", content: data.reply }]);
      playTTS(data.reply);

      if (data.action === "NAVIGATE") router.push(data.data);
      if (data.action === "TRIGGER_SOS") router.push("/patient/care/sos");

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", content: "Connection Error." }]);
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        body: JSON.stringify({ text, language: lang }),
      });
      const data = await res.json();
      if (data.audio) {
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current.play();
      }
    } catch(e) { console.error(e); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP (Click to close) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          />

          {/* SIDE DRAWER UI */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full w-full md:w-[450px] shadow-2xl z-50 flex flex-col border-l
              ${darkMode ? "bg-[#1a0b10]/95 border-pink-900/30" : "bg-white/95 border-pink-100"}`}
          >
            {/* HEADER */}
            <div className="p-6 bg-gradient-to-r from-pink-600 to-rose-600 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl leading-tight">Matri-AI</h3>
                  <p className="text-[11px] text-pink-100 font-medium flex items-center gap-1.5 opacity-90">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"/> 
                    Medical Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleLang(lang === 'en' ? 'bn' : 'en')}
                  className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold border border-white/10"
                >
                  {lang === 'en' ? 'EN' : 'বাংলা'}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* MESSAGES (Scrollable) */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${darkMode ? "bg-[#120a10]" : "bg-[#fff5f7]"}`}>
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative ${
                    m.role === "user" 
                      ? "bg-gradient-to-br from-pink-600 to-rose-600 text-white rounded-tr-none" 
                      : (darkMode ? "bg-white/10 text-gray-100 border border-white/5" : "bg-white text-slate-700 border border-pink-100") + " rounded-tl-none"
                  }`}>
                    {m.image && <img src={m.image} alt="Upload" className="w-full rounded-lg mb-3 border border-white/20" />}
                    <p>{m.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className={`p-4 rounded-2xl rounded-tl-none flex items-center gap-3 ${darkMode ? "bg-white/10" : "bg-white shadow-sm border border-pink-100"}`}>
                    <Sparkles className="w-4 h-4 text-pink-500 animate-spin" />
                    <span className="text-xs font-bold text-pink-500 animate-pulse">Consulting database...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* INPUT AREA (Fixed Bottom) */}
            <div className={`p-4 border-t shrink-0 ${darkMode ? "border-white/10 bg-[#1a0b10]" : "border-pink-100 bg-white"}`}>
              {errorMsg && (
                <div className="flex items-center gap-2 mb-2 text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-3 h-3" /> {errorMsg}
                </div>
              )}

              {selectedImage && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="flex items-center gap-2 mb-3 p-2 bg-pink-50/50 rounded-xl border border-pink-100">
                  <ImageIcon className="w-4 h-4 text-pink-600" />
                  <span className="text-xs text-pink-600 font-bold">Image attached</span>
                  <button onClick={() => setSelectedImage(null)} className="ml-auto bg-white rounded-full p-1"><X className="w-3 h-3 text-red-500" /></button>
                </motion.div>
              )}

              <div className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                
                <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-xl transition-all ${darkMode ? "bg-white/5 hover:bg-white/10 text-gray-400" : "bg-gray-100 hover:bg-pink-50 text-gray-500 hover:text-pink-600"}`}>
                  <ImageIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={lang === 'bn' ? "এখানে লিখুন..." : "Ask your health question..."}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className={`w-full p-3.5 pr-10 rounded-xl text-sm focus:outline-none transition-all border ${
                      darkMode ? "bg-white/5 border-white/10 text-white focus:border-pink-500" : "bg-gray-50 border-transparent text-gray-800 focus:bg-white focus:border-pink-200 focus:shadow-[0_0_0_4px_rgba(236,72,153,0.1)]"
                    }`}
                  />
                  <button 
                    onClick={isListening ? () => {} : startListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-pink-500"}`}
                  >
                    {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>

                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() && !selectedImage}
                  className="p-3.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl shadow-lg shadow-pink-600/30 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}