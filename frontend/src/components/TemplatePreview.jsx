import React, { useEffect, useMemo, useRef } from 'react';
import {
  CoverLetterDisplay,
  ProfessionalProfileDisplay,
  DesignerPortraitDisplay
} from './TemplateDisplays';

const TemplatePreview = ({
  templateType,
  templateText,
  profile,
  templateCss,
  templateIcon,
  templateName,
  templateDescription,
  wrapperClassName = 'profile-card',
  wrapperStyle,
  renderOnlyContent = false,
  emptyMessage = 'Enhanced profile preview will appear here once it is ready.',
  selectedFont = 'Arial',
  isEditable = false,
  onContentChange,
}) => {
  const wrapperRef = useRef(null);
  const normalizedTemplateType = useMemo(() => {
    const candidate = templateType || profile?.templateType || '';
    return candidate.toString().toLowerCase().trim();
  }, [templateType, profile]);

  const isCoverTemplate = normalizedTemplateType === 'cover';
  const isProfessionalTemplate =
    normalizedTemplateType === 'professional-profile' ||
    normalizedTemplateType === 'professional';
  const isDesignerPortraitTemplate = normalizedTemplateType === 'designer-portrait';

  useEffect(() => {
    if (!templateCss) {
      return undefined;
    }
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-template-css', 'template-preview');
    styleElement.innerHTML = templateCss;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [templateCss]);

  const hasText = Boolean(templateText && templateText.trim().length > 0);

  const fallbackHeader = (templateIcon || templateName) && (
    <h3>
      {templateIcon && <span>{templateIcon}</span>} {templateName}
      {templateDescription && (
        <span
          style={{
            display: 'block',
            fontSize: '0.9rem',
            color: '#666',
            marginTop: '8px',
            fontWeight: 'normal',
          }}
        >
          {templateDescription}
        </span>
      )}
    </h3>
  );

  const renderedContent = (() => {
    if (!hasText) {
      return (
        <div className="p-4" style={{ color: '#4b5563' }}>
          {emptyMessage}
        </div>
      );
    }

    if (isCoverTemplate) {
      return (
        <CoverLetterDisplay
          templateText={templateText}
          profile={profile}
          templateIcon={templateIcon}
          templateName={templateName}
          templateDescription={templateDescription}
        />
      );
    }

    if (isProfessionalTemplate) {
      return (
        <ProfessionalProfileDisplay
          templateText={templateText}
          profile={profile}
          templateIcon={templateIcon}
          templateName={templateName}
          templateDescription={templateDescription}
        />
      );
    }

    if (isDesignerPortraitTemplate) {
      return (
        <DesignerPortraitDisplay
          templateText={templateText}
          profile={profile}
        />
      );
    }

    return (
      <>
        {fallbackHeader}
        <p 
          className="whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: templateText }}
        />
      </>
    );
  })();

  if (renderOnlyContent) {
    return renderedContent;
  }

  const mergedStyle = {
    fontFamily: selectedFont,
    ...wrapperStyle,
  };

  // Make the rendered content editable when isEditable is true
  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const cleanupFunctions = [];
    
    if (isEditable) {
      // Find all text content areas and make them editable
      // For professional template: .professional-profile-summary
      // For cover letter: .cover-letter-body p (each paragraph)
      // For portrait: .portrait-summary-block p
      // For fallback: p.whitespace-pre-line
      let textAreas = [];
      
      if (isProfessionalTemplate) {
        textAreas = wrapperRef.current.querySelectorAll('.professional-profile-summary');
      } else if (isCoverTemplate) {
        textAreas = wrapperRef.current.querySelectorAll('.cover-letter-body p');
      } else if (isDesignerPortraitTemplate) {
        textAreas = wrapperRef.current.querySelectorAll('.portrait-summary-block p');
      } else {
        textAreas = wrapperRef.current.querySelectorAll('p.whitespace-pre-line');
      }
      
      textAreas.forEach((area) => {
        area.contentEditable = true;
        area.style.outline = 'none';
        area.style.minHeight = '20px';
        area.style.cursor = 'text';
        
        const handleInput = (e) => {
          if (onContentChange) {
            // Extract just the text content HTML from the editable area
            const html = e.currentTarget.innerHTML;
            onContentChange(html);
          }
        };
        
        area.addEventListener('input', handleInput);
        cleanupFunctions.push(() => {
          area.removeEventListener('input', handleInput);
          area.contentEditable = false;
          area.style.outline = '';
          area.style.minHeight = '';
          area.style.cursor = '';
        });
      });
      
      // Also make the wrapper itself editable if no specific text areas found
      if (textAreas.length === 0) {
        const textContent = wrapperRef.current.querySelector('p, div[class*="content"], div[class*="body"]');
        if (textContent) {
          textContent.contentEditable = true;
          textContent.style.outline = 'none';
          textContent.style.cursor = 'text';
          
          const handleInput = (e) => {
            if (onContentChange) {
              const html = e.currentTarget.innerHTML;
              onContentChange(html);
            }
          };
          
          textContent.addEventListener('input', handleInput);
          cleanupFunctions.push(() => {
            textContent.removeEventListener('input', handleInput);
            textContent.contentEditable = false;
            textContent.style.outline = '';
            textContent.style.cursor = '';
          });
        }
      }
    } else {
      // Remove contentEditable when editing is disabled
      const editableAreas = wrapperRef.current.querySelectorAll('[contenteditable="true"]');
      editableAreas.forEach((area) => {
        area.contentEditable = false;
        area.style.outline = '';
        area.style.minHeight = '';
        area.style.cursor = '';
      });
    }
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [isEditable, onContentChange, templateText]);

  return (
    <div 
      ref={wrapperRef}
      className={wrapperClassName} 
      style={mergedStyle}
    >
      {renderedContent}
    </div>
  );
};

export default TemplatePreview;


