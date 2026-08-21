import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { Kpi } from '@/shared/ui/Kpi'
import { ROUTES } from '@/app/routes'
import { usePortal } from '@/pages/Portal/PortalContext'
import { usePortalLinks } from '@/pages/Portal/usePortalLinks'
import { SUPPORT_TYPE_LABEL, type SupportType } from '@/shared/data/portalData'

const BADGE_TONE: Record<SupportType, 'crit' | 'high' | 'mod'> = {
  money: 'mod',
  volunteer: 'high',
  legal: 'crit',
  medical: 'crit',
  'other-professional': 'high',
}

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US')}`

const SUGGESTED_AMOUNTS = [25, 50, 100, 250]

const AdminParticipationNote = () => (
  <p className="text-[13px] text-text-mid">
    Signups are made by community members from the public{' '}
    <Link to={ROUTES.projects} className="text-coral hover:underline">
      Find Ways to Help
    </Link>{' '}
    page.
  </p>
)

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { projects } = usePortal()
  const links = usePortalLinks()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100)
  const [customAmount, setCustomAmount] = useState('')
  const [justDonated, setJustDonated] = useState(false)

  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <Card>
        <p className="text-[13px] text-text-mid">
          This project could not be found — it may not exist this session.
        </p>
        <Link
          to={links.browse}
          className="mt-3 inline-block text-sm text-coral hover:underline"
        >
          {links.isPublic ? 'Back to Find Ways to Help' : 'Back to Impact Portal'}
        </Link>
      </Card>
    )
  }

  const amount =
    customAmount.trim() !== '' ? Number(customAmount) || 0 : selectedAmount ?? 0

  const pctRaised = project.money
    ? Math.min(100, Math.round((project.money.raised / project.money.goal) * 100))
    : 0

  return (
    <div>
      <Link
        to={links.browse}
        className="mb-4 inline-block text-[13px] text-text-mid hover:text-text-hi"
      >
        ← Back to {links.isPublic ? 'Find Ways to Help' : 'Impact Portal'}
      </Link>

      <img
        src={project.imageUrl}
        alt={project.title}
        className="mb-5 h-56 w-full rounded-xl object-cover"
      />

      <div className="mb-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {project.supportTypes.map((type) => (
            <Badge key={type} tone={BADGE_TONE[type]}>
              {SUPPORT_TYPE_LABEL[type]}
            </Badge>
          ))}
        </div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-text-low">
          {project.orgName}
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          {project.title}
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          {project.description}
        </p>
      </div>

      {project.money && (
        <div className="mb-7">
          <SectionHead title="Funding progress" />
          <Card>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1.5">
              <div className="font-mono text-[22px] font-semibold text-text-hi">
                {formatCurrency(project.money.raised)}
                <span className="ml-1.5 text-[13px] font-normal text-text-mid">
                  raised of {formatCurrency(project.money.goal)} goal
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

          <div className="mt-4 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <Kpi
              label="Raised so far"
              value={formatCurrency(project.money.raised)}
              delta={`${pctRaised}% of goal`}
              tone="ok"
            />
            <Kpi
              label="Goal"
              value={formatCurrency(project.money.goal)}
              tone="neutral"
            />
            <Kpi
              label="Donors"
              value={project.money.donorCount}
              deltaTone="up"
              tone="neutral"
            />
            <Kpi
              label="Days left"
              value={project.money.daysLeft}
              tone="warn"
            />
          </div>

          <div className="mt-5">
            <Card>
              {links.isPublic ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2.5">
                    {SUGGESTED_AMOUNTS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(value)
                          setCustomAmount('')
                          setJustDonated(false)
                        }}
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
                    onClick={() => amount > 0 && setJustDonated(true)}
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
                </>
              ) : (
                <p className="text-[13px] text-text-mid">
                  Donations are made by community members from the public{' '}
                  <Link to={ROUTES.projects} className="text-coral hover:underline">
                    Find Ways to Help
                  </Link>{' '}
                  page.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      {project.volunteer && (
        <div className="mb-7">
          <SectionHead title="Volunteer" />
          <Card>
            <p className="mb-3 text-[13px] text-text-mid">
              Role: <b className="text-text-hi">{project.volunteer.role}</b>
            </p>
            {links.isPublic ? (
              <Link
                to={links.volunteer(project.id)}
                className="inline-block rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-[#1a0f0a] hover:bg-coral/90"
              >
                Sign up to volunteer
              </Link>
            ) : (
              <AdminParticipationNote />
            )}
          </Card>
        </div>
      )}

      {project.legal && (
        <div className="mb-7">
          <SectionHead
            title={
              project.legal.legalMode === 'seeking-help'
                ? 'Request legal help'
                : 'Volunteer as an attorney'
            }
          />
          <Card>
            <p className="mb-3 text-[13px] text-text-mid">{project.legal.intakeNote}</p>
            {links.isPublic ? (
              <Link
                to={links.legalAid(project.id)}
                className="inline-block rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-[#1a0f0a] hover:bg-coral/90"
              >
                {project.legal.legalMode === 'seeking-help'
                  ? 'Start intake form'
                  : 'Sign up to volunteer'}
              </Link>
            ) : (
              <AdminParticipationNote />
            )}
          </Card>
        </div>
      )}

      {project.medical && (
        <div className="mb-7">
          <SectionHead title="Volunteer your medical skills" />
          <Card>
            <p className="mb-3 text-[13px] text-text-mid">{project.medical.intakeNote}</p>
            {links.isPublic ? (
              <Link
                to={links.volunteer(project.id)}
                className="inline-block rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-[#1a0f0a] hover:bg-coral/90"
              >
                Sign up to volunteer
              </Link>
            ) : (
              <AdminParticipationNote />
            )}
          </Card>
        </div>
      )}

      {project.otherProfessional && (
        <div className="mb-7">
          <SectionHead title="Skills needed" />
          <Card>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {project.otherProfessional.skillsNeeded.map((skill) => (
                <Badge key={skill} tone="high">
                  {skill}
                </Badge>
              ))}
            </div>
            {links.isPublic ? (
              <Link
                to={links.volunteer(project.id)}
                className="inline-block rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-[#1a0f0a] hover:bg-coral/90"
              >
                Offer your skills
              </Link>
            ) : (
              <AdminParticipationNote />
            )}
          </Card>
        </div>
      )}

      <Footnote>
        <b>Reading it —</b> every action on this page is prototype-only; no
        payment, submission, or signup is stored beyond this browser session.
      </Footnote>
    </div>
  )
}
