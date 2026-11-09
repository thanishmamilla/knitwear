# Technical Design Document (TDD)
**Project:** ThreadFlow — Production Order Tracking, Run-Rate Delay Warning & TNA SaaS  
**Client:** Company A (Tiruppur Knitwear Exporter to UK & EU Buyers)  
**GitHub Repository:** `https://github.com/thanishmamilla/knitwear`  
**Live Demo:** `http://localhost:3000`  
**Author:** Software Engineering Candidate  
**Date:** November 2026  

---

## 1. Executive Summary & Problem Formulation
Company A is a ₹95–110 crore Tiruppur-based knitwear exporter managing 3 owned production units and subcontracted washing/printing facilities. Today, orders and Time-and-Action (TNA) schedules are tracked via fragmented spreadsheets, with merchandisers chasing floor supervisors over phone calls (~7,200 hours/year). 

- **Annual Losses from Late Shipments:** ₹1.08 Crore (₹52.5 lakh air freight penalties + ₹26.25 lakh late discounts + ₹28.8 lakh merchandiser labor overhead).
- **Core Mission:** Provide a real-time, floor-level data capture interface with bilingual (Tamil/English) voice recording, an automated transparent run-rate delay engine, strict multi-tenant buyer portal isolation, and immutable compliance audit trails.

---

## 2. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 (App Router)                │
│   Tailwind CSS  │  Recharts  │  Web Speech API  │  IndexedDB │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        REST API Routes                  Offline Sync
        (RBAC Middleware)                (Dexie Queue)
               │                               │
┌──────────────▼───────────────────────────────▼──────────────┐
│                    Business Logic Engine                    │
│   • Run-Rate Delay Math Engine (Pieces/Day vs Made/Day)      │
│   • Llama 3.3 70B / Fallback NLP Tamil Classification Engine│
│   • Immutable EU/UK Compliance Audit Logger                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                Prisma ORM 7 + LibSQL Driver
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Relational Database (SQLite)                │
│    Orders │ Buyers │ Units │ TNA Milestones │ Daily Updates │
└─────────────────────────────────────────────────────────────┘
```

### Why this stack was chosen:
1. **Next.js 15 App Router & React 19:** Server Components for zero-bundle data fetching combined with Client Components for reactive floor audio recording and real-time math proofs.
2. **Prisma ORM 7 with `@prisma/adapter-libsql`:** Type-safe database operations on SQLite locally with zero external server dependencies, guaranteeing quick evaluation for reviewers.
3. **Dexie.js (IndexedDB):** Seamless offline queueing for factory supervisors operating in patchy network zones across Tiruppur industrial clusters.
4. **Groq Llama 3.3 70B + Deterministic Rule Fallback:** Resilient AI processing that classifies Tamil and English floor notes into standardized disruption categories even without an internet connection or API key.

---

## 3. Data Model & Entity Relationships
The schema enforces strict referential integrity across 8 core models:
- **`Buyer`**: Customer identity (e.g., Company B UK, Company C Germany) with isolation keys.
- **`Unit`**: Manufacturing facilities (Own Units A/B/C, Subcontractor Printing/Washing).
- **`Order`**: Purchase order number, style, color, total quantity, ex-factory date, current stage, and run-rate status.
- **`SizeBreakdown`**: Granular size distribution matrix (S, M, L, XL, XXL).
- **`Milestone`**: 6-stage TNA workflow (`Cutting` → `Printing` → `Stitching` → `Washing` → `Finishing` → `Packing`) with target dates automatically recalculated upon ex-factory date amendments.
- **`DailyUpdate`**: Floor entries with quantity completed, supervisor name, stage, compressed inspection photo, and voice audio.
- **`AIAnalysis`**: Dual-field storage preserving the original Tamil supervisor text alongside English translations, confidence scores, predicted categories, and merchandiser override records.
- **`DelayWarning`**: Run-rate alerts gated by `isApprovedForBuyer` visibility boolean.
- **`AuditLog`**: Immutable compliance record tracking all changes, old values, new values, editor identities, and mandatory justifications.

---

## 4. Run-Rate Delay Projection Engine (The "Hard Part")
Instead of subjective estimates, delay predictions rely on transparent mathematical run-rate modeling:

$$\text{Remaining Quantity} = \text{Total Quantity} - \text{Cumulative Produced Quantity}$$
$$\text{Days Remaining} = \text{Ex-Factory Date} - \text{Current Reference Date}$$
$$\text{Required Run-Rate} = \frac{\text{Remaining Quantity}}{\text{Days Remaining}}\quad (\text{pcs/day})$$
$$\text{Actual Floor Output Rate} = \frac{1}{N}\sum_{i=1}^N \text{Daily Produced Qty}\quad (\text{7-day moving avg})$$
$$\text{Projected Days Needed} = \frac{\text{Remaining Quantity}}{\text{Actual Output Rate}}$$
$$\text{Projected Delay} = \text{Projected Days Needed} - \text{Days Remaining}$$

### Status Matrix:
- **GREEN (On Schedule):** Actual Rate $\ge$ Required Rate (Projected Delay $\le 0$ days).
- **AMBER (Early Warning):** $0 < \text{Projected Delay} \le 3.0$ days (requires internal merchandiser intervention).
- **RED (Critical Risk):** $\text{Projected Delay} > 3.0$ days (triggers merchandiser review and approval gate for buyer notification).

---

## 5. Tamil Floor Voice & AI Categorization
1. **Audio Acquisition:** Browser-native `MediaRecorder` captures audio on cheap supervisor mobile devices.
2. **Speech Recognition:** Live `SpeechRecognition` transcription in Tamil (`ta-IN`) and English (`en-US`).
3. **Dual-Note Governance:** The original Tamil voice transcript always sits side-by-side with the English translation.
4. **Disruption Categories:** AI classifies notes into standardized categories: `Machine Breakdown`, `Material Delay`, `Quality Issue`, `Labour Shortage`, `Printing Delay`, `Washing Delay`, `Approval Pending`, or `Other`.
5. **Human-in-the-Loop Override:** Merchandisers can re-categorize AI classifications. All overrides store the reviewer's name and timestamp.
6. **Buyer Gate:** Delay warnings reach buyers only after explicit merchandiser confirmation (`isApprovedForBuyer = true`).

---

## 6. UI & Design Decisions
- **Restrained Visual Palette:** Clean slate (`#0f172a`), crisp white space, and semantic status accents (emerald, amber, rose).
- **Zero-Friction Mobile Ergonomics (`/supervisor`):** Large numeric buttons, one-tap phrase chips in Tamil, and high-contrast recording triggers designed for glove-wearing supervisors on 2–3 GB RAM mobile devices.
- **Strict Multi-Tenant Isolation (`/buyer`):** Company B sourcing agents cannot see Company C orders, styles, or volumes. All internal supervisor voice notes and unapproved internal warnings are stripped before response delivery.

---

## 7. Assumptions, Cuts & Future Work

### Assumptions:
1. Production week operates 6 days per week in Tiruppur textile clusters.
2. 7-day trailing average provides the most accurate baseline for actual output.
3. Completed TNA milestones preserve their historical completion dates when ex-factory dates are amended.

### What was cut to preserve high quality:
- Financial payroll, piece-rate worker attendance, and export shipping document generation (explicitly out of scope in the brief).
- Native iOS/Android app wrappers (addressed via responsive PWA design with offline IndexedDB support).

### What to build next:
1. Automated WhatsApp Bot integration using Twilio Webhooks for supervisors without web browsers.
2. IoT sensor integration directly on stitching machine motors for automatic stitch counting.
3. Machine learning yarn requirement prediction based on Tiruppur historical shrinkage data.

