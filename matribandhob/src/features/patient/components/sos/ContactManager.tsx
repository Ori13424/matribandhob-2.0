"use client";
import { useState } from "react";
import { Plus, Trash2, Phone, User, Save } from "lucide-react";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ContactManager({ user, contacts = [], darkMode }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newContact.name || !newContact.phone) return;
    setLoading(true);
    try {
        const contactData = { ...newContact, id: Date.now().toString() };
        await updateDoc(doc(db, "users", user.uid), {
            emergencyContacts: arrayUnion(contactData)
        });
        setNewContact({ name: "", phone: "", relation: "" });
        setIsAdding(false);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (contact: any) => {
    if (!contact.id || contact.isPrimary) return; // Protect primary contact
    if(!confirm("Remove this contact?")) return;
    try {
        await updateDoc(doc(db, "users", user.uid), {
            emergencyContacts: arrayRemove(contact)
        });
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`p-6 rounded-[2rem] border overflow-hidden ${darkMode ? "bg-[#1e1b20]/50 border-white/5" : "bg-white border-pink-100 shadow-sm"}`}>
        <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                <Phone className="w-4 h-4" /> Trusted Contacts
            </h3>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition ${darkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
            >
                {isAdding ? "Cancel" : "+ Add New"}
            </button>
        </div>

        {isAdding && (
            <div className={`mb-4 p-4 rounded-xl border animate-in slide-in-from-top-2 space-y-3 ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100"}`}>
                <input placeholder="Name" value={newContact.name} onChange={e=>setNewContact({...newContact, name: e.target.value})} className={`w-full p-2 rounded-lg text-sm bg-transparent border ${darkMode ? "border-gray-600 text-white" : "border-gray-200"}`} />
                <input placeholder="Phone" value={newContact.phone} onChange={e=>setNewContact({...newContact, phone: e.target.value})} className={`w-full p-2 rounded-lg text-sm bg-transparent border ${darkMode ? "border-gray-600 text-white" : "border-gray-200"}`} />
                <button onClick={handleAdd} disabled={loading} className="w-full py-2 bg-pink-600 text-white rounded-lg font-bold text-xs">{loading ? "Saving..." : "Save Contact"}</button>
            </div>
        )}

        <div className="space-y-3">
            {contacts.map((contact: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50/50 border-slate-100"}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${contact.isPrimary ? "bg-pink-100 text-pink-600" : (darkMode ? "bg-white/10 text-white" : "bg-slate-200 text-slate-600")}`}>
                            {contact.name[0]}
                        </div>
                        <div>
                            <p className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>
                                {contact.name} 
                                {contact.isPrimary && <span className="ml-2 text-[9px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded">PRIMARY</span>}
                            </p>
                            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-slate-400"}`}>{contact.phone}</p>
                        </div>
                    </div>
                    {!contact.isPrimary && (
                        <button onClick={() => handleDelete(contact)} className="p-2 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}