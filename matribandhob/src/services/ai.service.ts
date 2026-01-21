
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RAGService } from "@/lib/rag.service";
import { SiteMap } from "@/config/site-map";

// Define interfaces for better type safety
export interface ChatMessage {
  role: 'user' | 'model' | 'bot';
  content: string;
  image?: string | null;
}

export interface AIResponse {
  reply: string;
  action: "NAVIGATE" | "LOG_HEALTH" | "TRIGGER_SOS" | "NONE";
  data: string | object | null;
}

export interface UserProfile {
  uid?: string;
  name?: string;
  week?: number | string;
  medicalHistory?: {
    conditions?: string[];
    complications?: string[];
  };
  medsAndAllergies?: {
    medications?: string;
    drugAllergies?: string;
  };
}

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
  }

  private getSystemPrompt(language: string, userProfile: UserProfile, pageContextUrl: string, ragContext: string): string {
    const siteStructure = Object.entries(SiteMap)
      .map(([key, val]) => `- ${key}: ${val.description} (URL: ${val.url})`)
      .join("\n");

    const historyStr = userProfile.medicalHistory ?
      `Conditions: ${userProfile.medicalHistory.conditions?.join(", ")}. Past Complications: ${userProfile.medicalHistory.complications?.join(", ")}` : "None";

    const medsStr = userProfile.medsAndAllergies ?
      `Current Meds: ${userProfile.medsAndAllergies.medications || "None"}. Allergies: ${userProfile.medsAndAllergies.drugAllergies || "None"}` : "None";

    return `
      ROLE: You are 'Matri-Care AI', an advanced medical companion for pregnant mothers.
      
      USER CONTEXT:
      - Mother: ${userProfile?.name || "Ma"} (Week ${userProfile?.week || "?"})
      - Medical History: ${historyStr}
      - Meds & Allergies: ${medsStr}
      - Language: ${language === 'bn' ? "Bengali" : "English"}
      - Current Page: ${pageContextUrl || "Home"}

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
      4. **Risk Awareness:** Check "Medical History" above. If user has a condition (e.g., Diabetes) and asks about sugar/diet, give SPECIFIC warnings related to that condition.

      ${ragContext}
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "reply": "Your natural spoken response here...", 
        "action": "NAVIGATE" | "LOG_HEALTH" | "TRIGGER_SOS" | "NONE",
        "data": "URL string OR Health Data Object"
      }
    `;
  }

  async generateResponse(
    message: string,
    history: ChatMessage[],
    userProfile: UserProfile,
    pageContext: { url: string },
    language: string = 'en',
    image?: string | null
  ): Promise<AIResponse> {

    // 1. RAG Search
    let ragContext = "";
    try {
      const searchResults = await RAGService.search(message, language);
      if (searchResults) {
        ragContext = `\n[VERIFIED MEDICAL DATABASE]:\n"${searchResults}"\n(Prioritize this info over general knowledge.)`;
      }
    } catch (e) {
      console.warn("RAG Search skipped", e);
    }

    // 2. Emergency Safety Check (Severity Scorer)
    // We assume high risk if keywords match AND user contexts suggest complications
    const dangerKeywords = ["bleeding", "severe pain", "unconscious", "fainted", "heavy blood", "no movement", "convulsion"];
    const isCritical = dangerKeywords.some(k => message.toLowerCase().includes(k));

    if (isCritical) {
      return {
        reply: language === 'bn'
          ? "আমি জরুরি বিপদ চিহ্ন শনাক্ত করেছি। আমি এখনই SOS প্রোটোকল চালু করছি। শান্ত থাকুন এবং ডাক্তার ডাকুন।"
          : "I have detected a medical emergency. Activating SOS Protocol immediately. Please stay calm and call a doctor.",
        action: "TRIGGER_SOS",
        data: null
      };
    }

    // 3. Format History
    let validHistory = history.map((msg) => ({
      role: msg.role === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    if (validHistory.length > 0 && validHistory[0].role === 'model') {
      validHistory.shift();
    }

    // 4. Generate Content
    const systemPrompt = this.getSystemPrompt(language, userProfile, pageContext.url, ragContext);

    let result;
    try {
      if (image) {
        const imagePart = {
          inlineData: {
            data: image.split(",")[1],
            mimeType: "image/jpeg"
          }
        };
        result = await this.model.generateContent([systemPrompt, imagePart, message]);
      } else {
        const chat = this.model.startChat({ history: validHistory });
        result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${message}`);
      }

      // 5. Parse Response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(result.response.text());
      } catch (e) {
        console.error("Failed to parse JSON response", e);
        parsedResponse = { reply: result.response.text(), action: "NONE" };
      }

      return {
        reply: parsedResponse.reply || parsedResponse.text || "I am processing that...",
        action: parsedResponse.action || "NONE",
        data: parsedResponse.data || null
      };

    } catch (error) {
      console.error("Gemini Generation Error", error);
      return {
        reply: language === 'bn' ? "দুঃখিত, আমি এখন উত্তর দিতে পারছি না।" : "I am unable to answer right now.",
        action: "NONE",
        data: null
      }
    }
  }
}

export const aiService = new AIService(process.env.GEMINI_API_KEY || "");
