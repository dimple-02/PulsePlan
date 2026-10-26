# PulsePlan SaaS — Multi-Tenant Project Management System

> **Full-Stack SaaS Platform with Authenticated Multi-Tenant Workspaces**  
> Complete Stack: **React 18**, **Tailwind CSS**, **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **JWT**, and **bcryptjs**.

---

## 🌟 1. Project Overview & Multi-Tenancy Architecture

**PulsePlan SaaS** is a modern project management platform designed around **Authenticated Multi-Tenant Workspaces**.

### Core Architecture Principles:
- **Server-Side Membership Authorization**: The `x-workspace-id` header is **never** trusted as proof of authorization. Every request is verified against the authenticated user's session and database membership records.
- **Strict Data Isolation**: A user belongs strictly to their authorized workspaces. When a new user registers, they are provisioned with an isolated private workspace and **cannot** view or access other tenant organizations (e.g., *Acme Cloud*, *Nexus FinTech*, or *Studio Zero*) without explicit admin invitation.
- **Cross-Workspace Assignment Protection**: When tasks are created or modified, the backend validates that the target project belongs strictly to the active workspace.
- **Session Persistence via Secure HTTP-Only Cookies**: User authentication relies on signed JWTs stored in HTTP-only cookies (`SameSite: Lax` in development, `SameSite: None` + `Secure` in production). This prevents client-side XSS token theft while automatically persisting sessions across browser reloads.
- **Clean Initial State**: No hardcoded or fake mock data. Real data is loaded from MongoDB.

---

## 🛠️ 2. Tech Stack

### Frontend:
- **UI Library**: React 18 (Functional components, Hooks, Context API)
- **Styling**: Tailwind CSS + Custom SaaS Design System (Indigo / Slate palette)
- **Icons**: Lucide React
- **Routing**: React Router v6 (`BrowserRouter`, nested `Route`, `Outlet`, `NavLink`, `Navigate`)
- **Protected Routing**: `ProtectedRoute.jsx` for session restoration loading & unauthorized redirects
- **Authentication**: `AuthContext.jsx` with real asynchronous session restore
- **API Client**: Standard ES6 `fetch` with `credentials: 'include'` ([`src/services/api.js`](file:///d:/project%20management%20system/src/services/api.js))
- **Build Tool**: Vite v6

### Backend:
- **Runtime**: Node.js v22 (ES Modules)
- **Framework**: Express.js v4
- **Database**: MongoDB (Supports local MongoDB on `127.0.0.1:27017` or MongoDB Atlas cloud cluster)
- **ODM**: Mongoose v8 (Strict schemas, timestamps, indexes, virtuals, toJSON transforms)
- **Password Security**: `bcryptjs` with salt generation and pre-save hashing
- **Session Tokens**: `jsonwebtoken` (JWT) with 7-day expiration
- **Cookie Management**: `cookie-parser`
- **Validation**: `express-validator` v7
- **Security & Middleware**: CORS with credentials, HTTP-only cookie auth middleware, tenant boundary scoping middleware, centralized error handling

---

## 📁 3. Project Structure

```
d:\project management system\
├── index.html                     # HTML5 shell with Inter typography
├── package.json                   # Root scripts & frontend dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind theme & color extensions
├── postcss.config.js              # PostCSS plugins
│
├── server/                        # Express + MongoDB Backend
│   ├── config/
│   │   └── db.js                  # MongoDB Mongoose connection & error logging
│   ├── controllers/
│   │   ├── authController.js      # Signup, login, logout, getMe session handler
│   │   ├── workspaceController.js # Workspace CRUD with user membership scoping
│   │   ├── projectController.js   # Project CRUD with workspace scoping
│   │   └── taskController.js      # Task CRUD with cross-workspace project checks
│   ├── middleware/
│   │   ├── auth.js                # requireAuth & optionalAuth JWT cookie verifier
│   │   ├── tenantScope.js         # Strict server-side workspace authorization
│   │   ├── validate.js            # express-validator result handler
│   │   └── errorHandler.js        # Centralized error handler (CastError, ValidationError)
│   ├── models/
│   │   ├── User.js                # User identity schema, bcrypt hash, workspace memberships
│   │   ├── Workspace.js           # Tenant schema (name, slug, plan, members with userId, activities)
│   │   ├── Project.js             # Project schema with workspaceId reference & unique key index
│   │   └── Task.js                # Task schema with projectId & workspaceId references
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth (signup, login, logout, me)
│   │   ├── workspaceRoutes.js     # /api/workspaces routes (guarded by requireAuth)
│   │   ├── projectRoutes.js       # /api/projects routes (guarded by requireAuth & tenantScope)
│   │   └── taskRoutes.js          # /api/tasks routes (guarded by requireAuth & tenantScope)
│   ├── tests/
│   │   └── authTest.js            # Automated 10-point auth & multi-tenancy test runner
│   ├── app.js                     # Express app setup, CORS credentials, cookie parser, routes
│   ├── server.js                  # Server bootstrap & graceful shutdown
│   ├── package.json               # Backend dependencies (express, mongoose, bcryptjs, jsonwebtoken, etc.)
│   ├── .env.example               # Environment variables template
│   └── .env                       # Local environment file
│
└── src/                           # React Frontend
    ├── components/
    │   ├── auth/
    │   │   └── ProtectedRoute.jsx # Route guard with session restoration loading spinner
    │   ├── common/                # Reusable UI primitives (Button, Badge, Card, Modal, Input, etc.)
    │   ├── dashboard/             # MetricCard, ProjectProgressList, QuickTaskSummary, RecentActivityFeed
    │   ├── kanban/                # KanbanColumn, KanbanCard, KanbanFilters, TaskDetailsModal, CreateTaskModal
    │   ├── layout/                # AppLayout, Sidebar (with user & logout), Topbar (with logout shortcut)
    │   └── projects/              # ProjectCard, ProjectTableRow, CreateProjectModal
    ├── context/
    │   ├── AuthContext.jsx        # User session state, persistent login, signup, logout
    │   └── WorkspaceContext.jsx   # Global tenant state & backend API dispatchers
    ├── hooks/
    │   ├── useDebounce.js         # Input debouncing hook for search
    │   └── useWorkspace.js        # Context consumer hook
    ├── pages/
    │   ├── LoginPage.jsx          # Responsive login with form validation & demo credentials
    │   ├── SignupPage.jsx         # User registration with automatic workspace generation
    │   ├── DashboardPage.jsx      # High-level workspace project & task metrics
    │   ├── ProjectsPage.jsx       # Grid and table project listings
    │   ├── KanbanBoardPage.jsx    # Interactive drag-and-click column task manager
    │   ├── TeamPage.jsx           # Tenant member directory and roles
    │   ├── SettingsPage.jsx       # Workspace configuration settings
    │   └── NotFoundPage.jsx       # 404 error fallback
    ├── routes/
    │   └── AppRoutes.jsx          # Route hierarchy with protected route grouping
    ├── services/
    │   └── api.js                 # HTTP client with credentials: 'include'
    ├── App.jsx                    # Root provider wrapper (Auth + Workspace context)
    ├── main.jsx                   # React 18 DOM mount
    └── index.css                  # Tailwind directives and custom scrollbar
```

---

## 🔌 4. API Endpoints Reference

Base URL: `http://localhost:5000/api`

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user, hash password, create personal workspace, set cookie | No |
| `POST` | `/api/auth/login` | Authenticate credentials, set HTTP-only session cookie | No |
| `POST` | `/api/auth/logout` | Clear session cookie | Yes |
| `GET` | `/api/auth/me` | Return current authenticated user profile | Yes (Cookie / Bearer) |

### Workspaces (`/api/workspaces`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/workspaces` | Return all workspaces authorized for current user | Yes |
| `POST` | `/api/workspaces` | Create a new tenant workspace (user added as Owner) | Yes |
| `GET` | `/api/workspaces/:id` | Get single workspace (validates membership) | Yes |
| `PATCH` | `/api/workspaces/:id` | Update workspace settings | Yes |
| `DELETE` | `/api/workspaces/:id` | Cascade-delete workspace, projects, and tasks (Owner only) | Yes |
| `POST` | `/api/workspaces/seed` | Seed default test workspaces (*Acme*, *Nexus*, *Studio Zero*) | Optional |

### Projects (`/api/projects`)
> **Header Required**: `x-workspace-id: <workspaceId>`

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/projects` | List projects in workspace | `status`, `category`, `search` |
| `POST` | `/api/projects` | Create project in workspace | — |
| `GET` | `/api/projects/:id` | Get project by ID (scoped) | — |
| `PATCH` | `/api/projects/:id` | Update project properties | — |
| `DELETE` | `/api/projects/:id` | Delete project and cascade-delete its tasks | — |

### Tasks (`/api/tasks`)
> **Header Required**: `x-workspace-id: <workspaceId>`

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/tasks` | List tasks in workspace | `projectId`, `status`, `priority`, `assignee`, `search` |
| `POST` | `/api/tasks` | Create task (verifies project belongs to same workspace) | — |
| `GET` | `/api/tasks/:id` | Get task by ID (scoped) | — |
| `PATCH` | `/api/tasks/:id` | Update task status or properties | — |
| `DELETE` | `/api/tasks/:id` | Delete task from board | — |

---

## 🔒 5. Multi-Tenant Authorization & Security Verification

1. **Header Spoofing Prevention**:
   - Supplying `x-workspace-id: <id>` without user membership returns `403 Forbidden`.
   - The server verifies `user.workspaces` or `workspace.members` at the database level before granting access.
2. **New User Isolation**:
   - When a new user registers (`/api/auth/signup`), a new isolated workspace is created for them.
   - They **cannot** access or query Acme Cloud, Nexus FinTech, or Studio Zero.
3. **Password Security**:
   - Handled via `bcryptjs` with auto-generated salt (10 rounds).
   - Plaintext passwords are never stored or returned in API responses (`select: false` on Mongoose schema).
4. **Session Cookie Security**:
   - `httpOnly: true`: Prevents client-side script access to the token.
   - `sameSite: 'lax'` (development) / `'none'` (production): Protects against cross-site request forgery.
   - `secure: true` in production (enforces HTTPS).

---

## ⚙️ 6. Environment Variables Configuration

In `server/.env`:

```ini
PORT=5000

# Local MongoDB (Running on Windows port 27017):
MONGODB_URI=mongodb://127.0.0.1:27017/pulseplan_db

# MongoDB Atlas (Cloud Cluster alternative):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/pulseplan_db?retryWrites=true&w=majority

CLIENT_URL=http://localhost:5173
JWT_SECRET=pulseplan_jwt_secret_dev_key_2026
NODE_ENV=development
```

---

## 🚀 7. How to Run the Project & Run Verification

### Step 1: Start Backend Server
```bash
# In server directory
cd server
npm start
# Server listens on http://localhost:5000
```

### Step 2: Start Frontend Application
```bash
# In root directory
npm run dev
# Frontend opens on http://localhost:5173 (or 5174)
```

### Step 3: Run Automated Auth & Isolation Test Suite
```bash
# In root directory
npm run test:auth
```
This runs `server/tests/authTest.js` and outputs pass/fail status for all 10 security scenarios.

### Step 4: Run Frontend Production Build Check
```bash
npm run build
```
Verifies full TypeScript/JSX compilation, asset bundling, and zero syntax errors.
