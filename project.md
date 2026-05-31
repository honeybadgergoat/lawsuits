# Cursor Prompt: Judge Document Automation Web App

---

## Project Overview

Build a **mobile-first web application** (prototype phase) for judges to automate the creation of legal case documents. The app allows judges to upload scanned document images, or take direct photo pictures using their phones, extract text using OCR (OCRSpace), and use Google Gemini AI to populate a pre-defined Word document template — which the judge can then download, review, and finalize.

This is a prototype. Keep the codebase clean and modular so it can later support a React Native / Expo mobile app (iOS/Android). All business logic must live in standalone service files, not inside UI components or page handlers.

the judge can enter a conversation style page to upload document, pictures one by one and review the extracted text one by one and at the end he can choose to finalize his document

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS — mobile-first, all layouts must work at 375px viewport width first
- **UI Components**: shadcn/ui
- **Language**: TypeScript throughout — no `any` types

### Backend / Database
- **Firebase** (single backend platform for everything):
  - **Firebase Authentication** — email/password auth, no self-registration (accounts created by admin only)
  - **Firestore** — NoSQL database for users, cases, usage logs
  - **Firebase Admin SDK** — used server-side in Next.js API routes for privileged operations (creating users, reading any case, etc.)
  - **Firebase Client SDK** — used client-side for auth state, reading own cases
- Store Firebase config in environment variables (see below) — never hardcode credentials

### OCR
- **ocrspace** - will provide the api key 

### AI
- **Google Gemini API** (`gemini-1.5-pro`) — called **server-side only** via a Next.js API route
- API key stored in `GEMINI_API_KEY` environment variable — never sent to or accessible from the browser

### Document Generation
- **docxtemplater** + **pizzip** — server-side in a Next.js API route
- Read `/templates/case-template.docx` from the project filesystem
- Placeholders in the template use the format `{{FIELD_NAME}}`
- Return the populated `.docx` as a binary download

---

## Core Features

### 1. Authentication & User Management

- Firebase Authentication with email/password
- No public registration — only admins can create judge accounts (via Firebase Admin SDK)
- Two roles stored in Firestore: `ADMIN` and `JUDGE` (stored in `/users/{uid}`)
- All app pages require authentication — redirect to `/login` if not authenticated
- Use Firebase ID tokens for all server-side route protection (`Authorization: Bearer <token>` header, validated via Admin SDK)
- Admin panel features:
  - Create new judge accounts (email + temporary password)
  - Deactivate/reactivate accounts (`isActive: boolean`)
  - View usage stats (AI requests per judge per day/month)
- Per-user daily AI request limit (FireStore field: `dailyLimit: number`, default: 20)
- Before any Gemini API call, check today's usage count in Firestore; return 429 if at or above limit ("Daily usage limit reached. Contact your administrator.")
- If `isActive` is `false`, block login and all API calls with 403 ("Account is deactivated. Contact your administrator.")

### 2. Conversation-Style OCR Image Upload & Processing (Client-Side)

- The judge enters a **conversation-style page** ("stepper" UI), progressing image-by-image in a linear conversational flow
- For each document page, the judge can:
  - Upload/take a photo of a single page (JPG, PNG, HEIC; PDF pages converted to images)
  - Preview the image and review the OCR-extracted text right after uploading
  - Edit/correct the text for that image directly after extraction
  - Move forward to add the next page, or return to previous pages to re-upload or re-edit as needed
- The UI supports upload of 1–10 images via conversation steps (can add, remove, or reorder pages at any time)
- Mobile-first: large tap targets, camera capture via `accept="image/*;capture=camera"`
- Per-image OCR: run Tesseract.js in-browser, show progress for each page (e.g. "Processing page 2/4...")
- Each image's corrected OCR text is stored sequentially
- At the end of the conversational flow, display a final step showing the concatenated and editable full OCR text (all pages joined together, in order)
- Only the judge-edited, concatenated OCR result is sent to the server (images stay local in the browser)
- The judge can choose to **finalize the document** after the review is complete, proceeding to the AI population step

### 3. AI Template Population (Gemini Integration)

- On finalization, the client sends the corrected, concatenated OCR text to `POST /api/ai/populate`
  1. Server reads `/templates/case-template.docx` from disk
  2. Server parses all `{{FIELD_NAME}}` placeholders from the template
  3. Server builds Gemini prompt:
     - Field descriptions for all placeholders
     - The full OCR text
     - Explicit instructions: **return a valid JSON object only** with field names as keys, values as extracted from text
  4. Gemini API called, JSON parsed and validated
  5. Server returns the map of suggested field values
- Client presents a **Field Review** conversational step:
  - Each document field displayed as a labeled, editable text input
  - Empty or very short values highlighted for review
  - Judge can edit/correct any field before continuing ("Generate Document")
- Each successful field extraction call is logged in `/usageLogs`

### 4. Document Generation & Download

- `POST /api/export/docx` receives the case metadata and finalized field map (after judge review)
- Server fills out the docx template using docxtemplater (all fields get populated; unknown placeholder keys are ignored, required keys missing get empty strings)
- Returns Word `.docx` document as binary download with correct `Content-Disposition` header (`case-[clientLastName]-[YYYY-MM-DD].docx`)
- Client triggers download automatically
- The finalized case — with all reviewed field values and content — is saved to Firestore as a completed case document

### 5. Case History & Ongoing Editing

Firestore collection structure: `/cases/{caseId}`

Each case document:
```
{
  id: string,
  title: string,           // e.g. "Smith - 2025-06-01", editable by judge
  status: "DRAFT" | "COMPLETED",
  judgeId: string,         // Firebase UID
  rawOcrText: string,
  extractedFields: object, // key-value map of all template fields
  notes: string,           // free-text internal notes
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deletedAt: Timestamp | null   // soft delete
}
```

- Judges see only their own cases (per Firestore rules); admins can view all
- Case history page:
  - Paginated list (20 per page), sorted newest first
  - Search by title (client filter)
  - Filter status (DRAFT / COMPLETED)
  - Click a case to re-enter the conversational flow: review images & OCR by page, re-edit fields, re-download document if needed
  - Soft-delete button (sets `deletedAt`; hides from listing but data remains)
- Admins see all cases and can filter by judge

### 6. Admin Panel

- `/admin/users` and `/admin/stats` (with `/admin` redirect) — accessible only to Firestore role `ADMIN`
- **User management**: list all users, create judges (calls Admin SDK), deactivate/reactivate, reset password (trigger Firebase reset), toggle `isActive`
- **Usage stats**: simple table — judge name, total cases/month, AI calls today/month

---

## API Contracts (Prototype v1)

All API routes:
- Require `Authorization: Bearer <firebaseIdToken>`
- Return JSON errors in this shape:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable message"
  }
}
```

### `POST /api/ai/populate`

Request body:

```json
{
  "caseId": "optional-existing-case-id",
  "ocrText": "full corrected OCR text",
  "fieldHints": {
    "CLIENT_NAME": "Full legal name of claimant",
    "CASE_NUMBER": "Court case number"
  }
}
```

Validation:
- `ocrText` required, min 50 chars, max 80,000 chars
- Reject with 400 on missing/invalid payload
- Reject with 429 if daily limit reached

Success response:

```json
{
  "fields": {
    "CLIENT_NAME": "Jane Smith",
    "CASE_NUMBER": "2026-CV-00192"
  },
  "usage": {
    "today": 3,
    "dailyLimit": 20
  }
}
```

### `POST /api/export/docx`

Request body:

```json
{
  "caseId": "optional-existing-case-id",
  "title": "Smith - 2026-05-23",
  "rawOcrText": "full corrected OCR text",
  "fields": {
    "CLIENT_NAME": "Jane Smith",
    "CASE_NUMBER": "2026-CV-00192"
  },
  "notes": "optional notes"
}
```

Validation:
- `fields`: required object, at least one key; ignore unknowns, fill missing required with empty string

Success:
- Returns binary `.docx`
- `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `Content-Disposition: attachment; filename="case-[clientLastName]-[YYYY-MM-DD].docx"`

---

## Firestore Rules (Prototype Baseline)

Use as-is or refine:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ADMIN";
    }

    function isJudge(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read: if isAdmin() || isJudge(uid);
      allow write: if isAdmin();
    }

    match /cases/{caseId} {
      allow read, write: if signedIn() &&
        (isAdmin() || resource.data.judgeId == request.auth.uid);
      allow create: if signedIn() &&
        (isAdmin() || request.resource.data.judgeId == request.auth.uid);
    }

    match /usageLogs/{logId} {
      allow read: if isAdmin();
      allow create: if signedIn();
      allow update, delete: if false;
    }
  }
}
```

---

## Required Firestore Indexes

Create these to avoid query issues:

1. `cases`: `judgeId ASC, deletedAt ASC, createdAt DESC`
2. `cases`: `judgeId ASC, status ASC, createdAt DESC`
3. `cases`: `createdAt DESC` (admin/global list)
4. `usageLogs`: `userId ASC, createdAt DESC`

---

## Definition of Done (Prototype)

- Login works for seeded admin & created judge accounts; deactivated accounts are blocked
- Judge can complete end-to-end conversational flow on mobile (upload page-by-page, review each, finalize, field editing, download)
- AI calls block deterministically at daily per-user limit (429)
- Export always produces valid `.docx` even with missing/empty fields
- Case history supports list, filter, reopen, edit, re-export, soft-delete
- Admin can create/deactivate users and see usage
- Firestore rules enforce per-user access only
- No `any` types; no committed secrets
- Basic test coverage: auth guard, rate limit, populate route, export route

---

## Project File Structure

```
/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Auth guard + nav
│   │   ├── dashboard/page.tsx
│   │   ├── new-case/page.tsx       # Conversational upload/review flow
│   │   ├── cases/page.tsx          # History list
│   │   ├── cases/[id]/page.tsx     # Case detail – reopen flow
│   │   └── admin/
│   │       ├── users/page.tsx
│   │       └── stats/page.tsx
│   └── api/
│       ├── ai/populate/route.ts    # Gemini call (server-side)
│       └── export/docx/route.ts   # docxtemplater (server-side)
│
├── components/
│   ├── ui/                         # shadcn/ui
│   ├── ImageConversation.tsx       # Page-by-page conversational upload/review
│   ├── OcrPreview.tsx              # Editable OCR text (single page or all pages)
│   ├── FieldReviewForm.tsx         # AI field review + edit
│   └── CaseCard.tsx
│
├── lib/
│   ├── firebase-client.ts          # Firebase client SDK init
│   ├── firebase-admin.ts           # Firebase Admin SDK init (server-only)
│   ├── gemini.ts                   # Gemini API wrapper
│   ├── ocr.ts                      # Tesseract.js helpers
│   ├── docx.ts                     # docxtemplater wrapper
│   ├── cases.ts                    # Firestore case CRUD
│   ├── users.ts                    # Firestore user CRUD
│   └── rateLimiter.ts              # Daily usage check via Firestore
│
├── templates/
│   └── case-template.docx          # Word template with {{FIELD_NAME}} placeholders
│
├── middleware.ts                    # Protect /app and /admin routes
└── .env.local.example
```

---

## Firestore Collections

```
/users/{uid}
  email, name, role, isActive, dailyLimit, createdAt

/cases/{caseId}
  title, status, judgeId, rawOcrText, extractedFields,
  notes, createdAt, updatedAt, deletedAt

/usageLogs/{logId}
  userId, action, createdAt
```

---

## Environment Variables

```env
# Firebase client (safe to expose to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side only)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=        # Use \n for line breaks, wrap in quotes

# Google Gemini (server-side only)
GEMINI_API_KEY=                    # Set in .env.local — never commit
```

---

## Security Requirements

- Gemini API key is **server-side only**; never exposed to client
- All `/api/*` routes must verify Firebase ID token before processing
- Role checks via Firestore server-side only
- Uploaded images stay in browser — only extracted/corrected text sent to server
- Sanitize all field values before docxtemplater
- Firestore usage checked before every Gemini call (rate limit)
- Enforce per-user case access with Firestore rules

---

## UX & Design Guidelines

- **Conversational step-by-step flow** for new cases:
  1. Upload/review image (per page)
  2. OCR review/correction (per page)
  3. Finalize & review all text
  4. AI field extraction & review
  5. Download docx
- Loading states for every async step, clear messages
- On mobile: bottom sheets (not centered modals)
- All tap targets min 48×48px
- Clean/professional UI — no jargon, no raw errors shown
- Neutral palette (whites/grays), single deep blue accent

---

## Implementation Order

1. **Firebase setup**: client+admin SDK, auth, Firestore, rules, admin seed
2. **Auth flow**: login, session, guard, middleware
3. **Conversation-style OCR**: stepper for image-by-image upload/edit/review
4. **AI integration**: `/api/ai/populate`, Gemini prompt, field review UI
5. **Document generation**: `/api/export/docx`, download, save to Firestore
6. **Case history**: list, detail, re-edit, soft delete
7. **Admin panel**: user management, usage stats

---

## Additional Notes for Cursor

- All business logic in `/lib/` — API routes call only service functions
- Add JSDoc comments to all service functions
- Include `/templates/README.md` describing `{{FIELD_NAME}}`
- Template must have at least 5 example fields: `{{CLIENT_NAME}}`, `{{CASE_NUMBER}}`, `{{HEARING_DATE}}`, `{{JUDGE_NAME}}`, `{{CASE_SUMMARY}}`
- Do not scaffold future features — focus only on described flow
- Handle Admin private key: .env.local, \n for newlines, wrapped in quotes