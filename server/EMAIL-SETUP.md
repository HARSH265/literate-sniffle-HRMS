# Email Service — Setup & Configuration Guide

This guide explains how to configure and run the HRMS email service. Email is used for password reset links, salary slip notifications, leave approvals, and announcement alerts.

---

## Architecture

```
┌──────────────┐      SMTP       ┌──────────────┐      SMTP       ┌──────────────┐
│   HRMS App   │ ──────────────► │  SMTP Server  │ ──────────────► │   Recipient  │
│  (Nodemailer)│                 │  (Gmail/etc)  │                 │    Inbox     │
└──────────────┘                 └──────────────┘                 └──────────────┘
```

**Flow:**
1. HRMS triggers an email (e.g., password reset)
2. `EmailService.send()` picks up SMTP config from Vault
3. Nodemailer connects to your SMTP server and sends the message
4. Logs success/failure to Winston

---

## Prerequisites

| Requirement | Why |
|-------------|-----|
| SMTP server credentials | Gmail, Outlook, SendGrid, Mailgun, AWS SES, or any SMTP provider |
| Vault running (dev mode) | Secrets stored in Vault, not in `.env` |
| Redis running (optional) | For email queue if you add one later |

---

## Step 1: Choose an SMTP Provider

### Option A: Gmail (Quick Start — Development Only)

| Setting | Value |
|---------|-------|
| Host | `smtp.gmail.com` |
| Port | `465` (SSL) or `587` (TLS) |
| User | Your Gmail address (e.g., `you@gmail.com`) |
| Password | [App Password](https://myaccount.google.com/apppasswords) (NOT your regular password) |
| From | `you@gmail.com` |

> **Important:** Gmail blocks "less secure apps" by default. You MUST use an [App Password](https://myaccount.google.com/apppasswords) — go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail".

### Option B: Outlook / Microsoft 365

| Setting | Value |
|---------|-------|
| Host | `smtp.office365.com` |
| Port | `587` (TLS) |
| User | Your Outlook email |
| Password | Your password or app password |
| From | Your Outlook email |

### Option C: SendGrid (Recommended for Production)

| Setting | Value |
|---------|-------|
| Host | `smtp.sendgrid.net` |
| Port | `587` (TLS) |
| User | `apikey` (literal string) |
| Password | Your SendGrid API key |
| From | Your verified sender email |

### Option D: Mailgun

| Setting | Value |
|---------|-------|
| Host | `smtp.mailgun.org` |
| Port | `587` (TLS) |
| User | `postmaster@yourdomain.mailgun.org` |
| Password | Your Mailgun SMTP password |
| From | `noreply@yourdomain.com` |

### Option E: AWS SES

| Setting | Value |
|---------|-------|
| Host | `email-smtp.us-east-1.amazonaws.com` (varies by region) |
| Port | `465` (SSL) or `587` (TLS) |
| User | Your SMTP IAM access key |
| Password | Your SMTP IAM secret key |
| From | Your verified SES email/domain |

---

## Step 2: Store Secrets in Vault

Email credentials are stored in Vault under `secret/hrms`. The app reads them at startup via `VaultService`.

### Seed via Docker (Recommended)

```bash
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv put secret/hrms \
  EMAIL_HOST="smtp.gmail.com" \
  EMAIL_PORT="587" \
  EMAIL_USER="you@gmail.com" \
  EMAIL_PASSWORD="your-app-password-here" \
  EMAIL_FROM="you@gmail.com"
```

### Seed via CLI

```bash
export VAULT_ADDR='http://127.0.0.1:8200'
vault login root-token
vault kv put secret/hrms \
  EMAIL_HOST="smtp.gmail.com" \
  EMAIL_PORT="587" \
  EMAIL_USER="you@gmail.com" \
  EMAIL_PASSWORD="your-app-password-here" \
  EMAIL_FROM="you@gmail.com"
```

### Verify Secrets Are Stored

```bash
vault kv get -format=json secret/hrms | grep EMAIL
```

You should see:
```json
{
  "EMAIL_HOST": "smtp.gmail.com",
  "EMAIL_PORT": "587",
  "EMAIL_USER": "you@gmail.com",
  "EMAIL_PASSWORD": "your-app-password-here",
  "EMAIL_FROM": "you@gmail.com"
}
```

---

## Step 3: Restart the Server

After updating Vault secrets, restart the server:

```bash
cd server
npm run dev
```

The server will log:
```
Vault secrets loaded successfully
```

If email secrets are missing, the server logs a warning but continues (email features will be silently skipped).

---

## Step 4: Test Email Sending

### Via Settings UI

1. Go to **Settings → Email Configuration**
2. Fill in your SMTP details
3. Click **"Send Test Email"**
4. Check your inbox

### Via API

```bash
curl -X POST http://localhost:5000/api/v1/settings/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"email": "you@gmail.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

### Via cURL (Quick Test)

```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrms.com","password":"Admin123!"}' | jq -r '.data.token')

# Send test email
curl -X POST http://localhost:5000/api/v1/settings/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"you@gmail.com"}'
```

---

## Step 5: Where Email Is Used

| Feature | Trigger | Email Content |
|---------|---------|---------------|
| **Password Reset** | User clicks "Forgot Password" | Reset link (expires in 1 hour) |
| **Welcome** | New employee created | Welcome message + login instructions |
| **Leave Approval** | Leave approved/rejected | Status notification |
| **Announcement** | New announcement published | Announcement summary |
| **Salary Slip** | Monthly payroll processed | Salary slip download link |

---

## How EmailService Works

### File: `server/src/core/email/EmailService.ts`

```
EmailService
├── send(to, subject, html)         — Uses Vault-stored SMTP config
├── sendWithConfig(to, subject, html, config)  — Custom SMTP config (from settings UI)
├── getTransporter()                — Lazy-creates Nodemailer transporter
├── getWelcomeTemplate(name)        — Welcome email HTML
├── getPasswordResetTemplate(url)   — Password reset HTML
└── getSalarySlipTemplate(name, month) — Salary slip HTML
```

### Key Behaviors

| Behavior | Details |
|----------|---------|
| **Lazy init** | Transporter created on first `send()` call, reused after |
| **Graceful skip** | If `EMAIL_HOST` is empty, logs warning and returns (no crash) |
| **Error logging** | Failed sends are logged but don't throw (non-blocking) |
| **Secure auto-detect** | Port 465 → SSL, Port 587 → TLS |
| **Custom config** | `sendWithConfig()` lets Settings UI override Vault config |

### Environment Variables (from Vault)

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_HOST` | `""` | SMTP server hostname |
| `EMAIL_PORT` | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `EMAIL_USER` | `""` | SMTP username |
| `EMAIL_PASSWORD` | `""` | SMTP password |
| `EMAIL_FROM` | `""` | Sender email address |

---

## Troubleshooting

### "Email transport not configured, skipping email"

**Cause:** `EMAIL_HOST` is empty in Vault.

**Fix:**
```bash
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv put secret/hrms \
  EMAIL_HOST="smtp.gmail.com" \
  EMAIL_PORT="587" \
  EMAIL_USER="you@gmail.com" \
  EMAIL_PASSWORD="your-app-password" \
  EMAIL_FROM="you@gmail.com"
```
Then restart the server.

### "Authentication failed" (Gmail)

**Cause:** Using regular password instead of App Password.

**Fix:**
1. Go to [Google Account → Security → 2-Step Verification](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new App Password for "Mail"
5. Use that 16-character password in Vault

### "Connection timeout"

**Cause:** Firewall blocking outbound SMTP (port 587/465).

**Fix:**
- Check if your network allows outbound connections on port 587 or 465
- Try port 465 (SSL) instead of 587 (TLS)
- For corporate networks, ask IT to whitelist your SMTP host

### "Self signed certificate in chain"

**Cause:** Corporate proxy intercepting SSL.

**Fix (development only):**
```bash
# Add to Vault secrets
NODE_TLS_REJECT_UNAUTHORIZED=0  # NOT recommended for production
```

Or configure the SMTP host to use port 587 (STARTTLS) instead of 465 (SSL).

### Emails not arriving

**Checklist:**
1. ✅ Vault secrets are set (`vault kv get secret/hrms`)
2. ✅ Server restarted after setting secrets
3. ✅ SMTP credentials are correct (test with another email client)
4. ✅ Sender email is verified with your SMTP provider
5. ✅ Check spam/junk folder
6. ✅ Check server logs for "Email sent" or "Email send failed"

### Testing with Mailtrap (Safe Development)

[Mailtrap](https://mailtrap.io/) captures emails in a fake inbox — no real emails sent.

```bash
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv put secret/hrms \
  EMAIL_HOST="sandbox.smtp.mailtrap.io" \
  EMAIL_PORT="2525" \
  EMAIL_USER="your-mailtrap-user" \
  EMAIL_PASSWORD="your-mailtrap-pass" \
  EMAIL_FROM="no-reply@hrms.dev"
```

Then visit [Mailtrap inbox](https://mailtrap.io/inboxes) to see captured emails.

---

## Production Recommendations

| Recommendation | Details |
|----------------|---------|
| **Use a dedicated SMTP service** | Gmail free tier has daily limits (500/day). Use SendGrid, Mailgun, or AWS SES |
| **Set up SPF/DKIM** | Authenticate your domain to improve deliverability |
| **Monitor bounces** | Track bounce rates and remove invalid addresses |
| **Use environment-specific from addresses** | `noreply@yourcompany.com` for production, `test@hrms.dev` for dev |
| **Add unsubscribe link** | Required by CAN-SPAM for marketing emails |
| **Rate limit email sends** | Prevent abuse if someone triggers mass emails |
