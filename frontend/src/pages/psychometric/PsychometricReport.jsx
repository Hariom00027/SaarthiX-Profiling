import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport, downloadReportPdf, downloadAnswersPdf, generateReport, saveReport, checkReportSaved } from '../../api/psychometric'
import { getAllMyProfiles, enhanceProfileWithReport, parseProfilePdf } from '../../api'
import SuccessModal from '../../components/SuccessModal'
import LoadingOverlay from '../../components/LoadingOverlay'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell
} from 'recharts'
import './PsychometricReport.css'

function PsychometricReport() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [savedProfiles, setSavedProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [uploadedProfile, setUploadedProfile] = useState(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceStep, setEnhanceStep] = useState('select') // 'select', 'confirm'
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [enhancedProfileId, setEnhancedProfileId] = useState(null)

  useEffect(() => {
    if (sessionId) {
      loadReport()
      checkIfSaved()
    }
  }, [sessionId])

  const loadReport = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const reportData = await getReport(sessionId)
      setReport(reportData)
    } catch (err) {
      console.error('Failed to load report:', err)
      // Try to generate report if it doesn't exist
      if (err.message.includes('404') || err.message.includes('not found')) {
        try {
          setIsGenerating(true)
          const newReport = await generateReport(sessionId)
          setReport(newReport)
        } catch (genErr) {
          setError('Failed to generate report. Please ensure the test is completed.')
        } finally {
          setIsGenerating(false)
        }
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const checkIfSaved = async () => {
    try {
      const saved = await checkReportSaved(sessionId)
      setIsSaved(saved)
    } catch (err) {
      console.error('Failed to check if report is saved:', err)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      // Pass the current report data to avoid extra API call
      await downloadReportPdf(sessionId, report)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      alert('Failed to download PDF report. Please try again.')
    }
  }

  const handleViewAnswers = async () => {
    try {
      await downloadAnswersPdf(sessionId)
    } catch (err) {
      console.error('Failed to download answers PDF:', err)
      alert(err.message || 'Failed to download answers. Please try again.')
    }
  }

  const handleSaveReport = async () => {
    if (isSaved) {
      alert('This report is already saved!')
      return
    }

    try {
      setIsSaving(true)
      await saveReport(sessionId)
      setIsSaved(true)
      alert('Report saved successfully! You can view it from the home page.')
    } catch (err) {
      console.error('Failed to save report:', err)
      alert(err.message || 'Failed to save report. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnhanceProfile = async () => {
    setShowEnhanceModal(true)
    setEnhanceStep('select')
    // Load saved profiles
    try {
      const result = await getAllMyProfiles()
      if (result.success && result.data) {
        setSavedProfiles(result.data)
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    }
  }

  const handleProfileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Handle JSON files
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const profileData = JSON.parse(e.target.result)
          showUploadedProfilePreview(profileData)
        } catch (err) {
          alert('Invalid profile file. Please upload a valid JSON file.')
        }
      }
      reader.readAsText(file)
    } 
    // Handle PDF files
    else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        // Call the API to parse the PDF
        const result = await parseProfilePdf(file)
        
        if (result.success && result.data) {
          showUploadedProfilePreview(result.data)
        } else {
          throw new Error(result.error || 'Failed to parse PDF file')
        }
      } catch (err) {
        console.error('Error parsing PDF:', err)
        alert(err.message || 'Failed to parse PDF file. Please try again.')
      }
    } else {
      alert('Please upload a JSON or PDF file.')
    }
  }

  const showUploadedProfilePreview = (profileData) => {
    // For uploaded profiles, navigate to preview page
    setUploadedProfile(profileData)
    setShowEnhanceModal(false)
    
    navigate('/psychometric/profile-preview', { 
      state: { 
        profileData: profileData,
        reportData: report,
        sessionId: sessionId
      } 
    })
  }

  const handleProfileSelect = (profileResponse) => {
    // For saved profiles, just set as selected (don't navigate)
    setSelectedProfile(profileResponse)
    setUploadedProfile(null)
  }

  const handleEnhanceSavedProfile = async () => {
    if (!selectedProfile) return

    try {
      setIsEnhancing(true)
      const profileData = selectedProfile.profile || selectedProfile
      
      const result = await enhanceProfileWithReport({
        profileId: profileData.id,
        // IMPORTANT: send the actual Profile object so backend updates the same saved profile (no new profile created)
        profileData: profileData,
        reportData: report,
        sessionId: sessionId
      })

      if (result.success) {
        // Close enhance modal
        setShowEnhanceModal(false)
        setSelectedProfile(null)
        setIsEnhancing(false)
        
        // Store the enhanced profile ID and show success modal
        setEnhancedProfileId(profileData.id)
        setShowSuccessModal(true)
      } else {
        setIsEnhancing(false)
        alert(result.error || 'Failed to enhance profile. Please try again.')
      }
    } catch (err) {
      setIsEnhancing(false)
      console.error('Failed to enhance profile:', err)
      alert(err.message || 'Failed to enhance profile. Please try again.')
    }
  }


  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    
    // Store the enhanced profile ID in localStorage for the main app to load
    if (enhancedProfileId) {
      localStorage.setItem('viewProfileId', enhancedProfileId)
      localStorage.setItem('currentView', 'display')
    }
    
    setEnhancedProfileId(null)
    // Navigate to main app display page which will load the enhanced profile
    window.location.href = '/display'
  }

  const closeEnhanceModal = () => {
    setShowEnhanceModal(false)
    setSelectedProfile(null)
    setUploadedProfile(null)
    setEnhanceStep('select')
  }

  const handleCreateProfile = async () => {
    // Open the profile in a dedicated A4 preview page (like Upload Profile preview).
    // The preview page will prompt for an image and allow PDF download that matches the preview.
    navigate(`/psychometric/profile-from-report/${sessionId}`, {
      state: { reportData: report, sessionId },
    })
  }

  if (isLoading || isGenerating) {
    return (
      <div className="page">
        <div className="card">
          <p>{isGenerating ? 'Generating report...' : 'Loading report...'}</p>
          <p className="muted">This may take a moment.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="card">
          <p className="error">{error}</p>
          <button onClick={() => navigate('/psychometric/start')} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="page">
        <div className="card">
          <p className="error">No report found</p>
          <button onClick={() => navigate('/psychometric/start')} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const userInfo = report.userInfo || {}
  const chartData = report.chartsData || {}

  return (
    <div className="page report-page">
      <div className="report-container">
        {/* Header */}
        <div className="report-header">
          <h1 className="report-title">CANDIDATE REPORT</h1>
        </div>

        {/* Candidate Info Section */}
        <div className="candidate-info-section">
          <div className="candidate-info-left">
            <div className="candidate-name-section">
              <div className="candidate-label">CANDIDATE NAME</div>
              <h2 className="candidate-name">{userInfo.name || 'Candidate'}</h2>
            </div>
            <div className="resume-link-section">
              <div className="resume-label">EMAIL</div>
              <div className="email-text">{userInfo.email || 'connect@crezam.com'}</div>
            </div>
            {report.reportGeneratedAt && (
              <div className="report-date">
                {new Date(report.reportGeneratedAt).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </div>
            )}
          </div>
          <div className="candidate-info-right">
            <div className="scores-section">
              <div className="score-box">
                <div className="score-label">MCQ SCORING</div>
                <div className="score-value">{report.correct || 0}/{report.totalQuestions || 0}</div>
              </div>
              <div className="score-box">
                <div className="score-label">CANDIDATE PERCENTAGE</div>
                <div className="score-value">{report.candidatePercentile?.toFixed(2) || '0.00'}%</div>
              </div>
            </div>
            <div className="progress-bar-section">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${report.candidatePercentile || 0}%` }}
                ></div>
              </div>
              <div className="progress-text">{report.candidatePercentile?.toFixed(2) || '0.00'}/100</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="report-actions">
          <button onClick={handleViewAnswers} className="btn-view-answers">VIEW ANSWERS</button>
          <button 
            onClick={handleSaveReport} 
            className={`btn-save-report ${isSaved ? 'saved' : ''}`}
            disabled={isSaving || isSaved}
          >
            {isSaving ? 'SAVING...' : isSaved ? 'SAVED ✓' : 'SAVE REPORT'}
          </button>
          <button onClick={handleDownloadPdf} className="btn-download-report">
            DOWNLOAD FULL REPORT
          </button>
          <button 
            onClick={handleCreateProfile} 
            className="btn-create-profile"
            disabled={!report}
          >
            CREATE PROFILE FROM REPORT
          </button>
          <button onClick={handleEnhanceProfile} className="btn-enhance-profile">
            ENHANCE PROFILE
          </button>
        </div>

        {/* Bio Section */}
        <div className="report-section">
          <h3>BIO</h3>
          <p className="section-description">
            This section provides a comprehensive overview of the candidate's professional background, 
            educational qualifications, career aspirations, and personal interests.
          </p>
          <div className="bio-content">
            {report.summaryBio ? (
              <p>{report.summaryBio}</p>
            ) : (
              <div>
                {userInfo.careerInterest && (
                  <p><strong>Career Interest:</strong> {userInfo.careerInterest}</p>
                )}
                {userInfo.degree && (
                  <p><strong>Education:</strong> {userInfo.degree} {userInfo.specialization ? `in ${userInfo.specialization}` : ''}</p>
                )}
                {userInfo.technicalSkills && (
                  <p><strong>Technical Skills:</strong> {userInfo.technicalSkills}</p>
                )}
                {userInfo.softSkills && (
                  <p><strong>Soft Skills:</strong> {userInfo.softSkills}</p>
                )}
                {userInfo.hobbies && (
                  <p><strong>Hobbies:</strong> {userInfo.hobbies}</p>
                )}
                {userInfo.interests && (
                  <p><strong>Interests:</strong> {userInfo.interests}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Education Section */}
        <div className="report-section">
          <h3>EDUCATION</h3>
          <p className="section-description">
            This section details the candidate's academic qualifications, including their degree, 
            specialization, and educational institution.
          </p>
          {report.university && <p><strong>UNIVERSITY:</strong> {report.university}</p>}
          {report.yearOfGraduation && <p><strong>YEAR OF GRADUATION:</strong> {report.yearOfGraduation}</p>}
          <p><strong>DEGREE:</strong> {userInfo.degree || report.degree || 'N/A'}</p>
          {userInfo.specialization && <p><strong>SPECIALIZATION:</strong> {userInfo.specialization}</p>}
        </div>

        {/* Psychometric Test Summary */}
        <div className="report-section">
          <h3>SUMMARY OF PSYCHOMETRIC TEST</h3>
          <p className="section-description">
            This section provides a comprehensive analysis of the candidate's performance across all 
            sections of the psychometric assessment, including aptitude, behavioral, and domain-specific evaluations.
          </p>
          <div className="interview-content">
            {report.interviewSummary ? (
              report.interviewSummary.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))
            ) : (
              <p>No psychometric test summary available.</p>
            )}
          </div>
        </div>

        {/* SWOT Analysis */}
        <div className="report-section swot-section">
          <h3>SWOT Analysis</h3>
          <p className="section-description">
            SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis provides a structured evaluation 
            of the candidate's profile, identifying key areas of excellence, areas for improvement, 
            potential growth opportunities, and external factors that may impact their career trajectory.
          </p>
          <div className="swot-grid">
            <div className="swot-item">
              <h4>Strengths</h4>
              <ul>
                {report.strengths && report.strengths.length > 0 ? (
                  report.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))
                ) : (
                  <li>No strengths identified</li>
                )}
              </ul>
            </div>
            <div className="swot-item">
              <h4>Weaknesses</h4>
              <ul>
                {report.weaknesses && report.weaknesses.length > 0 ? (
                  report.weaknesses.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))
                ) : (
                  <li>No weaknesses identified</li>
                )}
              </ul>
            </div>
            <div className="swot-item">
              <h4>Opportunities</h4>
              <ul>
                {report.opportunities && report.opportunities.length > 0 ? (
                  report.opportunities.map((opportunity, idx) => (
                    <li key={idx}>{opportunity}</li>
                  ))
                ) : (
                  <li>No opportunities identified</li>
                )}
              </ul>
            </div>
            <div className="swot-item">
              <h4>Threats</h4>
              <ul>
                {report.threats && report.threats.length > 0 ? (
                  report.threats.map((threat, idx) => (
                    <li key={idx}>{threat}</li>
                  ))
                ) : (
                  <li>No threats identified</li>
                )}
              </ul>
            </div>
          </div>
          {report.swotAnalysis && (
            <div className="swot-narrative">
              {report.swotAnalysis.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          )}
        </div>

        {/* Fit Analysis with Chart */}
        <div className="report-section fit-section">
          <h3>FIT ANALYSIS</h3>
          <p className="section-description">
            This analysis evaluates how well the candidate's skills, personality traits, and performance 
            align with their chosen career path and the requirements of their field of interest.
          </p>
          <div className="fit-content-wrapper">
            <div className="fit-content">
              {report.fitAnalysis ? (
                report.fitAnalysis.split('\n\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))
              ) : (
                <p>No fit analysis available.</p>
              )}
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'POOR', score: chartData?.poorScore || 30, fill: '#cbd5e1' },
                    { name: 'AVERAGE', score: chartData?.averageScore || 60, fill: '#94a3b8' },
                    { name: 'BEST', score: chartData?.bestScore || 90, fill: '#10b981' },
                    { 
                      name: 'You', 
                      score: chartData?.candidatePosition === 'BEST' ? chartData?.bestScore : (chartData?.candidatePosition === 'AVERAGE' ? chartData?.averageScore : chartData?.poorScore) || 50,
                      fill: '#3b82f6' 
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {
                      [
                        { name: 'POOR', color: '#cbd5e1' },
                        { name: 'AVERAGE', color: '#94a3b8' },
                        { name: 'BEST', color: '#10b981' },
                        { name: 'You', color: '#3b82f6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="candidate-indicator" style={{marginTop: '10px', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
                 <div style={{width: 10, height: 10, borderRadius: '50%', background: '#3b82f6'}}></div>
                 {userInfo.name?.toUpperCase() || 'CANDIDATE'}
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Content */}
        <div className="report-page-break"></div>

        {/* Extended Analysis */}
        <div className="report-section">
          <h3>Extended Analysis</h3>
          <p className="section-description">
            This section provides an in-depth narrative analysis of the candidate's overall profile, 
            synthesizing performance metrics, personality traits, and behavioral patterns into a 
            comprehensive assessment.
          </p>
          {report.narrativeSummary ? (
            <div className="narrative">
              {report.narrativeSummary.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ) : (
            <p>No extended analysis available.</p>
          )}
        </div>

        {/* Behavioral Insights */}
        <div className="report-section">
          <h3>Behavioral Insights</h3>
          <p className="section-description">
            This section analyzes the candidate's behavioral patterns, personality traits, and 
            interpersonal skills based on their responses to behavioral assessment questions.
          </p>
          {report.behavioralInsights ? (
            <div className="narrative">
              {report.behavioralInsights.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ) : (
            <p>No behavioral insights available.</p>
          )}
        </div>

        {/* Domain Insights */}
        <div className="report-section">
          <h3>Domain-Specific Insights</h3>
          <p className="section-description">
            This section provides specialized insights into the candidate's knowledge and performance 
            in their specific domain or field of expertise, based on domain-specific assessment questions.
          </p>
          {report.domainInsights ? (
            <div className="narrative">
              {report.domainInsights.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ) : (
            <p>No domain insights available.</p>
          )}
        </div>

        {/* Big Five Personality Traits */}
        <div className="report-section">
          <h3>Big Five Personality Traits</h3>
          <p className="section-description">
            The Big Five personality model evaluates five core dimensions of personality: Openness to Experience, 
            Conscientiousness, Extraversion, Agreeableness, and Neuroticism, providing insights into the candidate's personality structure and behavioral tendencies.
          </p>
          
          {/* Big Five Chart */}
          <div className="big-five-chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                { subject: 'Openness', A: report.openness || 0, fullMark: 100 },
                { subject: 'Conscientiousness', A: report.conscientiousness || 0, fullMark: 100 },
                { subject: 'Extraversion', A: report.extraversion || 0, fullMark: 100 },
                { subject: 'Agreeableness', A: report.agreeableness || 0, fullMark: 100 },
                { subject: 'Neuroticism', A: report.neuroticism || 0, fullMark: 100 },
              ]}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Trait Descriptions */}
          <div className="big-five-details">
            <div className="trait-detail-item">
              <div className="trait-detail-header">
                <h4>Openness to Experience</h4>
                <span className="trait-score">{report.openness || 0}/100</span>
              </div>
              <p className="trait-description">
                Measures curiosity, creativity, and willingness to try new experiences. 
                {(report.openness || 0) >= 70 ? ' High scorers are imaginative, adventurous, and intellectually curious, embracing new ideas and unconventional approaches.' : 
                 (report.openness || 0) >= 40 ? ' Moderate scorers balance traditional and innovative approaches, showing selective openness to new experiences.' : 
                 ' Lower scorers prefer familiar routines, practical solutions, and conventional approaches to problems.'}
              </p>
            </div>
            <div className="trait-detail-item">
              <div className="trait-detail-header">
                <h4>Conscientiousness</h4>
                <span className="trait-score">{report.conscientiousness || 0}/100</span>
              </div>
              <p className="trait-description">
                Reflects organization, dependability, and goal-directed behavior. 
                {(report.conscientiousness || 0) >= 70 ? ' High scorers are disciplined, thorough, and reliable, excelling at planning and following through on commitments.' : 
                 (report.conscientiousness || 0) >= 40 ? ' Moderate scorers demonstrate reasonable organization and reliability, balancing structure with flexibility.' : 
                 ' Lower scorers tend to be more spontaneous and flexible, sometimes at the expense of organization and planning.'}
              </p>
            </div>
            <div className="trait-detail-item">
              <div className="trait-detail-header">
                <h4>Extraversion</h4>
                <span className="trait-score">{report.extraversion || 0}/100</span>
              </div>
              <p className="trait-description">
                Indicates sociability, assertiveness, and energy from social interactions. 
                {(report.extraversion || 0) >= 70 ? ' High scorers are outgoing, energetic, and thrive in social settings, preferring teamwork and external stimulation.' : 
                 (report.extraversion || 0) >= 40 ? ' Moderate scorers (ambiverts) adapt well to both social and solitary situations, balancing interaction with reflection.' : 
                 ' Lower scorers (introverts) prefer quieter, more solitary activities and may excel in independent work requiring deep focus.'}
              </p>
            </div>
            <div className="trait-detail-item">
              <div className="trait-detail-header">
                <h4>Agreeableness</h4>
                <span className="trait-score">{report.agreeableness || 0}/100</span>
              </div>
              <p className="trait-description">
                Evaluates cooperation, compassion, and interpersonal harmony. 
                {(report.agreeableness || 0) >= 70 ? ' High scorers are empathetic, cooperative, and prioritize maintaining positive relationships and team harmony.' : 
                 (report.agreeableness || 0) >= 40 ? ' Moderate scorers balance cooperation with assertiveness, showing both empathy and the ability to challenge when necessary.' : 
                 ' Lower scorers tend to be more competitive and direct, prioritizing objectivity and results over interpersonal harmony.'}
              </p>
            </div>
            <div className="trait-detail-item">
              <div className="trait-detail-header">
                <h4>Neuroticism (Emotional Stability)</h4>
                <span className="trait-score">{report.neuroticism || 0}/100</span>
              </div>
              <p className="trait-description">
                Measures emotional stability and stress resilience. 
                {(report.neuroticism || 0) >= 70 ? ' High scorers may experience more frequent emotional fluctuations and stress sensitivity, which can drive careful risk assessment.' : 
                 (report.neuroticism || 0) >= 40 ? ' Moderate scorers show balanced emotional responses, with good stress management in most situations.' : 
                 ' Lower scorers demonstrate strong emotional stability, remaining calm and composed under pressure with excellent stress resilience.'}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="report-section">
          <h3>Performance Summary</h3>
          <p className="section-description">
            This section provides a quantitative overview of the candidate's performance across different 
            assessment sections, including aptitude, behavioral, and domain-specific scores, along with 
            the overall performance metric.
          </p>
          
          {/* Performance Chart */}
          <div className="performance-chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={[
                  { name: 'Aptitude', score: report.aptitudeScore || 0, fill: '#3b82f6' },
                  { name: 'Behavioral', score: report.behavioralScore || 0, fill: '#8b5cf6' },
                  { name: 'Domain', score: report.domainScore || 0, fill: '#f59e0b' },
                  { name: 'Overall', score: report.overallScore || 0, fill: '#10b981' },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                   formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={40}>
                  {
                    [
                      { name: 'Aptitude', color: '#3b82f6' },
                      { name: 'Behavioral', color: '#8b5cf6' },
                      { name: 'Domain', color: '#f59e0b' },
                      { name: 'Overall', color: '#10b981' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Details */}
          <div className="performance-details">
            <div className="performance-detail-item">
              <div className="performance-detail-header">
                <h4>Aptitude Score</h4>
                <span className="performance-score">{report.aptitudeScore?.toFixed(1) || '0.0'}%</span>
              </div>
              <p className="performance-description">
                Measures cognitive abilities, problem-solving skills, and analytical thinking. This score reflects 
                the candidate's capacity to understand complex concepts, apply logical reasoning, and solve 
                quantitative and qualitative problems efficiently.
              </p>
            </div>
            <div className="performance-detail-item">
              <div className="performance-detail-header">
                <h4>Behavioral Score</h4>
                <span className="performance-score">{report.behavioralScore?.toFixed(1) || '0.0'}%</span>
              </div>
              <p className="performance-description">
                Evaluates interpersonal skills, emotional intelligence, and situational judgment. This score 
                indicates how well the candidate handles workplace scenarios, demonstrates leadership, manages 
                conflicts, and adapts to changing situations.
              </p>
            </div>
            <div className="performance-detail-item">
              <div className="performance-detail-header">
                <h4>Domain Score</h4>
                <span className="performance-score">{report.domainScore?.toFixed(1) || '0.0'}%</span>
              </div>
              <p className="performance-description">
                Assesses specialized knowledge and technical proficiency in the candidate's field of expertise. 
                This score demonstrates the depth of understanding in domain-specific concepts, tools, and 
                best practices relevant to their career path.
              </p>
            </div>
            <div className="performance-detail-item overall-detail">
              <div className="performance-detail-header">
                <h4>Overall Score</h4>
                <span className="performance-score overall-score-highlight">{report.overallScore?.toFixed(1) || '0.0'}%</span>
              </div>
              <p className="performance-description">
                Represents the comprehensive evaluation combining all assessment components. This composite score 
                provides a holistic measure of the candidate's readiness and suitability for their chosen career 
                path, taking into account cognitive abilities, behavioral competencies, and domain expertise.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Enhance Profile Modal */}
      {showEnhanceModal && (
        <div className="enhance-modal-overlay" onClick={closeEnhanceModal}>
          <div className="enhance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="enhance-modal-header">
              <h2>Enhance Profile with Report Data</h2>
              <button className="enhance-modal-close" onClick={closeEnhanceModal}>×</button>
            </div>

            <div className="enhance-modal-content">
              <p className="enhance-modal-description">
                Select a saved profile or upload a profile to preview and enhance it with insights from this psychometric report.
              </p>

              {/* Upload Profile Section */}
              <div className="enhance-section">
                <h3>Upload Profile</h3>
                <div className="upload-profile-area">
                  <input
                    type="file"
                    accept=".json,.pdf"
                    onChange={handleProfileUpload}
                    id="profile-upload"
                    className="profile-upload-input"
                  />
                  <label htmlFor="profile-upload" className="profile-upload-label">
                    <span>Choose a profile file (.json or .pdf)</span>
                  </label>
                </div>
              </div>

              <div className="enhance-divider">OR</div>

              {/* Saved Profiles Section */}
              <div className="enhance-section">
                <h3>Use Saved Profile</h3>
                {savedProfiles.length > 0 ? (
                  <div className="saved-profiles-list">
                    {savedProfiles.map((profileResponse, index) => {
                      const profile = profileResponse.profile || profileResponse
                      const isSelected = selectedProfile && (selectedProfile.profile?.id || selectedProfile.id) === profile.id
                      return (
                        <div
                          key={profile.id || index}
                          className={`profile-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleProfileSelect(profileResponse)}
                        >
                          <div className="profile-item-info">
                            <div className="profile-item-name">{profile.name || 'Unnamed Profile'}</div>
                            <div className="profile-item-details">
                              {profile.currentDegree || profile.degree || 'No education info'} 
                              {profile.institute && ` • ${profile.institute}`}
                            </div>
                          </div>
                          {isSelected && <span className="profile-item-check">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="no-profiles-message">No saved profiles found. Please upload a profile or create one first.</p>
                )}
              </div>

              {/* Show Enhance Button when saved profile is selected */}
              {selectedProfile && (
                <div className="enhance-selected-profile">
                  <button 
                    onClick={handleEnhanceSavedProfile} 
                    className="btn-enhance-selected"
                    disabled={isEnhancing}
                  >
                    {isEnhancing ? 'Enhancing Profile...' : '✨ Enhance Selected Profile with Report'}
                  </button>
                </div>
              )}

              <div className="enhance-modal-actions">
                <button className="btn-cancel" onClick={closeEnhanceModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isEnhancing}
        message="Enhancing Profile..."
        subMessage="We're enhancing your profile with psychometric insights. This may take a few moments."
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Profile Enhanced Successfully!"
        message="Your profile has been enhanced with psychometric insights and refined through dual AI processing. Click below to view your enhanced profile."
        buttonText="View Enhanced Profile"
        onButtonClick={handleSuccessModalClose}
      />
    </div>
  )
}

export default PsychometricReport

