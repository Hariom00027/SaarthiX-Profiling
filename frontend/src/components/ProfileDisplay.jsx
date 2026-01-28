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
  const [editProfileTab, setEditProfileTab] = useState('profiling'); // 'profiling' or 'coverLetter'
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
    <div className="profile-display-container">
      {/* Responsive Styles */}
      <style>{`
        .profile-display-container {
          min-height: calc(100vh - 70px);
          background: linear-gradient(180deg, #f8f9fa 0%, #e8f4f8 50%, #f5e6f0 100%);
          padding: 32px 24px;
          box-sizing: border-box;
        }
        
        .profile-display-header {
          max-width: 1100px;
          margin: 0 auto 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .profile-display-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }
        
        .profile-display-subtitle {
          font-size: 0.95rem;
          color: #6b7280;
          margin: 0;
        }
        
        .profile-enhance-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 28px;
          border: none;
          background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
          transition: all 0.2s ease;
        }
        
        .profile-enhance-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .profile-main-card {
          max-width: 1100px;
          margin: 0 auto;
          background-color: white;
          border-radius: 24px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }
        
        .profile-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .profile-controls-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .profile-select-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .profile-select-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
        }
        
        .profile-select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-size: 0.85rem;
          cursor: pointer;
          background-color: white;
          min-width: 140px;
          color: #374151;
        }
        
        .profile-icon-buttons {
          display: flex;
          gap: 8px;
          margin-left: 8px;
        }
        
        .profile-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background-color: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .profile-icon-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        .profile-icon-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .profile-inline-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          color: #3b82f6;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .profile-card-wrapper {
          position: relative;
          background-color: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        
        /* Tablet Styles */
        @media (max-width: 1024px) {
          .profile-display-container {
            padding: 24px 16px;
          }
          
          .profile-main-card {
            padding: 20px;
            border-radius: 20px;
          }
          
          .profile-card-wrapper {
            padding: 20px;
          }
        }
        
        /* Mobile Styles */
        @media (max-width: 768px) {
          .profile-display-container {
            padding: 16px 12px;
          }
          
          .profile-display-header {
            flex-direction: column;
            gap: 12px;
            margin-bottom: 16px;
          }
          
          .profile-display-title {
            font-size: 1.35rem;
          }
          
          .profile-display-subtitle {
            font-size: 0.85rem;
          }
          
          .profile-enhance-btn {
            width: 100%;
            justify-content: center;
            padding: 10px 20px;
            font-size: 0.9rem;
          }
          
          .profile-main-card {
            padding: 16px;
            border-radius: 16px;
          }
          
          .profile-controls-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          
          .profile-controls-right {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          
          .profile-select-group {
            width: 100%;
          }
          
          .profile-select {
            width: 100%;
            min-width: unset;
            padding: 10px 12px;
          }
          
          .profile-icon-buttons {
            justify-content: center;
            margin-left: 0;
            margin-top: 4px;
          }
          
          .profile-icon-btn {
            width: 44px;
            height: 44px;
            flex: 1;
            max-width: 80px;
          }
          
          .profile-inline-edit-btn {
            width: 100%;
            justify-content: center;
            padding: 10px 16px;
          }
          
          .profile-card-wrapper {
            padding: 12px;
            border-radius: 12px;
          }
          
          .profile-saved-profiles {
            padding: 12px !important;
          }
          
          .profile-saved-profiles h3 {
            font-size: 0.85rem !important;
          }
          
          .profile-saved-profiles button {
            font-size: 0.8rem !important;
            padding: 6px 10px !important;
          }
        }
        
        /* Small Mobile Styles */
        @media (max-width: 480px) {
          .profile-display-container {
            padding: 12px 8px;
          }
          
          .profile-display-header {
            gap: 10px;
            margin-bottom: 12px;
          }
          
          .profile-display-title {
            font-size: 1.2rem;
          }
          
          .profile-display-subtitle {
            font-size: 0.8rem;
          }
          
          .profile-enhance-btn {
            padding: 10px 16px;
            font-size: 0.85rem;
            gap: 6px;
          }
          
          .profile-main-card {
            padding: 12px;
            border-radius: 14px;
          }
          
          .profile-select {
            font-size: 0.8rem;
            padding: 8px 10px;
          }
          
          .profile-select-label {
            font-size: 0.7rem;
          }
          
          .profile-icon-btn {
            width: 40px;
            height: 40px;
          }
          
          .profile-inline-edit-btn {
            font-size: 0.85rem;
            padding: 8px 12px;
          }
          
          .profile-card-wrapper {
            padding: 10px;
            border-radius: 10px;
          }
        }
        
        /* Extra Small Mobile */
        @media (max-width: 360px) {
          .profile-display-title {
            font-size: 1.1rem;
          }
          
          .profile-display-subtitle {
            font-size: 0.75rem;
          }
          
          .profile-enhance-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
          }
          
          .profile-main-card {
            padding: 10px;
          }
          
          .profile-card-wrapper {
            padding: 8px;
          }
        }
        
        /* Edit Modal Responsive Styles */
        .profile-edit-modal {
          border-radius: 16px;
        }
        
        .profile-edit-modal-header {
          padding: 24px 32px 0;
        }
        
        .profile-edit-form {
          padding: 24px 32px 32px;
        }
        
        .profile-edit-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .profile-edit-form-row {
          grid-column: 1 / -1;
        }
        
        .profile-edit-toggle-group {
          display: flex;
          background-color: #f3f4f6;
          border-radius: 12px;
          padding: 4px;
          margin-top: 20px;
          gap: 4px;
        }
        
        .profile-edit-toggle-btn {
          flex: 1;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .profile-edit-section {
          margin-bottom: 28px;
        }
        
        .profile-edit-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .profile-edit-section-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .profile-edit-section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #3b82f6;
        }
        
        .profile-edit-input-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin-bottom: 6px;
        }
        
        .profile-edit-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #374151;
          outline: none;
          box-sizing: border-box;
        }
        
        .profile-edit-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #374151;
          outline: none;
          box-sizing: border-box;
          resize: vertical;
          min-height: 100px;
        }
        
        .profile-edit-btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .profile-edit-cancel-btn {
          padding: 10px 24px;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .profile-edit-save-btn {
          padding: 10px 24px;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          background-color: #3b82f6;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .profile-edit-save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .profile-edit-modal {
            border-radius: 12px;
            margin: 8px;
          }
          
          .profile-edit-modal-header {
            padding: 16px 16px 0;
          }
          
          .profile-edit-modal-header h2 {
            font-size: 1.25rem !important;
          }
          
          .profile-edit-modal-header p {
            font-size: 0.8rem !important;
          }
          
          .profile-edit-form {
            padding: 16px 16px 20px;
          }
          
          .profile-edit-form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .profile-edit-toggle-group {
            margin-top: 16px;
          }
          
          .profile-edit-toggle-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
          }
          
          .profile-edit-section {
            margin-bottom: 20px;
          }
          
          .profile-edit-section-header {
            margin-bottom: 14px;
          }
          
          .profile-edit-section-icon {
            width: 28px;
            height: 28px;
          }
          
          .profile-edit-section-title {
            font-size: 0.9rem;
          }
          
          .profile-edit-input-label {
            font-size: 0.8rem;
            margin-bottom: 4px;
          }
          
          .profile-edit-input,
          .profile-edit-textarea {
            padding: 8px 12px;
            font-size: 0.8rem;
          }
          
          .profile-edit-btn-row {
            flex-direction: column-reverse;
            gap: 8px;
            margin-top: 16px;
            padding-top: 16px;
          }
          
          .profile-edit-cancel-btn,
          .profile-edit-save-btn {
            width: 100%;
            padding: 12px 20px;
          }
          
          .profile-chat-btn-container {
            margin-top: 20px !important;
          }
          
          .profile-chat-btn {
            padding: 12px 24px !important;
            font-size: 0.9rem !important;
            width: 100% !important;
            justify-content: center !important;
          }
          
          .profile-message-box {
            margin: 16px 12px 0 !important;
            padding: 10px 14px !important;
            font-size: 0.8rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .profile-edit-modal-header h2 {
            font-size: 1.1rem !important;
          }
          
          .profile-edit-modal-header p {
            font-size: 0.75rem !important;
          }
          
          .profile-edit-toggle-btn {
            padding: 6px 10px;
            font-size: 0.75rem;
          }
          
          .profile-edit-section-title {
            font-size: 0.85rem;
          }
          
          .profile-edit-input-label {
            font-size: 0.75rem;
          }
          
          .profile-edit-input,
          .profile-edit-textarea {
            padding: 8px 10px;
            font-size: 0.75rem;
          }
          
          .profile-chat-btn {
            padding: 10px 20px !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
      
      {/* Page Header */}
      <div className="profile-display-header">
        <div>
          <h1 className="profile-display-title">
            {heading}
          </h1>
          <p className="profile-display-subtitle">
            Refine your professional narrative with our AI-powered tools.
          </p>
        </div>
        <button
          type="button"
          className="profile-enhance-btn"
          onClick={() => onEnhanceRequest?.(templateText)}
          disabled={!templateText}
        >
          <span style={{ fontSize: '1.1rem' }}>✨</span>
          Enhance with AI
        </button>
      </div>

      {/* Main Card */}
      <div className="profile-main-card">
        {/* Controls Row */}
        <div className="profile-controls-row">
          {/* Left - Inline Edit Toggle */}
          <button
            type="button"
            className="profile-inline-edit-btn"
            onClick={() => setIsInlineEditing((prev) => !prev)}
            style={{
              backgroundColor: isInlineEditing ? '#dbeafe' : 'transparent',
            }}
          >
            <span>✏️</span>
            {isInlineEditing ? 'Exit Edit Mode' : 'Inline Edit Mode'}
          </button>

          {/* Right - Template, Font, and Action Buttons */}
          <div className="profile-controls-right">
            <div className="profile-select-group">
              <label className="profile-select-label">
                Change Template
              </label>
              <select
                id="template-selector"
                className="profile-select"
                value={templateType || 'professional'}
                onChange={handleTemplateChange}
                disabled={!profileId || isChangingTemplate}
                style={{
                  cursor: isChangingTemplate ? 'not-allowed' : 'pointer',
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
            </div>

            <div className="profile-select-group">
              <label className="profile-select-label">
                Change Font
              </label>
              <select
                id="font-selector"
                className="profile-select"
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                style={{
                  fontFamily: selectedFont,
                }}
              >
                {fontOptions.map((option) => (
                  <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon Buttons */}
            <div className="profile-icon-buttons">
              {/* Download Button */}
              <button
                type="button"
                className="profile-icon-btn"
                onClick={handleDownload}
                disabled={!profileId || isDownloading}
                title="Download PDF"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>

              {/* Save Button */}
              <button
                type="button"
                className="profile-icon-btn"
                onClick={handleSaveProfile}
                disabled={!profileId || isSaving}
                title="Save Profile"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
              </button>

              {/* Edit Button */}
              <button
                type="button"
                className="profile-icon-btn"
                onClick={handleEditClick}
                disabled={!profileId}
                title="Edit Profile"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Display all saved profiles (collapsed by default, explicit toggle) */}
        {!hideProfilesList && showAllProfiles && allProfiles.length > 0 && (
          <div className="profile-saved-profiles" style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              marginBottom: '12px',
              fontSize: '0.95rem',
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
                const profileItem = profileResponse.profile || profileResponse;
                const profileDate = profileItem?.createdAt 
                  ? new Date(profileItem.createdAt).toLocaleDateString()
                  : `Profile ${index + 1}`;
                const isSelected = index === selectedProfileIndex;
                return (
                  <button
                    key={profileItem?.id || index}
                    onClick={() => handleProfileSelect(index)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                      backgroundColor: isSelected ? '#eff6ff' : 'white',
                      color: isSelected ? '#1e40af' : '#374151',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? '600' : '500',
                      transition: 'all 0.2s',
                      flex: '1 1 auto',
                      minWidth: '120px',
                      maxWidth: '200px',
                      textAlign: 'center'
                    }}
                  >
                    Profile {index + 1} • {profileDate}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Profile Content Card */}
        <div
          className="profile-card-wrapper"
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

      </div>

      {/* Chat with Saathi Button - Centered */}
      <div className="profile-chat-btn-container" style={{
        maxWidth: '1100px',
        margin: '32px auto 0',
        textAlign: 'center',
        padding: '0 12px'
      }}>
        <button
          type="button"
          className="profile-chat-btn"
          onClick={() => onChatbotRequest?.()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 32px',
            borderRadius: '28px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s ease',
            width: 'auto',
            maxWidth: '100%'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Chat with Saathi
        </button>
      </div>

      {/* Error/Success Messages */}
      {downloadError && (
        <div className="profile-message-box" style={{
          maxWidth: '1100px',
          margin: '20px auto 0',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          {downloadError}
        </div>
      )}
      {saveMessage && (
        <div className="profile-message-box" style={{
          maxWidth: '1100px',
          margin: '20px auto 0',
          padding: '12px 16px',
          backgroundColor: saveMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${saveMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '8px',
          color: saveMessage.type === 'success' ? '#16a34a' : '#dc2626',
          fontSize: '0.875rem'
        }}>
          {saveMessage.text}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div 
            className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto profile-edit-modal"
            style={{
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Header */}
            <div className="profile-edit-modal-header" style={{ padding: '20px 16px 0', position: 'relative' }}>
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '32px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#6b7280'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
              >
                ×
              </button>

              {/* Centered Title and Subtitle */}
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Profile Details
                </h2>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  margin: 0
                }}>
                  Update your personal and academic details to personalize your career roadmap.
                </p>
            </div>

              {/* Toggle Button */}
              <div className="profile-edit-toggle-group">
                <button
                  type="button"
                  className="profile-edit-toggle-btn"
                  onClick={() => setEditProfileTab('profiling')}
                  style={{
                    backgroundColor: editProfileTab === 'profiling' ? 'white' : 'transparent',
                    color: editProfileTab === 'profiling' ? '#3b82f6' : '#6b7280',
                    boxShadow: editProfileTab === 'profiling' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Profiling
                </button>
                <button
                  type="button"
                  className="profile-edit-toggle-btn"
                  onClick={() => setEditProfileTab('coverLetter')}
                  style={{
                    backgroundColor: editProfileTab === 'coverLetter' ? 'white' : 'transparent',
                    color: editProfileTab === 'coverLetter' ? '#3b82f6' : '#6b7280',
                    boxShadow: editProfileTab === 'coverLetter' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Cover Letter
                </button>
              </div>
              </div>

            <form onSubmit={handleSubmit} className="profile-edit-form">
              {/* Profiling Sections */}
              {editProfileTab === 'profiling' && (
                <>
              {/* Personal Details Section */}
              <div className="profile-edit-section">
                <div className="profile-edit-section-header">
                  <div className="profile-edit-section-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <span className="profile-edit-section-title">
                    Personal Details
                  </span>
                </div>

                <div className="profile-edit-form-grid">
                  <div>
                    <label className="profile-edit-input-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formValues.name}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formValues.email}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formValues.phone}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formValues.dob}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formValues.linkedin}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Background Section */}
              <div className="profile-edit-section">
                <div className="profile-edit-section-header">
                  <div className="profile-edit-section-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </div>
                  <span className="profile-edit-section-title">
                    Academic Background
                  </span>
                </div>

                <div className="profile-edit-form-grid">
                  <div>
                    <label className="profile-edit-input-label">
                      Institute / University
                    </label>
                    <input
                      type="text"
                      name="institute"
                      value={formValues.institute}
                      onChange={handleInputChange}
                      required
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Current Degree
                    </label>
                    <input
                      type="text"
                      name="currentDegree"
                      value={formValues.currentDegree}
                      onChange={handleInputChange}
                      required
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Branch / Specialization
                    </label>
                    <input
                      type="text"
                      name="branch"
                      value={formValues.branch}
                      onChange={handleInputChange}
                      required
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Year of Study
                    </label>
                    <input
                      type="text"
                      name="yearOfStudy"
                      value={formValues.yearOfStudy}
                      onChange={handleInputChange}
                      required
                      className="profile-edit-input"
                    />
                  </div>

                  {/* Certifications - only show if has value */}
                  {(formValues.certifications && formValues.certifications.trim()) && (
                    <div className="profile-edit-form-row">
                      <label className="profile-edit-input-label">
                        Certifications
                      </label>
                      <textarea
                        name="certifications"
                        value={formValues.certifications}
                        onChange={handleInputChange}
                        rows={2}
                        className="profile-edit-textarea"
                      />
                    </div>
                  )}

                  {/* Achievements - only show if has value */}
                  {(formValues.achievements && formValues.achievements.trim()) && (
                    <div className="profile-edit-form-row">
                      <label className="profile-edit-input-label">
                        Achievements
                      </label>
                      <textarea
                        name="achievements"
                        value={formValues.achievements}
                        onChange={handleInputChange}
                        rows={2}
                        className="profile-edit-textarea"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Skills & Interests Section */}
              <div className="profile-edit-section">
                <div className="profile-edit-section-header">
                  <div className="profile-edit-section-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  <span className="profile-edit-section-title">
                    Skills & Interests
                  </span>
                </div>

                <div className="profile-edit-form-grid">
                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label">
                      Technical Skills
                    </label>
                    <textarea
                      name="technicalSkills"
                      value={formValues.technicalSkills}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      placeholder="e.g., Python, JavaScript, Machine Learning"
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label">
                      Soft Skills
                    </label>
                    <textarea
                      name="softSkills"
                      value={formValues.softSkills}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label">
                      Interests
                    </label>
                    <textarea
                      name="interests"
                      value={formValues.interests}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      placeholder="e.g., Product design, Systems thinking"
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label">
                      Hobbies
                    </label>
                    <textarea
                      name="hobbies"
                      value={formValues.hobbies}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      placeholder="e.g., Photography, Learning new languages"
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Template Type
                    </label>
                    <select
                      name="templateType"
                      value={formValues.templateType}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                      style={{ backgroundColor: 'white' }}
                    >
                      {templateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
                </>
              )}

              {/* Cover Letter Section */}
              {editProfileTab === 'coverLetter' && (
              <div className="profile-edit-section">
                <div className="profile-edit-section-header">
                  <div className="profile-edit-section-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <span className="profile-edit-section-title">
                    Cover Letter Details
                  </span>
                </div>

                <div className="profile-edit-form-grid">
                  <div>
                    <label className="profile-edit-input-label">
                      Hiring Manager Name
                    </label>
                    <input
                      type="text"
                      name="hiringManagerName"
                      value={formValues.hiringManagerName}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formValues.companyName}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Company Address
                    </label>
                    <textarea
                      name="companyAddress"
                      value={formValues.companyAddress}
                      onChange={handleInputChange}
                      rows={2}
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Position Title
                    </label>
                    <input
                      type="text"
                      name="positionTitle"
                      value={formValues.positionTitle}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label">
                      Relevant Experience
                    </label>
                    <textarea
                      name="relevantExperience"
                      value={formValues.relevantExperience}
                      onChange={handleInputChange}
                      rows={2}
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Key Achievement
                    </label>
                    <input
                      type="text"
                      name="keyAchievement"
                      value={formValues.keyAchievement}
                      onChange={handleInputChange}
                      className="profile-edit-input"
                    />
                  </div>

                  <div>
                    <label className="profile-edit-input-label">
                      Strengths
                    </label>
                    <textarea
                      name="strengths"
                      value={formValues.strengths}
                      onChange={handleInputChange}
                      rows={2}
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label">
                      Closing Note
                    </label>
                    <textarea
                      name="closingNote"
                      value={formValues.closingNote}
                      onChange={handleInputChange}
                      rows={2}
                      className="profile-edit-textarea"
                    />
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="hasInternship"
                        checked={formValues.hasInternship}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                      />
                      Completed Internship
                    </label>
                    {formValues.hasInternship && (
                      <textarea
                        name="internshipDetails"
                        value={formValues.internshipDetails}
                        onChange={handleInputChange}
                        rows={2}
                        required={formValues.hasInternship}
                        placeholder="Share internship projects, roles, or key takeaways"
                        className="profile-edit-textarea"
                        style={{ marginTop: '8px' }}
                      />
                    )}
                  </div>

                  <div className="profile-edit-form-row">
                    <label className="profile-edit-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="hasExperience"
                        checked={formValues.hasExperience}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                      />
                      Professional Experience
                    </label>
                    {formValues.hasExperience && (
                      <textarea
                        name="experienceDetails"
                        value={formValues.experienceDetails}
                        onChange={handleInputChange}
                        rows={2}
                        required={formValues.hasExperience}
                        placeholder="Mention organisations, roles, and key contributions"
                        className="profile-edit-textarea"
                        style={{
                          marginTop: '8px'
                        }}
                    />
                  )}
                </div>
              </div>
              </div>
              )}

              {/* Footer Buttons */}
              <div className="profile-edit-btn-row">
                <button
                  type="button"
                  className="profile-edit-cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-edit-save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && pendingTemplateChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-[600px] w-full max-h-[90vh] overflow-auto shadow-xl p-4 sm:p-6">
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

