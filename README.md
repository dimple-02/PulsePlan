# PulsePlan

<div align="center">

### Plan clearly. Move faster. Ship together.

**A focused, multi-tenant project management workspace for modern teams.**

<br />

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

<br />

<a href="#-quick-start">Quick start</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="#-product-tour">Explore the app</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="#-api-reference">API reference</a>

</div>

---

## ✨ The idea

PulsePlan brings projects, tasks, people, and progress into one calm, fast workspace. It combines a polished React dashboard with a secure Express API and MongoDB persistence.

The important part: every project and task belongs to an authorized workspace. The backend verifies membership on every tenant-scoped request instead of trusting a workspace ID supplied by the browser.

<table>
<tr>
<td width="33%" valign="top">

### 📊 See the signal

Dashboard KPIs, project progress, task summaries, and recent activity help teams understand what needs attention.

</td>
<td width="33%" valign="top">

### 🧭 Keep work moving

Create projects, filter work, and move tasks through a focused Kanban pipeline from backlog to done.

</td>
<td width="33%" valign="top">

### 🔐 Protect every tenant

Cookie-based sessions, membership checks, validation, CSRF protection, and rate limiting keep workspace data isolated.

</td>
</tr>
</table>

## 🚀 What you can do

- Create an account and receive a private workspace automatically.
- Sign in, restore a session after a browser refresh, and sign out securely.
- Switch between workspaces that the current user is actually a member of.
- Track active projects, total tasks, completion rate, and team members.
- Create, filter, search, update, and delete projects.
- Manage tasks across **Backlog**, **To do**, **In progress**, **Review**, and **Done**.
- Set project status, priority, category, progress, dates, budget, and lead.
- Set task priority, assignee, due date, tags, description, and story points.
- Browse team members, workspace settings, recent activity, and project progress.
- Work comfortably across responsive layouts with reusable cards, modals, inputs, badges, and empty states.

## 🗺️ Product tour

| Area | Route | Purpose |
| --- | --- | --- |
| Login | `/login` | Authenticate an existing account |
| Sign up | `/signup` | Register and provision a personal workspace |
| Dashboard | `/` | Workspace overview and KPI cards |
| Projects | `/projects` | Project grid/table and project management |
| Kanban | `/kanban` | Task pipeline and task details |
| Team | `/team` | Workspace member directory |
| Settings | `/settings` | Workspace configuration |

All application routes are protected except `/login` and `/signup`. Unmatched routes render the 404 page.

## 🏗️ Architecture

```text
┌──────────────────────┐       HTTP + cookies        ┌────────────────────────┐
│ React + Vite client  │ ──────────────────────────▶ │ Express REST API       │
│ Tailwind + Bootstrap │                            │ Auth + validation      │
└──────────┬───────────┘                            └───────────┬────────────┘
           │                                                   │
           │ WorkspaceContext                                 │ Mongoose
           │ x-workspace-id                                    │
           ▼                                                   ▼
     Dashboard / Kanban                              ┌──────────────────┐
     Projects / Team                                │ MongoDB          │
     Settings                                       │ Users            │
                                                    │ Workspaces       │
                                                    │ Projects / Tasks  │
                                                    └──────────────────┘
```

### Frontend experience

- React 18 with functional components and hooks
- React Router 6 for public/protected routes
- Vite 6 for development and production builds
- Tailwind CSS for the primary design system
- Bootstrap 5 compatibility for framework utility/components
- Lucide React for icons
- `AuthContext` for session state and `WorkspaceContext` for tenant/project/task state
- A small API service layer using `fetch` with `credentials: 'include'`

### Backend foundation

- Node.js with ES modules
- Express 4 REST API
- MongoDB through Mongoose 8
- `bcryptjs` password hashing
- JWT sessions stored in HTTP-only cookies
- `express-validator` request validation
- CORS allow-list with credentials
- CSRF checks for state-changing cookie requests
- Authentication rate limiting on sign-up and login
- Centralized error handling and graceful shutdown

## 🛡️ Multi-tenant security model

Workspace context is sent by the client through `x-workspace-id` (or `x-tenant-id` / `?workspaceId=`), but that value is only a lookup hint. It is never treated as proof of access.

For project and task requests, the API:

1. Authenticates the user.
2. Resolves the workspace by MongoDB ID or slug.
3. Checks membership in both the user's workspace links and the workspace member list.
4. Attaches the authorized workspace to the request.
5. Rejects unauthorized access with `403`.
6. Verifies that a task's project belongs to the same workspace before creating or moving the task.

Additional protections include:

- passwords are hashed and never returned in API responses;
- login and sign-up attempts are rate-limited;
- production requires a non-default JWT secret of at least 32 characters;
- production requires `CLIENT_URL` for strict CORS enforcement;
- production cookies are secure and use cross-site-safe settings;
- malformed IDs and invalid enum values are rejected before controllers run.

## 📁 Repository layout

```text
.
├── index.html
├── package.json                 # Frontend scripts and dependencies
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/                      # Public assets and icons
├── src/
│   ├── components/
│   │   ├── auth/                # Protected route guard
│   │   ├── common/              # Button, card, modal, input, badge, etc.
│   │   ├── dashboard/           # KPI and activity widgets
│   │   ├── kanban/              # Board, columns, cards, filters, task modals
│   │   ├── layout/              # App shell, sidebar, topbar, workspace switcher
│   │   └── projects/            # Project cards, rows, and create modal
│   ├── context/                 # Auth and workspace state providers
│   ├── hooks/                   # Workspace and debounce hooks
│   ├── pages/                   # Login, dashboard, projects, Kanban, team, settings
│   ├── routes/                  # React Router configuration
│   ├── services/api.js          # Auth, workspace, project, task API calls
│   ├── App.jsx
│   └── main.jsx
└── server/
    ├── config/                  # Environment and MongoDB connection
    ├── controllers/             # Auth, workspace, project, and task handlers
    ├── middleware/              # Auth, tenant scope, CSRF, validation, errors
    ├── models/                  # User, Workspace, Project, and Task schemas
    ├── routes/                  # REST route definitions
    ├── tests/                   # Auth/isolation and security audit runners
    ├── app.js                   # Express middleware and route composition
    ├── server.js                # Startup, DB connection, shutdown
    └── .env.example             # Backend environment template
```

## ✅ Requirements

- Node.js 18+ (Node.js 22 is recommended for the current setup)
- npm
- MongoDB 6+ locally or a MongoDB Atlas connection

## ⚡ Quick start

### 1. Install dependencies

Open a terminal in the project root and install both workspace dependencies:

From the repository root:

```bash
npm install
cd server
npm install
cd ..
```

### 2. Configure the API

Copy the example environment file:

```bash
copy server\.env.example server\.env
```

On macOS/Linux, use `cp server/.env.example server/.env`.

For local development, the default MongoDB URL targets:

```text
mongodb://127.0.0.1:27017/pulseplan_db
```

Update `server/.env` when using MongoDB Atlas or a different frontend origin. Never commit real secrets.

### 3. Start MongoDB

Start your local MongoDB service, or ensure the Atlas cluster is reachable from your machine.

### 4. Start the backend

In one terminal:

```bash
npm run server
```

The API starts at `http://localhost:5000`.

### 5. Start the frontend

You should now have two processes running:

| Process | URL |
| --- | --- |
| React + Vite | `http://localhost:5173` |
| Express API | `http://localhost:5000` |

In a second terminal:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The frontend uses `http://localhost:5000/api` by default. To point it elsewhere, create a root `.env` file:

```ini
VITE_API_BASE_URL=https://your-api.example.com/api
```

## 🔧 Environment variables

Configure these in `server/.env`:

| Variable | Required | Development default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `5000` | Express server port |
| `MONGODB_URI` | Yes | Local PulsePlan database | MongoDB connection string |
| `CLIENT_URL` | Production | `http://localhost:5173` | Allowed frontend origin |
| `JWT_SECRET` | Production | Development fallback | Signing secret; use a random 32+ character value in production |
| `NODE_ENV` | No | `development` | Runtime environment |

Generate a strong production secret rather than using the development fallback:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔌 API reference

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create a user and personal workspace |
| `POST` | `/auth/login` | Authenticate and set the session cookie |
| `POST` | `/auth/logout` | Clear the session cookie |
| `GET` | `/auth/me` | Return the current authenticated user |

### Workspaces

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/workspaces` | List workspaces available to the user |
| `GET` | `/workspaces/:id` | Read one authorized workspace |
| `POST` | `/workspaces` | Create a workspace |
| `PATCH` | `/workspaces/:id` | Update workspace settings |
| `DELETE` | `/workspaces/:id` | Delete a workspace as permitted by the API |

### Projects

All project endpoints require authentication and workspace context.

| Method | Endpoint | Query/body highlights |
| --- | --- | --- |
| `GET` | `/projects` | Filter by `status`, `category`, and `search` |
| `GET` | `/projects/:id` | Read one project in the active workspace |
| `POST` | `/projects` | Create a project |
| `PATCH` | `/projects/:id` | Update status, priority, progress, and other fields |
| `DELETE` | `/projects/:id` | Delete a project |

### Tasks

All task endpoints require authentication and workspace context.

| Method | Endpoint | Query/body highlights |
| --- | --- | --- |
| `GET` | `/tasks` | Filter by project, status, priority, assignee, and search |
| `GET` | `/tasks/:id` | Read one task in the active workspace |
| `POST` | `/tasks` | Create a task with a valid same-workspace `projectId` |
| `PATCH` | `/tasks/:id` | Update status, priority, assignee, due date, or story points |
| `DELETE` | `/tasks/:id` | Delete a task |

For project/task requests, the client normally sends:

```http
x-workspace-id: <workspace-id-or-slug>
```

The server also accepts `x-tenant-id` or `?workspaceId=...`, then performs the same membership check.

### Health check

```http
GET /api/health
```

Example response:

```json
{
  "status": "healthy",
  "service": "PulsePlan SaaS API"
}
```

## 🧪 Scripts

Run these from the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run server` | Start the backend in normal mode |
| `npm run server:watch` | Start the backend with Node watch mode |
| `npm run build` | Create the production frontend build |
| `npm run preview` | Preview the production frontend build |
| `npm run test:auth` | Run authentication and tenant-isolation checks |
| `npm run test:security` | Run the comprehensive security audit |

The auth and security scripts expect the backend to be running on port `5000` and a reachable MongoDB instance.

## 🔍 Testing checklist

Before opening a pull request:

```bash
npm run build
npm run test:auth
npm run test:security
```

The automated checks cover, among other cases:

- unauthenticated route rejection;
- registration and automatic workspace provisioning;
- duplicate email rejection;
- invalid credentials;
- session restoration through the HTTP-only cookie;
- logout and cookie clearing;
- cross-workspace access and header spoofing;
- nested project/task workspace checks;
- JWT tampering and malformed/expired token handling;
- CORS, CSRF, rate limiting, and production environment validation.

## 🧰 Troubleshooting

### Frontend cannot connect to the API

Confirm that the backend is running and that the frontend is using the correct API URL:

```text
http://localhost:5000/api/health
```

If needed, set `VITE_API_BASE_URL` in the root `.env`.

### MongoDB connection fails

Confirm MongoDB is running and that `MONGODB_URI` is correct. For Atlas, check the cluster network access list and credentials.

### CORS or CSRF errors

Set `CLIENT_URL` to the exact origin shown in the browser, including protocol and port:

```ini
CLIENT_URL=http://localhost:5173
```

Do not use a wildcard origin when cookies are enabled.

### Workspace context errors

Project and task requests need a valid `x-workspace-id` (or `?workspaceId=`) belonging to the signed-in user. A valid-looking ID alone is not enough.

## 🎨 Design direction

PulsePlan uses a calm indigo/slate visual system, compact information cards, responsive layouts, and focused workflow surfaces. The dashboard answers “how are we doing?”, Projects answers “what are we managing?”, and Kanban answers “what should move next?”

## 📄 License

This repository does not currently declare a license. Add one before distributing PulsePlan outside the project team.
