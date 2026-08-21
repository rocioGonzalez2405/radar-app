# Radar App — Verification & Resource/Service Matching Assessment

**Date**: August 21, 2026  
**App Status**: ✅ Running | TypeScript strict | Fully styled | Responsive  
**Data Status**: ✅ All figures sourced & dated | Real public data only | Honest caveats included

---

## 1. App Verification — All Five Pages

### ✅ Triage Page (/)
- **Status**: Working. Shows 8 illustrative cases ranked by urgency score (96→70).
- **Data integrity**: Grounded in real 211 San Diego risk-factor study (Sept 2019).
- **Honesty**: Clearly labeled "Simulated — grounded in real study"; "Illustrative rows · not real records"; Footer explains HMIS individual records are protected by design.
- **Filters working**: All cases, With children, 18–24, Shelter exits.
- **Risk factors displayed**: Unemployment, education below HS/GED, race; protective factors shown.

### ✅ Forecast Page (/forecast)
- **Status**: Working. Four KPIs + two trend charts.
- **Data**: 
  - Countywide PIT Count: 10,605 → 9,905 → 9,803 (real, from RTFH)
  - Downtown unsheltered: 2,104 (May 2023) → 756 (Jun 2025) [64% drop, dated]
  - Average rent: $2,606/mo (CA Housing Partnership 2026, verified May 2026)
  - ELI rent burden: 79% pay 50%+ of income (same source)
- **Unemployment KPI**: 3.9% county, 4.7% state, 4.1% national (CA EDD June 2026, verified)
- **Footnote explains removed data**: DV shelter occupancy & eviction filings were removed because they have no public source for SD at this detail level. This honesty is the app's strongest signal — it doesn't invent.

### ✅ Capacity Page (/capacity)
- **Status**: Working. Subgroup % change + recent investments.
- **Data**:
  - Families ↓72%, Veterans ↓25%, Youth ↓22%, **Age 55+ ↑4%**
  - +160 beds (Rachel's Promise Center, women/families, winter 2025–26)
  - +190 safe parking spaces (H Barracks, May 2025)
  - 360+ city-funded beds over last 2 years
  - All with sources (Inside San Diego, City announcements, etc.)
- **Interactive**: Click subgroup to see source quote update (working).

### ✅ Investment/Simulator Page (/simulator)
- **Status**: Working. Shows regional outcomes, not what-if.
- **Data**:
  - HHAP funding: $220.6M (2019–2025, accountability.ca.gov)
  - People connected: 24,065 (HMIS aggregates, Jan 2023–Jun 2025)
  - People housed: 5,684
  - **Data quality caveat**: ~1 in 3 exit destinations unknown (State Auditor 2023-102.1)
- **Note**: The interactive "what-if budget simulator" slider was **removed** because there's no real data to calibrate it. This is the right call — better to show less and be right than invent.

### ✅ Sources Page (/sources)
- **Status**: Working. Two-column layout: Public (11) and Protected (2).
- **Each source shows**: Name, "Data as of" date, "Verified" date, status badge (Public/Protected).
- **Public sources verified**: RTFH, RTFH HMIS, Downtown SD Partnership, 211 San Diego, HUD PIT, State Auditor, HHAP accountability, EDD, Census, CA Housing Partnership.
- **Protected sources noted**: HMIS individual records + DV occupancy with explanation why (privacy, no public aggregate).

---

## 2. Data Source Verification — The 13 Sources

### Group A: Real PIT/monthly counts (core trend data) — ✅ All present
| Source | Used for | In app? | Dated? | Public? |
|--------|----------|---------|--------|---------|
| RTFH WeAllCount PIT Count | Countywide annual trend | ✅ | Jan 2026 | ✅ |
| RTFH Monthly Data & Performance | Inflow/outflow tracking | ✅ (referenced) | Mid-2026 | ✅ |
| Downtown San Diego Partnership monthly | Downtown-specific monthly trend | ✅ | Jun 2025 (last found) | ✅ |
| San Diego County Homelessness Dashboard | County-level performance | ✅ (referenced) | Since Feb 2026, monthly | ✅ |

### Group B: Housing/economic pressure (why the problem persists) — ✅ All present
| Source | Used for | In app? | Dated? | Public? |
|--------|----------|---------|--------|---------|
| CA Housing Partnership 2026 | Rent trend, ELI burden | ✅ | May 2026 | ✅ |
| U.S. Census Bureau ACS | Housing/income context | ✅ (referenced) | 2020–2024 | ✅ |
| CA EDD Local Area Unemployment | Unemployment rate | ✅ | May 2026 | ✅ |

### Group C: Program outcomes & funding (where money goes, what it achieves) — ✅ All present
| Source | Used for | In app? | Dated? | Public? |
|--------|----------|---------|--------|---------|
| accountability.ca.gov | HHAP/ERF funding & outcomes | ✅ | Through Jun 2025, page updated Feb 2026 | ✅ |
| CA State Auditor Report 2023-102.1/2 | Program effectiveness + data quality caveat | ✅ | Published Apr 2024 | ✅ |
| 211 San Diego Policy Brief | Risk-factor study backing Triage | ✅ | Sept 2019 | ✅ |

### Group D: Deliberately NOT in app (no public source exists) — ✅ Honest avoidance
| Data | Why not included | Status |
|------|------------------|--------|
| Individual HMIS case records | Protected by design; requires CoC data-sharing agreement | Correctly noted on Sources page |
| DV shelter occupancy | Survivor privacy protocols; no public aggregate | Honestly removed from Forecast |
| Eviction filings (detail level) | No public San Diego county-level source | Honestly removed from Forecast |
| Synthetic demand-vs-capacity gap | Made-up number; replaced with real investments instead | Correctly removed; Footnote explains |
| What-if budget simulator | No real data to calibrate; replaced with real outcomes | Correctly removed; acknowledged |

**Key insight**: The app's integrity rests on what it **doesn't** show. Every removed synthetic element has a note explaining why. This is the inverse of most hackathon dashboards and worth flagging to judges.

---

## 3. Resource/Service Matching Opportunity — The Gap

### What Radar currently does:
✅ Shows which populations are trending up/down  
✅ Shows existing capacity investments  
✅ Sources every number  
✅ Publishes projects organizations can contribute to (Impact Portal)  

### What Radar doesn't yet do:
❌ Link real organizations to real population subgroups  
❌ Show "if you're age 55+, here are the specialized services"  
❌ Route triage cases to matched services based on risk factors  
❌ Show which Impact Portal projects address which data gaps  
❌ Enable "fund this organization because it serves this rising subgroup"  

### The winning pitch for resource matching:
*"You see the data. Age 55+ went from 29% to 33% of the unsheltered population — but most dashboards stop there. Radar doesn't. It connects that to: which organizations specialize in seniors, what services they offer, how to refer someone, and how to fund them directly."*

---

## 4. Recommended Enhancements

### Phase 1: Wire the Impact Portal to the Radar data (quick, high-impact)
**What**: Each organization/project in the Portal gets a `subgroupsFocused` array and optional `riskFactorsAddressed` list.

**Example structure**:
```typescript
interface Project {
  // ... existing fields
  subgroupsFocused?: ('families' | 'veterans' | 'youth' | 'age-55+' | 'all')[]
  riskFactorsAddressed?: ('unemployment' | 'housing-instability' | 'eviction-risk' | 'legal-issues')[]
  relatedDataPage?: 'capacity' | 'forecast' | 'triage'  // link back to the insight
}
```

**On Capacity page**: Add a card: *"Organizations serving [subgroup]"* with a button to browse those Portal projects.

**On Portal project detail**: Show "This org addresses the [subgroup] gap highlighted on the Capacity page" with a sparkline of that subgroup's trend.

### Phase 2: Triage routing (medium complexity, major utility)
**What**: When showing a case on Triage (even simulated), suggest matched services based on risk factors.

**Example flow**:
- Case 4471: "Unemployed, eviction hearing in 3 days" → risk factors: legal, financial, employment
- Suggest: "Consider referring to: [Legal aid service], [Emergency assistance fund], [Job training program]"
- Each suggestion links to the Portal project (or external URL if not in Portal yet)

### Phase 3: Service directory integration (longer-term, requires data partnership)
**What**: Build a real service database (Yelp-for-homelessness-services model):
- Service name, address, phone, website
- What subgroup(s) served
- Hours, capacity, intake process
- Real-time occupancy (if available via HMIS partner)
- Map view

**Data sources**: 211 San Diego already does much of this; a partnership could provide a feed.

### Phase 4: Data-driven funding recommendations (highest complexity, highest value)
**What**: Machine-learning matching — given a rising subgroup and a pool of organizations, which orgs' current output would best close the gap?

**Example**: "The 55+ unsheltered population is rising. These organizations currently serve 55+ people but have 40% lower throughput than peers. Funding them could close 20% of the gap."

---

## 5. Data Source Enhancement Checklist

### Currently verified ✅
- All 11 public sources are sourced and dated in code
- All are findable and current (as of Aug 21, 2026)
- Protected sources are clearly noted with privacy explanation

### To strengthen for production:
- [ ] Add direct URLs to each source on the Sources page (where public sources are findable)
- [ ] Add "Last checked" timestamp to each source (currently "Verified: August 2026" — could be more granular)
- [ ] Create a source-check runbook: which URLs to visit quarterly to confirm data freshness
- [ ] For RTFH, Downtown San Diego Partnership, and County Dashboard: set up an alert for new releases

### To add for resource matching:
- [ ] 211 San Diego service directory (API or feed)
- [ ] HMIS agency list (which Continuum members are what type of service)
- [ ] CalEnviroScreen or Opportunity Index (which neighborhoods have highest service gaps)
- [ ] Nonprofit tech stack (what tools each org uses — informs integration API design)

---

## 6. Pitch-Ready Talking Points

### On data integrity:
*"Every number has a source and a date. When there was no public data (DV occupancy, eviction detail, individual case records), we removed those sections instead of inventing. That's why the app is smaller than it could be, and why organizations can trust what's shown."*

### On the core insight:
*"Yes, homelessness is down 64% downtown and countywide is down 7%. But the improvement is slowing (7% to 1% YoY), and one group is moving the opposite direction: adults 55+, now 33% of unsheltered, up from 29%. A dashboard that only shows the big total hides exactly who needs help. Radar doesn't."*

### On resource matching (the next step):
*"We built Radar to show the data. Now we're wiring it to show the response: which organizations serve the rising subgroups, how to refer cases to them, and how people can fund the gap directly through the Impact Portal. The data becomes actionable."*

---

## 7. Screenshots & Evidence

- ✅ Triage page: 8 cases, urgency-ranked, illustrative label visible
- ✅ Forecast page: County + downtown trends, rent/unemployment KPIs, footnote on removed synthetic data
- ✅ Capacity page: Subgroup chart with 55+ highlighted as warning, real investments listed with sources
- ✅ Investment page: Real outcomes + data quality caveat
- ✅ Sources page: 11 public + 2 protected, with dates and status badges
- ✅ Portal: Browse projects by support type, project detail view

---

## 8. Next Steps

### For the demo/pitch:
1. Stress the honesty: "We removed [3 things] because they had no real source."
2. Show the 55+ insight: "This is what Radar surfaced that a simpler dashboard wouldn't."
3. Walk through one end-to-end case: Triage → Capacity page showing serving org → Portal project funding that org.

### For production integration:
1. **Phase 1** (1–2 weeks): Add `subgroupsFocused` to Portal projects; link Capacity → Portal.
2. **Phase 2** (2–3 weeks): Implement triage routing suggestions with service matching.
3. **Phase 3** (4–6 weeks): Partner with 211 San Diego on service directory feed.
4. **Phase 4** (ongoing): Build ML matching logic once historical throughput data is available.

### For data sources:
1. Test all 11 public sources weekly (set calendar reminder).
2. Create a "Source freshness" runbook for handoff to ops.
3. Add direct links to the Sources page so users can verify independently.

