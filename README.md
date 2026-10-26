# PulsePlan SaaS — Multi-Tenant Project Management System

> **College Evaluation Milestone (Phase 1 — Frontend Foundation ~50%)**  
> Built with: **React 18**, **Vite**, **Tailwind CSS**, and **React Router v6**.

---

## 🌟 1. Project Overview & Multi-Tenancy Architecture

**PulsePlan SaaS** is a modern project management platform designed around **Multi-Tenant Workspaces**. In multi-tenant software:
- Organizations (tenants) share the same underlying application infrastructure.
- Data (projects, Kanban boards, tasks, members, and activity streams) is **strictly isolated per tenant**.
- Workspaces start clean with **zero pre-populated dummy projects** — you add projects and tasks manually using the **"+ Project"** and **"+ New Task"** controls.
- Users can switch between workspaces (e.g., *Acme Cloud Innovations [Enterprise]*, *Nexus FinTech Labs [Pro Team]*, and *Studio Zero Digital [Starter]*) seamlessly from the sidebar or top navigation.
- When a workspace is switched, the application state dynamically scopes and re-renders only that tenant's resources.

---

## 🛠️ 2. Tech Stack

- **Runtime & Build Tool**: Node.js v22 + Vite (Ultra-fast HMR)
- **UI Framework**: React 18 (Functional components, Hooks, Context API)
- **Styling**: Tailwind CSS + Custom Design System (Indigo / Slate palette)
- **Icons**: Lucide React
- **Routing**: React Router v6 (`BrowserRouter`, nested `Route`, `Outlet`, `NavLink`)
- **State Management**: React Context (`WorkspaceContext`) + Custom Hooks (`useWorkspace`, `useDebounce`)
- **Async & Storage Layer**: Promise-based simulated asynchronous client service with localStorage persistence (`clientStorage.js`)

---

## 📁 3. Clean Folder Structure

```
d:\project management system\
├── index.html                     # HTML5 shell with Inter typography
├── package.json                   # NPM dependencies and scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind theme & color extensions
├── postcss.config.js              # PostCSS plugins
├── src/
│   ├── assets/                    # Static assets
│   ├── components/
│   │   ├── common/                # Reusable UI primitives
│   │   │   ├── Avatar.jsx         # User avatar & AvatarGroup
│   │   │   ├── Badge.jsx          # Status and priority badges
│   │   │   ├── Button.jsx         # Buttons (primary, secondary, outline, danger)
│   │   │   ├── Card.jsx           # Compound card components
│   │   │   ├── EmptyState.jsx     # Friendly zero-state placeholders
│   │   │   ├── Input.jsx          # Controlled form inputs
│   │   │   ├── Modal.jsx          # Accessible dialog with ESC listener & scroll lock
│   │   │   └── Select.jsx         # Controlled select dropdowns
│   │   ├── dashboard/             # Dashboard widgets
│   │   │   ├── MetricCard.jsx     # KPI summary cards with trends
│   │   │   ├── ProjectProgressList.jsx # Top active projects progress bars
│   │   │   ├── QuickTaskSummary.jsx    # Kanban status distribution breakdown
│   │   │   └── RecentActivityFeed.jsx  # Real-time audit log stream
│   │   ├── kanban/                # Kanban board system
│   │   │   ├── CreateTaskModal.jsx     # Controlled form for new tasks
│   │   │   ├── KanbanCard.jsx          # Individual task card with move actions
│   │   │   ├── KanbanColumn.jsx        # Status column with card count
│   │   │   ├── KanbanFilters.jsx       # Board search and priority filter
│   │   │   └── TaskDetailsModal.jsx    # Task inspector, status editor, delete
│   │   ├── layout/                # Application Chrome
│   │   │   ├── AppLayout.jsx           # Frame with sidebar, topbar, toast, outlet
│   │   │   ├── Sidebar.jsx             # Tenant navigation & quick project switcher
│   │   │   ├── Topbar.jsx              # Global search, tenant pill, quick create
│   │   │   └── WorkspaceSwitcher.jsx   # Interactive tenant switcher dropdown
│   │   └── projects/              # Project listing system
│   │       ├── CreateProjectModal.jsx  # New project modal
│   │       ├── ProjectCard.jsx         # Grid view project card
│   │       └── ProjectTableRow.jsx     # Table view project row
│   ├── context/
│   │   └── WorkspaceContext.jsx   # Global tenant state & CRUD dispatchers
│   ├── data/
│   │   └── mockWorkspaces.js      # Multi-tenant seed dataset
│   ├── hooks/
│   │   ├── useDebounce.js         # Input debouncing hook for search
│   │   └── useWorkspace.js        # Context consumer hook
│   ├── pages/
│   │   ├── DashboardPage.jsx      # SaaS metrics & overview
│   │   ├── ProjectsPage.jsx       # Grid / Table project listings & filter
│   │   ├── KanbanBoardPage.jsx    # 5-column Kanban board
│   │   ├── TeamPage.jsx           # RBAC team members & role permissions
│   │   ├── SettingsPage.jsx       # Workspace settings & seed data reset
│   │   └── NotFoundPage.jsx       # 404 Route fallback
│   ├── routes/
│   │   └── AppRoutes.jsx          # Route hierarchy definitions
│   ├── services/
│   │   └── clientStorage.js       # Promise-based async service layer
│   ├── App.jsx                    # Root provider wrapper
│   ├── main.jsx                   # React 18 DOM mount
│   └── index.css                  # Tailwind directives and custom scrollbar
```

---

## 🎓 4. College Viva & Examination Quick Reference Guide

Be prepared to explain these core syllabus concepts using the code in this repository:

### 1. JavaScript Fundamentals, Promises & Async/Await
- **File**: [`clientStorage.js`](file:///d:/project%20management%20system/src/services/clientStorage.js)
- **Concept**: ES6 Promises represent an eventual completion or failure of an asynchronous operation. `async/await` is syntactic sugar over Promises that allows asynchronous code to be read sequentially.
- **Viva explanation**: *"In `clientStorage.js`, we wrap operations in `async` functions and simulate network latency using `new Promise((resolve) => setTimeout(resolve, ms))`. In Phase 2, these exact functions will execute `const res = await fetch('/api/projects');`."*

### 2. React Hooks
- `useState`: Used for local component state (e.g., active modal open/close in [`AppLayout.jsx`](file:///d:/project%20management%20system/src/components/layout/AppLayout.jsx), search inputs in [`ProjectsPage.jsx`](file:///d:/project%20management%20system/src/pages/ProjectsPage.jsx)).
- `useEffect`:
  - Used in [`WorkspaceContext.jsx`](file:///d:/project%20management%20system/src/context/WorkspaceContext.jsx) to load initial tenant data on mount.
  - Used in [`Modal.jsx`](file:///d:/project%20management%20system/src/components/common/Modal.jsx) with a **cleanup function** to remove the keyboard `'keydown'` event listener and restore `document.body.style.overflow`.
- `useMemo`: Used in [`ProjectsPage.jsx`](file:///d:/project%20management%20system/src/pages/ProjectsPage.jsx) and [`KanbanBoardPage.jsx`](file:///d:/project%20management%20system/src/pages/KanbanBoardPage.jsx) to memoize expensive filter computations, re-running only when `searchFilter`, `statusFilter`, or tasks change.
- `useCallback`: Used in [`WorkspaceContext.jsx`](file:///d:/project%20management%20system/src/context/WorkspaceContext.jsx) to stabilize handler functions (`addTask`, `switchWorkspace`) so child components do not re-render unnecessarily.
- **Custom Hooks**:
  - [`useWorkspace.js`](file:///d:/project%20management%20system/src/hooks/useWorkspace.js): Encapsulates context consumption and guards against rendering outside `<WorkspaceProvider>`.
  - [`useDebounce.js`](file:///d:/project%20management%20system/src/hooks/useDebounce.js): Demonstrates combining `useState` and `useEffect` with `clearTimeout` cleanup.

### 3. Props & Prop Drilling vs. React Context
- **Props**: Passed explicitly to reusable primitives (e.g., `variant`, `size`, `isLoading` on [`Button.jsx`](file:///d:/project%20management%20system/src/components/common/Button.jsx)).
- **Prop Drilling Problem**: If we had to pass `activeWorkspace` and `switchWorkspace` down through 5 layers of layout components to reach `WorkspaceSwitcher`, it would lead to fragile, tightly-coupled code.
- **Context API Solution**: [`WorkspaceContext.jsx`](file:///d:/project%20management%20system/src/context/WorkspaceContext.jsx) provides a global subscription mechanism, allowing any nested component to access tenant state via `useWorkspace()`.

### 4. Controlled Components
- Form inputs in [`CreateProjectModal.jsx`](file:///d:/project%20management%20system/src/components/projects/CreateProjectModal.jsx) and [`CreateTaskModal.jsx`](file:///d:/project%20management%20system/src/components/kanban/CreateTaskModal.jsx) have their `value` bound to React state and update via `onChange`, ensuring the single source of truth resides in React state.

### 5. Multi-Tenancy Architecture
- Each tenant workspace has an isolated ID (`ws-acme`, `ws-fintech`, `ws-freelance`).
- Switching workspaces immediately switches the visible projects, team members, metrics, and Kanban boards.
- In Phase 2, the active workspace ID will be transmitted as an HTTP header (`x-tenant-id`) to Node.js/Express.js middleware for backend query partitioning.

---

## 🚀 5. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the Vite development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

Open `http://localhost:5173/` (or port indicated in the terminal) in your browser.
