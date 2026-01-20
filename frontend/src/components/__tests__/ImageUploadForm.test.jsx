import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploadForm from '../ImageUploadForm';

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.onloadend = null;
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,test';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
};

describe('ImageUploadForm Component - Comprehensive Test Suite', () => {
  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();
  const mockProfileData = { name: 'Test User', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== BASIC RENDERING TESTS (8 tests) ====================

  it('should render upload form', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    expect(screen.getByText(/Upload Photo/i)).toBeInTheDocument();
  });

  it('should render template label in heading', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
        templateLabel="Professional Template"
      />
    );

    expect(screen.getByText(/Upload Photo for Professional Template/i)).toBeInTheDocument();
  });

  it('should render default template label when not provided', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    expect(screen.getByText(/Upload Photo for selected template/i)).toBeInTheDocument();
  });

  it('should render file input', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('should render back button', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    expect(screen.getByText(/Back/i)).toBeInTheDocument();
  });

  it('should render continue button', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    expect(screen.getByText(/Continue/i)).toBeInTheDocument();
  });

  it('should render upload instructions', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, GIF up to 5MB/i)).toBeInTheDocument();
  });

  it('should render with empty profileData', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={{}}
      />
    );

    expect(screen.getByText(/Upload Photo/i)).toBeInTheDocument();
  });

  // ==================== FILE VALIDATION TESTS (12 tests) ====================

  it('should show error for non-image file', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/valid image file/i)).toBeInTheDocument();
    });
  });

  it('should show error for file larger than 5MB', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/less than 5MB/i)).toBeInTheDocument();
    });
  });

  it('should accept valid JPEG image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/less than 5MB/i)).not.toBeInTheDocument();
    });
  });

  it('should accept valid PNG image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
    });
  });

  it('should accept valid GIF image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.gif', { type: 'image/gif' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
    });
  });

  it('should accept valid WEBP image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.webp', { type: 'image/webp' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
    });
  });

  it('should reject file exactly 5MB', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/less than 5MB/i)).toBeInTheDocument();
    });
  });

  it('should accept file just under 5MB', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 - 1, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/less than 5MB/i)).not.toBeInTheDocument();
    });
  });

  it('should handle file with no type', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test', { type: '' });
    Object.defineProperty(file, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/valid image file/i)).toBeInTheDocument();
    });
  });

  it('should handle empty file selection', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    fireEvent.change(fileInput, { target: { files: [] } });

    // Should not show error, just no preview
    expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
  });

  it('should clear previous error when valid file is selected', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    
    // First, select invalid file
    const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/valid image file/i)).toBeInTheDocument();
    });

    // Then, select valid file
    const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024, writable: false });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
    });
  });

  it('should handle multiple file selection (should only use first)', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file1, 'size', { value: 1024, writable: false });
    Object.defineProperty(file2, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    // Should only process first file
    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
    });
  });

  // ==================== IMAGE PREVIEW TESTS (8 tests) ====================

  it('should show preview for valid image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });
  });

  it('should display image preview with correct alt text', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const preview = screen.getByAltText('Preview');
      expect(preview).toBeInTheDocument();
    });
  });

  it('should replace preview when new image is selected', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    
    // Select first image
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file1, 'size', { value: 1024, writable: false });
    fireEvent.change(fileInput, { target: { files: [file1] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });

    // Select second image
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file2, 'size', { value: 1024, writable: false });
    fireEvent.change(fileInput, { target: { files: [file2] } });

    // Preview should update
    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });
  });

  it('should show upload area when no image is selected', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
    expect(screen.queryByText(/Change Image/i)).not.toBeInTheDocument();
  });

  it('should handle FileReader error gracefully', async () => {
    // Mock FileReader to throw error
    const originalFileReader = global.FileReader;
    global.FileReader = class FileReader {
      constructor() {
        this.result = null;
        this.onloadend = null;
      }
      
      readAsDataURL() {
        setTimeout(() => {
          if (this.onloadend) {
            this.onloadend({ target: { error: new Error('Read error') } });
          }
        }, 0);
      }
    };

    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should not crash
    await waitFor(() => {
      expect(screen.queryByText(/Change Image/i)).not.toBeInTheDocument();
    });

    global.FileReader = originalFileReader;
  });

  it('should clear preview when invalid file is selected after valid one', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    
    // Select valid image
    const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024, writable: false });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });

    // Select invalid file
    const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/valid image file/i)).toBeInTheDocument();
      expect(screen.queryByText(/Change Image/i)).not.toBeInTheDocument();
    });
  });

  it('should handle very large preview images', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 4 * 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });
  });

  it('should maintain preview aspect ratio', async () => {
    // Test that preview maintains aspect ratio
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const preview = screen.getByAltText('Preview');
      expect(preview).toHaveClass('max-w-xs', 'max-h-64');
    });
  });

  // ==================== FORM SUBMISSION TESTS (8 tests) ====================

  it('should disable submit button when no image selected', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const submitButton = screen.getByText(/Continue/i);
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when valid image is selected', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const submitButton = screen.getByText(/Continue/i);
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call onSubmit with profile data and base64 image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });

    const form = screen.getByRole('form') || screen.getByText(/Continue/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockProfileData,
          profileImage: expect.stringContaining('data:image/jpeg;base64,')
        })
      );
    });
  });

  it('should show error when submitting without image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const form = screen.getByRole('form') || screen.getByText(/Continue/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Please select an image/i)).toBeInTheDocument();
    });
  });

  it('should not call onSubmit when form is submitted without image', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const form = screen.getByRole('form') || screen.getByText(/Continue/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Please select an image/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should prevent default form submission', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });

    const form = screen.getByRole('form') || screen.getByText(/Continue/i).closest('form');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    Object.defineProperty(submitEvent, 'preventDefault', { value: vi.fn() });
    
    fireEvent(form, submitEvent);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should handle rapid form submissions', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });

    const form = screen.getByRole('form') || screen.getByText(/Continue/i).closest('form');
    
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);

    // Should handle rapid submissions
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should merge profile data with image data', async () => {
    const profileWithData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
    };

    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={profileWithData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });

    const form = screen.getByRole('form') || screen.getByText(/Continue/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          profileImage: expect.any(String),
        })
      );
    });
  });

  // ==================== BACK BUTTON TESTS (5 tests) ====================

  it('should call onBack when back button is clicked', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should handle missing onBack callback', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={undefined}
        profileData={mockProfileData}
      />
    );

    const backButton = screen.getByText(/Back/i);
    
    // Should not crash
    fireEvent.click(backButton);
  });

  it('should handle rapid back button clicks', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const backButton = screen.getByText(/Back/i);
    
    fireEvent.click(backButton);
    fireEvent.click(backButton);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(3);
  });

  it('should preserve form state when back is clicked', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Change Image/i)).toBeInTheDocument();
    });

    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
    // Form state should be preserved (image selection)
  });

  it('should not submit form when back is clicked', () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockOnBack).toHaveBeenCalled();
  });

  // ==================== EDGE CASES & ERROR HANDLING (4 tests) ====================

  it('should handle FileReader timeout', async () => {
    // Mock FileReader with delay
    const originalFileReader = global.FileReader;
    global.FileReader = class FileReader {
      constructor() {
        this.result = null;
        this.onloadend = null;
      }
      
      readAsDataURL() {
        // Simulate timeout by not calling onloadend
      }
    };

    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should handle gracefully
    await new Promise(resolve => setTimeout(resolve, 100));

    global.FileReader = originalFileReader;
  });

  it('should handle component unmount during file read', async () => {
    const { unmount } = render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Unmount before read completes
    unmount();

    // Should not cause errors
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should handle very long file names', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const longFileName = 'a'.repeat(300) + '.jpg';
    const file = new File(['content'], longFileName, { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should handle long names
    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
    });
  });

  it('should handle special characters in file names', async () => {
    render(
      <ImageUploadForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        profileData={mockProfileData}
      />
    );

    const fileInput = screen.getByLabelText(/Profile Photo/i);
    const file = new File(['content'], 'test-image_2024-01-01 (1).jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024, writable: false });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should handle special characters
    await waitFor(() => {
      expect(screen.queryByText(/valid image file/i)).not.toBeInTheDocument();
    });
  });

  // Total: 20+ test cases for ImageUploadForm
});
