import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { ROUTES } from '@/app/routes'
import { usePortal } from '@/pages/Portal/PortalContext'
import {
  SUPPORT_TYPES,
  SUPPORT_TYPE_LABEL,
  type SupportType,
  type LegalMode,
  type Project,
} from '@/shared/data/portalData'

const inputClass =
  'rounded-md border border-line bg-transparent px-3 py-2 text-sm text-text-hi outline-none placeholder:text-text-low disabled:opacity-40 disabled:cursor-not-allowed'

export const CreateProjectPage = () => {
  const navigate = useNavigate()
  const { createProject } = usePortal()

  const [orgName, setOrgName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<SupportType[]>([])

  const [moneyGoal, setMoneyGoal] = useState('')
  const [volunteerRole, setVolunteerRole] = useState('')
  const [legalMode, setLegalMode] = useState<LegalMode>('seeking-help')
  const [legalNote, setLegalNote] = useState('')
  const [medicalNote, setMedicalNote] = useState('')
  const [skillsNeeded, setSkillsNeeded] = useState('')

  const [error, setError] = useState('')

  const toggleType = (type: SupportType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !orgName.trim()) {
      setError('Please fill in title, description, and organization name.')
      return
    }
    if (!imageUrl.trim() || !date.trim() || !location.trim()) {
      setError('Please fill in cover image URL, date, and location.')
      return
    }
    if (selectedTypes.length === 0) {
      setError('Please select at least one support type.')
      return
    }
    if (selectedTypes.includes('money') && (!moneyGoal || Number(moneyGoal) <= 0)) {
      setError('Please enter a valid funding goal.')
      return
    }
    if (selectedTypes.includes('volunteer') && !volunteerRole.trim()) {
      setError('Please enter the volunteer role needed.')
      return
    }
    if (selectedTypes.includes('legal') && !legalNote.trim()) {
      setError('Please describe the legal support needed.')
      return
    }
    if (selectedTypes.includes('medical') && !medicalNote.trim()) {
      setError('Please describe the medical support needed.')
      return
    }
    if (selectedTypes.includes('other-professional') && !skillsNeeded.trim()) {
      setError('Please list the skills needed.')
      return
    }

    const input: Omit<Project, 'id'> = {
      orgName: orgName.trim(),
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      date: date.trim(),
      location: location.trim(),
      supportTypes: selectedTypes,
      ...(selectedTypes.includes('money') && {
        money: {
          goal: Number(moneyGoal),
          raised: 0,
          donorCount: 0,
          daysLeft: 30,
        },
      }),
      ...(selectedTypes.includes('volunteer') && {
        volunteer: { role: volunteerRole.trim(), shifts: [] },
      }),
      ...(selectedTypes.includes('legal') && {
        legal: { legalMode, intakeNote: legalNote.trim() },
      }),
      ...(selectedTypes.includes('medical') && {
        medical: { intakeNote: medicalNote.trim() },
      }),
      ...(selectedTypes.includes('other-professional') && {
        otherProfessional: {
          skillsNeeded: skillsNeeded
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    }

    setError('')
    const created = createProject(input)
    navigate(ROUTES.portalDetail(created.id))
  }

  return (
    <div>
      <Link
        to={ROUTES.portal}
        className="mb-4 inline-block text-[13px] text-text-mid hover:text-text-hi"
      >
        ← Back to Impact Portal
      </Link>

      <div className="mb-6">
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          For organizations
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          Publish a project
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          No account needed for this prototype — fill in the details below and
          your project appears in the portal immediately.
        </p>
      </div>

      <SectionHead title="Project details" />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
            Organization name
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className={inputClass}
              placeholder="Your organization"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Project title"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="What does this project do and who does it help?"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
            Cover image URL
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClass}
              placeholder="https://picsum.photos/seed/your-project/640/360"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
            Location
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              placeholder="Downtown, San Diego"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-[13px] text-text-mid">
            Support types needed
            <div className="flex flex-wrap gap-2">
              {SUPPORT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${
                    selectedTypes.includes(type)
                      ? 'border-coral bg-coral-dim text-[#ffbfa8]'
                      : 'border-line text-text-mid hover:border-text-mid'
                  }`}
                >
                  {SUPPORT_TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </div>

          {selectedTypes.includes('money') && (
            <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
              Funding goal ($)
              <input
                type="number"
                min={1}
                value={moneyGoal}
                onChange={(e) => setMoneyGoal(e.target.value)}
                className={inputClass}
                placeholder="e.g. 10000"
              />
            </label>
          )}

          {selectedTypes.includes('volunteer') && (
            <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
              Volunteer role needed
              <input
                type="text"
                value={volunteerRole}
                onChange={(e) => setVolunteerRole(e.target.value)}
                className={inputClass}
                placeholder="e.g. Outreach Volunteer"
              />
            </label>
          )}

          {selectedTypes.includes('legal') && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] text-text-mid">Legal support type</span>
              <div className="flex gap-4 text-[13px] text-text-mid">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="legalMode"
                    checked={legalMode === 'seeking-help'}
                    onChange={() => setLegalMode('seeking-help')}
                  />
                  Requesting legal help for someone
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="legalMode"
                    checked={legalMode === 'offering-help'}
                    onChange={() => setLegalMode('offering-help')}
                  />
                  Recruiting volunteer lawyers
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
                {legalMode === 'seeking-help'
                  ? 'What should the intake form ask for?'
                  : 'What should volunteer attorneys know?'}
                <textarea
                  value={legalNote}
                  onChange={(e) => setLegalNote(e.target.value)}
                  rows={2}
                  className={inputClass}
                  placeholder="Short note shown on the detail page"
                />
              </label>
            </div>
          )}

          {selectedTypes.includes('medical') && (
            <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
              Medical support needed
              <textarea
                value={medicalNote}
                onChange={(e) => setMedicalNote(e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="e.g. licensed nurses for a weekly clinic"
              />
            </label>
          )}

          {selectedTypes.includes('other-professional') && (
            <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
              Skills needed (comma-separated)
              <input
                type="text"
                value={skillsNeeded}
                onChange={(e) => setSkillsNeeded(e.target.value)}
                className={inputClass}
                placeholder="e.g. Software engineering, UX design"
              />
            </label>
          )}

          {error && <p className="text-[12px] text-coral">{error}</p>}

          <button
            type="submit"
            className="w-fit rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-[#1a0f0a] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Publish project
          </button>
        </form>
      </Card>

      <Footnote>
        <b>Reading it —</b> this form is unauthenticated and prototype-only;
        published projects live only in this browser session and disappear on
        reload.
      </Footnote>
    </div>
  )
}
