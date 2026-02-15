# PollSafe

A real-time polling platform designed around one idea: **fast voting should still be fair voting**.

PollSafe supports both anonymous and authenticated participants, then applies layered abuse controls to reduce vote stuffing while keeping the user experience simple.

---

## Why This Project Exists

Most polling apps optimize for speed and ignore abuse. That usually works until a poll matters and someone scripts votes from one machine, one account farm, or one IP block. PollSafe is built to keep the "one person, one meaningful vote" spirit as close as possible in an open internet environment.

This project does not claim perfect Sybil resistance (nothing on the public web can, without very strong identity), but it **raises attack cost significantly** with practical controls that still allow normal users to vote quickly.

---

## What PollSafe Protects Against

### Threats we actively reduce

- **Repeat voting from the same laptop/browser** in short windows
- **Simple account-farm amplification** from one machine
- **Anonymous multi-vote attempts** from the same network/device signature
- **Request spamming** on auth and vote endpoints
- **Socket event flooding** that can degrade real-time update reliability
- **Private poll ID guessing/exposure** by unauthorized users

### Threats that are harder (partially mitigated)

- Coordinated attacks from many devices/networks
- User-agent spoofing by skilled attackers
- Residential proxy + botnet style distribution

---

## Fairness Controls (Current Implementation)

PollSafe uses layered checks in backend vote logic, rather than trusting client-provided fields.

### 1) Universal Device Rate Limit (everyone)

For each poll, a server-derived `deviceFingerprint` is computed from IP + User-Agent hash. If that identity already voted too frequently in the recent window, voting is blocked.

- Rule: **Max 2 votes per device fingerprint per poll per hour**
- Purpose: throttle rapid repeat voting from one environment
- Benefit: affects both anonymous and logged-in users equally

### 2) Authenticated Identity Lock

If a user is logged in, PollSafe checks whether that `userId` has already voted in that poll.

- Rule: one vote per authenticated user per poll
- Purpose: stop account owner self-repeat voting
- Backed by DB uniqueness and route-level checks

### 3) Anonymous Identity Lock

For anonymous users, PollSafe checks existing anonymous votes by poll using either:

- hashed IP identity (`ipHash`), or
- server-derived `deviceFingerprint`

If either matches, anonymous re-voting is rejected.

### 4) Endpoint Rate Limits (anti-spam)

Backend uses route-level request limiting:

- global API limiter
- stricter auth limiter
- vote route limiter

This reduces brute-force and burst abuse before business logic is even reached.

### 5) Socket Abuse Controls (reliability + abuse)

Socket connections and room join/leave actions are throttled server-side.

- helps prevent room-event storms
- protects live updates from noisy clients

### 6) Private Poll Access Protection

Non-public polls return not found to unauthorized users.

- prevents direct ID-based private poll access
- avoids leaking private poll existence details

### 7) Transaction + Race Safety

Vote write + option count increment run in a transaction, with unique-constraint conflict handling to catch concurrent race attempts.

---

## What Each Control Prevents (Quick Map)

| Control                        | Primary Abuse Prevented        | Secondary Benefit                 |
| ------------------------------ | ------------------------------ | --------------------------------- |
| Device hourly cap              | rapid local vote stuffing      | smooths load spikes               |
| Auth vote uniqueness           | repeat votes from same account | deterministic auditability        |
| Anonymous OR check (IP/device) | repeat anonymous voting        | preserves anonymous participation |
| API rate limits                | endpoint spam, brute-force     | backend stability                 |
| Socket throttling              | real-time channel flooding     | better live UX under load         |
| Private poll guard             | unauthorized poll visibility   | reduces metadata leakage          |

---

## Known Limitations (Important)

No fairness system on the open internet is perfect. These are current limitations and tradeoffs:

1. **Shared networks can create false positives**
   - If many users share one NAT/public IP and similar browser signatures, strict anonymous controls may block legitimate additional votes.

2. **Sophisticated spoofing remains possible**
   - Advanced attackers can rotate user-agent strings, distribute traffic, and vary network paths.

3. **Anonymous mode is always weaker than verified identity**
   - Anonymous voting balances privacy and fairness, but cannot guarantee uniqueness at human level.

4. **No challenge/attestation layer yet**
   - There is currently no CAPTCHA, device attestation, or reputation-based trust scoring.

5. **No geovelocity/behavioral anomaly model yet**
   - PollSafe currently uses deterministic rules, not ML anomaly detection.

---

## Edge Cases (Story Form)

Two siblings share one laptop for dinner-table voting. One votes anonymously first, then the other logs in and tries to vote from the same machine. The first vote succeeds, the second can still pass if it is a distinct authenticated identity and policy allows it, but repeated rapid attempts from that same environment quickly hit the universal device window cap.

A student opens incognito, normal mode, and a second browser tab to cast multiple anonymous votes in a class poll. The first vote lands, but subsequent anonymous attempts from the same network/device signature are blocked by the anonymous identity checks. If they try to hammer requests quickly, vote route rate limits and endpoint guards start rejecting bursts.

A script kiddie writes a loop to spam `/api/votes/:pollId` 200 times in a minute. Most requests get cut by API/vote rate limiting before deeper business logic executes. Any race that slips through still faces transactional consistency and unique-constraint conflict handling, keeping final tallies stable.

Someone discovers a private poll URL pattern and starts guessing IDs. They can call endpoints, but private poll reads for non-owners return not found, so private poll content and existence are not exposed through normal API responses.

During a live event, one misbehaving client repeatedly joins and leaves socket rooms to create noise. Socket room-action throttles reduce churn, helping keep result broadcasts useful for real participants instead of drowning the channel in connection/event spam.

---

## Reliability Practices in Place

- database-backed vote records (source of truth)
- transactional vote-write + count update
- explicit status/reason responses for blocked actions
- backend health endpoint
- WebSocket room scoping for targeted real-time updates
- environment-based secure cookie behavior

---

## Recommended Next Hardening Steps

If fairness needs to be stricter for high-stakes polls, prioritize:

1. Add CAPTCHA/challenge for suspicious anonymous traffic
2. Add risk scoring (IP reputation + velocity + ASN heuristics)
3. Add stronger identity tier (email/phone verified voting mode)
4. Add append-only audit log for vote decision traces
5. Add admin abuse dashboard with lock/ban controls

---

## Project Structure

- `backend/` — Express + Prisma + Socket.io
- `frontend/` — Next.js app
- `docker-compose.yml` — local PostgreSQL container

---

## Local Setup (Quick)

1. Start DB: `docker compose up -d`
2. Backend:
   - `cd backend`
   - `npm install`
   - `npm run db:generate`
   - `npm run db:migrate -- --name init`
   - `npm run dev`
3. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

App: `http://localhost:3000`

---

## Final Note

PollSafe is built around **practical fairness**: not "perfect identity", but layered controls that make abuse expensive and visible while keeping normal voting fluid.
