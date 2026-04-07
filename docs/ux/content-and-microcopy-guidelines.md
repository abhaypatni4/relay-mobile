# Relay — Content and Microcopy Guidelines

## Voice Principles

**Short. Specific. Active.**
Every label, notification, and empty state uses the minimum words needed for full clarity.

**Speak the team's language:**
Use: squad, trip, traveling, match, coach, staff, on the bus
Avoid: participants, journey, session, stakeholders, users

**Confirmations are reassuring, not celebratory.**
**Empty states are invitations, not apologies.**
**Errors do not blame the user.**
**Destructive action copy is honest, not dramatic.**

---

## Button Labels

Always verbs. Always specific.

| Correct | Incorrect |
|---|---|
| "Send selection" | "Selection notification" |
| "Nudge 6 members" | "Send reminder" |
| "Publish trip" | "Submit" |
| "I have this" | "Confirm" |
| "I've got it" | "Acknowledge" |
| "Cancel this trip" | "Delete event" |
| "Resume draft" | "Continue" |
| "Yes, cancel trip" | "Yes" or "OK" |

---

## Push Notification Copy

Format: [Team or Event] + [What happened] + [What's needed]

| Trigger | Copy |
|---|---|
| Trip published | "[Team]: You're on the [Event] trip — tap to see details" |
| Departure time changed | "[Event]: Departure time has changed — tap to re-confirm" |
| Trip cancelled | "[Event] has been cancelled" |
| Trip postponed | "[Event] has been postponed — details updated" |
| Availability window open | "[Event]: Confirm your availability — opens now" |
| Availability locked | "[Event]: Availability is now locked" |
| Selected | "[Event]: You have been selected" |
| Not selected | "[Event]: You are not selected for this event" |
| New acknowledgment-required post | "[Team]: [Post title] — tap to confirm" |
| New general post | "[Team]: New update from [Sender name]" |
| Acknowledgment nudge | "[Team]: You haven't confirmed: [Post title]" |
| Document reminder | "[Event]: Complete your document checklist before departure" |
| Coordinator transfer | "[Team]: [Name] is inviting you to become coordinator" |
| Emergency info prompt (24hr) | "[Team]: Complete your emergency info before your next trip" |

**Notification copy rules:**
- Always identify the team (if user is in multiple teams)
- Always identify the event when relevant
- Always state the required action
- Never generic: "You have a new notification" is never acceptable
- Never alarming language for non-emergency states

---

## Confirmation and Success States

| Action | Confirmation copy |
|---|---|
| Availability submitted | "Got it — Available noted for Saturday's match" |
| Document item confirmed | Checkmark state; no additional text needed |
| Post acknowledged | "Confirmed" (replaces button) |
| Nudge sent | "Reminder sent to 6 members" |
| Trip published | "Trip published. Members will be notified." |
| Selection notifications sent | "Selection notifications sent to 23 members" |
| Coordinator transfer complete | "You're now the coordinator for [Team Name]" |

---

## Error States

| Scenario | Copy |
|---|---|
| Network error on write | "Couldn't save — check your connection and try again." |
| Offline write attempt | "Available when connected" (not an error; a state label) |
| Invitation link expired | "This invite link has expired. Ask your coordinator for a new link." |
| Transfer declined | "Transfer was declined. You're still the coordinator." |
| Availability locked during submission | "Availability is now locked. Your response was not saved." |
| Emergency info not found | "Emergency info not on file for this member." |
| Trip not found (deep link) | "This trip is no longer available." |

---

## Empty States by Screen

| Screen | User | Empty state copy |
|---|---|---|
| Events list | Coordinator | "No upcoming events. Set up your next trip or match." |
| Events list | Player/Staff | "Nothing scheduled yet. Your coordinator will add events here." |
| Feed | All | "No updates yet. Check back when your coordinator posts." |
| Squad list | Coordinator | "No one added to this trip yet." [+ Add Members button] |
| Document checklist | Coordinator | "No documents required for this trip yet. Add items below." |
| Availability roster | Coach | "Availability window is open. Waiting for responses." (0/X) |
| Overdue list | Coordinator | "Everyone has acknowledged." [success state, not empty state] |
| Team roster | Coordinator | "Your team is empty. Invite players and staff to get started." |

---

## Destructive Action Copy

| Action | Dialog title | Body | Confirm button |
|---|---|---|---|
| Cancel trip | "Cancel this trip" | "All assigned members will be notified. This cannot be undone." | "Yes, cancel trip" |
| Remove member | "Remove [Name] from [Team]" | "They'll lose access immediately." | "Remove" |
| Discard draft post | "Discard this draft?" | "Your draft will be deleted." | "Discard draft" |

**Destructive dialog rules:**
- Title is a consequence statement, not a question
- Body is one specific sentence
- Confirm button is a verb (not "Yes" or "OK")
- Cancel button is always "Go back" or native "Cancel"

---

## Offline Indicator

- Banner: "You're offline — showing last saved info"
- Last synced: "Last updated [time] ago"
- Reconnected: "Back online" (toast, 3s auto-dismiss)

---

## Status Labels (Used Verbatim in UI)

### Availability statuses (player-facing)
- Available
- Limited
- Unavailable
- Not Submitted

### Operational statuses (coach/coordinator-facing, NEVER player-facing)
- Selected
- Not Selected
- Traveling
- Medically Restricted
- Unassigned

### Delivery states (coordinator/coach-facing)
- Not Seen
- Seen
- Acknowledged
- Overdue

### Member onboarding states (coordinator-facing)
- Invited
- Profile Incomplete
- Active

### Trip/event states (all roles where visible)
- Draft (coordinator only)
- Upcoming
- Active
- Postponed
- Cancelled
- Complete

---

## Microcopy Rules

- Section labels: sentence case in body; all-caps + letter-spacing only for category markers in lists
- Timestamps: "Last updated 3 days ago" not "Updated: 2024-01-15"
- Counts: "14 of 23 acknowledged" not "14/23"
- Member references: "[Name]" not "the user" or "the player"
- Time format: 12-hour with AM/PM ("9:45 AM" not "09:45")
- Date format: "Saturday, March 15" for near-future; "March 15" for events further out
- Never: "Please", "Sorry", "Oops", "Uh oh", "Woohoo", "Amazing"
- Never use emoji in structural UI labels or status messages
