# PulsePlan SaaS — Multi-Tenant Project Management System

> **College Evaluation Milestone (Phase 1 Frontend + Phase 2 Node.js & MongoDB Backend — ~50% Evaluation Milestone)**  
> Full-Stack Architecture: **React 18**, **Tailwind CSS**, **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**.

---

## 🌟 1. Project Overview & Multi-Tenancy Architecture

**PulsePlan SaaS** is a modern project management platform designed around **Multi-Tenant Workspaces**.
In this multi-tenant architecture:
- Organizations (tenants) share the same underlying application infrastructure.
- Data (projects, Kanban boards, tasks, members, and activity streams) is **strictly isolated per tenant in MongoDB**.
- Workspaces start clean with **zero pre-populated dummy projects** — you add projects and tasks manually using the **"+ Project"** and **"+ New Task"** controls.
- When a workspace is switched, the application state dynamically scopes and re-renders only that tenant's resources.
- The frontend communicates with the Express backend using HTTP requests, passing the active tenant identifier (`x-workspace-id` header), where backend middleware validates database queries against that workspace boundary.

---

## 🛠️ 2. Tech Stack

### Frontend:
- **UI Library**: React 18 (Functional components, Hooks, Context API)
- **Styling**: Tailwind CSS + Custom SaaS Design System (Indigo / Slate palette)
- **Icons**: Lucide React
- **Routing**: React Router v6 (`BrowserRouter`, nested `Route`, `Outlet`, `NavLink`)
- **API Client**: Standard ES6 `fetch` with `async/await` ([`src/services/api.js`](file:///d:/project%20management%20system/src/services/api.js))
- **Build Tool**: Vite v6

### Backend:
- **Runtime**: Node.js v22 (ES Modules)
- **Framework**: Express.js v4
- **Database**: MongoDB (Supports local MongoDB on `127.0.0.1:27017` or MongoDB Atlas cloud cluster)
- **ODM**: Mongoose v8 (Schemas, strict validation, timestamps, toJSON transforms)
- **Validation**: express-validator v7
- **Security & Middleware**: CORS, centralized error-handling middleware, tenant scoping middleware

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
│   │   ├── workspaceController.js # Workspace CRUD & seed operations
│   │   ├── projectController.js   # Project CRUD with workspace scoping
│   │   └── taskController.js      # Task CRUD with cross-workspace project checks
│   ├── middleware/
│   │   ├── tenantScope.js         # Workspace boundary extractor & validator
│   │   ├── validate.js            # express-validator result handler
│   │   └── errorHandler.js        # Centralized error handler (CastError, ValidationError)
│   ├── models/
│   │   ├── Workspace.js           # Tenant schema (name, slug, plan, members, activities)
│   │   ├── Project.js             # Project schema with workspaceId reference & unique key index
│   │   └── Task.js                # Task schema with projectId & workspaceId references
│   ├── routes/
│   │   ├── workspaceRoutes.js     # /api/workspaces routes
│   │   ├── projectRoutes.js       # /api/projects routes
│   │   └── taskRoutes.js          # /api/tasks routes
│   ├── app.js                     # Express app setup, CORS, JSON parser, route mounting
│   ├── server.js                  # Server bootstrap & graceful shutdown
│   ├── package.json               # Backend dependencies (express, mongoose, cors, dotenv)
│   ├── .env.example               # Environment variables template
│   └── .env                       # Local environment file (git-ignored)
│
└── src/                           # React Frontend
    ├── components/
    │   ├── common/                # Reusable UI primitives (Button, Badge, Card, Modal, Input, etc.)
    │   ├── dashboard/             # MetricCard, ProjectProgressList, QuickTaskSummary, RecentActivityFeed
    │   ├── kanban/                # KanbanColumn, KanbanCard, KanbanFilters, TaskDetailsModal, CreateTaskModal
    │   ├── layout/                # AppLayout (with error banner), Sidebar, Topbar, WorkspaceSwitcher
    │   └── projects/              # ProjectCard, ProjectTableRow, CreateProjectModal
    ├── context/
    │   └── WorkspaceContext.jsx   # Global tenant state & backend API dispatchers
    ├── hooks/
    │   ├── useDebounce.js         # Input debouncing hook for search
    │   └── useWorkspace.js        # Context consumer hook
    ├── pages/                     # DashboardPage, ProjectsPage, KanbanBoardPage, TeamPage, SettingsPage, NotFoundPage
    ├── routes/
    │   └── AppRoutes.jsx          # Route hierarchy definitions
    ├── services/
    │   └── api.js                 # HTTP fetch client connecting to backend
    ├── App.jsx                    # Root provider wrapper
    ├── main.jsx                   # React 18 DOM mount
    └── index.css                  # Tailwind directives and custom scrollbar
```

---

## 🔌 4. API Endpoints Reference

Base URL: `http://localhost:5000/api`

### Workspaces (Tenants)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspaces` | Retrieve all workspaces (with projects and tasks) |
| `POST` | `/api/workspaces` | Create a new tenant workspace |
| `POST` | `/api/workspaces/seed` | Seed default 3 workspaces (*Acme*, *Nexus*, *Studio Zero*) into MongoDB |
| `GET` | `/api/workspaces/:id` | Get single workspace by ID or slug |
| `PATCH` | `/api/workspaces/:id` | Update workspace settings |
| `DELETE` | `/api/workspaces/:id` | Delete workspace and cascade-delete all its projects and tasks |

### Projects (Scoped to Workspace)
> **Header Required**: `x-workspace-id: <workspaceId>` (or query `?workspaceId=<workspaceId>`)

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/projects` | List projects in workspace | `status`, `category`, `search` |
| `POST` | `/api/projects` | Create project in workspace | — |
| `GET` | `/api/projects/:id` | Get project by ID (scoped) | — |
| `PATCH` | `/api/projects/:id` | Update project properties | — |
| `DELETE` | `/api/projects/:id` | Delete project and cascade-delete its tasks | — |

### Tasks (Scoped to Workspace & Project)
> **Header Required**: `x-workspace-id: <workspaceId>` (or query `?workspaceId=<workspaceId>`)

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/tasks` | List tasks in workspace | `projectId`, `status`, `priority`, `assignee`, `search` |
| `POST` | `/api/tasks` | Create task (verifies project belongs to same workspace) | — |
| `GET` | `/api/tasks/:id` | Get task by ID (scoped) | — |
| `PATCH` | `/api/tasks/:id` | Update task (status, priority, details, move column) | — |
| `DELETE` | `/api/tasks/:id` | Delete task from board | — |

---

## 🔒 5. Multi-Tenant Isolation & Security Rules

1. **Workspace Boundary Scoping**:
   - All Project and Task queries enforce `{ workspaceId: req.workspaceId }` at the database level.
   - It is impossible for a user in *Nexus FinTech Labs* to query or view projects/tasks belonging to *Acme Cloud Innovations*.
2. **Cross-Workspace Assignment Protection**:
   - When creating or updating a task (`POST /api/tasks`, `PATCH /api/tasks/:id`), the backend validates that `projectId` exists **AND** belongs to the exact same `workspaceId`.
   - If an attacker tries to associate a task with another tenant's project ID, the request is rejected with `400 Bad Request`.
3. **Current Security Limitation (For College Viva Explanation)**:
   - In this Phase 2 evaluation, workspace scoping is enforced per-request via headers and query parameters.
   - **Production Requirement Note**: In a production SaaS, client-supplied workspace IDs cannot be blindly trusted. Full production security requires user authentication (JWT/Sessions in Phase 3) where the user's workspace membership is validated against an authenticated identity record in the database.

---

## ⚙️ 6. Environment Variables Configuration

Create a file named `server/.env` (or copy from `server/.env.example`):

```ini
PORT=5000

# For Local MongoDB (Running on Windows port 27017):
MONGODB_URI=mongodb://127.0.0.1:27017/pulseplan_db

# For MongoDB Atlas (Cloud Cluster):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/pulseplan_db?retryWrites=true&w=majority

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🚀 7. How to Run the Project

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017, **OR** a MongoDB Atlas cluster URI configured in `server/.env`.

### Step 1: Start the Backend Server
```bash
# Option A: From root directory
npm run server

# Option B: From server directory
cd server
npm start
```
The backend will connect to MongoDB and listen on `http://localhost:5000`.

### Step 2: Start the Frontend Vite Server
```bash
# From root directory
npm run dev
```
The frontend will start on `http://localhost:5173` (or port indicated by Vite).

---

## 🧪 8. Manual Testing & Verification Checklist

1. **Verify Backend Health**:
   - Open browser or terminal: `http://localhost:5000/api/health`
   - Expect: `{"status":"healthy", "service":"PulsePlan SaaS API"}`
2. **Verify Multi-Tenant Workspaces**:
   - Open frontend: `http://localhost:5174/` (or `5173`)
   - Notice the 3 isolated workspaces in the sidebar switcher: *Acme Cloud Innovations*, *Nexus FinTech Labs*, and *Studio Zero Digital*.
3. **Create Project in MongoDB**:
   - Click **"+ Project"** in topbar or on the Projects page.
   - Enter name (e.g. `Distributed API Gateway`), key (`GW`), category (`DevOps`).
   - Click **"Create Project"**.
   - **Verify**: Refresh the browser page (`F5`). Notice the project **persists** because it was saved directly in MongoDB!
4. **Create Task in Kanban Board**:
   - Navigate to **"Kanban Board"** page.
   - Click **"+ Add Task"** on the "To Do" column.
   - Add title (e.g. `Implement rate limiting middleware`).
   - Click **"Create Task"**.
   - Move the card between columns (e.g. click the right arrow `>` to move to "In Progress").
   - **Verify**: Refresh the browser page (`F5`). Notice the task remains in "In Progress" in MongoDB!
5. **Verify Tenant Data Isolation**:
   - Switch workspace to *Nexus FinTech Labs* from the topbar or sidebar.
   - Notice the project and task counts are `0` — Acme's data is completely hidden from Nexus.
   - Switch back to *Acme Cloud Innovations* — your project and task reappear!
6. **Error Banner Test (Resilience)**:
   - Stop the backend server temporarily.
   - Notice the frontend immediately displays a clear red error banner: *"Backend Disconnected: Cannot connect to backend server..."* with a **"Retry Connection"** button (no fake mock data fallbacks!).
