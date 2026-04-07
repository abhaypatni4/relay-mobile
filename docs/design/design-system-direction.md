# Relay — Design System Direction

## Design Principles

1. **Information before decoration** — every visual element earns its place by carrying meaning
2. **Calm is a design material** — the UI must not add to pressure; reserve saturation for things that matter
3. **Hierarchy does the work** — complexity managed through hierarchy, not by boxing everything separately
4. **Role-appropriate density, not one-size** — player screens glanceable; coordinator screens operationally dense
5. **States are the product** — status indicators are the information, not UI decoration
6. **Native where it matters, distinct where it counts** — behavior = native; visual language = Relay

---

## Product Aesthetic Direction

**Overall character:** Precision utility tool — confident, spare, deeply functional. Not trying to win a design award; trying to be the most useful thing on a coordinator's phone at 6:45 AM.

**Sharp or soft:** Moderately sharp. Corner radii 8–12px. Not brutally geometric, not soft and rounded. Composed, not cozy.

**Operational or lifestyle:** Operational, with a premium finish. No lifestyle photography, no gradient header images, no "inspired by the game" metaphors.

**Minimal or dense:** Role-aware. Minimal for players (single focused message per screen). Moderately dense for coordinators (more info, more actions, still hierarchically clear).

**Quiet or expressive:** Quiet with moments of intentional expression. Urgent Alerts elevated. Confirmed trip acknowledgment is satisfying. Expression is earned by context, not applied uniformly.

**Premium type:** Tool premium. Craft over flourish. Closer to Linear, Notion, Transit App than to sports hype or enterprise admin.

**What it must not look like:**
- A chat app (no chat bubbles, no conversation threads)
- A sports hype app (no dark gradients, no stadium photography, no condensed bold italic type)
- An enterprise admin tool (no sidebar navigation, no data table primary views, no modal-for-everything)
- A consumer social app (no emoji copy, no celebration animations, no streaks or badges)

---

## Color System

### System Philosophy
Structural UI (backgrounds, containers, dividers) stays almost entirely in neutrals. Chromatic color is used only for: primary actions, state indicators, urgency signals, and the brand mark.

### Primary Palette
**Relay Teal:** Deep, slightly desaturated teal in the blue-green family.
- Approximate range: HSL(185°–195°, 55–65%, 30–40%)
- Used for: primary action buttons, active tab indicators, links, brand mark
- Never used for: backgrounds, large surfaces, decorative fills
- On dark surfaces: same hue lightened to approximately 70–80% lightness

### Neutral Palette (warm-neutral, not blue-grey-cool)
**Light mode backgrounds:**
- Base background: ~HSL(40°, 8%, 97%) — not pure white
- Elevated surface (cards, sheets): pure white or very slightly elevated
- Recessed surface (input backgrounds): ~HSL(40°, 8%, 93%)

**Text levels:**
- Primary text: ~HSL(220°, 12%, 10%) — near-black, not pure black
- Secondary text: ~HSL(220°, 8%, 45%)
- Tertiary/label text: ~HSL(220°, 6%, 60%)
- Disabled text: ~HSL(220°, 4%, 72%)

**Dividers and borders:**
- Default divider: ~HSL(220°, 6%, 88%) — visible but unobtrusive
- Subtle divider: ~HSL(220°, 4%, 93%) — for separating items within a card

### Accent / Urgency Palette
**Amber-orange:** HSL(35°–42°, 85–90%, 45–50%)
- Not red — urgency in this product is time-sensitive, not dangerous
- Used for: Urgent Alert indicator, Overdue acknowledgment state, stale emergency info flag, pre-departure checklist unresolved items
- Never used for: success states, decorative elements, general emphasis

### Semantic Color States

| State | Color direction | Notes |
|---|---|---|
| **Success** | Muted green HSL(145°, 45%, 38%) | Desaturated — not celebration green |
| **Warning** | Amber accent (same as urgency) | Context distinguishes warning from urgent |
| **Destructive** | Deep muted red HSL(4°, 55%, 42%) | Destructive confirmation buttons only |
| **Error** | Same muted red, lighter | Inline validation errors |
| **Offline** | Neutral grey HSL(220°, 8%, 55%) | Offline is a state, not an error |
| **Overdue** | Urgency amber | Most visible operational state |
| **Stale data** | Subtle amber left border on container | Very light; not alarming |

### Color Usage Rules
**Should:**
- Reserve saturation for interactive and state elements only
- Use color consistently — same hue always means same thing
- Use color plus at least one other signal (icon, label, position) for every state

**Should not:**
- Use color as decoration or to add "visual interest"
- Apply Relay Teal to large background surfaces
- Use multiple chromatic colors on a single screen without semantic purpose
- Use pure black (#000000) or pure white (#FFFFFF) as primary values

---

## Typography

### Typeface
- **iOS:** SF Pro (system typeface; Dynamic Type compliant; no custom typeface in MVP)
- **Android:** DM Sans or Plus Jakarta Sans (matched weight range to SF Pro); Roboto acceptable
- **No display typeface** — primary typeface handles all scales
- **Tabular numerals** throughout for times, counts, and dates

### Scale

| Scale | Size range | Weight | Use |
|---|---|---|---|
| **Display** | 28–32px | Semibold | Screen titles, event names on hero cards; used sparingly |
| **Title** | 20–24px | Semibold | Section headers, card primary info (departure time) |
| **Body** | 15–17px | Regular / Medium | Post content, itinerary text, form values |
| **Label** | 12–14px | Medium / Semibold | Status labels, section category labels, metadata |
| **Caption** | 11–12px | Regular | Supporting context, secondary metadata; use sparingly |

**Minimum body text: 15px.** Nothing functional is smaller.

### Hierarchy Rules
- Weight carries priority; color is secondary
- Left-aligned on all functional screens; centered only for empty states and confirmation messages
- Body line-height: approximately 1.5×
- All-caps + letter-spacing only for section category markers; never for interactive elements or status states

### Density by Role
- **Player screens:** Larger type, more space, fewer typographic levels per screen
- **Coordinator screens:** Four typographic levels can coexist; hierarchy must be clear
- **Coach screens:** Intermediate density; summary counts at Title scale; roster rows tight

---

## Spacing and Layout

### Spacing Rhythm
Base-8 system. All spacing values are multiples of 4px, preference for 8px increments.

**Key values:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48

**In practice:**
- Internal card padding: 16px
- Between cards in list: 12px (tight) or 16px (standard)
- Section gap between major sections: **32px** (non-negotiable)
- Screen edge margin: 16px standard
- Minimum touch target height: 48px
- Button horizontal padding minimum: 16px

### Layout Density
- **Player:** Generous; cards breathe; touch targets large; visible space between sections
- **Coordinator:** Moderate; information denser but not cramped; 32px section gap maintained
- **Coach (availability roster):** Tight list density acceptable; 56–64px per player row; ~8–10 rows visible without scroll

### Section Separation Rules (in priority order)
1. **Spacing alone (32px gap):** Major sections in a scrollable workspace — no line, no background change
2. **Section label + spacing:** Label above section when the section needs to be identifiable at a glance
3. **Divider line:** 1px divider only within lists to separate individual items

Never: heavy border, background color change for entire section, card-within-a-card

---

## Component Philosophy

### Cards vs Lists: The Decision Rule
**Card** when: discrete object, <6 items, whole-card tap, needs prominence
**List** when: members of a set, 6+ items, row-level action, scan speed matters

Never mix cards and list items in the same parent container.

### Sticky Actions
Used when: primary action always available regardless of scroll; action is the culmination of what user is doing on the screen.
Maximum one primary sticky action per screen.

### Priority Expression
- Priority expressed through vertical position, size, and weight — not color
- Most important info at top; primary action at bottom (sticky or scroll-to-end)
- Critical items (overdue, urgent) reordered above non-critical in lists

### Avoiding Screen Fragmentation
- Never put a card inside a card
- Never use a box/container purely for aesthetic grouping
- Lists do not need a card wrapper
- TripDetailScreen is one unified scrollable surface, not stacked cards

---

## Status Indicator System

Every status must use color + at least one secondary signal:

| State | Color | Icon | Shape |
|---|---|---|---|
| Not Seen | Neutral grey | — | Outlined circle |
| Seen | Neutral grey (darker) | Eye | Filled circle |
| Acknowledged | Success green | Checkmark | Filled circle |
| Overdue | Urgency amber | Clock | Filled circle |
| Available | Success green | — | Filled dot |
| Limited | Urgency amber | — | Half-filled dot |
| Unavailable | Muted red | — | Filled dot (red) |
| Not Submitted | Neutral grey | — | Outlined dot |
| Traveling | Primary teal | Plane icon | — |
| Not Traveling | Neutral grey | — | — |
| Medically Restricted | Neutral grey | Restriction icon | — |
| Offline | Neutral grey | Cloud-off icon | Banner |
| Stale emergency info | Urgency amber | Warning icon | Left border |
| Pending member | Neutral grey | Clock icon | — |

---

## Feedback and State Patterns

### Loading
- Skeleton screens (not blank screens or full-page spinners)
- Shimmer animation: left-to-right, slow, 1.5s — disabled if reduced motion preference enabled
- Inline spinners only for action buttons during async operations

### Success
- Inline state change (primary pattern): acknowledgment button → confirmed state
- Inline toast for actions where screen doesn't change: "Reminder sent to 6 members"
- No full-screen success for standard actions

### Error
- Inline validation: below specific field, muted red, on blur (not on submit)
- Action failure toast: "Couldn't save — check your connection"
- No modal error dialogs for recoverable errors

### Offline
- Non-blocking banner below nav header: warm grey
- Cached content readable normally with last-synced timestamp
- Write actions: "Available when connected" label (not an error, a state)
- "Back online" toast on reconnection (3s)

---

## Motion Guidance

### Philosophy
Functional, not expressive. Motion confirms and guides — never entertains.

### Durations
- State changes: 150–200ms
- Navigation push: 300ms (platform default)
- Bottom sheet up: 250ms ease-out; down: 200ms ease-in
- Modal creation flow: 350ms slide up
- Skeleton → content: 200ms fade-in
- Toast: 200ms slide up; 150ms fade-out on dismiss

### Critical Interactions
- Acknowledgment tap: 150ms transition; spring on checkmark icon (slight overshoot, settles)
- Status dot fill: 200ms fill animation from center outward
- Availability selection: 1.02× scale on tap, settles at 1.0×, 150ms
- Haptic: medium impact on acknowledgment (iOS); light on status selection (iOS)

### Reduced Motion
- All transitions use simple opacity changes; no scale or translate animations
- Skeleton shimmer stops entirely

### What Motion Must Avoid
- Entrance animations on static content already loaded
- Looping or continuous animations on non-loading elements
- Celebratory animations on task completion
- Transition durations over 350ms for navigation
- Unsolicited animation

---

## Iconography

- **Style:** Outlined, 24px grid, 1.5px stroke weight
- **iOS:** SF Symbols (curated set)
- **Android:** Matched custom outlined set (visually consistent with iOS direction)
- **Never mix** icon styles from multiple libraries
- **Icon + label required** for non-universal actions (never icon-only for specific product actions)
- **Never sport-specific icons** in structural UI (no football, pitch, jersey)

---

## Accessibility Rules

| Requirement | Standard |
|---|---|
| Primary text contrast (light bg) | WCAG AAA (7:1) |
| Secondary text contrast | WCAG AA (4.5:1) |
| Label/tertiary text | WCAG AA Large (3:1) |
| All status states | Color + secondary signal (icon, label, shape, or position) |
| Touch targets | Minimum 48×48pt universally |
| Availability status options | Minimum 64px height, full width |
| Dynamic Type (iOS) | Supported; layouts reflow at larger sizes |
| Font scaling (Android) | Supported |
| Emergency info card | Fully readable at maximum accessibility text size |
| Screen reader labels | Explicit labels on all status indicators ("Acknowledged" not "green circle") |
| Focus order | Logical top-to-bottom, left-to-right; no focus traps except deliberate modals |

---

## Visual Anti-Patterns to Avoid

- **Patchwork quilt:** Every section in its own rounded shadow card
- **Gradient backgrounds** or gradient header images
- **Stadium/sports photography** in any UI surface
- **Emoji in structural UI** labels or status messages
- **Ultra-light typeface weights** (100/200) for functional text
- **Saturated red** for all warning/negative states
- **Icon-only buttons** for non-universal actions
- **Modal dialogs** for recoverable errors
- **Identical layout** for all roles (role-appropriate ≠ same with fields hidden)
- **Onboarding illustration carousels**
- **Celebration animations** on task completion
- **Over-rounded elements** (>16px radius on cards)

---

## Design Token Architecture

Two layers:

**Layer 1 — Primitive tokens:** Raw values
```
color.teal.600 = HSL(190, 60%, 35%)
spacing.4 = 4px
radius.md = 8px
duration.fast = 150ms
```

**Layer 2 — Semantic tokens:** Purpose-defined references
```
color.action.primary = color.teal.600
color.state.acknowledged = color.green.500
color.state.overdue = color.amber.500
color.text.primary = color.neutral.900
spacing.card.padding = spacing.16
radius.card = radius.md
duration.transition.stateChange = duration.fast
```

Design and engineering tokens share **identical naming**. No translation layer.

### Consistency Rules — Where Strict
- Status indicator color and icon mapping (same state = same color + icon everywhere)
- Touch target minimums (never below 48pt)
- Section spacing (32px between major sections — never varied)
- Card shadow values (use only defined elevation levels)
- Typography scale usage

### Where Flexibility Is Allowed
- Empty state illustration style
- Card content density by role
- Dark mode surface layering (fine-tuned per platform)
- Motion curve fine-tuning within "fast and purposeful" principle
