/**
 * Multi-Tenant Workspaces Initial Structure
 * 
 * Tenants start with zero pre-populated projects or tasks so that all projects
 * and tasks are created dynamically by the user through the UI ("New Project", "New Task").
 * 
 * This showcases:
 * 1. Realistic empty states across Dashboard, Project Listing, and Kanban board
 * 2. True user-driven CRUD operations without pre-hardcoded dummy projects
 * 3. Multi-tenant workspace data isolation in its cleanest form
 */

export const INITIAL_WORKSPACES = [
  {
    id: "ws-acme",
    name: "Acme Cloud Innovations",
    slug: "acme-cloud",
    plan: "Enterprise",
    color: "#4f46e5", // Indigo
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    description: "Enterprise workspace for cloud infrastructure, core platform services, and devops tooling.",
    membersCount: 5,
    currentUserRole: "Workspace Admin",
    createdAt: "2024-01-15",
    members: [
      { id: "m-1", name: "Alex Morgan", email: "alex.m@acme.io", role: "Owner", avatar: "AM", status: "Active" },
      { id: "m-2", name: "Priya Sharma", email: "priya.s@acme.io", role: "Admin", avatar: "PS", status: "Active" },
      { id: "m-3", name: "David Kim", email: "david.k@acme.io", role: "Member", avatar: "DK", status: "Active" },
      { id: "m-4", name: "Sarah Chen", email: "sarah.c@acme.io", role: "Member", avatar: "SC", status: "Offline" },
      { id: "m-5", name: "Marcus Reed", email: "marcus.r@acme.io", role: "Member", avatar: "MR", status: "Active" },
    ],
    projects: [],
    tasks: [],
    activities: [],
  },
  {
    id: "ws-fintech",
    name: "Nexus FinTech Labs",
    slug: "nexus-fintech",
    plan: "Pro Team",
    color: "#059669", // Emerald
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Fintech workspace dedicated to cross-border settlement, compliance rails, and algorithmic fraud detection.",
    membersCount: 3,
    currentUserRole: "Product Manager",
    createdAt: "2024-03-20",
    members: [
      { id: "m-10", name: "Elena Rostova", email: "elena@nexusfin.com", role: "Owner", avatar: "ER", status: "Active" },
      { id: "m-11", name: "Zack Taylor", email: "zack@nexusfin.com", role: "Admin", avatar: "ZT", status: "Active" },
      { id: "m-12", name: "Kavita Patel", email: "kavita@nexusfin.com", role: "Member", avatar: "KP", status: "Offline" },
    ],
    projects: [],
    tasks: [],
    activities: [],
  },
  {
    id: "ws-freelance",
    name: "Studio Zero Digital",
    slug: "studio-zero",
    plan: "Starter",
    color: "#d97706", // Amber
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Boutique creative agency workspace for branding, UX prototypes, and mobile app design.",
    membersCount: 2,
    currentUserRole: "Lead Designer",
    createdAt: "2024-05-10",
    members: [
      { id: "m-30", name: "Liam Vance", email: "liam@studiozero.design", role: "Owner", avatar: "LV", status: "Active" },
      { id: "m-31", name: "Chloe Bennett", email: "chloe@studiozero.design", role: "Member", avatar: "CB", status: "Active" },
    ],
    projects: [],
    tasks: [],
    activities: [],
  }
];
