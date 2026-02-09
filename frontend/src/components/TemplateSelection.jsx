import React, { useEffect, useMemo, useState, useRef } from 'react';

import { fetchTemplates } from '../api';
import HoverPreview from './HoverPreview';
import './TemplateSelection.css';

const TEMPLATE_ORDER = [
  'professional',
  'bio',
  'modern-professional',
  'story',
  'executive',
  'professional-profile',
  'cover',
  'industry'
];

const DEPRECATED_TEMPLATE_IDS = new Set(['formal-letter', 'portfolio']);

// Icon configurations for each template
const TEMPLATE_ICONS = {
  'professional': { icon: '💼', bgColor: '#EEF2FF', iconColor: '#4F46E5' },
  'bio': { icon: '✨', bgColor: '#FEF3C7', iconColor: '#D97706' },
  'modern-professional': { icon: '👤', bgColor: '#D1FAE5', iconColor: '#059669' },
  'story': { icon: '📖', bgColor: '#D1FAE5', iconColor: '#059669' },
  'executive': { icon: '⚙️', bgColor: '#FCE7F3', iconColor: '#DB2777' },
  'professional-profile': { icon: '📷', bgColor: '#DBEAFE', iconColor: '#2563EB' },
  'cover': { icon: '🌿', bgColor: '#FFEDD5', iconColor: '#EA580C' },
  'industry': { icon: '📊', bgColor: '#FEE2E2', iconColor: '#DC2626' },
};

const TemplateSelection = ({ onTemplateSelect, onCoverLetterSelect, onBack }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveringTemplate, setHoveringTemplate] = useState(null);
  const [hoverImageUrl, setHoverImageUrl] = useState(null);
  const [showHoverPreview, setShowHoverPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);
  const hoverTimers = useRef({});
  const carouselRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      try {
        const result = await fetchTemplates();
        if (!isMounted) {
          return;
        }
        // Handle both direct array and wrapped response
        const templatesArray = Array.isArray(result) ? result : (result?.data || []);
        const normalized = templatesArray.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          icon: template.icon,
          previewImageUrl: template.previewImageUrl || null
        })).filter((template) => !DEPRECATED_TEMPLATE_IDS.has(template.id));
        setTemplates(normalized);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        console.error('Template fetch error:', fetchError);
        const message =
          fetchError.response?.data?.message ||
          (fetchError.response?.data?.error || fetchError.response?.data?.data) ||
          fetchError.message ||
          'Unable to load templates right now. Please try again.';
        setError(message);
        setTemplates([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clear all hover timers
      Object.values(hoverTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const resolvedTemplates = useMemo(() => {
    const fallbackIcon = '🧾';
    const sorted = [...templates].sort((a, b) => {
      const aIndex = TEMPLATE_ORDER.indexOf(a.id);
      const bIndex = TEMPLATE_ORDER.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) {
        return a.name.localeCompare(b.name);
      }
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sorted.map((template) => ({
      ...template,
      displayName: template.name || template.id,
      displayDescription: template.description || 'Personalized profile template',
      displayIcon: TEMPLATE_ICONS[template.id]?.icon || template.icon || fallbackIcon,
      iconBgColor: TEMPLATE_ICONS[template.id]?.bgColor || '#F3F4F6',
      iconColor: TEMPLATE_ICONS[template.id]?.iconColor || '#6B7280',
      previewImageUrl: template.previewImageUrl || null
    }));
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return resolvedTemplates;
    const query = searchQuery.toLowerCase();
    return resolvedTemplates.filter(t => 
      t.displayName.toLowerCase().includes(query) || 
      t.displayDescription.toLowerCase().includes(query)
    );
  }, [resolvedTemplates, searchQuery]);

  const handleScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template.id);
    setShowHoverPreview(false);
    setHoverImageUrl(null);
    
    if (template.id === 'cover') {
      onCoverLetterSelect?.();
    } else {
      onTemplateSelect?.(template.id);
    }
  };

  return (
    <div className="template-selection-page">
      {/* Blue Header Section */}
      <div className="template-header">
        <div className="template-header-content">
          <span className="template-badge">Templates</span>
          <h1 className="template-title">
            Choose Your <span className="text-gold">Profile Template</span>
          </h1>
          <p className="template-subtitle">
            Explore career paths and certification opportunities across diverse sectors. Start your professional journey today.
          </p>
          
          {/* Search Bar */}
          <div className="template-search-container">
            <div className="template-search-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search your template"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="template-search-input"
              />
              <button className="template-search-btn">Search</button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Cards Section */}
      <div className="template-cards-section">
        {isLoading && (
          <div className="template-status">Loading templates…</div>
        )}
        {!isLoading && error && (
          <div className="template-status error">{error}</div>
        )}

        {filteredTemplates.length === 0 && !isLoading && !error && (
          <div className="template-status">No templates available.</div>
        )}

        {filteredTemplates.length > 0 && (
          <div className="template-carousel-container">
            {/* Navigation Arrows */}
            <div className="carousel-navigation">
              <button 
                className="carousel-arrow carousel-arrow-left"
                onClick={() => handleScroll('left')}
                aria-label="Scroll left"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <button 
                className="carousel-arrow carousel-arrow-right"
                onClick={() => handleScroll('right')}
                aria-label="Scroll right"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>

            {/* Template Grid */}
            <div className="template-grid" ref={carouselRef}>
              {filteredTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onMouseEnter={() => {
                    setHoveringTemplate(template.id);
                    if (hoverTimers.current[template.id]) {
                      clearTimeout(hoverTimers.current[template.id]);
                      delete hoverTimers.current[template.id];
                    }
                    if (template.previewImageUrl) {
                      hoverTimers.current[template.id] = setTimeout(() => {
                        setHoverImageUrl(template.previewImageUrl);
                        setShowHoverPreview(true);
                      }, 1000);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveringTemplate(null);
                    if (hoverTimers.current[template.id]) {
                      clearTimeout(hoverTimers.current[template.id]);
                      delete hoverTimers.current[template.id];
                    }
                    setShowHoverPreview(false);
                    setHoverImageUrl(null);
                  }}
                >
                  <div 
                    className="template-card-icon"
                    style={{ backgroundColor: template.iconBgColor }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{template.displayIcon}</span>
                  </div>
                  
                  <h3 className="template-card-title">{template.displayName}</h3>
                  <p className="template-card-description">{template.displayDescription}</p>
                  
                  {hoveringTemplate === template.id && !showHoverPreview && template.previewImageUrl && (
                    <p className="template-hover-hint">Hold for 1 second to preview...</p>
                  )}
                  
                  <button
                    className={`template-select-btn ${selectedTemplate === template.id ? 'primary' : 'outline'}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    Select Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        {onBack && (
          <div className="template-back-container">
            <button className="template-back-btn" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back to home
            </button>
          </div>
        )}
      </div>

      {/* Hover Preview Component */}
      <HoverPreview imageUrl={hoverImageUrl} visible={showHoverPreview} />
    </div>
  );
};

export default TemplateSelection;
