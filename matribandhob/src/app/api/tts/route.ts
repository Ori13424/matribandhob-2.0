import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';

// --- FIX: HANDLE PRIVATE KEY FORMATTING ---
const privateKey = process.env.GOOGLE_PRIVATE_KEY
    

const client = new textToSpeech.TextToSpeechClient({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey || process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fallback replace
  },
});

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    // 1. Select the Best "Calm Female" Voice
    // 'bn-BD-Wavenet-A' is a high-quality Neural Bangla Female voice
    // 'en-US-Journey-F' is a new "Expressive" calm English voice
    const voiceName = language === 'bn' ? 'bn-BD-Wavenet-A' : 'en-US-Journey-F';
    const languageCode = language === 'bn' ? 'bn-BD' : 'en-US';

    const request = {
      input: { text: text },
      voice: { 
          languageCode: languageCode, 
          name: voiceName,
          ssmlGender: 'FEMALE' as const 
      },
      audioConfig: { 
          audioEncoding: 'MP3' as const,
          pitch: 0, 
          speakingRate: 0.95 // Slightly slower for a calm effect
      },
    };

    // 2. Call Google Cloud
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    if (!audioContent) {
        throw new Error("No audio content received");
    }

    // 3. Return Audio as Base64
    return NextResponse.json({ 
      audio: Buffer.from(audioContent).toString('base64') 
    });

  } catch (error: any) {
    console.error("Google TTS Error:", error);
    return NextResponse.json(
      { error: "TTS Failed", details: error.message }, 
      { status: 500 }
    );
  }
}