import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type LogLevel = "info" | "warning" | "error" | "critical";

export interface SystemLog {
    id?: string;
    level: LogLevel;
    message: string;
    description: string;
    timestamp: any;
    metadata?: any;
    path?: string;
}

export const logSystemEvent = async (
    level: LogLevel,
    message: string,
    description: string = "",
    metadata: any = {}
) => {
    try {
        // In a real production app, you might want to switch based on env, 
        // e.g. only logging errors to DB in prod, everything in dev

        await addDoc(collection(db, "system_logs"), {
            level,
            message,
            description,
            metadata,
            timestamp: serverTimestamp(),
            path: window.location.pathname // capture where error occurred
        });

        if (level === 'error' || level === 'critical') {
            console.error(`[SYSTEM LOG][${level.toUpperCase()}]`, message, description);
        } else {
            console.log(`[SYSTEM LOG][${level.toUpperCase()}]`, message);
        }
    } catch (e) {
        console.error("Failed to write system log:", e);
    }
};

export const fetchSystemLogs = async (limitCount = 50) => {
    try {
        const q = query(
            collection(db, "system_logs"),
            orderBy("timestamp", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemLog));
    } catch (e) {
        console.error("Failed to fetch logs:", e);
        return [];
    }
};
