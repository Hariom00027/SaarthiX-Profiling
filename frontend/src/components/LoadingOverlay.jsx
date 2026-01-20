import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ 
  isVisible, 
  message = 'Processing...', 
  subMessage = 'Please wait while we complete your request.' 
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <h3 className="loading-message">{message}</h3>
        <p className="loading-submessage">{subMessage}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;




