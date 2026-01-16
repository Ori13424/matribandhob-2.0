"use server";
import twilio from "twilio";

// Initialize Twilio Client
// Ensure these exist in your .env.local file
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSOSNotification(contacts: any[], userDetails: any, locationLink: string) {
  try {
    // 1. The specific Sender Number you provided
    const fromNumber = "+16506682925"; 
    
    // 2. The specific Central/Doctor Number you provided
    const centralEmergencyNumber = "+18777804236";

    // 3. Construct the Message
    const messageBody = `🚨 SOS EMERGENCY 🚨\n\nPatient: ${userDetails.name}\nPhone: ${userDetails.phone || "N/A"}\n\n📍 Location: ${locationLink}\n\nPlease respond immediately.`;

    // 4. Build a list of unique phone numbers to text
    // We combine the user's personal contacts + the Central Emergency Number
    const recipients = new Set([
      centralEmergencyNumber, 
      ...contacts.map((c) => c.phone)
    ]);

    // 5. Send SMS to all recipients
    const promises = Array.from(recipients).map((phoneNumber) => {
      // Basic validation to ensure number isn't empty
      if (!phoneNumber) return Promise.resolve();

      // Ensure E.164 format (Simple fix for BD numbers if needed)
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