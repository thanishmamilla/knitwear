# Deployment & Evaluation Guide — ThreadFlow (Company A)

## 1. Project Overview & Repository
- **Application Name:** ThreadFlow (Company A Tiruppur Knitwear Exporter Delay Warning & TNA Platform)
- **GitHub Repository:** `<YOUR_GITHUB_REPO_URL>` (Replace with your actual public repository URL)
- **Live Demo:** `http://localhost:3000` (or hosted Vercel link if deployed)

---

## 2. Prerequisites
- **Node.js:** v18.18.0 or later (v20+ recommended)
- **npm:** v9+ or later
- **Operating System:** Windows, macOS, or Linux

---

## 3. Environment Variables (`.env`)
The application comes pre-configured with a local SQLite zero-config database and offline fallback AI categorization.

Create a `.env` file in the root directory (names only, no secrets required):
```bash
# Database connection string
DATABASE_URL="file:./dev.db"

# Optional: Groq Cloud Llama 3.3 70B AI inference (optional; intelligent deterministic fallback active if unset)
GROQ_API_KEY=""

# Base URL for internal routing
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 4. Local Setup & Running Step-by-Step

### 1. Clone the repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd winner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Initialize & Seed Database
Pre-populates the database with Company A's live orders, buyers, production units, and TNA milestones:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run the Automated Test Suite (32 Tests)
Verifies the run-rate math formula, multi-tenant RBAC isolation, compliance audit logs, and AI categorization:
```bash
npx tsx tests/threadflow.test.ts
```

### 5. Build and Start Application
```bash
# Production build & start
npm run build
npm run start -- -p 3000

# Or run in local development mode with hot-reload:
# npm run dev
```
Open **`http://localhost:3000`** in Google Chrome or any modern browser.

---

## 5. Reviewer Demo Accounts & Role Switcher
ThreadFlow includes a zero-friction **Role Switcher** directly in the top navigation bar. You can also sign in using these pre-seeded accounts:

| Role | Account Email | Access Scope & Capabilities |
| :--- | :--- | :--- |
| **Senior Merchandiser** | `merch@threadflow.app` | Order 360° view, TNA adjustment, run-rate math proofs, AI category override, approve delay warnings for buyer |
| **Unit Supervisor** | `supervisor@threadflow.app` | Mobile-optimized shopfloor data entry, live voice notes, mic recording with Tamil speech-to-text, photo inspection, offline queue |
| **Buyer (Company B - UK)** | `buyer.b@companyb.co.uk` | Strictly isolated buyer portal; views only Company B orders, milestones, and merchandiser-approved warnings (zero internal supervisor notes) |
| **Buyer (Company C - Germany)** | `buyer.c@companyc.de` | Strictly isolated buyer portal; cannot view Company B orders or styles (enforced at API & DB layer) |

---

## 6. Verification Checklist for Evaluator
1. **Order Board (`/`)**: Inspect the 3 sample orders (`B-PO-88213`, `B-PO-88240`, `C-PO-0488`) displaying Green, Amber, and Red status.
2. **Transparent Run-Rate Delay Math**: Click **"View Math Proof"** on any order card to see the mathematical formula ($$\text{pieces needed/day vs pieces made/day}$$).
3. **Supervisor Floor Entry (`/supervisor`)**:
   - Toggle English / Tamil interface.
   - Record voice notes using your browser microphone with audio playback and instant transcription.
   - Select offline mode to verify IndexedDB queuing and auto-sync.
4. **AI Tamil Categorization & Review (`/risk`)**: Review Tamil notes classified into standardized disruption categories (Machine Breakdown, Material Delay, etc.) with merchandiser override.
5. **Buyer RBAC Isolation (`/buyer`)**: Switch to Buyer C in the navbar and confirm Company B orders are completely invisible.
6. **Compliance Audit Trail (`/audit`)**: Verify immutable date change logs showing old date, new date, user, and mandatory compliance justification.
7. **Reports Export (`/export`)**: Generate filtered Excel spreadsheets and compliance PDFs per buyer.

