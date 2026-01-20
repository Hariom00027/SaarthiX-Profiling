import React, { useState, useEffect, useRef } from 'react';
import { parseResume } from '../api';
import { notifyError, notifySuccess } from '../utils/notifications';

const ProfileForm = ({ onSuccess, onBack, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    linkedin: '',
    institute: '',
    currentDegree: '',
    branch: '',
    yearOfStudy: '',
    certifications: '',
    achievements: '',
    technicalSkills: '',
    softSkills: '',
    interests: '',
    hobbies: '',
    hasInternship: false,
    internshipDetails: '',
    hasExperience: false,
    experienceDetails: '',
    workExperience: '',
    schoolType: '',
    experienceLevel: '',
    studentStatus: '',
    companyName: '',
    designation: '',
    yearsOfExperience: '',
    yearOfJoining: '',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        dob: initialData.dob || '',
        linkedin: initialData.linkedin || '',
        institute: initialData.institute || '',
        currentDegree: initialData.currentDegree || '',
        branch: initialData.branch || '',
        yearOfStudy: initialData.yearOfStudy || '',
        certifications: initialData.certifications || '',
        achievements: initialData.achievements || '',
        technicalSkills: initialData.technicalSkills || '',
        softSkills: initialData.softSkills || '',
        interests: initialData.interests || '',
        hobbies: initialData.hobbies || '',
        hasInternship: initialData.hasInternship || false,
        internshipDetails: initialData.internshipDetails || '',
        hasExperience: initialData.hasExperience || false,
        experienceDetails: initialData.experienceDetails || '',
        workExperience: initialData.workExperience || '',
        schoolType: initialData.schoolType || '',
        experienceLevel: initialData.experienceLevel || '',
        studentStatus: initialData.studentStatus || '',
        companyName: initialData.companyName || '',
        designation: initialData.designation || '',
        yearsOfExperience: initialData.yearsOfExperience || '',
        yearOfJoining: initialData.yearOfJoining || '',
      }));
    }
  }, [initialData]);

  const steps = [
    {
      id: 'basics',
      type: 'form',
      title: 'Let’s personalize your experience',
      subtitle: 'Share the essentials so we can tailor the templates for you.',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: 'e.g., (123) 456-7890' },
        { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
        { name: 'linkedin', label: 'LinkedIn', type: 'url', required: false, placeholder: 'https://linkedin.com/in/you' },
      ],
    },
    {
      id: 'education',
      type: 'education',
      title: 'Education snapshot',
      subtitle: 'Answer one question at a time – each response unlocks the next.',
      question: {
        label: 'What kind of school is it?',
        field: 'schoolType',
        options: [
          { label: 'High School', value: 'high-school' },
          { label: 'Trade School', value: 'trade-school' },
          { label: 'College', value: 'college' },
          { label: 'Graduate School', value: 'graduate-school' },
        ],
      },
      followUp: {
        label: 'What did you study?',
        fields: [
          { name: 'currentDegree', label: 'Degree', required: true },
          { name: 'branch', label: 'Field of Study', required: true },
          { name: 'institute', label: 'Institute / University', required: true },
          { name: 'yearOfStudy', label: 'Year of Study', required: true },
        ],
      },
    },
    {
      id: 'experience',
      type: 'experience',
      title: 'Experience level',
      subtitle: 'Tell us how far along you are – we’ll adapt the prompts accordingly.',
      question: {
        label: 'How long have you been working?',
        field: 'experienceLevel',
        options: [
          { label: 'No Experience', value: 'none' },
          { label: 'Less than 3 Years', value: 'lt3' },
          { label: '3-5 Years', value: '3-5' },
          { label: '5-10 Years', value: '5-10' },
          { label: '10+ Years', value: '10+' },
        ],
      },
      followUp: {
        label: 'Are you a student?',
        field: 'studentStatus',
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Recent Graduate', value: 'recent' },
        ],
        autoAdvance: true,
      },
    },
    {
      id: 'skills',
      type: 'form',
      title: 'Skills & highlights',
      subtitle: 'List what makes you stand out.',
      fields: [
        { name: 'certifications', label: 'Certifications', type: 'textarea', required: false, rows: 2 },
        { name: 'achievements', label: 'Achievements', type: 'textarea', required: false, rows: 2 },
        { name: 'technicalSkills', label: 'Technical Skills', type: 'textarea', required: true, rows: 3, placeholder: 'e.g., React, SQL, Canva' },
        { name: 'softSkills', label: 'Soft Skills', type: 'textarea', required: true, rows: 3, placeholder: 'e.g., Leadership, Communication' },
          { name: 'interests', label: 'Interests', type: 'textarea', required: true, rows: 3, placeholder: 'e.g., Product design, Data storytelling' },
          { name: 'hobbies', label: 'Hobbies', type: 'textarea', required: true, rows: 3, placeholder: 'e.g., Photography, Learning new languages' },
      ],
    },
    {
      id: 'work',
      type: 'internships',
      title: 'Internships & experience',
      subtitle: 'Toggle what applies to you so we can request the right details.',
    },
  ];

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'hasInternship' && !checked) {
        updated.internshipDetails = '';
      }
      if (name === 'hasExperience' && !checked) {
        updated.experienceDetails = '';
      }
      return updated;
    });
    setStepError('');
  };

  const handleChoiceSelect = (field, value, options = {}) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      setStepError('');

      // Clear company details if experience level is changed to "none"
      if (field === 'experienceLevel') {
        if (value === 'none') {
          updated.companyName = '';
          updated.designation = '';
          updated.yearsOfExperience = '';
          updated.yearOfJoining = '';
          updated.workExperience = '';
        }
      }

      if (options.autoAdvance) {
        setTimeout(() => {
          goToNextStep(updated);
        }, 350);
      }

      return updated;
    });
  };

  const validateStep = (data = formData, stepIndex = currentStep) => {
    const step = steps[stepIndex];
    if (!step) {
      return { valid: true };
    }

    if (step.type === 'form') {
      for (const field of step.fields) {
        if (field.required && !String(data[field.name] || '').trim()) {
          return { valid: false, message: `${field.label} is required.` };
        }
      }
      return { valid: true };
    }

    if (step.type === 'education') {
      if (!data.schoolType) {
        return { valid: false, message: 'Please choose the type of school.' };
      }
      for (const field of step.followUp.fields) {
        if (field.required && !String(data[field.name] || '').trim()) {
          return { valid: false, message: `${field.label} is required.` };
        }
      }
      return { valid: true };
    }

    if (step.type === 'experience') {
      if (!data.experienceLevel) {
        return { valid: false, message: 'Select your experience level to continue.' };
      }
      // Only require student status if user has no experience
      if (data.experienceLevel === 'none' && !data.studentStatus) {
        return { valid: false, message: 'Let us know if you are a student.' };
      }
      // If user has experience (not "none"), require company details
      if (data.experienceLevel && data.experienceLevel !== 'none') {
        if (!String(data.companyName || '').trim()) {
          return { valid: false, message: 'Company name is required.' };
        }
        if (!String(data.designation || '').trim()) {
          return { valid: false, message: 'Designation is required.' };
        }
        if (!String(data.yearsOfExperience || '').trim()) {
          return { valid: false, message: 'Years of experience is required.' };
        }
        if (!String(data.yearOfJoining || '').trim()) {
          return { valid: false, message: 'Year of joining is required.' };
        }
        // Also require work experience details
        if (!String(data.workExperience || '').trim()) {
          return { valid: false, message: 'Please mention where you have worked or your work experience.' };
        }
      }
      return { valid: true };
    }

    if (step.type === 'internships') {
      if (data.hasInternship && !String(data.internshipDetails || '').trim()) {
        return { valid: false, message: 'Share your internship details.' };
      }
      if (data.hasExperience && !String(data.experienceDetails || '').trim()) {
        return { valid: false, message: 'Share your professional experience highlights.' };
      }
      return { valid: true };
    }

    return { valid: true };
  };

  const goToNextStep = (overrideData) => {
    const payload = overrideData || formData;
    const { valid, message } = validateStep(payload);
    if (!valid) {
      setStepError(message || 'Please complete this step.');
      return;
    }
    setStepError('');
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const goToPreviousStep = () => {
    setStepError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid, message } = validateStep();
    if (!valid) {
      setStepError(message || 'Please complete this step.');
      return;
    }
    setStepError('');
    try {
      setIsSubmitting(true);
      // Filter out empty certifications and achievements before submitting
      const cleanedData = { ...formData };
      if (!cleanedData.certifications || !cleanedData.certifications.trim()) {
        cleanedData.certifications = '';
      }
      if (!cleanedData.achievements || !cleanedData.achievements.trim()) {
        cleanedData.achievements = '';
      }
      onSuccess(cleanedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      notifyError('Please upload a PDF or DOCX file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      notifyError('File size must be less than 10MB');
      return;
    }

    try {
      setIsParsingResume(true);
      const result = await parseResume(file);
      
      if (result.success && result.data) {
        // Auto-fill form with parsed data
        setFormData((prev) => ({
          ...prev,
          name: result.data.name || prev.name,
          email: result.data.email || prev.email,
          phone: result.data.phone || prev.phone,
          linkedin: result.data.linkedin || prev.linkedin,
          institute: result.data.institute || prev.institute,
          currentDegree: result.data.currentDegree || prev.currentDegree,
          branch: result.data.branch || prev.branch,
          yearOfStudy: result.data.yearOfStudy || prev.yearOfStudy,
          technicalSkills: result.data.technicalSkills || prev.technicalSkills,
          softSkills: result.data.softSkills || prev.softSkills,
          certifications: result.data.certifications || prev.certifications,
          achievements: result.data.achievements || prev.achievements,
          interests: result.data.interests || prev.interests,
          hobbies: result.data.hobbies || prev.hobbies,
          workExperience: result.data.workExperience || prev.workExperience,
          companyName: result.data.companyName || prev.companyName,
          designation: result.data.designation || prev.designation,
          yearsOfExperience: result.data.yearsOfExperience || prev.yearsOfExperience,
          internshipDetails: result.data.internshipDetails || prev.internshipDetails,
        }));
        
        notifySuccess('Resume data filled successfully! Please review and complete any missing fields.');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      notifyError('Failed to parse resume. Please try again.');
    } finally {
      setIsParsingResume(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderInputField = (field) => {
    const baseClasses =
      'w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

    if (field.type === 'textarea') {
      return (
        <textarea
          key={field.name}
          name={field.name}
          value={formData[field.name]}
          onChange={handleChange}
          rows={field.rows || 3}
          placeholder={field.placeholder}
          className={baseClasses}
          required={field.required}
        />
      );
    }

    return (
      <input
        key={field.name}
        type={field.type || 'text'}
        name={field.name}
        value={formData[field.name]}
        onChange={handleChange}
        placeholder={field.placeholder}
        className={baseClasses}
        required={field.required}
      />
    );
  };

  const renderChoiceButtons = (config) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {config.options.map((option) => {
        const isActive = formData[config.field] === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChoiceSelect(config.field, option.value, { autoAdvance: config.autoAdvance })}
            className={`rounded-2xl border-2 px-5 py-4 text-left transition-all ${
              isActive
                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <div className="text-base font-semibold">{option.label}</div>
            {option.description && <p className="mt-1 text-sm text-slate-500">{option.description}</p>}
          </button>
        );
      })}
    </div>
  );

  const renderEducationStep = (step) => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.question.label}</h3>
        {renderChoiceButtons(step.question)}
      </div>

      {formData.schoolType && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.followUp.label}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {step.followUp.fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-600">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </label>
                {renderInputField({ ...field, type: field.type || 'text' })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderExperienceStep = (step) => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.question.label}</h3>
        {renderChoiceButtons(step.question)}
      </div>

      {formData.experienceLevel && formData.experienceLevel !== 'none' && (
        <div className="space-y-6">
          {/* Company Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Company Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-600">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., Google, Microsoft"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-600">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., Software Engineer, Product Manager"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-600">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., 3, 5, 7"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-600">
                  Year of Joining <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="yearOfJoining"
                  value={formData.yearOfJoining}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., 2020, 2022"
                  required
                />
              </div>
            </div>
          </div>

          {/* Work Experience Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Where have you worked? <span className="text-red-500">*</span>
              </label>
              <textarea
                name="workExperience"
                value={formData.workExperience}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Please mention the companies/organizations where you have worked, your roles, and key responsibilities..."
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Only show "Are you a student?" question if user has no experience */}
      {formData.experienceLevel && formData.experienceLevel === 'none' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.followUp.label}</h3>
          {renderChoiceButtons(step.followUp)}
        </div>
      )}
    </div>
  );

  const renderInternshipStep = () => (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 p-5">
        <label className="flex items-start gap-4">
          <input
            type="checkbox"
            name="hasInternship"
            checked={formData.hasInternship}
            onChange={handleChange}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-lg font-semibold text-slate-900">I have completed an internship</div>
            <p className="text-sm text-slate-500 mt-1">
              Include standout projects, roles or tools you used so we can highlight them perfectly.
            </p>
          </div>
        </label>
        {formData.hasInternship && (
          <div className="mt-4">
            <textarea
              name="internshipDetails"
              value={formData.internshipDetails}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your internship project, responsibilities, tools and wins."
              required
            />
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 p-5">
        <label className="flex items-start gap-4">
          <input
            type="checkbox"
            name="hasExperience"
            checked={formData.hasExperience}
            onChange={handleChange}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-lg font-semibold text-slate-900">I have professional experience</div>
            <p className="text-sm text-slate-500 mt-1">
              Tell us about organisations, roles, and measurable outcomes so templates can spotlight them.
            </p>
          </div>
        </label>
        {formData.hasExperience && (
          <div className="mt-4">
            <textarea
              name="experienceDetails"
              value={formData.experienceDetails}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mention role, company, duration, impact, metrics..."
              required
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep = () => {
    const step = steps[currentStep];

    if (step.type === 'education') {
      return renderEducationStep(step);
    }

    if (step.type === 'experience') {
      return renderExperienceStep(step);
    }

    if (step.type === 'internships') {
      return renderInternshipStep();
    }

    return (
      <div className="grid gap-5 md:grid-cols-2">
        {step.fields
          .filter((field) => {
            // Don't show certifications and achievements if they're empty and not required
            if ((field.name === 'certifications' || field.name === 'achievements') && !field.required) {
              const value = formData[field.name];
              // Only show if there's a value or if it's the first time (empty string is fine for initial render)
              // Actually, we want to show them so users can fill them - so we'll always show them
              return true;
            }
            return true;
          })
          .map((field) => (
            <div
              key={field.name}
              className={`flex flex-col gap-2 ${field.fullWidth ? 'md:col-span-2' : ''}`}
            >
              <label className="text-sm font-medium text-slate-600">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              {renderInputField(field)}
            </div>
          ))}
      </div>
    );
  };

  const quickFacts = [
    { label: 'Degree', value: formData.currentDegree || '—' },
    { label: 'Field', value: formData.branch || '—' },
    { label: 'Institute', value: formData.institute || '—' },
    { label: 'Experience', value: formData.experienceLevel ? steps[2].question.options.find((o) => o.value === formData.experienceLevel)?.label : '—' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Profile builder</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">Craft a profile that feels alive</h2>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-500 transition"
            >
              ← Back
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/80 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{progress}% complete</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-slate-900">{steps[currentStep].title}</h3>
                  <p className="mt-2 text-slate-500">{steps[currentStep].subtitle}</p>
                </div>
                {currentStep === 0 && (
                  <div className="flex-shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleResumeUpload}
                      disabled={isParsingResume}
                      className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Upload your resume to auto-fill the form"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                        />
                      </svg>
                      {isParsingResume ? 'Parsing...' : 'Fill with Resume'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {renderStep()}

            {stepError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {stepError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={currentStep === 0 ? onBack : goToPreviousStep}
                className={`rounded-2xl border px-6 py-3 font-semibold transition ${
                  currentStep === 0 && !onBack
                    ? 'cursor-not-allowed border-slate-200 text-slate-300'
                    : 'border-slate-300 text-slate-600 hover:border-slate-500'
                }`}
                disabled={currentStep === 0 && !onBack}
              >
                Back
              </button>

              {isLastStep ? (
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:opacity-90 disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Generate my profile'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToNextStep()}
                  className="rounded-2xl bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Continue
                </button>
              )}
            </div>
          </form>

          <aside className="bg-slate-900 text-white p-8 space-y-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400">Live preview</p>
              <h4 className="mt-2 text-2xl font-semibold">Your story takes shape</h4>
              <p className="mt-3 text-sm text-slate-300">
                Each response instantly feeds the AI so we can recommend templates, tones, and layouts aligned with
                where you are in your journey.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Snapshot</p>
              <div className="space-y-3">
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="rounded-2xl bg-white/5 px-4 py-3">
                    <p className="text-xs text-slate-400">{fact.label}</p>
                    <p className="text-base font-semibold text-white">{fact.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm font-semibold text-white">Tips</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                <li>Use bullets or commas for skills – we’ll format them automatically.</li>
                <li>Numbers stand out. Add metrics wherever you can.</li>
                <li>Unsure about something? You can always come back and edit.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;

