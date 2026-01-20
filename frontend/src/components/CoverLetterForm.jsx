import React, { useState } from 'react';

const CoverLetterForm = ({ onSubmit, onBack }) => {
  const [formValues, setFormValues] = useState({
    hiringManagerName: '',
    companyName: '',
    companyAddress: '',
    positionTitle: '',
    relevantExperience: '',
    keyAchievement: '',
    strengths: '',
    closingNote: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Cover Letter Details</h2>
      <p className="mb-6 text-gray-600">Provide the company-specific information to tailor your cover letter.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Hiring Manager&apos;s Name</label>
          <input
            type="text"
            name="hiringManagerName"
            value={formValues.hiringManagerName}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., Priyanshu Pandey"
          />
        </div>

        <div>
          <label className="block mb-1">Company Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            name="companyName"
            value={formValues.companyName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., BrightFuture Tech Pvt. Ltd."
          />
        </div>

        <div>
          <label className="block mb-1">Company Address <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            name="companyAddress"
            value={formValues.companyAddress}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., Tower 5, Electronic City, Banglore"
          />
        </div>

        <div>
          <label className="block mb-1">Position / Job Title <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            name="positionTitle"
            value={formValues.positionTitle}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g.,Junior Developer "
          />
        </div>

        <div>
          <label className="block mb-1">Relevant Experience or Motivation</label>
          <textarea
            name="relevantExperience"
            value={formValues.relevantExperience}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border rounded"
            placeholder="Briefly describe why you are interested in this role"
          />
        </div>

        <div>
          <label className="block mb-1">Key Achievement to Highlight</label>
          <textarea
            name="keyAchievement"
            value={formValues.keyAchievement}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border rounded"
            placeholder="Share one accomplishment that showcases your impact"
          />
        </div>

        <div>
          <label className="block mb-1">Strengths & Soft Skills</label>
          <textarea
            name="strengths"
            value={formValues.strengths}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border rounded"
            placeholder="Mention qualities that make you a great teammate"
          />
        </div>

        <div>
          <label className="block mb-1">Closing Note (Optional)</label>
          <textarea
            name="closingNote"
            value={formValues.closingNote}
            onChange={handleChange}
            rows="2"
            className="w-full px-3 py-2 border rounded"
            placeholder="Add any final message you want to convey"
          />
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate Cover Letter
          </button>
        </div>
      </form>
    </div>
  );
};

export default CoverLetterForm;

