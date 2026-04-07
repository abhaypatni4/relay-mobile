# Relay — Roles and Permissions

## Role Hierarchy

Coordinator > Coach > Staff > Player

- A user holds one role per team
- A user can be a member of multiple teams (different roles per team)
- Emergency info is shared across teams (one profile per user account)

## Critical Security Rules

1. **All permission enforcement is SERVER-SIDE**, not client-side only
2. Client-side role filtering is a UX layer, not a security layer
3. Role is scoped per team — a user's role in Team A does not affect their role in Team B
4. Coordinator is always a single role per team (one coordinator per team)
5. **Emergency info access is logged** regardless of read-only nature
6. **Medically Restricted status is a server-side enforcement** — clients cannot expose it to players regardless of UI state
7. The AvailabilitySubmission serializer MUST strip operationalStatus for all Player-role API responses

---

## Permission Matrix

| Capability | Coordinator | Coach | Staff | Player |
|---|---|---|---|---|
| **Team Management** | | | | |
| Create team | ✓ | — | — | — |
| Edit team name/details | ✓ | — | — | — |
| Invite members | ✓ | — | — | — |
| Remove members | ✓ | — | — | — |
| Transfer coordinator role | ✓ | — | — | — |
| Accept coordinator transfer | — | ✓ | ✓ | — |
| Regenerate invitation link | ✓ | — | — | — |
| **Event Management** | | | | |
| Create events | ✓ | — | — | — |
| Edit events (non-critical fields) | ✓ | — | — | — |
| Edit critical fields (triggers re-ack) | ✓ | — | — | — |
| Cancel event | ✓ | — | — | — |
| Postpone event | ✓ | — | — | — |
| Mark event complete | ✓ | — | — | — |
| View upcoming events | ✓ | ✓ | ✓ | ✓ |
| View past events | ✓ | ✓ | ✓ | ✓ |
| **Trip Workspace** | | | | |
| Create trip workspace | ✓ | — | — | — |
| Edit itinerary | ✓ | — | — | — |
| View itinerary | ✓ | ✓ | ✓ | ✓ (traveling only) |
| Acknowledge itinerary | — | — | — | ✓ |
| Assign trip squad | ✓ | — | — | — |
| View squad list (full operational) | ✓ | ✓ | ✓ | — |
| View squad list (names/roles only) | — | — | — | ✓ |
| Define document checklist | ✓ | — | — | — |
| Confirm document items (own) | ✓ | ✓ | ✓ | ✓ |
| View document status (all members) | ✓ | ✓ | — | Own only |
| Send document reminder | ✓ | — | — | — |
| View pre-departure checklist | ✓ | — | — | — |
| Mark custom checklist items | ✓ | — | — | — |
| **Emergency Info** | | | | |
| View own emergency info | ✓ | ✓ | ✓ | ✓ |
| Edit own emergency info | ✓ | ✓ | ✓ | ✓ |
| View OTHER members' emergency info | ✓ | ✓ | ✓ | **NEVER** |
| Access emergency info during trip | ✓ | ✓ | ✓ | **NEVER** |
| Prompt member to update emergency info | ✓ | — | — | — |
| **Availability and Selection** | | | | |
| Open availability window | ✓ | ✓ | — | — |
| Submit own availability | — | — | — | ✓ |
| View all player availability statuses | ✓ | ✓ | — | — |
| View own availability status | — | — | — | ✓ |
| Set operational status (Selected etc.) | ✓ | ✓ | — | — |
| Set Medically Restricted | ✓ | — | ✓ | — |
| View Medically Restricted status | ✓ | ✓ | ✓ | **NEVER** |
| Lock availability window | ✓ | ✓ | — | — |
| Send selection notifications | ✓ | ✓ | — | — |
| View own selection status | — | — | — | ✓ |
| **Communication** | | | | |
| Create posts | ✓ | ✓ | — | — |
| Pin posts | ✓ | — | — | — |
| Delete own posts (grace period) | ✓ | ✓ | — | — |
| View feed (role-filtered) | ✓ | ✓ | ✓ | ✓ |
| Acknowledge posts | ✓ | ✓ | ✓ | ✓ |
| View delivery states (own posts) | ✓ | ✓ (own) | — | — |
| View delivery states (all posts) | ✓ | — | — | — |
| Send nudge | ✓ | ✓ (own posts) | — | — |
| **Profile** | | | | |
| Edit own profile | ✓ | ✓ | ✓ | ✓ |
| View team roster (full with states) | ✓ | ✓ | ✓ | — |
| View team roster (names/roles) | — | — | — | ✓ |

---

## API Middleware Chain

Every endpoint uses these layers in order:

**Layer 1 — authenticate:** Validates JWT, attaches req.user (userId, email)

**Layer 2 — requireTeamMember:** Validates user is an active member of the team in route params, attaches req.member (TeamMember record including role). Pending members return 403 for all routes except invitation acceptance.

**Layer 3 — requireRole (where needed):** Validates req.member.role is in the allowed set. Returns 403 if not.

**Serializer layer:** Response serializers strip fields based on req.member.role. Always applied AFTER middleware layers.

---

## Critical Serializer Rules

### TeamMember Serializer
- If req.member.role === 'player': strip emergencyInfo entirely (field absent, not null)
- If req.member.role === 'coordinator', 'coach', or 'staff': include emergencyInfo

### AvailabilitySubmission Serializer
- If req.member.role === 'player': strip operationalStatus and operationalStatusSetBy entirely (field absent, not null)
- The string 'medicallyRestricted' must NEVER appear in any Player-role API response body
- This must be tested with an explicit integration test before the availability feature ships

---

## Role Utility Functions (Client-Side — UX Only)

These functions are used in components for conditional rendering. They are NOT security enforcement.

```
canCreatePosts(role: Role): boolean
  → true for coordinator, coach; false for staff, player

canViewDeliveryStates(role: Role): boolean
  → true for coordinator, coach; false for staff, player

canSetOperationalStatus(role: Role): boolean
  → true for coordinator, coach; false for staff, player

canSetMedicallyRestricted(role: Role): boolean
  → true for coordinator, staff; false for coach, player

canViewEmergencyInfo(role: Role): boolean
  → true for coordinator, coach, staff; false for player

canViewAllAvailability(role: Role): boolean
  → true for coordinator, coach; false for staff, player

canManageTrip(role: Role): boolean
  → true for coordinator only; false for all others

canAccessTeamSettings(role: Role): boolean
  → true for coordinator only; false for all others
```

---

## Edge Cases

- If Coordinator removes themselves from team without transferring: system prompts transfer first; if no eligible member, team archives with data preserved
- If Coach is the only other eligible member and Coordinator transfers to them: Coach gains Coordinator role; previous Coordinator reverts to Coach (or declared role)
- Pending members: can be included in trip squad; all actions blocked until Active state; shown with indicator
- Dual role (coordinator who is also the head coach): single account, Coordinator role encompasses Coach permissions
- User in two teams: role is scoped per team; switching teams requires explicit action; emergency info is shared (one profile)
