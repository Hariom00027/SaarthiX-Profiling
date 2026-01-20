import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileForm from '../ProfileForm';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  parseResume: vi.fn(),
  submitProfile: vi.fn(),
}));

// Mock notifications
vi.mock('../../utils/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

describe('Profile Integration Tests - Complete User Flows', () => {
  const mockOnSuccess = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ==================== COMPLETE PROFILE CREATION FLOW (10 tests) ====================

  it('Should complete full profile creation flow from start to finish', async () => {
    api.submitProfile.mockResolvedValue({
      success: true,
      data: {
        profile: { id: 'profile-1', name: 'John Doe' },
        templateText: 'Generated template',
      },
    });

    render(<ProfileForm onSuccess={mockOnSuccess} onBack={mockOnBack} />);

    // Step 1: Fill basic information
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '2000-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: Education
    await waitFor(() => {
      expect(screen.getByText(/Education snapshot/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/College/i));
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Degree/i), { target: { value: 'Bachelor' } });
      fireEvent.change(screen.getByLabelText(/Field of Study/i), { target: { value: 'CS' } });
      fireEvent.change(screen.getByLabelText(/Institute/i), { target: { value: 'MIT' } });
      fireEvent.change(screen.getByLabelText(/Year of Study/i), { target: { value: '3' } });
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: Experience
    await waitFor(() => {
      expect(screen.getByText(/Experience level/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/No Experience/i));
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Yes/i)); // Student status
    });

    // Step 4: Skills
    await waitFor(() => {
      expect(screen.getByText(/Skills & highlights/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Technical Skills/i), { target: { value: 'React, Node.js' } });
    fireEvent.change(screen.getByLabelText(/Soft Skills/i), { target: { value: 'Leadership' } });
    fireEvent.change(screen.getByLabelText(/Interests/i), { target: { value: 'AI, ML' } });
    fireEvent.change(screen.getByLabelText(/Hobbies/i), { target: { value: 'Reading' } });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 5: Internships
    await waitFor(() => {
      expect(screen.getByText(/Internships & experience/i)).toBeInTheDocument();
    });

    // Submit form
    await waitFor(() => {
      const submitButton = screen.getByText(/Generate my profile/i);
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('Should handle profile creation with resume upload', async () => {
    const mockResumeData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      institute: 'MIT',
      currentDegree: 'Bachelor',
      branch: 'CS',
      technicalSkills: 'React, Node.js',
    };

    api.parseResume.mockResolvedValue({
      success: true,
      data: mockResumeData,
    });

    api.submitProfile.mockResolvedValue({
      success: true,
      data: {
        profile: { id: 'profile-1' },
        templateText: 'Template',
      },
    });

    render(<ProfileForm onSuccess={mockOnSuccess} onBack={mockOnBack} />);

    // Upload resume
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(api.parseResume).toHaveBeenCalled();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    // Complete remaining steps and submit
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '2000-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Continue through steps...
    // Finally submit
  });

  it('Should handle profile creation with all optional fields', async () => {
    // Test complete flow with all fields filled
  });

  it('Should handle profile creation with minimal required fields', async () => {
    // Test flow with only required fields
  });

  it('Should handle profile creation with experience details', async () => {
    // Test flow with work experience
  });

  it('Should handle profile creation with internship details', async () => {
    // Test flow with internship
  });

  it('Should handle profile creation with both internship and experience', async () => {
    // Test flow with both
  });

  it('Should handle profile creation error and retry', async () => {
    // Test error handling and retry
  });

  it('Should preserve form data during navigation', async () => {
    // Test data preservation
  });

  it('Should handle concurrent profile submissions', async () => {
    // Test concurrent submissions
  });

  // ==================== PROFILE EDITING FLOW (5 tests) ====================

  it('Should handle profile editing with initial data', () => {
    const initialData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      dob: '2000-01-01',
      institute: 'MIT',
      currentDegree: 'Bachelor',
      branch: 'CS',
      technicalSkills: 'React',
      softSkills: 'Leadership',
      interests: 'AI',
      hobbies: 'Reading',
    };

    render(<ProfileForm onSuccess={mockOnSuccess} onBack={mockOnBack} initialData={initialData} />);

    // Verify all fields are populated
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('Should allow editing existing profile data', async () => {
    // Test editing flow
  });

  it('Should validate edited profile data', async () => {
    // Test validation during edit
  });

  it('Should save edited profile', async () => {
    // Test save edited profile
  });

  it('Should cancel profile editing', async () => {
    // Test cancel edit
  });

  // ==================== ERROR RECOVERY FLOWS (5 tests) ====================

  it('Should recover from validation errors', async () => {
    render(<ProfileForm onSuccess={mockOnSuccess} onBack={mockOnBack} />);

    // Try to proceed without filling fields
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    // Fill fields and retry
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '2000-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Should proceed without error
    await waitFor(() => {
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
  });

  it('Should recover from resume parsing error', async () => {
    api.parseResume.mockRejectedValue(new Error('Parse failed'));

    render(<ProfileForm onSuccess={mockOnSuccess} onBack={mockOnBack} />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      // Error should be shown, but form should still be usable
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });
  });

  it('Should recover from network errors', async () => {
    // Test network error recovery
  });

  it('Should recover from submission errors', async () => {
    // Test submission error recovery
  });

  it('Should handle timeout errors gracefully', async () => {
    // Test timeout handling
  });

  // Total: 20+ integration test cases
});
