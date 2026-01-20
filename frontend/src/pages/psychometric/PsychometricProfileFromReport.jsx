import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getReport } from '../../api/psychometric'
import { downloadProfileAsPDF } from '../../utils/downloadProfile'
import './PsychometricProfileFromReport.css'

function toBullets(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function truncateToWords(text, maxWords) {
  if (!text) return ''
  const words = String(text).trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return String(text).trim()
  return `${words.slice(0, maxWords).join(' ')}…`
}

function PsychometricProfileFromReport() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const pageRef = useRef(null)

  const [report, setReport] = useState(location.state?.reportData || null)
  const [isLoading, setIsLoading] = useState(!location.state?.reportData)
  const [error, setError] = useState(null)

  const [photoDataUrl, setPhotoDataUrl] = useState(location.state?.photoDataUrl || '')
  const [showPhotoModal, setShowPhotoModal] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (report || !sessionId) return
      try {
        setIsLoading(true)
        const data = await getReport(sessionId)
        if (!mounted) return
        setReport(data)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load report')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [report, sessionId])

  useEffect(() => {
    // Only force the modal open if there is no photo yet.
    setShowPhotoModal(!photoDataUrl)
  }, [photoDataUrl])

  const userInfo = report?.userInfo || {}

  const summaryText = useMemo(() => {
    // Use psychometric report narrative as the profile summary content.
    // Prefer summaryBio, then narrativeSummary, then interviewSummary.
    const raw = (
      report?.summaryBio ||
      report?.narrativeSummary ||
      report?.interviewSummary ||
      ''
    ).trim()
    // Requirement: left paragraph should not be more than 200 words.
    return truncateToWords(raw, 200)
  }, [report])

  const educationLines = useMemo(() => {
    const lines = []
    const degree = userInfo?.degree || report?.degree
    const specialization = userInfo?.specialization
    const uni = report?.university
    const year = report?.yearOfGraduation

    if (degree) lines.push(degree)
    if (specialization) lines.push(specialization)
    if (uni) lines.push(uni)
    if (year) lines.push(`Graduated: ${year}`)
    return lines
  }, [report, userInfo])

  const skillsBullets = useMemo(() => {
    const merged = []
    merged.push(...toBullets(userInfo?.technicalSkills))
    merged.push(...toBullets(userInfo?.softSkills))
    // Add 2-3 strengths from SWOT as "skills" signal if present
    if (Array.isArray(report?.strengths)) {
      merged.push(...report.strengths.slice(0, 3))
    }
    // de-dupe
    return Array.from(new Set(merged.map((s) => String(s).trim()).filter(Boolean)))
  }, [report, userInfo])

  const certificationsBullets = useMemo(() => {
    // We only use report/userInfo fields; if not available, return empty.
    // Some setups store certifications in userInfo; keep it flexible.
    return toBullets(userInfo?.certifications || report?.certifications)
  }, [report, userInfo])

  const handlePhotoPick = (file) => {
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      alert('Please select a valid image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e?.target?.result
      if (typeof result === 'string') {
        setPhotoDataUrl(result)
        setShowPhotoModal(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDownloadPdf = async () => {
    if (!pageRef.current) return
    try {
      setIsDownloading(true)
      await downloadProfileAsPDF(pageRef.current, {
        fileName: `psychometric-profile-${sessionId || 'candidate'}.pdf`,
        orientation: 'p',
        hasPhoto: Boolean(photoDataUrl),
        centerIfNoPhoto: true,
      })
    } catch (e) {
      console.error('PDF download failed:', e)
      alert(e?.message || 'Failed to download PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="psy-profile-page">
        <div className="psy-profile-shell">
          <div className="psy-profile-loading">Loading profile…</div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="psy-profile-page">
        <div className="psy-profile-shell">
          <div className="psy-profile-error">
            <p>{error || 'No report data found.'}</p>
            <button className="psy-btn" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="psy-profile-page">
      <div className="psy-profile-shell no-print">
        <button className="psy-btn psy-btn-secondary" onClick={() => navigate(-1)}>
          ← Back to Report
        </button>
        <div className="psy-actions">
          <button
            className="psy-btn psy-btn-secondary"
            onClick={() => setShowPhotoModal(true)}
          >
            {photoDataUrl ? 'Change Photo' : 'Add Photo'}
          </button>
          <button
            className="psy-btn psy-btn-primary"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* A4 Preview */}
      <div className="psy-a4-outer">
        <div className="psy-a4-page" ref={pageRef}>
          <h3 className="psy-page-heading">Professional Profile</h3>
          <div className="psy-hero">
            <div className="psy-hero-left">
              <div className="psy-summary">
                {summaryText ? (
                  summaryText.split('\n\n').map((p, idx) => <p key={idx}>{p}</p>)
                ) : (
                  <p>
                    This profile is generated from the psychometric report. Add a photo to complete
                    the preview.
                  </p>
                )}
              </div>
            </div>
            <div className="psy-hero-right">
              <div className="psy-photo-frame">
                {photoDataUrl ? (
                  <img className="psy-photo" src={photoDataUrl} alt="Candidate" />
                ) : (
                  <div className="psy-photo-placeholder">Photo</div>
                )}
              </div>
              <div className="psy-title-block">
                <div className="psy-title-name">{userInfo?.name || 'Candidate'}</div>
              </div>

              {/* Requirement: Skills section should display below the image */}
              <div className="psy-skills-card">
                <div className="psy-skills-title">Skills</div>
                <ul className="psy-skills-bullets">
                  {skillsBullets.length > 0 ? (
                    skillsBullets.slice(0, 10).map((item, idx) => <li key={idx}>{item}</li>)
                  ) : (
                    <li>Not provided</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="psy-details">
            <div className="psy-col">
              <div className="psy-section-title">Education:</div>
              <ul className="psy-bullets">
                {educationLines.length > 0 ? (
                  educationLines.map((item, idx) => <li key={idx}>{item}</li>)
                ) : (
                  <li>Not provided</li>
                )}
              </ul>
            </div>

            <div className="psy-col">
              <div className="psy-section-title">Certifications:</div>
              <ul className="psy-bullets">
                {certificationsBullets.length > 0 ? (
                  certificationsBullets.slice(0, 6).map((item, idx) => <li key={idx}>{item}</li>)
                ) : (
                  <li>Not provided</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Prompt Modal */}
      {showPhotoModal && (
        <div className="psy-modal-overlay no-print" onClick={() => setShowPhotoModal(false)}>
          <div className="psy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="psy-modal-header">
              <h2>Add Profile Photo</h2>
              <button className="psy-modal-close" onClick={() => setShowPhotoModal(false)}>
                ×
              </button>
            </div>
            <p className="psy-modal-desc">
              This template includes a photo. Please upload a headshot (recommended) or you can skip.
            </p>
            <div className="psy-modal-actions">
              <label className="psy-btn psy-btn-primary psy-file-btn">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoPick(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </label>
              <button className="psy-btn psy-btn-secondary" onClick={() => setShowPhotoModal(false)}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PsychometricProfileFromReport


