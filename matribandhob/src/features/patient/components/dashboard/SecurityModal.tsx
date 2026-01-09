"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, X, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: "" });
  const [showPass, setShowPass] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return setStatus({ type: 'error', msg: "New passwords do not match." });
    }
    
    setLoading(true);
    setStatus({ type: null, msg: "" });

    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("User session not found.");

      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);

      // 2. Update Password
      await updatePassword(user, passwords.new);

      // 3. Log Change in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        "settings.lastPasswordChange": serverTimestamp()
      });

      setStatus({ type: 'success', msg: "Password updated successfully!" });
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: err.message.includes("wrong-password") ? "Incorrect current password." : "Failed to update. Try again." });
    } finally {
      setLoading(false);
    }
  };
        
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#1a0b10] border border-pink-500/20 rounded-[2.5rem] p-8 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/20 flex items-center justify-center text-pink-500"><ShieldCheck size={28}/></div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Security</h2>
                <p className="text-xs text-gray-500">Update your account password</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                  <input type={showPass ? "text" : "password"} required className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-12 text-sm text-white focus:border-pink-500 outline-none transition-all" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-3.5 text-gray-500">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
              </div>

              

              <div className="h-px bg-white/5 my-2" />

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">New Password</label>
                <input type="password" required className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-pink-500 outline-none" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirm New Password</label>
                <input type="password" required className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-pink-500 outline-none" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
              </div>

              {status.msg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {status.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {status.msg}
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-pink-600/20 transition-transform active:scale-95 disabled:opacity-50">
                {loading ? "Verifying..." : "Update Password"}
              </button>
            </form>
          </motion.div>

          
        </div>

        
      )}
    </AnimatePresence>
  );
}