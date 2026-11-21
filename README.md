# AcxiomCRM — Enterprise Customer Relationship Management System
### Architecture: Modern MERN Stack (MongoDB, Express.js, React.js, Node.js)

---

## 1. Executive Summary and Project Overview

**AcxiomCRM** is an enterprise-grade Customer Relationship Management web application engineered for sales organizations to streamline, automate, and monitor the entire revenue lifecycle:

$$\text{Lead Capture} \longrightarrow \text{Lead Assignment} \longrightarrow \text{Contact \ Qualification} \longrightarrow \text{Lead Conversion} \longrightarrow \text{Customer Management} \longrightarrow \text{Opportunity Pipeline} \longrightarrow \text{Follow-Up \ Activities} \longrightarrow \text{Sales Outcome (Won/Lost)}$$

The project replaces legacy spreadsheet management and rigid ASP.NET architectures with a high-performance, modular **MERN Stack** (MongoDB, Express.js, React 18, Node.js) web application enforcing three-tier validation, strict Role-Based Access Control (RBAC), append-only audit trails, and interactive Chart.js analytics.

---

## 2. Technology Stack & Architectural Decisions

### Frontend
- **React.js 18** with Plain JavaScript (beginner-friendly readability and clear state flow).
- **Vite** for blazing fast build times and local proxy integration.
- **Bootstrap 5 & React Bootstrap** for a clean, responsive interface (collapsible navy sidebar, white cards, responsive tables).
- **React Router DOM v6** for client-side routing, protected route guards, and nested layouts.
- **Axios** with `withCredentials: true` for secure, automatic session cookie exchange.
- **Chart.js & react-chartjs-2** for dynamic visual dashboard analytics.
- **React Icons** for standardized iconography.
- **Context API** (`AuthContext`) for centralized session and role authorization state.

### Backend
- **Node.js** & **Express.js** REST API engine.
- **MongoDB** & **Mongoose ODM** with strict schemas, unique indexes, and compound search indexes.
- **express-session** + **connect-mongo** for persistent, server-managed sessions using HttpOnly, SameSite cookies.
- **bcryptjs** (12 salt rounds) for irreversible password hashing.
- **express-validator** for declarative, multi-tier request body validation.
- **Helmet** for HTTP security headers.
- **express-rate-limit** for brute-force and DoS protection.
- **Morgan** for HTTP request logging.

### Strict Non-Use Policy
- **NO ASP.NET / C# / Razor / SQL Server**: All legacy assignment patterns have been translated into modern Node.js, Express, and MongoDB equivalents while preserving 100% of functional and security requirements.

---

## 3. Demo Credentials & User Roles

The database is pre-seeded with four representative accounts across all three organizational tiers:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **System Administrator** | `admin@acxiomcrm.com` | `AdminPassword@123` | Organization-wide access, User & Role administration, Audit Logs, all CRM data & reports. |
| **Sales Manager** | `manager@acxiomcrm.com` | `ManagerPassword@123` | Supervised team pipeline, subordinate sales reps, management analytics, reports. |
| **Sales Executive 1** | `sales1@acxiomcrm.com` | `SalesPassword@123` | Assigned customers, leads, deals, upcoming follow-ups, personal analytics. |
| **Sales Executive 2** | `sales2@acxiomcrm.com` | `SalesPassword@123` | Assigned customers, leads, deals, personal dashboard. |

> **Viva Tip:** The Login screen features **One-Click Demo Login** buttons that automatically populate credentials for any role during a presentation.

---

## 4. Quick Start & Installation Guide

### Prerequisites
1. **Node.js**: v18+ (tested on Node.js v22).
2. **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas connection string.

### Step 1: Clone or Navigate to Project Directory
```bash
cd d:\crm
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### Step 3: Configure Environment Variables
Verify or adjust `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/acxiom_crm
SESSION_SECRET=acxiom_crm_development_secret_key_change_in_production
SESSION_MAX_AGE_MS=86400000
CLIENT_URL=http://localhost:5173
LOCKOUT_THRESHOLD=5
LOCKOUT_DURATION_MINUTES=15
```

### Step 4: Seed Database with Demo Records
```bash
npm run seed
# or: cd server && node seeders/seed.js
```

### Step 5: Start Backend and Frontend
In Terminal 1 (Backend Server):
```bash
cd server
npm start
# Server listens on http://localhost:5000
```

In Terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Vite client runs on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## 5. Automated End-to-End Testing

AcxiomCRM includes a built-in automated test runner validating all 24 core requirements:

```bash
npm run test:api
# or: node server/tests/apiTest.js
```

### Test Suite Execution Output
```
======================================================
   ACXIOMCRM COMPREHENSIVE AUTOMATED TEST SUITE       
======================================================

--- 1. SYSTEM HEALTH CHECK ---
✅ PASS | API Health Endpoint 

--- 2. AUTHENTICATION & SECURITY TESTS ---
✅ PASS | Invalid Password Rejected with 401 
✅ PASS | Admin Login Successful (200) 
✅ PASS | Manager Login Successful (200) 
✅ PASS | Sales Executive Login Successful (200) 
✅ PASS | Anonymous Request Blocked with 401 

--- 3. ROLE-BASED ACCESS CONTROL (RBAC) TESTS ---
✅ PASS | Sales Executive Blocked from User Management with 403 
✅ PASS | Sales Executive Blocked from Audit Trail with 403 
✅ PASS | Admin Granted Access to User Management (200) 
✅ PASS | Admin Granted Access to Audit Trail (200) 

--- 4. BUSINESS & INPUT VALIDATION TESTS ---
✅ PASS | Invalid Phone Number Rejected with 400 
✅ PASS | Duplicate Customer Email Rejected with 409 
✅ PASS | Opportunity Amount <= 0 Rejected with 400 
✅ PASS | Opportunity Probability > 100 Rejected with 400 
✅ PASS | Past Follow-up Date Rejected with 400 

--- 5. CRM WORKFLOWS & CRUD EXECUTION ---
✅ PASS | Customer Created Successfully with Code 
✅ PASS | Lead Captured Successfully with Code 
✅ PASS | Lead Status Advanced: New -> Contacted 
✅ PASS | Lead Status Advanced: Contacted -> Qualified 
✅ PASS | Lead Conversion Workflow Succeeded (200) 
✅ PASS | Duplicate Lead Conversion Blocked with 409 
✅ PASS | Weighted Pipeline Formula Verified (Amount * Prob / 100) 
✅ PASS | Opportunity Stage Moved to Won (Synchronizes Status & 100% Probability) 
✅ PASS | Follow-Up Scheduled Successfully (201) 
✅ PASS | Follow-Up Rescheduled Successfully (200) 
✅ PASS | Follow-Up Marked Completed (200) 

--- 6. DASHBOARD ANALYTICS & REPORTS ---
✅ PASS | Dashboard 8 KPI Cards Returned from Live MongoDB Queries 
✅ PASS | Dashboard Charts Data Verified (Lead Status, Pipeline, Monthly Sales) 
✅ PASS | Sales Pipeline Report (Stage-wise & Owner-wise) Generated 
✅ PASS | Conversion Rate Report Generated 

--- 7. AUDIT TRAIL VERIFICATION ---
✅ PASS | Audit Trail Accurately Recorded All Operations 

======================================================
   🎉 ALL 24 END-TO-END AUTOMATED TESTS PASSED!       
======================================================
```

---

## 6. Complete Module Specifications

### Module 1: Common Layout & Navigation
- Navy blue sidebar with role-aware menu filtering.
- Sticky top navbar with active user role badge and profile dropdown.
- Fully responsive across desktop, tablet, and mobile views.

### Module 2: Authentication, Password Policy & Lockout
- Minimum 8 characters, requiring uppercase, lowercase, numeric, and special characters.
- Passwords hashed using `bcryptjs` with 12 salt rounds; plain-text passwords never stored or logged.
- Failed attempts tracked via `failedLoginCount`; 5 consecutive failed attempts locks account for 15 minutes (`lockoutUntil`).
- Admins can manually unlock accounts via `PATCH /api/users/:id/unlock`.
- Self-registration provisions only `Sales Executive` role; administrative roles cannot be self-assigned.

### Module 3: Dashboard Analytics
- **8 Mandatory KPI Summary Cards**:
  1. Total Customers
  2. Total Leads
  3. Open Leads
  4. Total Opportunities
  5. Open Opportunities
  6. Won Opportunities
  7. Lost Opportunities
  8. Total Pipeline Value & Weighted Pipeline Value
- **3 Dynamic Chart.js Graphs**:
  - Lead Status Breakdown (New, Contacted, Qualified, Unqualified, Lost, Converted)
  - Opportunity Pipeline Stage Distribution (Qualification, Proposal, Negotiation, Won, Lost)
  - Monthly Sales Closed Trend
- **Date Filters**: Today, This Week, This Month, and Custom Date Range.
- **Widgets**: Upcoming scheduled follow-ups and recent communication activity feeds.

### Module 4: Customer Management
- Auto-generated customer codes (`CUST-1001`, `CUST-1002`).
- Unique email and 10-digit Indian mobile number validation.
- Customer details view displaying full linked history: associated deals, scheduled follow-ups, and activity logs.

### Module 5: Lead Management & Lead Conversion Workflow
- Capture prospects from Website, Referrals, Cold Calls, Trade Shows, etc.
- Permitted status workflow transitions: `New` $\rightarrow$ `Contacted` $\rightarrow$ `Qualified` $\rightarrow$ `Converted` (or `Unqualified`/`Lost`).
- **Conversion Workflow**: Atomically converts a qualified lead into a Customer record, optionally generates an initial Opportunity, marks the lead as `Converted`, and records the conversion in the Audit Log.
- Prevents duplicate conversion (returns 409 Conflict if already converted).

### Module 6: Follow-Up Management
- Schedules Calls, Meetings, Emails, and Tasks linked to Customers, Leads, or Opportunities.
- Business rule: Follow-up date cannot be earlier than today for planned activities.
- Lifecycle actions: Complete, Reschedule, or Mark as Missed.
- Filterable views for Upcoming and Overdue activities.

### Module 7: Opportunity Management & Sales Pipeline
- Pipeline stages: `Qualification` (10%), `Proposal` (40%), `Negotiation` (70%), `Won` (100%), `Lost` (0%).
- Real-time calculation:
  $$\text{Weighted Pipeline Value} = \frac{\text{Amount} \times \text{Probability}}{100}$$
- Business validations: Amount $> 0$, Probability $0-100\%$, and Expected Close Date $\ge \text{today}$ for active deals.
- Visual **Kanban Pipeline Board** and structured Table view.

### Module 8: Activity Management
- Comprehensive activity logger for client touchpoints (Calls, Meetings, Emails, Tasks).
- Directly viewable within customer and lead history profiles.

### Module 9: User & Role Administration
- Admin console to provision new users, assign roles, toggle Active/Inactive account status, unlock locked accounts, and trigger secure password resets.
- Manager reporting hierarchy: Managers assigned to supervise groups of Sales Executives.

### Module 10: Append-Only Audit Logging
- Immutable logging of Logins, Failed Logins, Lockouts, Unlocks, and CRUD operations across all modules.
- Captures `UserId`, `Action`, `EntityName`, `RecordId`, `OldValue`, `NewValue`, `IpAddress`, `Result`, and `Details`.
- Interactive JSON inspection modal to inspect previous state (`oldValue`) vs committed state (`newValue`).
- Passwords and security tokens are strictly stripped before audit writing.

### Module 11: Reports & One-Click CSV Export
- 8 dedicated reports:
  1. Customer Report
  2. Lead Report
  3. Follow-Up Report
  4. Opportunity Report
  5. Sales Pipeline Report (Stage-wise & Owner-wise)
  6. Sales & Conversion Report
  7. User Activity Report
  8. Audit Report
- Date-boundary filters, summary metric cards, and instant RFC-4180 **CSV Export**.

---

## 7. Role-Based Access Control (RBAC) Matrix

| Module & Action | System Admin | Sales Manager | Sales Executive |
|---|:---:|:---:|:---:|
| **Dashboard** | Full Organization | Supervised Team Scope | Assigned Records Scope |
| **Customer CRUD** | All Customers | Team Customers | Assigned Customers |
| **Lead Qualification & Conversion** | All Leads | Team Leads | Assigned Qualified Leads |
| **Opportunities & Pipeline** | All Opportunities | Team Opportunities | Assigned Opportunities |
| **Follow-Ups & Activities** | All Activities | Team Activities | Assigned Activities |
| **User Management** | Full Control | Team View | Prohibited (403) |
| **Role Assignment** | Full Control | Prohibited (403) | Prohibited (403) |
| **Audit Log Inspection** | Full Control | Prohibited (403) | Prohibited (403) |
| **Reports & CSV Export** | All 8 Reports | Team Reports | Personal Reports |

---

## 8. REST API Reference

### Authentication
- `POST /api/auth/login` — Public, rate-limited login.
- `POST /api/auth/register` — Public registration (defaults to Sales Executive).
- `POST /api/auth/logout` — Destroys session cookie.
- `GET /api/auth/me` — Returns current logged-in user profile.

### Customers
- `GET /api/customers` — Scoped customer list with search & pagination.
- `GET /api/customers/:id` — Customer details + linked deals, follow-ups, and activities.
- `POST /api/customers` — Create customer with duplicate email/phone checks.
- `PUT /api/customers/:id` — Update customer master details.
- `DELETE /api/customers/:id` — Soft-deactivate customer (Admin/Manager).

### Leads
- `GET /api/leads` — Scoped leads list.
- `GET /api/leads/:id` — Lead details + linked history.
- `POST /api/leads` — Capture new lead.
- `PUT /api/leads/:id` — Update lead details & status workflow.
- `POST /api/leads/:id/convert` — Atomic lead conversion into Customer and Opportunity.
- `DELETE /api/leads/:id` — Soft-delete lead (Admin/Manager).

### Opportunities
- `GET /api/opportunities` — Scoped opportunities with pipeline summaries.
- `GET /api/opportunities/:id` — Opportunity details.
- `POST /api/opportunities` — Create opportunity (validates amount $>0$, prob $0-100$).
- `PUT /api/opportunities/:id` — Update stage and recalculate weighted pipeline.
- `DELETE /api/opportunities/:id` — Soft-delete opportunity.

### Follow-Ups
- `GET /api/followups` — Scoped follow-ups (supports `filterMode=upcoming` & `overdue`).
- `POST /api/followups` — Schedule follow-up (validates date $\ge \text{today}$).
- `PUT /api/followups/:id` — Complete or reschedule follow-up.
- `DELETE /api/followups/:id` — Soft-delete follow-up.

### Activities
- `GET /api/activities` — Scoped list of interaction activities.
- `POST /api/activities` — Log Call, Meeting, Email, or Task.
- `DELETE /api/activities/:id` — Delete activity record.

### Users & Administration
- `GET /api/users` — List users (Admin/Manager).
- `POST /api/users` — Admin create user with role and reporting hierarchy.
- `PUT /api/users/:id` — Admin update user details.
- `PATCH /api/users/:id/status` — Admin activate/deactivate account.
- `PATCH /api/users/:id/role` — Admin update user role.
- `PATCH /api/users/:id/unlock` — Admin unlock locked account.
- `PATCH /api/users/:id/reset-password` — Admin reset user password.

### Audit Logs & Reports
- `GET /api/audit-logs` — Filterable audit trail (Admin only).
- `GET /api/reports/customers` — Customer report data.
- `GET /api/reports/leads` — Lead generation report.
- `GET /api/reports/followups` — Follow-up activities report.
- `GET /api/reports/opportunities` — Opportunity forecast report.
- `GET /api/reports/pipeline` — Stage-wise and owner-wise pipeline report.
- `GET /api/reports/conversion` — Conversion metrics report.
- `GET /api/reports/user-activity` — User touchpoint counts report.
- `GET /api/reports/audit` — Security audit events report.

---

## 9. Comprehensive Project Viva Guide

### Q1: What is AcxiomCRM and why is it needed?
**Answer:** AcxiomCRM is a centralized Customer Relationship Management platform. It is needed because growing sales organizations struggle with fragmented spreadsheets, missed follow-ups, lost customer context, and inaccurate revenue forecasting. AcxiomCRM organizes customer records, manages the lead qualification lifecycle, tracks deals through pipeline stages, schedules follow-ups, and provides real-time analytics to managers and leadership.

### Q2: Why did we choose the MERN Stack over legacy ASP.NET / SQL Server?
**Answer:**
1. **Single Language Ecosystem:** JavaScript is utilized across both the frontend (React.js) and backend (Node.js/Express.js), minimizing context switching and eliminating impedance mismatch.
2. **Document-Oriented Flexibility:** MongoDB stores CRM data in JSON-like documents, fitting hierarchical customer histories, activities, and metadata without complex relational multi-table JOIN overhead.
3. **Reactive Single Page Application:** React 18 delivers seamless page transitions without full-page browser reloads, providing an intuitive, interactive experience.
4. **Lightweight & Cross-Platform:** The MERN stack runs natively across Windows, Linux, and macOS without requiring proprietary licenses or heavy runtime frameworks.

### Q3: How does authentication and session management work in AcxiomCRM?
**Answer:** The application uses secure server-managed sessions with `express-session` and `connect-mongo`. When a user logs in, Express verifies the credentials, creates a session in MongoDB, and issues a cryptographically signed cookie (`acxiom_crm_sid`). The cookie is marked `HttpOnly` (mitigating XSS attacks by blocking JavaScript access) and `SameSite: 'lax'` (mitigating CSRF). No sensitive secrets or tokens are stored in `localStorage`.

### Q4: How does password hashing protect user accounts?
**Answer:** We use `bcryptjs` with 12 salt rounds. Bcrypt is an adaptive salted hashing function. The salt ensures that identical passwords yield completely different hashes (thwarting rainbow table attacks), while the work factor ensures brute-force and dictionary attacks are computationally infeasible.

### Q5: How does account lockout work?
**Answer:** Every failed login increments the user's `failedLoginCount`. Upon reaching 5 consecutive failures, the `lockoutUntil` timestamp is set 15 minutes into the future. Subsequent login attempts return HTTP 423 (Locked) until the lockout period expires or an Administrator manually calls the unlock endpoint. A successful login resets `failedLoginCount` to 0.

### Q6: How is Role-Based Access Control (RBAC) enforced?
**Answer:** RBAC is enforced on both ends:
- **Client-Side:** The React `<ProtectedRoute allowedRoles={['Admin']}>` guard prevents unauthorized users from opening pages, and navigation bars conditionally render authorized items only.
- **Server-Side (Mandatory):** Express middleware `authenticateSession` validates the active session, `authorizeRoles(...)` checks user privileges, and `getAuthorizedScopeFilter(...)` automatically injects MongoDB query filters (e.g. Sales Executives are strictly constrained to `{ assignedTo: req.user._id }`).

### Q7: Explain the Lead-to-Customer conversion workflow.
**Answer:**
1. Prospect captured as a Lead with status `New`.
2. Sales Executive contacts the prospect and updates status to `Contacted`.
3. Sales Executive qualifies prospect needs, budget, and timeline, updating status to `Qualified`.
4. Triggering the **Convert Lead** workflow atomically:
   - Creates a Customer master record.
   - Optionally creates an initial Opportunity linked to both Customer and Lead.
   - Updates the Lead's status to `Converted`, linking `convertedCustomerId` and `convertedOpportunityId`.
   - Records an immutable `CONVERT` entry in the Audit Log.
   - Prevents accidental duplicate conversion by blocking subsequent conversion calls with HTTP 409.

### Q8: What is an opportunity pipeline and weighted pipeline?
**Answer:** An opportunity pipeline visualizes sales deals across sequential milestones: *Qualification* (10%), *Proposal* (40%), *Negotiation* (70%), *Won* (100%), and *Lost* (0%).
The **Weighted Pipeline Value** represents the expected probabilistic revenue:
$$\text{Weighted Value} = \frac{\text{Deal Amount} \times \text{Stage Probability}}{100}$$
For example, a ₹10,00,000 deal at the Negotiation stage (70%) contributes ₹7,00,000 in forecasted revenue.

### Q9: Why is Audit Logging append-only, and why do we sanitize audit payloads?
**Answer:** Audit logs provide non-repudiation, regulatory compliance, and forensics. To guarantee integrity, Mongoose pre-save hooks reject updates or deletes to the `AuditLog` collection. We sanitize all audit payloads to strictly strip passwords, password hashes, and session cookies, preventing credential leakage in compliance with security best practices.

### Q10: How does client-side validation differ from server-side validation?
**Answer:**
- **Client-Side Validation:** Runs inside the browser using JavaScript to provide immediate visual feedback (e.g. marking invalid phone numbers before form submission), improving user experience.
- **Server-Side Validation:** Mandatory security layer in Express controllers using `express-validator`. Because malicious actors can bypass browser validation (via curl or Postman), server-side validation guarantees bad or tampered data cannot reach the database.
