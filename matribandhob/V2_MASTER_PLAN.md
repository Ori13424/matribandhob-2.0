# Matri Bandhob V2.0 - Master Execution Plan

> **UPDATE:** V2.1 Expansion Implemented. See `V2.1_EXPANSION_PLAN.md` for details on Social, Admin, and Profile modules.

## Mission

## Mission
To upgrade "Matri Bandhob" into a production-grade, localized, and intelligent maternal health ecosystem. The focus is on Trust, Real-Time Safety, and Accessibility (Bangla).

---

## Phase 1: Foundation & Data Architecture
**Goal:** Ensure data flows reliably from patient input -> database -> AI Context.

### 1.1 Data Pipeline Repair
- **Problem:** Currently, AI context receives basic user info, but misses the rich medical history collected during onboarding (e.g., Allergies, Complications).
- **Solution:**
    - Create `usePatientProfile` hook to fetch the *complete* user document from Firestore.
    - Update `AIService` to accept a `MedicalContext` object (Conditions, Meds, Allergies).
    - **Action:** Refactor `ChatBotWidget` to pass this full context to `api/chat`.

### 1.2 Scaling Strategy
- **Indexes:** Create Firestore composite indexes for:
    - `users`: `role` + `status` (for dashboard filtering).
    - `notifications`: `recipientId` + `isRead` + `timestamp`.
- **Security:** Implement Firestore Security Rules to prevent patients from reading other patients' data.

---

## Phase 2: Core Intelligence (AI V2)
**Goal:** Make the AI smarter and safer.

### 2.1 Context-Aware Intelligence
- **Prompt Engineering:** Update the System Prompt in `ai.service.ts` to explicitly process the injected `MedicalContext`.
    - *Example:* If user says "I have a headache", AI checks profile. If `history.includes('Pre-eclampsia')`, it triggers an IMMEDIATE Alert, not just generic advice.
- **RAG Integration:** Ensure the `RAGService` scans verified medical guidelines (PDFs/Docs) before answering.

### 2.2 Emergency Brain (Auto-SOS)
- **Sentiment Analysis:** Implement a "Severity Check" parallel call.
    - When user speaks, run a swift classification: "Is this life-threatening?" (Yes/No).
    - If Yes -> Return `action: "TRIGGER_SOS"` immediately.

---

## Phase 3: Experience & UI/UX Modernization
**Goal:** Professional, trustworthy, and bilingual interface.

### 3.1 Localization (i18n) - "Bangla First"
- **Strategy:** Move away from inline `lang === 'bn' ? ... : ...`.

- **Implementation:**
    - Create `src/locales/en.ts` and `src/locales/bn.ts`.
    - Create a `useTranslation` hook to provide text based on global context.
    - Apply this to: Landing Page, Dashboard, and Chat Interface.

### 3.2 Landing Page Trust Upgrade
- **Additions:**
    - **"Live Impact" Ticker:** Show "Mothers Served today" (simulated or real).
    - **Certifications:** Add footer badges (WHO Guidelines, Ministry of Health).
    - **Testimonials:** Carousel of success stories.

### 3.3 Dashboard Visualization
- **Patient Clusters:** The map is good, but we need **Heatmaps** for high-risk zones.
- **Vitals Graphs:** Replace text vitals with trend charts (Sparklines) for BP and Sugar.

---

## Phase 4: Critical Safety (SOS & GPS)
**Goal:** Reliable emergency response.

### 4.1 GPS Precision
- **Logic:** When SOS is requested, force a High-Accuracy GPS fetch (`navigator.geolocation.getCurrentPosition`).
- **Data:** Write `{ lat, lng, timestamp, accuracy }` to the `users/{uid}/sos_events` collection.

### 4.2 Driver Dispatch
- **Logic:** Cloud Function (or Next.js API) to listen for new SOS events.
    - Find nearest `driver` (using geospatial query).
    - Send notification to that driver.

---

## Execution Checklist (Step-by-Step)

### Step 1: Logic & Data
- [x] Create `src/hooks/usePatientProfile.ts`.
- [x] Update `ai.service.ts` System Prompt to include Medical History.
- [x] Create `src/locales` folder and dictionary files.

### Step 2: UI Overhaul
- [x] Refactor Landing Page text to use `useTranslation`.
- [x] Refactor Dashboard to use `useTranslation`.
- [x] Implement Dashboard Visualizations (Sparklines & Map).
- [x] Add "Trust Content" to Footer.

### Step 3: Safety Features
- [x] Update `SOSButton` with High Precision GPS & Live Tracking.
- [x] Create driver dispatch server logic (`src/app/sos.ts`).

### Step 4: Final Polish
- [ ] Full end-to-end testing (Onboarding -> Chat -> SOS -> Doctor View).

### Step 5: V2.1 Expansions (Admin & Social)
- [x] **Module B: Super Admin Panel**
    - [x] Admin Layout & RBAC (`src/app/admin/layout.tsx`)
    - [x] User Management Dashboard (`src/app/admin/page.tsx`)
    - [x] Admin Login & Registration (Landing Page Modal)
- [ ] **Module C: Security & Alerts**
    - [x] Doctor Advisory Broadcast (`src/app/doctor/dashboard/page.tsx`)
    - [ ] Emergency Triggers (Test Functions)
- [x] **Module D: Community & Wellness**
    - [x] Community Forum (`src/app/patient/community/page.tsx`)
    - [x] Wellness Page Integration (`src/app/patient/wellness/page.tsx`)
