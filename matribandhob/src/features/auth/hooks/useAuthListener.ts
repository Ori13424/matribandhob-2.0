"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
// Adjust these paths based on your folder structure
import { useAuthStore } from "../logic/useAuthStore";
import { UserProfile } from "../logic/authService";

export function useAuthListener() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in, fetch their Role/Profile from Firestore
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const profile = userSnap.data() as UserProfile;
            setUser(currentUser, profile);
          } else {
            // Profile missing? Set basic user data but null profile
            // Or you could trigger a "finish registration" flow here
            setUser(currentUser, null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(currentUser, null);
        }
      } else {
        // User is logged out
        setUser(null, null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
}