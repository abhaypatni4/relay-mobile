# Relay — Notifications and Alerts

## Core Principles

- Every notification is specific and actionable
- Every notification deep-links to relevant content
- Notification permission is requested at first genuine value moment (NOT on first app open)
- System cap: ≤3 system-generated notifications per user per 24hrs (coordinator nudges excluded)
- Urgent Alerts: cannot be fully disabled; can be set to silent
- Delivered when app is in background or closed

## Permission Request Timing

Request permission at whichever comes first:
1. Player receives their first trip assignment
2. Player receives their first selection notification
3. Coordinator receives their first team member acceptance

**NEVER request on:** first app open, account creation, settings screen navigation.

---

## Notification Specifications

### TRIP_PUBLISHED
**Trigger:** Coordinator publishes a trip
**Recipients:** All Active traveling squad members (NOT pending members)
**Priority:** Standard
**Title:** "[Team Name]"
**Body:** "You're on the [Event Name] trip — tap to see details"
**Deep link:** relay://trips/[tripWorkspaceId]

### ITINERARY_CRITICAL_FIELD_CHANGED
**Trigger:** Coordinator updates Departure Time or Departure Meeting Point after trip is published (itineraryVersion increments)
**Recipients:** All traveling squad members whose acknowledgedItineraryVersion equals the PREVIOUS version (i.e., those who had acknowledged but are now stale)
**Priority:** High
**Title:** "[Event Name]"
**Body:** "Departure time has changed — tap to re-confirm"
**Deep link:** relay://trips/[tripWorkspaceId]?section=itinerary

### TRIP_CANCELLED
**Trigger:** Coordinator confirms trip cancellation
**Recipients:** All assigned squad members (ALL traveling statuses, including NotTraveling)
**Priority:** High
**Title:** "[Event Name]"
**Body:** "[Event Name] has been cancelled"
**Deep link:** relay://events/[eventId]
**Note:** Sent within 30s of cancellation confirmation

### TRIP_POSTPONED
**Trigger:** Coordinator postpones trip
**Recipients:** All assigned squad members
**Priority:** High
**Title:** "[Event Name]"
**Body (no new date):** "[Event Name] has been postponed — details will be updated soon"
**Body (new date entered):** "[Event Name] has been postponed — tap to see updated details and re-confirm"
**Deep link:** relay://trips/[tripWorkspaceId]

### AVAILABILITY_WINDOW_OPENED
**Trigger:** Coordinator or Coach opens availability window for event
**Recipients:** All Player-role members of the team
**Priority:** Standard
**Title:** "[Event Name]"
**Body:** "Confirm your availability for [Event Name]"
**Deep link:** relay://events/[eventId]/availability
**Note:** Sent once per window open; not repeated

### AVAILABILITY_LOCKED
**Trigger:** Availability window is locked
**Recipients:** Players who have NOT yet submitted (not all players)
**Priority:** Standard
**Title:** "[Event Name]"
**Body:** "Availability is now locked for [Event Name]"
**Deep link:** relay://events/[eventId]

### SELECTION_SELECTED
**Trigger:** Coach/Coordinator sends selection notifications; player's operationalStatus is Selected or Traveling
**Recipients:** Individual player only
**Priority:** High
**Title:** "[Event Name]"
**Body:** "[Event Name]: You have been selected"
**Deep link:** relay://events/[eventId]

### SELECTION_NOT_SELECTED
**Trigger:** Same as above; player's status is Not Selected or Medically Restricted
**Recipients:** Individual player only
**Priority:** High
**Title:** "[Event Name]"
**Body:** "[Event Name]: You are not selected for this event"
**Deep link:** relay://events/[eventId]
**CRITICAL:** Medically Restricted reason NOT included in notification. Player receives identical copy to Not Selected.

### POST_ACKNOWLEDGMENT_REQUIRED
**Trigger:** Coordinator/Coach publishes Schedule Update or Urgent Alert
**Recipients:** Target recipient group members
**Priority:** Standard (Schedule Update) | High (Urgent Alert)
**Title:** "[Team Name]"
**Body (Schedule Update):** "Schedule update: [first 60 chars of post content]"
**Body (Urgent Alert):** "Urgent: [first 60 chars of post content]"
**Deep link:** relay://posts/[postId]

### POST_GENERAL
**Trigger:** Coordinator/Coach publishes Travel Info or General Announcement
**Recipients:** Target recipient group members
**Priority:** Standard
**Title:** "[Team Name]"
**Body:** "New update from [Sender Name]: [first 60 chars]"
**Deep link:** relay://posts/[postId]
**Note:** Counts toward the 3/day cap; Urgent Alerts do not

### ACKNOWLEDGMENT_NUDGE
**Trigger:** Coordinator taps Nudge for a specific post
**Recipients:** Members in Overdue state for that post where canNudge=true
**Priority:** Standard
**Title:** "[Team Name]"
**Body:** "You haven't confirmed: [Post title or first 40 chars]"
**Deep link:** relay://posts/[postId]
**Rate limit:** Once per member per post per 24hrs

### DOCUMENT_REMINDER
**Trigger:** Coordinator taps document reminder button
**Recipients:** Squad members with at least one outstanding document item
**Priority:** Standard
**Title:** "[Event Name]"
**Body:** "Complete your document checklist before departure"
**Deep link:** relay://trips/[tripWorkspaceId]?section=documents

### COORDINATOR_TRANSFER_REQUEST
**Trigger:** Coordinator initiates transfer to specific member
**Recipients:** Incoming coordinator (single member)
**Priority:** High
**Title:** "[Team Name]"
**Body:** "[Outgoing Name] is inviting you to become coordinator for [Team Name]"
**Deep link:** relay://transfers/[transferId]

### INVITATION_RECEIVED
**Trigger:** Coordinator sends invitation via direct phone number entry
**Recipients:** Invited phone number
**Channel:** SMS (not push — user doesn't have app yet)
**Body:** "You've been invited to join [Team Name] on Relay. Get the app: [invitation link]"

### EMERGENCY_INFO_REMINDER
**Trigger:** 24hrs after player skipped emergency info in onboarding
**Recipients:** Player who skipped
**Priority:** Standard
**Title:** "[Team Name]"
**Body:** "Complete your emergency info before your next trip"
**Deep link:** relay://profile/emergency
**Note:** Sent once only; not repeated until coordinator triggers manual reminder

---

## In-App Notification Handling (Foreground)

When app is in foreground and notification arrives:
- Do NOT show system notification banner
- Show in-app Toast with notification content
- Urgent Alerts: show persistent in-app banner until dismissed
- All others: 4-second auto-dismiss Toast

---

## Notification Preference Categories

| Category | Default | Can disable? |
|---|---|---|
| Trip updates (published, cancelled, postponed) | On | Yes |
| Itinerary changes (critical field changes) | On | Yes |
| Availability (window open, locked) | On | Yes |
| Selection notifications | On | Yes |
| Feed posts (acknowledgment required) | On | Yes |
| Feed posts (general) | On | Yes |
| Reminders (documents, emergency info) | On | Yes |
| Urgent Alerts | On | Silent only; cannot fully disable |
| Nudges (acknowledgment reminders) | On | Yes |

---

## Daily Notification Cap

System-generated cap: 3 per user per 24-hour rolling window

**Excluded from cap:**
- Coordinator-initiated nudges
- Urgent Alerts
- Trip cancellation / postponement notifications

---

## Delivery Failure Handling

- Failed push delivery: mark PostDeliveryState as "Delivery pending" rather than "Not Seen"
- Track push token validity; remove invalid tokens on delivery failure
- Coordinators see "Delivery pending" in delivery state panel for members with failed delivery

---

## "Back Online" Notification

**Channel:** In-app Toast only (not push)
**Body:** "Back online"
**Duration:** 3 seconds auto-dismiss
