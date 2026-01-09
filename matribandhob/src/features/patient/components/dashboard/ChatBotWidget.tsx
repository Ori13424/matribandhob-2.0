"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, X, Mic, Volume2, VolumeX, Bot, User, 
  Loader2, Paperclip, Trash2, AlertCircle 
} from "lucide-react";

export default function ChatBotWidget({ isOpen, onClose, darkMode }: any) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATES ---
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string, image?: string}[]>([
    { role: 'assistant', content: "Namaskar! I am Matri-Bot. I am listening. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang, setLang] = useState<'en'|'bn'>('en');
  
  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // --- IMAGE HANDLER ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- SEND MESSAGE ---
  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    
    const newMsg = { role: 'user' as const, content: input, image: selectedImage || undefined };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);
    stopAudio(); // Stop any previous speech

    try {
      // 1. Get AI Text Response
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [...messages, newMsg],
            pageContext: pathname,
            language: lang,
            image: newMsg.image 
        })
      });
      
      const data = await res.json();
      
      if (data.content) {
          const botMsg = { role: 'assistant' as const, content: data.content };
          setMessages(prev => [...prev, botMsg]);
          
          // 2. Fetch Audio for Response (Google Cloud TTS)
          playGoogleTTS(data.content);
      } 

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "I am having trouble connecting. Please check your internet." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- GOOGLE CLOUD TTS PLAYER ---
  const playGoogleTTS = async (text: string) => {
    try {
        setIsSpeaking(true);
        
        const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: lang })
        });

        const data = await res.json();

        if (data.audio) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            
            // Create audio from Base64
            const audioSrc = `data:audio/mp3;base64,${data.audio}`;
            audioRef.current = new Audio(audioSrc);
            
            audioRef.current.onended = () => setIsSpeaking(false);
            audioRef.current.play();
        }
    } catch (error) {
        console.error("Audio playback failed", error);
        setIsSpeaking(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
        recognition.start();
        recognition.onresult = (event: any) => {
            setInput(event.results[0][0].transcript);
        };
    } else {
        alert("Voice input not supported in this browser.");
    }
  };

  // --- UI RENDER ---
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-24 right-4 md:right-8 w-[90vw] md:w-[380px] h-[600px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col z-[100] border border-white/20 backdrop-blur-3xl
            ${darkMode ? "bg-[#1a0b10]/95 text-white" : "bg-white/95 text-slate-800"}`}
        >
            {/* HEADER */}
            <div className={`p-5 flex justify-between items-center ${darkMode ? "bg-white/5" : "bg-pink-50"}`}>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Matri-Bot</h3>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                            {lang === 'en' ? 'Caring Assistant' : 'আপনার সেবায়'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            setLang(prev => prev === 'en' ? 'bn' : 'en');
                            stopAudio();
                        }} 
                        className={`px-3 py-1 rounded-full text-xs font-bold transition border
                        ${darkMode ? "bg-white/10 border-white/10 hover:bg-white/20" : "bg-white border-pink-100 hover:bg-white/80 shadow-sm"}`}
                    >
                        {lang === 'en' ? 'ENG' : 'বাংলা'}
                    </button>
                    <button onClick={onClose} className={`p-2 rounded-full transition ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* MESSAGES AREA */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                {messages.map((msg, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className={`flex flex-col ${msg.role === 'user' ? "items-end" : "items-start"}`}
                    >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? "flex-row-reverse" : ""}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <Bot className="w-4 h-4 text-white"/>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                {msg.image && (
                                    <img src={msg.image} alt="Upload" className="w-48 h-auto rounded-2xl border border-white/10 shadow-sm" />
                                )}
                                {msg.content && (
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                                        ${msg.role === 'user' 
                                            ? "bg-pink-600 text-white rounded-br-none" 
                                            : (darkMode ? "bg-white/10 text-gray-100 rounded-bl-none" : "bg-white border border-slate-100 text-slate-700 rounded-bl-none")}`}>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center"><Bot className="w-4 h-4 text-white"/></div>
                        <div className={`px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center ${darkMode ? "bg-white/10" : "bg-white border border-slate-100"}`}>
                            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"/>
                            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce delay-75"/>
                            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce delay-150"/>
                        </div>
                    </div>
                )}
            </div>

            {/* INPUT AREA */}
            <div className={`p-4 border-t ${darkMode ? "border-white/10 bg-[#150a12]" : "border-slate-100 bg-slate-50"}`}>
                
                {selectedImage && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-pink-500/10 rounded-xl border border-pink-500/20 w-max animate-in slide-in-from-bottom-2">
                        <img src={selectedImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-xs font-bold text-pink-500">Image added</span>
                        <button onClick={() => setSelectedImage(null)}><Trash2 className="w-4 h-4 text-pink-500" /></button>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-full transition-colors mb-1 ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-100 border border-slate-200"}`}>
                        <Paperclip className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-slate-400"}`} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                    <div className={`flex-1 rounded-[1.5rem] flex items-center gap-2 px-2 py-1 transition-all border ${darkMode ? "bg-white/5 border-white/10 focus-within:border-pink-500/50" : "bg-white border-slate-200 focus-within:border-pink-300"}`}>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder={lang === 'bn' ? "এখানে লিখুন..." : "Type here..."}
                            className="w-full bg-transparent outline-none text-sm px-3 py-2.5"
                        />
                        <button onClick={startListening} className="p-2 text-slate-400 hover:text-pink-500 transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>

                    <button 
                        onClick={sendMessage} 
                        disabled={(!input.trim() && !selectedImage) || isLoading} 
                        className={`p-3 rounded-full shadow-lg transition-all transform active:scale-95 mb-1 ${(!input.trim() && !selectedImage) ? "bg-slate-300 text-white" : "bg-pink-600 text-white shadow-pink-500/30"}`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
                
                <div className="flex justify-center mt-2 items-center gap-2">
                    <button onClick={isSpeaking ? stopAudio : () => playGoogleTTS(messages[messages.length-1]?.content)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${isSpeaking ? "bg-pink-100 text-pink-600" : "text-gray-400 hover:bg-white/5"}`}>
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{isSpeaking ? "Stop" : "Read Aloud"}</span>
                    </button>
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}