# ThreadFlow — Tiruppur Knitwear Production & Early Delay SaaS

> **Built for Company A (Tiruppur, India)**  
> Knitwear Exporter to UK & EU Buyers &bull; ₹95–110 Cr Revenue &bull; 900 Floor Workers, 35 Merchandisers  
> Detects delayed orders **2 weeks early** using real production ground truth from the factory floor.

---

## 🚀 Key Innovations & Core Modules

### 1. Transparent Run-Rate Mathematical Engine
Unlike arbitrary delay indicators, ThreadFlow proves its projections mathematically on screen:
$$\text{Remaining Qty} = \text{Total Order Qty} - \text{Produced Qty}$$
$$\text{Days Left} = \text{Ex-Factory Date} - \text{Today}$$
$$\text{Required Rate} = \frac{\text{Remaining Qty}}{\text{Days Left}}$$
$$\text{Actual Rate} = \text{7-Day Rolling Production Average}$$
$$\text{Projected Delay Days} = \left(\frac{\text{Remaining Qty}}{\text{Actual Rate}}\right) - \text{Days Left}$$

- 🟢 **GREEN**: $\text{Actual Rate} \ge \text{Required Rate}$ (On Schedule)
- 🟡 **AMBER**: $\text{Actual Rate} \ge 80\%$ of Required Rate (At Risk, 2-week early alert)
- 🔴 **RED**: $\text{Actual Rate} < 80\%$ of Required Rate (Critical Delay Risk)

---

### 2. Shopfloor Tamil Voice & Text AI Pipeline
- **Floor Input**: Voice recording via Groq Whisper speech-to-text or direct Tamil text from supervisors.
- **AI Classification**: Groq Llama 3.3 70B translates to English and classifies the note into 8 standardized industry categories:
  1. `Machine Breakdown`
  2. `Material Delay`
  3. `Quality Issue`
  4. `Labour Shortage`
  5. `Printing Delay`
  6. `Washing Delay`
  7. `Approval Pending`
  8. `Other`
- **Human-in-the-Loop**: Merchandiser views original Tamil note alongside English translation and can verify or manually override the category.

---

### 3. Multi-Tenant Buyer Isolation & Warning Approval Gate
- **Strict Data Isolation**: Buyer Company B (UK) **never** sees Company C's styles, volumes, or orders.
- **Buyer Warning Gate**: When floor rates fall below required throughput, a risk warning is generated internally. **Buyers only see warnings after explicit Merchandiser authorization**. Internal floor notes, run-rate formulas, and supervisor identities are strictly withheld.

---

### 4. Low-Spec Floor PWA & Offline Queue (Dexie IndexedDB)
- **Built for 2–3 GB RAM budget Android phones** with patchy factory network coverage.
- **IndexedDB queueing**: When connection drops, floor updates queue locally with a live status badge.
- **Auto-sync**: Automatically flushes and syncs to the central database as soon as connectivity resumes.
- **Bilingual Interface**: Seamless toggle between English and Tamil (`தமிழ்`).

---

### 5. Compliance Audit Trail & One-Click Exports
- **Immutable Log**: EU/UK compliance teams require history of every date change. Tracks: `Field`, `Old Value`, `New Value`, `Changed By`, `Timestamp`, and `Mandatory Reason`.
- **Export Center**: One-click weekly dossier per buyer in formatted Excel (`.xlsx`) or printable PDF.

---

## 👥 Demo User Accounts (1-Click Switcher in Header)

| Role | Demo Account Email | Name | Access Level |
|---|---|---|---|
| **Merchandiser** | `merch@threadflow.app` | Karthik Raja (Senior Merchandiser) | Full access: Order creation, TNA, AI review, Warning gate, Audit log, Exports |
| **Floor Supervisor** | `supervisor@threadflow.app` | Murugan S (Unit Supervisor) | Mobile-first floor updates, photo capture, Tamil voice/text notes, offline sync |
| **Buyer Company B** | `buyer.b@companyb.co.uk` | Sarah Jenkins (UK Sourcing) | Read-only: Company B orders only (`B-PO-88213`, `B-PO-88240`), approved warnings only |
| **Buyer Company C** | `buyer.c@companyc.de` | Hans Müller (Germany Sourcing) | Read-only: Company C orders only (`C-PO-0488`), approved warnings only |

---

## 📦 Seeded Sample Production Orders

1. **`B-PO-88213`** (Company B UK)
   - Style: Men's crew neck tee (Navy) &bull; Unit: `Own Unit A`
   - Total Qty: 12,000 pcs &bull; Ex-Factory: 2026-11-20 &bull; Stage: `Stitching` (6,800 done)
   - Status: **AMBER** (395 pcs/day actual vs 472.7 pcs/day required &bull; Projected slip: +2.2 days)

2. **`B-PO-88240`** (Company B UK)
   - Style: Men's polo (White) &bull; Unit: `Own Unit B`
   - Total Qty: 8,000 pcs &bull; Ex-Factory: 2026-11-12 &bull; Stage: `Finishing` (5,200 done)
   - Status: **RED** (450 pcs/day actual vs 933.3 pcs/day required &bull; Projected slip: +3.2 days)

3. **`C-PO-0488`** (Company C Germany)
   - Style: Kids printed tee (Yellow) &bull; Unit: `Printing Vendor`
   - Total Qty: 10,000 pcs &bull; Ex-Factory: 2026-11-28 &bull; Stage: `Printing` (3,100 done)
   - Status: **GREEN** (420 pcs/day actual vs 363.2 pcs/day required &bull; 0 delay / on schedule)

---

## 🧪 Automated Test Suite

Run the full end-to-end test suite:
```bash
npx tsx tests/threadflow.test.ts
```

**Results:**
- ✅ 14/14 Run-rate mathematical engine tests (Order 1, Order 2, Order 3 math verified to the decimal)
- ✅ 4/4 AI Tamil parser and classification tests
- ✅ 5/5 RBAC and buyer isolation tests
- ✅ 3/3 Warning approval gate tests
- ✅ 2/2 Export generation tests (Excel & PDF buffers)
- ✅ 4/4 Compliance audit trail integrity tests
- **Total: 32 / 32 PASSED (100% Success)**

---

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Minimalist Enterprise Palette
- **Database & ORM**: SQLite / PostgreSQL (Neon-ready), Prisma ORM
- **Client Offline Storage**: Dexie.js (IndexedDB)
- **Exports**: `xlsx` (Excel), `jspdf` & `jspdf-autotable` (PDF)
- **AI & Speech**: Groq SDK (Llama 3.3 70B & Whisper), with deterministic shopfloor offline fallback
