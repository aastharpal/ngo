# ServeLink — Social Impact Platform

ServeLink is a full-stack platform connecting volunteers with NGOs, featuring real-time task tracking, role-adaptive dashboards, and volunteer application workflows.

---

## 📁 Project Architecture

```text
ServeLink/
├── servelink-backend/               # Node.js / Express REST API & Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma            # PostgreSQL Database Schema
│   │   └── seed.js                  # Database Seeding Script
│   ├── .env                         # Database Connection & JWT Configuration
│   ├── server.js                    # Express Application Entry Point (Port 5000)
│   └── package.json
│
└── web/                             # Next.js 16 App Router & Tailwind CSS UI
    ├── src/
    │   ├── app/                     # App Router Pages & Layouts (Port 3000)
    │   │   ├── (auth)/login/        # Unified Sign-in / Registration
    │   │   ├── (dashboard)/ngos/    # Browse & Apply to NGOs
    │   │   ├── (dashboard)/tasks/   # Real-time Volunteer Task Management
    │   │   └── (dashboard)/dashboard/# Role-Adaptive Analytics Dashboard
    │   ├── components/ui/           # Reusable UI Component Library
    │   ├── context/                 # Auth & Session State Providers
    │   └── lib/api-client.ts        # Typed API Client
    └── package.json
```

---

## 🚀 How to Run the Project

### 1. Start the Backend API
```bash
cd servelink-backend
node server.js
```
* Backend runs at: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`

### 2. Start the Frontend Web App
```bash
cd web
npm run dev
```
* Frontend runs at: `http://localhost:3000`

---

## 🔑 Demo & Presentation Accounts

| Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@servelink.org` | `password123` | Platform oversight, verify NGOs, system-wide metrics |
| **NGO Admin** | `ananya@hopefoundation.org` | `password123` | Manage NGO projects, review applications, assign tasks |
| **Volunteer + Coordinator** | `rohan@hopefoundation.org` | `password123` | Dual-role toggle (Volunteer View ↔ Coordinator View) |
| **Volunteer (Fresh/Clean)** | `priya@example.com` | `password123` | Browse NGOs, apply to volunteer, personal tasks |
