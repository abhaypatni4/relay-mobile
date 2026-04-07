# Relay — User Flows

## Flow Conventions

- Each step is numbered
- Branch points labeled [IF condition]
- Screen references match screen-inventory.md (S-XX)
- All flows assume app installed and user authenticated unless noted as "new user"

---

## Flow 1: Coordinator Onboarding and First Event

**Entry:** New user, app launched for first time

1. Splash screen (S-01) → auto-transitions
2. [New user] → Account Creation (S-02)
   - Enter name, phone/email, password
   - [Existing user] → Login (S-03)
3. Create Team (S-04)
   - Enter team name (required), sport (optional)
   - Tap "Create Team"
4. [Prompted immediately] Create First Event (S-05)
   - Cannot skip; cannot land on empty dashboard
   - Select event type: Trip / Match / Training
5. [If Trip] → Trip Itinerary Builder (S-06)
   - Required: Departure Time, Departure Meeting Point
   - Optional: accommodation, return, notes
6. [If Trip] Squad Selection (S-07)
7. [If Trip] Document Checklist Builder (S-08) or skip
8. [If Trip] Review and Publish (S-09) or Save as Draft
9. Invite Members — generate link, share via native share sheet
10. Coordinator lands on Home (S-10) with first event and pending member states

**Success condition:** Coordinator has a team, a real event, and at least one invitation sent before leaving the app.

---

## Flow 2: Player Onboarding via Invitation

**Entry:** Player receives invitation link via SMS/iMessage

1. Tap invitation link
2. [App not installed] → App Store / Play Store → install → reopen link
3. [App installed] → Onboarding (accept invite context)
4. Account Creation (S-02) — name pre-filled if available from invite data; role selection
5. Emergency Info Prompt (S-34) — prompted; skippable once
6. Player lands on team Home (S-11) with real content (not empty state)
7. [24hrs later if skipped] Single follow-up push for emergency info

---

## Flow 3: Coordinator Creates and Publishes a Trip

**Entry:** Coordinator, Events tab, or prompted from Home

1. Events tab → tap [+] Create Event
2. Select event type: "Trip" (S-05)
3. Enter trip name, date, start time, location
4. Trip Itinerary Builder (S-06)
   - Fill Departure Time (required Critical Field)
   - Fill Departure Meeting Point (required Critical Field)
   - Fill optional fields as available
5. Squad Selection (S-07) — toggle traveling status per member
6. Document Checklist Builder (S-08) — add items or skip
7. Trip Review (S-09) — summary of what will be sent
8. Tap "Publish" → confirmation → trip Published
   - Push notifications sent to all Active traveling squad members
   - Pending members: not notified until they become Active
9. Coordinator sees Trip Detail (S-15) with active status

---

## Flow 4: Player Views Trip and Acknowledges Logistics

**Entry:** Push notification "You're on the trip — here are your details"

1. Tap notification → deep link → Trip Detail (S-15) player view
2. Trip card shows: departure time, meeting point, accommodation (if filled), return details
3. [Acknowledgment required] Large "I've got it" button visible at bottom of itinerary section
4. Player taps → confirmed state immediately (optimistic)
   - Coordinator's delivery state updates in real time
5. [Document checklist present] Player scrolls to checklist section
6. Player taps each document item: "I have this"
7. Player exits — no further action required

**If critical field changes after acknowledgment:**
1. Player receives push: "Departure time has changed — please review and confirm"
2. Tap → Trip Detail → itinerary section with re-acknowledgment prompt above the fold
3. Player re-acknowledges
4. Coordinator sees updated acknowledgment count

---

## Flow 5: Player Submits Availability

**Entry A:** Push notification "Confirm your availability for [Event]"
**Entry B:** Home screen availability prompt
**Entry C:** Events tab → Event Detail → Availability section

1. Availability Submission screen (S-21) — full screen
2. Event name and date shown at top
3. Three large equal options: Available / Limited / Unavailable
4. [Optional] Note field (120 char max)
5. Tap "Submit"
6. Inline confirmation: "Got it — [Status] noted for [Event Name]"
7. Modal auto-closes after 2 seconds

**If availability already submitted:**
- Submission screen shows current status; player can update until locked

**If availability locked when player opens:**
- Screen shows locked state; submission controls not visible

---

## Flow 6: Coach Reviews Availability and Sets Selection

**Entry:** Events tab → Event Detail → Availability section

1. Availability Roster (S-22) opens
2. Coach sees summary: "18 Available, 4 Limited, 2 Unavailable, 1 Not Submitted"
3. Coach filters by status (optional)
4. Coach taps player row
5. Operational State Picker (S-23) slides up (bottom sheet, native platform behavior)
6. Coach selects state; sheet dismisses; row updates immediately
7. Repeat for all players
8. [Sticky button appears] "Send selection notifications" (when ≥1 player has operational status)
9. Coordinator confirms → notifications sent
10. Confirmation: "Selection notifications sent to X members"

---

## Flow 7: Coordinator Sends Post and Monitors Delivery

**Entry:** Feed tab → [+] Create Post

1. Post Creation screen (S-26)
2. Select post type: Schedule Update / Travel Info / General Announcement / Urgent Alert
3. Select recipients: Full Team / Traveling Squad / Coaching Staff / All Staff
4. [Optional] Link to event
5. Write content (500 char limit; countdown from 80%)
6. Preview → Publish
7. Post appears in coordinator's feed; recipients notified

Monitoring delivery:
8. Coordinator taps post → Post Detail (S-25)
9. Delivery panel: "Sent to 23 — 18 seen, 14 acknowledged"
10. [After 4hrs] Overdue list: "6 members haven't acknowledged"
11. Tap "Nudge 6 members" → confirm → push sent
12. Confirmation toast: "Reminder sent to 6 members"

---

## Flow 8: Emergency Info Access During Travel

**Entry:** Active trip → Events tab or Home active trip card

1. Trip Detail (S-15) → Squad List section
2. Coordinator/Coach/Staff taps player name
3. Member detail opens → Emergency Info section visible
4. Emergency Info Card (S-18):
   - Contact Name
   - Contact Phone [tap to call — opens native dialer]
   - Allergy/Medical Alert
   - Staff Note
   - Last Updated: [date]
5. Back → squad list

**Offline path:** Same flow; all data readable from cache; last-synced timestamp shown

---

## Flow 9: Trip Cancellation

**Entry:** Trip Detail → coordinator actions menu

1. Coordinator taps "Cancel trip"
2. Confirmation sheet: "Cancel this trip? All assigned members will be notified. This cannot be undone."
3. Two actions: "Yes, cancel trip" (destructive) / "Go back"
4. Coordinator confirms → push notifications sent to all assigned members within 30s
5. Trip removed from active event views
6. Coordinator returned to Events tab
7. Trip accessible in Past Events with "Cancelled" label

---

## Flow 10: Trip Postponement

**Entry:** Trip Detail → coordinator actions menu

1. Coordinator taps "Postpone trip"
2. Bottom sheet: option to enter new date/time (optional)
3. [New date/time entered] Critical field change handling applies → re-acknowledgment required
4. Confirmation: "Postpone this trip? All members will be notified."
5. Confirm → push sent to all members
6. Trip remains in active views with "Postponed" label
7. [If new date/time] All previously acknowledging players reset; receive re-acknowledgment push

---

## Flow 11: Coordinator Handoff

**Entry:** Team tab → Team Settings → Transfer coordinator role

1. Coordinator opens handoff screen (S-31)
2. Eligible Active members listed
3. Coordinator selects incoming member
4. Confirmation: "Transfer coordinator role to [Name]? They'll need to accept."
5. Coordinator confirms
6. Incoming member receives in-app prompt (and push if app backgrounded)
7. Incoming sees Accept/Decline screen (S-32)
8. [Accept] → transfer completes; both parties notified; all history preserved
9. [Decline] → no change; outgoing coordinator notified

---

## Flow 12: Post Draft Auto-Save and Resume

**Entry:** Coordinator starts creating a post, exits mid-draft

1. Coordinator taps [+] in Feed
2. Starts filling post
3. Navigates away or closes app → draft auto-saved immediately
4. [Next time coordinator taps +]:
   Bottom sheet: "You have a saved draft — continue or start fresh?"
   "Resume draft" | "Discard and start fresh"
5. [Resume] → post creation opens with draft content restored
6. [Discard] → confirmation → draft deleted → new empty post
