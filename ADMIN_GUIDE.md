# 📘 Klinik Admin Dashboard — Complete Guide

> **Version:** 2.0 — February 2026
> **For:** Admin & Owner Users
> **URL:** `admin.html` (separate from the public site)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [📊 Analytics Tab](#3--analytics-tab)
4. [📦 Inventory Tab](#4--inventory-tab)
5. [📅 Roster Tab](#5--roster-tab)
6. [🎉 Promo Tab](#6--promo-tab)
7. [💰 Cash Flow Tab](#7--cash-flow-tab)
8. [⚙️ Settings Tab](#8--settings-tab)
9. [🔐 Admin Tab (Owner Only)](#9--admin-tab-owner-only)
10. [Security & Roles](#10-security--roles)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Getting Started

### How to Access the Admin Dashboard

1. Open `admin.html` in your browser
2. Click **"Begin Audit"** on the welcome screen
3. Enter your **admin email** and **password**
4. Wait for the live system scan (~3 seconds)
5. You're in! The dashboard will load automatically

### Login Credentials

| Role | Default Email | Default Password |
|------|--------------|-----------------|
| Admin | `admin@klinik.com` | `Admin2026*` |
| Owner | `owner@klinik.com` | `Owner2026*` |

> ⚠️ **Important:** After first login, change your password immediately in the **Admin tab**.

### Login Security

- **3 failed attempts** → Account is permanently locked
- Use **"Forgot access?"** link to reset the lockout
- All passwords are **SHA-256 hashed** with HMAC salt — they are never stored in plain text

---

## 2. Dashboard Overview

After logging in, you'll see the **Admin Dashboard** with tabs at the top:

| Tab | Icon | Purpose | Who Can Access |
|-----|------|---------|---------------|
| Analytics | 📊 | Clinic overview & statistics | Admin + Owner |
| Inventory | 📦 | Manage stock items & medicine | Admin + Owner |
| Roster | 📅 | Doctor schedules & shifts | Admin + Owner |
| Promo | 🎉 | Manage promotional banners | Admin + Owner |
| Cash Flow | 💰 | Track income & expenses | Admin + Owner |
| Settings | ⚙️ | Clinic info, hours & socials | Admin + Owner |
| Admin | 🔐 | Change login credentials | **Owner Only** |

> The **Admin** tab is hidden for regular admin users. Only the owner account can see it.

---

## 3. 📊 Analytics Tab

Shows a **real-time overview** of your clinic operations:

- **Total Inventory Items** — How many stock items are registered
- **Roster Rules** — Number of active scheduling rules
- **Registered Doctors** — Total doctors in the system
- **Promo Status** — Whether the promo section is currently active

This tab loads automatically when you access the dashboard as part of the live system scan.

---

## 4. 📦 Inventory Tab

### Adding Stock Items

1. Click **"+ Add Item"** button
2. Fill in the form:
   - **Category:** Medicine, Supplements, Equipment, Stationery, Others
   - **Item Name:** e.g. "Paracetamol 500mg"
   - **Quantity:** Current stock count
   - **Expiry Date:** Optional — helps track expired items
3. Click **Save**

### Managing Stock

| Feature | How |
|---------|-----|
| Search items | Type in the search box at the top |
| Filter by category | Use the "All Categories" dropdown |
| Sort items | Use the "Sort" dropdown (Name, Category, Stock ↑↓, Expiry) |
| Edit quantity | Click the edit (pencil) icon on any item |
| Delete item | Click the trash icon — requires **Owner Password** |

### Stock Alerts

Items with **low stock** (≤ 10) are highlighted in yellow/orange to remind you to reorder.

---

## 5. 📅 Roster Tab

### Understanding Roster Views

| View | Description |
|------|-------------|
| **Weekly** | Shows the repeating weekly schedule at a glance |
| **Monthly** | Calendar view showing which doctor is on duty each day |

### Adding a Schedule Rule

1. Click **"+ Add Rule"**
2. Choose **rule type:**
   - **Specific Date** — Assign a doctor for a particular date (or date range, max 31 days)
   - **Weekly** — Assign a doctor for every Monday, Tuesday, etc.
3. Select the **Doctor** from the dropdown
4. Choose the **Shift**: Full Day, Morning, Evening, or OFF/Closed
5. Click **Save Rule**

### Smart Duplicate Detection

The system automatically prevents conflicting schedules:

| Scenario | What Happens |
|----------|-------------|
| Same doctor + same day + same shift | ❌ Blocked — "Duplicate exists" alert |
| Same doctor + same day + different shift | ⚡ Prompted to **update** the existing shift |

### Managing Doctors

At the bottom of the Roster tab:

- **Add Doctor:** Type the name + specialty (e.g. "Dr. Ahmad (Surgeon)") and click **Add**
- **Remove Doctor:** Click the trash icon next to the doctor — requires **Owner Password**

### Bulk Actions

- **Select All** checkbox to select all rules
- **Delete Selected** — removes selected rules (requires Owner Password)
- **Clear All** — removes ALL roster rules (requires Owner Password)

---

## 6. 🎉 Promo Tab

### How Promos Work

When enabled, a **promotional carousel** (slideshow) appears on the public site homepage between the hero section and services.

### Enabling/Disabling Promos

Toggle the **"Show on Site"** switch to show or hide the promo section on the public website.

### Adding a Promo Item

1. **Option A — Image URL:** Paste an image URL (e.g. from Google Drive, Imgur, etc.)
2. **Option B — Upload from Device:** Click "Upload from Device" to upload a local image
   - Max file size: **500 KB** (to stay within Firebase free tier)
   - Accepted formats: JPG, PNG, WebP, GIF
3. Add a **Caption** (optional) — appears as text overlay on the image
4. Click **"Add Promo"**

### Managing Promo Items

- Each promo is shown with a thumbnail, caption, and delete button
- Click the **trash icon** to remove a promo (requires Owner Password)

> **Tip:** Add multiple promos — they'll auto-rotate every 4 seconds on the public site with navigation arrows and dots.

---

## 7. 💰 Cash Flow Tab

### Recording Transactions

1. Click **"+ Add Transaction"**
2. Choose **Type:**
   - **Income** — Money received (consultations, services, etc.)
   - **Expense** — Money spent (supplies, payroll, utilities, etc.)
3. Fill in:
   - **Date** — When the transaction occurred
   - **Category:**
     - Income: Consultation, Service, Product Sale, Others
     - Expense: Supplies, Utilities, Payroll, Maintenance, Equipment, Others
   - **Description** — Short note about the transaction
   - **Amount (RM)** — The transaction amount
4. Click **Save**

### Viewing & Filtering

| Filter | Options |
|--------|---------|
| Month | All Months, or specific months detected from your data |
| Type | All Types, Income Only, Expense Only |
| Category | All Categories, or a specific one |

### Summary Cards

At the top of the Cash Flow tab, you'll see live summary cards:
- **Total Income** (green)
- **Total Expenses** (red)
- **Net Balance** (blue) — Income minus Expenses

### Bulk Delete

1. Check the boxes next to transactions you want to remove
2. Click **"Delete Selected"** — requires Owner Password

---

## 8. ⚙️ Settings Tab

This tab controls what the **public website** displays. Changes take effect immediately after saving.

### Clinic Information

| Field | What It Controls |
|-------|-----------------|
| Clinic Name | Navbar title + footer + browser tab |
| Address | Footer contact section |
| Phone | Footer + "Call Now" button link |
| Email | Footer contact info |

### Operating Hours (NEW — Per-Day Schedule)

The hours system now supports **per-day configuration:**

| Setting | Description |
|---------|-------------|
| **24/7 Toggle** | Enable = shows "Open 24/7" everywhere, hides per-day grid |
| **Per-Day Grid** | Set **open** and **close** time for each day (Mon–Sun) |
| **Off Toggle** | Mark any day as **Closed** (e.g. Sunday Off, Monday Off) |

**How it works on the public site:**
- Hours are **grouped smartly** in the footer: e.g. "Mon – Fri: 9 AM – 10 PM"
- Off days show in **red**: e.g. "Sun: Closed"
- The **live status bar** uses per-day hours to accurately show "Open" or "Closed" based on the current day and time

**Example Setup:**

| Day | Open | Close | Off? |
|-----|------|-------|------|
| Mon | 9:00 | 22:00 | — |
| Tue | 9:00 | 22:00 | — |
| Wed | 9:00 | 22:00 | — |
| Thu | 9:00 | 22:00 | — |
| Fri | 9:00 | 22:00 | — |
| Sat | 9:00 | 17:00 | — |
| Sun | — | — | ✅ Off |

This would display as:
```
Mon – Fri: 9 AM – 10 PM
Sat: 9 AM – 5 PM
Sun: Closed
```

### Social Links

| Field | Format |
|-------|--------|
| WhatsApp Number | Just the number: `60172032048` (no `+` or spaces) |
| Facebook URL | Full URL: `https://facebook.com/yourpage` |
| Instagram URL | Full URL: `https://instagram.com/yourhandle` |
| TikTok URL | Full URL: `https://tiktok.com/@yourhandle` |
| Threads URL | Full URL: `https://threads.net/@yourhandle` |

### Google Maps Embed

1. Go to [Google Maps](https://maps.google.com)
2. Search for your clinic
3. Click **Share** → **Embed a map** tab
4. Copy **only the URL** inside `src="..."` (starts with `https://www.google.com/maps/embed`)
5. Paste it in the **Embed URL** field
6. Click **"Test Map Preview"** to verify it loads correctly

> ⚠️ Do NOT paste the full `<iframe>` tag — only the URL. If you accidentally paste the full tag, the system will auto-extract the URL for you.

### Saving Settings

- Click **"Save Settings"** — A green checkmark confirms success
- Click **"Reset"** to reload saved values from the database (undo unsaved changes)

---

## 9. 🔐 Admin Tab (Owner Only)

> This tab is **only visible to users logged in with the Owner account.**

### Accessing the Admin Tab

1. Log in with the **Owner** credentials
2. Click the **🔐 Admin** tab
3. Enter the **Owner Password** when prompted
4. You'll see the current admin email (masked for security)

### Changing Admin Email

1. Click **"Change Email"**
2. Enter the Owner Password to verify
3. Type the new email address
4. Confirm — the new email takes effect immediately

### Changing Admin Password

1. Click **"Change Password"**
2. Enter the Owner Password to verify
3. Type the new password (must be 6+ characters)
4. Confirm the password
5. The new password takes effect on next login

> ⚠️ **Warning:** Changing the password here requires the new password for all future logins. Make sure to remember it!

---

## 10. Security & Roles

### Role Hierarchy

```
┌──────────────────────────────┐
│         DEVELOPER            │  ← Can change owner password (in code)
├──────────────────────────────┤
│          OWNER               │  ← Full access + Admin tab + all delete actions
├──────────────────────────────┤
│          ADMIN               │  ← All tabs except Admin tab
└──────────────────────────────┘
```

### Owner Password Protection

The following actions **require the Owner Password:**

| Action | Tab |
|--------|-----|
| Delete inventory items | Inventory |
| Delete roster rules | Roster |
| Delete selected/clear all rules | Roster |
| Remove doctors | Roster |
| Delete promo items | Promo |
| Delete cash flow entries | Cash Flow |
| Access Admin tab | Admin |
| Change admin email | Admin |
| Change admin password | Admin |

### Password Hashing

- All passwords use **SHA-256 + HMAC salt** hashing
- Passwords are **never stored in plain text**
- The salt prevents rainbow table attacks
- Owner password is **hardcoded** and can only be changed by the developer

---

## 11. Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **Account locked after 3 attempts** | Click "Forgot access?" at the bottom of the login screen |
| **Settings not showing on public site** | Click "Save Settings" → then hard refresh (`Ctrl + Shift + R`) the public site |
| **Map preview not working** | Make sure the URL starts with `https://www.google.com/maps/embed` |
| **Promo images not showing** | Check the image URL is valid, or re-upload (max 500 KB) |
| **Live status says "Closed" incorrectly** | Check the Settings tab → make sure today's operating hours are set correctly |
| **Admin tab not visible** | You must be logged in as **Owner** (not Admin) |
| **Owner Password prompt not closing** | Click "Cancel" or reload the page |
| **WhatsApp link not working** | Make sure the number format is correct: `60172032048` (no + or spaces) |
| **Roster conflict detected** | The system prevents the same doctor from being assigned different shifts on the same day — update the existing rule instead |

### Firebase Free Tier Limits

| Resource | Free Limit | Status |
|----------|-----------|--------|
| Database Storage | 1 GB | Monitored in dashboard |
| Data Transfer | 10 GB/month | Monitored in dashboard |
| Image uploads | 500 KB each | Enforced on upload |

> Firebase usage alerts appear at the top of the dashboard if usage exceeds 70%.

### File Structure

```
KlinikWeb/
├── index.html        ← Public website (patients)
├── style.css         ← Public site styles
├── script.js         ← Public site logic + Firebase reads
├── admin.html        ← Admin dashboard (separate page)
├── admin.css         ← Admin dashboard styles
├── admin.js          ← Admin dashboard logic + Firebase writes
├── firebase-config.js← Firebase connection settings
└── database.rules.json ← Firebase security rules
```

> **Why are files separated?** For security and performance — admin code is never loaded on the public site, and patients cannot see admin logic in their browser.

---

## Quick Reference Card

| Action | Where | How |
|--------|-------|-----|
| Add stock item | Inventory → + Add Item | Fill form → Save |
| Add doctor schedule | Roster → + Add Rule | Choose type → Doctor → Shift → Save |
| Add promo banner | Promo → Add Promo Item | URL or upload → Caption → Add |
| Record income/expense | Cash Flow → + Add Transaction | Type → Date → Amount → Save |
| Change clinic name | Settings → Clinic Name | Edit → Save Settings |
| Set a day off | Settings → Per-Day Hours | Toggle "Off" for the day → Save |
| Change admin password | Admin tab (Owner only) | Enter owner PIN → New password |
| Delete anything | Any tab | Click trash → Enter Owner Password |

---

*Guide generated on 16 February 2026 for Klinik Dashboard v2.0*
