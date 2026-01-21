import { NextResponse } from "next/server";
import { aiService } from "@/services/ai.service";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  let language = 'en';

  try {
    const body = await req.json();
    const { message, history, userProfile, pageContext, image } = body;
    if (body.language) language = body.language;

    // Use the AI Service to generate response
    const aiResponse = await aiService.generateResponse(
      message,
      history,
      userProfile,
      pageContext,
      language,
      image
    );

    // LOGGING (Server-Side) - kept here as it interacts with DB directly
    if (aiResponse.action === "LOG_HEALTH" && userProfile?.uid) {
      try {
        await addDoc(collection(db, "users", userProfile.uid, "health_logs"), {
          ...aiResponse.data as object,
          timestamp: serverTimestamp()
        });
      } catch (err) { console.error("Logging failed", err); }
    }

    return NextResponse.json(aiResponse);

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
