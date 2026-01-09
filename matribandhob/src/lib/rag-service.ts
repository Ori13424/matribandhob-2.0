// ==============================================================================
// 🏥 MATRI-CARE KNOWLEDGE BASE (SOURCE: Matri-Bot Research PDF)
// ==============================================================================
// This database is the "Ground Truth". The AI prioritizes this over general knowledge.
// ==============================================================================

export type KnowledgeChunk = {
  id: string;
  category: 'nutrition' | 'emergency' | 'general' | 'myth_busting' | 'medicine';
  tags: string[];
  content_en: string;
  content_bn: string;
};

const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  // --- 1. ANTENATAL CARE (ANC) ---
  {
    id: 'ANC_01',
    category: 'medicine',
    tags: ['anc', 'visit', 'schedule', 'checkup', 'doctor'],
    content_en: "According to Bangladesh DGHS guidelines, you must ensure at least 4 check-ups. The schedule is: 1st visit by 16 weeks, 2nd visit between 24-28 weeks, 3rd visit at 32 weeks, and 4th visit at 36 weeks. WHO recommends 8 visits for best safety.",
    content_bn: "বাংলাদেশ সরকারের নিয়ম অনুযায়ী, গর্ভাবস্থায় অন্তত ৪ বার চেক-আপ বা ডাক্তার দেখাতে হবে। সময়গুলো হলো: ১৬ সপ্তাহের মধ্যে প্রথমবার, ২৪-২৮ সপ্তাহের মধ্যে দ্বিতীয়বার, ৩২ সপ্তাহে তৃতীয়বার এবং ৩৬ সপ্তাহে চতুর্থবার।"
  },
  {
    id: 'ANC_03',
    category: 'medicine',
    tags: ['vaccine', 'tt', 'tetanus', 'injection', 'tika'],
    content_en: "To protect your newborn from tetanus, take the TT vaccine. If unprotected, take the 1st dose after the 4th month starts, and the 2nd dose 4 weeks later. The 2nd dose must be at least one month before delivery.",
    content_bn: "নবজাতককে ধনুষ্টংকার থেকে বাঁচাতে টিটি (TT) টিকা দিন। আগে টিকা না থাকলে, গর্ভের ৪ মাস পূর্ণ হলে ১ম ডোজ এবং তার ২৮ দিন পর ২য় ডোজ নিন। প্রসবের অন্তত এক মাস আগে ২য় ডোজ শেষ করতে হবে।"
  },
  
  // --- 2. NUTRITION (PUSTI) & TABOOS ---
  {
    id: 'NUT_01',
    category: 'nutrition',
    tags: ['food', 'diet', 'calories', 'eating', 'khabar'],
    content_en: "Pregnancy needs extra energy. Eat at least one extra handful of food at every main meal compared to usual. Drink plenty of water. A varied diet helps the baby grow.",
    content_bn: "গর্ভাবস্থায় বাড়তি শক্তি দরকার। স্বাভাবিকের চেয়ে প্রতি বেলা খাবারে অন্তত এক মুঠো বেশি ভাত বা খাবার খাবেন। প্রচুর পানি পান করুন। নানা পদের খাবার শিশুর বৃদ্ধি নিশ্চিত করে।"
  },
  {
    id: 'NUT_03',
    category: 'nutrition',
    tags: ['calcium', 'fish', 'mola', 'dhela', 'bones'],
    content_en: "Small fish like Mola and Dhela are best for calcium if eaten whole with bones. This builds the baby's bones. Milk and eggs are also excellent.",
    content_bn: "বাচ্চার হাড় শক্ত করতে মলা ও ঢেলা মাছ কাঁটাসুদ্ধ চিবিয়ে খান; এতে প্রচুর ক্যালসিয়াম থাকে। এছাড়া দুধ ও ডিম ক্যালসিয়ামের খুব ভালো উৎস।"
  },
  {
    id: 'NUT_04',
    category: 'myth_busting',
    tags: ['pineapple', 'anaros', 'myth', 'taboo', 'miscarriage'],
    content_en: "Many believe pineapple causes miscarriage. Medically, ripe pineapple is safe and healthy. But if you are worried, you can eat Guava or Oranges instead. Avoid raw papaya.",
    content_bn: "অনেকে ভাবেন আনারস খেলে গর্ভপাত হয়। ডাক্তাররা বলেন পাকা আনারস নিরাপদ। তবে আপনার ভয় লাগলে পেয়ারা বা কমলা খেতে পারেন। কাঁচা পেঁপে এড়িয়ে চলুন।"
  },
  {
    id: 'NUT_05',
    category: 'myth_busting',
    tags: ['duck', 'meat', 'voice', 'myth', 'liver'],
    content_en: "Some believe duck meat affects the baby's voice. This is a myth; duck liver is very good for blood. If elders forbid it, eat chicken liver or beef instead.",
    content_bn: "অনেকে বলেন হাঁসের মাংস খেলে বাচ্চার গলার স্বর হাঁসের মতো হয়, যা কুসংস্কার। হাঁসের কলিজা রক্তের জন্য খুব ভালো। তবে মুরব্বিরা নিষেধ করলে মুরগির কলিজা বা গরুর মাংস খান।"
  },

  // --- 3. DANGER SIGNS (BIPOD CHINNO) ---
  {
    id: 'DAN_01',
    category: 'emergency',
    tags: ['bleeding', 'blood', 'hemorrhage', 'rokto'],
    content_en: "Vaginal bleeding at any time during pregnancy, delivery, or after birth is a danger sign. It could mean the placenta is separated. Do not wait. Take the mother to a hospital immediately.",
    content_bn: "গর্ভাবস্থায়, প্রসবের সময় বা পরে যোনিপথে রক্তপাত হওয়া একটি মারাত্মক বিপদ চিহ্ন। এর মানে গর্ভফুল ছিঁড়ে যাওয়া হতে পারে। এক মুহূর্ত দেরি না করে মাকে দ্রুত হাসপাতালে নিন।"
  },
  {
    id: 'DAN_02',
    category: 'emergency',
    tags: ['fits', 'convulsions', 'seizure', 'khichuni'],
    content_en: "Convulsions or fits are signs of Eclampsia caused by high BP. Protect her head from injury and take her to a UHC or District Hospital immediately for medicine.",
    content_bn: "গর্ভবতী মায়ের খিঁচুনি বা দাঁত লেগে যাওয়া একলাম্পসিয়ার লক্ষণ। এটি উচ্চ রক্তচাপ থেকে হয়। মাকে আঘাত থেকে রক্ষা করুন এবং অবিলম্বে বড় হাসপাতালে (UHC/সদর) নিন।"
  },
  {
    id: 'DAN_03',
    category: 'emergency',
    tags: ['headache', 'vision', 'eyes', 'blurred'],
    content_en: "Severe headache that doesn't go away, with blurred vision or seeing spots, is a sign of very high blood pressure (Pre-eclampsia). This can lead to fits. Seek a doctor now.",
    content_bn: "প্রচণ্ড মাথাব্যথা যা কমে না এবং সাথে চোখে ঝাপসা বা সর্ষে ফুল দেখা উচ্চ রক্তচাপের (প্রি-একলাম্পসিয়া) লক্ষণ। এখান থেকে খিঁচুনি হতে পারে। দ্রুত ডাক্তার দেখান।"
  },
  {
    id: 'DAN_06',
    category: 'emergency',
    tags: ['movement', 'baby', 'kicking', 'nora'],
    content_en: "If the baby moves less or stops moving (after 5 months), it is urgent. Eat something sweet, lie on your left side. If less than 10 kicks in 12 hours, go to hospital.",
    content_bn: "৫ মাসের পর বাচ্চার নড়াচড়া কমে যাওয়া বা বন্ধ হওয়া বিপদের লক্ষণ। মিষ্টি খেয়ে বাঁ-কাত হয়ে শুয়ে গুনুন। ১২ ঘণ্টায় ১০ বারের কম নড়লে দ্রুত হাসপাতালে যান।"
  },

  // --- 4. EMERGENCY ACTION ---
  {
    id: 'EMR_01',
    category: 'emergency',
    tags: ['helpline', 'call', 'number', '16263', 'doctor'],
    content_en: "For immediate doctor advice, dial 16263 (Shastho Batayon). Available 24/7. Press 0 to talk to a doctor. You can also ask for ambulance numbers.",
    content_bn: "জরুরি পরামর্শের জন্য ১৬২৬৩ (স্বাস্থ্য বাতায়ন) নম্বরে ফোন করুন। এটি ২৪ ঘণ্টা খোলা। ০ চেপে ডাক্তারের সাথে কথা বলুন। অ্যাম্বুলেন্সের জন্যও এখানে ফোন করতে পারেন।"
  },
  {
    id: 'EMR_02',
    category: 'emergency',
    tags: ['hospital', 'pharmacy', 'clinic', 'uhc'],
    content_en: "If you see Danger Signs, do NOT go to a pharmacy or community clinic. Go straight to the Upazila Health Complex (UHC) or District Hospital. Only they have oxygen and surgeons.",
    content_bn: "বিপদ চিহ্ন দেখলে ফার্মেসি বা কমিউনিটি ক্লিনিকে সময় নষ্ট করবেন না। সোজা উপজেলা স্বাস্থ্য কমপ্লেক্স বা জেলা সদর হাসপাতালে যান। সেখানেই অক্সিজেন ও অপারেশনের ব্যবস্থা থাকে।"
  },

  // --- 5. HYGIENE & REST ---
  {
    id: 'HYG_02',
    category: 'general',
    tags: ['sleep', 'rest', 'position', 'left side'],
    content_en: "A pregnant mother works for two. Sleep 8 hours at night and rest 2 hours in the day. Lie on your left side when resting. This improves blood flow to the baby and reduces leg swelling.",
    content_bn: "গর্ভবতী মা দুজনের জন্য খাটেন। তাই রাতে ৮ ঘণ্টা এবং দিনে ২ ঘণ্টা বিশ্রাম নিন। বিশ্রাম বা ঘুমানোর সময় বাঁ-কাত হয়ে শোবেন। এতে বাচ্চার শরীরে রক্ত সঞ্চালন বাড়ে এবং আপনার পায়ে পানি আসা কমে।"
  },
  {
    id: 'HYG_03',
    category: 'general',
    tags: ['cord', 'navel', 'hexicord', 'baby'],
    content_en: "After birth, apply only 7.1% Chlorhexidine (Hexicord) on the baby's navel. Do NOT apply oil, ash, or cow dung. Keep the cord dry and clean.",
    content_bn: "জন্মের পর বাচ্চার নাভিতে শুধু ৭.১% ক্লোরহেক্সিডিন (হেক্সিকর্ড) লাগাবেন। তেল, ছাই বা গোবর ভুলেও দেবেন না। নাভি শুকনো ও পরিষ্কার রাখুন।"
  }
];

// ==============================================================================
// 🧠 RETRIEVAL LOGIC
// ==============================================================================

export async function retrieveContext(userQuery: string, pageContext: string): Promise<string> {
  const query = userQuery.toLowerCase();
  
  // 1. FILTERING: Prioritize content based on Page Context
  let activeKnowledge = KNOWLEDGE_BASE;
  
  if (pageContext.includes('nutrition')) {
    activeKnowledge = [
      ...KNOWLEDGE_BASE.filter(k => k.category === 'nutrition' || k.category === 'myth_busting'),
      ...KNOWLEDGE_BASE.filter(k => k.category !== 'nutrition' && k.category !== 'myth_busting')
    ];
  } else if (pageContext.includes('care') || pageContext.includes('hospital')) {
    activeKnowledge = [
      ...KNOWLEDGE_BASE.filter(k => k.category === 'emergency' || k.category === 'medicine'),
      ...KNOWLEDGE_BASE.filter(k => !['emergency', 'medicine'].includes(k.category))
    ];
  }

  // 2. KEYWORD MATCHING
  const relevantChunks = activeKnowledge.filter(chunk => {
    return chunk.tags.some(tag => query.includes(tag)) || 
           chunk.content_en.toLowerCase().includes(query) ||
           chunk.content_bn.includes(query);
  });

  // 3. RETURN CONTEXT
  if (relevantChunks.length > 0) {
    // Limit to top 3 chunks to prevent token overflow
    return relevantChunks.slice(0, 3).map(chunk => 
      `[TOPIC: ${chunk.category.toUpperCase()}]\n(EN): ${chunk.content_en}\n(BN): ${chunk.content_bn}`
    ).join("\n\n---\n\n");
  }

  return ""; // Return empty string if no local data found (Triggering Google Search in Route)
}