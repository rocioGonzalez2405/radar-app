import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { usePortal } from '@/pages/Portal/PortalContext'
import { usePortalLinks } from '@/pages/Portal/usePortalLinks'

/**
 * Handles both `legal` project modes:
 * - `seeking-help`: a homeless individual (or the org on their behalf)
 *   requests pro-bono legal help. Collects contact info + case description.
 * - `offering-help`: a lawyer volunteers their time/skills. Collects
 *   contact info + availability/skills, same as a volunteer signup.
 *
 * IMPORTANT: all form state here is local component state only. It is
 * NEVER written to `PortalContext` or any shared/persisted state — per the
 * prototype's no-persistence contract, this data only drives the local
 * "submitted" confirmation UI below and disappears on reload.
 */
export const LegalAidIntakePage = () => {
  const { id } = useParams<{ id: string }>()
  const { projects } = usePortal()
  const links = usePortalLinks()
  const project = projects.find((p) => p.id === id)

  const [contact, setContact] = useState('')
  const [caseDescription, setCaseDescription] = useState('')
  const [availability, setAvailability] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  if (!project || !project.legal) {
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

  const seekingHelp = project.legal.legalMode === 'seeking-help'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!contact.trim()) {
      setError('Please share your contact info.')
      return
    }
    if (seekingHelp && !caseDescription.trim()) {
      setError('Please describe your case.')
      return
    }
    if (!seekingHelp && !availability.trim()) {
      setError('Please share your availability and skills.')
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
          {seekingHelp ? 'Legal-aid intake' : 'Volunteer attorney signup'}
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          {project.title}
        </h1>
      </div>

      <Card className="mb-5 border-amber/40 bg-amber-dim">
        <p className="text-[12.5px] leading-relaxed text-[#f3c67a]">
          <b>This is a prototype.</b> Nothing you enter on this form is
          persisted, logged, or transmitted anywhere. It is not reviewed by a
          real attorney and does not create an attorney-client relationship.
        </p>
      </Card>

      <SectionHead
        title={seekingHelp ? 'Tell us about your case' : 'Your availability'}
      />
      <Card>
        {submitted ? (
          <div>
            <p className="text-[15px] font-semibold text-teal">
              {seekingHelp
                ? 'Your intake was received.'
                : 'Thanks for volunteering!'}
            </p>
            <p className="mt-2 text-[13px] text-text-mid">
              This is a prototype — nothing you entered was saved,
              transmitted, or shared with a real attorney or case-management
              system.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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
            {seekingHelp ? (
              <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
                Case description
                <textarea
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  rows={4}
                  className="rounded-md border border-line bg-transparent px-3 py-2 text-sm text-text-hi outline-none placeholder:text-text-low"
                  placeholder="Briefly describe your situation and any upcoming hearing dates"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1.5 text-[13px] text-text-mid">
                Availability and skills
                <textarea
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  rows={4}
                  className="rounded-md border border-line bg-transparent px-3 py-2 text-sm text-text-hi outline-none placeholder:text-text-low"
                  placeholder="Bar status, practice area, and hours you can donate per month"
                />
              </label>
            )}
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
        <b>Reading it —</b> this form's data lives only in this page's local
        state; it is never written to shared portal state and disappears on
        reload.
      </Footnote>
    </div>
  )
}
