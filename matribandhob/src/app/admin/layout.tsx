"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check role in Firestore
                const docRef = doc(db, "users", user.uid);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data();
                    // Allow if role is 'admin' OR if it's the specific dev account
                    if (data.role === 'admin' || user.email === 'admin@matribandhob.com') {
                        setAuthorized(true);
                        setLoading(false);
                        return;
                    }
                }
                // Not authorized
                router.push("/login");
            } else {
                router.push("/login");
            }
        });
        return () => unsub();
    }, [router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                    <p className="text-slate-500 font-bold animate-pulse">Verifying Admin Access...</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar could go here */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
