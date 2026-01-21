"use server";
import twilio from "twilio";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";

// Initialize Twilio Client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSOSNotification(contacts: any[], userDetails: any, locationLink: string) {
  try {
    const fromNumber = "+16506682925";
    const centralEmergencyNumber = "+18777804236";

    const messageBody = `🚨 SOS EMERGENCY 🚨\n\nPatient: ${userDetails.name}\nPhone: ${userDetails.phone || "N/A"}\n\n📍 Location: ${locationLink}\n\nPlease respond immediately.`;

    const recipients = new Set([
      centralEmergencyNumber,
      ...contacts.map((c: any) => c.phone)
    ]);

    const promises = Array.from(recipients).map((phoneNumber) => {
      if (!phoneNumber) return Promise.resolve();
      let to = phoneNumber as string;
      if (!to.startsWith('+')) {
        to = `+880${to.replace(/^0+/, '')}`;
      }

      return client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: to,
      });
    });

    await Promise.all(promises);
    return { success: true };

  } catch (error) {
    console.error("Twilio SMS Failed:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}

// --- DRIVER DISPATCH LOGIC ---

export async function dispatchDriver(alertId: string, patientLat: number, patientLng: number, patientName: string) {
  try {
    // 1. Fetch available drivers
    const q = query(collection(db, "users"), where("role", "==", "driver"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { success: false, message: "No drivers found" };

    let nearestDriver: any = null;
    let minDistance = Infinity;

    snapshot.docs.forEach(doc => {
      const driver = doc.data();
      if (driver.location && driver.location.lat && driver.location.lng) {
        const dist = getDistanceFromLatLonInKm(patientLat, patientLng, driver.location.lat, driver.location.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestDriver = { id: doc.id, ...driver, distance: dist };
        }
      }
    });

    // Threshold: 50km
    if (nearestDriver && minDistance < 50) {
      // 2. Assign Driver to Alert
      await updateDoc(doc(db, "alerts", alertId), {
        assignedDriverId: nearestDriver.id,
        driverName: nearestDriver.fullName || nearestDriver.name || "Unknown Driver",
        driverPhone: nearestDriver.phone || "N/A",
        driverLocation: nearestDriver.location,
        driverDistance: minDistance.toFixed(2),
        status: "DISPATCHED",
        dispatchedAt: serverTimestamp()
      });

      // 3. Send SMS to Driver via Twilio
      if (nearestDriver.phone) {
        try {
          const driverPhone = nearestDriver.phone.startsWith('+') ? nearestDriver.phone : `+880${nearestDriver.phone.replace(/^0+/, '')}`;
          await client.messages.create({
            body: `🚑 New Emergency Ride Request\n\nPatient: ${patientName}\nDistance: ${minDistance.toFixed(2)} km\n\n📍 Pickup Location: http://maps.google.com/?q=${patientLat},${patientLng}\n\nPlease proceed immediately.`,
            from: "+16506682925",
            to: driverPhone,
          });
        } catch (smsError) {
          console.error("Failed to notify driver via SMS:", smsError);
          // Don't fail the whole dispatch if SMS fails, just log it
        }
      }

      return { success: true, driver: nearestDriver };
    } else {
      return { success: false, message: "No drivers nearby" };
    }

  } catch (error) {
    console.error("Dispatch Failed:", error);
    return { success: false, error: "Dispatch error" };
  }
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}