
import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface UserProfile {
    uid: string;
    name: string;
    phone: string;
    role: string;
    basicInfo: any;
    pregnancyDetails: any;
    medicalHistory: any;
    medsAndAllergies: any;
    currentHealth: any;
    onboardingComplete: boolean;
}

export function usePatientProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);

                const unsubDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfile({
                            uid: user.uid,
                            name: data.basicInfo?.fullName || "Mother",
                            phone: data.phone,
                            role: data.role,
                            basicInfo: data.basicInfo || {},
                            pregnancyDetails: data.pregnancyDetails || {},
                            medicalHistory: data.medicalHistory || {},
                            medsAndAllergies: data.medsAndAllergies || {},
                            currentHealth: data.currentHealth || {},
                            onboardingComplete: data.onboardingComplete || false,
                        });
                    }
                    setLoading(false);
                });

                return () => unsubDoc();
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => unsubAuth();
    }, []);

    return { profile, loading };
}
