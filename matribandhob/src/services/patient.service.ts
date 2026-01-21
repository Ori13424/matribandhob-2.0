
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, DocumentData, Timestamp } from "firebase/firestore";

export interface Patient {
    id: string;
    name: string;
    week: number;
    edd: string;
    bloodGroup: string;
    location: any;
    sosTriggered: boolean;
    isHighRisk: boolean;
    lastVital: any;
    vitalHistory: any[];
    status: string;
    statusColor: string;
    phone: string;
}

export interface DashboardStats {
    activeMothers: number;
    onlineDoctors: number;
}

export class PatientService {

    /**
     * Subscribes to patients and updates the list in real-time.
     * IMPROVEMENT: Allows filtering logic to be centralized.
     */
    static subscribeToPatients(
        onUpdate: (patients: Patient[], stats: DashboardStats) => void,
        onError: (error: any) => void
    ) {
        const q = query(collection(db, "users"));

        return onSnapshot(q, async (snapshot) => {
            let onlineDocs = 0;
            let activeMoms = 0;
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const patientPromises = snapshot.docs.map(async (doc) => {
                const data = doc.data();

                // Count Doctors
                if (data.role === 'doctor') {
                    if (data.isOnline === true) onlineDocs++;
                    return null;
                }
                // Skip Drivers
                if (data.role === 'driver') {
                    return null;
                }

                // Count Active Moms
                if (data.lastActive?.toDate() > oneDayAgo) {
                    activeMoms++;
                }

                // Fetch Last Vitals (Last 7 for Sparkline)
                const healthQ = query(collection(db, "users", doc.id, "health_logs"), orderBy("timestamp", "desc"), limit(7));
                const healthSnap = await getDocs(healthQ);

                const vitalHistory = healthSnap.docs.map(d => d.data()).reverse(); // Reverse for chronological order
                const lastVital = vitalHistory.length > 0 ? vitalHistory[vitalHistory.length - 1] : null;

                let status = "Normal";
                let statusColor = "green";
                let sosTriggered = data.sosTriggered === true;
                let isHighRisk = data.isHighRisk === true;

                if (lastVital?.bp) {
                    const [sys, dia] = lastVital.bp.split('/').map(Number);
                    if (sys >= 140 || dia >= 90) {
                        status = "High BP";
                        statusColor = "red";
                        isHighRisk = true; // Infer high risk from vitals if not already set
                    }
                }
                if (sosTriggered) { status = "SOS ALERT"; statusColor = "red"; }

                return {
                    id: doc.id,
                    name: data.basicInfo?.fullName || data.fullName || "Unknown",
                    week: data.pregnancyDetails?.currentWeek || 0,
                    edd: data.pregnancyDetails?.edd || "N/A",
                    bloodGroup: data.basicInfo?.bloodGroup || "--",
                    location: data.location || null,
                    sosTriggered: sosTriggered,
                    isHighRisk: isHighRisk,
                    lastVital,
                    vitalHistory, // Add to object
                    status,
                    statusColor,
                    phone: data.basicInfo?.phone || "N/A"
                } as Patient;
            });

            const results = await Promise.all(patientPromises);
            const patients = results.filter((p): p is Patient => p !== null);

            onUpdate(patients, { activeMothers: activeMoms, onlineDoctors: onlineDocs });
        }, onError);
    }
}
