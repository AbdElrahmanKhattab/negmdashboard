# PRD-05 — MCP Servers: Configuration & Usage Guide
**Project:** EngiTrack
**Version:** 1.0 MVP
**Target IDE:** Antigravity (Claude-powered AI IDE)

---

## Overview

This document defines the three MCP (Model Context Protocol) servers to be configured in Antigravity for building EngiTrack, and maps every major task in the project to the correct MCP server. Using these three servers together creates a complete AI-driven development pipeline:

| Layer | MCP Server | Role |
|---|---|---|
| Backend & Database | **Supabase MCP** | Schema, queries, edge functions, types, storage |
| UI Screen Design | **Stitch MCP** | Full-screen UI generation, design DNA, layout scaffolding |
| React Component Library | **21st.dev Magic MCP** | Individual production-ready React components |

---

## 1. Supabase MCP Server

### 1.1 What It Does

Supabase MCP lets you create tables, generate migrations, query data, manage branches, generate TypeScript types, deploy Edge Functions, and retrieve logs — all through natural language commands in your IDE. It is the backbone of EngiTrack's entire backend.

### 1.2 Configuration

Add to Antigravity's MCP config:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

Replace `YOUR_PROJECT_REF` with the actual Supabase project reference from the dashboard.

**Authentication:** No API key needed. Supabase MCP now uses OAuth by default via dynamic client registration — your MCP client authenticates through a browser-based flow.

### 1.3 Security Rules (Mandatory)

Use the MCP server with a development project, not production. Scope the MCP server to a specific project by setting the `project_ref` parameter in the server URL. This prevents the LLM from accessing other projects in your Supabase account.

- Always use a **development branch** for schema changes — never make migrations directly on main while building
- Enable Supabase branching (Pro plan) so every schema change can be tested before merge
- Once the project goes live: switch to `read_only=true` and make all schema changes manually via reviewed migration files

### 1.4 Available Tool Groups

Supabase MCP tool groups are: `account`, `docs`, `database`, `debugging`, `development`, `functions`, `storage`, and `branching`. All are enabled by default except Storage. Enable Storage explicitly since EngiTrack uses it for receipts, contracts, and invoices.

Recommended URL with Storage enabled:
```
https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&features=database,development,functions,storage,debugging,branching
```

### 1.5 Task Mapping — When to Use Supabase MCP

| Task | What to Ask the Agent |
|---|---|
| Create all tables from PRD-01 | "Use Supabase MCP to create the full EngiTrack schema from PRD-01. Start with `offices`, `users`, then all dependent tables." |
| Enable pg_cron and uuid-ossp | "Enable the pg_cron and uuid-ossp extensions in this Supabase project." |
| Write RLS policies | "Write and apply RLS policies for all EngiTrack tables based on the owner/accountant role matrix in PRD-01 section 3.3." |
| Create Postgres triggers | "Write a trigger that recalculates project health after every milestone status change." |
| Create pg_cron jobs | "Create a pg_cron job that runs daily at 08:00 UTC+2 to check for overdue milestones and update their status to 'late'." |
| ~~Generate TypeScript types~~ | **Not applicable** — project uses plain JavaScript, no type generation needed. Skip this step entirely. |
| Deploy Edge Functions | "Deploy the `generate-invoice` Edge Function from `supabase/functions/generate-invoice/index.ts`." |
| Debug a failing query | "Show me the logs for the `generate-invoice` Edge Function from the last 24 hours." |
| Configure Storage buckets | "Create two private Storage buckets: `receipts` and `contracts`. Set max file size to 10MB." |
| Create a dev branch | "Create a new Supabase branch called `feature/milestone-triggers` for testing the new trigger logic." |

### 1.6 Workflow Pattern for Schema Changes

Always follow this order when making schema changes:

1. Create a new branch: *"Create Supabase branch `schema/[feature-name]`"*
2. Make schema changes on the branch via MCP
3. Test with the dev frontend pointed at the branch URL
4. Merge branch to main: *"Merge branch `schema/[feature-name]` to main"*
5. ~~Generate updated TypeScript types~~ — **Skip. Not applicable for plain JS project.**

---

## 2. Stitch MCP Server (Google Stitch)

### 2.1 What It Does

Stitch is a universal MCP server for Google Stitch that lets you build UI/UX designs instantly with AI. It works seamlessly with Cursor, Claude, Antigravity, and any MCP-compatible editor. Zero config: just login once and it works everywhere.

Key capability: Stitch scans a screen to extract "Design DNA" — fonts, colors, and layouts — which means you can feed it a reference screenshot and it will extract the design system to keep all generated screens consistent.

Stitch generates **full screens and layouts** (not individual components). Use it when you need to visualize what a whole page looks like before building it.

### 2.2 Configuration

**Prerequisites:**
1. Create a Google Cloud project
2. Enable the Stitch API on that project

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default set-quota-project YOUR_PROJECT_ID

# Enable Stitch
gcloud beta services mcp enable stitch.googleapis.com
```

Add to Antigravity's MCP config:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

**Cost:** Free — Google Stitch API is free to use.

### 2.3 Task Mapping — When to Use Stitch MCP

Use Stitch at the **start of each page build**, before writing React code. Generate the screen first, validate the layout, then hand it off to 21st.dev Magic to build the components.

| Page | What to Ask the Agent |
|---|---|
| Dashboard | "Use Stitch to generate a full dashboard screen for an engineering office management system. Dark theme, IBM Plex fonts, KPI cards in a top row, revenue/expense chart below, overdue milestones list on the right." |
| Client detail | "Use Stitch to generate a client detail screen showing a list of projects with health badges, financial summaries per project, and a top summary bar." |
| Project detail | "Use Stitch to generate a project detail page with a header showing health badge and contract value, tabs for Milestones, Comments, Activity, and Timeline." |
| Milestones list | "Use Stitch to generate a milestones list view with cards showing payment progress bars, status badges, and amounts in monospaced font." |
| Transactions log | "Use Stitch to generate a transactions log page with a filter bar, summary strip showing total income/expenses/net, and a full-width data table." |
| Client share page | "Use Stitch to generate a clean, minimal public client-facing project status page. Light theme, office logo at top, milestone list with paid/pending icons, invoice download buttons." |
| Settings page | "Use Stitch to generate a settings page with sections for Office Profile, Team Members, and Notifications." |

**Design DNA extraction workflow:**
After generating the first screen (Dashboard), extract the design DNA:
> *"Use Stitch to extract the Design DNA from the Dashboard screen I just generated — fonts, colors, spacing, and component patterns. We'll use this as the reference for all subsequent screens."*

Then reference it in every subsequent Stitch prompt:
> *"Use the same Design DNA from the Dashboard to generate the Client detail screen."*

### 2.4 Stitch → React Handoff

After generating a screen with Stitch:
1. Review the generated HTML/CSS output
2. Identify the individual components that need to be built (cards, tables, badges, etc.)
3. Extract the layout structure
4. Switch to 21st.dev Magic MCP to build each component properly in React/TypeScript

---

## 3. 21st.dev Magic MCP Server

### 3.1 What It Does

21st.dev Magic MCP is a powerful AI-driven tool that helps developers create beautiful, modern UI components instantly through natural language descriptions. It integrates seamlessly with popular IDEs and provides a streamlined workflow for UI development.

You can describe what you need, get multiple variations with different styles, and pick the best one. Every variation is fully functional with clean TypeScript, proper props, and responsive design out of the box.

Key features:
- Generates React components directly into your project (.jsx, plain JavaScript)
- Follows your existing code style and structure
- SVGL integration: access to a vast collection of professional brand assets and logos
- Always specify "plain JavaScript, no TypeScript, .jsx file" in every prompt
- Trigger with `/ui` followed by your description in the agent chat

### 3.2 Configuration

**Step 1:** Get an API key from [21st.dev/magic](https://21st.dev/magic)

**Step 2:** Add to Antigravity's MCP config:

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"YOUR_API_KEY\""]
    }
  }
}
```

### 3.3 Task Mapping — When to Use 21st.dev Magic MCP

Use 21st.dev Magic for **individual reusable React components**. Always reference the EngiTrack design system (PRD-04 tokens) when prompting.

Trigger syntax: `/ui [description]`

| Component | Prompt |
|---|---|
| `<StatusBadge>` | `/ui a minimal status badge component for 'paid', 'pending', 'late' states. Dark theme, dot + text, no background fill, colors: green-500/gray-500/red-500` |
| `<HealthBadge>` | `/ui a project health badge pill, three variants: Good (green filled), Warning (amber filled), Critical (red filled). Shows emoji + text.` |
| `<KPICard>` | `/ui a KPI card for a financial dashboard. Shows icon, label, large monospaced number, and trend arrow with percentage. Dark theme, IBM Plex Mono for numbers.` |
| `<MilestoneCard>` | `/ui a milestone card component showing name, status badge, deadline, amount in monospaced font, payment progress bar, and action buttons for 'Add Payment' and 'Generate Invoice'. Dark theme.` |
| `<ProjectCard>` | `/ui a project card for a list view showing client name, project name, health badge in top right corner, budget in mono font, status, milestone count, and a payment progress bar.` |
| `<AmountDisplay>` | `/ui a numeric amount display component using monospaced font. Supports income (green), expense (red), neutral (default) color variants and sm/md/lg sizes. Shows currency prefix 'EGP'.` |
| `<CommentThread>` | `/ui a threaded comment component with user avatar (initials-based), comment text, timestamp, reply button, and indented reply thread below. Dark theme.` |
| `<ActivityFeed>` | `/ui an activity feed timeline component. Vertical line on left, user avatar circles with initials, action text, relative timestamp. System events in grey italics.` |
| `<NotificationDropdown>` | `/ui a notification dropdown panel triggered by a bell icon. Shows unread count badge, scrollable list of notifications with icon, title, body preview, and relative time. 'Mark all read' button at top. Dark theme.` |
| `<PaymentProgressBar>` | `/ui a payment progress bar component showing paid vs total amount. Filled track in green, unfilled in dark grey, percentage label and 'EGP X / EGP Y' text below.` |
| Empty states | `/ui a minimal empty state component. Centered icon, heading text, subtext, optional CTA button. Dark theme, clean and simple.` |
| Data table | `/ui a data table component with sortable column headers, filter bar row above, row hover states, and a summary strip at the top. Dark theme, monospaced numbers in amount columns.` |

### 3.4 Component Enhancement Workflow

After generating a component:
1. Review the output in the project
2. Apply EngiTrack's CSS variables from PRD-04 to the generated component
3. Add Framer Motion animations where specified in PRD-04 section 6
4. Connect to TanStack Query hooks from `src/hooks/`
5. Wire to Supabase client calls

---

## 4. Full MCP `.mcp.json` Config for Antigravity

Place this as `.mcp.json` in the root of the EngiTrack project:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&features=database,development,functions,storage,debugging,branching"
    },
    "stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "YOUR_GCP_PROJECT_ID"
      }
    },
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"YOUR_21ST_API_KEY\""]
    }
  }
}
```

Replace:
- `YOUR_PROJECT_REF` → Supabase project reference (found in Supabase dashboard → Settings → API)
- `YOUR_GCP_PROJECT_ID` → Google Cloud project ID
- `YOUR_21ST_API_KEY` → API key from 21st.dev/magic console

---

## 5. Development Workflow — Which MCP to Call When

This is the recommended sequence for building each new page in EngiTrack:

```
PHASE 1 — BACKEND (Supabase MCP)
  ↓ Create / verify tables for this page
  ↓ Write RLS policies
  ↓ Add any triggers or pg_cron jobs needed
  ↓ Generate/update TypeScript types

PHASE 2 — SCREEN DESIGN (Stitch MCP)
  ↓ Generate full-screen layout for the page
  ↓ Review layout, extract components list
  ↓ Confirm design DNA consistency with existing screens

PHASE 3 — COMPONENT BUILD (21st.dev Magic MCP)
  ↓ Build each component identified in Phase 2 using /ui prompts
  ↓ Apply EngiTrack CSS variables and Framer Motion
  ↓ Compose components into the page layout

PHASE 4 — WIRING (Manual code + Supabase MCP)
  ↓ Connect components to TanStack Query hooks
  ↓ Wire hooks to Supabase client calls
  ↓ Use Supabase MCP to debug query issues and check logs
```

---

## 6. Per-Feature MCP Assignments

| Feature (from PRD-01 to PRD-03) | Supabase MCP | Stitch MCP | 21st Magic MCP |
|---|---|---|---|
| Full database schema | ✅ Create all tables | — | — |
| RLS policies | ✅ Apply policies | — | — |
| Auth + invite flow | ✅ Configure Auth | — | — |
| Dashboard page | ✅ Query KPIs | ✅ Generate layout | ✅ KPICard, Charts, ActivityFeed |
| Clients list + detail | ✅ CRUD queries | ✅ Generate screens | ✅ ProjectCard, StatusBadge |
| Project detail page | ✅ Milestone queries | ✅ Generate layout | ✅ MilestoneCard, HealthBadge, Tabs |
| Payment recording | ✅ Insert payment + trigger | — | ✅ PaymentForm, ProgressBar |
| Transactions log | ✅ Query + filter | ✅ Generate layout | ✅ DataTable, AmountDisplay |
| Comments (threaded) | ✅ Realtime subscription | — | ✅ CommentThread |
| Activity log | ✅ Triggers for all tables | — | ✅ ActivityFeed |
| Notification bell | ✅ Realtime on `notifications` | — | ✅ NotificationDropdown |
| PDF Invoice | ✅ Deploy Edge Function | — | — |
| Timeline view | — | ✅ Generate timeline screen | ✅ TimelineView SVG component |
| Client share page | ✅ Public RLS policy | ✅ Generate clean public layout | ✅ Share-specific components |
| pg_cron jobs | ✅ Create cron jobs | — | — |
| ~~TypeScript types~~ | **N/A — plain JS project** | — | — |
| Storage (receipts/contracts) | ✅ Configure buckets | — | — |

---

## 7. Important Notes for Antigravity

1. **Never run Supabase MCP against the production database.** Always scope to a dev project or branch.

2. **When using Stitch, always specify the design system.** Include dark theme, IBM Plex fonts, and the specific color hex values from PRD-04 in every Stitch prompt to maintain visual consistency across screens.

3. **When using 21st.dev Magic, always include EngiTrack context.** Mention: dark theme, IBM Plex Mono for numbers, EGP currency prefix, Tailwind + shadcn/ui stack, and Framer Motion support.

4. ~~**Generate TypeScript types after every schema change.**~~ **Not applicable** — this project uses plain JavaScript. Skip this step entirely. No type generation needed.

5. **The three servers are complementary, not competitive.** Don't use 21st.dev Magic for full-page layouts (that's Stitch's job). Don't use Stitch for individual reusable components (that's Magic's job). Don't write raw SQL manually when Supabase MCP can do it (and auto-handles migrations).

6. **Always tell 21st.dev Magic the project is plain JavaScript.** Add this to every `/ui` prompt: *"plain JavaScript, no TypeScript, .jsx file, no type annotations."* Otherwise it will default to TypeScript output.