# Nonprofit Buy Nothing — Integrated into Radar UI

**Revision Date**: August 21, 2026  
**Integration Model**: Buy Nothing as native pages within Radar (not separate app)  
**Status**: Architecture updated for seamless UI integration

---

## Navigation Structure

### Updated Radar Navbar

```
Radar (logo)
├─ Triage           (existing, unchanged)
├─ Forecast         (existing, unchanged)
├─ Capacity         (modified — see below)
├─ Investment       (existing, unchanged)
├─ Rebalancing      ← NEW — Live trade feed + impact
├─ Sources          (existing, unchanged)
└─ Impact Portal    (modified — see below)
```

**Key principle**: 5 analytical pages → insights. Rebalancing page → actions. Portal → participation.

---

## Page Integration Map

### 1. Capacity Page (Modified)

**Current state**: Shows subgroup % change + capacity investments

**Integration**: Add "Organizations Addressing This Gap" section

```typescript
// /capacity
<div>
  {/* Existing: Subgroup chart + investments */}
  <SubgroupChangeBarChart data={subgroupChanges} />
  <CapacityInvestmentsCard />
  
  {/* NEW: Organizations serving this subgroup */}
  <OrganizationsAddressingGapCard subgroup={selectedSubgroup} />
    ├─ For subgroup "Age 55+":
    │  ├─ [Org X Card]
    │  │  ├─ Reputation: ★★★★★ (4.8/5)
    │  │  ├─ Status: "Senior housing nonprofit"
    │  │  ├─ Active Trades: 3 (50 beds + case mgmt hours)
    │  │  ├─ Current Need: "20 case mgmt hours"
    │  │  └─ [View in Rebalancing] [See Projects] buttons
    │  └─ [Org Y Card] ...
    └─ [Browse all trading this subgroup] → /rebalancing?filter=age-55-plus
```

**User experience**:
1. See "Age 55+ is rising 4%"
2. Scroll down → "Here's what organizations are doing about it"
3. Click org → See their Buy Nothing profile + portfolio
4. Or click "View in Rebalancing" → See all active trades for this subgroup

### 2. Rebalancing Page (New)

**Route**: `/rebalancing` or `/rebalancing?filter=age-55-plus&view=map`

**Four main sections**:

#### A. Live Trade Feed (Default View)

```
Rebalancing Dashboard — Live Trades

Filter by:
[Subgroup: All ▼] [Time: This Month ▼] [Status: All ▼]

🗺️ Map View | 📊 Timeline | 📋 Table

═══════════════════════════════════════════════════════════════

🗺️ MAP VIEW (Default)
  
  [San Diego map with pins]
  
  Pin colors by subgroup:
  🔵 Age 55+ (blue)
  🟢 Families (green)  
  🟡 Veterans (amber)
  🟣 Youth (purple)
  
  Cluster: "47 trades, 1200 people served this month"
  
  Click pin → Card:
  ┌─────────────────────────────────────────┐
  │ Org A ↔ Org B                           │
  │ "20 senior beds ↔ case mgmt hours"     │
  │ Fairness score: 82/100 ✓ Both agree    │
  │ Why: Age 55+ rising, org A has excess  │
  │ Started: Aug 15 | Expected: Sept 15    │
  │ Impact: 20 seniors getting housing     │
  │ [Details] [Radar insight]              │
  └─────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

📊 TIMELINE VIEW

  This Week (Aug 18–22)
  ├─ Mon 18: Org X → Org Y (beds ↔ case mgmt) ✓ Complete
  ├─ Tue 19: Org Z → Org A (meals ↔ transport) ⧖ Executing
  ├─ Wed 20: Org B → Org C (furniture ↔ training) ⧖ Negotiating
  └─ Thu 21: 2 more matched, awaiting acceptance
  
  Last Month Stats:
  ├─ 47 trades completed
  ├─ 1,200 people served
  ├─ 500 beds rebalanced
  ├─ 200 case mgmt hours traded
  └─ Avg fairness: 4.2/5 stars

═══════════════════════════════════════════════════════════════

📋 TABLE VIEW

  From Org | To Org | What | Fairness | Status | Radar Link
  ─────────┼────────┼──────┼──────────┼────────┼───────────
  Org A    | Org B  | Beds | 82/100 ✓ | Ready  | Age 55%
  Org C    | Org D  | Meals| 75/100 ✓ | Live   | Families
  ...
```

#### B. Impact Dashboard (Tab)

```
═══════════════════════════════════════════════════════════════

Impact of Rebalancing (This Month)

[4 KPI cards in row]
├─ Beds Rebalanced: 500
│  "Moved to highest-need areas based on Radar data"
├─ People Served: 1,200
│  "Through direct trades + downstream capacity freed up"
├─ Fairness Rating: 4.2/5 ⭐
│  "Both sides agree exchange was equitable"
└─ Time to Trade: 8 days (avg)
   "From need posted to delivery"

[Subgroup breakdown chart]
Age 55+  ███████░ 350 people (29%)
Families ██████░░ 280 people (23%)
Veterans ████░░░░ 240 people (20%)
Youth    ███░░░░░ 180 people (15%)
Other    ██░░░░░░ 170 people (14%)

[Geographic heatmap]
Highest rebalancing activity: Downtown, East Village
Connected to Radar insight: "Downtown count down 64%"

[Fairness distribution]
⭐⭐⭐⭐⭐ Excellent: 65% of trades (both sides 5⭐)
⭐⭐⭐⭐ Good: 25% of trades (both sides 4⭐)
⭐⭐⭐ Fair: 10% of trades (mixed ratings, flagged)
⭐ Disputed: 0% (conflicts resolved quickly)
```

#### C. Radar Context (Sidebar)

Every trade card shows **why it matters**:

```
═══════════════════════════════════════════════════════════════

Trade: Org A (50 senior beds) ↔ Org B (100 case mgmt hours)

Fairness Score: 82/100 ✓ Both orgs agree

📊 RADAR CONTEXT (Why this trade matters)
  
  Insight: Age 55+ unsheltered population rising
  ├─ 2024: 29% of unsheltered
  ├─ 2026: 33% of unsheltered (↑4%)
  ├─ Trend: Only subgroup getting worse
  └─ Data source: RTFH Point-in-Time Count
  
  Housing Pressure:
  ├─ Avg rent: $2,606/mo (+22% in 5 years)
  ├─ ELI burden: 79% pay 50%+ of income
  └─ This trade directly addresses housing gap
  
  This Trade Impact:
  ├─ Org A: "We have excess senior beds, frees up case mgmt focus"
  ├─ Org B: "We get senior housing capacity, can serve more 55+"
  ├─ Regional: "Rebalances toward highest-need subgroup"
  └─ Community: "20 seniors get stable housing"

[Radar full report] [Full trade details]
```

### 3. Impact Portal (Modified)

**Current state**: Browse nonprofit projects (donations, volunteering)

**Integration**: Add Buy Nothing section to each org

```typescript
// /portal/project/:id (existing org detail)

<OrgDetailPage org={org}>
  
  {/* Existing sections */}
  <ProjectOverview />
  <DonationGoals />
  <VolunteerSignup />
  
  {/* NEW: Buy Nothing Inventory & Needs */}
  <BuyNothingSection org={org}>
    
    ┌─ WHAT WE HAVE (Can Trade)
    │ ├─ 50 senior beds (available Sept 1)
    │ ├─ 100 case mgmt hours/month
    │ ├─ 2 vans for transport
    │ └─ [Full inventory] → /rebalancing?inventory=org-x
    │
    └─ WHAT WE NEED (Looking to Trade)
      ├─ 20 case mgmt hours/month
      ├─ Medical supply donations ($5K value)
      └─ [View matches] → /rebalancing?need=case-mgmt&org=x
  
  {/* How community can help */}
  <HelpThisOrg>
    ┌─ 💰 Donate to their campaigns (existing)
    ├─ 🤝 Volunteer with them (existing)
    ├─ 🔗 Trade resources (if you're a nonprofit) ← NEW
    └─ 📊 See their Radar insights (new tab)
  </HelpThisOrg>
  
  {/* Trade history */}
  <TradeHistoryCard>
    ├─ Org X: 50 beds ↔ Case mgmt (completed, fairness ⭐⭐⭐⭐⭐)
    ├─ Org Y: Transport ↔ Medical supplies (negotiating)
    └─ [Full trade history]
  </TradeHistoryCard>
</OrgDetailPage>
```

### 4. Sources Page (Minor Update)

**Current state**: Lists 13 data sources (11 public, 2 protected)

**Integration**: Add Buy Nothing metadata source

```
[Existing sources: RTFH, County, 211 SD, etc.]

NEW SECTION:
───────────────────────────────────────────

Buy Nothing Metadata
├─ Data: Organization profiles, inventory, fairness scores
├─ Source: Internal (marketplace-generated)
├─ Status: Live (updated in real-time)
├─ Public: Yes (all trades, fairness ratings, outcomes visible)
└─ Last verified: Aug 21, 2026

How Radar + Buy Nothing work together:
├─ Radar identifies priorities (age 55+ rising)
├─ Buy Nothing acts on them (facilitates trades serving those groups)
├─ Outcomes feed back to Radar (did it help?)
└─ Community sees the feedback loop
```

---

## React Component Architecture

### New Components to Build

```typescript
// Rebalancing page structure
src/pages/Rebalancing/
├── RebalancingPage.tsx (main page, router)
├── TradeFeed.tsx (map + timeline + table views)
├── ImpactDashboard.tsx (KPIs, charts, heatmap)
├── TradeCard.tsx (individual trade display with Radar context)
├── RadarContextCard.tsx (explains why this trade matters)
└── TradeFilters.tsx (subgroup, time, status filters)

// Modifications to existing components
src/pages/Capacity/
├── CapacityPage.tsx (add OrganizationsAddressingGap section)
└── NEW: OrganizationsAddressingGap.tsx

src/pages/Portal/
├── ProjectDetailPage.tsx (add BuyNothingSection)
└── NEW: BuyNothingSection.tsx

// Shared components
src/shared/buy-nothing/
├── FairnessScore.tsx (display fairness meter)
├── TradeStatus.tsx (visual status indicator)
├── ReputationBadge.tsx (org reputation display)
└── RadarSignal.tsx (shows which Radar insight this trade addresses)

// Data layer
src/shared/data/
├── radarData.ts (existing)
├── buyNothingData.ts (NEW: trade data, orgs, inventory, needs)
└── integration.ts (NEW: functions linking Radar → Buy Nothing)
```

### Updated Routes

```typescript
// src/app/routes.ts

export const ROUTES = {
  // Existing
  triage: '/',
  forecast: '/forecast',
  capacity: '/capacity',
  investment: '/simulator',
  sources: '/sources',
  
  // NEW
  rebalancing: '/rebalancing',
  rebalancingBySubgroup: '/rebalancing?filter=:subgroup',
  rebalancingByOrg: '/rebalancing?org=:orgId',
  
  // Portal modifications
  portal: '/portal',
  portalProject: '/portal/project/:id',
  
  // Navigation helpers
  capacityToOrg: (orgId) => `/capacity?highlight=${orgId}`,
  rebalancingToTrade: (tradeId) => `/rebalancing?trade=${tradeId}`,
}
```

### Navigation Flow

```
Radar Home
  ├─ Click "Capacity" → See Age 55+ trending
  │   ├─ Scroll down → "Orgs addressing this gap"
  │   └─ Click org card → /portal/project/org-x (see BuyNothingSection)
  │       └─ Click "View trades" → /rebalancing?inventory=org-x
  │
  ├─ Click "Rebalancing" → Live trade feed
  │   ├─ See map of all trades (color-coded by Radar subgroup)
  │   ├─ Click trade card → See Radar context ("Why this matters")
  │   └─ Click org → /portal/project/org-id
  │
  └─ Click "Impact Portal" → Browse orgs
      └─ Each org shows:
          ├─ Donation/volunteer projects (existing)
          ├─ BuyNothing inventory/needs (new)
          └─ Trade history + Radar insights
```

---

## Data Flow Architecture

### Radar → Buy Nothing (Weekly Signal)

```
Radar Data Processing
├─ Input: RTFH PIT Count (monthly), County Dashboard (monthly), EDD (monthly)
├─ Analysis: Identify rising/falling subgroups, housing pressure, funding flows
└─ Output: Priority signals

Example:
├─ "Age 55+ rising from 32% to 33%" → Priority signal
└─ Stored in: buyNothingData.prioritySignals

Buy Nothing Matching
├─ When: New need posted, inventory added, or weekly re-score
├─ Process: 
│  ├─ Load priority signals (age 55+ = boost 20%)
│  ├─ Calculate Match Score: Fit + Fairness + RadarImpact + Reputation
│  └─ Return ranked matches
└─ Result: Matches prioritize trades serving rising subgroups
```

### Buy Nothing → Radar (Feedback Loop)

```
Trade Completion
├─ People served: Track how many of each subgroup
├─ Outcomes: Did trade help the Radar-identified gap?
└─ Store: buyNothingData.tradeOutcomes

Example:
├─ Trade: 50 senior beds rebalanced
├─ Outcome: 50 age 55+ unsheltered served
├─ Impact: Helps address "Age 55+ rising" trend
└─ Report: "Buy Nothing trades served X people in Y subgroup"

Radar Dashboard Enhancement (Future):
├─ New KPI: "Impact of community rebalancing"
├─ Shows: "1,200 people served through Buy Nothing trades"
├─ Links: Each person count back to specific trades
└─ Story: "Rebalancing addressed X% of Age 55+ growth"
```

---

## UI/UX Consistency

### Design System Integration

All Buy Nothing components use **existing Radar design tokens**:

```typescript
// src/index.css (existing)
:root {
  --color-primary: #1a1a2e;    // Dark navy (Radar console)
  --color-accent-coral: #ff6b4a;
  --color-accent-teal: #2dd4a7;
  --color-accent-amber: #f59e0b;
  
  --space-unit: 4px;
  --border-radius: 8px;
  --transition: 200ms ease-out;
}

// Buy Nothing uses same tokens
<Card className="bg-navy-dark border-coral">
  <TradeCard fairnessScore={82}>
    <RadarSignal insight="Age 55+ rising" />
  </TradeCard>
</Card>
```

### Color Coding (by Radar Subgroup)

```
Age 55+:    🔵 Blue (#3b82f6)       [Radar: warning, rising]
Families:   🟢 Green (#10b981)      [Radar: declining but stable]
Veterans:   🟡 Amber (#f59e0b)      [Radar: stable]
Youth:      🟣 Purple (#8b5cf6)     [Radar: declining]
```

### Accessibility

- All trade cards: Keyboard navigable
- Fairness score: Color + text (not color alone)
- Radar context: Expandable (not required to understand trade)
- Mobile responsive (existing Radar standard)

---

## Phase 1 MVP: Integration Scope

### What's Included in MVP (Weeks 1–6)

#### Week 2–3: Rebalancing Page Foundation
- [ ] `/rebalancing` route
- [ ] Map view (basic pins, color-coded by subgroup)
- [ ] Timeline view (weekly trades)
- [ ] Trade card component (shows what, who, when)
- [ ] Manual trade data entry (admin adds trades from matched nonprofits)

#### Week 4: Radar Integration
- [ ] RadarContextCard component (explains why trade matters)
- [ ] Link from trade card → Radar insight
- [ ] Display Radar data next to each trade (priority signal)
- [ ] No live Radar sync yet (manual signals)

#### Week 5: Capacity Page Integration
- [ ] OrganizationsAddressingGap section on Capacity page
- [ ] Show orgs serving each subgroup
- [ ] Link to Rebalancing page filtered by that subgroup
- [ ] Reputation badge for each org

#### Week 6: Portal Integration
- [ ] BuyNothingSection added to org detail page
- [ ] Show inventory + needs for each nonprofit
- [ ] Link from Portal → Rebalancing
- [ ] Trade history display (completed trades)

#### **NOT in MVP** (Phase 2+):
- Impact dashboard (starts simple, builds after data accumulates)
- Live Radar sync (manual signals in MVP)
- Community discovery optimizations
- Advanced filtering

### MVP Deliverable

**User journey in MVP**:
1. Open Radar → Click "Capacity"
2. See Age 55+ trending up
3. Scroll → Click "View orgs addressing this gap"
4. See list of senior-focused nonprofits with reputation scores
5. Click org → See their Buy Nothing profile
6. Click "View trades" → Go to `/rebalancing?subgroup=age-55-plus`
7. See all active trades serving seniors with Radar context for each

---

## API Endpoints (Updated for Integration)

```typescript
// Buy Nothing API (within Radar backend)
GET    /api/buy-nothing/trades                // All trades
GET    /api/buy-nothing/trades?subgroup=age-55-plus
GET    /api/buy-nothing/trades?org=:orgId
GET    /api/buy-nothing/trades/:id            // Single trade detail
GET    /api/buy-nothing/trades/:id/radar-context

GET    /api/buy-nothing/orgs                  // All nonprofits in marketplace
GET    /api/buy-nothing/orgs/:id              // Org profile + trades + inventory
GET    /api/buy-nothing/orgs/:id/inventory
GET    /api/buy-nothing/orgs/:id/needs
GET    /api/buy-nothing/orgs/:id/trade-history

POST   /api/buy-nothing/trades                // Create trade (admin)
PUT    /api/buy-nothing/trades/:id            // Update trade status

GET    /api/buy-nothing/impact                // Impact metrics
GET    /api/buy-nothing/impact?month=2026-08

// Radar integration
GET    /api/radar/data                        // Existing
GET    /api/radar/priority-signals            // Radar → Buy Nothing signals (new)
```

---

## Implementation Timeline (Revised)

### Week 1: Planning & Integration Design
- [ ] Finalize navigation structure (what you just saw)
- [ ] Design component architecture
- [ ] Clarify Radar signal flow
- [ ] Database schema (add to existing Radar DB)

### Week 2–6: Build (as per MVP_SPRINT.md, but integrated into Radar codebase)

**Key difference from original**: 
- Engineers work in `src/pages/Rebalancing/` (not separate app)
- Use existing Radar styling/components
- Data lives in Radar database (not separate)
- Routes registered in Radar router

---

## Deployment

### Single Codebase

```
radar-app/
├── src/
│   ├── pages/
│   │   ├── Triage/
│   │   ├── Forecast/
│   │   ├── Capacity/ (modified)
│   │   ├── Investment/
│   │   ├── Rebalancing/ (NEW)
│   │   ├── Sources/
│   │   └── Portal/ (modified)
│   ├── shared/
│   │   ├── data/
│   │   │   ├── radarData.ts
│   │   │   └── buyNothingData.ts (NEW)
│   │   └── buy-nothing/ (NEW components)
│   └── app/
│       └── routes.ts (updated)
├── backend/ (Node.js/Express)
│   ├── routes/
│   │   ├── radar.ts (existing)
│   │   └── buy-nothing.ts (NEW)
│   └── database/
│       ├── Nonprofit table (NEW)
│       ├── Trade table (NEW)
│       └── ... (as per architecture)
└── docs/
    └── NONPROFIT_BUY_NOTHING_*.md (this architecture)
```

### Deployment → Single Docker image

```bash
docker build -t radar-app:latest .
docker run -p 3000:3000 radar-app:latest
```

Opens at `http://localhost:3000/` with **full integrated UI** (all pages including Rebalancing)

---

## Success in MVP (Week 6)

✅ **Integration Success Metrics**:
- User can navigate from Capacity → Rebalancing with context preserved
- Radar insights visible on every trade card
- Orgs visible on Capacity page + Portal page
- No "separate app" feeling — seamless experience
- Same design language (navy, coral, teal throughout)
- 10+ trades visible in Rebalancing with Radar context for each

---

## Summary: Buy Nothing Fully Integrated into Radar

**Before** (separate app):
```
Radar (analytics) → Buy Nothing (separate) 
→ User has to go to different app to see actions
```

**After** (integrated):
```
Radar (analytics + actions + community)
├─ See trends (Forecast, Capacity)
├─ See who's responding (Rebalancing page)
├─ See how to help (Portal with Buy Nothing)
└─ See impact (Rebalancing impact dashboard)
```

**User experience**: One app, one narrative: "Here's the problem. Here's what the community is doing about it. Here's how you can help."

