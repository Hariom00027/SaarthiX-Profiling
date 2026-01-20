import React from 'react';
import Dashboard from './Dashboard';

const StartButton = ({ onStart, onViewSaved, onNavigateToStart, onPsychometricTest, onViewSavedReports }) => {
  const handleStartProfiling = () => {
    if (onStart) {
      onStart();
    }
  };

  return (
    <Dashboard 
      onStartProfiling={handleStartProfiling} 
      onViewSaved={onViewSaved}
      onPsychometricTest={onPsychometricTest}
      onViewSavedReports={onViewSavedReports}
    />
  );
};

export default StartButton;

