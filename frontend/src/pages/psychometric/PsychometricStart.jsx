import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAllMyProfiles } from '../../api'

const degreeOptions = ['B.Tech', 'BBA', 'B.Com', 'MBA', 'Other']
const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'not_to_say', label: 'Prefer not to say' },
]

const initialForm = {
  name: '',
  email: '',
  phone: '',
  age: '',
  gender: 'male',
  degree: 'B.Tech',
  specialization: '',
  careerInterest: '',
}

function PsychometricStart() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(() => {
    // Restore form data if coming back from skills page
    return location.state?.formData || initialForm
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [savedProfiles, setSavedProfiles] = useState([])
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const hasAutoSubmittedRef = useRef(false)

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090', [])

  // Check if user is coming from profiling chatbot with data
  useEffect(() => {
    const checkProfileData = async () => {
      // Prevent double execution (React Strict Mode runs effects twice in development)
      if (hasAutoSubmittedRef.current) {
        console.log('Auto-submit already attempted, skipping duplicate execution...')
        return
      }
      
      try {
        const fromProfile = sessionStorage.getItem('psychometric_from_profile')
        const profileDataStr = sessionStorage.getItem('psychometric_profile_data')
        
        console.log('Checking for profile data:', { fromProfile, hasData: !!profileDataStr })
        
        if (fromProfile === 'true' && profileDataStr) {
          // Mark as executed IMMEDIATELY to prevent double-execution
          hasAutoSubmittedRef.current = true
          
          const profileData = JSON.parse(profileDataStr)
          console.log('✅ Detected profile data, auto-creating session:', profileData)
          
          // Clear flags IMMEDIATELY after reading to prevent re-execution
          sessionStorage.removeItem('psychometric_from_profile')
          sessionStorage.removeItem('psychometric_profile_data')
          console.log('🧹 Cleared sessionStorage flags')
          
          setIsSubmitting(true)
          setSubmitError('Creating your psychometric test session from profile data...')
          
          // Import the createPsychometricSession function
          const { createPsychometricSession } = await import('../../api/psychometric')
          
          // Create session and redirect
          const result = await createPsychometricSession(profileData)
          
          console.log('🎯 Auto-session creation result:', result)
          
          if (result && result.sessionId) {
            setSubmitError('✅ Session created successfully! Redirecting...')
            console.log(`🚀 Redirecting to /psychometric/instructions/${result.sessionId}`)
            
            // Navigate to instructions page
            setTimeout(() => {
              navigate(`/psychometric/instructions/${result.sessionId}`, { replace: true })
            }, 500)
          } else {
            console.error('❌ No session ID in result:', result)
            
            // If creation fails, populate the form with the data
            setForm({
              name: profileData.name || '',
              email: profileData.email || '',
              phone: profileData.phone || '',
              age: profileData.age || '',
              gender: profileData.gender || 'male',
              degree: profileData.degree || 'B.Tech',
              specialization: profileData.specialization || '',
              careerInterest: profileData.careerInterest || '',
            })
            
            // Also store skills data
            sessionStorage.setItem('psychometric_skills_data', JSON.stringify({
              certifications: profileData.certifications || '',
              achievements: profileData.achievements || '',
              technicalSkills: profileData.technicalSkills || '',
              softSkills: profileData.softSkills || '',
              interests: profileData.interests || '',
              hobbies: profileData.hobbies || '',
            }))
            
            setSubmitError('⚠️ Auto-session creation failed. Form pre-filled with your data. Please click Continue.')
            setIsSubmitting(false)
          }
        } else {
          console.log('ℹ️ No profile data found in sessionStorage - showing normal form')
        }
      } catch (error) {
        console.error('❌ Error in profile data auto-submit:', error)
        sessionStorage.removeItem('psychometric_from_profile')
        sessionStorage.removeItem('psychometric_profile_data')
        setSubmitError(`Error: ${error.message}. Please fill the form manually.`)
        setIsSubmitting(false)
      }
    }
    
    checkProfileData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return ''
    try {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age > 0 ? age.toString() : ''
    } catch (e) {
      return ''
    }
  }

  // Map degree from profile to form degree options
  const mapDegree = (profileDegree) => {
    if (!profileDegree) return 'B.Tech'
    const degreeLower = profileDegree.toLowerCase()
    if (degreeLower.includes('b.tech') || degreeLower.includes('btech') || degreeLower.includes('bachelor of technology')) {
      return 'B.Tech'
    }
    if (degreeLower.includes('bba') || degreeLower.includes('bachelor of business')) {
      return 'BBA'
    }
    if (degreeLower.includes('b.com') || degreeLower.includes('bcom') || degreeLower.includes('bachelor of commerce')) {
      return 'B.Com'
    }
    if (degreeLower.includes('mba') || degreeLower.includes('master of business')) {
      return 'MBA'
    }
    return 'Other'
  }

  // Load saved profiles
  const loadSavedProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const result = await getAllMyProfiles()
      if (result.success && result.data && Array.isArray(result.data)) {
        setSavedProfiles(result.data)
        setShowProfileDropdown(true)
      } else {
        setSavedProfiles([])
        setSubmitError('No saved data found. Please fill in the form manually.')
      }
    } catch (error) {
      console.error('Error loading saved profiles:', error)
      setSubmitError('Failed to load saved data. Please try again.')
    } finally {
      setLoadingProfiles(false)
    }
  }

  // Fill form from selected profile
  const fillFormFromProfile = (profileResponse) => {
    const profile = profileResponse.profile || profileResponse
    
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      age: calculateAge(profile.dob) || '',
      gender: profile.gender || 'male',
      degree: mapDegree(profile.currentDegree || profile.degree),
      specialization: profile.branch || profile.specialization || '',
      careerInterest: profile.interests || profile.careerInterest || '',
    })
    
    // Store skills data in location state for skills page
    if (profile.technicalSkills || profile.softSkills || profile.interests || profile.hobbies || profile.certifications || profile.achievements) {
      // Store in a way that can be accessed on skills page
      sessionStorage.setItem('psychometric_skills_data', JSON.stringify({
        certifications: profile.certifications || '',
        achievements: profile.achievements || '',
        technicalSkills: profile.technicalSkills || '',
        softSkills: profile.softSkills || '',
        interests: profile.interests || '',
        hobbies: profile.hobbies || '',
      }))
    }
    
    setShowProfileDropdown(false)
    setSubmitError(null)
  }

  const validate = (data) => {
    const nextErrors = {}
    if (!data.name.trim()) nextErrors.name = 'Name is required'
    if (!data.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) nextErrors.email = 'Enter a valid email'
    if (!data.phone || data.phone.length < 7 || data.phone.length > 15)
      nextErrors.phone = 'Phone must be 7-15 digits'
    if (!data.age || Number(data.age) <= 0) nextErrors.age = 'Age is required'
    if (!data.degree) nextErrors.degree = 'Degree is required'
    if (!data.specialization.trim()) nextErrors.specialization = 'Specialization is required'
    if (!data.careerInterest.trim()) nextErrors.careerInterest = 'Career interest is required'
    return nextErrors
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitError(null)

    const validation = validate(form)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    // Navigate to skills page with user info
    navigate('/psychometric/skills', {
      state: {
        userInfo: {
          ...form,
          age: Number(form.age),
        },
      },
    })
  }

  const baseInput =
    'w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white'

  const fieldRows = [
    [
      {
        id: 'name',
        label: 'Full name',
        type: 'text',
        placeholder: '',
      },
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        placeholder: '',
      },
    ],
    [
      {
        id: 'phone',
        label: 'Phone',
        type: 'tel',
        placeholder: 'e.g., (123) 456-7890',
      },
      {
        id: 'age',
        label: 'Age',
        type: 'number',
        placeholder: '',
        min: 15,
        max: 80,
      },
    ],
    [
      {
        id: 'gender',
        label: 'Gender',
        type: 'select',
        options: genderOptions,
      },
      {
        id: 'degree',
        label: 'Degree',
        type: 'select',
      },
    ],
    [
      {
        id: 'specialization',
        label: 'Specialization',
        type: 'text',
        placeholder: 'e.g., CSE, IT, Finance, Marketing',
        span: true,
      },
    ],
    [
      {
        id: 'careerInterest',
        label: 'Career interest',
        type: 'text',
        placeholder: 'e.g., Product design, Data storytelling',
        span: true,
      },
    ],
  ]

  const renderField = (field) => {
    const error = errors[field.id]
    if (field.type === 'select') {
      const options = field.options || degreeOptions.map(opt => ({ value: opt, label: opt }))
      return (
        <div key={field.id} className={`flex flex-col gap-2 ${field.span ? 'md:col-span-2' : ''}`}>
          <label className="text-sm font-medium text-slate-600" htmlFor={field.id}>
            {field.label}
          </label>
          <select
            id={field.id}
            name={field.id}
            value={form[field.id]}
            onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
            className={baseInput}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 font-semibold">{error}</p>}
        </div>
      )
    }

    return (
      <div key={field.id} className={`flex flex-col gap-2 ${field.span ? 'md:col-span-2' : ''}`}>
        <label className="text-sm font-medium text-slate-600" htmlFor={field.id}>
          {field.label}
        </label>
        <input
          id={field.id}
          name={field.id}
          type={field.type}
          min={field.min}
          max={field.max}
          value={form[field.id]}
          onChange={(e) =>
            setForm({
              ...form,
              [field.id]:
                field.type === 'number'
                  ? e.target.value === ''
                    ? ''
                    : Number(e.target.value)
                  : e.target.value,
            })
          }
          placeholder={field.placeholder}
          className={baseInput}
        />
        {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 font-semibold">{error}</p>}
      </div>
    )
  }

  const quickFacts = [
    { label: 'Length', value: '3 sections · 120 questions' },
    { label: 'Duration', value: '~35 mins average' },
    { label: 'Output', value: 'AI-personalized report' },
    { label: 'Proctoring', value: 'Camera & mic ready' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Psychometric assessment</p>
            <h1 className="text-3xl font-bold text-slate-900">Start your guided evaluation</h1>
            <p className="max-w-3xl text-slate-600">
              Share a few details to begin your tailored assessment. This comprehensive 3-section test evaluates your aptitude, 
              behavioral traits, and domain knowledge, followed by a detailed AI-powered report with personalized insights.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/80 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={onSubmit} className="p-6 sm:p-10 space-y-8" noValidate>
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">Tell us about yourself</h3>
              <p className="mt-2 text-slate-500">
                Provide your basic information to get started with the assessment.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {fieldRows.flat().map((field) => renderField(field))}
            </div>

            {submitError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{submitError}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-slate-500">
                  All fields are required to proceed with the assessment.
                </div>
                <button
                  type="button"
                  onClick={loadSavedProfiles}
                  disabled={loadingProfiles}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition flex items-center gap-2 self-start"
                >
                  {loadingProfiles ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Load from saved data
                    </>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? 'Loading…' : 'Continue'}
              </button>
            </div>

            {/* Profile Selection Dropdown */}
            {showProfileDropdown && savedProfiles.length > 0 && (
              <div className="relative">
                <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex items-center justify-between p-2 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-700">Select saved information</p>
                      <button
                        type="button"
                        onClick={() => setShowProfileDropdown(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {savedProfiles.map((profileResponse, index) => {
                      const profile = profileResponse.profile || profileResponse
                      const profileDate = profile.createdAt 
                        ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : `Entry ${index + 1}`
                      return (
                        <button
                          key={profile.id || index}
                          type="button"
                          onClick={() => fillFormFromProfile(profileResponse)}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{profile.name || 'Unnamed Entry'}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {profile.currentDegree || profile.degree || 'No degree'} • {profile.branch || profile.specialization || 'No specialization'}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">{profileDate}</p>
                            </div>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
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
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="rounded-2xl bg-white/5 px-4 py-3">
                    <p className="text-xs text-slate-400">{fact.label}</p>
                    <p className="text-base font-semibold text-white">{fact.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 p-4 space-y-2">
              <p className="text-sm font-semibold text-white">How it works</p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-300">
                <li>Fill in your basic details to get started.</li>
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

export default PsychometricStart
