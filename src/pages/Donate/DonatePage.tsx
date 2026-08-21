import { useState } from 'react'
import { Kpi } from '@/shared/ui/Kpi'
import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { donationCampaign, suggestedDonationAmounts, recentDonors } from '@/pages/Donate/donateData'
import { housingContext } from '@/shared/data/radarData'

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US')}`

export const DonatePage = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100)
  const [customAmount, setCustomAmount] = useState('')
  const [justDonated, setJustDonated] = useState(false)
  const [copied, setCopied] = useState(false)

  const amount =
    customAmount.trim() !== '' ? Number(customAmount) || 0 : selectedAmount ?? 0

  const pctRaised = Math.min(
    100,
    Math.round((donationCampaign.raised / donationCampaign.goal) * 100),
  )

  const handleSuggestedClick = (value: number) => {
    setSelectedAmount(value)
    setCustomAmount('')
    setJustDonated(false)
  }

  const handleDonate = () => {
    if (amount <= 0) return
    setJustDonated(true)
  }

  const handleShare = () => {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            Community fundraiser
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">
            {donationCampaign.name}
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-text-mid">
            Every dollar goes toward emergency shelter, childcare, and rapid
            rehousing so women and their children downtown don't fall into
            street homelessness while they wait for a permanent bed.
          </p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="rounded-md border border-line px-3.5 py-1.5 text-sm text-text-hi hover:border-text-mid"
        >
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>

      <div className="mb-7">
        <Card>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1.5">
            <div className="font-mono text-[22px] font-semibold text-text-hi">
              {formatCurrency(donationCampaign.raised)}
              <span className="ml-1.5 text-[13px] font-normal text-text-mid">
                raised of {formatCurrency(donationCampaign.goal)} goal
              </span>
            </div>
            <div className="font-mono text-[13px] text-teal">{pctRaised}%</div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-2">
            <div
              className="h-full rounded-full bg-teal"
              style={{ width: `${pctRaised}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Kpi
          label="Raised so far"
          value={formatCurrency(donationCampaign.raised)}
          delta={`${pctRaised}% of goal`}
          tone="ok"
        />
        <Kpi
          label="Campaign goal"
          value={formatCurrency(donationCampaign.goal)}
          tone="neutral"
        />
        <Kpi
          label="Donors"
          value={donationCampaign.donorCount}
          delta="and counting"
          deltaTone="up"
          tone="neutral"
        />
        <Kpi
          label="Days left"
          value={donationCampaign.daysLeft}
          delta="before this cycle closes"
          tone="warn"
        />
      </div>

      <div className="mb-7">
        <SectionHead title="Choose an amount" />
        <Card>
          <div className="mb-4 flex flex-wrap gap-2.5">
            {suggestedDonationAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSuggestedClick(value)}
                className={`rounded-full border px-4 py-1.5 font-mono text-sm ${
                  selectedAmount === value && customAmount === ''
                    ? 'border-coral bg-coral-dim text-[#ffbfa8]'
                    : 'border-line text-text-mid hover:border-text-mid'
                }`}
              >
                ${value}
              </button>
            ))}
            <input
              type="number"
              min={1}
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setJustDonated(false)
              }}
              className={`w-[140px] rounded-full border bg-transparent px-4 py-1.5 font-mono text-sm text-text-hi outline-none placeholder:text-text-low ${
                customAmount !== '' ? 'border-coral' : 'border-line'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={handleDonate}
            disabled={amount <= 0}
            className="rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-[#1a0f0a] disabled:opacity-40"
          >
            {justDonated ? 'Thank you!' : `Donate $${amount || 0}`}
          </button>
          {justDonated && (
            <p className="mt-2.5 text-[11px] text-teal">
              This is a prototype — no real payment was processed.
            </p>
          )}
        </Card>
      </div>

      <div className="mb-7">
        <SectionHead title="Why this campaign" />
        <Card>
          <p className="text-[13px] leading-relaxed text-text-mid">
            San Diego County's average rent is now{' '}
            <b className="text-text-hi">${housingContext.averageRent.toLocaleString('en-US')}/month</b>
            , up <b className="text-text-hi">{housingContext.rentIncrease5yr}%</b> over
            the last 5 years, and{' '}
            <b className="text-text-hi">{housingContext.eliSeverelyBurdenedPercent}%</b>{' '}
            of extremely-low-income households are severely rent-burdened,
            paying more than half their income on housing (
            {housingContext.source}). This fund exists to close that gap
            directly — funding emergency beds and support services before
            families are pushed onto the street.
          </p>
        </Card>
      </div>

      <div>
        <SectionHead title="Recent donors" note="Most recent first" />
        <Card tight>
          {recentDonors.map((donor, i) => (
            <div
              key={`${donor.name}-${i}`}
              className="flex items-center justify-between border-b border-line-soft px-2.5 py-2.5 text-[12.5px] last:border-b-0"
            >
              <span className="font-medium text-text-hi">{donor.name}</span>
              <span className="font-mono text-text-mid">
                ${donor.amount}
                <span className="ml-2 text-text-low">{donor.timeAgo}</span>
              </span>
            </div>
          ))}
        </Card>
        <Footnote>
          <b>Reading it —</b> donor names and amounts above are synthetic,
          styled after a typical crowdfunding activity feed for this
          prototype.
        </Footnote>
      </div>
    </div>
  )
}
