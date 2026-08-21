import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { ROUTES } from '@/app/routes'
import { usePortal } from '@/pages/Portal/PortalContext'
import { usePortalLinks } from '@/pages/Portal/usePortalLinks'
import {
  SUPPORT_TYPES,
  SUPPORT_TYPE_LABEL,
  type SupportType,
} from '@/shared/data/portalData'

const BADGE_TONE: Record<SupportType, 'crit' | 'high' | 'mod'> = {
  money: 'mod',
  volunteer: 'high',
  legal: 'crit',
  medical: 'crit',
  'other-professional': 'high',
}

interface PortalBrowsePageProps {
  variant?: 'admin' | 'public'
}

export const PortalBrowsePage = ({ variant = 'admin' }: PortalBrowsePageProps) => {
  const { projects } = usePortal()
  const links = usePortalLinks()
  const [activeFilter, setActiveFilter] = useState<SupportType | 'all'>('all')
  const isPublic = variant === 'public'

  const filteredProjects = useMemo(
    () =>
      activeFilter === 'all'
        ? projects
        : projects.filter((project) => project.supportTypes.includes(activeFilter)),
    [projects, activeFilter],
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
            {isPublic ? 'Find ways to help' : 'Get involved'}
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">
            {isPublic ? 'Find ways to help' : 'Impact Portal'}
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-text-mid">
            Browse projects published by local organizations and find the
            best way to help — money, time, or professional skills.
          </p>
        </div>
        {!isPublic && (
          <Link
            to={ROUTES.portalNew}
            className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-[#1a0f0a] hover:bg-coral/90"
          >
            Publish a project
          </Link>
        )}
      </div>

      <div className="mb-6">
        <SectionHead title="Filter by support type" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              activeFilter === 'all'
                ? 'border-coral bg-coral-dim text-[#ffbfa8]'
                : 'border-line text-text-mid hover:border-text-mid'
            }`}
          >
            All
          </button>
          {SUPPORT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveFilter(type)}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${
                activeFilter === type
                  ? 'border-coral bg-coral-dim text-[#ffbfa8]'
                  : 'border-line text-text-mid hover:border-text-mid'
              }`}
            >
              {SUPPORT_TYPE_LABEL[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const projectDate = new Date(project.date)
          const month = projectDate
            .toLocaleDateString('en-US', { month: 'short' })
            .toUpperCase()
          const day = projectDate.getDate()

          return (
            <Link key={project.id} to={links.detail(project.id)}>
              <Card
                noPadding
                className="h-full overflow-hidden transition-colors hover:border-text-mid"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={project.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 left-2 rounded-md bg-white px-2 py-1 text-center leading-tight shadow-sm">
                    <div className="text-[10px] font-semibold tracking-wide text-coral">
                      {month}
                    </div>
                    <div className="text-[15px] font-bold text-[#1a0f0a]">
                      {day}
                    </div>
                  </div>
                </div>
                <div className="p-5">
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
                  <div className="mb-1.5 text-[15px] font-semibold text-text-hi">
                    {project.title}
                  </div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[12px] text-text-low">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
                      <circle cx="12" cy="9.5" r="2.5" />
                    </svg>
                    <span>{project.location}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-text-mid">
                    {project.description}
                  </p>
                  {project.money && (
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-2">
                      <div
                        className="h-full rounded-full bg-teal"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (project.money.raised / project.money.goal) * 100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <p className="text-[13px] text-text-mid">
            No projects match this filter yet.
          </p>
        </Card>
      )}

      <Footnote>
        <b>Reading it —</b> projects above are seeded prototype data plus
        anything published this session; nothing here is stored beyond this
        browser session.
      </Footnote>
    </div>
  )
}
