import React, { useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { downloadProfileAsPDF } from '../utils/downloadProfile';
import { notifyError, notifySuccess } from '../utils/notifications';
import { regenerateProfile } from '../api';
import './ReportPage.css';

// Donut Chart Component
const DonutChart = ({ data, totalScore }) => {
  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  const colors = ['#B192FD', '#FDB142', '#8CFDB1', '#92CAF8', '#4285F4'];
  
  const segments = useMemo(() => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    let currentAngle = -90;
    
    return Object.entries(data).map(([key, value], index) => {
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = ((startAngle + angle) * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      return {
        key,
        value,
        percentage: percentage.toFixed(1),
        color: colors[index % colors.length],
        path: pathD
      };
    });
  }, [data]);

  return (
    <div className="report-donut-wrap">
      <div className="report-donut-chart">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="report-donut-svg">
          {segments.map((segment) => (
            <path
              key={segment.key}
              d={segment.path}
              fill={segment.color}
              stroke="#fff"
              strokeWidth="3"
              className="report-donut-segment"
            />
          ))}
          <circle cx={centerX} cy={centerY} r={radius * 0.55} fill="white" className="report-donut-hole" />
        </svg>
      </div>
      <div className="report-donut-legend">
        {segments.map((segment) => (
          <div key={segment.key} className="report-donut-legend-item">
            <span className="report-donut-legend-dot" style={{ backgroundColor: segment.color }} />
            <span className="report-donut-legend-label">{segment.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Check Icon Component
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// X Icon Component
const XIcon = () => (
  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

// Warning Icon Component
const WarningIcon = () => (
  <svg className="w-8 h-8 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ReportPage = (props = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateFromLocation = location.state || {};
  const reportData = props.reportData ?? stateFromLocation.reportData;
  const answers = props.answers ?? stateFromLocation.answers;
  const userProfile = props.userProfile ?? stateFromLocation.userProfile;
  const profileData = props.profileData ?? stateFromLocation.profileData;
  const onEnhanceProfile = props.onEnhanceProfile;
  const onBack = props.onBack;

  const evaluationResultsRef = useRef(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleDownloadReport = async () => {
    if (!reportData || !evaluationResultsRef.current) {
      notifyError('Report data is not available.');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `Saathi_Report_${timestamp}.pdf`;
      
      await downloadProfileAsPDF(evaluationResultsRef.current, {
        fileName,
        orientation: 'p'
      });
      notifySuccess('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifyError('Failed to generate PDF report. Please try again.');
    }
  };

  const handleEnhanceProfile = async () => {
    if (!answers || Object.keys(answers).length === 0) {
      notifyError('Please complete the chatbot first.');
      return;
    }

    setIsRegenerating(true);
    try {
      if (onEnhanceProfile) {
        const result = await onEnhanceProfile(answers, reportData);
        if (result?.success) {
          notifySuccess('Profile enhanced successfully!');
        } else {
          notifyError(result?.error || 'Failed to enhance profile');
        }
        return;
      }

      const templateType = profileData?.profile?.templateType || profileData?.templateType || 'professional';
      const profile = profileData?.profile || profileData || {};

      const payload = {
        templateId: templateType,
        formData: profile,
        chatAnswers: answers,
        reportData: reportData || {}
      };

      const result = await regenerateProfile(payload);
      
      if (result.success && result.data) {
        notifySuccess('Profile enhanced successfully!');
        navigate('/enhance', {
          state: {
            profileData: result.data,
            fromReport: true
          }
        });
      } else {
        notifyError(result.error || 'Failed to enhance profile');
      }
    } catch (error) {
      console.error('Error enhancing profile:', error);
      notifyError('Failed to enhance profile. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTakePsychometricTest = async () => {
    if (!userProfile) {
      notifyError('Profile data is not available.');
      return;
    }

    try {
      const calculateAge = (dob) => {
        if (!dob) return 25;
        try {
          const birthDate = new Date(dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age > 0 ? age : 25;
        } catch (e) {
          return 25;
        }
      };

      const mapDegree = (profileDegree) => {
        if (!profileDegree) return 'B.Tech';
        const degreeLower = profileDegree.toLowerCase();
        if (degreeLower.includes('b.tech') || degreeLower.includes('btech') || degreeLower.includes('bachelor of technology')) {
          return 'B.Tech';
        }
        if (degreeLower.includes('bba') || degreeLower.includes('bachelor of business')) {
          return 'BBA';
        }
        if (degreeLower.includes('b.com') || degreeLower.includes('bcom') || degreeLower.includes('bachelor of commerce')) {
          return 'B.Com';
        }
        if (degreeLower.includes('mba') || degreeLower.includes('master of business')) {
          return 'MBA';
        }
        return 'Other';
      };

      const psychometricData = {
        name: userProfile.name || 'User',
        email: userProfile.email || 'user@example.com',
        phone: userProfile.phone || '0000000000',
        age: calculateAge(userProfile.dob),
        degree: mapDegree(userProfile.currentDegree || userProfile.degree),
        specialization: userProfile.branch || userProfile.specialization || 'General',
        careerInterest: userProfile.interests || userProfile.goals || 'Career Development',
        certifications: userProfile.certifications || 'None',
        achievements: userProfile.achievements || 'None',
        technicalSkills: userProfile.technicalSkills || 'General Skills',
        softSkills: userProfile.softSkills || 'Communication, Teamwork',
        interests: userProfile.interests || userProfile.goals || 'Learning and Development',
        hobbies: userProfile.hobbies || 'Reading, Learning',
      };

      sessionStorage.setItem('psychometric_from_profile', 'true');
      sessionStorage.setItem('psychometric_profile_data', JSON.stringify(psychometricData));
      
      notifySuccess('Preparing your psychometric test...');
      
      setTimeout(() => {
        window.location.href = '/psychometric/start';
      }, 500);
    } catch (error) {
      console.error('Error preparing psychometric test:', error);
      sessionStorage.removeItem('psychometric_from_profile');
      sessionStorage.removeItem('psychometric_profile_data');
      notifyError(error.message || 'Failed to prepare psychometric test.');
    }
  };

  // Calculate total interest score
  const totalInterestScore = useMemo(() => {
    if (!reportData?.interests) return 100;
    return Math.round(Object.values(reportData.interests).reduce((sum, val) => sum + val, 0));
  }, [reportData?.interests]);

  // Parse roadmap into months if it's a string
  const roadmapMonths = useMemo(() => {
    if (!reportData?.roadmap90Days) return null;
    
    // If it's already structured, use it
    if (typeof reportData.roadmap90Days === 'object' && reportData.roadmap90Days.months) {
      return reportData.roadmap90Days.months;
    }
    
    // Try to parse from string
    const roadmapText = String(reportData.roadmap90Days);
    const months = [
      { title: 'Month 1: Foundation', description: '' },
      { title: 'Month 2: Application', description: '' },
      { title: 'Month 3: Refinement', description: '' }
    ];
    
    // Try to extract month information from the text
    const month1Match = roadmapText.match(/month\s*1[:\s]*(.*?)(?=month\s*2|$)/i);
    const month2Match = roadmapText.match(/month\s*2[:\s]*(.*?)(?=month\s*3|$)/i);
    const month3Match = roadmapText.match(/month\s*3[:\s]*(.*?)$/i);
    
    if (month1Match) months[0].description = month1Match[1].trim().substring(0, 150);
    if (month2Match) months[1].description = month2Match[1].trim().substring(0, 150);
    if (month3Match) months[2].description = month3Match[1].trim().substring(0, 150);
    
    // If no months found, split text into thirds
    if (!month1Match && !month2Match && !month3Match) {
      const textLength = roadmapText.length;
      const third = Math.floor(textLength / 3);
      months[0].description = roadmapText.substring(0, third).trim().substring(0, 150);
      months[1].description = roadmapText.substring(third, third * 2).trim().substring(0, 150);
      months[2].description = roadmapText.substring(third * 2).trim().substring(0, 150);
    }
    
    return months;
  }, [reportData?.roadmap90Days]);

  if (!reportData) {
    return (
      <div className="report-page">
        <div className="report-container" style={{ maxWidth: '28rem', margin: '4rem auto', textAlign: 'center' }}>
          <div className="report-card report-card-enter">
            <div style={{ marginBottom: '1.5rem' }}>
              <svg className="w-20 h-20 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="report-title" style={{ marginBottom: '1rem' }}>No Report Data</h2>
            <p className="report-subtitle" style={{ marginBottom: '2rem', fontSize: '1rem' }}>Please complete the chatbot assessment first to generate your personalized report.</p>
            <button
              type="button"
              onClick={onBack ? () => onBack() : () => navigate('/chatbot', { state: { userProfile, profileData } })}
              className="report-btn-primary"
            >
              Go to Chatbot
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-container">
        {/* Header: back link (left), title + subtitle (left/center), Enhance Profile (right) */}
        <header className="report-header">
          <button
            type="button"
            onClick={onBack ? () => onBack() : () => navigate('/chatbot', { state: { userProfile, profileData } })}
            className="report-back-link"
          >
            <span className="report-back-arrow">←</span> Back to Chatbot
          </button>
          <div className="report-header-title-block">
            <h1 className="report-title">Your Interest Evaluation Report</h1>
            <p className="report-subtitle">Analysis based on your recent interactions and assessments</p>
          </div>
          <button
            type="button"
            onClick={handleEnhanceProfile}
            disabled={isRegenerating}
            className="report-enhance-btn"
          >
            <span className="report-enhance-icon">✨</span> {isRegenerating ? 'Enhancing...' : 'Enhance Profile'}
          </button>
        </header>

        <div ref={evaluationResultsRef} className="report-content">
          {/* Top: Interest Scores (left) | Interest Persona + Summary (right) */}
          <section className="report-top-cards">
            {reportData.interests && (
              <div className="report-card report-card-interest-scores report-stagger-1">
                <h2 className="report-card-heading">Interest Scores</h2>
                <DonutChart data={reportData.interests} totalScore={totalInterestScore} />
                <p className="report-total-score">Total Interest Score: {totalInterestScore}</p>
              </div>
            )}
            <div className="report-card report-card-persona report-stagger-2">
              {reportData.interestPersona && (
                <div className="report-persona-block">
                  <h2 className="report-card-heading">Your Interest Persona</h2>
                  <p className="report-card-text">{reportData.interestPersona}</p>
                </div>
              )}
              {reportData.summary && (
                <div className="report-summary-block">
                  <h2 className="report-card-heading">Summary</h2>
                  <p className="report-card-text report-card-text-muted">{reportData.summary}</p>
                </div>
              )}
            </div>
          </section>

          {/* Incomplete Answers: yellow alert */}
          {reportData.invalidAnswers && Object.keys(reportData.invalidAnswers).length > 0 && (
            <div className="report-incomplete-alert">
              <div className="report-incomplete-icon-wrap">
                <WarningIcon />
              </div>
              <div className="report-incomplete-body">
                <h3 className="report-incomplete-title">Incomplete Answers Detected</h3>
                <p className="report-incomplete-desc">
                  Some responses looked very short or like placeholders. We generated this report, but revisiting those answers will help Saathi give more accurate guidance.
                </p>
                <ul className="report-incomplete-list">
                  {Object.entries(reportData.invalidAnswers).map(([question, answer]) => (
                    <li key={question} className="report-incomplete-item">
                      <span className="report-incomplete-bullet" />
                      <span><span className="report-incomplete-q">{question}</span>: {answer || 'No additional text provided'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Strengths + Do's (left) | Areas to Improve + Don'ts (right) */}
          <section className="report-strengths-section">
            <div className="report-strengths-grid">
              <div className="report-card report-card-strengths report-stagger-3">
                {reportData.strengths && reportData.strengths.length > 0 && (
                  <div className="report-strength-block">
                    <h3 className="report-strength-heading report-strength-heading-green">Strengths</h3>
                    <ul className="report-list-green">
                      {reportData.strengths.map((strength, idx) => (
                        <li key={idx} className="report-list-item-green">
                          <CheckIcon />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {reportData.dos && reportData.dos.length > 0 && (
                  <div className="report-strength-block">
                    <h3 className="report-strength-heading report-strength-heading-green">Do&apos;s</h3>
                    <ul className="report-list-green">
                      {reportData.dos.map((doItem, idx) => (
                        <li key={idx} className="report-list-item-green">
                          <CheckIcon />
                          <span>{doItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="report-card report-card-weaknesses report-stagger-3">
                {reportData.weaknesses && reportData.weaknesses.length > 0 && (
                  <div className="report-weakness-block">
                    <h3 className="report-weakness-heading">Areas to Improve</h3>
                    <ul className="report-list-red">
                      {reportData.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="report-list-item-red">
                          <XIcon />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {reportData.donts && reportData.donts.length > 0 && (
                  <div className="report-weakness-block">
                    <h3 className="report-weakness-heading">Don&apos;ts</h3>
                    <ul className="report-list-red">
                      {reportData.donts.map((dont, idx) => (
                        <li key={idx} className="report-list-item-red">
                          <XIcon />
                          <span>{dont}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 90-Day Roadmap: timeline + month cards */}
          {reportData.roadmap90Days && (
            <section className="report-roadmap report-card-enter">
              <h2 className="report-roadmap-title">90-Day Roadmap</h2>
              <div className="report-roadmap-timeline">
                {roadmapMonths && roadmapMonths.map((month, index) => (
                  <React.Fragment key={index}>
                    <div className="report-roadmap-step">
                      <div className="report-roadmap-number">{String(index + 1).padStart(2, '0')}</div>
                    </div>
                    {index < roadmapMonths.length - 1 && <div className="report-roadmap-connector" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="report-roadmap-cards">
                {roadmapMonths && roadmapMonths.map((month, index) => (
                  <div key={index} className="report-roadmap-card">
                    <h4 className="report-roadmap-card-title">{month.title || `Month ${index + 1}: ${index === 0 ? 'Foundation' : index === 1 ? 'Application' : 'Refinement'}`}</h4>
                    <p className="report-roadmap-card-desc">{month.description || 'Focus on building strong foundations and skills.'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Roles: dark blue section */}
          {reportData.recommendedRoles && reportData.recommendedRoles.length > 0 && (
            <section className="report-roles-section report-card-enter">
              <h3 className="report-roles-title">Recommended Roles</h3>
              <div className="report-roles-tags">
                {reportData.recommendedRoles.map((role, idx) => (
                  <span key={idx} className="report-role-tag">{role}</span>
                ))}
              </div>
            </section>
          )}

          {/* Suggested Courses | Project Ideas */}
          <section className="report-courses-section">
            {reportData.suggestedCourses && reportData.suggestedCourses.length > 0 && (
              <div className="report-card report-card-courses report-stagger-1">
                <h2 className="report-card-heading">Suggested Courses</h2>
                <ul className="report-list-bullet-blue">
                  {reportData.suggestedCourses.map((course, idx) => (
                    <li key={idx} className="report-bullet-item"><span className="report-bullet-dot" />{course}</li>
                  ))}
                </ul>
              </div>
            )}
            {reportData.projectIdeas && reportData.projectIdeas.length > 0 && (
              <div className="report-card report-card-projects report-stagger-2">
                <h2 className="report-card-heading">Project Ideas</h2>
                <ul className="report-list-bullet-blue">
                  {reportData.projectIdeas.map((idea, idx) => (
                    <li key={idx} className="report-bullet-item"><span className="report-bullet-dot" />{idea}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Footer buttons */}
          <div className="report-footer-buttons">
            <button
              type="button"
              onClick={handleTakePsychometricTest}
              className="report-btn-outline"
            >
              <svg className="report-btn-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Take Psychometric Test
            </button>
            <button type="button" onClick={handleDownloadReport} className="report-btn-primary">
              <svg className="report-btn-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
