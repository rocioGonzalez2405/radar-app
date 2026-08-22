/**
 * Mock data for the Impact Portal prototype — replaces the single-campaign
 * Donate page with a browsable set of org-published projects covering
 * multiple ways to help (money, volunteering, legal/medical/other
 * professional skills). No backend: this module is the entire "database"
 * for the current session. See `PortalContext` for the in-memory
 * create/read layer built on top of this seed data.
 */

export type SupportType =
  | 'money'
  | 'volunteer'
  | 'legal'
  | 'medical'
  | 'other-professional'

export const SUPPORT_TYPES: SupportType[] = [
  'money',
  'volunteer',
  'legal',
  'medical',
  'other-professional',
]

export const SUPPORT_TYPE_LABEL: Record<SupportType, string> = {
  money: 'Money',
  volunteer: 'Volunteer',
  legal: 'Legal',
  medical: 'Medical',
  'other-professional': 'Other professional',
}

export interface MoneySupport {
  goal: number
  raised: number
  donorCount: number
  daysLeft: number
}

export interface VolunteerShift {
  id: string
  label: string
  slotsOpen: number
}

export interface VolunteerSupport {
  role: string
  shifts: VolunteerShift[]
}

/**
 * `legalMode` distinguishes the two shapes a `legal` project can take:
 * - `seeking-help`: the org is publishing a request on behalf of someone who
 *   needs pro-bono legal help (an intake form collects their case info).
 * - `offering-help`: the org is recruiting volunteer lawyers to donate their
 *   time/skills (a signup form collects the lawyer's availability/skills).
 */
export type LegalMode = 'seeking-help' | 'offering-help'

export interface LegalSupport {
  legalMode: LegalMode
  intakeNote: string
}

export interface MedicalSupport {
  intakeNote: string
}

export interface OtherProfessionalSupport {
  skillsNeeded: string[]
}

export interface Project {
  id: string
  orgName: string
  title: string
  description: string
  supportTypes: SupportType[]
  imageUrl: string
  date: string
  location: string
  money?: MoneySupport
  volunteer?: VolunteerSupport
  legal?: LegalSupport
  medical?: MedicalSupport
  otherProfessional?: OtherProfessionalSupport
}

export const seedProjects: Project[] = [
  {
    id: 'proj-1',
    orgName: 'Downtown Family Shelter Fund',
    title: 'Keep Downtown Families Off the Street',
    description:
      "Emergency shelter, childcare, and rapid rehousing so women and their children downtown don't become unhoused while they wait for a permanent bed.",
    supportTypes: ['money'],
    imageUrl: 'https://picsum.photos/seed/proj-1-shelter/640/360',
    date: '2026-08-25',
    location: 'Downtown, San Diego',
    money: { goal: 75000, raised: 48250, donorCount: 412, daysLeft: 22 },
  },
  {
    id: 'proj-2',
    orgName: 'Riverside Outreach Collective',
    title: 'Weekend Street Outreach Team',
    description:
      'Volunteers hand out hygiene kits, hot meals, and warm layers on weekend outreach routes downtown, and help connect people to shelter intake.',
    supportTypes: ['volunteer'],
    imageUrl: 'https://picsum.photos/seed/proj-2-outreach/640/360',
    date: '2026-08-23',
    location: 'Riverside District, San Diego',
    volunteer: {
      role: 'Outreach Volunteer',
      shifts: [
        { id: 'shift-sat-am', label: 'Saturday 8am–12pm', slotsOpen: 6 },
        { id: 'shift-sun-pm', label: 'Sunday 1pm–5pm', slotsOpen: 3 },
      ],
    },
  },
  {
    id: 'proj-3',
    orgName: 'Tenant Defense Network',
    title: 'Eviction Defense Legal Aid',
    description:
      'Free legal representation for tenants downtown facing eviction hearings within the next 30 days, prioritizing families with children.',
    supportTypes: ['legal'],
    imageUrl: 'https://picsum.photos/seed/proj-3-eviction/640/360',
    date: '2026-08-27',
    location: 'Downtown Courthouse, San Diego',
    legal: {
      legalMode: 'seeking-help',
      intakeNote:
        'Intake covers your case timeline and hearing date so a volunteer attorney can review eligibility quickly.',
    },
  },
  {
    id: 'proj-4',
    orgName: 'Pro Bono Housing Law Corps',
    title: 'Volunteer Attorney Signup — Housing Docket',
    description:
      'We need licensed attorneys and law students to donate a few hours a month reviewing eviction filings and coaching tenants for hearings.',
    supportTypes: ['legal'],
    imageUrl: 'https://picsum.photos/seed/proj-4-probono/640/360',
    date: '2026-08-24',
    location: 'Civic Center, San Diego',
    legal: {
      legalMode: 'offering-help',
      intakeNote:
        'Tell us your bar status, practice area, and how much time you can donate each month.',
    },
  },
  {
    id: 'proj-5',
    orgName: 'Downtown Community Health Van',
    title: 'Mobile Health Van — Volunteer Clinicians',
    description:
      'Nurses, EMTs, and physicians staff a weekly mobile clinic for unhoused people, screening for urgent conditions before they become ER visits.',
    supportTypes: ['medical', 'volunteer'],
    imageUrl: 'https://picsum.photos/seed/proj-5-healthvan/640/360',
    date: '2026-08-26',
    location: 'East Village, San Diego',
    medical: {
      intakeNote:
        'Share your license/certification and specialty so we can match you to a clinic shift.',
    },
    volunteer: {
      role: 'Clinic Support Volunteer',
      shifts: [{ id: 'shift-wed-am', label: 'Wednesday 9am–1pm', slotsOpen: 4 }],
    },
  },
  {
    id: 'proj-6',
    orgName: 'Rehousing Tech Initiative',
    title: 'Case Management Software Overhaul',
    description:
      'We need pro-bono help modernizing the case-tracking tools our intake staff use daily — from data cleanup to a simple new dashboard.',
    supportTypes: ['other-professional', 'money'],
    imageUrl: 'https://picsum.photos/seed/proj-6-techinit/640/360',
    date: '2026-08-29',
    location: 'Remote / Downtown HQ, San Diego',
    otherProfessional: {
      skillsNeeded: ['Software engineering', 'UX design', 'Data analysis'],
    },
    money: { goal: 15000, raised: 4100, donorCount: 38, daysLeft: 60 },
  },
]
