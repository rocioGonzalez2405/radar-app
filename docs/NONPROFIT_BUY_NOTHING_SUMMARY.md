# Nonprofit Buy Nothing — Executive Summary

**Generated**: August 21, 2026  
**Ultracode Workflow**: 12 agents, 6 parallel phases, 520K+ tokens  
**Status**: Architectural design complete, ready for Phase 1 MVP development

---

## The Vision

**Nonprofit Buy Nothing** is a resource rebalancing marketplace for San Diego nonprofits serving unsheltered/homeless populations, powered by real homelessness data (Radar).

**Core Principle**: Resources flow to where they're needed most based on data, not charity. Fair exchanges ensure both organizations benefit.

**Example**:
```
Radar shows: Age 55+ unsheltered population rising (29% → 33%)
Buy Nothing finds: Senior-focused nonprofit has need; other nonprofit has excess capacity
Fair trade: Exchange beds for case management hours
Result: 50 seniors get placement, exchange marked fair by both sides
Community sees: "500 seniors matched through rebalancing this month"
```

---

## Why This Works

**Problem**: Resources in San Diego's nonprofit ecosystem are unevenly distributed.
- Families' unsheltered count down 72% → some orgs have excess capacity
- Age 55+ unsheltered count up 4% (only group rising) → senior-focused orgs stretched thin
- Average rent $2,606/mo, 79% of ELI households severely burdened → acute housing need

**Traditional Solution**: Reallocate funding (slow, bureaucratic)

**Buy Nothing Solution**: Let nonprofits directly trade excess capacity for unmet needs, informed by real data
- Faster (weeks not months)
- Equitable (both sides benefit, fairness-first)
- Data-driven (Radar signals inform priority)
- Transparent (community sees rebalancing happening)

---

## Key Innovation: Fairness as a Feature

Unlike donation platforms, Buy Nothing makes exchange mutual and equitable:

**Fairness Score** (0-100):
- Value equivalence: Is what I give worth what I receive?
- Benefit balance: Does each org benefit from this trade?
- Capacity strain: Will either org get overwhelmed?
- Radar impact: Does it address data-driven priorities?

**Both organizations must accept the fairness score before transaction locks in.**

Result: Resources flow to highest-need subgroups (verified by data) without charity dynamics.

---

## What's Included in the Architecture

### 1. **Data Model** (Complete TypeScript schema)
- Nonprofit profiles (services, capacity, location, reputation)
- Inventory (what orgs have: beds, services, equipment)
- Needs (what orgs are requesting: type, quantity, urgency)
- Matches (proposed exchanges with real-time fairness scoring)
- Transactions (completed trades with ratings and outcomes)
- AuditLog (every action timestamped for fairness disputes)
- Taxonomies (23 service types, 10 demographic segments from RTFH data)

### 2. **Matching Algorithm**
- **Trigger**: Nonprofit posts a need
- **Process**: System scans all inventory, calculates Match Score for each:
  - Fit (40%): Does inventory match the need?
  - Fairness (35%): Is the exchange equitable?
  - Radar Impact (20%): Does it serve rising subgroups?
  - Reputation (5%): Trust history multiplier
- **Output**: Ranked list of matches with explanations
- **Radar Integration**: Weekly data refresh boosts matches serving age 55+, families with capacity pressure, etc.

### 3. **Fair Exchange System**
- **Reputation Scoring** (0-100, public): Track nonprofit fairness history
- **Fairness Rating** (post-trade): Both orgs rate 1-5 stars, flag if >1.5 star difference
- **Dispute Resolution**: Neutral arbiter reviews disagreements, precedents are public
- **Incentives**: Higher reputation = better matches, priority access, quarterly recognition

### 4. **UI/UX Flows**
- **Nonprofit Dashboard**: Inventory management, needs posting, match exploration, transaction history, fairness ratings
- **Admin Console**: Match facilitation, fairness review, dispute tracking, analytics
- **Community Discovery** (public): Browse active trades, see Radar context, impact dashboard, find nonprofits to help

### 5. **Integration Architecture**
- **Data Pipeline**: Weekly RTFH PIT Count + County Dashboard + 211 data → Priority signals for matching
- **API Design**: REST endpoints for nonprofits (dashboard actions), admin (match facilitation), community (discovery)
- **Matching Engine**: Runs on-demand + weekly re-score + triggered by reputation changes
- **Feedback Loop**: Buy Nothing outcomes feed back to Radar ("Did rebalancing help age 55+ outcomes?")

### 6. **3-Phase Roadmap**
- **Phase 1 (Months 1–2)**: MVP with 10–15 pilot nonprofits, manual matching, fairness validation
- **Phase 2 (Months 3–4)**: Automated matching, 30–50 nonprofits, Radar data integration live, community discovery
- **Phase 3 (Months 5–6)**: Public launch, 100+ nonprofits, 200+ trades/month, impact visible to community

---

## MVP Scope (Phase 1)

**Duration**: 6 weeks  
**Team**: 2–3 engineers + 1 product + 1 ops

**What It Does**:
- 10–15 nonprofits register, add inventory, post needs
- Staff manually facilitates matches (recommends trades)
- Both nonprofits rate fairness (1-5 stars) after each trade
- Admin tracks metrics (trades, fairness, disputes)

**What It Doesn't Do Yet**:
- Automatic matching (staff-facilitated in MVP)
- Radar data integration (manual signals only)
- Community discovery (internal only)
- Dispute arbiter (admin handles)

**Success Criteria**:
- 10+ trades completed
- 90%+ fairness agreement (both orgs rate as fair)
- 0 major disputes
- Nonprofits say: "This would be great if it was automated"

**6-Week Sprint**:
- Week 1: Requirements, data model, team alignment
- Week 2: Backend API, database, matching logic
- Week 3: Nonprofit dashboard UI
- Week 4: Admin console, fairness review
- Week 5: Live pilot with 10–15 nonprofits
- Week 6: Refinement, validation, Phase 2 planning

---

## How Radar Data Powers This

**Weekly Data Refresh** (Radar → Buy Nothing):
```
Radar Input:
├─ Age 55+: 29% → 33% of unsheltered (RISING) ← Priority signal
├─ Families: Down 72% (declining) ← Lower priority
├─ Rent: $2,606/mo, +22% in 5yr (crisis signal) ← Housing focus
└─ Funding: $220.6M HHAP, 5,684 housed ← Validate outcomes

Buy Nothing Processing:
├─ "Age 55+ rising" → Boost matches serving seniors 20%
├─ "Families declining" → Don't actively seek family capacity
├─ "Rent pressure" → Prioritize housing over temporary shelter
└─ "HHAP outcomes" → Track: Did Buy Nothing trades contribute?

Result:
├─ Nonprofits see: "This match helps address age 55+ rise"
├─ Community sees: "1,000 seniors matched via rebalancing this month"
└─ Feedback: Buy Nothing data feeds back into Radar recommendations
```

---

## Data Sources (San Diego Public Data)

All sourced, dated, verified:

1. **RTFH WeAllCount PIT Count** — Annual countywide count (Jan 2026: 9,803)
2. **RTFH Monthly Data** — Inflow/outflow, subgroup trends (Jun 2026)
3. **Downtown San Diego Partnership** — Monthly unsheltered count (756 in Jun 2025)
4. **San Diego County Dashboard** — County-level performance (since Feb 2026)
5. **211 San Diego** — Risk-factor research (Sept 2019 study)
6. **CA Housing Partnership** — Rent, ELI burden data (May 2026)
7. **CA EDD** — Unemployment rate (May 2026: 3.9% county)
8. **State Auditor Reports** — Program outcomes, data quality (Apr 2024)
9. **accountability.ca.gov** — HHAP funding data ($220.6M, 2019–2025)

**Privacy**: No individual HMIS records shown. Buy Nothing works with org-level data + Radar aggregate trends.

---

## Competitive Advantages

1. **Fairness-first** — Not charity; both sides agree exchange is equitable
2. **Data-driven** — Real homelessness trends inform matching priorities
3. **Transparent** — Every action logged, fairness scores explained, outcomes tracked
4. **Nonprofit-owned** — Designed with their input, solves their problems
5. **Scalable** — MVP validates concept; Phase 2+ automated matching scales to 100+ orgs

---

## Success Looks Like (End of Phase 3)

- 100+ nonprofits actively trading in marketplace
- 200+ trades per month
- 1,000+ bed-nights and services rebalanced monthly
- Age 55+ seniors receiving measurably more service access
- Average fairness rating 4.0+ stars
- Zero disputes that escalate beyond resolution
- Community impact visible: "1,200 people served through rebalancing this month"
- Media coverage: "Tech-powered nonprofit collaboration model"
- RTFH partnership deepened: Buy Nothing feedback informs regional planning
- Expansion plan ready for other California cities

---

## Deliverables

### Complete Architecture (3 Documents)
1. **NONPROFIT_BUY_NOTHING_ARCHITECTURE.md** (full design)
   - Data model & TypeScript schema
   - Matching algorithm with pseudocode
   - Fair exchange system (reputation, fairness, disputes)
   - UI/UX flows (nonprofit dashboard, admin console, community discovery)
   - Integration architecture (Radar data, API design, matching engine)
   - 3-phase roadmap with success metrics

2. **NONPROFIT_BUY_NOTHING_MVP_SPRINT.md** (6-week implementation plan)
   - Week-by-week breakdown
   - Engineer assignments (what each person builds)
   - Daily/weekly milestones
   - Risk mitigation
   - Success criteria

3. **This Summary** (executive overview)

### Parallel: Radar Verification Complete
- 5 pages verified (Triage, Forecast, Capacity, Investment, Sources)
- 11 public data sources verified and current
- 8 key insights documented
- Demo day materials ready

---

## Next Steps (This Week)

1. **Review Architecture** (2h)
   - Read NONPROFIT_BUY_NOTHING_ARCHITECTURE.md (Sections 1–5)
   - Note: Questions, ideas, concerns

2. **Confirm MVP Scope** (1h call)
   - Adjust pilot nonprofit count (10–15?)
   - Confirm fairness criteria (what matters to them?)
   - Clarify admin role (staff facilitates matches?)

3. **Start Phase 1 Planning** (1h)
   - Select 10–15 nonprofits to approach
   - RTFH partnership: Data access, arbiter process
   - Rough timeline (start MVP when? 2 weeks? 1 month?)

4. **Team Onboarding** (3h)
   - Brief engineers on architecture
   - Walk through data model + matching algorithm
   - Assign Week 1 prep work (database design, API planning, UI mockups)

---

## Budget Estimate (Phase 1 MVP)

**Team** (6 weeks):
- 2 Engineers @ $150/hr × 40h/week × 6 weeks = $72K
- 1 Product Manager @ $120/hr × 20h/week × 6 weeks = $14.4K
- 1 Ops/Support @ $80/hr × 15h/week × 6 weeks = $7.2K

**Infrastructure**:
- PostgreSQL hosting: $100/month × 2 (dev + prod) = $200
- API hosting (Node.js): $50/month × 2 = $100
- CDN/static assets: $50
- Tools (GitHub, Figma, monitoring): $200

**Total MVP Cost**: ~$94K (6 weeks)

**Phases 2–3** (additional):
- Phase 2 (automation, Radar integration): ~$60K (4 weeks)
- Phase 3 (public launch, scale): ~$80K (ongoing maintenance + features)

---

## Why Now?

1. **Data is ready** — RTFH PIT data, County Dashboard, 211 San Diego all public and current
2. **Problem is acute** — Age 55+ rising, housing crisis, nonprofit resources unevenly distributed
3. **Team is aligned** — Radar prototype validated the data-driven approach
4. **Nonprofit appetite** — Informal conversations show interest (need efficiency, fairness)
5. **Scalable model** — MVP success → Phase 2 → California cities → National

---

## The Ask

**To move forward**:
1. Confirm this is the direction you want to go (marketplace vs. other approaches?)
2. Allocate 6-week MVP team (2–3 engineers, 1 product, 1 ops)
3. Start Phase 1 planning (nonprofit recruitment, RTFH partnership)
4. Budget approval (~$94K for MVP)

**If yes on all three → MVP launches in 1–2 weeks, Phase 1 complete by October end**

---

## Questions?

Refer to:
- **Full Architecture** → NONPROFIT_BUY_NOTHING_ARCHITECTURE.md
- **Implementation Plan** → NONPROFIT_BUY_NOTHING_MVP_SPRINT.md
- **Data Sourcing** → Radar app, VERIFICATION_SUMMARY.md

---

**Status**: ✅ Ready to build

