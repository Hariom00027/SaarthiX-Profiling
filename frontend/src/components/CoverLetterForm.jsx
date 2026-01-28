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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-wide text-blue-600 font-semibold">Cover Letter</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">Cover Letter Details</h2>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="self-start sm:self-auto rounded-full border border-slate-300 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:border-slate-500 transition"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl shadow-slate-200/80 p-4 sm:p-6 lg:p-8">
          <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">Provide the company-specific information to tailor your cover letter.</p>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Hiring Manager&apos;s Name</label>
              <input
                type="text"
                name="hiringManagerName"
                value={formValues.hiringManagerName}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="e.g., Priyanshu Pandey"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Company Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="companyName"
                  value={formValues.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., BrightFuture Tech"
                />
              </div>

              <div>
                <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Position / Job Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="positionTitle"
                  value={formValues.positionTitle}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., Junior Developer"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Company Address <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="companyAddress"
                value={formValues.companyAddress}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="e.g., Tower 5, Electronic City, Bangalore"
              />
            </div>

            <div>
              <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Relevant Experience or Motivation</label>
              <textarea
                name="relevantExperience"
                value={formValues.relevantExperience}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                placeholder="Briefly describe why you are interested in this role"
              />
            </div>

            <div>
              <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Key Achievement to Highlight</label>
              <textarea
                name="keyAchievement"
                value={formValues.keyAchievement}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                placeholder="Share one accomplishment that showcases your impact"
              />
            </div>

            <div>
              <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Strengths & Soft Skills</label>
              <textarea
                name="strengths"
                value={formValues.strengths}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                placeholder="Mention qualities that make you a great teammate"
              />
            </div>

            <div>
              <label className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-slate-600">Closing Note (Optional)</label>
              <textarea
                name="closingNote"
                value={formValues.closingNote}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                placeholder="Add any final message you want to convey"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-xl sm:rounded-2xl border border-slate-300 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-600 hover:border-slate-500 transition"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:opacity-90"
              >
                Generate Cover Letter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterForm;

