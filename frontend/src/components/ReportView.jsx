import React, { useState, useEffect } from 'react';
import ReportPage from '../pages/ReportPage';
import '../pages/ReportPage.css';

/**
 * ReportView loads report data from sessionStorage and renders the report UI (ReportPage).
 * App uses this when currentView === 'report'. ReportPage contains the full design and logic.
 */
function getStoredReportData() {
  try {
    const stored = sessionStorage.getItem('chatbot_report_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { reportData: parsed.reportData || null, answers: parsed.answers || null };
    }
  } catch (e) {
    console.error('Failed to load report data:', e);
  }
  return { reportData: null, answers: null };
}

const ReportView = ({ profileData, onEnhanceProfile, onBack }) => {
  const [state, setState] = useState(() => getStoredReportData());
  const reportData = state.reportData;
  const answers = state.answers;

  useEffect(() => {
    setState(getStoredReportData());
  }, []);

  if (!reportData) {
    return (
      <div className="report-page">
        <div className="report-container" style={{ maxWidth: '28rem', margin: '4rem auto', textAlign: 'center' }}>
          <div className="report-card report-card-enter">
            <h2 className="report-title" style={{ marginBottom: '1rem' }}>No Report Data</h2>
            <p className="report-subtitle" style={{ marginBottom: '2rem', fontSize: '1rem' }}>
              Please complete the chatbot assessment first to generate your personalized report.
            </p>
            {onBack && (
              <button type="button" onClick={onBack} className="report-btn-primary">
                Go to Chatbot
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReportPage
      reportData={reportData}
      answers={answers}
      profileData={profileData}
      userProfile={profileData?.profile || profileData}
      onEnhanceProfile={onEnhanceProfile}
      onBack={onBack}
    />
  );
};

export default ReportView;
