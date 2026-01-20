import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createPsychometricSession } from '../../api/psychometric'

const initialSkillsForm = {
  certifications: '',
  achievements: '',
  technicalSkills: '',
  softSkills: '',
  interests: '',
  hobbies: '',
}

function PsychometricSkills() {
  const navigate = useNavigate()
  const location = useLocation()
  const [skillsForm, setSkillsForm] = useState(() => {
    // Try to load skills data from sessionStorage if available
    try {
      const savedSkills = sessionStorage.getItem('psychometric_skills_data')
      if (savedSkills) {
        const parsed = JSON.parse(savedSkills)
        return {
          certifications: parsed.certifications || '',
          achievements: parsed.achievements || '',
          technicalSkills: parsed.technicalSkills || '',
          softSkills: parsed.softSkills || '',
          interests: parsed.interests || '',
          hobbies: parsed.hobbies || '',
        }
      }
    } catch (e) {
      console.error('Error loading saved skills:', e)
    }
    return initialSkillsForm
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const userInfo = location.state?.userInfo || null

  useEffect(() => {
    if (!userInfo) {
      navigate('/psychometric/start')
    }
  }, [userInfo, navigate])

  // Clear session storage after using it
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('psychometric_skills_data')
    }
  }, [])

  const validate = (data) => {
    const nextErrors = {}
    if (!data.technicalSkills.trim()) nextErrors.technicalSkills = 'Technical Skills is required'
    if (!data.softSkills.trim()) nextErrors.softSkills = 'Soft Skills is required'
    if (!data.interests.trim()) nextErrors.interests = 'Interests is required'
    if (!data.hobbies.trim()) nextErrors.hobbies = 'Hobbies is required'
    return nextErrors
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitError(null)

    const validation = validate(skillsForm)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setIsSubmitting(true)
    try {
      const result = await createPsychometricSession({
        ...userInfo,
        ...skillsForm,
      })
      navigate(`/psychometric/instructions/${result.sessionId}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to start session')
      setIsSubmitting(false)
    }
  }

  const baseTextarea =
    'w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white resize-y'

  const fields = [
    {
      id: 'certifications',
      label: 'Certifications',
      placeholder: '',
      required: false,
      rows: 2,
    },
    {
      id: 'achievements',
      label: 'Achievements',
      placeholder: '',
      required: false,
      rows: 2,
    },
    {
      id: 'technicalSkills',
      label: 'Technical Skills *',
      placeholder: 'e.g., React, SQL, Canva',
      required: true,
      rows: 3,
    },
    {
      id: 'softSkills',
      label: 'Soft Skills *',
      placeholder: 'e.g., Leadership, Communication',
      required: true,
      rows: 3,
    },
    {
      id: 'interests',
      label: 'Interests *',
      placeholder: 'e.g., Product design, Data storytelling',
      required: true,
      rows: 3,
    },
    {
      id: 'hobbies',
      label: 'Hobbies *',
      placeholder: 'e.g., Photography, Learning new languages',
      required: true,
      rows: 3,
    },
  ]

  const renderField = (field) => {
    const error = errors[field.id]
    return (
      <div key={field.id} className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600" htmlFor={field.id}>
          {field.label}
        </label>
        <textarea
          id={field.id}
          name={field.id}
          rows={field.rows}
          value={skillsForm[field.id]}
          onChange={(e) => setSkillsForm({ ...skillsForm, [field.id]: e.target.value })}
          placeholder={field.placeholder}
          className={baseTextarea}
        />
        {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 font-semibold">{error}</p>}
      </div>
    )
  }

  if (!userInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Psychometric assessment</p>
            <h1 className="text-3xl font-bold text-slate-900">Skills & highlights</h1>
            <p className="max-w-3xl text-slate-600">
              Share your skills, achievements, and interests to help personalize your assessment experience.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/80 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={onSubmit} className="p-6 sm:p-10 space-y-8" noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((field) => renderField(field))}
            </div>

            {submitError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{submitError}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/psychometric/start', { state: { formData: userInfo } })}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? 'Creating session…' : 'Start assessment'}
              </button>
            </div>
          </form>

          <aside className="bg-slate-900 text-white p-8 space-y-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400">What you get</p>
              <h4 className="mt-2 text-2xl font-semibold">Comprehensive Assessment</h4>
              <p className="mt-3 text-sm text-slate-300">
                Take a thorough psychometric evaluation that analyzes your aptitude, personality traits, and domain expertise. 
                Receive a detailed AI-generated report with personalized insights and career recommendations.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Snapshot</p>
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400">Length</p>
                  <p className="text-base font-semibold text-white">3 sections · 120 questions</p>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400">Duration</p>
                  <p className="text-base font-semibold text-white">~35 mins average</p>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400">Output</p>
                  <p className="text-base font-semibold text-white">AI-personalized report</p>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400">Proctoring</p>
                  <p className="text-base font-semibold text-white">Camera & mic ready</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 p-4 space-y-2">
              <p className="text-sm font-semibold text-white">How it works</p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-300">
                <li>Fill in your skills and background information.</li>
                <li>Read the instructions while the test questions are being prepared.</li>
                <li>Complete all three sections to receive your personalized report.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default PsychometricSkills

