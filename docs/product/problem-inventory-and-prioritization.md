# Relay — Problem Inventory and Prioritization

## Problem Categories

| Category | Description |
|---|---|
| **Operational** | Running recurring team activities — scheduling, logistics, workflows |
| **Communication** | Information reaching right people at right time |
| **Coordination** | Multiple roles needing to act in sync without structure |
| **Logistical** | Travel, transport, accommodation, equipment |
| **Administrative** | Documents, records, confirmations, compliance |
| **Emotional** | Stress, trust, anxiety — operationally consequential |
| **Trust** | Reliability of information, people, systems |
| **Safety** | Gaps in information creating risk to player welfare |

---

## Tier 1 — Must Solve in MVP

These define the product's reason to exist. Failing to solve them means the product offers no compelling reason to replace WhatsApp and Sheets.

| ID | Problem | Who | When | Why | Current workaround | Consequence | Severity | Frequency | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| C-3 | Confirmation of receipt assumed, not verified | All | Any critical message | No acknowledgment mechanism | Ask "did everyone see this?" | Players miss info; staff blamed | High | Daily | Evidence-backed |
| C-2 | Critical info buried in group chats | All | Ongoing | WhatsApp used for everything | Pin messages; repeat-send | Players miss departure times | High | Daily | Evidence-backed |
| O-1 | Schedule changes propagate slowly/unreliably | All | Any time change occurs | No single source of truth | WhatsApp blast; hope for the best | Players miss sessions or arrive late | High | Weekly | Evidence-backed |
| C-1 | Players don't know squad/travel status until late | Players | Before each selection | Coaches communicate informally | Ask teammates or coaches directly | Anxiety; personal planning disruption | High | Per event | Evidence-backed |
| L-2 | Players can't reliably access travel logistics | Players | Day of / day before travel | Info sent once in group chat | Screenshot the message | Players miss bus; arrive at wrong location | High | Per trip | Evidence-backed |
| L-1 | Travel documents collected late or incompletely | Coordinator | Pre-travel admin window | No structured collection mechanism | Google Form or email | Departure delays; compliance risk | High | Per trip | Evidence-backed |
| A-2/S-1 | Emergency medical info inaccessible during travel | Staff/Coord | Medical incident on road | Info in office; not on mobile | Printed sheet; sometimes forgotten | Dangerous delays in response | Critical | Low freq | Evidence-backed |
| T-1 | Players don't trust availability flags are acted on | Players | After reporting status | No confirmation mechanism | Players repeat; some stop flagging | Hidden injuries; last-minute no-shows | High | Weekly | High-confidence assumption |

---

## Tier 2 — Valuable but Later

Real problems with real pain, but either less frequent, solvable once core is in place, or dependent on MVP infrastructure first.

| ID | Problem | Why it waits |
|---|---|---|
| K-1 | Medical clearance timing | Requires medical staff role engagement; build after core availability loop |
| K-3 | No unified visibility | Largely solved as byproduct of solving C-1, O-1, L-2 |
| O-2 | Training load decisions without availability data | Needs availability data to exist first |
| L-3 | Dietary and accommodation requirements | Real pain; manageable workaround; add once travel workflow established |
| L-4 | Return travel logistics | Extension of L-2; structurally similar; solve departure first |
| K-2 | Ops commits before squad finalized | Process problem; easier after squad announcement workflow exists |
| O-4 | Recurring admin rebuilt from scratch | Templates come after the first workflow is proven |
| E-3 | Coaches pulled into ops instead of prep | Resolves naturally as coordination infrastructure improves |

---

## Tier 3 — Low Priority or Out of Scope

| ID | Problem | Status | Reason |
|---|---|---|---|
| A-1 | Roster/eligibility compliance | Later | Highly org-specific; high risk of getting wrong |
| A-3 | Attendance records | Later | Useful; zero adoption impact; easy to add later |
| S-2 | Player whereabouts during travel | Later | Privacy-sensitive; needs careful design |
| C-4 | Tactical/session info retrievability | Out | Adjacent to video/analysis specialist tools |
| K-4 | Kit and equipment tracking | Out | Inventory management scope creep |
| C-5 | Language/communication barriers | Out | Localization infrastructure required |
| O-3 | Match-day staff role assignment | Out | Overlaps with coaching/tactical tools |

---

## Problem Clustering (Future Opportunity Areas)

**Cluster 1: Schedule and Availability Clarity**
O-1, O-2, C-1, K-1, T-1, T-2
*Core theme: No one has a reliable, shared, up-to-date view of who is available, for what, and when.*

**Cluster 2: Travel Operations and Logistics**
L-1, L-2, L-3, L-4, K-2, K-4, O-4
*Core theme: Away trips are high-effort, high-risk, and rebuilt from scratch every time.*

**Cluster 3: Communication Reliability**
C-2, C-3, C-4, C-5, O-3
*Core theme: Information is sent but not confirmed, structured, or retrievable when needed.*

**Cluster 4: Player Experience and Trust**
E-1, E-3, T-1, C-1
*Core theme: Players are treated as passive recipients of decisions, not participants in a structured system.*

**Cluster 5: Safety and Emergency Readiness**
S-1, S-2, A-2
*Core theme: Critical safety information is inaccessible at the moments it matters most.*

**Cluster 6: Administrative and Compliance Burden**
A-1, A-3, O-4, L-1
*Core theme: Record-keeping is manual, inconsistent, and creates compounding risk over a season.*

**Cluster 7: Operational Cognitive Load (Staff)**
E-2, E-3, K-3, O-4
*Core theme: The people responsible for coordination have no infrastructure — they run on personal effort and informal systems.*

---

## Key Trade-offs (Locked)

1. **Coordinator vs player optimization:** Coordinator workflows drive the product; player friction drives adoption. Every coordinator feature must have a lightweight player-facing counterpart.

2. **Travel depth vs non-travel frequency:** Travel is the hook; availability is the weekly habit. Both must be solved or the product becomes a trip-only tool.

3. **Safety coverage vs scope:** Emergency info as a simple data store is included in MVP. Clinical systems are not.

4. **Structured communication vs chat:** No general chat. The structured feed is the only official channel. This is a deliberate product boundary.
