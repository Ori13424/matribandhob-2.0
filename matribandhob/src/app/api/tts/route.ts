import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';

// Formatting the private key correctly for Vercel/Env variables
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const client = new textToSpeech.TextToSpeechClient({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
  },
});

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    // --- 1. SAFETY CHECK (Prevents 500 Crashes) ---
    // If text is empty or missing, return null audio immediately.
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ audio: null });
    }

    // --- 2. VOICE CONFIGURATION (Stable & Natural) ---
    // We use Wavenet because it is the most reliable production model.
    const voiceParams = language === 'bn'
      ? { 
          languageCode: 'bn-IN', // India region is more stable for Bangla than BD
          name: 'bn-IN-Wavenet-A', 
          ssmlGender: 'FEMALE' as const 
        }
      : { 
          languageCode: 'en-US', 
          name: 'en-US-Wavenet-F', // 'F' variant is warmer/softer
          ssmlGender: 'FEMALE' as const 
        };

    const request = {
      input: { text },
      voice: voiceParams,
      audioConfig: { 
        audioEncoding: 'MP3' as const,
        // --- 3. HUMAN TUNING ---
        speakingRate: 0.90, // Slightly slower = more thoughtful
        pitch: -2.5,        // Lower pitch = less electronic/squeaky
        volumeGainDb: 1.0   // Slight boost
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error("Google Cloud returned no audio content.");
    }

    return NextResponse.json({ 
      audio: Buffer.from(response.audioContent as Uint8Array).toString('base64') 
    });

  } catch (error: any) {
    console.error("TTS API Error Details:", error.message);
    return NextResponse.json(
      { error: "TTS Failed", details: error.message }, 
      { status: 500 }
    );
  }
}