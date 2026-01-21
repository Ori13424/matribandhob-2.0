"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Check, Calendar, Heart,
  Baby, Activity, ShieldCheck, Droplets, Pill,
  User, Phone, Ruler
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext"; // Ensure accurate language context if needed

// --- TYPES ---
type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    // Step 2: Basic
    fullName: "",
    phone: "",
    dob: "",
    bloodGroup: "",
    height: "",
    weight: "",

    // Step 3: Pregnancy Details
    status: "", // "Pregnant" | "Postpartum"
    lmp: "",
    edd: "",
    type: "Single",
    prevBirths: "0",
    miscarriages: "0",
    deliveryPlan: "",

    // Step 4: Medical History
    conditions: [] as string[],
    complications: [] as string[],

    // Step 5: Meds
    medications: "",
    supplements: [] as string[],
    drugAllergies: "",
    foodAllergies: "",

    // Step 6: Health
    bp: "",
    bloodSugar: "",
    hemoglobin: "",
    symptoms: [] as string[],

    // Step 7: Contacts
    contacts: [{ id: 1, name: "", phone: "", relation: "" }]
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.onboardingComplete) {
            router.push("/patient/dashboard");
            return;
          }
          // Pre-fill existing data if any
          setFormData(prev => ({
            ...prev,
            fullName: data.basicInfo?.fullName || prev.fullName,
            phone: data.basicInfo?.phone || prev.phone,
            dob: data.basicInfo?.dob || prev.dob,
            bloodGroup: data.basicInfo?.bloodGroup || prev.bloodGroup,
            height: data.basicInfo?.height || prev.height,
            weight: data.basicInfo?.weight || prev.weight,

            // Safe fallbacks for nested properties
            status: data.pregnancyDetails?.status || prev.status,
            lmp: data.pregnancyDetails?.lmp || prev.lmp,
            edd: data.pregnancyDetails?.edd || prev.edd,
            type: data.pregnancyDetails?.type || prev.type,
            prevBirths: data.pregnancyDetails?.prevBirths || prev.prevBirths,
            miscarriages: data.pregnancyDetails?.miscarriages || prev.miscarriages,
            deliveryPlan: data.pregnancyDetails?.deliveryPlan || prev.deliveryPlan,

            conditions: data.medicalHistory?.conditions || prev.conditions,
            complications: data.medicalHistory?.complications || prev.complications,

            medications: data.medsAndAllergies?.medications || prev.medications,
            supplements: data.medsAndAllergies?.supplements || prev.supplements,
            drugAllergies: data.medsAndAllergies?.drugAllergies || prev.drugAllergies,
            foodAllergies: data.medsAndAllergies?.foodAllergies || prev.foodAllergies,

            bp: data.currentHealth?.bp || prev.bp,
            bloodSugar: data.currentHealth?.bloodSugar || prev.bloodSugar,
            hemoglobin: data.currentHealth?.hemoglobin || prev.hemoglobin,
            symptoms: data.currentHealth?.symptoms || prev.symptoms,

            contacts: data.emergencyContacts?.length > 0 ? data.emergencyContacts.map((c: any, i: number) => ({ id: i + 1, ...c })) : prev.contacts,
          }));
        }
      } else {
        router.push("/login"); // Secure Route
      }
    });
    return () => unsub();
  }, [router]);

  // Validation
  const validateStep = () => {
    if (step === 2) {
      if (!formData.fullName || !formData.phone || !formData.dob || !formData.bloodGroup || !formData.height || !formData.weight) return t.onboarding.errors.basicInfo;
    }
    if (step === 3) {
      if (!formData.edd && !formData.lmp) return t.onboarding.errors.pregnancyDate;
      if (!formData.deliveryPlan) return t.onboarding.errors.deliveryPlan;
    }
    if (step === 7) {
      if (formData.contacts.some(c => !c.name || !c.phone || !c.relation)) return t.onboarding.errors.emergencyContacts;
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step < 7) setStep((prev) => (prev + 1) as OnboardingStep);
    else handleComplete();
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step > 1) setStep((prev) => (prev - 1) as OnboardingStep);
  };

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Special handler for LMP to auto-calc EDD
  const handleLMPChange = (date: string) => {
    const newState = { ...formData, lmp: date };

    // Calculate EDD (LMP + 280 days)
    if (date) {
      const lmpDate = new Date(date);
      const eddDate = new Date(lmpDate);
      eddDate.setDate(lmpDate.getDate() + 280);

      const year = eddDate.getFullYear();
      const month = String(eddDate.getMonth() + 1).padStart(2, '0');
      const d = String(eddDate.getDate()).padStart(2, '0');

      newState.edd = `${year}-${month}-${d}`;
    } else {
      newState.edd = "";
    }
    setFormData(newState);
  };

  const toggleSelection = (stateKey: "conditions" | "complications" | "supplements" | "symptoms", item: string) => {
    setFormData(prev => {
      const list = prev[stateKey];
      return list.includes(item)
        ? { ...prev, [stateKey]: list.filter(i => i !== item) }
        : { ...prev, [stateKey]: [...list, item] };
    });
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    const newContacts: any = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData(prev => ({ ...prev, contacts: newContacts }));
  };

  const addContact = () => {
    if (formData.contacts.length < 3) {
      setFormData(prev => ({ ...prev, contacts: [...prev.contacts, { id: prev.contacts.length + 1, name: "", phone: "", relation: "" }] }));
    }
  };

  const removeContact = (id: number) => {
    if (formData.contacts.length > 1) {
      setFormData(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== id) }));
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Calculate gestation week
      let gestationWeek = 1;
      if (formData.edd) {
        const eddDate = new Date(formData.edd);
        const today = new Date();
        const diffTime = eddDate.getTime() - today.getTime();
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        gestationWeek = Math.max(1, 40 - diffWeeks);
      }

      const userRef = doc(db, "users", user.uid);
      const primaryContact = formData.contacts[0] || {};

      await setDoc(userRef, {
        basicInfo: {
          fullName: formData.fullName,
          phone: formData.phone,
          dob: formData.dob,
          bloodGroup: formData.bloodGroup,
          height: formData.height,
          weight: formData.weight,
          emergencyContact: primaryContact.phone,
          lmp: formData.lmp,
          edd: formData.edd
        },

        // Root Level Sync (For easy querying)
        phone: formData.phone,
        fullName: formData.fullName,
        emergencyContact: primaryContact.phone,
        edd: formData.edd,
        lmp: formData.lmp,

        emergencyContacts: formData.contacts.map(({ id, ...rest }) => rest),

        pregnancyDetails: {
          status: formData.status,
          lmp: formData.lmp,
          edd: formData.edd,
          type: formData.type,
          prevBirths: formData.prevBirths,
          miscarriages: formData.miscarriages,
          deliveryPlan: formData.deliveryPlan,
          currentWeek: gestationWeek
        },
        medicalHistory: {
          conditions: formData.conditions,
          complications: formData.complications,
        },
        medsAndAllergies: {
          medications: formData.medications,
          supplements: formData.supplements,
          drugAllergies: formData.drugAllergies,
          foodAllergies: formData.foodAllergies,
        },
        currentHealth: {
          bp: formData.bp,
          bloodSugar: formData.bloodSugar,
          hemoglobin: formData.hemoglobin,
          symptoms: formData.symptoms,
        },

        onboardingComplete: true,
        gestationWeek,
        stage: formData.status === "Pregnant" ? "pregnancy" : "postpartum",
        updatedAt: new Date(),
        role: "mother"
      }, { merge: true });

      router.push("/patient/dashboard");

    } catch (error) {
      console.error(error);
      alert(t.onboarding.errors.saveProfile || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles: any = {
    1: t.onboarding.steps.welcome,
    2: t.onboarding.steps.basic,
    3: t.onboarding.steps.pregnancy,
    4: t.onboarding.steps.history,
    5: t.onboarding.steps.meds,
    6: t.onboarding.steps.health,
    7: t.onboarding.steps.safety
  };

  // Safe access to translated lists
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const conditionList = t.onboarding.lists.conditions || [];
  const complicationList = t.onboarding.lists.complications || [];
  const supplementList = t.onboarding.lists.vitamins || []; // Mapped vitamins to supplements for now
  const symptomList = t.onboarding.lists.symptoms || [];

  // Hardcoded for now but can be localized if added to lists
  const pregnancyTypes = ["Single", "Twins", "Triplets"];
  const deliveryPlans = ["Hospital", "Clinic", "Home Birth"];

  return (
    <div className="min-h-screen bg-[#1a0b10] text-white flex flex-col items-center p-4 font-sans relative overflow-x-hidden">

      {/* Background Blobs */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Progress Bar */}
      <div className="w-full max-w-xl sticky top-0 bg-[#1a0b10]/80 backdrop-blur-md pt-6 pb-4 z-[40]">
        <div className="flex justify-between text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-2 px-1">
          <span>{t.onboarding.progress.start}</span>
          <span>{t.onboarding.progress.basic}</span>
          <span>{t.onboarding.progress.pregnancy}</span>
          <span>{t.onboarding.progress.medical}</span>
          <span>{t.onboarding.progress.meds}</span>
          <span>{t.onboarding.progress.health}</span>
          <span>{t.onboarding.progress.safety}</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-pink-500 to-rose-500" initial={{ width: "0%" }} animate={{ width: `${((step - 1) / 6) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <div className="w-full max-w-lg mt-8 mb-20 z-10 min-h-[60vh] flex flex-col">

          {/* 1. WELCOME */}
          {step === 1 && (
            <motion.div key={1} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.4)] mb-6 animate-pulse">
                <Heart className="w-12 h-12 text-white" fill="currentColor" />
              </div>
              <h1 className="text-4xl font-black mb-3 text-white">{t.onboarding.welcome.title}</h1>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                {t.onboarding.welcome.description}
              </p>
              <button onClick={handleNext} className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 group border border-pink-500/50">
                {t.onboarding.welcome.startProfile} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* 2. BASIC INFO */}
          {step === 2 && (
            <motion.div key={2} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><User className="w-5 h-5" /> {stepTitles[step]}</h2>
              <CustomInput label={t.onboarding.basic.fullName} value={formData.fullName} onChange={(v: string) => handleChange('fullName', v)} placeholder={t.onboarding.basic.fullNamePlaceholder} icon={User} />
              <CustomInput label={t.onboarding.basic.phone} value={formData.phone} onChange={(v: string) => handleChange('phone', v)} placeholder={t.onboarding.basic.phonePlaceholder} icon={Phone} />
              <CustomDatePicker label={t.onboarding.basic.dob} value={formData.dob} onChange={(v: string) => handleChange('dob', v)} />
              <CustomSelect label={t.onboarding.basic.bloodGroup} placeholder={t.onboarding.basic.bloodGroupPlaceholder} options={bloodGroups} value={formData.bloodGroup} onChange={(v: string) => handleChange('bloodGroup', v)} />
              <div className="flex gap-4">
                <div className="flex-1"><CustomInput label={t.onboarding.basic.height} type="number" value={formData.height} onChange={(v: string) => handleChange('height', v)} placeholder={t.onboarding.basic.heightPlaceholder} icon={Ruler} /></div>
                <div className="flex-1"><CustomInput label={t.onboarding.basic.weight} type="number" value={formData.weight} onChange={(v: string) => handleChange('weight', v)} placeholder={t.onboarding.basic.weightPlaceholder} icon={Activity} /></div>
              </div>
            </motion.div>
          )}

          {/* 3. PREGNANCY DETAILS */}
          {step === 3 && (
            <motion.div key={3} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Baby className="w-5 h-5" /> {stepTitles[step]}</h2>
              <div className="flex bg-[#1a0b10] p-1 rounded-xl border border-gray-700">
                {[t.onboarding.lists.status.pregnant, t.onboarding.lists.status.postpartum].map(s => (
                  <button key={s} onClick={() => handleChange('status', s === t.onboarding.lists.status.pregnant ? 'Pregnant' : 'Postpartum')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${formData.status === (s === t.onboarding.lists.status.pregnant ? 'Pregnant' : 'Postpartum') ? 'bg-pink-600 text-white' : 'text-gray-400'}`}>{s}</button>
                ))}
              </div>

              <CustomDatePicker
                label={t.onboarding.pregnancy.lmp}
                value={formData.lmp}
                onChange={handleLMPChange}
              />

              <CustomDatePicker
                label={t.onboarding.pregnancy.edd}
                value={formData.edd}
                onChange={(v: string) => handleChange('edd', v)}
              />

              <CustomSelect label={t.onboarding.pregnancy.type} options={pregnancyTypes} value={formData.type} onChange={(v: string) => handleChange('type', v)} />
              <div className="flex gap-4">
                <div className="flex-1"><CustomInput label={t.onboarding.pregnancy.prevBirths} type="number" value={formData.prevBirths} onChange={(v: string) => handleChange('prevBirths', v)} placeholder="0" /></div>
                <div className="flex-1"><CustomInput label={t.onboarding.pregnancy.miscarriages} type="number" value={formData.miscarriages} onChange={(v: string) => handleChange('miscarriages', v)} placeholder="0" /></div>
              </div>
              <CustomSelect label={t.onboarding.pregnancy.deliveryPlan} placeholder={t.onboarding.pregnancy.deliveryPlanPlaceholder} options={deliveryPlans} value={formData.deliveryPlan} onChange={(v: string) => handleChange('deliveryPlan', v)} />
            </motion.div>
          )}

          {/* 4. MEDICAL HISTORY */}
          {step === 4 && (
            <motion.div key={4} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Activity className="w-5 h-5" /> {stepTitles[step]}</h2>
              <CheckboxGroup
                label={t.onboarding.history.conditions}
                options={conditionList}
                selected={formData.conditions}
                onChange={(v: string[]) => handleChange('conditions', v)}
              />
              <div className="h-px bg-white/5 my-2"></div>
              <CheckboxGroup
                label={t.onboarding.history.complications}
                options={complicationList}
                selected={formData.complications}
                onChange={(v: string[]) => handleChange('complications', v)}
              />
            </motion.div>
          )}

          {/* 5. MEDS & ALLERGIES */}
          {step === 5 && (
            <motion.div key={5} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Pill className="w-5 h-5" /> {stepTitles[step]}</h2>
              <CustomInput label={t.onboarding.meds.currentMeds} placeholder={t.onboarding.meds.medsPlaceholder} value={formData.medications} onChange={(v: string) => handleChange('medications', v)} />
              <CheckboxGroup
                label={t.onboarding.meds.vitamins}
                options={supplementList}
                selected={formData.supplements}
                onChange={(v: string[]) => handleChange('supplements', v)}
              />
              <CustomInput label={t.onboarding.meds.allergies} placeholder={t.onboarding.meds.allergiesPlaceholder} value={formData.drugAllergies} onChange={(v: string) => handleChange('drugAllergies', v)} />
            </motion.div>
          )}

          {/* 6. CURRENT HEALTH */}
          {step === 6 && (
            <motion.div key={6} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><Droplets className="w-5 h-5" /> {stepTitles[step]}</h2>
              <div className="flex gap-4">
                <div className="flex-1"><CustomInput label={t.onboarding.health.systolic} placeholder="120/80" value={formData.bp} onChange={(v: string) => handleChange('bp', v)} /></div>
                <div className="flex-1"><CustomInput label={t.onboarding.health.sugar} placeholder="mg/dL" type="number" value={formData.bloodSugar} onChange={(v: string) => handleChange('bloodSugar', v)} /></div>
              </div>
              <CustomInput label={t.onboarding.health.hemoglobin} placeholder="g/dL" type="number" value={formData.hemoglobin} onChange={(v: string) => handleChange('hemoglobin', v)} />

              <div className="h-px bg-white/5 my-2"></div>
              <CheckboxGroup
                label={t.onboarding.health.symptoms}
                options={symptomList}
                selected={formData.symptoms}
                onChange={(v: string[]) => handleChange('symptoms', v)}
              />
            </motion.div>
          )}

          {/* 7. SAFETY NET */}
          {step === 7 && (
            <motion.div key={7} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col space-y-5">
              <h2 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> {stepTitles[step]}</h2>
              <p className="text-xs text-gray-500 mb-2">{t.onboarding.safety.subtitle}</p>

              {formData.contacts.map((contact, index) => (
                <div key={contact.id} className="p-4 bg-white/5 rounded-xl border border-white/10 relative">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">{t.onboarding.safety.contact} {index + 1}</h4>
                  <div className="space-y-3">
                    <CustomInput label={t.onboarding.safety.contactName} placeholder={t.onboarding.safety.contactName} value={contact.name} onChange={(v: string) => handleContactChange(index, 'name', v)} />
                    <CustomInput label={t.onboarding.safety.contactPhone} placeholder={t.onboarding.safety.contactPhone} value={contact.phone} onChange={(v: string) => handleContactChange(index, 'phone', v)} icon={Phone} />
                    <CustomSelect label={t.onboarding.safety.relation} placeholder={t.onboarding.safety.selectRelation} options={['Husband', 'Mother', 'Sister', 'Guardian']} value={contact.relation} onChange={(v: string) => handleContactChange(index, 'relation', v)} />
                  </div>
                  {index > 0 && (
                    <button onClick={() => removeContact(contact.id)} className="absolute top-2 right-2 text-red-400 text-xs hover:text-red-300">Remove</button>
                  )}
                </div>
              ))}

              {formData.contacts.length < 3 && (
                <button onClick={addContact} className="w-full py-3 border border-dashed border-gray-600 rounded-xl text-gray-400 text-sm hover:border-pink-500 hover:text-pink-500 transition-colors">
                  + {t.onboarding.safety.addAnother}
                </button>
              )}
            </motion.div>
          )}

          {/* NAVIGATION */}
          <div className="mt-8 flex gap-4">
            {step > 1 && (
              <button onClick={handleBack} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10">
                {t.onboarding.buttons.back}
              </button>
            )}
            {step > 1 && (
              <button onClick={handleNext} className="flex-[2] py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2">
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : (step === 7 ? t.onboarding.buttons.finish : t.onboarding.buttons.next)}
              </button>
            )}
          </div>

          {error && <p className="text-red-400 text-center mt-4 text-sm font-bold animate-pulse">{error}</p>}

        </div>
      </AnimatePresence>
    </div>
  );
}

// --- SUB COMPONENTS ---

const CustomInput = ({ label, value, onChange, placeholder, type = "text", icon: Icon }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#120a10] border border-gray-800 rounded-xl py-4 px-4 pl-4 text-white placeholder:text-gray-700 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
      />
      {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-pink-500 transition-colors" />}
    </div>
  </div>
);

const CustomSelect = ({ label, value, onChange, options, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#120a10] border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 appearance-none transition-all"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
    </div>
  </div>
);

const CustomDatePicker = ({ label, value, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#120a10] border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 appearance-none transition-all [color-scheme:dark]"
      />
      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
    </div>
  </div>
);

const CheckboxGroup = ({ label, options, selected, onChange }: any) => {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s: string) => s !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2
                        ${selected.includes(opt)
                ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-600/20'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-pink-500/50'}`}
          >
            {selected.includes(opt) && <Check className="w-3 h-3" />}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};