# Relay — QA Edge Cases and Failure States

## Edge Case Index

### EC-01: Coordinator Is Only Team Member
**Scenario:** Coordinator tries to leave or delete team with no other eligible members
**Expected behavior:** System prompts transfer first; if no eligible member exists (all Pending), team archives with data preserved; coordinator shown: "You're the only eligible coordinator. Invite and wait for a member to join before transferring."
**Test:** Create team with no other active members; attempt to leave

### EC-02: Availability Submitted at Window Lock (Race Condition)
**Scenario:** Player submits availability at exact moment coordinator locks window
**Expected behavior:** If lock completes first: submission rejected with "Availability is now locked. Your response was not saved." If submission completes first: submission accepted; lock then applies
**Test:** Simulate simultaneous lock + submit requests; verify server handles atomically

### EC-03: Critical Field Updated While Player Is Viewing Itinerary
**Scenario:** Coordinator updates departure time while player has TripDetailScreen open
**Expected behavior:** On next data refresh (≤30s via polling or push invalidation), player's view updates; re-acknowledgment required; previous acknowledged state cleared; prominent prompt shown above the fold
**Test:** Coordinator edits itinerary while player views; verify player sees change within 30 seconds without manual refresh

### EC-04: Invitation Link Shared Publicly
**Scenario:** Invitation link posted publicly; non-team members join
**Expected behavior:** New joiners enter as Player with Invited state; Coordinator sees unexpected member in roster; can remove immediately; Option to require coordinator approval at team settings
**Test:** Use invitation link from a different account; verify coordinator sees unexpected member and can remove

### EC-05: Two Coordinator Transfer Attempts Simultaneously
**Scenario:** Coordinator initiates two transfers on two devices simultaneously
**Expected behavior:** First initiation succeeds; second rejected: "A transfer is already pending. Cancel the current request first."
**Test:** Simulate two simultaneous transfer initiations; verify only one is created

### EC-06: Trip Date Passes Without Marking Complete
**Scenario:** Event date passes without coordinator action
**Expected behavior:** After 24 hours past event date: event auto-labeled "Past" in events list; coordinator prompted to mark complete; offline-cached trip data retained for 7 days then dropped
**Test:** Create event with past date; verify past label appears after 24hr without coordinator action

### EC-07: Player Has No Connectivity During Availability Window
**Scenario:** Player opens app offline when availability window is open
**Expected behavior:** Availability submission screen shows "Available when connected" on submit button; not an error; player sees last submitted status if previously submitted
**Test:** Set device to airplane mode; open availability screen; verify UI state

### EC-08: Coordinator Cancels Trip (No Undo)
**Scenario:** Coordinator accidentally cancels trip
**Expected behavior:** Cancellation requires two-step confirmation; no undo after confirmation; coordinator must create new event manually; all members receive cancellation notification
**Test:** Verify two steps required; verify notification sent; verify trip inaccessible from active views

### EC-09: Player Registered in Two Teams
**Scenario:** Player accepts invitations from two different teams
**Expected behavior:** Player sees team selector; team context is explicit; feed, events, and states are team-scoped; emergency info is shared (one profile); switching teams is explicit
**Test:** Join two teams; verify data separation; verify emergency info shared; verify feed team-scoped

### EC-10: Emergency Info Not Updated in 180+ Days
**Scenario:** Player has not updated emergency info since onboarding
**Expected behavior:** Coordinator sees stale flag on roster; emergency info still shown with last-updated timestamp; amber indicator; content not hidden or blocked; coordinator can send reminder
**Test:** Create account; set emergencyInfoUpdatedAt to 181 days ago; verify stale flag; verify info still accessible

### EC-11: Coach Updates Selection After Notifications Sent
**Scenario:** Coach changes player's operational status after selection notifications already sent
**Expected behavior:** Updated status saved; "Send selection notifications" button re-appears; second send requires explicit confirmation; players receive updated notification; product does not block but makes it deliberate
**Test:** Send notifications; change one status; verify button re-appears; send again; verify player receives second notification

### EC-12: Player Declines Push Notifications
**Scenario:** Player denies push notification permission
**Expected behavior:** All information still accessible by opening app; delivery state shows "Not Seen" accurately (not falsely "Delivered"); coordinator can see consistently "Not Seen" for this player
**Test:** Deny push permission; verify in-app content still loads; verify delivery state is "Not Seen"

### EC-13: Coordinator Adds Document Item After Trip Published
**Scenario:** New document requirement added post-publish
**Expected behavior:** New item appears in all applicable players' checklists as unconfirmed; push notification sent to affected players; coordinator sees updated outstanding count
**Test:** Publish trip; add document item; verify player receives notification and sees new item

### EC-14: Pending Member in Traveling Squad at Departure
**Scenario:** Member in squad never completes onboarding before trip
**Expected behavior:** Member shown in squad with Pending indicator; pre-departure checklist shows incomplete for this member; coordinator can see which actions are blocked; trip proceeds; coordinator manages this member externally
**Test:** Include Pending member in squad; verify checklist reflects incomplete state; verify trip can still proceed

### EC-15: Malformed Emergency Contact Phone Number
**Scenario:** Player enters invalid phone number format in emergency info
**Expected behavior:** Phone number shown as plain text; tap-to-call affordance removed; labeled "Call manually — verify number"; data is not blocked or hidden
**Test:** Enter "not a phone number"; verify display behavior in EmergencyInfoCard

### EC-16: Post Deletion After Grace Period
**Scenario:** Coordinator tries to delete post more than 5 minutes after publishing
**Expected behavior:** Deletion requires coordinator confirmation (not available via simple tap); on deletion, recipients receive in-app notification that a post was removed; post removed from feed
**Test:** Create post; wait 5+ minutes; attempt delete; verify confirmation required and removal notification sent

### EC-17: Coordinator Creates Trip with No Squad Members Yet
**Scenario:** Team has no active members when coordinator creates first trip
**Expected behavior:** Squad selection step shows empty roster; coordinator can skip and return later; trip can be published with empty squad; members added to squad later receive notification when added and trip is active
**Test:** Create team; immediately create trip; skip squad step; publish; add members; verify they receive notification

### EC-18: Transfer Request Expires After 48 Hours
**Scenario:** Incoming coordinator does not respond to transfer request
**Expected behavior:** Transfer status set to expired after 48 hours; outgoing coordinator notified "Your transfer request has expired. You're still the coordinator."; outgoing coordinator can initiate new request
**Test:** Use test date manipulation; verify expiry behavior; verify outgoing coordinator notification

---

## Failure State Reference

### Network Failures

| Scenario | User sees | System behavior |
|---|---|---|
| Trip publish fails (network) | "Couldn't publish — check your connection" + Retry | Trip remains in Draft; no notifications sent |
| Acknowledgment fails | "Couldn't save — check your connection" + Retry | Optimistic UI reverts; button shows unacknowledged |
| Post publish fails | "Couldn't post — check your connection" + Retry | Post remains in Draft |
| Nudge send fails | "Couldn't send — check your connection" | No nudges sent; button re-enabled |
| Selection notification fails | "Couldn't send — check your connection" | No notifications sent; coordinator can retry |
| Emergency info load fails (online) | "Couldn't load emergency info. Check your connection." | Retry option shown |

### Data Failures

| Scenario | User sees | System behavior |
|---|---|---|
| Emergency info not on file | "Emergency info not on file for this member." | Coordinator can send reminder from this screen |
| Event not found (deep link) | "This event is no longer available." | Navigate back to Events list |
| Trip not found | "This trip is no longer available." | Navigate back to Events list |
| Invitation link expired | "This invite link has expired." | Prompt to contact coordinator |
| Invitation link invalid | "This link isn't valid." | Prompt to contact coordinator |

### Permission Failures

| Scenario | User sees | System behavior |
|---|---|---|
| Player attempts to access coordinator route | Redirect to their home | No error shown; graceful redirect |
| Player API request for emergency info | 403 from server | Client never shows error; role check prevents request |
| Coach attempts team deletion | 403 from server | Option not shown in UI; server enforces |

---

## Manual QA Checklists

### Role-Based Visibility — Run Before Every Release

- [ ] Player cannot see Medically Restricted status of any player (check API response AND UI)
- [ ] Player cannot see other players' availability notes
- [ ] Player cannot see coordinator-only sections (pre-departure checklist)
- [ ] Player cannot see full squad operational states (sees names and roles only in squad list)
- [ ] Staff cannot access the availability roster (coach-only)
- [ ] Emergency info of Player A is not visible to Player B
- [ ] Coach cannot access team settings or coordinator handoff screens

### Offline Behavior — Run Before Every Release

- [ ] Open TripDetailScreen; go offline; scroll through all sections — all data readable
- [ ] Offline: AcknowledgmentButton shows "Available when connected" (not hidden, not an error)
- [ ] Offline: trip cancellation option disabled with "Available when connected" label
- [ ] Reconnect: OfflineBanner dismisses; "Back online" toast; data refreshes automatically
- [ ] App restart while offline: TripDetailScreen loads from MMKV cache; no network required
- [ ] Last-synced timestamp shows correctly on cached content
- [ ] Emergency info accessible offline from squad list in ≤3 taps

### Push Notifications — Run Before Every Release

- [ ] Permission prompt does NOT appear on first app open
- [ ] Permission prompt appears at correct trigger moment (first trip assignment or selection)
- [ ] TRIP_PUBLISHED: push arrives on player device within 30 seconds (app killed)
- [ ] TRIP_PUBLISHED push tap: navigates to TripDetailScreen (NOT HomeScreen)
- [ ] SELECTION_SELECTED push tap: navigates to EventDetailScreen showing selection status
- [ ] ITINERARY_CHANGED push tap: navigates to TripDetailScreen with re-acknowledgment prompt visible
- [ ] TRIP_CANCELLED push tap: navigates to EventsListScreen; cancelled event in history
- [ ] All push types tested from background state (app in background, tap notification)
- [ ] All push types tested from killed state on physical iOS device
- [ ] All push types tested from killed state on physical Android device
- [ ] Nudge rate limit: send nudge to a member; try again within 24hrs; second nudge blocked

### Accessibility — Run Before Every Release

- [ ] VoiceOver: all status indicators read descriptive label (not "grey circle" or "image")
- [ ] VoiceOver: AcknowledgmentButton reads "I've got it, button" then "Confirmed" after tap
- [ ] VoiceOver: AvailabilityPicker options read "Available, tap to select" etc.
- [ ] VoiceOver: EmergencyInfoCard phone number reads "Call [Name], button"
- [ ] Dynamic Type Accessibility Large: all screens render without truncation
- [ ] Maximum text size: EmergencyInfoCard fully readable
- [ ] Color-only status: enable grayscale on device; all status indicators still distinguishable
- [ ] Touch targets: all interactive elements ≥44pt (use Accessibility Inspector)
- [ ] Reduced motion: enable in device settings; no slide/scale animations; opacity only
- [ ] Focus order: logical top-to-bottom, left-to-right on all screens (no focus traps)

### Edge Cases — Run Before Every Release

- [ ] EC-01: Coordinator only member; attempts to leave — blocked with clear message
- [ ] EC-02: Availability lock race condition — "Availability is now locked" (not generic error)
- [ ] EC-08: Trip cancellation — two-step confirmation required; cannot undo
- [ ] EC-10: Stale emergency info (>180 days) — stale flag shown; info still accessible
- [ ] EC-12: Push notifications disabled by player — delivery state is "Not Seen" accurately
- [ ] EC-14: Pending member in squad — pre-departure checklist shows incomplete; trip proceeds
- [ ] EC-15: Malformed phone number — plain text; "Call manually"; no tappable affordance
- [ ] EC-18: Expired transfer deep link — "This transfer is no longer valid"; no crash
