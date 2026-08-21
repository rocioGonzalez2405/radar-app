/**
 * Synthetic fundraising-widget data for the Donate page prototype. This is
 * UI demo content for a donation flow (no real payment is processed) and is
 * not a homelessness statistic — see src/shared/data/radarData.ts for the
 * verified public data used elsewhere in the app.
 */

export interface DonationCampaign {
  name: string
  raised: number
  goal: number
  donorCount: number
  daysLeft: number
}

export const donationCampaign: DonationCampaign = {
  name: 'Keep Downtown Families Off the Street',
  raised: 48250,
  goal: 75000,
  donorCount: 412,
  daysLeft: 22,
}

export const suggestedDonationAmounts = [25, 50, 100, 250]

export interface Donor {
  name: string
  amount: number
  timeAgo: string
}

export const recentDonors: Donor[] = [
  { name: 'M. Alvarez', amount: 100, timeAgo: '2 min ago' },
  { name: 'J. K.', amount: 25, timeAgo: '14 min ago' },
  { name: 'Anonymous', amount: 250, timeAgo: '38 min ago' },
  { name: 'D. Nguyen', amount: 50, timeAgo: '1 hr ago' },
  { name: 'S. Reyes', amount: 500, timeAgo: '3 hr ago' },
  { name: 'Anonymous', amount: 25, timeAgo: '5 hr ago' },
]
