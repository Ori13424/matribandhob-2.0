# matribandhob 2.0 - Upgrade Master Plan

## Phase 1: Modular Architecture & Refactoring
**Goal:** Decouple business logic from UI components to improve maintainability and testability.

### 1. Structure Reorganization
Current structure mixes features and app routing. We will move to a clear "Feature-Based" architecture.
- **`src/services/`**: logic that interacts with external APIs (Firebase, Gemini).
    - `ai.service.ts`: Handle chat, RAG search, and prompting.
    - `patient.service.ts`: Handle patient data fetching, filtering, and real-time subscriptions.
    - `auth.service.ts`: Centralize authentication logic.
- **`src/hooks/`**: Custom hooks to consume services.
    - `useVoiceAssistant`: Abstract speech recognition and TTS logic.
    - `useRealtimePatients`: Abstract the complex Firestore snapshot logic from the dashboard.

### 2. AI Service Modularization
- **Abstract Gemini**: Remove direct API calls from API routes. Create a class that handles history management, context injection, and system prompts.
- **Prompt Engineering**: Move hardcoded prompts (System Prompts) to a `src/config/ai-prompts.ts` file for easier tuning.
- **Streaming Response**: Implement streaming for the chat API to reduce perceived latency (Time-To-First-Token).

---

## Phase 2: "Voice-First" Performance Upgrades
**Goal:** Reduce latency to make conversations feel natural and "real-time".

### 1. Latency Reduction Strategy
- **Client-Side VAD (Voice Activity Detection)**: Optimize when the microphone stops recording to prevent premature cuts or long silences.
- **Parallel Execution**: Prefetch RAG data while the user is still speaking (if keywords are detected) - *Advanced*.
- **Optimistic UI**: Show the user's text immediately as they speak (already partially implemented, but needs refinement).

### 2. Context Awareness
- **Dynamic Context Injection**: Instead of sending the *entire* history every time, implement a sliding window summary to keep token usage low and speed high.
- **Page-Context Hooks**: The AI should know exactly what the user is looking at (e.g., "What does *this* graph mean?").

---

## Phase 3: Dashboard Real-Time Scaling
**Goal:** Handle hundreds of patients without freezing the doctor's browser.

### 1. Optimization & Technical Debt Removal
- **Problem**: `DoctorDashboard/page.tsx` fetches *all* users and filters client-side.
- **Solution**:
    - **Compound Queries**: Create Firestore indexes to filter `role == 'patient'` and `status` server-side.
    - **Pagination**: Implement infinite scroll for the patient list using Firestore cursors.
    - **Server-Side Aggregation**: Move "Critical Symptom" checking to a Cloud Function (or Next.js background job) that updates a `status` field on the user document. The UI should just *read* the status, not *calculate* it.

### 2. Real-Time Architecture (WebSocket vs. Firestore)
- **Current**: Firestore `onSnapshot`.
- **Verdict**: Keep Firestore for data sync (it is robust). Use **Server-Sent Events (SSE)** or separate **WebSocket** only for ephemeral alerts (like "User is typing..." or "High-frequency vital streams") to save database read costs.
- **Immediate Action**: Optimize `onSnapshot` to only listen to "active" patients or a specific subset to reduce bandwidth.

---

## Phase 4: Sustainability & Monetization (New Features)
**Goal:** Architecture for "Premium" tiers.

### 1. Module Design
- **`subscription` feature**:
    - **Freemium logic**: Limit AI queries per day for free users.
    - **Premium**: Unlimited AI, advanced PDF reports, Priority Doctor Access.
- **Telemedicine Payments**: Integration placeholders for payment gateways (e.g., Stripe/Bkash).

---

## Execution Roadmap (Next Steps)
1.  **Refactor**: Create `src/services` and move logic out of `ChatBotWidget` and `DoctorDashboard`.
2.  **Optimize**: Implement Server-Side Filtering for patients.
3.  **Upgrade**: Implement the new AI streaming response pattern.
