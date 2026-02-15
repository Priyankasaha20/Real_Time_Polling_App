# 🗳️ PollSafe

<p align="center">
  <b>Reliability-first, anti-abuse, real-time polling.</b><br/>
  Built to keep voting fast, fair, and observable.
</p>

---

## 🎯 Mission

PollSafe is designed around one core goal:

> **Reliable live polling with practical anti-abuse protection.**

Most polling apps optimize for speed but break under abuse. PollSafe raises abuse cost with layered controls while preserving a clean voting experience.

---

## ✨ Current Product Snapshot

- ⚡ **Live updates** for all viewers via Socket.IO
- 🧑 **Anonymous voting with required name** (name visible to poll creator)
- 🔐 **Authenticated one-vote-per-user** checks
- 🛡️ **Per-device rate limiting** with retry countdown support
- 👀 **Poll creator participant view** (who voted + option + time)
- 🗑️ **Delete previously created polls** from "My Polls"
- 🌐 **Proxy-aware backend** (`trust proxy`) for production reliability

---

## 🧱 Tech Stack

### Frontend

- Next.js 16
- React 19
- Tailwind CSS
- Socket.IO client

### Backend

- Node.js + Express
- Prisma + PostgreSQL
- Socket.IO
- JWT (HTTP-only cookie auth)

---

## 🛡️ Anti-Abuse Design (Implemented)

PollSafe applies checks server-side (never trusting frontend alone).

### 1) Device Rate Limit (Universal)

- Rule: **max 2 votes per poll per device fingerprint per hour**
- Applies to both anonymous and authenticated flows
- Includes `retryAfterSeconds` for UX feedback

### 2) Authenticated Identity Lock

- Rule: **one vote per user per poll**
- Enforced by route checks + DB uniqueness

### 3) Anonymous Identity Lock

- Anonymous vote key uses fingerprint (`anonymousKey`), scoped per poll
- Prevents repeated anonymous votes from same device/browser identity

### 4) API Rate Limits

- Global limiter
- Auth limiter
- Vote limiter

### 5) Socket Abuse Controls

- Connection attempt throttling
- Room join/leave event throttling

### 6) Private Poll Access Guard

- Unauthorized users receive not-found behavior for private polls

### 7) Transaction + Race Safety

- Vote create + option increment in a single DB transaction
- Unique-constraint conflict path handled

---

## 📊 Control Map

| Control            | Prevents                                 | Reliability Benefit           |
| ------------------ | ---------------------------------------- | ----------------------------- |
| Device hourly cap  | Fast repeat voting from same environment | Stabilizes vote endpoint load |
| Auth uniqueness    | Account self-repeat voting               | Predictable tally integrity   |
| Anonymous key lock | Repeat anonymous voting per device       | Fair anonymous participation  |
| API limiters       | Burst abuse / spam                       | Protects backend resources    |
| Socket throttles   | Room event flooding                      | Keeps live updates healthy    |
| Private poll guard | Unauthorized poll discovery              | Reduces data leakage          |

---

## ⚙️ Reliability Notes

- Poll result source of truth is database-backed
- Live updates are room-scoped by poll ID
- Backend is proxy-aware (`app.set("trust proxy", 1)`) for accurate production IP behavior
- Frontend socket endpoint supports:
  - `NEXT_PUBLIC_SOCKET_URL` override, or
  - same-origin fallback in production

---

## 🧭 Current Limitations

No public-internet anti-abuse strategy is perfect. Current tradeoffs:

1. Sophisticated adversaries can distribute attacks across many devices/networks
2. Anonymous mode is inherently weaker than strong identity verification
3. There is no CAPTCHA/challenge step yet
4. No behavioral anomaly/risk model yet

---

## 📁 Project Structure

```text
poll-app/
├─ backend/
│  ├─ prisma/
│  └─ src/
│     ├─ routes/
│     ├─ middleware/
│     ├─ socket.ts
│     └─ index.ts
├─ frontend/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     └─ lib/
└─ docker-compose.yml
```

---

## 🔧 Environment

Use `.env.example` as base:

```env
DATABASE_URL="postgresql://pollsafe:pollsafe123@localhost:54320/pollsafe?schema=public"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
PORT=5000
NODE_ENV="development"
```

Frontend (optional when frontend/backend differ by origin):

```env
NEXT_PUBLIC_SOCKET_URL="https://api.your-domain.com"
```

---

## 🚀 Local Setup

### 1) Start Postgres

```bash
docker compose up -d
```

### 2) Backend

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

---

## 📦 Production Deploy (Backend)

From `backend/`:

```bash
npm run deploy:prod
```

Pipeline:

1. `npm ci`
2. `prisma generate`
3. `npm run build`
4. `prisma migrate deploy`
5. PM2 restart/start

---

## 🔭 Suggested Next Hardening

1. Add CAPTCHA/challenge for suspicious anonymous traffic
2. Add risk scoring (velocity + IP reputation + ASN heuristics)
3. Add verified-voter mode (email/phone)
4. Add append-only audit trail for vote decisions
5. Add abuse/admin observability dashboard

---

## 🧡 Final Note

PollSafe focuses on **practical reliability and anti-abuse**: not perfect identity, but layered controls that keep results trustworthy and the realtime experience smooth.
