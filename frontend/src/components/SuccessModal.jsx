import React, { useEffect } from 'react';
import './SuccessModal.css';

const SuccessModal = ({ 
  isOpen, 
  onClose, 
  title = 'Success!', 
  message = 'Operation completed successfully', 
  buttonText = 'Continue',
  onButtonClick,
  autoCloseDelay = null 
}) => {
  useEffect(() => {
    if (isOpen && autoCloseDelay) {
      const timer = setTimeout(() => {
        if (onButtonClick) {
          onButtonClick();
        } else {
          onClose();
        }
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onButtonClick, onClose]);

  if (!isOpen) return null;

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  return (
    <div className="success-modal-overlay" onClick={onClose}>
      <div className="success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-modal-icon">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        
        <h2 className="success-modal-title">{title}</h2>
        <p className="success-modal-message">{message}</p>
        
        <div className="success-modal-actions">
          <button 
            className="success-modal-button"
            onClick={handleButtonClick}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;









