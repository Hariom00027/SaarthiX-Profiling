import React, { useRef, useState, useEffect } from 'react';
import { downloadProfileAsPDF } from '../utils/downloadProfile';
import { notifyError, notifySuccess } from '../utils/notifications';

const ReportView = ({ profileData, onEnhanceProfile }) => {
  const evaluationResultsRef = useRef(null);
  const [reportData, setReportData] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    // Load report data from sessionStorage
    try {
      const stored = sessionStorage.getItem('chatbot_report_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        setReportData(parsed.reportData);
        setAnswers(parsed.answers);
      }
    } catch (e) {
      console.error('Failed to load report data:', e);
    }
  }, []);

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
      const result = await onEnhanceProfile(answers, reportData);
      if (result && result.success) {
        notifySuccess('Profile enhanced successfully!');
      } else {
        notifyError(result?.error || 'Failed to enhance profile');
      }
    } catch (error) {
      console.error('Error enhancing profile:', error);
      notifyError('Failed to enhance profile. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTakePsychometricTest = async () => {
    const userProfile = profileData?.profile || profileData;
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

  if (!reportData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Report Data</h2>
        <p className="text-gray-600">Please complete the chatbot assessment first.</p>
      </div>
    );
  }

  return (
    <div ref={evaluationResultsRef} className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Your Interest Evaluation Report</h2>
      
      {/* Interest Scores */}
      {reportData.interests && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-gray-700">Interest Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(reportData.interests).map(([key, value]) => (
              <div key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 capitalize font-medium">{key}</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{value.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interest Persona */}
      {reportData.interestPersona && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-gray-700">Your Interest Persona</h3>
          <p className="text-gray-700 bg-blue-50 p-6 rounded-lg leading-relaxed">{reportData.interestPersona}</p>
        </div>
      )}

      {/* Summary */}
      {reportData.summary && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-gray-700">Summary</h3>
          <p className="text-gray-700 leading-relaxed">{reportData.summary}</p>
        </div>
      )}

      {/* Invalid Answer Warning */}
      {reportData.invalidAnswers && Object.keys(reportData.invalidAnswers).length > 0 && (
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-yellow-800 mb-3">Incomplete Answers Detected</h3>
          <p className="text-sm text-yellow-800 mb-3">
            Some responses looked very short or like placeholders. We generated this report, but revisiting those answers will help Saathi give more accurate guidance.
          </p>
          <ul className="list-disc list-inside space-y-2 text-yellow-900 text-sm">
            {Object.entries(reportData.invalidAnswers).map(([question, answer]) => (
              <li key={question}>
                <span className="font-semibold">{question}</span>: {answer || 'No additional text provided'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {reportData.strengths && reportData.strengths.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-green-700">Strengths</h3>
            <ul className="list-disc list-inside space-y-2 bg-green-50 p-6 rounded-lg">
              {reportData.strengths.map((strength, idx) => (
                <li key={idx} className="text-gray-700">{strength}</li>
              ))}
            </ul>
          </div>
        )}
        {reportData.weaknesses && reportData.weaknesses.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-orange-700">Areas to Improve</h3>
            <ul className="list-disc list-inside space-y-2 bg-orange-50 p-6 rounded-lg">
              {reportData.weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-gray-700">{weakness}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Dos & Don'ts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {reportData.dos && reportData.dos.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-green-700">Do's</h3>
            <ul className="list-disc list-inside space-y-2 bg-green-50 p-6 rounded-lg">
              {reportData.dos.map((doItem, idx) => (
                <li key={idx} className="text-gray-700">{doItem}</li>
              ))}
            </ul>
          </div>
        )}
        {reportData.donts && reportData.donts.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-red-700">Don'ts</h3>
            <ul className="list-disc list-inside space-y-2 bg-red-50 p-6 rounded-lg">
              {reportData.donts.map((dont, idx) => (
                <li key={idx} className="text-gray-700">{dont}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended Roles */}
      {reportData.recommendedRoles && reportData.recommendedRoles.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-gray-700">Recommended Roles</h3>
          <div className="flex flex-wrap gap-3">
            {reportData.recommendedRoles.map((role, idx) => (
              <span key={idx} className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Roadmap */}
      {reportData.roadmap90Days && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-gray-700">90-Day Roadmap</h3>
          <p className="text-gray-700 bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-lg leading-relaxed">{reportData.roadmap90Days}</p>
        </div>
      )}

      {/* Suggested Courses */}
      {reportData.suggestedCourses && reportData.suggestedCourses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-gray-700">Suggested Courses</h3>
          <ul className="list-disc list-inside space-y-2 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
            {reportData.suggestedCourses.map((course, idx) => (
              <li key={idx} className="text-gray-700">{course}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Project Ideas */}
      {reportData.projectIdeas && reportData.projectIdeas.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-gray-700">Project Ideas</h3>
          <ul className="list-disc list-inside space-y-2 bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg">
            {reportData.projectIdeas.map((idea, idx) => (
              <li key={idx} className="text-gray-700">{idea}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            📥 Download Report (PDF)
          </button>
          <button
            type="button"
            onClick={handleEnhanceProfile}
            disabled={isRegenerating}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isRegenerating ? 'Enhancing...' : '✨ Enhance Profile with Report'}
          </button>
          <button
            type="button"
            onClick={handleTakePsychometricTest}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            📝 Take Psychometric Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportView;





