# Relay — Analytics Events and Metrics

## Instrumentation Principles

- Every user action completing a workflow step is a named event
- Role is attached to every event as a property
- Team size is attached to every team-level event
- No PII in analytics events; member IDs are pseudonymized
- Offline actions are queued and logged when connectivity restores
- Events are fired client-side; server-side events supplement for critical actions
- screen() called in useFocusEffect on every screen

## Base Event Schema

Every event includes these base properties:
```
{
  event: string,           // Event name (snake_case)
  userId: string,          // Pseudonymized user ID
  teamId: string,          // Team ID
  role: string,            // coordinator | coach | staff | player
  teamSize: number,        // Total Active members in team
  platform: string,        // ios | android
  appVersion: string,
  timestamp: ISO8601,
  sessionId: string
}
```

---

## Onboarding Events

| Event | Trigger | Additional properties |
|---|---|---|
| account_created | User completes account creation | source: invitation \| direct |
| team_created | Coordinator creates team | |
| first_event_created | Coordinator creates first event | eventType, deltaFromTeamCreation (seconds) |
| invitation_sent | Coordinator sends invitation | method: link \| phone |
| invitation_accepted | Member accepts invitation | |
| emergency_info_completed | Member completes emergency info | isFirstTime (bool) |
| emergency_info_skipped | Member skips emergency info in onboarding | |
| onboarding_complete | All core onboarding steps done | durationSeconds |

---

## Trip Workflow Events

| Event | Trigger | Additional properties |
|---|---|---|
| trip_created | Coordinator creates trip | |
| trip_published | Coordinator publishes trip | squadSize, hasDocumentChecklist (bool), durationFromCreateToPublish (seconds) |
| trip_itinerary_updated | Coordinator edits itinerary | isPostPublish (bool), isCriticalField (bool) |
| trip_cancelled | Coordinator cancels trip | daysUntilTrip |
| trip_postponed | Coordinator postpones trip | hasNewDate (bool) |
| itinerary_acknowledged | Player acknowledges itinerary | isReacknowledgment (bool) |
| itinerary_acknowledgment_rate | Periodic computed metric | acknowledged/total, eventId |
| document_item_confirmed | Player confirms document | |
| document_reminder_sent | Coordinator sends reminder | outstandingCount |
| predeparture_checklist_completed | Coordinator marks all items | tripId |
| emergency_info_accessed | Staff/Coordinator/Coach accesses emergency info | accessedDuringActiveTrip (bool) |

---

## Availability and Selection Events

| Event | Trigger | Additional properties |
|---|---|---|
| availability_window_opened | Coordinator opens window | eventId |
| availability_submitted | Player submits | status: available \| limited \| unavailable, hasNote (bool) |
| availability_updated | Player changes before lock | previousStatus, newStatus |
| availability_locked | Coordinator locks window | submissionRate (submitted/total) |
| operational_status_set | Coach sets status | operationalStatus, wasOverridingMedicalRestriction (bool) |
| selection_notifications_sent | **SERVER-SIDE** — Coordinator sends | selectedCount, notSelectedCount |
| selection_notification_opened | Player opens selection notification | selectionResult: selected \| notSelected, deltaFromSentToOpened (seconds) |

---

## Communication Events

| Event | Trigger | Additional properties |
|---|---|---|
| post_created | Coordinator/Coach creates post | postType, recipientGroup, isUrgent (bool), isDraft: false |
| post_draft_saved | Auto-save triggers | |
| post_draft_resumed | Coordinator resumes draft | |
| post_draft_discarded | Coordinator discards draft | |
| post_published | Post goes live | postType, recipientCount |
| post_viewed | Recipient views post | postType, deltaFromPublishToView (seconds) |
| post_acknowledged | Recipient acknowledges | postType, deltaFromPublishToAck (seconds) |
| nudge_sent | **SERVER-SIDE** — Coordinator sends nudge | overdueCount |
| nudge_result | Acknowledgment within 1hr of nudge | acknowledged (bool) |
| post_deleted | Post deleted within grace period | |

---

## Retention and Usage Events

| Event | Trigger | Additional properties |
|---|---|---|
| app_opened | App launched (foreground) | isFromNotification (bool), notificationType (string) |
| tab_viewed | User views a tab | tabName |
| notification_permission_requested | Permission prompt shown | |
| notification_permission_granted | User grants permission | |
| notification_permission_denied | User denies permission | |
| offline_mode_entered | App goes offline | |
| offline_mode_exited | App reconnects | offlineDurationSeconds |
| coordinator_handoff_initiated | Coordinator initiates transfer | |
| coordinator_handoff_completed | **SERVER-SIDE** — Transfer completes | |

---

## Error and Failure Events

| Event | Trigger | Additional properties |
|---|---|---|
| write_action_failed | Network error on mutation | actionType, retried (bool) |
| push_delivery_failed | Push token invalid or failure | notificationType |
| offline_write_attempted | User tried write while offline | actionType |
| emergency_info_missing_at_trip | Player in squad with no emergency info | eventId |
| pending_member_at_trip_departure | Pending member in traveling squad | eventId |

---

## Server-Side Events

These MUST fire from the backend, not the client, to prevent spoofing:
- selection_notifications_sent
- nudge_sent
- coordinator_handoff_completed

---

## Computed Metrics (Dashboard)

### Primary Success Metrics

| Metric | Calculation | Target |
|---|---|---|
| Squad onboarding rate | Active members / Invited members (per team, first trip) | ≥ 80% |
| Trip workflow completion | Trips with no external tool used / Total trips | ≥ 70% |
| Player acknowledgment rate | Acknowledged / Total traveling squad (per trip) | ≥ 85% |
| Availability submission rate | Submitted / Total players (per event) | ≥ 75% |
| Selection notification open rate | Opened / Sent | ≥ 60% |
| Coordinator 30-day retention | Coordinators who create 2nd event within 30 days | ≥ 65% |
| Emergency info completion at trip | Players with complete info / Traveling squad | ≥ 90% |

### Counter-Metrics (Warning Signals)

| Metric | Warning threshold |
|---|---|
| Push notification permission denial rate | > 20% |
| Pending member rate at trip | > 15% of trips |
| Trip created but never published | > 20% of created trips |
| Availability submission rate | < 50% |

### Key Funnels to Track

**Onboarding funnel:**
app_install → account_created → team_created → first_event_created → invitation_sent → first_member_joined → first_trip_published

**Trip funnel:**
trip_created → trip_published → itinerary_acknowledged (first player) → itinerary_acknowledgment_rate ≥ 85% → predeparture_checklist_completed

---

## Implementation Notes

- Use a single analytics client abstracted from the specific vendor (Amplitude, Mixpanel, Segment)
- Abstract behind: `analytics.track(eventName, properties)`, `analytics.identify()`, `analytics.screen()`
- Queue events offline; flush on reconnection (use vendor SDK built-in queue if available)
- Base properties (role, teamSize, platform, appVersion) appended at the service level — not per-event
- No email, phone, or name fields in any event property
