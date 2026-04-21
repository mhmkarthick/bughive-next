# 🐝 BugHive — Next.js + Node.js + MongoDB

A production-ready bug tracking system for your team.

---

## 🚀 Quick Start (Easiest — Docker)

### Step 1 — Install Docker Desktop
Download from **https://www.docker.com/products/docker-desktop** and install it like any normal program. Restart your computer when asked.

### Step 2 — Extract this ZIP
Unzip the `bughive-next.zip` file to a folder like `C:\bughive-next` (Windows) or `~/bughive-next` (Mac).

### Step 3 — Open Terminal / Command Prompt
- **Windows:** Press `Win + R`, type `cmd`, press Enter
- **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter

### Step 4 — Navigate to the folder
```
cd C:\bughive-next
```
(Mac: `cd ~/bughive-next`)

### Step 5 — Start BugHive
```
docker compose up -d
```
First run downloads everything — takes 3–5 minutes. Wait until it stops.

### Step 6 — Add sample data
```
docker compose exec server npm run seed
```

### Step 7 — Open in browser
Go to: **http://localhost:3000**

---

## 👤 Login Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@bughive.io | Password123! |
| Project Manager | pm@bughive.io | Password123! |
| Developer | dev1@bughive.io | Password123! |
| QA | qa@bughive.io | Password123! |

> ⚠️ There is **no public registration page**. Only Admins can create new user accounts from the Team page.

---

## ⏹️ Stop BugHive
```
docker compose down
```

## ▶️ Start again later
```
docker compose up -d
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | **Next.js 14** (App Router, Server Components) |
| Backend | **Node.js + Express** |
| Database | **MongoDB + Mongoose** |
| Auth | JWT (Access + Refresh tokens) |
| Real-time | **Socket.io** (live notifications) |
| Email | Nodemailer + SendGrid |
| File Upload | Multer + Cloudinary |
| State | Zustand + TanStack React Query |
| Styling | Tailwind CSS |
| Deployment | Docker + GitHub Actions CI/CD |

---

## 📁 Project Structure

```
bughive-next/
├── server/                  ← Node.js + Express API
│   └── src/
│       ├── models/          ← MongoDB schemas (User, Bug, Project, Notification)
│       ├── controllers/     ← Route handlers
│       ├── routes/          ← Express routers
│       ├── services/        ← Email service
│       ├── socket/          ← Socket.io real-time
│       └── utils/           ← JWT, logger, errors, helpers
│
├── client/                  ← Next.js 14 App
│   └── src/
│       ├── app/             ← Pages (App Router)
│       │   ├── auth/login   ← Login page (no register)
│       │   └── dashboard/   ← All app pages
│       ├── components/      ← Reusable UI components
│       ├── hooks/           ← React Query hooks
│       ├── store/           ← Zustand state
│       ├── lib/             ← API client, utilities
│       └── types/           ← TypeScript interfaces
│
├── docker-compose.yml
└── README.md
```

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Auth |
| POST | `/api/auth/refresh` | Public |
| GET  | `/api/auth/me` | Auth |
| PATCH | `/api/auth/change-password` | Auth |

### Users (Admin controls user creation)
| Method | Endpoint | Access |
|---|---|---|
| GET  | `/api/users` | Auth |
| POST | `/api/users` | **Admin only** |
| PATCH | `/api/users/:id` | Self or Admin |
| PATCH | `/api/users/:id/role` | Admin only |
| PATCH | `/api/users/:id/toggle-active` | Admin only |
| PATCH | `/api/users/:id/reset-password` | Admin only |

### Bugs
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/bugs` | Auth |
| POST | `/api/bugs` | Auth |
| GET | `/api/bugs/:id` | Auth |
| PATCH | `/api/bugs/:id` | Reporter/Assignee/Admin |
| DELETE | `/api/bugs/:id` | Reporter/Admin |
| POST | `/api/bugs/:id/comments` | Auth |

---

## 🔒 User Management

**There is no self-registration.** This is by design for company tools.

To add a team member:
1. Log in as **Admin**
2. Go to **Team** in the sidebar
3. Click **Add Member**
4. Fill in name, email, and a temporary password
5. Click **Create & Notify** — the user receives an email with their login details

---

## ⚙️ Configuration (Optional)

To set up real emails and file uploads, edit the `.env` file in the `server/` folder:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PASS=your_sendgrid_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

Then restart: `docker compose restart server`

---

## 📞 Need Help?

The system works completely out of the box with Docker. If you run into any issues, common fixes:

- **"Docker not found"** → Make sure Docker Desktop is open and running (whale icon in taskbar)
- **"Port 3000 in use"** → Change `- '3000:3000'` to `- '3001:3000'` in `docker-compose.yml` and open `http://localhost:3001`
- **Page won't load** → Wait 30 seconds and refresh. First start can be slow.
