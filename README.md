# SMIT Portal

SMIT Portal is a React/Vite frontend with an Express MVC API. It provides administrator and student access, course admissions, application submission, Excel roster import, and leave management. All records are stored in local JSON files; no database is used.

## Stack and structure

- Frontend: React, Vite, Tailwind CSS 4
- Backend: Node.js, Express (ES modules)
- Passwords: salted Node.js `scrypt` hashes
- Sessions: signed, HTTP-only `SameSite=Strict` cookie; CSRF token required for state-changing requests
- Storage: `backend/data/admins.json`, `students.json`, `courses.json`, and `leaves.json`

```text
my-react-app/src/
  components/       Shared inputs, buttons, cards, modal, status and access components
  pages/            Public courses/home, student auth/applications/leaves, admin management
  services/api.js   Credentialed API client with CSRF handling
  index.css         Tailwind import and shared cyberpunk theme variables
backend/src/
  config/           Environment loading
  controllers/      Auth, course, application, leave and health request handlers
  middleware/       Role, CSRF and error handling
  routes/           `/api` route definitions
  services/         JSON persistence, auth/password, course, application and leave logic
  scripts/          Initial administrator setup
backend/data/       JSON records (admins, students, courses, applications, leaves)
```

## Prerequisites and installation

- Node.js 20.19+ or 22.12+
- npm

Install dependencies independently:

```bash
npm --prefix my-react-app install
npm --prefix backend install
```

Copy `backend/.env.example` to `backend/.env`, set a strong session secret, then run the frontend and API in separate terminals from the repository root. The public Saylani Facebook page is the default embed target; copy `my-react-app/.env.example` to `my-react-app/.env.local` only if you want to override it.

```bash
npm run dev
npm run api:dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:3001`. Vite forwards `/api` to the backend. If the API is hosted at another development URL, set `API_PROXY_TARGET` in `my-react-app/.env.local`. For production, set `NODE_ENV=production` (cookies become Secure automatically) and serve the frontend and API over HTTPS.

The homepage attempts to show the public Saylani Facebook timeline with Meta's Page Plugin. Set `VITE_FACEBOOK_PAGE_URL` in `my-react-app/.env.local` to override the default; restart Vite after changing it. A direct-page link remains available if Facebook blocks or cannot display the feed. The homepage and student/course links remain usable when the embed is unavailable.

To customize application fields, set `ADMISSION_FORM_FIELDS` in `backend/.env` to a JSON array, for example:

```dotenv
ADMISSION_FORM_FIELDS=[{"key":"phone","label":"Phone number","type":"tel","required":true,"maxLength":30},{"key":"education","label":"Education","type":"text","required":true,"maxLength":120}]
```

Each key must be unique; supported types are `text`, `tel`, `email`, and `textarea`. The API limits the form to 12 fields and validates every submitted field server-side.

Build and lint the frontend from the root with `npm run build` and `npm run lint`. Start the API with `npm run api:start`.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime mode |
| `PORT` | `3001` | API listen port |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated exact allowed origins |
| `SESSION_SECRET` | Required | Random secret of at least 32 characters used to sign session cookies |
| `COOKIE_SECURE` | `false` | Set `true` when terminating HTTPS outside production mode |
| `API_PROXY_TARGET` | `http://localhost:3001` | Optional Vite proxy target |
| `INIT_ADMIN_NAME` | Empty | Initial-admin script input; set only when initializing |
| `INIT_ADMIN_USERNAME` | Empty | Initial-admin script input; set only when initializing |
| `INIT_ADMIN_PASSWORD` | Empty | Initial-admin script input; set only when initializing |
| `ADMISSION_FORM_FIELDS` | Built-in phone/email/education/message fields | Optional JSON array to configure the public course application form; each field has `key`, `label`, `type` (`text`, `tel`, `email`, `textarea`), `required`, and `maxLength` |
| `VITE_FACEBOOK_PAGE_URL` | Saylani's public page URL | Optional override for the homepage Page Plugin |

Generate a secret without putting it in source control, for example:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Keep `backend/.env` private; it is ignored by Git. The API refuses to start without `SESSION_SECRET`.

## Initial administrator

When there are no administrators, visit `/admin/signup` and create the first admin account. This public endpoint closes atomically after the first account is created. The environment-based setup below remains available for headless deployments.

1. Copy `.env.example` to `.env` and set `SESSION_SECRET`.
2. Set `INIT_ADMIN_NAME`, `INIT_ADMIN_USERNAME`, and `INIT_ADMIN_PASSWORD` in `backend/.env`. Use a password of 12–128 characters.
3. Run `npm --prefix backend run admin:init` from the repository root.
4. Clear the three `INIT_ADMIN_*` values from `.env` after initialization.

The script hashes the password and writes the admin to `backend/data/admins.json`. It creates an account only when no administrator exists, so the record survives backend restarts and rerunning setup will not reset credentials. Additional administrators can be created by a signed-in administrator at `/admin/admins/new`.

## Student signup records and roster imports

Signup verifies a student's CNIC and roll number against an existing record in `backend/data/students.json`. The repository starts with an empty list because it has no real student roster. Before students can register, an authorized operator must import the approved roster into this file, for example:

```json
[
  {
    "id": "student-001",
    "name": "Example Student",
    "cnic": "1234512345671",
    "rollNumber": "SMIT-001",
    "registered": false,
    "passwordHash": null
  }
]
```

Store CNIC as 13 digits (hyphens are accepted during entry) and normalize roll numbers to uppercase. Do not put passwords or password hashes into roster imports. An administrator can add one record or import an Excel `.xlsx` workbook at `/admin/students/new`. Required headers are `Name`, `CNIC`, and `Roll Number` (aliases `Student Name`/`Full Name` and `Roll No`/`Roll` are also accepted). CNIC cells must be stored as text to avoid Excel rounding. Workbooks are limited to 5 MB and 500 records. All rows are validated before an atomic import; any invalid or duplicate row prevents the entire import. Signup sets the password hash and registration timestamp. Unknown CNIC/roll pairs are rejected; registered records cannot sign up again.

## Course applications

The homepage lists `/courses` with current courses. Students must be signed in to apply; the API rechecks course status and rejects closed courses or a second application by the same student. Student submissions and their configured fields are stored in `backend/data/applications.json`; students can view their own submissions at `/applications`. The application fields can be changed in `ADMISSION_FORM_FIELDS` (valid JSON array, up to 12 fields). Course status is always enforced server-side.

## Leave management

Students submit leave requests and check decisions at `/student/leaves`. Attachments are optional JPEG, PNG, or WebP pictures up to 2 MB; the backend checks both MIME type and file signature. The picture is base64-encoded inside `backend/data/leaves.json`, so keep backups private. Administrators review requests at `/admin/leaves`, filter by status, view details/attachments, and approve or reject pending requests with an optional note. Each student can only read their own leave history; only administrators can inspect all requests or make decisions.

## API

All responses use `{ "success", "message", "data?", "errors?" }`. Authenticated writes use the session cookie and `X-CSRF-Token` returned by `GET /api/auth/csrf`. The frontend API service handles this automatically.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health status |
| `GET` | `/api/auth/csrf` | Public | Issue session-bound CSRF token |
| `GET` | `/api/auth/session` | Public | Return current sanitized user or `null` |
| `GET` | `/api/auth/admin/setup-status` | Public | Indicate whether first-admin signup is available |
| `POST` | `/api/auth/admin/signup` | Public + CSRF, first admin only | Create and sign in the first administrator |
| `POST` | `/api/auth/admin/login` | Public + CSRF | Admin username/password login |
| `POST` | `/api/auth/admin/password` | Admin + CSRF | Verify current password and change it |
| `POST` | `/api/auth/admin/users` | Admin + CSRF | Add an administrator; duplicate usernames return `409` |
| `POST` | `/api/auth/admin/students` | Admin + CSRF | Add an eligible student roster record; duplicate CNIC/roll number returns `409` |
| `POST` | `/api/auth/admin/students/import` | Admin + CSRF | Validate and atomically import up to 500 roster rows; row errors are returned under `errors.rows` |
| `POST` | `/api/auth/student/signup` | Public + CSRF | Match roster record and register student |
| `POST` | `/api/auth/student/login` | Public + CSRF | Student roll-number/password login |
| `POST` | `/api/auth/logout` | Signed-in user + CSRF | End the session |
| `GET` | `/api/courses` | Public | List courses |
| `POST` | `/api/courses` | Admin + CSRF | Create a course |
| `PATCH` | `/api/courses/:id` | Admin + CSRF | Change only `name` and/or `admissionStatus` (`Open` or `Closed`) |
| `GET` | `/api/applications/fields` | Public | Load configured application fields |
| `GET` | `/api/applications/mine` | Student | View the signed-in student's course applications |
| `POST` | `/api/applications` | Student + CSRF | Apply to an open course once; closed courses return `403`, duplicate submissions `409` |
| `POST` | `/api/leaves` | Student + CSRF | Submit a validated leave request, initially `Pending` |
| `GET` | `/api/leaves/mine` | Student | View own leave history and decisions |
| `GET` | `/api/leaves?status=Pending` | Admin | List all leave requests, optionally filtered by status |
| `GET` | `/api/leaves/:id` | Admin | Load details and optional attachment |
| `PATCH` | `/api/leaves/:id` | Admin + CSRF | Approve or reject a pending request with an optional note |

Course records contain `id`, `name`, `admissionStatus`, and `createdAt`. Editing cannot change the ID or creation timestamp. Admin and student responses contain no password hashes or CNIC values. Admins can add a student signup record in the roster page; its CNIC is never returned in API responses.

## Verification and scope

The data files are written atomically and persist across backend restarts. Sessions are held in Express's in-memory session store and expire after eight hours; restarting the API ends active sessions while leaving JSON records intact. Use a persistent session store before horizontally scaling or relying on long-lived production sessions. Backend JSON writes are serialized within a single running API process; run one API process for this file-backed deployment.

No database, ORM, or analytics dashboard is included. Runtime JSON files are ignored by Git to avoid committing student CNICs, application details, leave attachments, or password hashes; the API creates missing collections on startup. Back up these files securely outside source control.
