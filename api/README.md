# BuildX API

Production-oriented Express.js API for BuildX user registration, payment verification, admin management, and a real-time quiz platform. Authentication is fully custom and handled inside Express with JWTs and HTTP-only cookies. File uploads use Multer memory storage and Supabase Storage. PostgreSQL is accessed through Prisma.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Database and Prisma](#database-and-prisma)
- [Supabase Storage Setup](#supabase-storage-setup)
- [Authentication](#authentication)
- [Middleware](#middleware)
- [Database Models](#database-models)
- [API Conventions](#api-conventions)
- [Endpoints](#endpoints)
- [File Uploads](#file-uploads)
- [Socket.IO Events](#socketio-events)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Testing and Quality Checks](#testing-and-quality-checks)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contribution Guide](#contribution-guide)

## Tech Stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js |
| API framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Realtime | Socket.IO |
| Auth | Custom JWT + cookies |
| Password hashing | bcryptjs |
| Validation | Zod |
| File uploads | Multer memory storage |
| Object storage | Supabase Storage |
| Security middleware | Helmet, CORS, express-rate-limit |

## Project Structure

```text
.
├── generated/prisma/                 # Generated Prisma client output
├── prisma/
│   ├── migrations/                    # Prisma migrations
│   └── schema.prisma                  # Database schema
├── src/
│   ├── app.ts                         # Express app, middleware, route mounting
│   ├── server.ts                      # HTTP + Socket.IO server bootstrap
│   ├── socket.ts                      # Socket.IO authentication and room handlers
│   ├── controllers/                   # Request handlers
│   ├── lib/prisma.ts                  # Prisma singleton
│   ├── middleware/                    # Auth, errors, multer
│   ├── routes/                        # Express routers
│   ├── services/                      # Business logic and realtime quiz services
│   ├── utils/                         # Supabase client and upload helpers
│   └── validators/                    # Zod schemas
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── yarn.lock
```

## Environment Variables

Create a `.env` file in the project root.

```env
# Server
NODE_ENV=development
PORT=8080
FRONTEND_ORIGIN=http://localhost:3000

# Database
# For Supabase Postgres, use the pooled connection string for app runtime.
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true

# Optional but recommended for Prisma migrations/direct connections.
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres

# JWT
JWT_SECRET=replace-with-a-long-random-secret

# Supabase Storage
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
SUPABASE_ANON_KEY=replace-with-anon-key

# Admin bootstrap
ADMIN_EMAILS=admin1@gmail.com,admin2@gmail.com
ADMIN_DEFAULT_PASSWORD=admin1234
```

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | Use `production` in production so cookies are marked `secure`. |
| `PORT` | Yes | Server port. `src/server.ts` reads `process.env.PORT`, so set this explicitly. |
| `FRONTEND_ORIGIN` | No | CORS and Socket.IO origin. Defaults to `http://localhost:3000`. |
| `DATABASE_URL` | Yes | Prisma runtime database URL. Supabase pooled URL is recommended for deployed API servers. |
| `DIRECT_URL` | Recommended | Direct database URL for migrations. `prisma.config.ts` uses `DIRECT_URL ?? DATABASE_URL`. |
| `JWT_SECRET` | Yes | Secret used to sign and verify custom JWTs. The API throws on startup if missing. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only Supabase service role key used for Storage writes. Never expose this to clients. |
| `SUPABASE_ANON_KEY` | Present in env contract | Available for frontend/public Supabase use, but the current backend uses the service role key for uploads. |
| `ADMIN_EMAILS` | Yes for admin registration | Comma-separated allowlist of admin email addresses. |
| `ADMIN_DEFAULT_PASSWORD` | Yes for admin registration | Bootstrap password required to create an allowlisted admin account. Admins can change it after login. |

## Installation

```bash
yarn install
cp .env.example .env # if you create one; otherwise create .env manually
yarn prisma:generate
yarn prisma:migrate
yarn dev
```

Available scripts:

| Script | Purpose |
| --- | --- |
| `yarn dev` | Start development server with `ts-node-dev --transpile-only`. |
| `yarn build` | Compile TypeScript to `dist/`. |
| `yarn start` | Run compiled server from `dist/src/server.js`. |
| `yarn type-check` | Run `tsc --noEmit`. |
| `yarn prisma:generate` | Generate Prisma client. |
| `yarn prisma:migrate` | Run Prisma development migrations. |
| `yarn prisma:push` | Push schema directly to the database. |
| `yarn prisma:studio` | Open Prisma Studio. |
| `yarn lint` | Runs `eslint src/**/*.ts`; ensure ESLint is installed/configured before relying on this script. |

## Database and Prisma

The Prisma schema is in `prisma/schema.prisma`. The project stores the generated Prisma client under `generated/prisma`.

Recommended Supabase setup:

1. Use Supabase Postgres as the database.
2. Set `DATABASE_URL` to the Supabase pooled connection string for runtime traffic.
3. Set `DIRECT_URL` to the direct database connection string for migrations.
4. Run:

```bash
yarn prisma:generate
yarn prisma:migrate
```

For production deployments, run migrations during release:

```bash
yarn prisma:generate
yarn build
npx prisma migrate deploy
yarn start
```

The Prisma client is exported from `src/lib/prisma.ts` as a singleton to avoid excessive client creation during development and hot reloads.

## Supabase Storage Setup

The API uploads payment receipt screenshots to a Supabase Storage bucket named `payment-slips`.

1. In Supabase Dashboard, open **Storage**.
2. Create a bucket named `payment-slips`.
3. The current upload utility returns public URLs with `getPublicUrl`, so the bucket must be public or have a policy that allows the returned URL to be viewed by admins.
4. Keep write access private. Uploads must go through this backend using `SUPABASE_SERVICE_ROLE_KEY`.
5. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

Upload paths are generated as:

```text
{userId}/{uuid}.{jpg|png|webp}
```

## Authentication

Authentication is custom Express authentication. Supabase Auth is not used.

### JWT Transport

After login, the API signs a JWT payload:

```json
{
  "userId": "uuid",
  "role": "USER"
}
```

The token expires in 7 days and is set as an HTTP-only cookie named `token`.

Protected endpoints also accept:

```http
Authorization: Bearer <jwt>
```

Socket.IO accepts the same JWT through `handshake.auth.token`, an `Authorization` header, or the `token` cookie.

### Roles

| Role | Capabilities |
| --- | --- |
| `USER` | Login only after admin payment approval, view own profile, upload/resubmit payment receipt, join/submit quizzes, view own quiz history. |
| `ADMIN` | Register only if email is allowlisted, login through admin route, approve/reject payments, manage users, manage own admin profile, create/host quizzes, participate in quizzes. |

### Account Status

| Status | Meaning |
| --- | --- |
| `PENDING` | User account exists but payment has not been approved. Login is rejected. |
| `VERIFIED` | Account can log in and use protected user APIs. |
| `REJECTED` | Payment was rejected. User may re-register/resubmit with the same email and correct password. |

## Middleware

| File | Purpose |
| --- | --- |
| `src/middleware/auth.middleware.ts` | Verifies JWT from cookie or bearer token and enforces roles. |
| `src/middleware/error.middleware.ts` | Handles 404s, Multer errors, file-filter errors, and fallback 500 responses. |
| `src/middleware/multer.middleware.ts` | Configures memory uploads for one `paymentReceipt` image, max 5 MB. |
| `src/app.ts` | Applies Helmet, CORS, JSON parsers, cookie parser, and rate limits. |

## Database Models

### Enums

| Enum | Values |
| --- | --- |
| `UserRole` | `USER`, `ADMIN` |
| `AccountStatus` | `PENDING`, `VERIFIED`, `REJECTED` |
| `VerificationStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `QuizStatus` | `DRAFT`, `READY`, `ARCHIVED` |
| `QuizSessionStatus` | `WAITING`, `RUNNING`, `ENDED` |
| `ParticipantSessionStatus` | `JOINED`, `TAKING`, `SUBMITTED`, `DISCONNECTED` |

### Models

| Model | Purpose |
| --- | --- |
| `User` | Stores users and admins. Includes unique `email`, role, status, profile fields, hashed password, and `deletedUsers` email audit array for admins. |
| `PaymentVerification` | One payment verification record per user. Stores receipt URL, submitted amount, verified amount, status, rejection reason, verifier admin, and timestamps. |
| `Quiz` | Admin-created quiz metadata, duration, leaderboard limit, status, and questions. |
| `Question` | Quiz question text and order. |
| `Option` | Answer option text, correctness flag, and order. |
| `QuizSession` | Live quiz run with join code, host admin, status, timing, late-join flag, and leaderboard limit. |
| `ParticipantSession` | User participation in a quiz session, status, join time, last seen time, and submission time. |
| `AnswerSubmission` | Per-question submitted option IDs and correctness result. |
| `QuizResult` | Final score, percentage, rank, submission time, and duration for a user in a quiz session. |

## API Conventions

Base URL examples assume:

```text
http://localhost:5000
```

Common headers:

```http
Content-Type: application/json
Authorization: Bearer <token>
```

For cookie-based auth in cURL, use:

```bash
-b cookies.txt -c cookies.txt
```

Most responses use:

```json
{
  "success": true,
  "data": {}
}
```

Validation failures generally use:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## Endpoints

### Route Summary

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Health check. |
| `POST` | `/api/auth/register` | Public | Register user with one payment receipt image. |
| `POST` | `/api/auth/login` | Public | Login verified user. |
| `POST` | `/api/auth/admin/register` | Public | Register allowlisted admin with default password. |
| `POST` | `/api/auth/admin/login` | Public | Login admin. |
| `PATCH` | `/api/auth/admin/change-password` | Admin | Change current admin password. |
| `POST` | `/api/auth/logout` | Authenticated | Clear auth cookie. |
| `GET` | `/api/user/profile` | User | Get verified user profile. |
| `POST` | `/api/payments/upload` | User | Upload/resubmit payment receipt. |
| `GET` | `/api/admin/payments/pending` | Admin | List pending payment verifications. |
| `PATCH` | `/api/admin/payments/:id/approve` | Admin | Approve a payment and verify the user. |
| `PATCH` | `/api/admin/payments/:id/reject` | Admin | Reject a payment and mark user rejected. |
| `GET` | `/api/admin/users` | Admin | List users with optional filters. |
| `GET` | `/api/admin/users/email/:email` | Admin | Get user or admin account by email. |
| `GET` | `/api/admin/users/contact/:contact` | Admin | Get user by contact number. |
| `GET` | `/api/admin/users/:id` | Admin | Get user by UUID. |
| `PATCH` | `/api/admin/users/:id` | Admin | Update non-admin user details. |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete non-admin user and record deleted email on admin. |
| `PATCH` | `/api/admin/admins/me` | Admin | Update current admin's own account details. |
| `GET` | `/api/quizzes/history/me` | Authenticated | Get current user's quiz history. |
| `POST` | `/api/quizzes/sessions/join` | Authenticated | Join quiz session by join code. |
| `GET` | `/api/quizzes/sessions/:id` | Session participant or host admin | Get quiz session state. |
| `POST` | `/api/quizzes/sessions/:id/submit` | Session participant | Submit quiz answers. |
| `GET` | `/api/quizzes/sessions/:id/leaderboard` | Session participant or host admin | Get session leaderboard. |
| `GET` | `/api/quizzes/admin/quizzes` | Admin | List quizzes created by current admin. |
| `POST` | `/api/quizzes/admin/quizzes` | Admin | Create draft quiz. |
| `POST` | `/api/quizzes/admin/quizzes/:id/questions` | Admin | Add question to own draft quiz. |
| `PATCH` | `/api/quizzes/admin/quizzes/:id/finalize` | Admin | Mark quiz ready and set duration/leaderboard limit. |
| `POST` | `/api/quizzes/admin/sessions` | Admin | Create waiting quiz session with join code. |
| `PATCH` | `/api/quizzes/admin/sessions/:id/start` | Admin host | Start quiz session. |
| `PATCH` | `/api/quizzes/admin/sessions/:id/end` | Admin host | End quiz session and publish leaderboard. |

### GET /health

Checks whether the API is running.

Auth: none.

```bash
curl http://localhost:5000/health
```

Success `200`:

```json
{
  "success": true,
  "message": "BuildX API is running",
  "timestamp": "2026-06-08T10:00:00.000Z",
  "version": "1.0.0"
}
```

### POST /api/auth/register

Registers a normal user and uploads exactly one payment receipt screenshot/photo. The account is created with `PENDING` status. The user cannot log in until an admin approves the payment.

Auth: public.

Content type: `multipart/form-data`.

File field:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `paymentReceipt` | file | Yes | One image only. MIME must be `image/jpeg`, `image/jpg`, `image/png`, or `image/webp`. Max 5 MB. |

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | Yes | Trimmed, 2-100 chars. |
| `email` | string | Yes | Valid email, normalized to lowercase. Admin allowlisted emails must use admin registration. |
| `password` | string | Yes | 8-100 chars, at least one lowercase, one uppercase, and one number. |
| `contact` | string | Yes | 10-15 digits, optional leading `+`. |
| `institution` | string | Yes | Trimmed, 2-200 chars. |
| `submittedAmount` | number/string | No | Must be numeric if provided. |

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -F "name=Riya Sharma" \
  -F "email=riya@example.com" \
  -F "password=Password123" \
  -F "contact=9876543210" \
  -F "institution=BuildX University" \
  -F "submittedAmount=499" \
  -F "paymentReceipt=@/absolute/path/payment.png"
```

Success `201` for new account:

```json
{
  "success": true,
  "message": "Account created. Payment verification is pending.",
  "data": {
    "id": "uuid",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "contact": "9876543210",
    "institution": "BuildX University",
    "role": "USER",
    "status": "PENDING",
    "createdAt": "2026-06-08T10:00:00.000Z"
  }
}
```

Success `200` for rejected user resubmission:

```json
{
  "success": true,
  "message": "Payment receipt resubmitted. Verification is pending.",
  "data": {
    "id": "uuid",
    "email": "riya@example.com",
    "status": "PENDING"
  }
}
```

Possible errors:

| Status | Reason |
| --- | --- |
| `400` | Validation failed, missing `paymentReceipt`, invalid amount, invalid file type, or file too large. |
| `401` | Rejected user resubmission password is incorrect. |
| `403` | Email belongs to admin allowlist and must use admin route. |
| `409` | User already exists and is not rejected. |
| `500` | Storage or server failure. |

### POST /api/auth/login

Logs in a verified normal user. Pending and rejected users are denied.

Auth: public.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | Yes | Valid email. |
| `password` | string | Yes | Non-empty. |

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"riya@example.com","password":"Password123"}'
```

Success `200`:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "id": "uuid",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "contact": "9876543210",
    "institution": "BuildX University",
    "role": "USER",
    "status": "VERIFIED"
  }
}
```

Possible errors:

| Status | Reason |
| --- | --- |
| `400` | Validation failed. |
| `401` | Invalid credentials. |
| `403` | Admin used user login route, account pending, or payment rejected. |
| `500` | Server error. |

### POST /api/auth/admin/register

Creates an admin account only when the email is included in `ADMIN_EMAILS` and the submitted password equals `ADMIN_DEFAULT_PASSWORD`.

Auth: public.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | Yes | 2-100 chars. |
| `email` | string | Yes | Valid email and allowlisted in `ADMIN_EMAILS`. |
| `institution` | string | Yes | 2-200 chars. |
| `password` | string | Yes | Must equal `ADMIN_DEFAULT_PASSWORD`. |

```bash
curl -X POST http://localhost:5000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin One","email":"admin1@gmail.com","institution":"BuildX","password":"admin1234"}'
```

Success `201`:

```json
{
  "success": true,
  "message": "Admin account created successfully",
  "data": {
    "id": "uuid",
    "name": "Admin One",
    "email": "admin1@gmail.com",
    "contact": "N/A",
    "institution": "BuildX",
    "role": "ADMIN",
    "status": "VERIFIED",
    "createdAt": "2026-06-08T10:00:00.000Z"
  }
}
```

Possible errors: `400` validation failed, `401` invalid admin credentials, `409` admin already exists, `500` admin registration not configured or server error.

### POST /api/auth/admin/login

Logs in an admin account through the admin-specific route.

Auth: public.

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -c admin-cookies.txt \
  -d '{"email":"admin1@gmail.com","password":"admin1234"}'
```

Success `200`:

```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "id": "uuid",
    "name": "Admin One",
    "email": "admin1@gmail.com",
    "contact": "N/A",
    "institution": "BuildX",
    "role": "ADMIN",
    "status": "VERIFIED"
  }
}
```

Possible errors: `400` validation failed, `401` invalid admin credentials, `500` server error.

### PATCH /api/auth/admin/change-password

Changes the logged-in admin's password.

Auth: `ADMIN`.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `currentPassword` | string | Yes | Non-empty. |
| `newPassword` | string | Yes | 8-100 chars, at least one lowercase, one uppercase, and one number. |

```bash
curl -X PATCH http://localhost:5000/api/auth/admin/change-password \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"currentPassword":"admin1234","newPassword":"NewAdmin123"}'
```

Success `200`:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

Possible errors: `400` validation failed, `401` missing/invalid token or current password incorrect, `403` non-admin, `500` server error.

### POST /api/auth/logout

Clears the auth cookie for the current user or admin.

Auth: authenticated.

```bash
curl -X POST http://localhost:5000/api/auth/logout -b cookies.txt -c cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

Possible errors: `401` missing/invalid token.

### GET /api/user/profile

Returns the current verified user's profile. Users cannot update their own profile after registration.

Auth: `USER`.

```bash
curl http://localhost:5000/api/user/profile -b cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "contact": "9876543210",
    "institution": "BuildX University",
    "status": "VERIFIED"
  }
}
```

Possible errors: `401` missing/invalid token, `403` non-user or unverified user, `404` user not found, `500` server error.

### POST /api/payments/upload

Uploads or resubmits one payment receipt for an authenticated user. The uploaded file is stored in Supabase Storage and the returned public URL is stored in `PaymentVerification` through an upsert.

Auth: `USER`.

Content type: `multipart/form-data`.

```bash
curl -X POST http://localhost:5000/api/payments/upload \
  -b cookies.txt \
  -F "submittedAmount=499" \
  -F "paymentReceipt=@/absolute/path/new-payment.webp"
```

Success `200`:

```json
{
  "success": true,
  "message": "Payment submitted",
  "data": {
    "id": "uuid",
    "paymentSlipUrl": "https://PROJECT_REF.supabase.co/storage/v1/object/public/payment-slips/userId/file.webp",
    "submittedAmount": 499,
    "status": "PENDING",
    "userId": "uuid"
  }
}
```

Possible errors: `400` missing file, invalid file, invalid amount; `401` missing/invalid token; `403` non-user; `500` storage/server error.

### GET /api/admin/payments/pending

Lists pending payment verifications for normal users whose accounts are still pending.

Auth: `ADMIN`.

```bash
curl http://localhost:5000/api/admin/payments/pending -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "payment-verification-uuid",
      "paymentSlipUrl": "https://...",
      "submittedAmount": 499,
      "status": "PENDING",
      "submittedAt": "2026-06-08T10:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "name": "Riya Sharma",
        "email": "riya@example.com",
        "institution": "BuildX University",
        "contact": "9876543210"
      }
    }
  ]
}
```

Possible errors: `401` missing/invalid token, `403` non-admin, `500` failed to fetch payments.

### PATCH /api/admin/payments/:id/approve

Approves a payment verification and marks the linked user `VERIFIED`.

Auth: `ADMIN`.

URL params:

| Param | Rules |
| --- | --- |
| `id` | UUID payment verification ID. |

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `verifiedAmount` | number/string | No | Must be numeric if provided. |

```bash
curl -X PATCH http://localhost:5000/api/admin/payments/PAYMENT_UUID/approve \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"verifiedAmount":499}'
```

Success `200`:

```json
{
  "success": true,
  "message": "Payment approved",
  "data": {
    "id": "payment-verification-uuid",
    "status": "APPROVED",
    "verifiedAmount": 499,
    "verifiedAt": "2026-06-08T10:00:00.000Z",
    "verifiedByAdminId": "admin-uuid",
    "user": {
      "id": "user-uuid",
      "email": "riya@example.com",
      "status": "VERIFIED"
    }
  }
}
```

Possible errors: `400` invalid UUID or amount, `401` missing/invalid token, `403` non-admin, `500` approval failed.

### PATCH /api/admin/payments/:id/reject

Rejects a payment verification and marks the linked user `REJECTED`.

Auth: `ADMIN`.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `reason` | string | No | Stored as rejection reason. Defaults to `Not Specified`. |

```bash
curl -X PATCH http://localhost:5000/api/admin/payments/PAYMENT_UUID/reject \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"reason":"Receipt does not show completed payment."}'
```

Success `200`:

```json
{
  "success": true,
  "message": "Payment rejected",
  "data": {
    "id": "payment-verification-uuid",
    "status": "REJECTED",
    "rejectionReason": "Receipt does not show completed payment.",
    "user": {
      "id": "user-uuid",
      "email": "riya@example.com",
      "status": "REJECTED"
    }
  }
}
```

Possible errors: `400` invalid UUID, `401` missing/invalid token, `403` non-admin, `500` rejection failed.

### GET /api/admin/users

Lists normal users. Admin accounts are excluded from this endpoint.

Auth: `ADMIN`.

Query params:

| Param | Type | Required | Rules |
| --- | --- | --- | --- |
| `status` | string | No | `PENDING`, `VERIFIED`, or `REJECTED`. |
| `name` | string | No | Non-empty partial match, case-insensitive. |
| `institution` | string | No | Non-empty partial match, case-insensitive. |

```bash
curl "http://localhost:5000/api/admin/users?status=PENDING&institution=BuildX" \
  -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "name": "Riya Sharma",
      "email": "riya@example.com",
      "contact": "9876543210",
      "institution": "BuildX University",
      "role": "USER",
      "status": "PENDING",
      "deletedUsers": [],
      "paymentVerification": {
        "id": "payment-uuid",
        "paymentSlipUrl": "https://...",
        "status": "PENDING"
      }
    }
  ]
}
```

Possible errors: `400` invalid filters, `401` missing/invalid token, `403` non-admin, `500` failed to fetch users.

### GET /api/admin/users/email/:email

Gets any account, including admins, by email.

Auth: `ADMIN`.

```bash
curl http://localhost:5000/api/admin/users/email/riya@example.com -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "riya@example.com",
    "role": "USER",
    "status": "VERIFIED"
  }
}
```

Possible errors: `400` invalid email, `401` missing/invalid token, `403` non-admin, `404` account not found, `500` failed to fetch account.

### GET /api/admin/users/contact/:contact

Gets a normal user by contact number. Admin accounts are excluded.

Auth: `ADMIN`.

```bash
curl http://localhost:5000/api/admin/users/contact/9876543210 -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contact": "9876543210",
    "role": "USER"
  }
}
```

Possible errors: `400` invalid contact number, `401` missing/invalid token, `403` non-admin, `404` user not found, `500` failed to fetch user.

### GET /api/admin/users/:id

Gets a normal user by UUID. Admin accounts are excluded.

Auth: `ADMIN`.

```bash
curl http://localhost:5000/api/admin/users/USER_UUID -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "USER_UUID",
    "email": "riya@example.com",
    "role": "USER",
    "status": "VERIFIED"
  }
}
```

Possible errors: `400` invalid UUID, `401` missing/invalid token, `403` non-admin, `404` user not found, `500` failed to fetch user.

### PATCH /api/admin/users/:id

Updates a normal user's details. Admin accounts cannot be updated through this route.

Auth: `ADMIN`.

Body: at least one field is required.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2-100 chars. |
| `email` | string | Valid email. |
| `contact` | string | 10-15 digits, optional leading `+`. |
| `institution` | string | 2-200 chars. |
| `status` | string | `PENDING`, `VERIFIED`, or `REJECTED`. |

```bash
curl -X PATCH http://localhost:5000/api/admin/users/USER_UUID \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"status":"VERIFIED","institution":"Updated Institute"}'
```

Success `200`:

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "USER_UUID",
    "institution": "Updated Institute",
    "status": "VERIFIED"
  }
}
```

Possible errors: `400` invalid UUID, invalid fields, empty body, or duplicate email; `401` missing/invalid token; `403` non-admin; `404` user not found; `500` update failed.

### DELETE /api/admin/users/:id

Deletes a normal user and their payment verification records. The deleted user's email is appended to the deleting admin's `deletedUsers` array.

Auth: `ADMIN`.

```bash
curl -X DELETE http://localhost:5000/api/admin/users/USER_UUID -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "deletedEmail": "riya@example.com"
  }
}
```

Possible errors: `400` invalid UUID, `401` missing/invalid token, `403` non-admin, `404` user not found, `500` delete failed.

### PATCH /api/admin/admins/me

Updates the logged-in admin's own account. Admins cannot update other admins through admin user update routes.

Auth: `ADMIN`.

Body: at least one field is required.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2-100 chars. |
| `email` | string | Valid email and must still be in `ADMIN_EMAILS`. |
| `contact` | string | 2-30 chars. |
| `institution` | string | 2-200 chars. |

```bash
curl -X PATCH http://localhost:5000/api/admin/admins/me \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"contact":"+919876543210"}'
```

Success `200`:

```json
{
  "success": true,
  "message": "Admin account updated successfully",
  "data": {
    "id": "admin-uuid",
    "email": "admin1@gmail.com",
    "role": "ADMIN",
    "contact": "+919876543210"
  }
}
```

Possible errors: `400` invalid fields, empty body, email not allowlisted, or duplicate email; `401` missing/invalid token; `403` non-admin; `404` admin not found; `500` update failed.

## Quiz API

All `/api/quizzes` routes require authentication. Admin quiz routes additionally require `ADMIN`.

### POST /api/quizzes/admin/quizzes

Creates a draft quiz owned by the current admin.

Auth: `ADMIN`.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `title` | string | Yes | 2-200 chars. |
| `description` | string | No | Max 1000 chars. |

```bash
curl -X POST http://localhost:5000/api/quizzes/admin/quizzes \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"title":"BuildX Basics","description":"Intro quiz"}'
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "id": "quiz-uuid",
    "title": "BuildX Basics",
    "status": "DRAFT"
  }
}
```

Possible errors: `400` validation failed, `401` missing/invalid token, `403` non-admin, `500` failed to create quiz.

### GET /api/quizzes/admin/quizzes

Lists quizzes created by the current admin, including questions, options, and sessions.

Auth: `ADMIN`.

```bash
curl http://localhost:5000/api/quizzes/admin/quizzes -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "quiz-uuid",
      "title": "BuildX Basics",
      "questions": [],
      "sessions": []
    }
  ]
}
```

Possible errors: `401` missing/invalid token, `403` non-admin.

### POST /api/quizzes/admin/quizzes/:id/questions

Adds a question to the current admin's own draft quiz.

Auth: `ADMIN`.

URL params: `id` must be a quiz UUID.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `text` | string | Yes | 1-1000 chars. |
| `options` | array | Yes | 2-10 options. At least one option must have `isCorrect: true`. |
| `options[].text` | string | Yes | 1-500 chars. |
| `options[].isCorrect` | boolean | Yes | Supports single or multiple correct answers. |

```bash
curl -X POST http://localhost:5000/api/quizzes/admin/quizzes/QUIZ_UUID/questions \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{
    "text":"Which storage provider is used for payment slips?",
    "options":[
      {"text":"Cloudinary","isCorrect":false},
      {"text":"Supabase Storage","isCorrect":true}
    ]
  }'
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "id": "question-uuid",
    "text": "Which storage provider is used for payment slips?",
    "order": 1,
    "options": [
      {
        "id": "option-uuid",
        "text": "Supabase Storage",
        "isCorrect": true,
        "order": 2
      }
    ]
  }
}
```

Possible errors: `400` invalid UUID/body, `401` missing/invalid token, `403` non-admin, `404` draft quiz not found, `500` failed to add question.

### PATCH /api/quizzes/admin/quizzes/:id/finalize

Finalizes a quiz and makes it ready for session creation.

Auth: `ADMIN`.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `durationMinutes` | number | Yes | Integer, 1-240. |
| `leaderboardDisplayLimit` | number | Yes | Integer, 1-100. |

```bash
curl -X PATCH http://localhost:5000/api/quizzes/admin/quizzes/QUIZ_UUID/finalize \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"durationMinutes":20,"leaderboardDisplayLimit":10}'
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "quiz-uuid",
    "status": "READY",
    "durationMinutes": 20,
    "leaderboardDisplayLimit": 10
  }
}
```

Possible errors: `400` validation failed, `401` missing/invalid token, `403` non-admin, `404` quiz not found or has no questions, `500` failed to finalize quiz.

### POST /api/quizzes/admin/sessions

Creates a waiting room/session for a ready quiz and generates a unique join code.

Auth: `ADMIN`.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `quizId` | string | Yes | UUID of an admin-owned `READY` quiz. |
| `allowLateJoin` | boolean | No | Defaults to `false`. If false, users cannot join after start. |

```bash
curl -X POST http://localhost:5000/api/quizzes/admin/sessions \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{"quizId":"QUIZ_UUID","allowLateJoin":false}'
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "joinCode": "A1B2C3D4",
    "status": "WAITING",
    "durationMinutes": 20,
    "leaderboardDisplayLimit": 10
  }
}
```

Possible errors: `400` invalid input, quiz not ready, or quiz not owned by admin; `401` missing/invalid token; `403` non-admin.

### POST /api/quizzes/sessions/join

Joins a quiz waiting room or, when allowed, a running session by join code. Users must be verified. Admins may also participate because the route is available to any authenticated account.

Auth: authenticated.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `joinCode` | string | Yes | 4-12 chars. Converted to uppercase. |

```bash
curl -X POST http://localhost:5000/api/quizzes/sessions/join \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"joinCode":"A1B2C3D4"}'
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "participantSessionId": "participant-session-uuid",
    "status": "JOINED"
  }
}
```

Possible errors: `400` invalid join code, session ended, late join not allowed, or account not verified; `401` missing/invalid token.

### PATCH /api/quizzes/admin/sessions/:id/start

Starts a waiting quiz session. Server time is the source of truth. The service sets `startedAt`, computes `endsAt`, moves joined participants to `TAKING`, schedules expiration, and emits `quiz:started`.

Auth: admin host.

```bash
curl -X PATCH http://localhost:5000/api/quizzes/admin/sessions/SESSION_UUID/start \
  -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "status": "RUNNING",
    "startedAt": "2026-06-08T10:00:00.000Z",
    "endsAt": "2026-06-08T10:20:00.000Z"
  }
}
```

Possible errors: `400` invalid UUID, not host, or session not waiting; `401` missing/invalid token; `403` non-admin.

### GET /api/quizzes/sessions/:id

Gets session state for a participant or the host admin.

Auth: session participant or host admin.

```bash
curl http://localhost:5000/api/quizzes/sessions/SESSION_UUID -b cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "status": "RUNNING",
    "joinCode": "A1B2C3D4",
    "participants": [],
    "quiz": {
      "id": "quiz-uuid",
      "title": "BuildX Basics",
      "questions": []
    }
  }
}
```

Possible errors: `400` invalid UUID, `401` missing/invalid token, `403` forbidden.

### POST /api/quizzes/sessions/:id/submit

Submits quiz answers for the current participant. Duplicate submissions are rejected by service logic. Scores are calculated server-side.

Auth: session participant.

Body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `answers` | array | Yes | Array of answer objects. |
| `answers[].questionId` | string | Yes | UUID. |
| `answers[].selectedOptionIds` | string[] | Yes | UUID array, max 10 options per question. |

```bash
curl -X POST http://localhost:5000/api/quizzes/sessions/SESSION_UUID/submit \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "answers": [
      {
        "questionId": "QUESTION_UUID",
        "selectedOptionIds": ["OPTION_UUID"]
      }
    ]
  }'
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "participantSessionId": "participant-session-uuid",
    "submittedAt": "2026-06-08T10:05:00.000Z"
  }
}
```

Possible errors: `400` invalid body, session not running, duplicate submission, not a participant, or time expired; `401` missing/invalid token.

### PATCH /api/quizzes/admin/sessions/:id/end

Manually ends a running quiz session, auto-submits remaining participants, calculates results, and publishes the leaderboard.

Auth: admin host.

```bash
curl -X PATCH http://localhost:5000/api/quizzes/admin/sessions/SESSION_UUID/end \
  -b admin-cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "score": 8,
      "totalQuestions": 10,
      "percentage": 80,
      "submittedAt": "2026-06-08T10:05:00.000Z",
      "user": {
        "id": "user-uuid",
        "name": "Riya Sharma"
      }
    }
  ]
}
```

Possible errors: `400` invalid UUID, not host, or service error; `401` missing/invalid token; `403` non-admin.

### GET /api/quizzes/sessions/:id/leaderboard

Returns the calculated leaderboard for a session. Ranking is score descending, then earliest submission time.

Auth: session participant or host admin.

```bash
curl http://localhost:5000/api/quizzes/sessions/SESSION_UUID/leaderboard -b cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "score": 8,
      "totalQuestions": 10,
      "percentage": 80,
      "submittedAt": "2026-06-08T10:05:00.000Z"
    }
  ]
}
```

Possible errors: `400` invalid UUID, `401` missing/invalid token, `403` forbidden.

### GET /api/quizzes/history/me

Returns the current user's historical quiz results.

Auth: authenticated.

```bash
curl http://localhost:5000/api/quizzes/history/me -b cookies.txt
```

Success `200`:

```json
{
  "success": true,
  "data": [
    {
      "quizId": "quiz-uuid",
      "score": 8,
      "totalQuestions": 10,
      "percentage": 80,
      "rank": 1,
      "submittedAt": "2026-06-08T10:05:00.000Z",
      "durationSeconds": 300
    }
  ]
}
```

Possible errors: `401` missing/invalid token.

## File Uploads

The only implemented upload field is `paymentReceipt`.

| Setting | Value |
| --- | --- |
| Middleware | `paymentReceiptUpload` |
| Multer storage | Memory storage |
| Field name | `paymentReceipt` |
| Max files | 1 |
| Max file size | 5 MB |
| Allowed MIME types | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| Storage bucket | `payment-slips` |
| Storage utility | `src/utils/upload.util.ts` |

Frontend upload requirements:

```ts
const form = new FormData();
form.append("name", "Riya Sharma");
form.append("email", "riya@example.com");
form.append("password", "Password123");
form.append("contact", "9876543210");
form.append("institution", "BuildX University");
form.append("submittedAmount", "499");
form.append("paymentReceipt", file);

await fetch(`${API_URL}/api/auth/register`, {
  method: "POST",
  body: form,
  credentials: "include",
});
```

Do not set `Content-Type` manually for `FormData`; the browser must set the multipart boundary.

## Socket.IO Events

Socket.IO is configured in `src/socket.ts`. The server authenticates the socket connection with the same JWT used by REST.

Client connection examples:

```ts
import { io } from "socket.io-client";

const socket = io(API_URL, {
  withCredentials: true,
  auth: {
    token,
  },
});
```

### Client to Server

| Event | Payload | Description |
| --- | --- | --- |
| `quiz:join-room` | `{ "sessionId": "uuid" }` | Join the isolated Socket.IO room for a quiz session. Requires participant or host admin access. |
| `quiz:leave-room` | `{ "sessionId": "uuid" }` | Leave the quiz session room and notify others. |

### Server to Client

| Event | Payload | Emitted when |
| --- | --- | --- |
| `quiz:room-joined` | `{ "sessionId": "uuid" }` | Socket successfully joins a quiz room. |
| `quiz:error` | `{ "message": "Forbidden" }` | Socket auth/access/action fails. |
| `participant:joined` | Session/user payload from service | A participant joins the session. |
| `participant:left` | `{ "sessionId": "uuid", "userId": "uuid" }` | A socket leaves/disconnects from the room. |
| `participant:submitted` | Submission payload from service | A participant submits. |
| `participant:status-updated` | Session state payload | Waiting room or completion lobby participant state changes. |
| `quiz:started` | Session timing payload | Host starts the quiz. |
| `quiz:ended` | End payload from service | Session ends manually, by timer, or after all submit. |
| `leaderboard:published` | Leaderboard array | Final leaderboard is available. |

Room names are generated as:

```text
quiz-session:{sessionId}
```

Multiple quiz sessions are isolated by separate Socket.IO rooms.

## Rate Limiting

Configured in `src/app.ts`.

| Limiter | Scope | Window | Max | Notes |
| --- | --- | --- | --- | --- |
| Global limiter | All routes | 15 minutes | 200 requests/IP | Returns `RATE_LIMIT_EXCEEDED`. |
| Auth limiter | `/api/auth/*` | 15 minutes | 10 failed attempts/IP | `skipSuccessfulRequests: true`, returns `AUTH_RATE_LIMIT_EXCEEDED`. |

Rate limit response:

```json
{
  "success": false,
  "message": "Too many requests from this IP. Please try again after 15 minutes.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## Error Handling

The central error middleware handles:

- Unknown routes: `404`.
- Multer upload errors: `400`.
- Invalid image upload errors: `400`.
- Unhandled errors: logs `UNHANDLED_ERROR` and returns `500`.

Common error shapes:

```json
{
  "success": false,
  "message": "Route GET /unknown not found"
}
```

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Authentication middleware errors:

```json
{
  "message": "Unauthorized"
}
```

```json
{
  "message": "Invalid jwt token"
}
```

Authorization error:

```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

## Testing and Quality Checks

The repository currently includes build/type-check scripts but no dedicated test suite was found.

Run:

```bash
yarn type-check
yarn build
```

Recommended additions before production:

- Unit tests for validators and services.
- Integration tests for auth, payment verification, admin actions, and quiz flows.
- Socket.IO integration tests for room isolation and event delivery.
- Upload tests for file type/size rejection and Supabase upload failures.
- Database transaction tests for payment approval/rejection and quiz result ranking.

## Deployment

Recommended production flow:

1. Provision Supabase Postgres and Storage.
2. Set all required environment variables.
3. Create the `payment-slips` bucket.
4. Install dependencies:

```bash
yarn install --frozen-lockfile
```

5. Generate Prisma client and apply migrations:

```bash
yarn prisma:generate
npx prisma migrate deploy
```

6. Build and start:

```bash
yarn build
yarn start
```

Production notes:

- Use HTTPS in production so secure cookies work correctly.
- Set `NODE_ENV=production`.
- Set `FRONTEND_ORIGIN` to the exact frontend origin.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Rotate `JWT_SECRET` carefully; rotating it invalidates existing sessions.
- Use a process manager or platform with restart policies.
- The current Socket.IO implementation uses the default in-memory adapter. For multiple API instances, add a Redis Socket.IO adapter.
- Quiz timers are scheduled in process memory and resumed at startup from running sessions. For high-scale or multi-instance deployments, use a durable job scheduler or distributed lock.

## Full Workflow Examples

### User Registration and Payment Approval

1. User registers with details and one `paymentReceipt` file through `POST /api/auth/register`.
2. API uploads the receipt to Supabase Storage and creates:
   - `User.status = PENDING`
   - `PaymentVerification.status = PENDING`
3. User login is rejected until approval.
4. Admin logs in through `/api/auth/admin/login`.
5. Admin lists pending receipts through `/api/admin/payments/pending`.
6. Admin approves with `/api/admin/payments/:id/approve`.
7. API marks:
   - `PaymentVerification.status = APPROVED`
   - `User.status = VERIFIED`
8. User can now login through `/api/auth/login`.

### Rejected Payment Resubmission

1. Admin rejects payment through `/api/admin/payments/:id/reject`.
2. User status becomes `REJECTED`.
3. User calls `/api/auth/register` again with the same email, same correct password, updated details, and a new `paymentReceipt`.
4. API upserts payment verification back to `PENDING`.

### Quiz Flow

1. Admin creates quiz: `POST /api/quizzes/admin/quizzes`.
2. Admin adds questions: `POST /api/quizzes/admin/quizzes/:id/questions`.
3. Admin finalizes quiz: `PATCH /api/quizzes/admin/quizzes/:id/finalize`.
4. Admin creates session: `POST /api/quizzes/admin/sessions`.
5. Participants join by code: `POST /api/quizzes/sessions/join`.
6. Clients join Socket.IO room with `quiz:join-room`.
7. Admin starts session: `PATCH /api/quizzes/admin/sessions/:id/start`.
8. Participants submit: `POST /api/quizzes/sessions/:id/submit`.
9. Session ends when all submit, timer expires, or admin ends it.
10. Leaderboard is emitted with `leaderboard:published` and available through `/api/quizzes/sessions/:id/leaderboard`.

## Troubleshooting

| Problem | Likely Cause | Fix |
| --- | --- | --- |
| Server throws `JWT_SECRET is not defined` | Missing `JWT_SECRET`. | Add a strong `JWT_SECRET` to `.env`. |
| Server throws Supabase env error | Missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`. | Add Supabase env values. |
| Payment upload returns storage error | Bucket missing, bucket not accessible, or service role key invalid. | Create `payment-slips`, verify policies and key. |
| Receipt URL is not viewable | Bucket is private while API returns public URL. | Make bucket public or change implementation to signed URLs. |
| User cannot login after registration | Account is still `PENDING`. | Admin must approve payment. |
| Rejected user cannot resubmit | Password does not match existing rejected account. | Use the same password originally registered. |
| Admin registration fails | Email not in `ADMIN_EMAILS` or wrong default password. | Update `.env` or use the correct bootstrap password. |
| Socket connection unauthorized | Missing token in cookie, auth payload, or bearer header. | Pass JWT using `auth.token`, cookies, or `Authorization`. |
| Quiz participants do not receive events in multi-instance deployment | Default Socket.IO adapter is in-memory. | Add Redis adapter and shared deployment configuration. |
| Prisma migration fails against Supabase pooler | Migrations need direct connection. | Set `DIRECT_URL` to the direct Supabase database URL. |

## Contribution Guide

1. Create a feature branch.
2. Keep controllers thin and move business logic into services when behavior spans multiple database writes or realtime events.
3. Add or update Zod validators for every new request shape.
4. Keep auth custom in Express; do not add Supabase Auth unless the architecture changes intentionally.
5. Do not expose password hashes, JWT secrets, or Supabase service role keys.
6. Prefer Prisma transactions for multi-step writes.
7. Run checks before opening a PR:

```bash
yarn type-check
yarn build
```

8. Document every new endpoint in this README with method, route, auth, validation, cURL, success response, and errors.
