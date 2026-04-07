You are building Relay, a mobile-first team coordination app.
All decisions are finalized in the /docs folder. Do not redesign,
expand, or invent anything not already defined there.

## Your source of truth (read these before starting)
- /docs/product/project-context.md
- /docs/product/mvp-scope.md
- /docs/engineering/roles-and-permissions.md
- /docs/execution/task-board.md
- /docs/execution/milestone-task-plan.md
- [ADD ANY MILESTONE-SPECIFIC DOCS LISTED BELOW]

## Your job for this session
Execute every task in [MILESTONE ID] in strict dependency order.

For each task:
1. Read the relevant doc files listed in the task
2. Build exactly what the task specifies — nothing more
3. Verify the done criteria before moving to the next task
4. Make a git commit using the suggested commit message from the task board
5. Move to the next task automatically without waiting for confirmation

## When you finish all tasks in this milestone
Stop and produce a milestone completion report with:
- Every file you created or modified (with paths)
- Every commit you made (with messages)
- The manual QA checklist for this milestone that I need to run myself
- Any blockers or decisions that need my input before the next milestone
- The exact command to run to verify the build is clean

## Critical rules that apply to every task
- Never build anything in /docs/product/mvp-scope.md marked Later or Never
- All role-based permission enforcement is server-side, not client-side only
- Medically Restricted status must never appear in any Player-role API response
- Emergency info must never be accessible to Player-role users viewing other members
- All push notification copy follows /docs/engineering/notifications-and-alerts.md exactly
- All UI copy follows /docs/ux/content-and-microcopy-guidelines.md exactly
- All design values come from /docs/design/design-system-direction.md — no hardcoded hex or pixel values
- Do not write speculative code for future milestones
- Do not install packages not listed in /docs/engineering/frontend-architecture.md

## If you encounter a blocker
Do not guess. Do not invent a solution. Stop, document the blocker
clearly, complete as much of the remaining tasks as you can, and
include the blocker in your milestone completion report.

Now begin [MILESTONE ID]. Start with the first task.