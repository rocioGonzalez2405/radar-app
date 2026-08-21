# Radar App — Verification & Resource Matching Summary

**Date**: August 21, 2026  
**Status**: ✅ Verified & Running | Ready for demo/submission

---

## Quick Verdict

### App Status: ✅ All systems operational
- **5 analytical pages**: Triage, Forecast, Capacity, Investment, Sources — all working, real data throughout
- **Impact Portal**: 6 pages (browse, detail, create, legal intake, volunteer signup, project management)
- **Data integrity**: All figures sourced, dated, and public (no invented numbers)
- **Honesty**: Explicitly removed synthetic data where no real source exists (DV occupancy, eviction filings, what-if simulator)

### Data Verification: ✅ All 11 public sources are current & findable
| Source | Data | Last verified |
|--------|------|---|
| RTFH PIT Count | Countywide 9,803 (2026) | Jan 2026 |
| Downtown SD Partnership | Downtown 756 unsheltered | Jun 2025 |
| CA Housing Partnership | Avg rent $2,606/mo (+22% in 5yr) | May 2026 |
| CA EDD | Unemployment 3.9% (county) | May 2026 |
| 211 San Diego | Risk-factor study (25% homeless within 4mo) | Sept 2019 |
| State Auditor | Program outcomes + data caveat | Apr 2024 |
| accountability.ca.gov | HHAP funding $220.6M | Jun 2025, updated Feb 2026 |
| + 4 more | (All verified, see ASSESSMENT.md) | Aug 2026 |

### Resource/Service Matching: ⚠️ Identified but not yet built
**Current state**: Portal projects exist separately from Radar insights.  
**Missing link**: No way to see "Age 55+ is rising → here are orgs serving seniors → fund them."  
**Opportunity**: 4-phase roadmap to wire them together (see RESOURCE_MATCHING_ROADMAP.md).

---

## The Five Pages — What's Real vs. What's Simulated

### 1. Triage Page (/)
**Status**: ✅ Real methodology, simulated cases  
- **8 illustrative cases**: Ranked by urgency (score 96→70), grounded in real 211 San Diego risk-factor study (Sept 2019)
- **Methodology**: Only ~25% of "unstably housed" people flagged by 211 calls become homeless within 4 months. Model uses real risk factors (unemployment, education, race) and protective factors (employment, ethnicity)
- **Honesty label**: "Simulated — grounded in real study" visible on page; individual HMIS records are protected by design
- **Subgroup filters**: All cases, With children, 18–24, Shelter exits (all working)

### 2. Forecast Page (/forecast)
**Status**: ✅ Real data; removed synthetic leading indicators  
- **KPIs (real)**:
  - Countywide: 10,605 → 9,905 → 9,803 [↓7% from 2024]
  - Downtown: 2,104 (May 2023) → 756 (Jun 2025) [↓64%]
  - Avg rent: $2,606/mo [↑22% over 5yr]
  - ELI rent-burdened: 79% [paying 50%+ of income]
- **Removed synthetic data**: DV occupancy trend + eviction filing trend (no public source exists for SD)
- **Replacement**: Shows housing pressure (rent + ELI burden) instead, which explains why problem persists even as count falls
- **Honest footnote**: Explains what was removed and why

### 3. Capacity Page (/capacity)
**Status**: ✅ Real subgroup trends + real investments  
- **Subgroup % change (RTFH PIT Count, 2024→2025)**:
  - Families: ↓72%
  - Veterans: ↓25%
  - Youth: ↓22%
  - **Age 55+: ↑4% ← Warning sign; only group rising**
- **Recent investments (real, dated)**:
  - +160 beds (Rachel's Promise, women/families, winter 2025–26)
  - +190 safe parking spaces (H Barracks, May 2025)
  - 360+ beds (city-funded, last 2 years)
- **No synthetic gap metric**: Removed the modeled demand-vs-capacity gap because no public source exists for San Diego

### 4. Investment Page (/simulator)
**Status**: ✅ Real outcomes; no what-if simulator  
- **Real results (accountability.ca.gov + State Auditor)**:
  - HHAP funding: $220.6M (2019–2025)
  - Connected to services: 24,065 people (Jan 2023–Jun 2025)
  - Housed: 5,684 people
- **Honest data caveat**: ~1/3 of exit destinations unknown (State Auditor finding)
- **Removed interactive what-if slider**: Had no real data to calibrate outcomes; better to show less and be right

### 5. Sources Page (/sources)
**Status**: ✅ All 11 public sources listed with dates + 2 protected sources explained  
- Each source shows: Name, "Data as of" date, "Verified" date, status (Public/Protected)
- Public sources: RTFH (x2), Downtown SD, County Dashboard, 211 SD, State Auditor, HHAP accountability, EDD, Census, CA Housing Partnership
- Protected sources: HMIS individual records (requires CoC agreement), DV occupancy (privacy protocols)
- **Strength**: Every figure in the app traces back to a named source with a date

---

## The Core Insight (Why This App Matters)

Most people assume "homelessness is getting worse in San Diego." The data says something more useful:

✅ **Progress is real**: Countywide down 7%, downtown down 64%  
⚠️ **But it's slowing**: 7% YoY drop → 1% YoY drop  
🚨 **And uneven**: All subgroups improving *except* one  
→ **Adults 55+: now 33% of unsheltered (up from 29%) — the only group rising**

A simple dashboard shows the big total. Radar doesn't. It surfaces exactly who's being left behind. That's the pitch.

---

## Resource/Service Matching — The Gap & The Fix

### What Radar currently does
✅ Shows which populations are trending up/down  
✅ Shows real capacity investments  
✅ Sources every number  
✅ Publishes projects in the Impact Portal  

### What Radar doesn't yet do
❌ Link organizations to the data insights  
❌ Say "Age 55+ is rising, here are orgs serving seniors"  
❌ Route cases to matched services based on risk factors  
❌ Enable "fund this org because it addresses this gap"  

### The winning next step
Wire the Impact Portal to the Radar analysis:
1. **Phase 1** (1–2 weeks): Add `subgroupsFocused` & `riskFactorsAddressed` fields to Portal projects; link Capacity page → Portal
2. **Phase 2** (2–3 weeks): Show suggested services on Triage page based on case risk factors
3. **Phase 3** (4–6 weeks): Integrate 211 San Diego service directory; make it searchable and live
4. **Phase 4** (ongoing): Use historical HMIS throughput data to recommend funding priorities

**Impact**: Organizations see which data gaps they address. Users discover them through Radar, not separately. Funding flows to the right places.

---

## Delivered Documents

### For the demo/pitch:
1. **ASSESSMENT.md** (15 pages)
   - Detailed verification of all 5 pages
   - Full source checklist (11 public, 2 protected)
   - Data integrity talking points
   - Anticipated Q&A

2. **RESOURCE_MATCHING_ROADMAP.md** (12 pages)
   - 4-phase implementation plan with code examples
   - Data model changes (TypeScript interfaces)
   - UI mockups and integration points
   - Success metrics

3. **This file** — Quick reference summary

### Evidence:
- Screenshots of all pages (Triage, Forecast, Capacity, Investment, Sources, Portal)
- App running locally; verified all navigation working
- All console errors resolved

---

## How to Use These Documents

### Before the demo:
1. Read **ASSESSMENT.md** sections 3 & 6 (core insight + anticipated Q&A)
2. Rehearse this: "We removed [X], [Y], [Z] because they had no public source" — this is your strongest talking point
3. Walk through one end-to-end scenario: Show Forecast → Capacity (highlight 55+) → Portal (show an org serving seniors)

### During the demo:
- Stress: "Every number has a source and a date. See it on the Sources page."
- Highlight: "The 55+ insight is what most dashboards miss. Radar surfaces it."
- Show resource matching vision: "Next, we wire the orgs to the data, so you can fund the rising subgroup directly."

### For judges who ask "what if we fund org X?"
- Say: "Right now, you'd have to cross-reference manually. Phase 1 of our roadmap wires that together — click on a subgroup, see orgs serving it, browse their projects, fund directly."

### For judges who ask "are these real numbers?"
- Open **Sources page** in the app. Point to a source. Say "Every number in the app traces back to this." Offer to verify any source on the spot.

### For judges who ask "what about the data gaps?"
- Say: "Good question. We started with synthetic DV occupancy and eviction filings, then realized neither has a public source for San Diego at this detail. So we removed them. That's why the app is smaller than it could be, and why organizations can trust what's shown."

---

## Next Steps for the Team

### Immediate (for submission):
- [ ] Verify all screenshots are current (app is running; dates are correct)
- [ ] Practice the 3-minute pitch using talking points from ASSESSMENT.md
- [ ] Have one backup person familiar with RESOURCE_MATCHING_ROADMAP.md in case judges ask about scaling

### Post-competition (if winning/continuing):
- [ ] Phase 1: Add resource/service matching fields to Portal projects (~1–2 weeks)
- [ ] Phase 2: Implement triage routing (~2–3 weeks)
- [ ] Phase 3: Partner with 211 San Diego for live service directory (~4–6 weeks)
- [ ] Phase 4: Collect HMIS throughput data; build funding recommendations (ongoing)

---

## Key Numbers to Remember for the Pitch

- **64%**: Downtown unsheltered decline (2,104 → 756)
- **7% → 1%**: YoY improvement rate slowing hard
- **33% vs 29%**: Age 55+ share rising (the only warning sign)
- **$2,606/mo**: Average rent (up 22% in 5 years)
- **79%**: ELI households severely rent-burdened
- **11**: Public sources; **2**: Protected sources; **0**: Made-up numbers
- **$220.6M**: Regional HHAP funding (2019–2025)
- **5,684**: People housed from that funding
- **~25%**: Only portion of "unstably housed" who become homeless (211 study)

---

## Questions? 

Refer to the full documents:
- **Technical questions**: ASSESSMENT.md, section 1–2
- **Data sourcing questions**: ASSESSMENT.md, section 2
- **Resource matching next steps**: RESOURCE_MATCHING_ROADMAP.md
- **Why we removed X feature**: ASSESSMENT.md, section 5 & RESOURCE_MATCHING_ROADMAP.md intro

