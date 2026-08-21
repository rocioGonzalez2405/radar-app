# Nonprofit Buy Nothing — Phase 1 MVP Sprint Plan

**Duration**: 6 weeks  
**Team**: 2–3 engineers + 1 product lead + 1 operations  
**Outcome**: 10+ successful nonprofit trades, validated fairness model

---

## Week 1: Discovery & Planning

### Day 1–2: Requirements Finalization
- [ ] Confirm 10–15 pilot nonprofit partners (reach out to RTFH, 211 SD)
- [ ] Get their buy-in on: "Manual matching for MVP, we'll facilitate"
- [ ] Document their specific inventory/needs for pilots (interviews)
- [ ] Map out admin workflows (who decides on matches? how?)
- [ ] Clarify fairness criteria with each org (what feels fair to you?)

### Day 3–4: Data Model Review
- [ ] Finalize PostgreSQL schema (Nonprofit, Inventory, Need, Match, Transaction, AuditLog)
- [ ] Design API (endpoints for admin, nonprofit dashboard, basic discovery)
- [ ] Plan audit logging (every action, timestamps, reasoning)
- [ ] Database setup + seeding with pilot nonprofit data

### Day 5: Kickoff & Team Alignment
- [ ] Ticket up all work for Week 2–6 (GitHub Issues)
- [ ] Assign ownership (Engineer A: Dashboard, Engineer B: Admin Console, Engineer C: API)
- [ ] Design review (data model, API, fairness scoring logic)
- [ ] Set up local dev environment (React + Node + PostgreSQL)

---

## Week 2: Core Backend & Data Model

**Focus**: API, database, matching logic

### Engineer A: Nonprofit Data & Inventory API
- [ ] `POST /nonprofits/register` — Register org (name, services, location, contact)
- [ ] `GET /nonprofits/:id` — Retrieve nonprofit profile
- [ ] `POST /nonprofits/inventory` — Add inventory item
- [ ] `GET /nonprofits/inventory` — List org's inventory
- [ ] `PUT /nonprofits/inventory/:id` — Edit inventory
- [ ] `DELETE /nonprofits/inventory/:id` — Remove inventory
- [ ] Database: Nonprofit, Inventory tables + seed data
- [ ] Audit logging: Track every add/edit/delete with timestamp + reasoning

### Engineer B: Matching & Transaction APIs
- [ ] `POST /nonprofits/needs` — Post what we're looking for
- [ ] `GET /nonprofits/needs` — List my needs
- [ ] `GET /admin/matches` — Find potential matches for a need (manual matching logic)
- [ ] `POST /admin/matches/:id/propose` — Admin proposes match to both orgs
- [ ] `POST /nonprofits/matches/:id/accept` or `/reject` — Org accepts/rejects match
- [ ] `POST /nonprofits/transactions` — Create transaction once both agree
- [ ] Database: Need, Match, Transaction tables
- [ ] Fairness scoring (basic formula, no Radar integration yet)

### Engineer C: Fairness & Audit Infrastructure
- [ ] Fairness scoring algorithm (value equivalence, benefit balance, capacity strain)
- [ ] Fairness score calculated when match proposed, updates in real-time
- [ ] AuditLog table + insertion on every action
- [ ] Rating schema (post-trade, 1-5 stars + comment)
- [ ] Database: AuditLog, FairnessRating tables

### End of Week 2
- [ ] All core APIs working (test via Postman)
- [ ] Database populated with pilot nonprofit data
- [ ] Manual matching flow tested (admin proposes, nonprofit accepts)
- [ ] Fairness scores calculated and logged

---

## Week 3: Nonprofit Dashboard UI

**Focus**: Frontend for nonprofits to manage inventory, see matches, rate trades

### Engineer A: Inventory Management Screen
- [ ] List my inventory (table: type, quantity, availability, subgroup)
- [ ] Add inventory modal (form: type, quantity, condition, availability dates)
- [ ] Edit/delete items
- [ ] Visual summary: "50 beds, 100 case mgmt hours, 2 meals programs"
- [ ] Link to: "Who needs what I have?" (early demand signals)

### Engineer B: Needs & Match Exploration
- [ ] Post a need (form: type, quantity, urgency, deadline, fairness criteria)
- [ ] View my active needs (status: open, matched, fulfilled)
- [ ] Browse matches for each need (table: org, what they're offering, fairness score, accept/reject)
- [ ] See match reasoning (e.g., "Good fit: 20 beds exact match, fair value, same subgroup")

### Engineer C: Transaction History & Ratings
- [ ] List all past transactions (what was exchanged, when, outcome)
- [ ] Post-trade rating modal (1-5 stars + comment on fairness)
- [ ] View ratings from counterparty
- [ ] Flag for admin if ratings differ significantly

### Design/UX
- [ ] Use existing Radar design system (dark navy, coral/teal accents)
- [ ] Responsive mobile-friendly (nonprofits check dashboards from anywhere)
- [ ] Accessibility (WCAG AA minimum)

### End of Week 3
- [ ] Nonprofit dashboard fully functional
- [ ] Can add inventory, post needs, accept/reject matches, rate trades
- [ ] All actions logged to AuditLog
- [ ] Tested with 2–3 pilot nonprofits (internal)

---

## Week 4: Admin Console & Fairness Review

**Focus**: Tools for staff to facilitate matches and review fairness

### Engineer A: Admin Match Facilitator
- [ ] Dashboard: "10 unmatched needs"
- [ ] For each need: Search/filter nonprofits' inventory (by type, quantity, location)
- [ ] Propose match: Select inventory, both orgs see proposal with fairness score
- [ ] Track match status (proposed, accepted, rejected, cancelled)
- [ ] Manual adjustments: "I think this should be fair at 18 beds not 20" (re-score)
- [ ] Reason field: Admin notes why this match matters (e.g., "Age 55+ rising — senior org needs more capacity")

### Engineer B: Fairness Review & Dispute Tracking
- [ ] Post-trade reviews (both orgs rated, flag if >1.5 star difference)
- [ ] Fairness review workflow (admin/arbiter can comment, mark resolved or escalate)
- [ ] Dispute filing interface (org uploads evidence, messages, outcome description)
- [ ] Dispute history (all disputes logged, outcomes visible)

### Engineer C: Analytics & Reporting
- [ ] Simple metrics dashboard:
  - "Total trades this week: 3"
  - "Average fairness rating: 4.2 stars"
  - "Disputes filed: 0"
  - "Most successful nonprofit: Org X (5 trades, 100% fairness)"
- [ ] Export data (CSV) for weekly reporting to RTFH

### End of Week 4
- [ ] Admin can facilitate matches (propose, track, adjust)
- [ ] Fairness review workflow works
- [ ] Reporting ready for first week of live pilot
- [ ] Tested internally with 2–3 matches

---

## Week 5: Live Pilot & Operational Support

**Focus**: Launch with 10–15 nonprofits, run manual matching, track outcomes

### Pre-Launch (Days 1–2)
- [ ] Onboard 10–15 nonprofits (account creation, dashboard walkthrough, phone calls)
- [ ] Load their inventory & initial needs into system
- [ ] Train staff on matching workflow (daily standup: "What needs are unfulfilled?")
- [ ] Set fairness threshold reminder (score must be > 70 to propose)

### Operations (Days 3–5 + ongoing)
- [ ] Daily: Admin reviews unmatched needs, proposes 2–3 matches
- [ ] Daily: Nonprofits log in, accept/reject/counter proposals
- [ ] As trades complete: Both nonprofits rate fairness
- [ ] Monitor: Fairness rating agreement (goal: >90%)
- [ ] Support: Answer nonprofits' questions (Slack/email)

### Success Criteria (by end of Week 5)
- [ ] 5–10 trade proposals made
- [ ] 3–5 trades completed
- [ ] Average fairness rating > 4.0 stars
- [ ] 0 disputes (or 1 quickly resolved)
- [ ] Nonprofits feedback: "This is working, but it would be great if it was automated"

### Parallel: Feedback Collection
- [ ] Daily debrief: What's working? What's not?
- [ ] Weekly call with pilot nonprofits: What would make this better?
- [ ] Document fairness disagreements (any trades rated unfairly by one side?)

---

## Week 6: Refinement & MVP Completion

### Days 1–3: Fix Issues, Refine Fairness
- [ ] Any bugs from Week 5 pilot
- [ ] Fairness scoring tweaks (if certain trade types consistently rated unfairly)
- [ ] Dashboard UX improvements (based on nonprofit feedback)
- [ ] Admin console optimizations

### Days 4–5: Validation & Documentation
- [ ] Count final trades: 10+? Yes/No
- [ ] Average fairness rating: >4.0 stars? Yes/No
- [ ] Disputes: 0–1? Yes/No
- [ ] Document MVP success metrics (blog post for RTFH, nonprofits)
- [ ] Gather testimonials from pilot nonprofits

### Deliverables
- [ ] Working nonprofit dashboard
- [ ] Working admin console
- [ ] PostgreSQL database with audit logs
- [ ] API endpoints (documented)
- [ ] Phase 1 success report (for Phase 2 planning)

---

## Technical Dependencies

### Must-Have by Week 2
- PostgreSQL setup + schema
- Node.js + Express API running
- Authentication (basic: API key for pilot nonprofits)

### Must-Have by Week 3
- React components (existing Radar codebase integration)
- Fairness scoring algorithm implemented
- Audit logging functional

### Must-Have by Week 4
- Admin console running
- Post-trade rating system working
- Fairness review workflow defined

### Must-Have by Week 5
- Everything above + tested with real nonprofits

---

## Risk Mitigation

**Risk**: Nonprofits don't use the system
**Mitigation**: Daily check-ins, help them find matches, celebrate wins publicly

**Risk**: Fairness scoring is perceived as unfair
**Mitigation**: Always show reasoning, admin can override with documentation, collect feedback weekly

**Risk**: Data entry burden (nonprofits have to manually add inventory)
**Mitigation**: Staff helps with initial data entry; keep forms simple

**Risk**: Scale (manual matching) can't handle 10+ simultaneous needs
**Mitigation**: Daily batch processing (all needs matched by EOD); 1 staff person can handle 5–10 matches/day

---

## Communication Plan

### Daily Standup (15 min)
- [ ] What matched today?
- [ ] Any issues?
- [ ] What's next?

### Weekly Nonprofit Check-In (30 min, Zoom)
- [ ] How's it going?
- [ ] Any trades coming?
- [ ] Feedback on fairness?
- [ ] What would help?

### Weekly Stakeholder Report (email)
- [ ] Trades this week: X
- [ ] Average fairness: Y stars
- [ ] Key learnings
- [ ] Next week's focus

### End-of-Phase Report (presentation to RTFH + nonprofits)
- [ ] 10+ trades completed ✓
- [ ] 90%+ fairness agreement ✓
- [ ] Phase 2 recommendations

---

## Success Metrics (Week 6 Checkpoint)

| Metric | Target | Status |
|--------|--------|--------|
| Trades Completed | 10+ | ✓ |
| Fairness Rating (avg) | > 4.0 stars | ✓ |
| Fairness Agreement | > 90% (both orgs agree it was fair) | ✓ |
| Disputes Filed | 0–1 | ✓ |
| Nonprofit Satisfaction | "Would use if automated" | ✓ |
| System Uptime | > 99% | ✓ |
| Support Tickets | < 5 | ✓ |

---

## Post-MVP (Week 7+): Phase 2 Planning

Once MVP is validated:
1. Automate matching algorithm (Week 7–8)
2. Integrate Radar data feeds (Week 9)
3. Build community discovery UI (Week 10–11)
4. Scale to 30–50 nonprofits (Week 12)

Estimated Phase 2: 4 weeks (end of Month 3)

