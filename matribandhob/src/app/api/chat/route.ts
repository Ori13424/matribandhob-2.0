import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Tool } from '@google/generative-ai';
import { retrieveContext } from '@/lib/rag-service';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 🚨 EMERGENCY KEYWORDS (Bipod Chinno)
// Sourced from WHO/DGHS Danger Signs [cite: 102, 103, 106, 109, 112, 118]
const DANGER_KEYWORDS = [
  // Bleeding
  'bleeding', 'blood', 'hemorrhage', 'rokto', 'rorktopat', 'spotting',
  // Convulsions
  'fit', 'convulsion', 'seizure', 'khichuni', 'shake', 'shaking', 'dat lege',
  // Headache/Vision
  'headache', 'blur', 'vision', 'matha betha', 'chokhe jhapsa', 'sorse ful',
  // Fever
  'fever', 'temperature', 'jor', 'gorom',
  // Movement
  'no movement', 'stopped moving', 'not moving', 'nora bondho', 'kome geche', 'less movement',
  // Water Break
  'water break', 'pani bhanga', 'fluid'
];

export async function POST(req: Request) {
  try {
    if (!genAI) {
      throw new Error("GEMINI_API_KEY is missing in .env.local");
    }

    const body = await req.json();
    const { messages, pageContext, language, image } = body;
    
    // 1. Get User's Latest Input
    const userMessage = messages[messages.length - 1].content || "";
    const userMessageLower = userMessage.toLowerCase();

    // 2. 🚨 SAFETY CHECK: Detect Danger Signs 
    // If any danger keyword is present, we trigger SOS Mode.
    const isSOS = DANGER_KEYWORDS.some(keyword => userMessageLower.includes(keyword));

    // 3. RAG: Fetch Context
    // In SOS mode, we specifically look for 'emergency' tags in our knowledge base [cite: 187]
    const queryForRag = isSOS ? "danger emergency hospital 16263" : (userMessage || "Analyze this image");
    const contextData = await retrieveContext(queryForRag, pageContext);

    // 4. Determine Tools
    // Disable Google Search in SOS mode to prevent distraction; force hard medical facts.
    const tools: Tool[] | undefined = (!contextData && !isSOS) ? [{ googleSearch: {} } as Tool] : undefined;

    // 5. Construct System Prompt
    let systemInstruction = "";

    if (isSOS) {
        // --- EMERGENCY PERSONA [cite: 186, 187] ---
        // Direct, authoritative, urgency-focused.
        systemInstruction = `
          You are 'Matri-Bot' in EMERGENCY MODE.
          
          [CRITICAL INSTRUCTION]:
          The user has mentioned a potential DANGER SIGN (Bipod Chinno).
          
          1. **IMMEDIATE ACTION:** Tell them to go to the 'Upazila Health Complex' or 'District Hospital' IMMEDIATELY.
          2. **NO DIAGNOSIS:** Do not explain *why* or ask for more symptoms. Just act.
          3. **HELPLINE:** Tell them to call **16263** (Shastho Batayon) right now.
          4. **TONE:** Urgent but calm. Use short, clear sentences.
          5. **LANGUAGE:** Respond strictly in ${language === 'bn' ? 'Bangla' : 'English'}.
          
          [VERIFIED EMERGENCY PROTOCOLS]:
          ${contextData}
        `;
    } else {
        // --- STANDARD CARE PERSONA [cite: 14, 15] ---
        // Gentle, "Didi" (Sister) archetype.
        systemInstruction = `
          You are 'Matri-Bot', a caring, motherly ('Boro Apa') medical assistant for pregnant women in rural Bangladesh.
          
          [PERSONA RULES]:
          1. **No Religious Greetings:** Use "Hello", "Shagotom".
          2. **Language:** Respond strictly in ${language === 'bn' ? 'Bangla' : 'English'}.
          3. **Tone:** Calm, empathetic, soothing.
          4. **Source of Truth:** Use the [LOCAL DATABASE] below strictly. If empty, use Google Search for WHO/DGHS data only.
          5. **Taboos:** If asked about myths (pineapple, duck meat), gently correct them using the "Harm Reduction" strategy[cite: 78].
          
          [LOCAL DATABASE]:
          ${contextData || "No local data found. Use Google Search if needed."}
          
          [USER CONTEXT]:
          User is on the "${pageContext}" page.
        `;
    }

    // 6. Initialize Model
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
        tools: tools 
    });

    // 7. Prepare Input
    const promptParts: any[] = [];
    if (userMessage) promptParts.push(userMessage);
    else promptParts.push(isSOS ? "Emergency detected." : "Analyze this image.");

    if (image) {
        const base64Data = image.includes('base64,') ? image.split(',')[1] : image;
        const mimeType = image.includes(':') ? image.split(':')[1].split(';')[0] : 'image/jpeg';
        promptParts.push({
            inlineData: { data: base64Data, mimeType: mimeType }
        });
    }

    // 8. Generate Response
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const aiResponse = response.text();

    return NextResponse.json({ 
      role: 'assistant', 
      content: aiResponse,
      isSOS: isSOS // 🚩 Flag sent to frontend to trigger UI Red Alert
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error.message);
    return NextResponse.json(
      { error: "Error", details: "I am having trouble connecting. Please try again." }, 
      { status: 500 }
    );
  }
}