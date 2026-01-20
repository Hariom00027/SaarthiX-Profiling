import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { enhanceUploadedParagraphWithReport } from '../../api'
import { downloadProfileAsPDF } from '../../utils/downloadProfile'
import './ProfilePreview.css'

function ProfilePreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profileData, reportData, sessionId } = location.state || {}
  const pageRef = useRef(null)
  
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedParagraph, setEnhancedParagraph] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState('')

  const normalizeToParagraph = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const splitBullets = (text, max = 12) => {
    if (!text) return []
    const raw = String(text)
      .split(/[,•\n\r]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
    // de-dup (case-insensitive)
    const seen = new Set()
    const unique = []
    for (const item of raw) {
      const key = item.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(item)
      if (unique.length >= max) break
    }
    return unique
  }

  const profile = profileData?.profile || profileData || {}
  const candidateName = profile?.name || profileData?.name || 'Candidate'

  // Uploaded profile paragraph source preference:
  // 1) rawText from PDF parser (backend now returns it)
  // 2) templateText from uploaded json profile (if present)
  // 3) aiEnhancedTemplateText (fallback)
  const uploadedParagraph =
    normalizeToParagraph(profileData?.rawText) ||
    normalizeToParagraph(profileData?.profile?.templateText || profileData?.templateText) ||
    normalizeToParagraph(profileData?.profile?.aiEnhancedTemplateText || profileData?.aiEnhancedTemplateText) ||
    ''

  const educationBullets = useMemo(() => {
    const bullets = []
    const degree = profile?.currentDegree || profile?.degree
    const institute = profile?.institute
    const branch = profile?.branch
    const year = profile?.yearOfStudy

    if (degree) bullets.push(String(degree).trim())
    if (institute) bullets.push(String(institute).trim())
    if (branch) bullets.push(`Specialization: ${String(branch).trim()}`)
    if (year) bullets.push(`Year: ${String(year).trim()}`)
    return bullets.filter(Boolean)
  }, [profile])

  const technicalBullets = useMemo(() => splitBullets(profile?.technicalSkills, 14), [profile?.technicalSkills])
  const softBullets = useMemo(() => splitBullets(profile?.softSkills, 14), [profile?.softSkills])

  if (!profileData || !reportData) {
    return (
      <div className="profile-preview-page">
        <div className="error-container">
          <p>No profile or report data available.</p>
          <button onClick={() => navigate(-1)} className="btn-back">Go Back</button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // Ask for photo when page opens (like profile-from-report preview).
    // Only auto-open if user hasn't already provided a photo.
    if (!photoDataUrl) {
      setShowPhotoModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePhotoPick = (file) => {
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      alert('Please select a valid image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setPhotoDataUrl(result)
      }
      setShowPhotoModal(false)
    }
    reader.readAsDataURL(file)
  }

  const handleEnhanceProfile = async () => {
    try {
      setIsEnhancing(true)
      const result = await enhanceUploadedParagraphWithReport({
        text: enhancedParagraph || uploadedParagraph,
        reportData: reportData,
        sessionId: sessionId,
      })

      if (result.success) {
        const enhancedText = result.data?.enhancedText || ''
        setEnhancedParagraph(enhancedText)
        alert('Paragraph enhanced successfully!')
      } else {
        alert(result.error || 'Failed to enhance profile. Please try again.')
      }
    } catch (err) {
      console.error('Failed to enhance profile:', err)
      alert(err.message || 'Failed to enhance profile. Please try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleDownloadProfile = async () => {
    if (!pageRef.current) {
      alert('Unable to download. Please try again.')
      return
    }
    
    try {
      setIsDownloading(true)
      await downloadProfileAsPDF(pageRef.current, {
        fileName: `profile-${sessionId || 'uploaded'}.pdf`,
        orientation: 'p',
        hasPhoto: Boolean(photoDataUrl),
        centerIfNoPhoto: true,
      })
    } catch (err) {
      console.error('Failed to download profile:', err)
      alert(err?.message || 'Failed to download profile. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="profile-preview-page">
      <div className="profile-preview-header no-print">
        <button onClick={() => navigate(-1)} className="btn-back-arrow">
          ← Back to Report
        </button>
        <div className="profile-actions-header">
          <button 
            className="btn-photo-action"
            onClick={() => setShowPhotoModal(true)}
          >
            {photoDataUrl ? 'Change Photo' : 'Add Photo'}
          </button>
          {!enhancedParagraph ? (
            <button 
              onClick={handleEnhanceProfile} 
              className="btn-enhance-profile"
              disabled={isEnhancing}
            >
              {isEnhancing ? 'Enhancing...' : '✨ Enhance Profile with Report'}
            </button>
          ) : (
            <div className="enhanced-info">
              <span className="success-message">✓ Enhanced!</span>
            </div>
          )}
          <button 
            onClick={handleDownloadProfile} 
            className="btn-download-profile"
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* A4 Format Profile Display */}
      <div className="a4-container">
        <div className="a4-page" ref={pageRef}>
          <h3 className="page-heading">Professional Profile</h3>
          
          {/* Hero Section with maroon background */}
          <div className="hero-section">
            <div className="hero-left">
              <div className="profile-summary">
                <p className="summary-paragraph">
                  {enhancedParagraph || uploadedParagraph || 'No uploaded profile content found.'}
                </p>
              </div>
            </div>
            
            <div className="hero-right">
              <div className="photo-frame">
                {photoDataUrl ? (
                  <img className="profile-photo" src={photoDataUrl} alt="Profile" />
                ) : (
                  <div className="photo-placeholder">Photo</div>
                )}
              </div>
              <div className="title-block">
                <div className="profile-name-title">{candidateName}</div>
              </div>

              {/* Skills Card */}
              <div className="skills-card">
                <div className="skills-title">Skills</div>
                <ul className="skills-bullets">
                  {[...technicalBullets.slice(0, 5), ...softBullets.slice(0, 5)].length > 0 ? (
                    [...technicalBullets.slice(0, 5), ...softBullets.slice(0, 5)].slice(0, 10).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))
                  ) : (
                    <li>Not provided</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="details-section">
            <div className="details-col">
              <div className="section-heading">Education:</div>
              <ul className="detail-bullets">
                {educationBullets.length > 0 ? (
                  educationBullets.map((item, idx) => <li key={idx}>{item}</li>)
                ) : (
                  <li>Not provided</li>
                )}
              </ul>
            </div>

            <div className="details-col">
              <div className="section-heading">Technical Skills:</div>
              <ul className="detail-bullets">
                {technicalBullets.length > 0 ? (
                  technicalBullets.slice(0, 8).map((item, idx) => <li key={idx}>{item}</li>)
                ) : (
                  <li>Not provided</li>
                )}
              </ul>
            </div>

            <div className="details-col">
              <div className="section-heading">Soft Skills:</div>
              <ul className="detail-bullets">
                {softBullets.length > 0 ? (
                  softBullets.slice(0, 8).map((item, idx) => <li key={idx}>{item}</li>)
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
        <div className="modal-overlay no-print" onClick={() => setShowPhotoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Profile Photo</h2>
              <button className="modal-close" onClick={() => setShowPhotoModal(false)}>
                ×
              </button>
            </div>
            <p className="modal-desc">
              Please upload a headshot (recommended). You can also skip and add it later.
            </p>
            <div className="modal-actions">
              <label className="modal-btn modal-btn-primary file-btn">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoPick(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </label>
              <button className="modal-btn modal-btn-secondary" onClick={() => setShowPhotoModal(false)}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePreview

