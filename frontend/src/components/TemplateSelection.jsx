import React, { useEffect, useMemo, useState, useRef } from 'react';

import { fetchTemplates } from '../api';
import HoverPreview from './HoverPreview';
import './TemplateSelection.css';

const TEMPLATE_ORDER = [
  'professional',
  'bio',
  'story',
  'industry',
  'modern-professional',
  'executive',
  'professional-profile',
  'cover'
];

const DEPRECATED_TEMPLATE_IDS = new Set(['formal-letter', 'portfolio']);

// Sample profile data for preview
const getSampleProfileData = (templateId) => {
  const baseProfile = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '(555) 123-4567',
    dob: '2000-05-15',
    linkedin: 'linkedin.com/in/alexjohnson',
    institute: 'State University',
    currentDegree: 'Bachelor of Technology',
    branch: 'Computer Science',
    yearOfStudy: 'Third Year',
    certifications: 'AWS Certified Solutions Architect, Google Cloud Professional',
    achievements: 'Dean\'s List 2023, Hackathon Winner 2024',
    technicalSkills: 'Java, Python, React, Node.js, MongoDB',
    softSkills: 'Leadership, Communication, Problem Solving',
    hobbies: 'Photography, Reading, Hiking',
    interests: 'Machine Learning, Web Development, Open Source',
    profileImage: '',
    hasInternship: true,
    internshipDetails: 'Software Engineering Intern at Tech Corp (Summer 2024)',
    hasExperience: false,
    experienceDetails: '',
  };

  // Template-specific sample text
  const sampleTexts = {
    professional: 'I am Alex Johnson, a dedicated and accomplished student currently pursuing a Bachelor of Technology degree with a specialization in Computer Science at State University. Presently in my third year of academic tenure, I have demonstrated exceptional commitment to professional development through the successful completion of distinguished certifications including AWS Certified Solutions Architect and Google Cloud Professional. Throughout my educational journey, I have achieved notable recognition for Dean\'s List 2023 and Hackathon Winner 2024, which underscores my unwavering dedication to excellence. My technical proficiencies encompass Java, Python, React, Node.js, and MongoDB, complemented by refined soft skills such as Leadership, Communication, and Problem Solving, which collectively position me as a well-rounded professional. I have completed a Software Engineering Internship at Tech Corp during Summer 2024, gaining valuable industry exposure. For professional correspondence, I can be reached at alex.johnson@example.com, and I invite you to explore my comprehensive professional profile at linkedin.com/in/alexjohnson.',
    bio: 'Alex Johnson is a passionate Computer Science student at State University, currently in their third year. With a strong foundation in modern technologies like Java, Python, React, and Node.js, Alex has earned certifications in AWS and Google Cloud. Beyond academics, Alex is an active participant in hackathons and open-source projects, with achievements including Dean\'s List recognition and winning a major hackathon in 2024. When not coding, Alex enjoys photography, reading, and hiking. With internship experience at Tech Corp and a keen interest in Machine Learning and Web Development, Alex is eager to contribute to innovative technology solutions.',
    story: 'My journey in technology began with curiosity and has evolved into a passion for creating meaningful solutions. As a third-year Computer Science student at State University, I\'ve immersed myself in both theoretical knowledge and practical applications. My certifications in AWS and Google Cloud have opened doors to cloud computing, while my internship at Tech Corp provided real-world experience in software engineering. Winning a hackathon in 2024 and earning Dean\'s List recognition have been milestones that fuel my drive. I believe in continuous learning, whether through coding projects, contributing to open source, or exploring new technologies like Machine Learning. My hobbies in photography and hiking keep me balanced and inspired.',
    industry: 'Alex Johnson brings a robust technical skill set and proven track record to the industry. Currently pursuing a Bachelor of Technology in Computer Science at State University, Alex has demonstrated excellence through AWS and Google Cloud certifications, Dean\'s List achievement, and hackathon victories. With hands-on experience from a Software Engineering internship at Tech Corp, proficiency in Java, Python, React, Node.js, and MongoDB, and strong leadership and communication skills, Alex is industry-ready. Passionate about Machine Learning and Web Development, Alex combines technical expertise with creative problem-solving to deliver innovative solutions.',
    'modern-professional': 'Alex Johnson | Computer Science Student | State University\n\nA results-driven third-year student specializing in Computer Science with a proven track record of academic excellence and practical experience. Certified in AWS and Google Cloud platforms, with hands-on software engineering experience from Tech Corp internship. Proficient in modern tech stack including Java, Python, React, Node.js, and MongoDB. Recognized for leadership, problem-solving abilities, and innovative thinking through Dean\'s List achievement and hackathon victory. Passionate about Machine Learning and Web Development, with a commitment to continuous learning and professional growth.',
    executive: 'Alex Johnson is a strategic-minded Computer Science student at State University, currently in the third year of studies. With executive-level thinking and a comprehensive understanding of technology landscapes, Alex has earned professional certifications in AWS and Google Cloud. The combination of academic excellence (Dean\'s List 2023), competitive achievements (Hackathon Winner 2024), and real-world experience (Software Engineering Intern at Tech Corp) demonstrates a capacity for leadership and innovation. Technical expertise spans Java, Python, React, Node.js, and MongoDB, while soft skills include exceptional leadership, communication, and strategic problem-solving. Alex\'s interests in Machine Learning and Web Development reflect a forward-thinking approach to technology leadership.',
    'professional-profile': 'I am Alex Johnson, a dedicated Computer Science student at State University, currently in my third year. My journey has been marked by continuous growth, from earning AWS and Google Cloud certifications to completing a Software Engineering internship at Tech Corp. I\'ve been recognized on the Dean\'s List and won a major hackathon in 2024. My technical skills include Java, Python, React, Node.js, and MongoDB, while my soft skills encompass leadership, communication, and problem-solving. I\'m passionate about Machine Learning and Web Development, and I enjoy photography, reading, and hiking in my free time.',
    cover: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the position. As a third-year Computer Science student at State University with certifications in AWS and Google Cloud, along with practical experience from my Software Engineering internship at Tech Corp, I am excited about the opportunity to contribute to your team.\n\nMy technical expertise in Java, Python, React, Node.js, and MongoDB, combined with my achievements including Dean\'s List recognition and hackathon victory, demonstrate my commitment to excellence. I am eager to bring my passion for Machine Learning and Web Development to your organization.\n\nThank you for considering my application.\n\nSincerely,\nAlex Johnson',
  };

  return {
    profile: baseProfile,
    templateText: sampleTexts[templateId] || sampleTexts.professional,
    templateCss: '',
    templateName: '',
    templateIcon: '',
    templateDescription: '',
  };
};

const TemplateSelection = ({ onTemplateSelect, onCoverLetterSelect, onBack }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveringTemplate, setHoveringTemplate] = useState(null);
  const [hoverImageUrl, setHoverImageUrl] = useState(null);
  const [showHoverPreview, setShowHoverPreview] = useState(false);
  const hoverTimers = useRef({});

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
      displayIcon: template.icon || fallbackIcon,
      previewImageUrl: template.previewImageUrl || null
    }));
  }, [templates]);

  return (
    <div className="template-selection">
      <div className="max-w-6xl mx-auto">
        <div className="template-selection__header">
          <p className="template-selection__eyebrow">Templates</p>
          <h2>Choose Your Profile Template</h2>
          <p>Hover for sec to preview templates</p>
        </div>

        {isLoading && (
          <div className="template-selection__status">Loading templates…</div>
        )}
        {!isLoading && error && (
          <div className="template-selection__status error">{error}</div>
        )}

        {resolvedTemplates.length === 0 && !isLoading && !error && (
          <div className="template-selection__status">No templates available.</div>
        )}

        {resolvedTemplates.length > 0 && (
          <div className="template-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resolvedTemplates.map((template) => (
              <button
                type="button"
                key={template.id}
                onClick={(e) => {
                  // Prevent hover preview from interfering with click
                  setShowHoverPreview(false);
                  setHoverImageUrl(null);
                  
                  // Directly navigate to the next page without showing preview modal
                  if (template.id === 'cover') {
                    onCoverLetterSelect?.();
                  } else {
                    onTemplateSelect?.(template.id);
                  }
                }}
                className="glass-card"
                onMouseEnter={() => {
                  setHoveringTemplate(template.id);
                  // Clear any existing timer for this template
                  if (hoverTimers.current[template.id]) {
                    clearTimeout(hoverTimers.current[template.id]);
                    delete hoverTimers.current[template.id];
                  }
                  // Set a new timer for 1 second to show preview image
                  if (template.previewImageUrl) {
                    hoverTimers.current[template.id] = setTimeout(() => {
                      setHoverImageUrl(template.previewImageUrl);
                      setShowHoverPreview(true);
                    }, 1000);
                  }
                }}
                onMouseLeave={() => {
                  setHoveringTemplate(null);
                  // Clear timer when mouse leaves
                  if (hoverTimers.current[template.id]) {
                    clearTimeout(hoverTimers.current[template.id]);
                    delete hoverTimers.current[template.id];
                  }
                  // Hide preview immediately when mouse leaves
                  setShowHoverPreview(false);
                  setHoverImageUrl(null);
                }}
              >
                <span className="glass-card__glow" aria-hidden="true" />
                <span className="glass-card__icon">{template.displayIcon}</span>
                <div className="glass-card__text">
                  <h3>{template.displayName}</h3>
                  <p>{template.displayDescription}</p>
                  {hoveringTemplate === template.id && !showHoverPreview && template.previewImageUrl && (
                    <p style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.85rem', 
                      color: '#fcd34d',
                      fontStyle: 'italic'
                    }}>
                      Hold for 1 second to preview...
                    </p>
                  )}
                </div>
                <span className="glass-card__cta">View template</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover Preview Component - Shows after 1 second of hover */}
        <HoverPreview imageUrl={hoverImageUrl} visible={showHoverPreview} />
      </div>
    </div>
  );
};

export default TemplateSelection;

