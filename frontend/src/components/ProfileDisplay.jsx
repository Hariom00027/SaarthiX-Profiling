import React, { useEffect, useMemo, useRef, useState } from 'react';

import api, { fetchTemplates, regenerateProfile, saveProfileAsJson, getAllMyProfiles } from '../api';
import { downloadProfileAsPDF } from '../utils/downloadProfile';
import SaarthiChatbot from './SaarthiChatbot';
import TemplatePreview from './TemplatePreview';
import ImageUploadForm from './ImageUploadForm';

const emptyProfile = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  linkedin: '',
  profileImage: '',
  institute: '',
  currentDegree: '',
  branch: '',
  yearOfStudy: '',
  certifications: '',
  achievements: '',
  hobbies: '',
  interests: '',
  technicalSkills: '',
  softSkills: '',
  templateType: '',
  hiringManagerName: '',
  companyName: '',
  companyAddress: '',
  positionTitle: '',
  relevantExperience: '',
  keyAchievement: '',
  strengths: '',
  closingNote: '',
  hasInternship: false,
  internshipDetails: '',
  hasExperience: false,
  experienceDetails: '',
};

const defaultTemplateOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'bio', label: 'Bio' },
  { value: 'story', label: 'Story' },
  { value: 'industry', label: 'Industry Ready' },
  { value: 'modern-professional', label: 'Modern Professional' },
  { value: 'executive', label: 'Executive Professional Template' },
  { value: 'professional-profile', label: 'Professional Profile with Photo' },
  { value: 'designer-portrait', label: 'Designer Portrait Showcase' },
  { value: 'cover', label: 'Cover Letter' }
];

// Templates that require a photo
const PHOTO_TEMPLATE_LABELS = {
  'professional-profile': 'Professional Profile with Photo',
  'designer-portrait': 'Designer Portrait Showcase',
};

const templateRequiresPhoto = (templateType) => Boolean(PHOTO_TEMPLATE_LABELS[templateType]);

const fontOptions = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
];

const ARRAY_FIELDS = new Set([
  'technicalSkills',
  'softSkills',
  'certifications',
  'achievements',
  'hobbies',
  'interests',
]);

const normalizeFormValue = (key, value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (ARRAY_FIELDS.has(key) && typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
};

const cleanFormData = (source = {}) => {
  const cleaned = {};
  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    let normalized = normalizeFormValue(key, value);
    if (typeof normalized === 'string') {
      normalized = normalized.trim();
      if (normalized === '') {
        return;
      }
    }
    if (Array.isArray(normalized) && normalized.length === 0) {
      return;
    }
    cleaned[key] = normalized;
  });
  return cleaned;
};

const ProfileDisplay = ({ profileData, onEnhanceRequest, onChatbotRequest, forceEditMode, onForceEditHandled, onProfileUpdate, savedFormData = {}, isNewProfile = false, hideProfilesList = false }) => {
  const [currentProfileData, setCurrentProfileData] = useState(profileData);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState(emptyProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateOptions, setTemplateOptions] = useState(defaultTemplateOptions);
  const [downloadError, setDownloadError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isChangingTemplate, setIsChangingTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [editedTemplateText, setEditedTemplateText] = useState(null);
  const [originalTemplateText, setOriginalTemplateText] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [pendingTemplateChange, setPendingTemplateChange] = useState(null);
  const templateRef = useRef(null);

  useEffect(() => {
    setCurrentProfileData(profileData);
  }, [profileData]);

  // Clear chatbot state when a new profile is created
  useEffect(() => {
    if (isNewProfile) {
      // Clear chatbot conversation state
      try {
        localStorage.removeItem('saarthi_chatbot_state_v1');
      } catch (e) {
        console.warn('Failed to clear chatbot state:', e);
      }
    }
  }, [isNewProfile]);

  // Initialize editedTemplateText and originalTemplateText when templateText changes
  useEffect(() => {
    const currentText = currentProfileData?.templateText;
    if (currentText) {
      // Always update editedTemplateText to match current
      setEditedTemplateText(currentText);
      // Only set original if it's not already set (to preserve the baseline for comparison)
      // This ensures we track the original state when profile first loads
      if (originalTemplateText === null) {
        setOriginalTemplateText(currentText);
      }
    } else {
      // If no template text, reset both
      setEditedTemplateText(null);
      if (originalTemplateText !== null) {
        setOriginalTemplateText(null);
      }
    }
  }, [currentProfileData?.templateText]);

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      try {
        const templates = await fetchTemplates();
        if (!isMounted) {
          return;
        }
        if (Array.isArray(templates)) {
          const normalized = templates.map((template) => ({
            value: template.id,
            label: template.name || template.id
          }));
          setTemplateOptions(normalized);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setTemplateOptions(defaultTemplateOptions);
      }
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const profile = useMemo(() => {
    if (!currentProfileData) {
      return null;
    }
    return currentProfileData.profile || currentProfileData;
  }, [currentProfileData]);

  useEffect(() => {
    if (isEditing && profile) {
      setFormValues({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dob: profile.dob || '',
        linkedin: profile.linkedin || '',
        institute: profile.institute || '',
        currentDegree: profile.currentDegree || '',
        branch: profile.branch || '',
        yearOfStudy: profile.yearOfStudy || '',
        certifications: profile.certifications || '',
        achievements: profile.achievements || '',
        hobbies: profile.hobbies || '',
        interests: profile.interests || '',
        technicalSkills: profile.technicalSkills || '',
        softSkills: profile.softSkills || '',
        templateType: profile.templateType || 'professional',
        hiringManagerName: profile.hiringManagerName || '',
        companyName: profile.companyName || '',
        companyAddress: profile.companyAddress || '',
        positionTitle: profile.positionTitle || '',
        relevantExperience: profile.relevantExperience || '',
        keyAchievement: profile.keyAchievement || '',
        strengths: profile.strengths || '',
        closingNote: profile.closingNote || '',
        hasInternship: Boolean(profile.hasInternship),
        internshipDetails: profile.internshipDetails || '',
        hasExperience: Boolean(profile.hasExperience),
        experienceDetails: profile.experienceDetails || '',
        profileImage: profile.profileImage || '',
      });
    }
  }, [isEditing, profile]);

  useEffect(() => {
    if (forceEditMode) {
      setIsEditing(true);
      if (typeof onForceEditHandled === 'function') {
        onForceEditHandled();
      }
    }
  }, [forceEditMode, onForceEditHandled]);

  // Load Google Fonts when a Google Font is selected
  useEffect(() => {
    const googleFonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Playfair Display', 'Merriweather', 'Raleway', 'Source Sans Pro'];
    if (googleFonts.includes(selectedFont)) {
      const linkId = `google-font-${selectedFont.replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [selectedFont]);

  // Convert profile to UserProfile format for chatbot
  const convertToUserProfile = (profile) => {
    return {
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dob: profile.dob || '',
      institute: profile.institute || '',
      currentDegree: profile.currentDegree || '',
      degree: profile.degree || '',
      branch: profile.branch || '',
      specialization: profile.specialization || '',
      yearOfStudy: profile.yearOfStudy || '',
      technicalSkills: profile.technicalSkills || '',
      softSkills: profile.softSkills || '',
      certifications: profile.certifications || '',
      achievements: profile.achievements || '',
      interests: profile.interests || '',
      hobbies: profile.hobbies || '',
      goals: profile.goals || ''
    };
  };

  if (!profile) {
    return <div className="p-6">No profile data to display</div>;
  }

  const templateText = editedTemplateText !== null ? editedTemplateText : (currentProfileData?.templateText);
  const templateCss = currentProfileData?.templateCss || '';
  const templateName = currentProfileData?.templateName;
  const templateIcon = currentProfileData?.templateIcon;
  const templateDescription = currentProfileData?.templateDescription;
  const templateType = profile?.templateType || currentProfileData?.templateType;
  const profileId = profile?.id || currentProfileData?.id;

  const handleInlineContentInput = (event) => {
    const html = event.currentTarget.innerHTML;
    setEditedTemplateText(html);
  };

  // Handle text selection
  const handleTextSelection = (e) => {
    // Only handle selection within the profile card
    const profileCard = e?.target?.closest('.profile-card') || e?.target?.closest('.profile-card-wrapper');
    if (!profileCard) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      
      // Check if selection is within profile card
      const profileCardElement = document.querySelector('.profile-card') || document.querySelector('.profile-card-wrapper');
      if (profileCardElement && !profileCardElement.contains(range.commonAncestorContainer)) {
        setShowToolbar(false);
        return;
      }
      
      // Get the position of the selection
      const rect = range.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setSelectedText(selectedText);
      setSelectionRange(range.cloneRange());
      
      // Position toolbar above selection, centered horizontally
      const toolbarWidth = 200; // Approximate width
      const toolbarHeight = 50;
      const topPosition = rect.top + scrollTop - toolbarHeight - 10;
      const leftPosition = Math.max(10, Math.min(
        rect.left + scrollLeft + (rect.width / 2) - (toolbarWidth / 2),
        window.innerWidth - toolbarWidth - 10
      ));
      
      setToolbarPosition({
        top: Math.max(10, topPosition), // Ensure toolbar doesn't go above viewport
        left: leftPosition
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
      setSelectedText('');
      setSelectionRange(null);
    }
  };

  // Handle click outside to hide toolbar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showToolbar && !e.target.closest('.text-formatting-toolbar') && !e.target.closest('.profile-card') && !e.target.closest('.profile-card-wrapper')) {
        setShowToolbar(false);
        setSelectedText('');
        setSelectionRange(null);
        window.getSelection().removeAllRanges();
      }
    };

    const handleSelection = (e) => {
      handleTextSelection(e);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mouseup', handleSelection);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [showToolbar]);

  // Apply formatting to selected text (toggle behavior)
  const applyFormatting = (format) => {
    if (!selectedText || !selectionRange || !templateText) return;

    // Create a temporary div to extract plain text and find position
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = templateText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Find the selected text in plain text (case-insensitive search)
    const lowerPlainText = plainText.toLowerCase();
    const lowerSelected = selectedText.toLowerCase();
    let textIndex = lowerPlainText.indexOf(lowerSelected);
    
    if (textIndex === -1) {
      // Try to find with normalized whitespace
      const normalizedPlain = plainText.replace(/\s+/g, ' ').trim();
      const normalizedSelected = selectedText.replace(/\s+/g, ' ').trim();
      const normalizedIndex = normalizedPlain.toLowerCase().indexOf(normalizedSelected.toLowerCase());
      if (normalizedIndex !== -1) {
        // Find the actual position in original text
        let charCount = 0;
        let found = false;
        for (let i = 0; i < plainText.length && !found; i++) {
          if (plainText.substring(i).replace(/\s+/g, ' ').toLowerCase().startsWith(normalizedSelected.toLowerCase())) {
            textIndex = i;
            found = true;
          }
        }
      }
    }
    
    if (textIndex === -1) {
      console.error('Selected text not found in template');
      setSaveMessage({ type: 'error', text: 'Could not find selected text to format' });
      setTimeout(() => setSaveMessage(null), 2000);
      setShowToolbar(false);
      return;
    }

    // Get the actual selected text from plain text (to match case)
    const actualSelectedText = plainText.substring(textIndex, textIndex + selectedText.length);
    
    // Find the position in HTML that corresponds to textIndex in plain text
    let htmlIndex = 0;
    let plainIndex = 0;
    let inTag = false;
    
    for (let i = 0; i < templateText.length && plainIndex < textIndex; i++) {
      if (templateText[i] === '<') {
        inTag = true;
      } else if (templateText[i] === '>') {
        inTag = false;
      } else if (!inTag) {
        plainIndex++;
      }
      htmlIndex = i + 1;
    }
    
    // Now find the end position
    let endHtmlIndex = htmlIndex;
    let endPlainIndex = plainIndex;
    const targetLength = actualSelectedText.length;
    
    for (let i = htmlIndex; i < templateText.length && (endPlainIndex - plainIndex) < targetLength; i++) {
      if (templateText[i] === '<') {
        inTag = true;
      } else if (templateText[i] === '>') {
        inTag = false;
      } else if (!inTag) {
        endPlainIndex++;
      }
      endHtmlIndex = i + 1;
    }
    
    // Extract a larger HTML segment around the selected text to check for existing tags
    // Look backwards to find the start of any wrapping tags
    let segmentStart = htmlIndex;
    let bracketCount = 0;
    for (let i = htmlIndex - 1; i >= 0 && i >= htmlIndex - 200; i--) {
      if (templateText[i] === '>') {
        bracketCount++;
      } else if (templateText[i] === '<') {
        if (i + 1 < templateText.length && templateText[i + 1] === '/') {
          bracketCount++;
        } else {
          bracketCount--;
          if (bracketCount < 0) {
            segmentStart = i;
            break;
          }
        }
      }
    }
    
    // Look forwards to find the end of any wrapping tags
    let segmentEnd = endHtmlIndex;
    bracketCount = 0;
    for (let i = endHtmlIndex; i < templateText.length && i < endHtmlIndex + 200; i++) {
      if (templateText[i] === '<') {
        if (i + 1 < templateText.length && templateText[i + 1] === '/') {
          bracketCount--;
          if (bracketCount === 0) {
            // Find the closing '>'
            for (let j = i; j < templateText.length; j++) {
              if (templateText[j] === '>') {
                segmentEnd = j + 1;
                break;
              }
            }
            break;
          }
        } else {
          bracketCount++;
        }
      }
    }
    
    // Extract the HTML segment containing the selected text
    const htmlSegment = templateText.substring(segmentStart, segmentEnd);
    
    // Define tag mappings
    const tagMap = {
      'bold': { open: '<strong>', close: '</strong>', openAlt: '<b>', closeAlt: '</b>' },
      'italic': { open: '<em>', close: '</em>', openAlt: '<i>', closeAlt: '</i>' },
      'underline': { open: '<u>', close: '</u>' }
    };
    
    const tags = tagMap[format];
    if (!tags) {
      return;
    }
    
    // Check if the selected text is already wrapped in the formatting tag
    // We need to check if the actual selected text (not the whole segment) is wrapped
    const selectedHtml = templateText.substring(htmlIndex, endHtmlIndex);
    const isWrappedInTag = (selectedHtml.includes(tags.open) && selectedHtml.includes(tags.close)) ||
                          (tags.openAlt && selectedHtml.includes(tags.openAlt) && selectedHtml.includes(tags.closeAlt));
    
    // Also check if the segment contains the tag wrapping the text
    const segmentHasTag = (htmlSegment.includes(tags.open) && htmlSegment.includes(tags.close)) ||
                         (tags.openAlt && htmlSegment.includes(tags.openAlt) && htmlSegment.includes(tags.closeAlt));
    
    let newText;
    if (isWrappedInTag || segmentHasTag) {
      // Remove formatting - remove the tags while preserving the text
      let cleanedSegment = htmlSegment;
      
      // Remove opening and closing tags (case-insensitive)
      const openTagRegex = new RegExp(tags.open.replace(/[<>]/g, '\\$&'), 'gi');
      const closeTagRegex = new RegExp(tags.close.replace(/[<>]/g, '\\$&'), 'gi');
      cleanedSegment = cleanedSegment.replace(openTagRegex, '').replace(closeTagRegex, '');
      
      if (tags.openAlt) {
        const openAltRegex = new RegExp(tags.openAlt.replace(/[<>]/g, '\\$&'), 'gi');
        const closeAltRegex = new RegExp(tags.closeAlt.replace(/[<>]/g, '\\$&'), 'gi');
        cleanedSegment = cleanedSegment.replace(openAltRegex, '').replace(closeAltRegex, '');
      }
      
      newText = templateText.substring(0, segmentStart) + cleanedSegment + templateText.substring(segmentEnd);
    } else {
      // Apply formatting - wrap the selected text
      const formattedText = `${tags.open}${actualSelectedText}${tags.close}`;
      newText = templateText.substring(0, htmlIndex) + 
                formattedText + 
                templateText.substring(endHtmlIndex);
    }
    
    setEditedTemplateText(newText);
    setShowToolbar(false);
    setSelectedText('');
    setSelectionRange(null);
    
    // Clear selection
    window.getSelection().removeAllRanges();
  };

  // Copy selected text
  const handleCopy = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setSaveMessage({ type: 'success', text: 'Text copied to clipboard!' });
      setTimeout(() => setSaveMessage(null), 2000);
      setShowToolbar(false);
      window.getSelection().removeAllRanges();
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to copy text' });
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  // Enhance selected text with AI
  const handleAIEnhance = async () => {
    if (!selectedText || !selectionRange || !templateText) return;

    try {
      setIsEnhancing(true);
      
      // Count words in original selected text
      const originalWordCount = selectedText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      const { enhanceProfileWithAI } = await import('../api');
      const result = await enhanceProfileWithAI(selectedText);
      
      if (result.success && result.data) {
        // Validate and trim enhanced text to match original word count
        let enhancedText = result.data.trim();
        const enhancedWords = enhancedText.split(/\s+/).filter(word => word.length > 0);
        let enhancedWordCount = enhancedWords.length;
        let wasTrimmed = false;
        
        // If enhanced text has significantly more words, trim it intelligently
        if (enhancedWordCount > originalWordCount * 1.1) {
          wasTrimmed = true;
          // Trim to approximately the original word count
          const wordsToKeep = enhancedWords.slice(0, originalWordCount);
          enhancedText = wordsToKeep.join(' ');
          
          // Try to end at a sentence boundary if possible
          const lastPeriod = enhancedText.lastIndexOf('.');
          const lastExclamation = enhancedText.lastIndexOf('!');
          const lastQuestion = enhancedText.lastIndexOf('?');
          const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
          
          if (lastSentenceEnd > enhancedText.length * 0.7) {
            enhancedText = enhancedText.substring(0, lastSentenceEnd + 1);
            enhancedWordCount = enhancedText.split(/\s+/).filter(word => word.length > 0).length;
          } else {
            enhancedWordCount = originalWordCount;
          }
        }
        
        // Create a temporary div to extract plain text and find position
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = templateText;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Find the selected text in plain text (case-insensitive search)
        const lowerPlainText = plainText.toLowerCase();
        const lowerSelected = selectedText.toLowerCase();
        let textIndex = lowerPlainText.indexOf(lowerSelected);
        
        if (textIndex === -1) {
          // Try with normalized whitespace
          const normalizedPlain = plainText.replace(/\s+/g, ' ').trim();
          const normalizedSelected = selectedText.replace(/\s+/g, ' ').trim();
          const normalizedIndex = normalizedPlain.toLowerCase().indexOf(normalizedSelected.toLowerCase());
          if (normalizedIndex !== -1) {
            let charCount = 0;
            for (let i = 0; i < plainText.length; i++) {
              if (plainText.substring(i).replace(/\s+/g, ' ').toLowerCase().startsWith(normalizedSelected.toLowerCase())) {
                textIndex = i;
                break;
              }
            }
          }
        }
        
        if (textIndex === -1) {
          setSaveMessage({ type: 'error', text: 'Could not find selected text to replace' });
          setTimeout(() => setSaveMessage(null), 3000);
          return;
        }
        
        // Get the actual selected text from plain text
        const actualSelectedText = plainText.substring(textIndex, textIndex + selectedText.length);
        
        // Find position in HTML accounting for tags
        let htmlIndex = 0;
        let plainIndex = 0;
        let inTag = false;
        
        for (let i = 0; i < templateText.length && plainIndex < textIndex; i++) {
          if (templateText[i] === '<') {
            inTag = true;
          } else if (templateText[i] === '>') {
            inTag = false;
          } else if (!inTag) {
            plainIndex++;
          }
          htmlIndex = i + 1;
        }
        
        // Find end position
        let endHtmlIndex = htmlIndex;
        let endPlainIndex = plainIndex;
        const targetLength = actualSelectedText.length;
        
        for (let i = htmlIndex; i < templateText.length && (endPlainIndex - plainIndex) < targetLength; i++) {
          if (templateText[i] === '<') {
            inTag = true;
          } else if (templateText[i] === '>') {
            inTag = false;
          } else if (!inTag) {
            endPlainIndex++;
          }
          endHtmlIndex = i + 1;
        }
        
        // Replace with enhanced text (use trimmed version if it was trimmed)
        const newText = templateText.substring(0, htmlIndex) + 
                        enhancedText + 
                        templateText.substring(endHtmlIndex);
        setEditedTemplateText(newText);
        
        const wordCountInfo = wasTrimmed 
          ? ` (trimmed to ${enhancedWordCount} words to match original length)`
          : '';
        setSaveMessage({ type: 'success', text: `Text enhanced with AI!${wordCountInfo}` });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to enhance text' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
      setSaveMessage({ type: 'error', text: 'Failed to enhance text with AI' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsEnhancing(false);
      setShowToolbar(false);
      setSelectedText('');
      setSelectionRange(null);
      window.getSelection().removeAllRanges();
    }
  };

  const handleDownload = async () => {
    if (!templateRef.current) {
      setDownloadError('Nothing to download – profile preview is not ready yet.');
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadError(null);
      // Hide any active selection toolbar to avoid capturing it
      if (showToolbar) {
        setShowToolbar(false);
      }

      const captureNode =
        templateRef.current.querySelector('.profile-card') || templateRef.current;
      const profileImage =
        currentProfileData?.profile?.profileImage ||
        currentProfileData?.profileImage ||
        profile?.profileImage ||
        '';
      const hasPhoto = Boolean(profileImage && String(profileImage).trim().length > 0);

      await downloadProfileAsPDF(captureNode, {
        fileName: 'profile.pdf',
        orientation: 'p',
        hasPhoto,
        centerIfNoPhoto: true,
      });
    } catch (error) {
      console.error('Error generating PDF from template:', error);
      setDownloadError(error.message || 'Failed to generate PDF from profile view.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditClick = () => {
    if (!profileId) {
      console.error('Profile ID is required to edit profile');
      return;
    }
    setIsEditing(true);
  };

  const handleTemplateChange = async (event) => {
    const newTemplateType = event.target.value;
    if (!profileId || !newTemplateType || newTemplateType === templateType) {
      return;
    }

    // Check if the new template requires a photo
    if (templateRequiresPhoto(newTemplateType)) {
      // Check if profile already has a photo
      const currentPhoto = profile?.profileImage || currentProfileData?.profile?.profileImage;
      if (!currentPhoto || currentPhoto.trim() === '') {
        // Photo is required but missing - show upload modal
        setPendingTemplateChange(newTemplateType);
        setShowPhotoUploadModal(true);
        // Reset the dropdown to current template
        event.target.value = templateType || 'professional';
        return;
      }
    }

    // If photo is not required or photo exists, proceed with template change
    await performTemplateChange(newTemplateType);
  };

  const performTemplateChange = async (newTemplateType, photoData = null) => {
    if (!profileId || !newTemplateType) {
      return;
    }

    try {
      setIsChangingTemplate(true);
      setDownloadError(null);
      
      // Prepare update data
      const updateData = { templateType: newTemplateType };
      if (photoData) {
        updateData.profileImage = photoData;
      }
      
      // Update profile with new template type (and photo if provided)
      const response = await api.put(
        `/api/profiles/${profileId}`,
        updateData
      );

      const updatedData = response.data?.data || response.data;
      setCurrentProfileData(updatedData);
      // Reset edited and original template text when template changes
      if (updatedData?.templateText) {
        setEditedTemplateText(updatedData.templateText);
        setOriginalTemplateText(updatedData.templateText);
      } else {
        setEditedTemplateText(null);
        setOriginalTemplateText(null);
      }
      
      // Notify parent component if callback exists
      if (onProfileUpdate) {
        onProfileUpdate(updatedData);
      }
    } catch (error) {
      console.error('Error changing template:', error);
      setDownloadError(
        error.response?.data?.message || 
        error.message || 
        'Failed to change template. Please try again.'
      );
    } finally {
      setIsChangingTemplate(false);
    }
  };

  const handlePhotoUpload = async (profileDataWithPhoto) => {
    if (!pendingTemplateChange) {
      return;
    }

    try {
      // Close modal first
      setShowPhotoUploadModal(false);
      
      // Update profile with both template and photo
      await performTemplateChange(pendingTemplateChange, profileDataWithPhoto.profileImage);
      
      // Clear pending template change
      setPendingTemplateChange(null);
    } catch (error) {
      console.error('Error uploading photo and changing template:', error);
      setDownloadError('Failed to upload photo and change template. Please try again.');
    }
  };

  const handlePhotoUploadCancel = () => {
    setShowPhotoUploadModal(false);
    setPendingTemplateChange(null);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setFormValues((prev) => ({
        ...prev,
        [name]: checked,
        ...(name === 'hasInternship' && !checked ? { internshipDetails: '' } : {}),
        ...(name === 'hasExperience' && !checked ? { experienceDetails: '' } : {}),
      }));
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!profileId) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.put(
        `/api/profiles/${profileId}`,
        formValues
      );

      const updatedData = response.data?.data || response.data;
      setCurrentProfileData(updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileId) {
      setSaveMessage({ type: 'error', text: 'Profile ID is required to save' });
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Check if there are any edits to save
      const hasEdits = editedTemplateText !== null && 
                       originalTemplateText !== null &&
                       editedTemplateText.trim() !== originalTemplateText.trim();

      console.log('Save check:', {
        hasEdits,
        editedTemplateText: editedTemplateText?.substring(0, 50),
        originalTemplateText: originalTemplateText?.substring(0, 50)
      });

      if (hasEdits) {
        try {
          console.log('Saving enhanced template text:', editedTemplateText.substring(0, 100) + '...');
          
          // Update the profile with the edited template text
          const updateResponse = await api.put(
            `/api/profiles/${profileId}`,
            { aiEnhancedTemplateText: editedTemplateText }
          );
          
          console.log('Profile update response:', updateResponse.data);
          
          // Reload the profile to get the latest data from backend
          const profileResponse = await api.get(`/api/profiles/my-profile`);
          const reloadedData = profileResponse.data?.data || profileResponse.data;
          
          if (reloadedData) {
            console.log('Reloaded profile data:', reloadedData);
            setCurrentProfileData(reloadedData);
            // Update both edited and original to match the saved version
            // This resets the baseline so future edits are compared against the new saved state
            if (reloadedData.templateText) {
              setEditedTemplateText(reloadedData.templateText);
              setOriginalTemplateText(reloadedData.templateText);
              console.log('Updated template text after save:', reloadedData.templateText.substring(0, 100));
            }
            // Update parent component if callback exists
            if (typeof onProfileUpdate === 'function') {
              onProfileUpdate(reloadedData);
            }
          }
        } catch (updateError) {
          console.error('Error updating profile with enhanced text:', updateError);
          setSaveMessage({ 
            type: 'error', 
            text: 'Failed to save enhanced text. Please try again.' 
          });
          setTimeout(() => setSaveMessage(null), 5000);
          setIsSaving(false);
          return;
        }
      }

      // Save as JSON
      const result = await saveProfileAsJson(profileId);

      if (result.success) {
        setSaveMessage({ 
          type: 'success', 
          text: 'Profile saved successfully! All enhancements have been saved.' 
        });
        
        // Fetch all saved profiles after successful save (only if not a new profile)
        // For new profiles, keep showing only the current profile
        if (!isNewProfile) {
          try {
            const profilesResult = await getAllMyProfiles();
            if (profilesResult.success && profilesResult.data && Array.isArray(profilesResult.data)) {
              setAllProfiles(profilesResult.data);
              setShowAllProfiles(true);
              // Set the most recent profile (first in array) as selected
              if (profilesResult.data.length > 0) {
                setSelectedProfileIndex(0);
                // Update current profile data to the most recent one
                const mostRecent = profilesResult.data[0];
                setCurrentProfileData(mostRecent);
                if (mostRecent.templateText) {
                  setEditedTemplateText(mostRecent.templateText);
                  setOriginalTemplateText(mostRecent.templateText);
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch all profiles:', error);
            // Don't show error to user, just log it
          }
        }
        
        // Clear message after 5 seconds
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: error.message || 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileRegeneration = async (answers, reportData) => {
    const selectedTemplate =
      templateType || profile?.templateType || currentProfileData?.templateType;

    if (!selectedTemplate) {
      return { success: false, error: 'Template selection is missing.' };
    }

    const baseFormPayload = savedFormData && Object.keys(savedFormData).length > 0
      ? savedFormData
      : profile && Object.keys(profile).length > 0
        ? profile
        : currentProfileData?.profile || currentProfileData || {};
    const formPayload = cleanFormData(baseFormPayload);

    // Explicitly preserve profileImage from current profile if it exists
    const currentProfileImage = currentProfileData?.profile?.profileImage || 
                                currentProfileData?.profileImage || 
                                profile?.profileImage || 
                                baseFormPayload?.profileImage;
    if (currentProfileImage) {
      formPayload.profileImage = currentProfileImage;
    }

    try {
      const payload = {
        templateId: selectedTemplate,
        formData: formPayload,
        chatAnswers: answers || {},
        reportData: reportData || {},
      };
      console.log('Regenerate payload', payload);

      const result = await regenerateProfile(payload);
      if (result.success && result.data) {
        setCurrentProfileData(result.data);
        if (typeof onProfileUpdate === 'function') {
          onProfileUpdate(result.data);
        }
        setSaveMessage({
          type: 'success',
          text: 'Profile regenerated with the latest AI insights.',
        });
        setTimeout(() => setSaveMessage(null), 5000);
        return { success: true };
      }

      setSaveMessage({ type: 'error', text: result.error || 'Failed to regenerate profile' });
      return { success: false, error: result.error || 'Failed to regenerate profile' };
    } catch (error) {
      console.error('Regenerate profile error:', error);
      setSaveMessage({ type: 'error', text: error?.message || 'Failed to regenerate profile' });
      return { success: false, error: error?.message || 'Failed to regenerate profile' };
    }
  };

  const heading = templateType && templateType.toLowerCase() === 'cover'
    ? 'Cover Letter'
    : 'Profile Details';

  // Load all profiles on component mount (only if not a new profile)
  useEffect(() => {
    // If it's a new profile, don't load all profiles - just show the current one
    if (isNewProfile) {
      // For new profiles, only show the current profile
      setAllProfiles([]);
      setShowAllProfiles(false);
      return;
    }

    const loadAllProfiles = async () => {
      try {
        const result = await getAllMyProfiles();
        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
          setAllProfiles(result.data);
          // Show saved profiles section when viewing saved profiles
          setShowAllProfiles(true);
          // Set the most recent profile as the current one
          if (result.data.length > 0) {
            setSelectedProfileIndex(0);
            const mostRecent = result.data[0];
            if (!currentProfileData || !currentProfileData.templateText) {
              setCurrentProfileData(mostRecent);
              if (mostRecent.templateText) {
                setEditedTemplateText(mostRecent.templateText);
                setOriginalTemplateText(mostRecent.templateText);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load all profiles:', error);
      }
    };
    loadAllProfiles();
  }, [isNewProfile]);

  // Handle profile selection from the list
  const handleProfileSelect = (index) => {
    if (index >= 0 && index < allProfiles.length) {
      setSelectedProfileIndex(index);
      const selectedProfile = allProfiles[index];
      // ProfileResponse has profile and templateText fields
      setCurrentProfileData(selectedProfile);
      if (selectedProfile.templateText) {
        setEditedTemplateText(selectedProfile.templateText);
        setOriginalTemplateText(selectedProfile.templateText);
      }
      if (typeof onProfileUpdate === 'function') {
        onProfileUpdate(selectedProfile);
      }
    }
  };

  return (
    <div className="profile-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2>{heading}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="template-selector" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#444' }}>
              Change Template:
            </label>
            <select
              id="template-selector"
              value={templateType || 'professional'}
              onChange={handleTemplateChange}
              disabled={!profileId || isChangingTemplate}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                cursor: isChangingTemplate ? 'not-allowed' : 'pointer',
                backgroundColor: isChangingTemplate ? '#f5f5f5' : 'white',
                minWidth: '180px'
              }}
            >
              {templateOptions
                .filter(option => option.value !== 'cover' || templateType === 'cover')
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
            {isChangingTemplate && (
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Loading...</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="font-selector" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#444' }}>
              Change Font:
            </label>
            <select
              id="font-selector"
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                cursor: 'pointer',
                backgroundColor: 'white',
                minWidth: '180px',
                fontFamily: selectedFont
              }}
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsInlineEditing((prev) => !prev)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              backgroundColor: isInlineEditing ? '#3b82f6' : 'white',
              color: isInlineEditing ? 'white' : '#1f2933',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            {isInlineEditing ? 'Done Inline Editing' : 'Inline Edit Text'}
          </button>
        </div>
      </div>

      {/* Display all saved profiles (collapsed by default, explicit toggle) */}
      {!hideProfilesList && showAllProfiles && allProfiles.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            marginBottom: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#111827'
          }}>
            Saved Profiles {allProfiles.length > 3 ? `(Showing 3 of ${allProfiles.length})` : `(${allProfiles.length})`}
          </h3>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {allProfiles.slice(0, 3).map((profileResponse, index) => {
              const profile = profileResponse.profile || profileResponse;
              const profileDate = profile?.createdAt 
                ? new Date(profile.createdAt).toLocaleDateString()
                : `Profile ${index + 1}`;
              const isSelected = index === selectedProfileIndex;
              return (
                <button
                  key={profile?.id || index}
                  onClick={() => handleProfileSelect(index)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                    backgroundColor: isSelected ? '#dbeafe' : 'white',
                    color: isSelected ? '#1e40af' : '#374151',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: isSelected ? '600' : '500',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  <span>Profile {index + 1}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    opacity: 0.7
                  }}>
                    {profileDate}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="profile-card-wrapper"
        style={{ position: 'relative' }}
        ref={templateRef}
      >
        <TemplatePreview
          templateType={templateType}
          templateText={templateText}
          profile={profile}
          templateIcon={templateIcon}
          templateName={templateName}
          templateDescription={templateDescription}
          templateCss={templateCss}
          selectedFont={selectedFont}
          isEditable={isInlineEditing}
          onContentChange={handleInlineContentInput}
        />
        
        {/* Text Formatting Toolbar */}
        {showToolbar && selectedText && (
          <div
            className="text-formatting-toolbar"
            style={{
              position: 'fixed',
              top: `${toolbarPosition.top}px`,
              left: `${toolbarPosition.left}px`,
              backgroundColor: '#2d3748',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '200px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <button
              onClick={handleCopy}
              title="Copy"
              style={{
                backgroundColor: '#4a5568',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6578'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4a5568'}
            >
              📋 Copy
            </button>
            <button
              onClick={() => applyFormatting('bold')}
              title="Bold"
              style={{
                backgroundColor: '#4a5568',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6578'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4a5568'}
            >
              B
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              title="Italic"
              style={{
                backgroundColor: '#4a5568',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontStyle: 'italic',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6578'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4a5568'}
            >
              I
            </button>
            <button
              onClick={() => applyFormatting('underline')}
              title="Underline"
              style={{
                backgroundColor: '#4a5568',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6578'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4a5568'}
            >
              U
            </button>
            <button
              onClick={handleAIEnhance}
              title="Enhance with AI"
              disabled={isEnhancing}
              style={{
                backgroundColor: isEnhancing ? '#2d3748' : '#10b981',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: isEnhancing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isEnhancing ? 0.6 : 1,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isEnhancing) e.target.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                if (!isEnhancing) e.target.style.backgroundColor = '#10b981';
              }}
            >
              {isEnhancing ? '✨...' : '✨ AI'}
            </button>
          </div>
        )}
      </div>

      <div className="profile-actions" style={{ position: 'relative', zIndex: 10, isolation: 'isolate' }}>
        <button
          type="button"
          onClick={handleSaveProfile}
          className="profile-btn"
          disabled={!profileId || isSaving}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: isSaving || !profileId ? 'not-allowed' : 'pointer',
            opacity: isSaving || !profileId ? 0.6 : 1,
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            minHeight: '40px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isSaving ? 'Saving...' : '💾 Save Profile'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="profile-btn btn-pdf"
          disabled={!profileId || isDownloading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            minHeight: '40px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isDownloading ? 'Downloading...' : 'Download Profile (PDF)'}
        </button>
        <button
          type="button"
          onClick={handleEditClick}
          className="profile-btn btn-edit"
          disabled={!profileId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            minHeight: '40px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          Edit Profile
        </button>
        <button
          type="button"
          onClick={() => onEnhanceRequest?.(templateText)}
          className="profile-btn"
          disabled={!templateText}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: !templateText ? 'not-allowed' : 'pointer',
            opacity: !templateText ? 0.6 : 1,
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            minHeight: '40px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          ✨ Enhance with AI
        </button>
        <button
          type="button"
          onClick={() => onChatbotRequest?.()}
          className="profile-btn"
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            minHeight: '40px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          💬 Chat with Saathi
        </button>
      </div>
      {downloadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm" style={{ marginTop: '20px' }}>
          {downloadError}
        </div>
      )}
      {saveMessage && (
        <div className={`p-3 border rounded text-sm ${saveMessage.type === 'success' 
          ? 'bg-green-50 border-green-200 text-green-700' 
          : 'bg-red-50 border-red-200 text-red-700'}`} 
          style={{ marginTop: '20px' }}>
          {saveMessage.text}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-700">Profile Information</h4>
                <p className="text-sm text-gray-500 mt-1">Your personal and academic details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Name</span>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Phone Number</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formValues.phone}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., (123) 456-7890"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Date of Birth</span>
                  <input
                    type="date"
                    name="dob"
                    value={formValues.dob}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">LinkedIn</span>
                  <input
                    type="text"
                    name="linkedin"
                    value={formValues.linkedin}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Institute</span>
                  <input
                    type="text"
                    name="institute"
                    value={formValues.institute}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Current Degree</span>
                  <input
                    type="text"
                    name="currentDegree"
                    value={formValues.currentDegree}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Branch</span>
                  <input
                    type="text"
                    name="branch"
                    value={formValues.branch}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Year of Study</span>
                  <input
                    type="text"
                    name="yearOfStudy"
                    value={formValues.yearOfStudy}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                {/* Only show Certifications if it has a value */}
                {(formValues.certifications && formValues.certifications.trim()) && (
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-sm font-medium">Certifications</span>
                    <textarea
                      name="certifications"
                      value={formValues.certifications}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                      rows={2}
                    />
                  </label>
                )}

                {/* Only show Achievements if it has a value */}
                {(formValues.achievements && formValues.achievements.trim()) && (
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-sm font-medium">Achievements</span>
                    <textarea
                      name="achievements"
                      value={formValues.achievements}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                      rows={2}
                    />
                  </label>
                )}

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Technical Skills</span>
                  <textarea
                    name="technicalSkills"
                    value={formValues.technicalSkills}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Soft Skills</span>
                  <textarea
                    name="softSkills"
                    value={formValues.softSkills}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Interests</span>
                  <textarea
                    name="interests"
                    value={formValues.interests}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                    placeholder="e.g., Product design, Systems thinking"
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Hobbies</span>
                  <textarea
                    name="hobbies"
                    value={formValues.hobbies}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                    placeholder="e.g., Photography, Learning new languages"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Template Type</span>
                  <select
                    name="templateType"
                    value={formValues.templateType}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    {templateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Separator between Profile and Cover Letter sections */}
              <div className="my-6 border-t-2 border-gray-300"></div>
              
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-700">Cover Letter Details</h4>
                <p className="text-sm text-gray-500 mt-1">Provide company-specific information for your cover letter</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Hiring Manager Name</span>
                  <input
                    type="text"
                    name="hiringManagerName"
                    value={formValues.hiringManagerName}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Company Name</span>
                  <input
                    type="text"
                    name="companyName"
                    value={formValues.companyName}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Company Address</span>
                  <textarea
                    name="companyAddress"
                    value={formValues.companyAddress}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Position Title</span>
                  <input
                    type="text"
                    name="positionTitle"
                    value={formValues.positionTitle}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Relevant Experience</span>
                  <textarea
                    name="relevantExperience"
                    value={formValues.relevantExperience}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Key Achievement</span>
                  <input
                    type="text"
                    name="keyAchievement"
                    value={formValues.keyAchievement}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Strengths</span>
                  <textarea
                    name="strengths"
                    value={formValues.strengths}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Closing Note</span>
                  <textarea
                    name="closingNote"
                    value={formValues.closingNote}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </label>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      name="hasInternship"
                      checked={formValues.hasInternship}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    <span>Completed Internship</span>
                  </label>
                  {formValues.hasInternship && (
                    <textarea
                      name="internshipDetails"
                      value={formValues.internshipDetails}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                      rows={2}
                      required={formValues.hasInternship}
                      placeholder="Share internship projects, roles, or key takeaways"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      name="hasExperience"
                      checked={formValues.hasExperience}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    <span>Professional Experience</span>
                  </label>
                  {formValues.hasExperience && (
                    <textarea
                      name="experienceDetails"
                      value={formValues.experienceDetails}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                      rows={2}
                      required={formValues.hasExperience}
                      placeholder="Mention organisations, roles, and key contributions"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && pendingTemplateChange && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <ImageUploadForm
              onSubmit={handlePhotoUpload}
              onBack={handlePhotoUploadCancel}
              profileData={profile || currentProfileData?.profile || currentProfileData}
              templateLabel={PHOTO_TEMPLATE_LABELS[pendingTemplateChange] || 'selected template'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDisplay;

