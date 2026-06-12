# Authentication – End‑User Guide

---

## 2. Access & Permissions
| Action | Required permission |
|--------|----------------------|
| Login / logout / token refresh | Public (no permission) |
| Change password (self) | `view-users` (any logged‑in user) |
| Force password change (admin) | `manage-users` |
| Forgot / reset password | Public |
| Unlock account | `manage-users` |
| View audit logs related to auth | `view-audit` |

If you lack a permission, the corresponding UI options are hidden and API calls will return **403 Unauthorized**.

---

## 3. Related Settings
The authentication flow reads the following **CompanySettings** fields:
- **authConfig.tokenExpiry** – default `24h`; controls access‑token lifetime.
- **authConfig.refreshTokenExpiry** – default `7d`; controls refresh‑token lifetime.
- **authConfig.passwordHistoryCount** – number of previous passwords that cannot be reused (default 5).
- **authConfig.passwordMinLength**, **requireUppercase**, **requireLowercase**, **requireNumber**, **requireSpecialChar** – enforce password complexity.

These settings are editable in the **Settings → Authentication** section. Changes take effect immediately for new login attempts.

---



Welcome! This guide explains everything you need to know as a regular user of the HRMS application.

---

## 1. Logging In
1. Open the HRMS login page (e.g., `https://hrms.example.com`).
2. Enter your **email address** and **password**.
   - Password must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number, and a special character (e.g., `!@#$%^&*`).
3. Click **Login**.
4. If the credentials are correct, you will be taken to the dashboard and stay logged in automatically.

> **What happens behind the scenes?**
> - The system creates a short‑lived access token (JWT) and a longer‑lived refresh token.
> - Both tokens are stored in secure HTTP‑only cookies, so you never see them.

---

## 2. Session Expiry & Automatic Refresh
- Your access token expires after the period set by your organization (default **24 hours**). 
- The application silently uses the refresh token to obtain a new access token, keeping you logged in without interruption.
- If the refresh token also expires (default **7 days**), you will be redirected to the login page and need to sign in again.

---

## 3. Logging Out
- **Standard logout:** Click the **Logout** button (usually in the top‑right menu). This clears the session cookies.
- **Logout from all devices:** If you see an option like **Logout from all devices**, selecting it will sign you out from every computer or phone where you are logged in.

---

## 4. Changing Your Password
### a) Normal password change
1. Navigate to **Profile → Change Password**.
2. Enter your **current password**.
3. Enter a **new password** that meets the complexity rules.
4. Confirm the new password and submit.
5. After a successful change you will be logged out; log in again with the new password.

### b) First‑login forced change
- If your account was created with a temporary password, you will be prompted to set a new password immediately after the first successful login.
- You do **not** need to enter the old (temporary) password; just provide a new one that meets the rules.

---

## 5. Forgotten Password
1. On the login page click **Forgot Password?**.
2. Enter the **email address** associated with your account and submit.
3. You will receive an email containing a **reset link** (valid for **1 hour**).
4. Click the link, set a new password (following the complexity rules), and confirm.
5. After resetting, you can log in with the new password. The old refresh token is invalidated for security.

---

## 6. Account Lockout (Too Many Failed Logins)
- After **5 consecutive failed login attempts**, your account is automatically locked for **15 minutes**.
- You will see a message indicating the account is locked.
- After the lock period expires you can try logging in again.

---

## 7. Security & Privacy Highlights
- **HTTP‑only cookies** protect your tokens from JavaScript‑based attacks.
- **Rate limiting:**
  - Maximum **10 login attempts** per 15 minutes per IP address.
  - Maximum **5 password‑reset requests** per hour per IP address.
- **Audit logging:** All login, logout, and password actions are recorded for compliance (you won’t see the logs, but they help administrators monitor activity).
- **Password history:** You cannot reuse any of your last **5** passwords.

---

## 8. Frequently Asked Questions
| Question | Answer |
|----------|--------|
| *I didn’t receive the password‑reset email.* | Check your spam/junk folder. If it’s still missing, contact HR or IT support. |
| *Why am I asked to change my password on first login?* | Your account was created with a temporary password; changing it ensures only you know the final password. |
| *Can I stay logged in forever?* | No. Access tokens expire after 24 hours and refresh tokens after 7 days. You’ll be asked to log in again after that. |
| *I’m on a shared computer – should I log out?* | Yes. Always click **Logout** when you finish to clear the session cookies. |
| *Who can unlock my account?* | Only administrators with the **manage‑users** permission can unlock a locked account. |

---

## 9. Need Help?
If you encounter any issues not covered here, please reach out to your HR or IT support team and provide the error message you see.

---

## 10. Workflow

A typical authentication flow for end‑users:

1. **Login** – Submit credentials to `/auth/login`; receive access and refresh tokens.
2. **Use the app** – Tokens are sent automatically in HTTP‑only cookies; pages request protected resources; server validates the access token.
3. **Token refresh** – When the access token expires, the client silently calls `/auth/refresh` using the refresh token to obtain a new access token.
4. **Password changes** – Follow the Change Password steps; after a successful change you are logged out and must log in again.
5. **Logout** – Click **Logout** (or **Logout from all devices**) to clear cookies and invalidate the refresh token.
6. **Forgot password / unlock** – Use the Forgot Password flow or have an admin unlock the account if locked.

All actions respect the permissions listed in the Access & Permissions table.



*This guide reflects the HRMS authentication behavior as of **2026‑06‑11**.*