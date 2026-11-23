
import { useState } from 'react'

const ROUND_OPTIONS = [
  'Aptitude',
  'Online Assessment',
  'Coding',
  'Group Discussion',
  'Technical Interview',
  'HR Interview',
  'Other',
]

const EMPTY_FORM = {
  companyName: '',
  jobRole: '',
  driveDate: '',
  rounds: [],
  questionsAsked: '',
  difficulty: 'Not sure',
  experience: '',
  consent: false,
}

const fieldClass =
  'mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

export default function PlacementFeedbackForm() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(null)

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setMessage(null)
  }

  const toggleRound = (round) => {
    setForm(prev => ({
      ...prev,
      rounds: prev.rounds.includes(round)
        ? prev.rounds.filter(r => r !== round)
        : [...prev.rounds, round],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (sending) return

    setSending(true)
    setMessage(null)

    try {
      const base = (
        import.meta.env.VITE_API_URL || ''
      ).replace(/\/$/, '')

      const response = await fetch(`${base}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          result.error || 'Feedback submission failed.'
        )
      }

      setMessage({
        type: 'success',
        text: 'Thank you! Your feedback has been submitted for review.',
      })
      setForm({ ...EMPTY_FORM, rounds: [] })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Share Your Placement Experience
        </h1>

        <p className="mt-2 mb-6 text-sm text-zinc-500">
          Help your juniors prepare for upcoming placements
          by sharing your interview experience.
          Do not include personal information.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <label className="block text-sm font-medium dark:text-white">
            Company Name *
            <input
              className={fieldClass}
              required
              minLength={2}
              maxLength={120}
              placeholder="e.g. Accenture"
              value={form.companyName}
              onChange={e => update('companyName', e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium dark:text-white">
            Job Role
            <input
              className={fieldClass}
              maxLength={120}
              placeholder="e.g. Software Engineer"
              value={form.jobRole}
              onChange={e => update('jobRole', e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium dark:text-white">
            Placement Drive Date
            <input
              type="date"
              className={fieldClass}
              max={new Date().toISOString().slice(0, 10)}
              value={form.driveDate}
              onChange={e => update('driveDate', e.target.value)}
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium dark:text-white">
              Interview Rounds Attended
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROUND_OPTIONS.map(round => (
                <label
                  key={round}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:text-white"
                >
                  <input
                    type="checkbox"
                    checked={form.rounds.includes(round)}
                    onChange={() => toggleRound(round)}
                    className="accent-blue-600"
                  />
                  {round}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-medium dark:text-white">
            Interview Questions Asked *
            <textarea
              required
              minLength={20}
              maxLength={5000}
              rows={5}
              className={fieldClass}
              placeholder="Write the questions you remember, preferably one per line..."
              value={form.questionsAsked}
              onChange={e => update('questionsAsked', e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium dark:text-white">
            Overall Difficulty
            <select
              className={fieldClass}
              value={form.difficulty}
              onChange={e => update('difficulty', e.target.value)}
            >
              <option>Not sure</option>
              <option>Easy</option>
              <option>Moderate</option>
              <option>Hard</option>
            </select>
          </label>

          <label className="block text-sm font-medium dark:text-white">
            Tips for Future Students
            <textarea
              rows={3}
              maxLength={2000}
              className={fieldClass}
              placeholder="Preparation advice, interview experience, important topics..."
              value={form.experience}
              onChange={e => update('experience', e.target.value)}
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              required
              className="mt-1 accent-blue-600"
              checked={form.consent}
              onChange={e => update('consent', e.target.checked)}
            />
            I agree that my feedback may be reviewed and
            shared anonymously on the placement portal.
          </label>

          {message && (
            <p
              role="status"
              className={
                message.type === 'success'
                  ? 'text-sm text-green-600'
                  : 'text-sm text-red-600'
              }
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Submitting...' : 'Submit Feedback'}
          </button>

          <p className="text-center text-xs text-zinc-500">
            Submissions are reviewed before publication.
          </p>

        </form>
      </div>
    </section>
  )
}
