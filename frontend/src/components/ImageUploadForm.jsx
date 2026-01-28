import React, { useState } from 'react';

const ImageUploadForm = ({ onSubmit, onBack, profileData, templateLabel = 'selected template' }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError(null);
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    // Convert image to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      onSubmit({ ...profileData, profileImage: base64Image });
    };
    reader.readAsDataURL(selectedImage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-wide text-blue-600 font-semibold">Photo Upload</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">Upload Photo for {templateLabel}</h2>
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
          <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">
            Add a clear headshot to personalize your {templateLabel.toLowerCase()}.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block mb-2 text-xs sm:text-sm font-medium text-slate-600">Profile Photo <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {imagePreview ? (
                    <div className="mb-3 sm:mb-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-[200px] sm:max-w-xs max-h-48 sm:max-h-64 rounded-lg shadow-md mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 sm:mb-4">
                      <svg
                        className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium">
                    {imagePreview ? 'Change Image' : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2">
                    PNG, JPG, GIF up to 5MB
                  </span>
                </label>
              </div>
              {error && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl sm:rounded-2xl border border-slate-300 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-600 hover:border-slate-500 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedImage}
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadForm;

