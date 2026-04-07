# Relay — Screen Inventory

## Screen Reference Convention
S-XX: Screen number. Each screen maps to one or more routes in the frontend router.

---

## S-01: Splash / App Launch
**Purpose:** Initial load; auth state determination; brand moment
**Primary user:** All
**Key info:** Relay wordmark, loading indicator
**Main actions:** None (auto-transitions)
**States:** Loading (max 3s); deep-link destination loading (faster transition)
**Edge cases:** If load >3s, show cached home with loading indicator rather than holding on splash

---

## S-02: Account Creation
**Purpose:** New user creates Relay account
**Primary user:** All
**Key info:** Name, phone/email, password (or magic link)
**Main actions:** Create account, Continue with invitation link
**States:** Empty, Validation error (inline field-level), Loading, Success
**Edge cases:** Phone number already registered → prompt to log in; invitation link pre-fills name

---

## S-03: Login
**Purpose:** Returning user authentication
**Primary user:** All
**Key info:** Phone/email, password or magic link
**Main actions:** Log in, Forgot password, Create account
**States:** Empty, Error (wrong credentials), Loading, Success
**Edge cases:** Account locked → clear recovery path

---

## S-04: Create Team
**Purpose:** First-time coordinator creates team
**Primary user:** Coordinator
**Key info:** Team name (required), sport (optional), home location (optional)
**Main actions:** Create team, Back
**States:** Empty, Validation (name required), Loading, Success → Create First Event
**Edge cases:** Mid-form exit → no team created; return to this screen on next open

---

## S-05: Create / Edit Event
**Purpose:** Coordinator creates a new event or edits an existing one
**Primary user:** Coordinator
**Key info:** Event type selector (Trip / Match / Training), name, date, start time, location
**Main actions:** Continue (new) or Save changes (edit), Cancel / Back
**States:** Empty (new), Pre-filled (edit), Validation errors, Loading
**Role differences:** Coordinator only
**Edge cases:** Editing published event → note that changes may notify members; critical field edits trigger re-acknowledgment

---

## S-06: Trip Itinerary Builder
**Purpose:** Coordinator builds full trip itinerary
**Primary user:** Coordinator
**Key info:** Critical Fields (required): Departure Time, Departure Meeting Point; Standard fields (optional): all others
**Main actions:** Save and continue, Skip optional sections, Back
**States:** Empty (new), Partially filled, Complete, Edit mode (post-publish with warning)
**Edge cases:** Save with only Critical Fields → acceptable; post-acknowledgment critical field update triggers re-acknowledgment flow

---

## S-07: Squad Selection (Trip)
**Purpose:** Coordinator selects which members are traveling
**Primary user:** Coordinator
**Key info:** Full roster, traveling status per member, onboarding state
**Main actions:** Toggle traveling status, Select all, Deselect all, Save and continue
**States:** Empty, Partially selected, Fully assigned, Pending members indicated, Offline (read-only)
**Edge cases:** Pending member included → "Awaiting app setup" indicator

---

## S-08: Document Checklist Builder
**Purpose:** Coordinator defines required documents for trip
**Primary user:** Coordinator
**Key info:** Existing items, suggested document types, applicability per item
**Main actions:** Add item, Edit item, Remove item, Skip, Save
**States:** Empty, Populated, Edit mode
**Edge cases:** Adding item after trip published → push notification sent to affected players

---

## S-09: Trip Review and Publish
**Purpose:** Coordinator reviews complete trip before publishing
**Primary user:** Coordinator
**Key info:** Itinerary summary (key fields), squad count, document item count, who will be notified
**Main actions:** Publish, Edit [section], Save as draft
**States:** Complete (publish enabled), Incomplete (publish disabled with reason), Draft
**Edge cases:** Pending members in squad → note shown about notification exclusion

---

## S-10: Home — Coordinator
**Purpose:** Operational at-a-glance view
**Primary user:** Coordinator
**Key info:** Active trip card (within 48hrs or active), outstanding action items, next upcoming event, unread feed count
**Main actions:** Open active trip, Create new event, View overdue items, Open feed
**States:** Active trip (trip card prominent), No upcoming events (create prompt), Multiple upcoming (list), All clear (no outstanding items)
**Edge cases:** Two simultaneous active trips → both shown with clear labels

---

## S-11: Home — Player
**Purpose:** Personal relevance view
**Primary user:** Player
**Key info:** Selection status for next event, active trip card (if traveling), availability prompt, unread feed count
**Main actions:** View trip details, Submit availability, View feed, Acknowledge outstanding post
**States:** Selected + traveling (trip card prominent), Not selected (neutral), No selection yet, No upcoming events
**Edge cases:** Player selected but itinerary not yet acknowledged → acknowledgment prompt shown on home card

---

## S-12: Home — Coach
**Purpose:** Decision-making view
**Primary user:** Coach
**Key info:** Availability summary for next event, outstanding selection decisions, upcoming event details, unread feed
**Main actions:** View availability roster, Set selection, View feed
**States:** Availability window open (roster prompt prominent), Selection complete, No decisions needed
**Edge cases:** Multiple events with open availability → both shown with labels

---

## S-13: Events List
**Purpose:** All upcoming and past events
**Primary user:** All
**Key info:** Events chronologically, type indicator, status badge
**Main actions:** Tap event → Event Detail or Trip Detail, Create new event (coordinator only)
**States:** Populated, Empty upcoming (role-appropriate message), Cancelled events (with label), Postponed events (with label)
**Edge cases:** Past events collapsed by default; tap section header to expand

---

## S-14: Event Detail — Match or Training
**Purpose:** Overview of non-trip event; availability hub
**Primary user:** All
**Key info:** Event name, date, time, location; availability section (role varies); linked posts
**Main actions:** Submit/update availability (player), Open availability roster (coach), View linked posts
**States:** Availability open, Availability locked, Selection notified, Cancelled, Postponed
**Role differences:** Player: own availability; Coach/Coordinator: full squad roster; Staff: event info + posts
**Edge cases:** Availability window closes while player on screen → locked state transition

---

## S-15: Trip Detail (Trip Workspace Hub)
**Purpose:** Central hub for all trip coordination — single scrollable page
**Primary user:** All (different depths by role)
**Structure:** Single ScrollView with section hierarchy:
  1. Trip header (name, dates, status, key actions)
  2. Itinerary section (S-16 inline)
  3. Squad List section (S-17 inline)
  4. Document Checklist section (S-19 inline)
  5. Pre-Departure Checklist (coordinator only) (S-20 inline)
**Key info by role:**
- Coordinator: full workspace + edit controls + checklist status
- Coach: itinerary + squad with operational states + emergency access
- Staff: itinerary + squad + emergency access + own doc items
- Player: personal itinerary card + own document checklist + acknowledgment controls
**States:** Draft (coordinator only), Active pre-trip, Day-of-travel (emergency info elevated), Active in-travel, Complete, Cancelled, Postponed
**Edge cases:** Offline → all cached fields readable; write actions disabled with label

---

## S-16: Itinerary Section (within S-15)
**Purpose:** Trip logistics for all; edit surface for coordinator
**Primary user:** Player (read), Coordinator (read + edit)
**Key info:** All itinerary fields; acknowledgment status; critical field change indicator
**Main actions:** Player: acknowledge (sticky button, required for critical fields); Coordinator: edit fields, view acknowledgment counts per field
**States:** Unacknowledged (button visible), Acknowledged (confirmed state), Critical field updated (re-acknowledgment prompt above fold), Offline (readable, no edits)

---

## S-17: Squad List Section (within S-15)
**Purpose:** Who is traveling; emergency info access point
**Primary user:** Coordinator/Coach/Staff (full); Player (names and roles only)
**Key info:** Coordinator/Coach/Staff: name, role, traveling status, onboarding state, emergency info access; Player: name, role only
**Main actions:** Coordinator: toggle traveling status; Coach/Staff/Coordinator: tap member → emergency info; Player: tap member → name/role only
**Edge cases:** Player taps staff member → name and role only; no emergency info exposed to players for others

---

## S-18: Emergency Info Card
**Purpose:** Player's emergency info for authorized staff during travel
**Primary user:** Coordinator, Coach, Staff
**Key info:** Contact Name, Contact Phone (tappable), Allergy/Alert (prominent), Staff Note, Last Updated
**Main actions:** Tap phone → native dialer, Back to squad list
**States:** Complete, Incomplete (missing fields show "Not provided"), Stale (>180 days — amber flag), Offline (all fields readable from cache)
**Edge cases:** Malformed phone → plain text + "Call manually"; no emergency info on file → "Emergency info not on file"

---

## S-19: Document Checklist Section (within S-15)
**Purpose:** Document confirmation tracking
**Primary user:** Coordinator (all members), Player (own items)
**Key info:** Coordinator: all items, per-item confirmation count; Player: own items, confirmed/pending
**Main actions:** Player: tap to confirm ("I have this"); Coordinator: add/remove items, send reminder, view per-player breakdown
**States:** All confirmed, Outstanding items (count shown), Pending member items (with note), Post-lock (not editable)

---

## S-20: Pre-Departure Checklist (Coordinator only)
**Purpose:** Coordinator final readiness check before departure
**Primary user:** Coordinator only
**Key info:** Fixed auto-populated items, custom items, overall readiness summary
**Main actions:** Mark custom items complete, Tap auto-populated items to see detail, Return to trip
**States:** All clear, Outstanding items, Partially complete
**Edge cases:** Auto-populated item incomplete → coordinator can tap to see who and nudge without leaving context

---

## S-21: Availability Submission (Player) — Full Screen
**Purpose:** Player submits availability for an event
**Primary user:** Player
**Key info:** Event name and date, three status options, optional note, current submitted status (if already submitted)
**Main actions:** Select status (large full-width tap targets), Add optional note, Submit
**States:** Not yet submitted, Already submitted (shows current; can change until locked), Locked (read-only), Offline (submission disabled)
**Edge cases:** Race condition: window locks during submission → "Availability is now locked. Your response was not saved."

---

## S-22: Availability Roster (Coach / Coordinator)
**Purpose:** Full squad availability view + selection state management
**Primary user:** Coach, Coordinator
**Key info:** Player name, availability status, operational status, note indicator; summary counts at top
**Main actions:** Tap player row → operational state picker (S-23), Filter by status, Lock availability, Send selection notifications
**States:** All submitted, Partially submitted, Locked, Selection in progress, Notifications sent
**Role differences:** Coach and Coordinator only; Staff cannot access; Player cannot access
**Edge cases:** Medically Restricted shown with distinct visual indicator; not exposed to players

---

## S-23: Operational State Picker (Bottom Sheet)
**Purpose:** Quick state assignment for a player from availability roster
**Primary user:** Coach, Coordinator
**Key info:** Player name (header), current operational status, four state options
**Main actions:** Tap state (Selected / Not Selected / Traveling / Medically Restricted), Cancel
**Behavior:** Native platform bottom sheet conventions
**States:** Unassigned, State already set (current highlighted), Medically Restricted
**Edge cases:** Coach sets Selected for Medically Restricted player → soft warning shown before confirm; logged but not blocked

---

## S-24: Feed
**Purpose:** Role-filtered official communication channel
**Primary user:** All
**Key info:** Pinned posts (if any), chronological post list, post type labels, unread indicators
**Main actions:** Tap post → Post Detail, Create new post (coordinator/coach), Pin post (coordinator)
**States:** Populated, Empty (role-appropriate message), Unread items, All caught up, Offline (last 50 cached)

---

## S-25: Post Detail
**Purpose:** Full post content; acknowledgment action; delivery state (coordinator/coach)
**Primary user:** All (different depth by role)
**Key info:** Post type, content, linked event, posted by, timestamp; Player: acknowledgment button; Coordinator/Coach: delivery summary, overdue list, nudge action
**Main actions:** Acknowledge (player/staff, if required), View delivery state (coordinator/coach), Send nudge, Back to feed
**States:** Unacknowledged, Acknowledged, Not required (read-only), Overdue members present, All acknowledged, Offline (content readable; acknowledgment disabled if not cached)
**Edge cases:** Post linked to cancelled event → post remains; event shows as Cancelled; acknowledgment still required

---

## S-26: Post Creation
**Purpose:** Coordinator/coach creates new structured post
**Primary user:** Coordinator, Coach
**Key info:** Post type selector, recipient group selector, content field, optional event link, character count
**Main actions:** Publish, Save as draft (auto), Preview, Back
**States:** Empty, Content entered (publish enabled), Character limit approaching (amber), At limit (red; disabled), Draft auto-saved
**Edge cases:** Exit mid-draft → auto-saved; resume prompt on next creation attempt

---

## S-27: Team Roster
**Purpose:** Full team member list with onboarding states (coordinator) or names/roles (others)
**Primary user:** All (depth by role)
**Key info:** Coordinator: all members, roles, onboarding states, stale emergency info flag; Others: names and roles only
**Main actions:** Tap member → Member Detail, Invite new member (coordinator), Send reminder to pending (coordinator)
**States:** All active, Pending members present, Incomplete profiles, Stale emergency info flagged

---

## S-28: Member Detail
**Purpose:** Individual member profile; emergency info access for authorized roles
**Primary user:** All (depth by role)
**Key info:** Name, role, jersey number; Emergency info (coordinator/coach/staff); Onboarding state (coordinator)
**Main actions:** Edit own profile, View/call emergency contact (authorized roles), Send reminder (coordinator), Remove from team (coordinator)
**States:** Complete, Incomplete (coordinator sees missing fields), Stale emergency info, Own profile (edit controls visible), Other member (read-only)

---

## S-29: Edit Profile
**Purpose:** Member updates own profile and emergency info
**Primary user:** All (own profile only)
**Key info:** Name, role, jersey number; emergency info fields
**Main actions:** Save changes, Cancel
**States:** Editing, Validation error (inline), Saved, Offline (queued for sync with indicator)
**Edge cases:** Save while offline → queued; last updated timestamp updates only after confirmed sync

---

## S-30: Team Settings
**Purpose:** Team-level configuration; coordinator controls
**Primary user:** Coordinator
**Key info:** Team name, sport, location; coordinator handoff; notification preferences; invitation link
**Main actions:** Edit team details, Initiate coordinator transfer, Regenerate invitation link, Manage notification preferences
**States:** Normal, Pending coordinator transfer (shows incoming name + "Awaiting acceptance")

---

## S-31: Coordinator Handoff
**Purpose:** Coordinator selects and initiates role transfer
**Primary user:** Coordinator
**Key info:** Eligible members list (Active only), explanation of what transfers
**Main actions:** Select member, Confirm transfer, Cancel
**States:** Members listed, No eligible members (Pending-only team), Transfer pending
**Edge cases:** Transfer expires after 48hrs if not accepted

---

## S-32: Accept Coordinator Transfer
**Purpose:** Incoming coordinator accepts or declines transfer
**Primary user:** Active team member (incoming)
**Key info:** Who is transferring, what coordinator role entails
**Main actions:** Accept (primary), Decline
**States:** Pending, Accepted (→ coordinator home), Declined
**Edge cases:** Transfer expired → "This transfer is no longer valid"

---

## S-33: Notification Preferences
**Purpose:** User manages notification settings per category
**Primary user:** All
**Key info:** Notification categories with toggles; Urgent Alerts always-on note
**Main actions:** Toggle categories on/off, Back
**States:** All on (default), Some disabled, Urgent Alerts always present (toggle disabled with explanation)

---

## S-34: Emergency Info Prompt (Onboarding)
**Purpose:** Prompt player to complete emergency info during onboarding; skippable once
**Primary user:** Player, Staff (during onboarding)
**Key info:** One-sentence explanation, emergency info fields
**Main actions:** Complete and continue (primary), I'll do this later (secondary, skippable once)
**States:** Empty, Partially filled, Complete (→ team home), Skipped (single follow-up 24hrs later)
**Edge cases:** Player skips and then receives trip assignment → pre-departure checklist shows incomplete; coordinator can send reminder
