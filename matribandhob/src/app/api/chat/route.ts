import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { RAGService } from "@/lib/rag.service"; 
import { SiteMap } from "@/config/site-map";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  let language = 'en'; 

  try {
    const body = await req.json();
    const { message, history, userProfile, pageContext, image } = body;
    if (body.language) language = body.language;

    // --- 1. RAG SEARCH (Knowledge Injection) ---
    let ragContext = "";
    try {
      const searchResults = await RAGService.search(message, language);
      if (searchResults) {
        ragContext = `\n[VERIFIED MEDICAL DATABASE]:\n"${searchResults}"\n(Prioritize this info over general knowledge.)`;
      }
    } catch (e) { console.warn("RAG Search skipped"); }

    // --- 2. EMERGENCY SAFETY CHECK ---
    const dangerKeywords = ["bleeding", "severe pain", "unconscious", "fainted", "heavy blood", "no movement", "convulsion"];
    if (dangerKeywords.some(k => message.toLowerCase().includes(k))) {
      return NextResponse.json({ 
        reply: language === 'bn' 
          ? "আমি জরুরি বিপদ চিহ্ন শনাক্ত করেছি। আমি এখনই SOS প্রোটোকল চালু করছি। শান্ত থাকুন এবং ডাক্তার ডাকুন।" 
          : "I have detected a medical emergency. Activating SOS Protocol immediately. Please stay calm and call a doctor.",
        action: "TRIGGER_SOS"
      });
    }

    // --- 3. HISTORY SANITIZER ---
    let validHistory = history.map((msg: any) => ({
      role: msg.role === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    // Fix Gemini 'First message must be user' error
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
      validHistory.shift();
    }

    // --- 4. SITE AWARENESS (Navigation Map) ---
    const siteStructure = Object.entries(SiteMap)
      .map(([key, val]) => `- ${key}: ${val.description} (URL: ${val.url})`)
      .join("\n");

    // --- 5. SYSTEM PROMPT (The "Brain") ---
    const systemPrompt = `
      ROLE: You are 'Matri-Care AI', an advanced medical companion for pregnant mothers.
      
      USER CONTEXT:
      - Mother: ${userProfile?.name || "Ma"} (Week ${userProfile?.week || "?"})
      - Language: ${language === 'bn' ? "Bengali" : "English"}
      - Current Page: ${pageContext?.url || "Home"}

      CAPABILITIES & TOOLS:
      1. **RAG Database:** Use the [VERIFIED MEDICAL DATABASE] below for answers.
      2. **Pusti Kotha (Nutrition):** If the user asks about diet, food, or nutrition, refer them to the 'Pusti Kotha' feature (URL: /patient/wellness) AND give a short tip.
      3. **Navigation:** You can control the app. If asked to go to "doctors", "profile", "wellness", or "SOS", return the "NAVIGATE" action with the URL from the SITE MAP below.
      4. **Health Logging:** If the user states vitals (e.g., "My BP is 120/80", "Weight 65kg"), return "LOG_HEALTH".

      SITE MAP:
      ${siteStructure}

      STRICT RULES:
      1. **Doctor First:** After explaining ANY symptom or medicine, MUST add: "Please consult a doctor before taking action."
      2. **Tone:** Warm, motherly, natural. NO robotic phrasing.
      3. **Greetings:** NEUTRAL only (e.g., "Hello Ma", "Dear"). NO religious terms (No Salam/Namaskar).

      ${ragContext}
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "reply": "Your natural spoken response here...", 
        "action": "NAVIGATE" | "LOG_HEALTH" | "TRIGGER_SOS" | "NONE",
        "data": "URL string OR Health Data Object"
      }
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // --- 6. GENERATE CONTENT ---
    let result;
    if (image) {
      // Image Analysis Mode
      const imagePart = {
        inlineData: {
          data: image.split(",")[1], 
          mimeType: "image/jpeg"
        }
      };
      result = await model.generateContent([systemPrompt, imagePart, message]);
    } else {
      // Text Chat Mode
      const chat = model.startChat({ history: validHistory });
      result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${message}`);
    }

    // --- 7. PARSE & VALIDATE RESPONSE ---
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(result.response.text());
    } catch (e) {
      parsedResponse = { reply: result.response.text(), action: "NONE" };
    }

    // Ensure 'reply' exists (fixes "invisible message" bug)
    const finalResponse = {
      reply: parsedResponse.reply || parsedResponse.text || "I am processing that...", 
      action: parsedResponse.action || "NONE",
      data: parsedResponse.data || null
    };

    // --- 8. LOGGING (Server-Side) ---
    if (finalResponse.action === "LOG_HEALTH" && userProfile?.uid) {
       try {
         await addDoc(collection(db, "users", userProfile.uid, "health_logs"), {
          ...finalResponse.data,
          timestamp: serverTimestamp()
         });
       } catch (err) { console.error("Logging failed", err); }
    }

    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error("AI Brain Error:", error);
    return NextResponse.json({ 
      reply: language === 'bn' 
        ? "দুঃখিত, সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন।" 
        : "I am having trouble connecting. Please check your internet.", 
      action: "NONE" 
    }, { status: 500 });
  }
}