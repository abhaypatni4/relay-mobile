# Relay — User Roles and Jobs to Be Done

## Role Philosophy

Design around responsibilities and jobs-to-be-done, not job titles. The "coordinator" may be a team manager, an assistant coach, a student manager, or an admin. What matters is the job they do.

## Role Definitions

### Coordinator
The primary operational owner of a trip or event.
- One per team per workflow (primary owner)
- Responsibilities: logistics, communication, document collection, squad confirmation, emergency info management
- Highest coordination burden; most motivated to adopt new tools
- Creates events, invites members, manages the team
- Has full permissions across all workflows

### Coach (Head Coach / Assistant Coach)
Sets direction and makes selection decisions.
- Makes availability and selection decisions
- Needs consolidated squad readiness view
- Does not own logistics; does own selection
- Head coach adoption unlocks squad-wide adoption
- Critical behavior change required: updating selection in the app

### Player
Consumer of schedule, travel, and selection information. Producer of availability status and confirmations.
- Lowest friction tolerance; lowest intrinsic motivation
- Highest adoption risk; most critical to product success
- Player actions must feel like receiving value, not doing admin
- Maximum 3 taps for any critical action

### Staff (Medical / Physio / Support)
- Sets Medically Restricted status for players
- Accesses emergency info during travel
- Receives role-relevant communications
- Does not own coordinator or coach workflows

## Jobs to Be Done by Role

### Coordinator

**Functional:**
- Create and manage a complete trip in one place
- Know in real time who has seen and acknowledged critical info
- Follow up with non-responders without leaving the product
- Handle trip cancellation/rescheduling without external tools
- Transfer coordinator ownership without losing team history
- Access squad emergency info on the road, offline if needed

**Emotional:**
- Feel in control; stop running on memory and stress
- Have proof of what was communicated and when
- Stop being the single point of failure for operational decisions

**Coordination:**
- Replace the pre-trip WhatsApp thread with a structured workspace
- Ensure nothing falls through the cracks before departure

---

### Coach

**Functional:**
- See consolidated per-event player availability with context
- Mark selection decisions quickly from a mobile device (≤30s)
- Know selection decisions have been communicated without messaging
- Receive structured availability updates, not informal texts

**Emotional:**
- Feel prepared, not reactive during match week
- Trust that operational chaos isn't degrading tactical preparation

**Coordination:**
- Align with medical/physio on player status without verbal chase
- Get reliable squad picture before making selection decisions

---

### Player

**Functional:**
- Know clearly and early whether they're on a trip or selected
- Access travel logistics at any time without scrolling chat
- Submit availability status with minimal friction (1 tap + optional note)
- Trust their availability flag was received and acted on
- Access trip card offline when signal is unavailable

**Emotional:**
- Feel respected — information reaches them in time
- Know their input matters (selection notification closes the loop)
- Not feel anxious about missing something important

**Coordination:**
- Confirm attendance, flag availability changes
- Receive match-day call-up confirmations without asking

---

### Staff

**Functional:**
- Set Medically Restricted status visible to coaches only
- Access player emergency info during travel without coordinator
- Receive travel and event communications relevant to their role

**Emotional:**
- Feel their input (medical restrictions) is respected and used

**Coordination:**
- Communicate availability restrictions to coaches structurally

## Information Density by Role

| Role | Screen density | Primary scan | Primary action |
|---|---|---|---|
| Coordinator | Moderate-high | What needs my attention? | Create, manage, nudge |
| Coach | Moderate | Who is available? | Set selection status |
| Player | Low | Am I on this trip? | Acknowledge, confirm |
| Staff | Low-moderate | What do I need to know? | Access emergency info |

## Adoption Risk by Role

| Role | Risk | Mitigation |
|---|---|---|
| Coordinator | Doesn't build habit in first 2 weeks | Onboarding tied to real event; immediate value |
| Coach | Doesn't update selection status in app | Selection flow ≤30s; critical for player trust loop |
| Player | Doesn't install or disengages | Invitation flow frictionless; first experience shows real content |
| Staff | Doesn't complete emergency info | Prompted at onboarding; coordinator can send reminder |

## User Ecosystem Summary

### Primary Users (direct, frequent, functional)
- Coordinator / Team Manager / Operations Lead
- Head Coach / Assistant Coaches
- Players
- Medical / Physio Staff

### Secondary Users (occasional or dependent — post-MVP consideration)
- Club Administrator
- Athletic Director
- Academic compliance staff

### Buyer / Commercial Model
Not constrained for MVP. The product is designed for real daily value across roles. Commercial model is a future decision.

### Who Influences Usage
- Head coach: if they don't use it, the squad won't
- Club CEO/Director: if they mandate it, adoption is forced top-down
- Senior players: informal influencers on whether younger players engage
