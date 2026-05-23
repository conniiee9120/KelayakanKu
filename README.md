# KelayakanKu

KelayakanKu is an AI-assisted eligibility navigator for Malaysian B40 households. It helps users check which financial aid, subsidies, welfare support, food aid, education aid, or other support programmes may be relevant to their household profile.

KelayakanKu provides guidance only. It does not submit applications, approve users, or guarantee eligibility. Users should always verify final criteria and apply through official channels.

## Tech Stack

Frontend:
- React.js
- TypeScript / TSX
- Vite
- Custom CSS
- LocalStorage for demo continuity

Backend:
- Node.js
- Express.js
- Local JSON policy database
- Deterministic rule-based eligibility engine
- Gemini API for explanations and admin extraction assistance
- SerpAPI for admin-only official-source search
- JWT-protected admin routes

Deployment targets:
- Frontend: Vercel
- Backend: Render

## Main Features

Public user flow:
- Landing page
- Household-focused eligibility form
- Review details page
- Processing page
- Eligibility Snapshot with two result sections: Recommended and Need More Info
- Programme details page with official source links, document checklist, next steps, and Gemini/fallback explanation
- Bahasa Melayu and English support for public pages

Admin flow:
- Admin login at `/admin/login`
- Approved policy management
- Draft review
- SerpAPI official-source search with saved cache
- Webpage text extraction and pasted-text fallback
- Gemini-assisted policy extraction with evidence and audit
- Human review before draft save or approval

Gemini does not decide eligibility. The backend rule engine remains the source of truth for recommendation status and score.

## Frontend Setup

```bash
npm install
npm run dev
```

Frontend local URL:

```text
http://localhost:5173
```

Build for production:

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

Test health endpoint:

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

## Environment Variables

Create a frontend `.env` file from `.env.example`:

```text
VITE_API_BASE_URL=http://localhost:5000
```

Create `backend/.env` from `backend/.env.example`:

```text
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
SERPAPI_KEY=
ADMIN_PASSWORD=
ADMIN_TOKEN_SECRET=
```

Real API keys and admin secrets are not included in this repository. Keep them only in local `.env` files or deployment environment variables.

## Admin Access

The admin pages are not shown in the public navbar.

Routes:
- `/admin/login`
- `/admin/dashboard`
- `/admin/policies`
- `/admin/drafts`
- `/admin/policy-import`
- `/admin/policy-import/extract`

Admin tokens are stored in `sessionStorage` for MVP use and sent to the backend as:

```text
Authorization: Bearer <token>
```

## Backend API Summary

Public endpoints:
- `GET /api/health`
- `GET /api/policies`
- `POST /api/eligibility/check`
- `POST /api/explanation`

Admin endpoints:
- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/admin/policies`
- `POST /api/admin/policies`
- `PUT /api/admin/policies/:id`
- `DELETE /api/admin/policies/:id`
- `GET /api/admin/policies/search-presets`
- `POST /api/admin/policies/search-serpapi`
- `GET /api/admin/policies/search-cache`
- `POST /api/admin/policies/extract`
- `POST /api/admin/policies/approve`

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
```

The public result response should contain only:

```json
{
  "recommended": [],
  "needMoreInfo": []
}
```

## Deployment Notes

Vercel frontend environment variable:

```text
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

Render backend environment variables:

```text
PORT=5000
FRONTEND_ORIGIN=https://your-vercel-frontend-url.vercel.app
GEMINI_API_KEY=
SERPAPI_KEY=
ADMIN_PASSWORD=
ADMIN_TOKEN_SECRET=
```

Do not commit `.env`, `backend/.env`, `node_modules`, or `dist` folders.
