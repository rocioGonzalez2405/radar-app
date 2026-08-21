import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { usePortal } from '@/pages/Portal/PortalContext'
import { usePortalLinks } from '@/pages/Portal/usePortalLinks'

export const VolunteerSignupPage = () => {
  const { id } = useParams<{ id: string }>()
  const { projects } = usePortal()
  const links = usePortalLinks()
  const project = projects.find((p) => p.id === id)

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [shift, setShift] = useState('')
  const [skills, setSkills] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

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

  const shifts = project.volunteer?.shifts ?? []

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !contact.trim() || !skills.trim()) {
      setError('Please fill in your name, contact info, and skills/role interest.')
      return
    }
    if (shifts.length > 0 && !shift) {
      setError('Please select an availability/shift.')
      return
    }
    setError('')
    setSubmitted(true)
  }

  return (
    <div>
      <Link
        to={links.detail(project.id)}
        className="mb-4 inline-block text-[13px] text-text-mid hover:text-text-hi"
      >
        ← Back to {project.title}
      </Link>

      <div className="mb-6">
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Volunteer signup
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          {project.title}
        </h1>
      </div>

      <SectionHead title="Your details" />
      <Card>
        {submitted ? (
          <div>
            <p className="text-[15px] font-semibold text-teal">
              Thanks for signing up!
            </p>
            <p className="mt-2 text-[13px] text-text-mid">
              This is a prototype — no data was saved or transmitted. A real
              deployment would route this to the organization's volunteer
              coordinator.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm text-text-hi outline-none placeholder:text-text-low"
                placeholder="Your full name"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
              Contact info
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm text-text-hi outline-none placeholder:text-text-low"
                placeholder="Email or phone"
              />
            </label>
            {shifts.length > 0 && (
              <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
                Availability / shift
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="rounded-md border border-line bg-ink-1 px-3 py-2 text-sm text-text-hi outline-none"
                >
                  <option value="">Select a shift</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.slotsOpen} slots open)
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
              Skills / role interest
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={3}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm text-text-hi outline-none placeholder:text-text-low"
                placeholder="What skills or roles are you interested in?"
              />
            </label>
            {error && <p className="text-[12px] text-coral">{error}</p>}
            <button
              type="submit"
              className="w-fit rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-[#1a0f0a]"
            >
              Submit
            </button>
          </form>
        )}
      </Card>

      <Footnote>
        <b>Reading it —</b> this signup is not persisted, logged, or sent
        anywhere; it only drives the confirmation message above.
      </Footnote>
    </div>
  )
}
