# Relay — Component Inventory

## Build Order

Build components in tier order. No screen implementation starts until the components it depends on exist.

**Tier 1:** Foundation (no dependencies) — build first
**Tier 2:** Layout and Feedback (depend on Tier 1)
**Tier 3:** Overlay and Input (depend on Tier 1 + 2)
**Tier 4:** Domain-Specific (built as screens are implemented)

---

## Tier 1 — Foundation

### Text
**Purpose:** Typography scale wrapper — all text in the product uses this component
**Props:** variant (display | title | body | label | caption), color (defaults to primary text token), children
**Rules:** Never use raw React Native `<Text>` directly in any other component; all sizing from typography tokens; no hardcoded font sizes
**Accessibility:** Scales with Dynamic Type (iOS) and font scaling (Android)

### Icon
**Purpose:** Renders outlined SVG icon by name
**Props:** name (string from icon set), size (number), color (string from color token)
**Rules:** Outlined style only; graceful no-op on unknown name (no crash); 24px grid base
**Accessibility:** accessibilityLabel prop required for all non-decorative icons

### Divider
**Purpose:** 1px horizontal separator
**Props:** spacing (optional; defaults to none — Divider is for within-list separation; SectionDivider handles section gaps)
**Rules:** Uses divider color token only; never a visible heavy border

---

## Tier 2 — Layout and Feedback

### ScreenContainer
**Purpose:** Root wrapper for every screen
**Props:** scrollable (bool), hasTabBar (bool), hasHeader (bool), children
**Behavior:** Handles safe area insets; optional ScrollView vs View; KeyboardAvoidingView wraps children
**Rules:** Every screen uses this as outermost wrapper

### CardContainer
**Purpose:** White elevated surface for discrete objects
**Props:** children, onPress (optional for pressable variant), padding (default 16px)
**Variants:** pressable (tap navigates), static (display only)
**Visual:** Shadow per design system spec (0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)); corner radius 8–12px from token; no border

### ListRow
**Purpose:** Standard row for members of a set
**Props:** leading (node: StatusDot | Icon), primaryText (string), secondaryText (optional string), trailing (node: chevron | badge | action), onPress (optional)
**Rules:** Minimum 56px height; full-width tap zone; accessibilityRole="button" if pressable; divider via Divider component (not border)

### LoadingButton
**Purpose:** Primary button with loading state
**Props:** label (string), onPress, isLoading (bool), isDisabled (bool), variant (primary | destructive)
**Behavior:** ActivityIndicator replaces label on isLoading=true; button stays in position and disabled during loading; uses primary color token for default variant

### Toast
**Purpose:** Brief non-blocking confirmation or error message
**Props:** message (string), variant (success | error | info), duration (default: 3000 success / 4000 error)
**Behavior:** Slides up from bottom above tab bar; 200ms; auto-dismisses; max one visible at a time; reads from uiStore.toastQueue

### SkeletonLoader
**Purpose:** Placeholder during content load
**Variants:** SkeletonListRow, SkeletonCard
**Animation:** Subtle shimmer left-to-right, 1.5s; disabled if Reduce Motion preference enabled (static grey instead)

### OfflineBanner
**Purpose:** Persistent indicator of offline state
**Props:** lastSynced (timestamp)
**Behavior:** Non-blocking; appears below navigation header; warm grey background; reads from uiStore.isOffline; auto-dismisses on reconnection; "Back online" toast triggered
**Copy:** "You're offline — showing last saved info"

### InlineError
**Purpose:** Field-level validation error in forms
**Props:** message (string)
**Visual:** Below field; label scale; muted error color token; no icon needed; appears on blur, not on submit

---

## Tier 3 — Overlay and Input

### BottomSheet
**Purpose:** Contextual lightweight overlay for actions that preserve screen context
**Props:** isVisible (bool), onDismiss, children, title (optional)
**Behavior:** iOS: swipe-to-dismiss, background-tap-to-dismiss, native conventions; Android: Material bottom sheet; 16px top corner radius; drag handle; dim background overlay; reduced motion: opacity only, no slide
**When to use:** State pickers, confirmations, simple choices
**When NOT to use:** Multi-step flows, long forms, scrolling content

### ConfirmationSheet
**Purpose:** Bottom sheet preset for confirmation actions
**Props:** isVisible, title (string), body (string), confirmLabel (string), cancelLabel (string), isDestructive (bool), onConfirm, onCancel
**Rules:** Title is a consequence statement (not a question); body is one specific sentence; confirm button is a verb

### TextInput
**Purpose:** Single-line text entry
**Props:** label (string), placeholder (string; includes "(optional)" for optional fields), value, onChange, error (string | null), isRequired (bool), maxLength, keyboardType
**Behavior:** Label above field (never inside); InlineError on blur; required fields have no marker; optional fields show "(optional)" in placeholder

### TextAreaInput
**Purpose:** Multi-line text entry
**Props:** label, placeholder, value, onChange, maxLength, showCharacterCount (bool)
**Behavior:** Character count appears from 80% of limit; amber at 80%; red at limit; publish disabled at limit

### AvailabilityPicker
**Purpose:** Full-screen three-option status selector for players
**Props:** currentStatus, onSelect, isLocked (bool)
**Options:** Available | Limited | Unavailable
**Layout:** Three full-width, equal-prominence options; minimum 64px height each
**Behavior:** Tap selects; haptic light impact on selection (iOS); Submit button sticky at bottom; no option pre-selected by default
**Accessibility:** Each option labeled "Available, tap to select" etc.

### DateTimePicker
**Purpose:** Date and time selection
**Props:** value, onChange, mode (date | time | datetime)
**Behavior:** Platform native picker; defaults to tomorrow at 09:00; onChange fires with ISO8601 string

### SectionHeader
**Purpose:** Labels major sections within scrollable screens
**Props:** title (string), count (optional number), action (optional: label + callback)
**Variants:** All-caps + letter-spacing for category markers; sentence case + Semibold for section titles

### SectionDivider
**Purpose:** 32px vertical space between major sections
**Props:** spacing (default 32)
**Rules:** No visible element; purely spacing; non-negotiable value

### RecipientSelector
**Purpose:** Select target audience for a post
**Props:** selectedGroup, onSelect, hasTravelingSquad (bool)
**Options:** Full Team | Traveling Squad (only if active trip) | Coaching Staff Only | All Staff

---

## Tier 4 — Domain-Specific

### StatusDot
**Purpose:** Small visual indicator for entity status
**Props:** status (enum covering all availability, operational, delivery, onboarding states), size (sm | md)
**Rules:** Color + shape (never color alone); accessibilityLabel required; see design system status indicator table for exact color/icon/shape per state

### DeliveryStateDot
**Purpose:** Indicates post delivery state per member
**Props:** state (notSeen | seen | acknowledged | overdue)
**Rules:** Color + icon + shape per design system spec; accessibilityLabel required

### TripCard — Coordinator Variant
**Purpose:** Active or upcoming trip card on coordinator Home
**Props:** tripName, departureTime, meetingPoint, status, acknowledgedCount, totalTravelingCount, outstandingActionCount, onPress
**Visual:** Acknowledgment count as progress; outstanding actions count; handles Cancelled and Postponed states

### TripCard — Player Variant
**Purpose:** Active or upcoming trip card on player Home
**Props:** tripName, departureTime, meetingPoint, status, isAcknowledged, onPress
**Visual:** Departure time at Title scale (largest element); acknowledgment status indicator; handles Cancelled and Postponed

### EventCard
**Purpose:** Event summary in Events list
**Props:** eventName, eventType, date, time, location, status, onPress
**Visual:** Type badge; status badge for Cancelled/Postponed; tapping opens Event Detail or Trip Detail

### AcknowledgmentButton
**Purpose:** Primary player interaction in TripDetailScreen
**Props:** tripWorkspace, currentMemberAssignment (drives state via useTripAcknowledgment hook)
**States:** Unacknowledged (primary button "I've got it"); Acknowledged (checkmark + "Confirmed"); Re-acknowledgment needed (amber prompt above + button reset); Offline (disabled with "Available when connected")
**Behavior:** Sticky at bottom of itinerary section; optimistic update on tap (150ms); haptic medium impact on iOS; 409 version mismatch triggers re-acknowledgment state

### SquadMemberRow
**Purpose:** Player row in squad list within TripDetailScreen
**Props:** memberName, role, travelingStatus, onboardingState, acknowledgedItineraryVersion, currentItineraryVersion (coordinator view); memberName, role (player view)
**Rules:** Coordinator sees acknowledgment state; player sees name and role only; pending members show "Awaiting app setup"

### SquadRosterRow
**Purpose:** Player row in availability/selection roster (coach/coordinator view)
**Props:** playerName, availabilityStatus, operationalStatus, hasNote, onPress
**Layout:** Leading StatusDot (availability); primary name (Semibold); secondary status label; trailing operational status badge; minimum 64px height

### ChecklistItem — Player Variant
**Purpose:** Document checklist row for player to confirm
**Props:** itemName, isConfirmed, isBlocked, onConfirm
**Behavior:** Single tap to confirm; checkmark on confirmed; "Awaiting app setup" if blocked

### ChecklistItem — Coordinator Variant
**Purpose:** Document checklist row for coordinator overview
**Props:** itemName, confirmedCount, totalApplicable, onViewBreakdown
**Visual:** X of Y confirmed; expandable per-member breakdown

### PostCard
**Purpose:** Post preview in feed list
**Props:** postType, contentPreview, postedBy, timestamp, isRead, isAcknowledged, isRequired, isUrgent, deliverySummary (coordinator only), onPress
**Visual:** Post type chip; unread indicator; acknowledgment state; Urgent posts visually elevated (left border or background tint)

### EmergencyInfoCard
**Purpose:** Read-only emergency info display for authorized roles during travel
**Props:** contactName, contactPhone, allergyAlert, staffNote, lastUpdated, isStale
**Behavior:** Phone number tappable → native dialer; malformed phone → plain text + "Call manually"; null fields → "Not provided"; stale → amber left border + amber timestamp; fully readable offline from cache

### OperationalStatePicker (Bottom Sheet instance)
**Purpose:** Set operational status for a player from availability roster
**Props:** playerName, currentStatus, onSelect, isVisible, onDismiss
**Options:** Selected | Not Selected | Traveling | Medically Restricted
**Warning:** If setting Selected for Medically Restricted player → inline warning before confirm tap

### PreDepartureChecklistItem
**Purpose:** Fixed or custom checklist item for coordinator pre-departure view
**Props:** label, isComplete, isAutoPopulated, currentCount, totalCount (for auto-populated), onToggle (for custom), onViewDetail (for auto-populated)
**Behavior:** Fixed items show auto-populated status from real data; custom items manually checkable; tap auto-populated → scrolls to relevant section

---

## Component State Requirement

Every component must implement these states before shipping:
- Default / Empty
- Loading (skeleton or inline spinner)
- Populated / Active
- Error (where applicable)
- Disabled (where applicable)
- Offline (where applicable — read-only or disabled)
- Role-specific variants (where applicable)
