# Phase 1 Resource Matching UI & Integration Review

**Date:** 2026-08-21  
**Reviewer:** Design System & Integration Analysis  
**Status:** Specification review — issues identified, verification needed

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Capacity Page Integration Assessment](#1-capacity-page-integration-assessment)
3. [Portal Project Detail Card Design](#2-portal-project-detail-card-design-issues)
4. [Matching Display Usability](#3-matching-display-usability)
5. [Design Consistency Issues](#4-design-consistency-issues)
6. [Integration Point Issues](#5-integration-point-issues)
7. [Specific Design Recommendations](#6-specific-design-recommendations)
8. [Verification Checklist](#7-verification-checklist)
9. [Open Questions for Product](#8-open-questions-for-product)

---

## Executive Summary

Phase 1 resource matching aims to **link Impact Portal projects to Radar's Capacity page**, enabling contextual discovery of organizations addressing trending subgroups. The roadmap specification is conceptually sound but **design integration is incomplete**:

✓ **Defined:** Data model extensions (`SubgroupType`, `RiskFactorType`, `radarPageContext`)  
✓ **Defined:** Basic UI mockups for both pages  
✗ **Undefined:** Card placement, visual hierarchy, state binding, color rules  
✗ **Missing:** Implementation files (`resourceMatcher.ts`), portal data metadata, responsive validation  

**Key findings:**
- **1.1** — Org card placement unclear (selected subgroup only vs. all subgroups?)
- **1.2** — Portal data lacks required metadata fields; resourceMatcher utility missing
- **2.1** — Color token usage breaks design system (teal-dim + border-teal = jarring contrast)
- **4.1** — No documented color rule for coral (primary) vs. teal (secondary) across pages
- **5.1** — State management for selected subgroup filtering undefined

---

## 1. Capacity Page Integration Assessment

### Issue 1.1: Missing Section Placement Clarity

**Category:** Specification ambiguity  
**Severity:** High — blocks implementation direction

**Finding:**  
The roadmap specifies adding "Organizations serving this subgroup" as a new card *after the capacity investments list*, but:

- Current `CapacityPage.tsx` structure: KPI cards → chart → capacity investments list
- Card placement relative to existing content is ambiguous
- **Unclear:** Should matching orgs appear for:
  - *(A)* Selected subgroup only (filtered by chart interaction)?
  - *(B)* All subgroups (static list)?
  - *(C)* Top N subgroups (condensed)?

**Visual context:**
```
Current structure:
┌─────────────────────────────────┐
│ KPI Cards (4 cols)              │ ← All subgroups showing change %
├─────────────────────────────────┤
│ Chart: Subgroup % Change        │ ← User clicks bar → selected updates
├─────────────────────────────────┤
│ Recent Capacity Investments     │ ← List of funding events
└─────────────────────────────────┘

Proposed addition (WHERE?):
┌─────────────────────────────────┐
│ Organizations serving [selected]│ ← NEW — but positioned where?
└─────────────────────────────────┘
```

**Recommendation:**
- **Option A (recommended):** Show orgs for *selected* subgroup immediately after chart
  - Pro: Tight feedback loop — user clicks bar → sees matching orgs
  - Con: Org list changes dynamically; users need visual feedback
  - Implementation: Add `useEffect` to re-render org card when `selected` changes
  
- **Option B:** Show orgs for all subgroups below capacity investments
  - Pro: Users can scan all matches at once without interaction
  - Con: Could be long list; requires pagination/collapse logic
  - Implementation: Map over all subgroups; show 2–3 orgs per subgroup

**Next step:** Produce wireframe mockup showing state transitions (user clicks "age 55+" → org card animates with teal border and content updates).

---

### Issue 1.2: Missing Subgroup Context in Project Data

**Category:** Data model incomplete  
**Severity:** Critical — blocks matching logic

**Finding:**

The roadmap defines new fields in the `Project` interface:
```typescript
subgroupsFocused?: SubgroupType[]
riskFactorsAddressed?: RiskFactorType[]
radarPageContext?: { page: 'capacity' | 'forecast' | 'triage'; detail: string }
```

**But current `portalData.ts` has none of these:**
- `seedProjects` contains only: id, orgName, title, description, supportTypes, imageUrl, date, location, money?, volunteer?, legal?, medical?, otherProfessional?
- No fields for subgroup targeting or Radar integration

**Files that need updates:**
1. `src/shared/data/portalData.ts`
   - [ ] Add `SubgroupType = 'families' | 'veterans' | 'youth-18-24' | 'age-55-plus' | 'multi-subgroup'`
   - [ ] Add `RiskFactorType = 'unemployment' | 'housing-instability' | 'eviction-risk' | 'legal-issues' | 'medical-access' | 'education-barriers'`
   - [ ] Extend `Project` interface with three new optional fields
   - [ ] Seed 6 projects with example metadata (see table below)

2. `src/shared/logic/resourceMatcher.ts` (new file)
   - [ ] Implement `getProjectsForSubgroup(subgroup: string, projects: Project[]): Project[]`
   - [ ] Implement `getSuggestedServicesForCase(triageCase, projects): Project[]`
   - [ ] Export subgroup gap messaging helper

**Example seeded data:**

| Org | Project | Subgroups | Risk Factors | Radar Context |
|---|---|---|---|---|
| Downtown Family Shelter | Winter bed expansion | families, multi-subgroup | housing-instability, eviction-risk | Addresses families subgroup gap |
| Senior Living Coalition | Specialized outreach for 55+ | age-55-plus | medical-access, housing-instability | Directly addresses rising 55+ (33%) |
| Riverside Outreach | Weekend street outreach | multi-subgroup | housing-instability | Supports all subgroups |
| Tenant Defense Network | Eviction defense | families | eviction-risk, legal-issues | Families gap protection |
| Health Van | Mobile clinics | age-55-plus, veterans | medical-access | 55+ and veteran needs |
| Tech Initiative | Case mgmt software | multi-subgroup | N/A | Enables service provider capacity |

**Recommendation:**
- Start with 2–3 projects having metadata; add more iteratively
- Document metadata in comments for each project (rationale for tier assignment)
- Test `getProjectsForSubgroup('families', projects)` returns 2–3 matches

---

## 2. Portal Project Detail Card Design Issues

### Issue 2.1: Radar Context Card Color Token Usage

**Category:** Design system adherence  
**Severity:** Medium — visual inconsistency

**Finding:**

Roadmap shows:
```jsx
<Card className="mb-6 bg-teal-dim border-teal">
```

**Problem:** Token values create jarring contrast:
- `teal-dim: #173630` (dark, desaturated green)
- `teal: #2dd4a7` (bright, saturated cyan)
- Difference: 41% luminance gap

**Current system pattern (working well):**
- `coral-dim: #3a2620` + `border: border-coral: #ff6b4a`
- Difference: 35% luminance gap (warmer, reads as intentional)

**Visual rendering:**
```
Current card design:
bg-teal-dim (#173630) + border-line (#2a3654) = subtle, reads as normal card
                     ↓
Proposed:
bg-teal-dim (#173630) + border-teal (#2dd4a7) = high contrast, stands out too much
                                      ↑
                                   This bright border feels "off"
```

**Recommendation:**

**Option 1 (preferred):** Use left-border accent pattern
```jsx
<Card className="mb-6 border-l-4 border-teal">
  {/* Content */}
</Card>
```
- Matches Triage page pattern from roadmap ("border-l-4 border-teal")
- Maintains consistent bg (ink-1 or teal-dim if needed)
- Left-border adds visual weight without breaking minimalism

**Option 2:** Use semi-transparent teal border
```jsx
<Card className="mb-6 bg-teal-dim/20 border border-teal/40">
```
- Reduces contrast while keeping semantic color
- Works on dark backgrounds

**Option 3:** Standardize on coral-inspired layering
```jsx
<Card className="mb-6 bg-teal-dim border-l-4 border-teal">
  {/* Content */}
</Card>
```
- Both: dark dim background + left-border accent (consistent system)

**Action:** Produce side-by-side visual test of all three options at full width (1920px) and mobile (375px).

---

### Issue 2.2: Icon and Typography — Emoji Accessibility

**Category:** Accessibility & consistency  
**Severity:** Medium — functional issue

**Finding:**

Roadmap code shows emoji as placeholder:
```jsx
<div className="text-2xl">📊</div>
```

**Problems:**
1. Emoji rendering inconsistent: macOS renders as colored glyph; Linux as monochrome; Windows may vary
2. No alt text or aria-label: screen readers skip it silently
3. Copy/paste fragility: emoji fonts can change on device updates
4. Not integrated into design system: no icon library documented for future use

**Recommendation:**

**Option 1 (recommended):** Use Lucide icon (if available) or SVG
```jsx
import { BarChart3 } from 'lucide-react'

<div className="flex items-start gap-3">
  <BarChart3 className="h-6 w-6 text-teal flex-shrink-0" />
  <div>
    <div className="font-semibold text-text-hi">This addresses a Radar insight</div>
    ...
  </div>
</div>
```

**Option 2:** Inline SVG for consistency
```jsx
<svg className="h-6 w-6 text-teal" viewBox="0 0 24 24" fill="currentColor">
  {/* bar chart path */}
</svg>
```

**Option 3:** If emoji required, add aria-label
```jsx
<div className="text-2xl" aria-label="Data insight from Radar">📊</div>
```

**Action:** Check if Lucide is already in dependencies; if so, use `BarChart3` icon. Otherwise, defer to emoji with ARIA.

---

### Issue 2.3: Link Styling Inconsistency

**Category:** Design consistency  
**Severity:** Medium — confusing UX

**Finding:**

ProjectDetailPage existing links:
```jsx
<Link to={...} className="text-coral hover:underline">
  {links.isPublic ? 'Find Ways to Help' : 'Impact Portal'}
</Link>
```

Proposed Radar context card link:
```jsx
<Link 
  to={`/${project.radarPageContext.page}`}
  className="text-teal font-semibold text-[12px] mt-2 inline-block hover:underline"
>
  View the {project.radarPageContext.page} analysis →
</Link>
```

**Inconsistencies:**
| Attribute | Current Links | Radar Context Link |
|---|---|---|
| Color | `text-coral` | `text-teal` |
| Font | Default | `font-semibold text-[12px]` |
| Decoration | `hover:underline` | `hover:underline` |
| Arrow | (none) | `→` suffix |

**Problem:** Users see two link colors; unclear which is primary action.

**Recommendation:**

Establish **CTA color semantics:**
- **Coral** = primary action that changes user data (donate, signup, submit form)
- **Teal** = secondary action, informational link, or cross-product navigation

**Update all links:**

On ProjectDetailPage:
```jsx
// Primary: donation, volunteer signup
<Link className="text-coral hover:underline">Donate | Sign up</Link>

// Secondary: back-navigation, portal link
<Link className="text-teal hover:underline">← Back to Portal</Link>
```

On Radar context card:
```jsx
// Secondary: cross-product navigation
<Link className="text-teal hover:underline">
  View the capacity analysis →
</Link>
```

On Capacity page org card:
```jsx
// Primary: action to discover org
<Link className="text-coral hover:underline">
  View project →
</Link>
```

**Document rule in CLAUDE.md:**
```
## Color semantics for CTAs
- Coral (#ff6b4a): Primary actions (donate, signup, submit, next step)
- Teal (#2dd4a7): Secondary navigation, contextual links, "learn more"
```

---

## 3. Matching Display Usability

### Issue 3.1: Responsive Layout — Horizontal Scroll Risk

**Category:** Responsive design  
**Severity:** High — mobile UX blocker

**Finding:**

Roadmap org card markup:
```jsx
<Card tight>
  {organizationsForSubgroup.map((org) => (
    <div className="border-b border-line-soft py-3 px-2.5 last:border-b-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-text-hi">{org.orgName}</div>
          <div className="text-[12px] text-text-mid mt-1">{org.title}</div>
          {org.radarPageContext && (
            <div className="text-[11px] text-teal mt-1.5">
              ✓ {org.radarPageContext.detail}
            </div>
          )}
        </div>
        <Link 
          to={`/portal/project/${org.id}`}
          className="text-coral hover:text-coral/80 text-[12px] font-semibold"
        >
          View project →
        </Link>
      </div>
    </div>
  ))}
</Card>
```

**Usability tests needed:**

| Viewport | Issue | Expected |
|---|---|---|
| 375px (iPhone SE) | Org name + link cramped? | No truncation; link below org name on wrap |
| 768px (iPad) | 5–10 orgs = card height ok? | Max-height 400px + scroll if >5 |
| 1920px (desktop) | Spacing adequate? | 40–50px card height per org, readable |

**Risk:** "View project →" might wrap awkwardly on mobile, or org name might truncate mid-word.

**Recommendation:**

1. **Define responsive breakpoints for org card:**
   ```jsx
   <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
     <div className="flex-1 min-w-0">
       <div className="font-semibold text-text-hi truncate">{org.orgName}</div>
       ...
     </div>
     <Link className="mt-2 sm:mt-0 flex-shrink-0 text-coral hover:underline">
       View →
     </Link>
   </div>
   ```

2. **Add max-height + scroll for many orgs:**
   ```jsx
   <Card tight className="max-h-[600px] overflow-y-auto">
     {/* org list */}
   </Card>
   ```

3. **Test matrix:**
   - [ ] 1 org at 375px — no scroll
   - [ ] 3 orgs at 375px — no scroll, link inline
   - [ ] 5 orgs at 375px — scroll active, readable
   - [ ] 10 orgs at 768px — scroll active, keyboard accessible
   - [ ] 10 orgs at 1920px — all visible, no scroll

---

### Issue 3.2: Missing Visual Hierarchy — Relevance Indicator

**Category:** UX clarity  
**Severity:** Medium — engagement blocker

**Finding:**

Mockup shows simple text rows. No indication of:
- Match quality (exact vs. loose match)
- Relevance ranking (why this org over others?)
- Update recency (when was this project last updated?)

**User question:** "Why does this org appear for this subgroup?"

**Recommendation:**

Add subtle **match indicator** using teal semantics:

```jsx
<div className="text-[11px] text-teal mt-1.5 flex items-center gap-1">
  {org.subgroupsFocused?.includes(selectedSubgroup) ? (
    <>
      <span>✓</span>
      <span>Exact match — serves {selectedSubgroup}</span>
    </>
  ) : (
    <>
      <span>~</span>
      <span>Related — addresses {org.riskFactorsAddressed?.[0]}</span>
    </>
  )}
</div>
```

**Or use left-border color:**
```jsx
<div className={`border-l-4 py-3 px-2.5 ${
  org.subgroupsFocused?.includes(selectedSubgroup) 
    ? 'border-teal' 
    : 'border-amber'
}`}>
  {/* org card */}
</div>
```

**Document ranking rule:**
1. Exact subgroup match (e.g., families org for families subgroup) → teal
2. Risk factor match (e.g., housing org for housing subgroup) → amber
3. Multi-subgroup catch-all → gray

---

### Issue 3.3: Engagement Metrics Undefined

**Category:** Analytics & UX intent  
**Severity:** Medium — measurement gap

**Finding:**

Roadmap success metric: "CTR from Capacity page → Portal projects (target: >10%)"

But UI design lacks:
1. Click tracking attributes (no data-testid, no analytics marker)
2. Navigation intent (same tab vs. new tab?)
3. Breadcrumb on return (how does user get back to Capacity?)

**Recommendation:**

1. **Add analytics attributes:**
   ```jsx
   <Link 
     to={`/portal/project/${org.id}`}
     data-event="org-card-click"
     data-subgroup={selectedSubgroup}
     data-org-id={org.id}
     className="text-coral hover:underline"
   >
     View project →
   </Link>
   ```

2. **Define navigation model:**
   - **Same tab (recommended):** User clicks → Portal detail page loads → back-link shows "← Back to Capacity"
   - **New tab:** `target="_blank" rel="noopener"` + icon hint `🔗`

3. **Add breadcrumb on ProjectDetail:**
   ```jsx
   {project.radarPageContext && (
     <Link 
       to={`/${project.radarPageContext.page}`}
       className="mb-4 inline-block text-[13px] text-text-mid hover:text-teal"
     >
       ← Back to {project.radarPageContext.page === 'capacity' ? 'Capacity' : 'analysis'}
     </Link>
   )}
   ```

---

## 4. Design Consistency Issues

### Issue 4.1: Color Palette Adherence — No Documented CTA Rule

**Category:** Design system compliance  
**Severity:** High — foundational

**Finding:**

Radar design tokens are well-defined:
- Ink layers: `ink-0` (#0b1220), `ink-1` (#141d2e), `ink-2` (#1c2740)
- Text hierarchy: `text-hi` (#eef1f7), `text-mid` (#9aa7c2), `text-low` (#6b7794)
- Signal colors: coral (#ff6b4a), amber (#e8a53d), teal (#2dd4a7), blue (#5b8def)

**But no documented rule for CTA colors across products.**

Current usage:
- ProjectDetailPage: All CTAs are `text-coral` ✓
- CapacityPage: All navigation is `text-coral` ✓
- Proposed Radar context card: `text-teal` ✗ (breaks pattern)

**Risk:** Inconsistent color usage confuses users about action priority.

**Recommendation:**

Document CTA semantics in `CLAUDE.md`:

```markdown
## CTA Color Semantics

### Coral (#ff6b4a) — Primary Action
Use for CTAs that perform a user action or commit data:
- "Donate $100"
- "Sign up to volunteer"
- "Submit form"
- "View project →" (on discovery pages)
- Any button that changes state or submits data

### Teal (#2dd4a7) — Secondary Navigation
Use for contextual/informational navigation:
- "← Back to Capacity"
- "View the capacity analysis →" (cross-product link)
- "More info" / "Learn more"
- Any link that navigates without committing action

### Amber (#e8a53d) — Warning / Caution
Reserved for alerts and warnings (existing use)

### Blue (#5b8def) — Neutral / Projected
Reserved for neutral data and projections (existing use)
```

**Apply consistently:**
- [ ] CapacityPage org links: Keep `text-coral` (primary discovery action)
- [ ] Portal ProjectDetail back-link: Change to `text-teal` (secondary nav)
- [ ] Portal Radar context link: Use `text-teal` (secondary nav to cross-product)
- [ ] Document in next code review

---

### Issue 4.2: Card Visual Depth Treatment

**Category:** Visual hierarchy  
**Severity:** Low — polish issue

**Finding:**

Current cards use:
- Flat: `rounded-xl border border-line bg-ink-1` (subtle, consistent)
- No drop shadow
- No depth cueing

Radar context card would be identical to any other card visually, except for `bg-teal-dim`.

**Risk:** "This is important — it links to Radar data" doesn't read as visually distinct.

**Comparison:**
- Triage suggested services: `border-l-4 border-teal` (left accent) ✓
- Funding recommendations: `bg-amber-dim/20 border-l-4 border-amber` (left accent + dim bg) ✓
- Proposed Portal card: `bg-teal-dim border-teal` (unclear visual importance) ✗

**Recommendation:**

Match Triage pattern — use left-border accent:

```jsx
<Card className="border-l-4 border-teal">
  <div className="flex items-start gap-3">
    <BarChart3 className="h-5 w-5 text-teal flex-shrink-0" />
    <div>
      <div className="font-semibold text-text-hi">This addresses a Radar insight</div>
      <div className="text-[13px] text-text-mid mt-1">
        {project.radarPageContext.detail}
      </div>
      <Link 
        to={`/${project.radarPageContext.page}`}
        className="text-teal font-semibold text-[12px] mt-2 inline-block hover:underline"
      >
        View the {project.radarPageContext.page} analysis →
      </Link>
    </div>
  </div>
</Card>
```

**Visual result:**
- Left border signals "special" card (consistent with system)
- Icon + color + text reinforce "data insight"
- No extra visual noise; matches existing aesthetic

---

### Issue 4.3: Text Sizing — No Documented Hierarchy

**Category:** Typography system  
**Severity:** Medium — inconsistency

**Finding:**

CapacityPage sizes:
- Page title: `text-[26px] font-semibold` ✓
- Section head: (default, 15px from SectionHead component) ✓
- Description: `text-[13px] text-text-mid` ✓
- Metadata: `text-[10.5px]` (capacity events) or `text-[11px]` (footnote) ?

ProjectDetailPage sizes:
- Page title: `text-[26px] font-semibold` ✓
- Section head: (SectionHead component, 15px) ✓
- Org name in Portal card: `text-[12px]` (roadmap)
- Description: `text-[13px]`

**Inconsistencies:**
- Org name: 12px vs. 13px?
- Radar context title: 13px (assumed) vs. section head 15px?
- Links: 12px + semibold vs. default 13px?

**Recommendation:**

Define standard text hierarchy across both pages:

```
Page title:              26px font-semibold
Section head:            15px font-semibold (via SectionHead component)
Card title (org name):   13px font-semibold text-text-hi
Card body text:          12px text-text-mid
Metadata/footnote:       11px text-text-low
Links in context:        12px font-semibold (inherited color)
```

**Apply to Radar context card:**
```jsx
<Card className="border-l-4 border-teal">
  <div className="font-semibold text-[13px] text-text-hi">
    This addresses a Radar insight
  </div>
  <div className="mt-1 text-[12px] text-text-mid">
    {project.radarPageContext.detail}
  </div>
  <Link className="text-teal font-semibold text-[12px] mt-2 inline-block hover:underline">
    View the {project.radarPageContext.page} analysis →
  </Link>
</Card>
```

---

## 5. Integration Point Issues

### Issue 5.1: Capacity Page State Management — Dynamic Filtering

**Category:** UX flow clarity  
**Severity:** High — core interaction

**Finding:**

CapacityPage has local state:
```jsx
const [selected, setSelected] = useState<SubgroupChange>(subgroupChanges[0])
```

This controls which bar is highlighted in the chart. The question: **Should org matching also filter by selected subgroup?**

**Option A: Dynamic filtering (recommended)**
```
User action → selected = "age-55-plus" → 
Org card re-renders → shows only 55+ orgs
```
- Pro: Tight feedback loop; user sees immediate relevance
- Con: Org list changes dynamically; users might not notice unless card animates
- Requires: `useEffect` to watch `selected`, animation/transition class for UX

**Option B: Static list**
```
Page loads → 
Org card shows ALL matching orgs for all subgroups
```
- Pro: Users can scan everything without interaction
- Con: Card could be very long; requires pagination or grouping
- Requires: Different UI structure (maybe grouped by subgroup)

**Option C: Selected subgroup only, but no re-filter**
```
Page loads → selected = first subgroup →
Org card shows only THAT subgroup's orgs →
User clicks bar → selected changes →
Org card STAYS on old subgroup (confusing)
```
- Pro: Simple implementation
- Con: Confusing UX — users click chart, card doesn't update

**Recommendation: Implement Option A**

```jsx
const [selected, setSelected] = useState<SubgroupChange>(subgroupChanges[0])
const matchingOrgs = useMemo(
  () => getProjectsForSubgroup(selected.subgroup, projects),
  [selected.subgroup, projects]
)

return (
  <>
    {/* ... chart ... */}
    <div className="transition-opacity duration-200">
      <SectionHead 
        title={`Organizations serving ${selected.subgroup}`}
        note={`${matchingOrgs.length} projects`}
      />
      <Card tight>
        {/* org list */}
      </Card>
    </div>
  </>
)
```

**Visual feedback:**
- Add `transition-opacity` class to card; fades briefly when orgs update
- Or: Add `animate-pulse` for 200ms after state change
- Document: "Orgs update when you click a subgroup bar"

---

### Issue 5.2: Portal Context — Multiple Subgroups or Pages

**Category:** Data model edge case  
**Severity:** Medium — future-proofing

**Finding:**

Roadmap defines `radarPageContext` as a single object:
```typescript
radarPageContext?: {
  page: 'capacity' | 'forecast' | 'triage'
  detail: string
}
```

**Edge case:** What if a project serves *multiple* subgroups or contributes to multiple Radar insights?

**Example:**
- Senior Living Coalition serves age-55-plus on Capacity page (housing capacity)
- But also serves veterans on (future) Triage page (risk factors)
- Senior Center serves age-55-plus on Capacity (housing) + medical-access on Triage (risk)

**Current model can only show one context.**

**Recommendation:**

Extend to support multiple contexts:
```typescript
radarPageContexts?: Array<{
  page: 'capacity' | 'forecast' | 'triage'
  detail: string
  priority: 'primary' | 'secondary'  // optional ranking
}>
```

**Portal card implementation:**
```jsx
{project.radarPageContexts && project.radarPageContexts.length > 0 && (
  <div>
    {project.radarPageContexts.slice(0, 2).map((context, idx) => (
      <Card key={idx} className="mb-3 border-l-4 border-teal">
        <div className="font-semibold text-[13px] text-text-hi">
          Addresses a {context.page} insight
        </div>
        <div className="mt-1 text-[12px] text-text-mid">{context.detail}</div>
        <Link className="text-teal font-semibold text-[12px] mt-2 inline-block hover:underline">
          View the {context.page} analysis →
        </Link>
      </Card>
    ))}
    {project.radarPageContexts.length > 2 && (
      <p className="text-[11px] text-text-low">
        +{project.radarPageContexts.length - 2} more context{""}
      </p>
    )}
  </div>
)}
```

**For Phase 1:** Keep single `radarPageContext` object, but structure code so field is array-ready for Phase 2.

---

### Issue 5.3: Missing Browse Experience on Portal Side

**Category:** Feature gap  
**Severity:** Medium — discovery incompleteness

**Finding:**

Capacity page shows matched orgs as filtered list. But how do users **discover subgroups from the Portal side**?

No mention of:
- Browse-by-subgroup page
- Subgroup filter on PortalBrowsePage
- "Organizations serving X" landing page

**Current Portal flow:**
1. Browse all projects (PortalBrowsePage)
2. Click project → detail page
3. *dead end* — no way to see other orgs serving same subgroup

**Reverse flow (from Capacity):**
1. View Capacity page
2. Click org → Portal detail page
3. See back-link to Capacity ✓

**Asymmetry:** Portal users can't initiate Capacity-aware discovery.

**Recommendation:**

**Option A (Phase 1):** Add subgroup metadata to PortalBrowsePage filters
```jsx
<select className="...">
  <option value="">All subgroups</option>
  <option value="families">Families</option>
  <option value="age-55-plus">Age 55+</option>
  <option value="veterans">Veterans</option>
  ...
</select>
```

**Option B (Phase 3):** Defer to Service Directory page, which will have comprehensive filtering

**For now:** Document as **Phase 1.5 nice-to-have** (optional enhancement after core linking works).

---

## 6. Specific Design Recommendations

### Typography & Spacing Standard

| Element | Size | Weight | Color | Usage |
|---|---|---|---|---|
| Page title | 26px | semibold | text-hi | CapacityPage h1, ProjectDetailPage h1 |
| Section head | 15px | semibold | text-hi | SectionHead component (auto) |
| Card title (org) | 13px | semibold | text-hi | Org name in matching list |
| Radar insight title | 13px | semibold | text-hi | Portal context card main text |
| Card body | 12px | normal | text-mid | Descriptions, context details |
| Metadata/footnote | 11px | normal | text-low | Dates, sources, "More info" |
| Links (primary CTA) | 12px | semibold | coral | "View project →", "Donate" |
| Links (secondary nav) | 12px | semibold | teal | "← Back to Capacity", cross-product |

### Capacity Page Org Card — Visual Layout

```
┌─────────────────────────────────────────┐
│ Organizations serving age-55-plus       │ ← SectionHead (15px)
│ (2 projects in the Impact Portal)       │ ← gray metadata (11px)
├─────────────────────────────────────────┤
│                                         │ ← 4px left border, teal
│ Rachel's Promise Center                 │ ← 13px semibold
│ Winter bed expansion                    │ ← 12px gray (description)
│ ✓ Addresses the families gap            │ ← 11px teal (match indicator)
│                             View project →  ← 12px coral link, right-aligned
├─────────────────────────────────────────┤
│ Senior Living Coalition                 │
│ Specialized outreach for 55+            │
│ ✓ Exact match — serves age-55-plus      │
│                             View project →
└─────────────────────────────────────────┘
```

**Implementation:**
```jsx
<SectionHead 
  title={`Organizations serving ${selected.subgroup}`}
  note={`${matchingOrgs.length} projects`}
/>
<Card tight>
  {matchingOrgs.map((org) => (
    <div key={org.id} className="border-b border-line-soft py-3 px-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] text-text-hi truncate">
            {org.orgName}
          </div>
          <div className="mt-1 text-[12px] text-text-mid">
            {org.title}
          </div>
          {org.radarPageContext && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-teal">
              <span>✓</span>
              <span>{org.radarPageContext.detail}</span>
            </div>
          )}
        </div>
        <Link 
          to={`/portal/project/${org.id}`}
          className="flex-shrink-0 mt-0 text-[12px] font-semibold text-coral hover:underline"
        >
          View →
        </Link>
      </div>
    </div>
  ))}
</Card>
```

### Portal Detail Page Radar Context Card — Visual Layout

```
┌─────────────────────────────────────────┐
│ 📊 This addresses a Radar insight      │ ← 13px semibold, icon left
├─────────────────────────────────────────┤
│ Directly addresses the rising 55+       │ ← 12px gray (insight detail)
│ population (now 33% of unsheltered)     │
│                                         │
│ View the capacity analysis →            │ ← 12px teal link
└─────────────────────────────────────────┘
```

**Implementation:**
```jsx
{project.radarPageContext && (
  <Card className="mb-6 border-l-4 border-teal">
    <div className="flex items-start gap-3">
      <BarChart3 className="h-5 w-5 text-teal flex-shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-[13px] text-text-hi">
          This addresses a Radar insight
        </div>
        <div className="mt-1 text-[12px] text-text-mid">
          {project.radarPageContext.detail}
        </div>
        <Link 
          to={`/${project.radarPageContext.page}`}
          className="text-teal font-semibold text-[12px] mt-2 inline-block hover:underline"
        >
          View the {project.radarPageContext.page} analysis →
        </Link>
      </div>
    </div>
  </Card>
)}
```

---

## 7. Verification Checklist

**Data model:**
- [ ] `SubgroupType` enum added to `portalData.ts`
- [ ] `RiskFactorType` enum added to `portalData.ts`
- [ ] `Project` interface extended with `subgroupsFocused`, `riskFactorsAddressed`, `radarPageContext`
- [ ] 3–4 seed projects updated with example metadata

**Logic:**
- [ ] `resourceMatcher.ts` created with `getProjectsForSubgroup(subgroup, projects)` function
- [ ] Function tested: `getProjectsForSubgroup('age-55-plus', projects)` returns 2+ orgs
- [ ] Function handles missing metadata gracefully (returns empty array)

**Capacity page:**
- [ ] Org card added to page after chart
- [ ] Card filters by `selected` subgroup (uses useMemo or useEffect)
- [ ] Card re-renders when user clicks chart bar
- [ ] Transition class applied (fade on update)

**Portal detail page:**
- [ ] Radar context card added above funding section
- [ ] Card renders only when `radarPageContext` exists
- [ ] Icon uses Lucide or SVG (not emoji)
- [ ] Left-border color matches design (border-l-4 border-teal)

**Design system:**
- [ ] Color contrast: teal (#2dd4a7) on dark blue (#141d2e) passes WCAG AA
- [ ] Text sizes follow 26px → 11px hierarchy
- [ ] Links use coral (primary) or teal (secondary) consistently
- [ ] Card padding/spacing consistent with other cards

**Responsive:**
- [ ] 375px viewport: org card doesn't wrap link awkwardly
- [ ] 375px viewport: org name doesn't truncate mid-word
- [ ] 768px viewport: 5+ org card scrolls smoothly
- [ ] 1920px viewport: spacing adequate, no cramping

**Navigation:**
- [ ] Clicking org link navigates to Portal detail page
- [ ] ProjectDetail shows back-link when coming from Capacity
- [ ] Radar context link navigates to correct page
- [ ] No console errors on navigation

**Analytics (optional for Phase 1):**
- [ ] Org card links have `data-event` attribute
- [ ] Click tracking captures subgroup, org ID, page context
- [ ] CTR measured weekly

---

## 8. Open Questions for Product

1. **Filtering behavior:** Should org matching filter dynamically by selected subgroup (Option A), or show all orgs static (Option B)?

2. **Multiple contexts:** If a project serves multiple subgroups/pages, should Portal card show all contexts or just the primary one?

3. **Emoji vs. icon:** Is emoji acceptable (with ARIA label), or should we use Lucide/SVG icons throughout?

4. **Navigation model:** Should "View project" links open in same tab (showing breadcrumb) or new tab?

5. **Relevance ranking:** What constitutes an "exact match" vs. "related" match? (exact subgroup match only, or include risk factor matches?)

6. **Browse from Portal:** Should Phase 1 include subgroup filter on PortalBrowsePage, or defer to Phase 3?

7. **Breadcrumb UX:** On ProjectDetail coming from Capacity, should back-link show "← Back to Capacity (age-55-plus)" or generic "← Back to analysis"?

---

## Summary

**Phase 1 specification is solid but incomplete.** Implementation should:

1. **Fix data model** — add metadata fields to `portalData.ts`, create `resourceMatcher.ts`
2. **Clarify state binding** — decide on dynamic vs. static org filtering on Capacity page
3. **Standardize design** — finalize color rules (coral vs. teal), text hierarchy, card styling
4. **Validate responsive** — test org card layout at 375px, 768px, 1920px
5. **Define navigation** — same tab vs. new tab, breadcrumb content
6. **Produce mockups** — show state transitions (chart click → org card updates)

**Critical blockers:**
- Issue 1.2 (missing metadata) — blocks matching logic
- Issue 2.1 (color tokens) — blocks design finalization
- Issue 5.1 (state management) — blocks UX validation

**Proceed to implementation once these three are resolved.**
