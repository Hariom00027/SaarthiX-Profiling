import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './HoverPreview.css';

const HoverPreview = ({ imageUrl, visible }) => {
  useEffect(() => {
    // Prevent body scroll when preview is visible
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible || !imageUrl) {
    return null;
  }

  // Resolve image URL - handle both absolute and relative paths
  const resolvedImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090'}${imageUrl}`;

  return createPortal(
    <div className="hover-preview-backdrop">
      <div className="hover-preview-container">
        <img 
          src={resolvedImageUrl} 
          alt="Template preview" 
          className="hover-preview-image"
          onError={(e) => {
            // Hide image on error
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>,
    document.body
  );
};

export default HoverPreview;



