# Auth Module Audit Report

## Overview
This report documents the current state of the authentication module (both client‑side React code and server‑side Node/Express code), identifies gaps, edge‑cases, and silent‑failure risks, and proposes a phased plan for remediation.

---

## 1️⃣ Findings – Client Side (React / Zustand)
| Issue | Expected Behaviour | Current Behaviour / Gap | Impact |
|-------|-------------------|------------------------|--------|
| **Permission fetch after login** | Load effective permissions and populate store. | Wrapped in a silent `try…catch`; on error nothing is shown and the UI falls back to static defaults without informing the user. | Users may lose functionality silently.
| **Login error handling** | Show specific messages (e.g., *account locked*, *invalid credentials*). | All errors other than 429 are mapped to a generic *Invalid email or password* message. Locked accounts are indistinguishable. | Users cannot understand why login failed.
| **Session timeout** | Auto‑logout after 30 min inactivity and clear persisted state. | Timer clears the in‑memory store but **does not clear the persisted `hrms-auth` slice**. After a page refresh a stale session may appear briefly logged‑in. | Brief “ghost” sessions and possible UI glitches.
| **Axios interceptor token refresh** | Refresh JWT on 401, store new token and keep the current user. | When the store is empty (e.g., after manual logout) the interceptor stores a new token but `login` expects a user object, causing a silent logout loop. | Unexpected logout loops.
| **Demo‑credentials test** | Test should reflect UI; currently the UI never renders “Demo credentials”. | The test passes because it uses a mock that does not verify the rendered output. | Stale test → false confidence.
| **Role‑based navigation** | Direct user to the appropriate landing page based on role. | Navigation logic assumes only roles present in `ROLES` are back‑office; new roles may be mis‑routed. | Users may land on the wrong page.

---

## 2️⃣ Findings – Server Side (Node / Express)
| Issue | Expected Behaviour | Current Behaviour / Gap | Impact |
|-------|-------------------|------------------------|--------|
| **Account lockout** | After 5 failed attempts lock the account for 15 min and inform the user. | Returns generic 401 *Invalid email or password*; no notification. | Users and admins cannot tell an account is locked.
| **Forgot‑password email** | Send reset email, handle SMTP failures. | No `try/catch` around `EmailService.send`; on failure the client sees a generic *Failed to send reset email*. | Silent email‑service failures.
| **Multiple reset tokens** | Only the latest token should be valid (or all should be revocable). | All generated tokens remain usable until used or expired. | An attacker could use any previously generated token.
| **Refresh‑token rotation** | New refresh token replaces old one; old token is invalidated. | Old refresh token is **not** blacklisted, leaving a brief replay window. | Possibility of token replay attacks.
| **Force‑change‑password** | Must revoke the current JWT when the password is changed on first login. | Does **not** blacklist the current JWT; the old token stays valid until expiry. | Compromised token can still be used.
| **Logout audit** | Record logout events. | No audit log entry is created in `auth.controller.logout`. | Missing forensic trail.
| **Token blacklist reliability** | Ensure revoked tokens cannot be used even if Redis is down. | `TokenBlacklist` assumes Redis is always available; errors bubble up and are turned into a generic *Invalid token* response. | Revoked tokens may stay usable.
| **Authenticate middleware error masking** | Distinguish between expired, revoked, malformed tokens. | All errors are caught and turned into `AppError('Invalid token')`. | Clients cannot know the exact cause; debugging is harder.
| **Rate‑limit granularity** | Throttle abusive IPs while allowing legitimate shared‑IP users. | Fixed per‑IP limits (10 logins / 15 min, 5 password resets / hour) can lock out all users behind a NAT. | Service denial for legitimate users.

---

## 3️⃣ Prioritization
| Priority | Reason |
|----------|--------|
| **Critical** | Issues that expose the system to unauthorized access or cause user lockout without feedback (locked‑account errors, email failures, token replay windows, audit gaps). |
| **High** | Problems that degrade security or user experience but have work‑arounds (multiple reset tokens, forced‑password JWT reuse, rate‑limit over‑blocking). |
| **Medium** | Enhancements that improve reliability, maintainability, and UI polish (dynamic password policy, clearer navigation, session‑timeout UI hints). |
| **Low** | Documentation, test cleanup, minor UI tweaks. |

---

## 4️⃣ Remediation Phases
### Phase 2 – High‑Priority Fixes (Weeks 3‑4)
1. **Invalidate all other reset tokens after a successful reset** – in `resetPassword`, mark all unused tokens for the user as `used:true`.
2. **Revoke current JWT on forced password change** – after `forceChangePassword`, add the current JWT to the blacklist.
3. **Blacklist old refresh token on rotation** – delete the previous refresh token from the DB before saving the new one.
4. **Improve permission‑fetch error UI** – surface errors with a toast (e.g., *Failed to load permissions, using defaults*).
5. **Rate‑limit refinement** – combine per‑IP and per‑username counters to avoid blocking legitimate users behind shared IPs.
6. **Refresh‑token failure UX** – on interceptor failure, show a toast *Your session expired, please log in again* before redirect.

### Phase 3 – Medium‑Priority Fixes (Weeks 5‑6)
1. **Dynamic password‑policy endpoint** – create `/auth/policy` that returns the current settings; rebuild Zod schemas from this data and update UI hints.
2. **Update `apiClient` interceptor** – if the store has no user after a refresh, force a full logout with a visible message.
3. **Remove/Update stale demo‑credentials test** – delete the obsolete expectation and add a test that asserts the credentials hint only when it is present.
4. **Navigation fallback for unknown roles** – if `user.role` is not in `ROLES`, default to `/dashboard`.
5. **Add session‑timeout warning UI** – show a banner when the timeout is within 2 minutes.
6. **Add unit tests** for locked‑account handling, email‑service failures, token blacklist failures, and multiple reset‑token scenarios.

### Phase 4 – Low‑Priority / Polish (Weeks 7‑8)
1. **Documentation** – add a markdown page (this report) to the project wiki with the authentication flow, error codes, and remediation steps.
2. **Consolidate auth constants** – move cookie names, expiry defaults, and storage keys to a shared config file.
3. **Third‑party‑cookie handling** – detect if cookies are blocked and prompt the user to enable them.
4. **TypeScript typings** – tighten types for auth store, API responses, and JWT payloads.
5. **UI polish** – improve the look of error toasts, add a “Demo credentials” panel only in demo mode, and ensure accessibility attributes.

---

## 5️⃣ Timeline (Suggested)
| Week | Deliverable |
|------|-------------|
| 1‑2 | All Phase 1 items implemented, QA passed, PR merged. |
| 3‑4 | Phase 2 items completed, integration tests added, monitoring for token revocation verified. |
| 5‑6 | Phase 3 items deployed, new unit tests run in CI, UI enhancements verified. |
| 7‑8 | Phase 4 documentation and polishing, final sign‑off. |

---

## 6️⃣ Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| **Redis outage** – blacklist may fail. | On Redis error, force logout and log an alert; optionally fall back to an in‑memory blacklist for the current request. |
| **Breaking existing clients** – new error codes may be unhandled. | Version the auth endpoints (`/v1/auth/*`) and keep backward‑compatible responses for one release cycle. |
| **User confusion from new messages** – sudden appearance of “Account locked” may alarm users. | Update help‑center articles and add inline guidance on unlocking via admin. |
| **Concurrent token refresh race** – multiple refreshes may generate duplicate tokens. | Ensure `isRefreshing` flag is atomic (already in place) and that the old refresh token is invalidated before issuing the new one. |
| **In‑flight requests when session times out** – abrupt redirect may abort pending actions. | Show a modal warning *Your session is about to expire* and give the user a chance to extend. |

---

### Conclusion
Addressing the critical and high‑priority items first will close the most severe security gaps (locked‑account feedback, token replay windows, audit missing entries). Subsequent phases will improve reliability, observability, and developer confidence through better testing and documentation. Follow the outlined timeline to roll out changes in a controlled, incremental fashion.
