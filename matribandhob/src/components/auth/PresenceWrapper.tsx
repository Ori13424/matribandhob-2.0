"use client";
import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PresenceWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);

      // 1. Set Status to ONLINE immediately
      updateDoc(userRef, { 
        isOnline: true, 
        lastActive: serverTimestamp() 
      }).catch(e => console.error("Presence Error:", e));

      // 2. Set Status to OFFLINE when closing tab/window
      const setOffline = () => {
         updateDoc(userRef, { 
           isOnline: false, 
           lastActive: serverTimestamp() 
         });
      };

      window.addEventListener("beforeunload", setOffline);

      // Cleanup function (runs when component unmounts/logout)
      return () => {
        window.removeEventListener("beforeunload", setOffline);
        setOffline();
      };
    });
    return () => unsub();
  }, []);

  return <>{children}</>;
}