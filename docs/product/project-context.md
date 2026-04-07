# Relay — Project Context

## What Is Relay

Relay is a mobile-first team coordination platform for college sports teams and small competitive traveling teams. It replaces fragmented coordination across WhatsApp, spreadsheets, and verbal handoffs with a structured, role-aware, confirmation-native system.

The product is organized around three end-to-end workflows:
1. Trip coordination (travel logistics, documents, emergency info)
2. Player availability and selection (submission, decision, notification)
3. Structured team communication (role-filtered feed, delivery states)

## What Relay Is Not

- Not a chat or messaging app
- Not a performance analytics or GPS tracking tool
- Not a medical records system
- Not a scouting or recruitment platform
- Not a fan-facing or media product
- Not a financial or payroll tool
- Not a general-purpose project management tool

## Platform

- Primary: iOS and Android native mobile app (mobile-first)
- MVP: Mobile only
- Post-MVP: Web support for coordinator-heavy planning workflows may be added where genuinely justified. Do not default to desktop-first patterns.

## Target Segment

- College sports teams (primary)
- Small competitive traveling sports teams
- Typical event: 20–30 participants (18–25 players + small staff)
- USA market; English only in MVP
- Minimum coordination threshold: 18+ participants per event

## Locked Assumptions (Do Not Reopen Without Explicit Decision)

| # | Assumption |
|---|---|
| 1 | Target: college and competitive traveling teams; not elite pro, not casual rec |
| 2 | MVP = single team only; multi-entity is post-MVP |
| 3 | Commercial model not constrained in MVP |
| 4 | USA primary market; US English, US privacy baseline |
| 5 | Greenfield product; no forced third-party integrations in MVP |
| 6 | Mobile-first; iOS and Android required from launch |
| 7 | Travel group: 20–30 per event default complexity |
| 8 | Design around responsibilities, not job titles |
| 9 | MVP supports same-day and overnight travel |
| 10 | Replaces fragmented patchwork tools; not enterprise software |
| 11 | Player UX: low friction, fast, lightweight, obviously useful |
| 12 | One primary coordinator per workflow; collaboration-capable |
| 13 | Player actions: view, acknowledge, confirm, submit only when workflow-critical |
| 14 | Non-response: light escalation; not seen/seen/acted/overdue; not punitive |
| 15 | Role-based visibility; no clinical data stored; MVP = readiness states only |
| 16 | Availability: 3 player states + staff operational states; no clinical system |
| 17 | Pending/invited player state: workflows don't collapse |
| 18 | Emergency info: name, number, allergy/alert, note, last-updated timestamp only |
| 19 | Structured feed = sole communication channel; no general chat |
| 20 | Coordinator-led onboarding tied to real live workflow |
| 21 | Event cadence: light prompting; no aggressive reminders |
| 22 | Trip states: Cancelled + Postponed supported in MVP |
| 23 | Coordinator handoff: preserves all history and state |
| 24 | Offline: read-only cached access to itinerary, squad, emergency info, critical updates |
| 25 | iOS typeface: SF Pro; no custom typeface in MVP |
| 26 | Dark mode: designed now; light mode is MVP launch surface |
| 27 | Android icons: outlined style matched to iOS direction |
| 28 | Motion: reduced-motion compliant; functional only |
| 29 | Tokens: shared design-to-engineering aligned naming |
| 30 | Trip Detail: single scrollable page; no tabbed sub-navigation |
| 31 | Availability submission: full-screen focused flow |
| 32 | Home: role-aware; anchored to most relevant workflow; useful in non-travel weeks |
| 33 | Post drafts: auto-saved |
| 34 | Operational state picker: native platform bottom sheet |

## Active Product Principles

1. **End-to-end workflow completeness** — no half-built workflow slices that push users back to WhatsApp
2. **Player experience as adoption constraint** — value-receiving, not admin-completing
3. **Operational continuity as MVP quality requirement** — cancellation, handoff, offline are not polish
4. **Minimal internal navigation** — single strong workspace over nested layers
5. **MVP implementation priority** — consistency and legibility over brand flourishes

## Working Product Name

**Relay** (fallback: Muster)
Trademark and domain validation to run in parallel. Do not let naming status block development.

## Documentation Map

| File | Purpose |
|---|---|
| docs/product/project-context.md | This file — orientation and locked assumptions |
| docs/product/product-thesis-and-goals.md | Why this product exists; success metrics |
| docs/product/user-roles-and-jtbd.md | Who uses it and what they need |
| docs/product/mvp-scope.md | Exact MVP boundaries — in/out/later/never |
| docs/product/prd.md | Full product requirements |
| docs/product/problem-inventory-and-prioritization.md | Problems solved and why |
| docs/ux/user-flows.md | Step-by-step flows for every major workflow |
| docs/ux/screen-inventory.md | Every screen defined |
| docs/ux/information-architecture.md | App structure and navigation |
| docs/ux/content-and-microcopy-guidelines.md | All copy, labels, error messages |
| docs/design/design-system-direction.md | Visual and interaction system |
| docs/design/brand-foundation.md | Name, voice, visual identity |
| docs/design/component-inventory.md | All reusable UI components |
| docs/engineering/domain-models.md | Data entities and TypeScript interfaces |
| docs/engineering/roles-and-permissions.md | Permission matrix |
| docs/engineering/frontend-architecture.md | App architecture approach |
| docs/engineering/backend-assumptions-and-api-needs.md | API surface and data needs |
| docs/engineering/notifications-and-alerts.md | Push notification system |
| docs/engineering/analytics-events-and-metrics.md | Instrumentation |
| docs/engineering/qa-edge-cases-and-failure-states.md | Edge cases and failure modes |
| docs/engineering/architecture-decisions.md | Key decisions and rationale |
| docs/execution/engineering-build-sequence.md | Build phases and mock data strategy |
| docs/execution/milestone-task-plan.md | 42-task ordered plan |
| docs/execution/task-board.md | Detailed task-by-task execution board |
| docs/execution/first-usable-slice.md | First slice definition and success criteria |
