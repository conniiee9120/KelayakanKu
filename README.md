# KelayakanKu

KelayakanKu is an AI-assisted eligibility navigator for Malaysian B40 households. Users answer a guided household profile form and receive an eligibility snapshot for support programmes that may be relevant to them.

KelayakanKu provides guidance only. It does not submit applications, approve users, reject users, or guarantee eligibility. Final eligibility depends on the official agency and current programme rules.

## Tech Stack

Frontend:
- React.js
- TypeScript
- Vite
- Custom CSS

Backend:
- Node.js
- Express.js
- Local JSON policy database
- Deterministic rule engine
- Gemini API for explanations and admin extraction assistance
- SerpAPI for admin-only official-source search
- JWT-protected admin routes

## Main Features

Public flow:
- Landing page with BM/EN support
- Eligibility form
- Review details page
- Results page with `Recommended` and `Need More Info`
- Programme detail page with document checklist, next steps, and official links
- Gemini explanation when configured, with deterministic fallback when unavailable

Admin flow:
- Admin login at `/admin/login`
- Approved policy management
- Draft policy review
- Official-source search via SerpAPI
- Webpage text extraction and pasted-text fallback
- Gemini-assisted policy extraction with evidence and audit
- Manual review before high-risk policy approval

Gemini does not decide eligibility. Recommendation status and scoring come from the backend rule engine.

## Frontend Setup

```bash
npm install
npm run dev
```

Frontend local URL:

```text
http://localhost:5173
```

Production build:

```bash
npm run build
```

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend local URL:

```text
http://localhost:5000
```

Backend production start:

```bash
cd backend
npm start
```

## Environment Variables

Frontend `.env.example`:

```text
VITE_API_BASE_URL=http://localhost:5000
```

Backend `backend/.env.example`:

```text
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
SERPAPI_KEY=
ADMIN_PASSWORD=
ADMIN_TOKEN_SECRET=
```

Real API keys and admin secrets are not included in this repository. Keep real values only in local `.env` files or deployment environment variables.

## Run Locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Health Check

```text
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "KelayakanKu API"
}
```

## Admin Access

Admin login page:

```text
http://localhost:5173/admin/login
```

Admin tokens are stored in frontend `sessionStorage` for MVP use and sent to the backend as:

```text
Authorization: Bearer <token>
```

Admin routes require `ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` in the backend environment.

## Testing

Frontend:

```bash
npm run build
```

Backend:

```bash
cd backend
npm run test:policies
npm run test:rules
npm run test:extraction-confidence
npm run test:extraction-audit
```

The public eligibility response contains only:

```json
{
  "recommended": [],
  "needMoreInfo": []
}
```
- Do not commit `.env` files.
- Do not expose Gemini, SerpAPI, admin password, or JWT secret values in frontend code.
- Gemini and SerpAPI are called only from the backend.
- The frontend only calls the KelayakanKu backend through `VITE_API_BASE_URL`.
