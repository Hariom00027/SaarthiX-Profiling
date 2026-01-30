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

  const colors = ['#4A90D9', '#E85D75', '#F5A623', '#7B68EE', '#50C878'];

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
    <div className="flex items-center gap-8">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
          {segments.map((segment, index) => (
            <path
              key={segment.key}
              d={segment.path}
              fill={segment.color}
              stroke="#fff"
              strokeWidth="3"
              className="transition-all duration-300 hover:opacity-80"
            />
          ))}
          <circle cx={centerX} cy={centerY} r={radius * 0.55} fill="white" className="drop-shadow" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-medium">Total in Score</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{totalScore}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-3 group cursor-default">
            <div
              className="w-4 h-4 rounded-full shadow-md transition-transform group-hover:scale-110"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-800 capitalize font-semibold min-w-[80px]">{segment.key}</span>
            <span className="text-sm text-gray-600 font-bold">{segment.percentage}%</span>
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

// Bullet Icon Component
const BulletIcon = ({ color = 'blue' }) => (
  <span className={`w-2 h-2 rounded-full bg-${color}-500 flex-shrink-0`} />
);

const ReportPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportData, answers, userProfile, profileData } = location.state || {};
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
        window.location.href = '/profiling/psychometric/start';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md text-center border border-gray-200 report-card-enter">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No Report Data</h2>
          <p className="text-gray-600 mb-8 text-lg">Please complete the chatbot assessment first to generate your personalized report.</p>
          <button
            onClick={() => navigate('/chatbot', { state: { userProfile, profileData } })}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Go to Chatbot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/chatbot', { state: { userProfile, profileData } })}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Chatbot
          </button>

          <button
            onClick={handleEnhanceProfile}
            disabled={isRegenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {isRegenerating ? 'Enhancing...' : 'Enhance Profile'}
          </button>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Interest Evaluation Report</h1>
          <p className="text-gray-600 text-base">Analysis based on your recent interactions and assessments</p>
        </div>

        <div ref={evaluationResultsRef}>
          {/* Interest Scores & Interest Persona */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Interest Scores Card */}
            {reportData.interests && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover-lift report-stagger-1">
                <h3 className="text-base font-bold text-gray-900 mb-6">Interest Scores</h3>
                <DonutChart data={reportData.interests} totalScore={totalInterestScore} />
              </div>
            )}

            {/* Interest Persona Card */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover-lift report-stagger-2">
              {reportData.interestPersona && (
                <div className="mb-4">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-5 mb-4 border border-amber-200">
                    <h3 className="text-base font-bold text-orange-800 mb-3">Your Interest Persona</h3>
                    <p className="text-sm text-gray-800 leading-relaxed">{reportData.interestPersona}</p>
                  </div>
                </div>
              )}
              {reportData.summary && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{reportData.summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invalid Answer Warning */}
          {reportData.invalidAnswers && Object.keys(reportData.invalidAnswers).length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-3xl p-6 mb-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <WarningIcon />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-amber-800 mb-2">Incomplete Answers Detected</h3>
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    Some responses looked very short or like placeholders. We generated this report, but revisiting those answers will help Saathi give more accurate guidance.
                  </p>
                  <ul className="space-y-2">
                    {Object.entries(reportData.invalidAnswers).map(([question, answer]) => (
                      <li key={question} className="text-sm text-gray-800 flex items-start gap-2">
                        <span className="text-yellow-600 mt-1 font-bold">•</span>
                        <span><span className="font-semibold">{question}</span>: {answer || 'No additional text provided'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Strengths & Areas to Improve */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 mb-6 hover-lift report-stagger-3">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Strengths */}
              {reportData.strengths && reportData.strengths.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Strengths
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 space-y-3 border border-green-200">
                    {reportData.strengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-gray-800 leading-relaxed">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas to Improve */}
              {reportData.weaknesses && reportData.weaknesses.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Areas to Improve
                  </h3>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 space-y-3 border border-red-200">
                    {reportData.weaknesses.map((weakness, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <XIcon />
                        <span className="text-sm text-gray-800 leading-relaxed">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Do's & Don'ts */}
            {(reportData.dos?.length > 0 || reportData.donts?.length > 0) && (
              <div className="grid md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-200">
                {/* Do's */}
                {reportData.dos && reportData.dos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-green-700 mb-4">Do's</h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 space-y-3 border border-green-200">
                      {reportData.dos.map((doItem, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckIcon />
                          <span className="text-sm text-gray-800 leading-relaxed">{doItem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Don'ts */}
                {reportData.donts && reportData.donts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-red-700 mb-4">Don'ts</h3>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 space-y-3 border border-red-200">
                      {reportData.donts.map((dont, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <XIcon />
                          <span className="text-sm text-gray-800 leading-relaxed">{dont}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 90-Day Roadmap */}
          {reportData.roadmap90Days && (
            <div className="mb-6 bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover-lift report-card-enter">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                90-Day <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Roadmap</span>
              </h2>

              <div className="relative">
                {/* Timeline Steps */}
                <div className="space-y-6">
                  {roadmapMonths && roadmapMonths.map((month, index) => (
                    <div key={index} className={`flex items-start gap-5 ${index === 0 ? '' : index === 1 ? 'ml-16' : 'ml-32'} transition-all duration-300`}>
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-lg ${index === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                          index === 1 ? 'bg-gradient-to-br from-yellow-500 to-amber-500' :
                            'bg-gradient-to-br from-green-500 to-emerald-600'
                        }`}>
                        0{index + 1}
                      </div>
                      <div className={`rounded-2xl p-5 flex-1 max-w-md shadow-md border-2 ${index === 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                          index === 1 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
                            'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                        }`}>
                        <h4 className="text-base font-bold text-gray-900 mb-2">{month.title}</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{month.description || 'Focus on building strong foundations and skills.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recommended Roles */}
          {reportData.recommendedRoles && reportData.recommendedRoles.length > 0 && (
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 mb-6 shadow-xl hover-lift report-card-enter">
              <h3 className="text-2xl font-bold text-white text-center mb-6">
                Recommended <span className="text-yellow-300">Roles</span>
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {reportData.recommendedRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/20 transition-all cursor-default shadow-lg"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Courses & Project Ideas */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Suggested Courses */}
            {reportData.suggestedCourses && reportData.suggestedCourses.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover-lift report-stagger-1">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  Suggested Courses
                </h3>
                <ul className="space-y-3">
                  {reportData.suggestedCourses.map((course, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 p-3 rounded-xl hover:bg-blue-50 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{course}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Project Ideas */}
            {reportData.projectIdeas && reportData.projectIdeas.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover-lift report-stagger-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Project Ideas
                </h3>
                <ul className="space-y-3">
                  {reportData.projectIdeas.map((idea, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 p-3 rounded-xl hover:bg-orange-50 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pb-4">
            <button
              type="button"
              onClick={handleTakePsychometricTest}
              className="flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-8 py-3.5 rounded-xl text-base font-bold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Take SuppleMontUs Test
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl text-base font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
