# KelayakanKu API

KelayakanKu is an AI-assisted eligibility navigator for Malaysian B40 households.

It helps users check which financial aid, subsidies, welfare support, food aid, education aid, or other support programmes may be relevant to their household profile. The system does not submit applications or guarantee approval. Users must verify and apply through official channels.

**System Features**

User:
- Household eligibility form
- Rule-based matching
- Eligibility Snapshot
- Two result sections:
  - Recommended
  - Need More Info
- Programme details page
- Required document checklist
- Next steps
- Official source links
- Gemini-generated simple explanation when available

Admin:
- Admin login
- Policy database management
- SerpAPI official-source search
- Saved search cache to reduce SerpAPI usage
- Webpage text extraction
- Manual pasted-text fallback
- Gemini policy extraction with evidence
- Gemini audit and confidence checking
- Save as draft or approve policy
- Approved policies become active for user recommendations


**API Usage**

Gemini API:
- Explaining why a programme may match the user
- Extracting policy information from official source text
- Auditing extracted policy fields

SerpAPI:
- Search official policy sources


Express backend for the KelayakanKu MVP. It receives a user profile, scores demo policy records with deterministic rule-based logic, and returns recommendation groups for the frontend.


## Setup

```bash
cd backend
npm install
npm run dev
```

Local API URL:

```text
http://localhost:5000
```

## Environment Variables

Create `backend/.env` from `.env.example`.

```text
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_EXPLANATION_MODEL=gemini-2.5-flash-lite
GEMINI_EXTRACTION_MODEL=gemini-2.5-flash-lite
GEMINI_AUDIT_MODEL=gemini-2.5-flash-lite
USE_MOCK_GEMINI=false
SERPAPI_KEY=your_serpapi_key_here
ADMIN_PASSWORD=choose_a_strong_admin_password
ADMIN_TOKEN_SECRET=choose_a_long_random_token_secret
```

`GEMINI_API_KEY` is optional. If missing, `/api/explanation` returns a deterministic fallback explanation. Keep the real key only in `backend/.env`; do not paste it into source files or commit it.
Gemini model names are configurable. To use Flash-Lite for lighter work, set:

```text
GEMINI_EXPLANATION_MODEL=gemini-2.5-flash-lite
GEMINI_EXTRACTION_MODEL=gemini-2.5-flash-lite
GEMINI_AUDIT_MODEL=gemini-2.5-flash-lite
```

If the selected Gemini model returns a quota error, the backend retries once with `gemini-2.5-flash-lite` and then falls back to deterministic text or a low-confidence editable admin draft. Set `USE_MOCK_GEMINI=true` during local testing to force fallback behavior without spending Gemini quota.
`SERPAPI_KEY` is optional. If missing, admin source search shows a friendly setup message.
`ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` are required for `/api/admin/*` routes.

## Endpoints

```text
GET  /api/health
GET  /api/policies
POST /api/eligibility/check
POST /api/explanation
POST /api/admin/login
GET  /api/admin/me
GET  /api/admin/policies
POST /api/admin/policies
PUT  /api/admin/policies/:id
DELETE /api/admin/policies/:id
POST /api/admin/policies/search-serpapi
POST /api/admin/policies/extract
POST /api/admin/policies/approve
```

## Frontend Connection

In the frontend root, set:

```text
VITE_API_BASE_URL=http://localhost:5000
```

The frontend calls `POST /api/eligibility/check` from the processing page and stores the response in localStorage for demo continuity.
The details page can call `POST /api/explanation` to request a short Gemini explanation from the backend.

## Admin Area

The frontend admin pages are hidden from the public navbar:

```text
/admin/login
/admin/dashboard
/admin/policies
/admin/policies/new
/admin/policies/:id/edit
/admin/policy-import
```

Admin tokens are stored in frontend `sessionStorage` for MVP use and sent as:

```text
Authorization: Bearer <token>
```

Admin policy changes are written to `backend/src/data/policies.json`. The public `/api/policies` and `/api/eligibility/check` endpoints read the JSON file through the same database service, so updates are reflected in the normal user flow without changing frontend code.

## Rule Engine

Gemini does not decide eligibility. The rule engine scores each policy using citizenship, income, state, age, work/student category, and household/special conditions.

User-facing score classification:

- `>= 75`: Recommended
- `45 - 74`: Need More Info
- `< 45`: excluded from the public result

The public eligibility response only returns `recommended` and `needMoreInfo`. Policies that clearly fail hard rules, such as citizenship mismatch, income above a strict cap, state mismatch, or age outside the allowed range, are excluded from the user-facing result instead of being shown to users.
