# Resource/Service Matching Roadmap

## Executive Summary

Currently, Radar shows **what's trending** (age 55+ is rising) but not **what to do about it** (these organizations serve seniors). This roadmap connects the two by wiring the Impact Portal to the Radar analysis, enabling organizations to:
1. See which data gaps they address
2. Have users discover them through the dashboard, not separately through the Portal
3. Receive targeted funding/volunteer support for high-impact gaps

---

## Phase 1: Portal-to-Radar Linkage (Highest ROI, 1–2 weeks)

### What it does
Adds metadata to Impact Portal projects so they show up contextually on Radar's data pages.

### Data model change

**File**: `src/shared/data/portalData.ts`

```typescript
// NEW: Subgroup type
export type SubgroupType = 'families' | 'veterans' | 'youth-18-24' | 'age-55-plus' | 'multi-subgroup'

// NEW: Risk factor type (from radarData.triageMethodologyNote)
export type RiskFactorType = 'unemployment' | 'housing-instability' | 'eviction-risk' | 'legal-issues' | 'medical-access' | 'education-barriers'

// MODIFIED: Project interface
export interface Project {
  id: string
  orgName: string
  title: string
  description: string
  supportTypes: SupportType[]
  imageUrl: string
  date: string
  // ... existing fields ...
  
  // NEW FIELDS:
  subgroupsFocused?: SubgroupType[]  // Which subgroups this org serves
  riskFactorsAddressed?: RiskFactorType[]  // Which risk factors it mitigates
  radarPageContext?: {
    page: 'capacity' | 'forecast' | 'triage'
    detail: string  // e.g., "Serves age 55+ unsheltered population"
  }
}
```

### Example: Adding org data

**File**: `src/shared/data/portalData.ts`

```typescript
const projects: Project[] = [
  // EXISTING
  {
    id: 'proj-001',
    orgName: 'Rachel\'s Promise Center',
    title: 'Winter bed expansion',
    description: '160 new beds for women and families',
    supportTypes: ['money', 'volunteer'],
    imageUrl: 'https://...',
    date: '2025-11-15',
    
    // NEW
    subgroupsFocused: ['families', 'multi-subgroup'],
    riskFactorsAddressed: ['housing-instability', 'eviction-risk'],
    radarPageContext: {
      page: 'capacity',
      detail: 'Addresses the families subgroup gap shown on Capacity page'
    }
  },
  {
    id: 'proj-002',
    orgName: 'Senior Living Coalition',
    title: 'Specialized outreach for 55+',
    description: 'Mobile medical clinics + safe parking for older adults',
    supportTypes: ['money', 'medical', 'volunteer'],
    imageUrl: 'https://...',
    date: '2026-01-10',
    
    // NEW
    subgroupsFocused: ['age-55-plus'],
    riskFactorsAddressed: ['medical-access', 'housing-instability'],
    radarPageContext: {
      page: 'capacity',
      detail: 'Directly addresses the rising 55+ population (now 33% of unsheltered, up from 29%)'
    }
  }
]
```

### UI changes

#### On Capacity page (`src/pages/Capacity/CapacityPage.tsx`)

```typescript
// Add a new card after the capacity investments list
<div>
  <SectionHead 
    title="Organizations serving this subgroup"
    note={`${organizationsForSubgroup.length} projects in the Impact Portal`}
  />
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
  <Footnote>
    These organizations are actively addressing the trends shown above.
    Browse their projects to volunteer, donate, or refer clients.
  </Footnote>
</div>
```

#### On Portal project detail (`src/pages/Portal/ProjectDetailPage.tsx`)

```typescript
// Add context card at the top
{project.radarPageContext && (
  <Card className="mb-6 bg-teal-dim border-teal">
    <div className="flex items-start gap-3">
      <div className="text-2xl">📊</div>
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
)}
```

#### On Triage page (optional, for Phase 1.5)

```typescript
// When showing a case, add a "Suggested services" section
<Card>
  <div className="font-semibold mb-2">Organizations that can help</div>
  <div className="text-[12px] space-y-2">
    {suggestedOrgs.map(org => (
      <Link
        key={org.id}
        to={`/portal/project/${org.id}`}
        className="block p-2 border border-line-soft rounded hover:bg-teal-dim/20"
      >
        <div className="font-medium">{org.orgName}</div>
        <div className="text-text-mid">{org.title}</div>
      </Link>
    ))}
  </div>
</Card>
```

### Algorithm: Matching projects to cases/subgroups

**File**: `src/shared/logic/resourceMatcher.ts` (new file)

```typescript
import { type Project } from '@/shared/data/portalData'
import { type TriageCase, type RiskFactorType } from '@/shared/data/radarData'

export function getProjectsForSubgroup(
  subgroup: string,
  projects: Project[]
): Project[] {
  const subgroupMap: Record<string, SubgroupType> = {
    'families': 'families',
    'With children': 'families',
    'veterans': 'veterans',
    'youth': 'youth-18-24',
    '18–24': 'youth-18-24',
    '55+': 'age-55-plus',
  }
  
  const target = subgroupMap[subgroup]
  if (!target) return []
  
  return projects.filter(p => 
    p.subgroupsFocused?.includes(target) || 
    p.subgroupsFocused?.includes('multi-subgroup')
  )
}

export function getSuggestedServicesForCase(
  triageCase: TriageCase,
  projects: Project[]
): Project[] {
  // Extract risk factors from case description
  const riskFactorKeywords: Record<string, RiskFactorType> = {
    'unemploy': 'unemployment',
    'eviction': 'eviction-risk',
    'legal': 'legal-issues',
    'hospital': 'medical-access',
    'utility': 'housing-instability',
    'shelter exit': 'housing-instability',
  }
  
  const detectedFactors = Object.entries(riskFactorKeywords)
    .filter(([keyword]) => triageCase.factor.toLowerCase().includes(keyword))
    .map(([_, factor]) => factor)
  
  // Find projects addressing those factors
  return projects
    .filter(p => p.riskFactorsAddressed?.some(rf => detectedFactors.includes(rf)))
    .slice(0, 3)  // Top 3 matches
}

export function getSubgroupGapMessage(subgroup: string): string {
  const messages: Record<string, string> = {
    'age-55-plus': 'Rising subgroup — now 33% of unsheltered population (up from 29%)',
    'families': 'Down 72% YoY — continue supporting existing capacity',
    'veterans': 'Down 25% YoY — investments working',
    'youth-18-24': 'Down 22% YoY — maintain current services',
  }
  return messages[subgroup] || 'Subgroup trend data available on Capacity page'
}
```

---

## Phase 2: Triage Routing (2–3 weeks)

### What it does
When showing a case on Triage, suggest matched services based on extracted risk factors.

### Implementation

**File**: `src/pages/Triage/TriagePage.tsx`

```typescript
import { getSuggestedServicesForCase } from '@/shared/logic/resourceMatcher'

export const TriagePage = () => {
  const [selectedCase, setSelectedCase] = useState<TriageCase | null>(null)
  const suggestedServices = selectedCase 
    ? getSuggestedServicesForCase(selectedCase, projects)
    : []

  return (
    // ... existing triage table ...
    {selectedCase && suggestedServices.length > 0 && (
      <Card className="mt-6 border-l-4 border-teal">
        <div className="font-semibold mb-3">Suggested referral services</div>
        <div className="space-y-2">
          {suggestedServices.map(service => (
            <div
              key={service.id}
              className="flex items-start justify-between p-2 rounded bg-teal-dim/10"
            >
              <div className="text-[12px]">
                <div className="font-medium">{service.orgName}</div>
                <div className="text-text-mid">{service.title}</div>
                {service.supportTypes.length > 0 && (
                  <div className="text-text-low mt-1">
                    Offers: {service.supportTypes.join(', ')}
                  </div>
                )}
              </div>
              <Link
                to={`/portal/project/${service.id}`}
                className="text-teal hover:underline text-[11px] font-semibold whitespace-nowrap"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      </Card>
    )}
  )
}
```

---

## Phase 3: Service Directory (4–6 weeks)

### What it does
Integrates a real, searchable directory of homelessness services in San Diego (not just Portal projects, but also established organizations).

### Data model

**File**: `src/shared/data/serviceDirectoryData.ts` (new file)

```typescript
export interface ServiceOrganization {
  id: string
  name: string
  description: string
  website: string
  phone: string
  address: string
  latitude: number
  longitude: number
  subgroupsServed: SubgroupType[]
  serviceTypes: ('shelter' | 'case-management' | 'medical' | 'legal' | 'job-training' | 'mental-health')[]
  capacity?: number
  occupancyCurrently?: number  // From HMIS if available
  hours: string
  acceptsReferrals: boolean
  referralProcess: string
}

// Seed data: Major organizations in San Diego
const serviceDirectory: ServiceOrganization[] = [
  {
    id: 'srv-001',
    name: 'San Diego Rescue Mission',
    description: 'Comprehensive services including shelter, medical, and job training',
    website: 'https://sdrescuemission.org',
    phone: '619-233-5000',
    address: '1365 4th Avenue, San Diego, CA 92101',
    latitude: 32.7157,
    longitude: -117.1611,
    subgroupsServed: ['multi-subgroup'],
    serviceTypes: ['shelter', 'medical', 'job-training'],
    capacity: 450,
    hours: '24/7',
    acceptsReferrals: true,
    referralProcess: 'Call 211 San Diego or walk in',
  },
  // ... add more
]
```

### UI: Service directory page

**File**: `src/pages/Services/ServiceDirectoryPage.tsx` (new file)

```typescript
export const ServiceDirectoryPage = () => {
  const [selectedSubgroup, setSelectedSubgroup] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const filtered = serviceDirectory.filter(org => {
    const matchesSubgroup = selectedSubgroup === 'all' || 
      org.subgroupsServed.includes(selectedSubgroup)
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSubgroup && matchesSearch
  })

  return (
    <div>
      <h1>Service Directory</h1>
      <input
        type="text"
        placeholder="Search organizations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(org => (
          <Card key={org.id}>
            <h3>{org.name}</h3>
            <p>{org.description}</p>
            <p>Phone: {org.phone}</p>
            <p>Hours: {org.hours}</p>
            {org.occupancyCurrently && org.capacity && (
              <div className="mt-2">
                <div className="text-[12px] text-text-mid">
                  Capacity: {org.occupancyCurrently}/{org.capacity}
                </div>
                <div className="w-full bg-line-soft rounded h-2">
                  <div 
                    className="bg-coral h-2 rounded"
                    style={{width: `${(org.occupancyCurrently / org.capacity) * 100}%`}}
                  />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Integration with Triage

When showing a case, query services instead of just Portal projects:

```typescript
const suggestedServices = [
  ...getSuggestedPortalProjects(triageCase, projects),
  ...getSuggestedDirectoryServices(triageCase, serviceDirectory)
]
```

---

## Phase 4: Data-Driven Recommendations (Ongoing)

### What it does
Uses historical throughput + current trends to recommend funding priorities.

### Example logic

**File**: `src/shared/logic/fundingRecommendations.ts` (new file)

```typescript
export interface FundingRecommendation {
  subgroup: string
  currentTrend: number  // % change YoY
  projectedNeed: number  // estimated people needing service in 3mo
  organizationsAddressing: ServiceOrganization[]
  recommendedFunding: number  // $ estimate
  impactProjection: string  // "funding this org could serve 50 more 55+ individuals"
}

export function getFundingRecommendations(
  subgroupTrends: SubgroupChange[],
  serviceOrgs: ServiceOrganization[],
  historicalThroughput: ThroughputData
): FundingRecommendation[] {
  return subgroupTrends
    .filter(trend => trend.changePercent > 0)  // Rising subgroups only
    .map(trend => {
      const orgsServing = serviceOrgs.filter(org =>
        org.subgroupsServed.includes(trend.subgroup)
      )
      const avgThroughput = historicalThroughput[trend.subgroup]?.monthlyServed || 0
      const recommendedFunding = avgThroughput * 500  // $500 per person/month estimate

      return {
        subgroup: trend.subgroup,
        currentTrend: trend.changePercent,
        projectedNeed: Math.ceil(avgThroughput * 1.5),  // 50% increase estimate
        organizationsAddressing: orgsServing,
        recommendedFunding,
        impactProjection: `Funding could expand capacity to serve ${Math.ceil(avgThroughput * 1.5)} additional individuals`
      }
    })
}
```

### UI: Funding recommendations card

```typescript
<Card className="bg-amber-dim/20 border-l-4 border-amber">
  <h3>Funding recommendations (based on trends)</h3>
  {fundingRecs.map(rec => (
    <div key={rec.subgroup} className="mb-4 p-3 bg-amber-dim/10 rounded">
      <div className="font-semibold">{rec.subgroup} — Rising {rec.currentTrend}% YoY</div>
      <div className="text-[12px] text-text-mid mt-1">
        {rec.impactProjection}
      </div>
      <div className="text-[11px] text-text-low mt-2">
        Estimated need: ${rec.recommendedFunding.toLocaleString()}/month
      </div>
      <div className="mt-3 space-y-1">
        {rec.organizationsAddressing.slice(0, 2).map(org => (
          <div key={org.id} className="text-[12px]">
            <Link to={`/services/${org.id}`} className="text-teal hover:underline">
              {org.name} → See details
            </Link>
          </div>
        ))}
      </div>
    </div>
  ))}
</Card>
```

---

## Data Integration Strategy

### For Portal projects (internal, can start immediately)
- Add `subgroupsFocused`, `riskFactorsAddressed`, `radarPageContext` fields
- No backend change needed; update mock data in `portalData.ts`
- Deploy with Phase 1

### For service directory (medium lift, needs data partnership)
- Partner with 211 San Diego to get their service database (via API or CSV export)
- Create a `serviceDirectoryData.ts` module with seed data
- Set up a weekly sync job to pull updates from 211
- Timeline: 4–6 weeks to negotiate API access + build sync

### For occupancy/throughput data (requires HMIS partnership)
- Work with RTFH to establish a data-sharing agreement
- Request monthly aggregate exports (by service type, by subgroup)
- Use this to fuel recommendations engine
- Timeline: 2–3 months for negotiation + data validation

---

## Implementation Checklist

### Phase 1 (Priority 1)
- [ ] Update `portalData.ts` with new fields
- [ ] Create `resourceMatcher.ts` utility
- [ ] Modify `CapacityPage.tsx` to show matched orgs
- [ ] Modify `ProjectDetailPage.tsx` to show Radar context
- [ ] Test end-to-end: Click on Age 55+ → See orgs serving that group → Browse projects
- [ ] Deploy to production

### Phase 2 (Priority 2)
- [ ] Modify `TriagePage.tsx` to extract risk factors and suggest services
- [ ] Test case-by-case routing
- [ ] Add analytics: track which services users click through to

### Phase 3 (Priority 3)
- [ ] Contact 211 San Diego for API/data access
- [ ] Build `serviceDirectoryData.ts` with initial dataset
- [ ] Create `ServiceDirectoryPage.tsx`
- [ ] Add routing link from main nav
- [ ] Set up weekly data sync

### Phase 4 (Ongoing)
- [ ] Collect HMIS throughput data
- [ ] Build `fundingRecommendations.ts`
- [ ] Test recommendation engine with sample data
- [ ] Add funding recommendations card to relevant pages

---

## Success Metrics

1. **Portal engagement**: CTR from Capacity page → Portal projects (target: >10%)
2. **Service discovery**: Unique users finding services through Radar vs. separately (target: 40%+ via Radar)
3. **Funding allocation**: $ directed to rising subgroups via Impact Portal (track via tags)
4. **Case resolution**: For triage cases with suggested services, % that get referred (target: 60%+)
5. **Data freshness**: 211 service directory updated weekly, no stale entries (target: 100% current)

