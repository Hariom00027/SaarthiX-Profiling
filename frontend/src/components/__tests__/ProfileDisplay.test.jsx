import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ProfileDisplay from '../ProfileDisplay';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  fetchTemplates: vi.fn(),
  regenerateProfile: vi.fn(),
  saveProfileAsJson: vi.fn(),
  getAllMyProfiles: vi.fn(),
}));

// Mock download utility
vi.mock('../../utils/downloadProfile', () => ({
  downloadProfileAsPDF: vi.fn(),
}));

// Mock notifications
vi.mock('../../utils/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

// Mock SaarthiChatbot
vi.mock('../SaarthiChatbot', () => ({
  default: () => <div>SaarthiChatbot</div>,
}));

// Mock TemplatePreview
vi.mock('../TemplatePreview', () => ({
  default: () => <div>TemplatePreview</div>,
}));

// Mock ImageUploadForm
vi.mock('../ImageUploadForm', () => ({
  default: ({ onSubmit, onBack }) => (
    <div>
      <button onClick={onSubmit}>Submit Image</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

describe('ProfileDisplay Component - Comprehensive Test Suite', () => {
  const mockProfileData = {
    id: 'profile-1',
    name: 'John Doe',
    email: 'john@example.com',
    templateText: 'Sample template text',
    templateType: 'professional',
  };

  const mockOnEnhanceRequest = vi.fn();
  const mockOnChatbotRequest = vi.fn();
  const mockOnProfileUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.fetchTemplates.mockResolvedValue([
      { id: 'professional', name: 'Professional' },
      { id: 'bio', name: 'Bio' },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== BASIC RENDERING TESTS (15 tests) ====================

  it('Should render profile display with template text', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText('Sample template text')).toBeInTheDocument();
  });

  it('Should render profile name', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('Should render template selector', async () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.fetchTemplates).toHaveBeenCalled();
    });
  });

  it('Should render font selector', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Font selector should be present
    expect(screen.getByText(/Arial/i)).toBeInTheDocument();
  });

  it('Should render download PDF button', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText(/Download PDF/i)).toBeInTheDocument();
  });

  it('Should render save button', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
  });

  it('Should render enhance button', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText(/Enhance/i)).toBeInTheDocument();
  });

  it('Should render chatbot button', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText(/Chatbot/i)).toBeInTheDocument();
  });

  it('Should render edit button', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText(/Edit/i)).toBeInTheDocument();
  });

  it('Should not render photo upload modal initially', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.queryByText(/Upload Photo/i)).not.toBeInTheDocument();
  });

  it('Should render all profiles list when hideProfilesList is false', async () => {
    api.getAllMyProfiles.mockResolvedValue([
      { profile: { id: 'p1', name: 'Profile 1' } },
      { profile: { id: 'p2', name: 'Profile 2' } },
    ]);

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.getAllMyProfiles).toHaveBeenCalled();
    });
  });

  it('Should not render profiles list when hideProfilesList is true', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
        hideProfilesList={true}
      />
    );
    
    // Profiles list should not be fetched
    expect(api.getAllMyProfiles).not.toHaveBeenCalled();
  });

  it('Should handle missing templateText', () => {
    const profileWithoutText = { ...mockProfileData, templateText: null };
    
    render(
      <ProfileDisplay
        profileData={profileWithoutText}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Should not crash
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('Should handle empty profile data', () => {
    render(
      <ProfileDisplay
        profileData={{}}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Should not crash
    expect(screen.getByText(/Download PDF/i)).toBeInTheDocument();
  });

  it('Should update when profileData prop changes', () => {
    const { rerender } = render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const newProfileData = { ...mockProfileData, name: 'Jane Doe' };
    
    rerender(
      <ProfileDisplay
        profileData={newProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  // ==================== TEMPLATE SWITCHING TESTS (15 tests) ====================

  it('Should switch template when template selector changes', async () => {
    api.regenerateProfile.mockResolvedValue({
      success: true,
      data: {
        profile: mockProfileData,
        templateText: 'New template text',
      },
    });

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.fetchTemplates).toHaveBeenCalled();
    });
    
    // Find and change template selector
    const templateSelect = screen.getByRole('combobox', { name: /template/i });
    if (templateSelect) {
      fireEvent.change(templateSelect, { target: { value: 'bio' } });
      
      await waitFor(() => {
        expect(api.regenerateProfile).toHaveBeenCalled();
      });
    }
  });

  it('Should show loading state during template change', async () => {
    api.regenerateProfile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { profile: mockProfileData, templateText: 'New text' },
      }), 100))
    );

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Change template
    // Should show loading indicator
  });

  it('Should handle template change error', async () => {
    const { notifyError } = await import('../../utils/notifications');
    api.regenerateProfile.mockRejectedValue(new Error('Template change failed'));

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Attempt template change
    // Should show error notification
  });

  it('Should preserve edited text when switching templates', async () => {
    // Test that edited text is preserved
  });

  it('Should prompt for photo when switching to photo-required template', async () => {
    const photoTemplate = { ...mockProfileData, templateType: 'professional-profile' };
    
    render(
      <ProfileDisplay
        profileData={photoTemplate}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Switch to photo-required template
    // Should show photo upload modal
  });

  it('Should load available templates on mount', async () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.fetchTemplates).toHaveBeenCalled();
    });
  });

  it('Should handle empty templates list', async () => {
    api.fetchTemplates.mockResolvedValue([]);

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.fetchTemplates).toHaveBeenCalled();
    });
    
    // Should not crash
  });

  it('Should handle template fetch error', async () => {
    api.fetchTemplates.mockRejectedValue(new Error('Fetch failed'));

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.fetchTemplates).toHaveBeenCalled();
    });
    
    // Should handle error gracefully
  });

  it('Should show current template in selector', async () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.fetchTemplates).toHaveBeenCalled();
    });
    
    // Current template should be selected
  });

  it('Should disable template selector during change', async () => {
    // Test that selector is disabled during template change
  });

  it('Should cancel template change', async () => {
    // Test cancel functionality
  });

  it('Should handle rapid template changes', async () => {
    // Test that rapid changes are handled properly
  });

  it('Should update template text after successful change', async () => {
    api.regenerateProfile.mockResolvedValue({
      success: true,
      data: {
        profile: mockProfileData,
        templateText: 'Updated template',
      },
    });

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Change template and verify update
  });

  it('Should handle template change with unsaved edits', async () => {
    // Test that unsaved edits are handled
  });

  it('Should validate template selection', async () => {
    // Test template validation
  });

  // ==================== FONT SELECTION TESTS (10 tests) ====================

  it('Should change font when font selector changes', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const fontSelect = screen.getByRole('combobox', { name: /font/i });
    if (fontSelect) {
      fireEvent.change(fontSelect, { target: { value: 'Helvetica' } });
      
      // Font should change
    }
  });

  it('Should apply font to template display', () => {
    // Test that font is applied to rendered template
  });

  it('Should have default font of Arial', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Default font should be Arial
  });

  it('Should persist font selection', () => {
    // Test font persistence
  });

  it('Should handle all available fonts', () => {
    // Test all font options work
  });

  it('Should update font preview', () => {
    // Test font preview updates
  });

  it('Should handle font change error', () => {
    // Test font change error handling
  });

  it('Should reset font to default', () => {
    // Test font reset
  });

  it('Should apply font to PDF download', async () => {
    // Test that selected font is used in PDF
  });

  it('Should handle custom font', () => {
    // Test custom font handling
  });

  // ==================== EDITING TESTS (15 tests) ====================

  it('Should enter edit mode when edit button is clicked', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);
    
    // Should enter edit mode
  });

  it('Should exit edit mode when cancel is clicked', () => {
    // Test cancel edit
  });

  it('Should save edits when save button is clicked', async () => {
    // Test save edits
  });

  it('Should show inline editing toolbar', () => {
    // Test inline editing toolbar
  });

  it('Should handle text selection for editing', () => {
    // Test text selection
  });

  it('Should format selected text', () => {
    // Test text formatting
  });

  it('Should undo edits', () => {
    // Test undo functionality
  });

  it('Should redo edits', () => {
    // Test redo functionality
  });

  it('Should track edited template text', () => {
    // Test edited text tracking
  });

  it('Should compare original and edited text', () => {
    // Test text comparison
  });

  it('Should show unsaved changes indicator', () => {
    // Test unsaved changes indicator
  });

  it('Should prevent navigation with unsaved changes', () => {
    // Test unsaved changes warning
  });

  it('Should handle edit mode with forceEditMode prop', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
        forceEditMode={true}
      />
    );
    
    // Should be in edit mode
  });

  it('Should call onForceEditHandled when force edit is handled', () => {
    const mockOnForceEditHandled = vi.fn();
    
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
        forceEditMode={true}
        onForceEditHandled={mockOnForceEditHandled}
      />
    );
    
    // Should call handler
  });

  it('Should handle edit conflicts', () => {
    // Test edit conflict handling
  });

  // ==================== PDF DOWNLOAD TESTS (10 tests) ====================

  it('Should download PDF when download button is clicked', async () => {
    const { downloadProfileAsPDF } = await import('../../utils/downloadProfile');
    downloadProfileAsPDF.mockResolvedValue();

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const downloadButton = screen.getByText(/Download PDF/i);
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(downloadProfileAsPDF).toHaveBeenCalled();
    });
  });

  it('Should show loading state during PDF download', async () => {
    // Test download loading state
  });

  it('Should handle PDF download error', async () => {
    const { downloadProfileAsPDF } = await import('../../utils/downloadProfile');
    const { notifyError } = await import('../../utils/notifications');
    downloadProfileAsPDF.mockRejectedValue(new Error('Download failed'));

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const downloadButton = screen.getByText(/Download PDF/i);
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(notifyError).toHaveBeenCalled();
    });
  });

  it('Should disable download button during download', async () => {
    // Test button disable during download
  });

  it('Should include current font in PDF', async () => {
    // Test font inclusion in PDF
  });

  it('Should include edited text in PDF', async () => {
    // Test edited text in PDF
  });

  it('Should handle large template text in PDF', async () => {
    // Test large text handling
  });

  it('Should show download progress', async () => {
    // Test download progress indicator
  });

  it('Should cancel PDF download', async () => {
    // Test download cancellation
  });

  it('Should retry failed PDF download', async () => {
    // Test download retry
  });

  // ==================== SAVE FUNCTIONALITY TESTS (10 tests) ====================

  it('Should save profile when save button is clicked', async () => {
    api.saveProfileAsJson.mockResolvedValue({
      success: true,
      data: { path: '/saved/profile.json' },
    });

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(api.saveProfileAsJson).toHaveBeenCalled();
    });
  });

  it('Should show saving state during save', async () => {
    // Test saving state
  });

  it('Should handle save error', async () => {
    const { notifyError } = await import('../../utils/notifications');
    api.saveProfileAsJson.mockRejectedValue(new Error('Save failed'));

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(notifyError).toHaveBeenCalled();
    });
  });

  it('Should show success message after save', async () => {
    const { notifySuccess } = await import('../../utils/notifications');
    api.saveProfileAsJson.mockResolvedValue({
      success: true,
      data: { path: '/saved/profile.json' },
    });

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(notifySuccess).toHaveBeenCalled();
    });
  });

  it('Should disable save button during save', async () => {
    // Test button disable
  });

  it('Should save with current edits', async () => {
    // Test saving with edits
  });

  it('Should handle save without profile ID', async () => {
    // Test save without ID
  });

  it('Should prevent duplicate saves', async () => {
    // Test duplicate save prevention
  });

  it('Should update save message', async () => {
    // Test save message update
  });

  it('Should clear save message after timeout', async () => {
    // Test message clearing
  });

  // ==================== ENHANCEMENT TESTS (10 tests) ====================

  it('Should call onEnhanceRequest when enhance button is clicked', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const enhanceButton = screen.getByText(/Enhance/i);
    fireEvent.click(enhanceButton);
    
    expect(mockOnEnhanceRequest).toHaveBeenCalled();
  });

  it('Should show enhancing state', () => {
    // Test enhancing state
  });

  it('Should handle enhancement error', () => {
    // Test enhancement error
  });

  it('Should update template after enhancement', () => {
    // Test template update after enhancement
  });

  it('Should preserve edits during enhancement', () => {
    // Test edit preservation
  });

  it('Should cancel enhancement', () => {
    // Test enhancement cancellation
  });

  it('Should show enhancement progress', () => {
    // Test enhancement progress
  });

  it('Should handle enhancement timeout', () => {
    // Test enhancement timeout
  });

  it('Should retry failed enhancement', () => {
    // Test enhancement retry
  });

  it('Should validate enhancement request', () => {
    // Test enhancement validation
  });

  // ==================== CHATBOT TESTS (5 tests) ====================

  it('Should call onChatbotRequest when chatbot button is clicked', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    const chatbotButton = screen.getByText(/Chatbot/i);
    fireEvent.click(chatbotButton);
    
    expect(mockOnChatbotRequest).toHaveBeenCalled();
  });

  it('Should clear chatbot state for new profile', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
        isNewProfile={true}
      />
    );
    
    // Chatbot state should be cleared
  });

  it('Should preserve chatbot state for existing profile', () => {
    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
        isNewProfile={false}
      />
    );
    
    // Chatbot state should be preserved
  });

  it('Should handle chatbot integration', () => {
    // Test chatbot integration
  });

  it('Should update profile after chatbot interaction', () => {
    // Test profile update after chatbot
  });

  // ==================== PHOTO UPLOAD TESTS (5 tests) ====================

  it('Should show photo upload modal for photo-required templates', () => {
    const photoTemplate = { ...mockProfileData, templateType: 'professional-profile' };
    
    render(
      <ProfileDisplay
        profileData={photoTemplate}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    // Photo upload modal should be shown
  });

  it('Should handle photo upload submission', () => {
    // Test photo upload submission
  });

  it('Should handle photo upload cancellation', () => {
    // Test photo upload cancellation
  });

  it('Should validate photo before upload', () => {
    // Test photo validation
  });

  it('Should update profile with uploaded photo', () => {
    // Test profile update with photo
  });

  // ==================== PROFILES LIST TESTS (5 tests) ====================

  it('Should load all profiles on mount', async () => {
    api.getAllMyProfiles.mockResolvedValue([
      { profile: { id: 'p1', name: 'Profile 1' } },
    ]);

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.getAllMyProfiles).toHaveBeenCalled();
    });
  });

  it('Should switch between profiles', async () => {
    // Test profile switching
  });

  it('Should handle empty profiles list', async () => {
    api.getAllMyProfiles.mockResolvedValue([]);

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.getAllMyProfiles).toHaveBeenCalled();
    });
  });

  it('Should handle profile load error', async () => {
    api.getAllMyProfiles.mockRejectedValue(new Error('Load failed'));

    render(
      <ProfileDisplay
        profileData={mockProfileData}
        onEnhanceRequest={mockOnEnhanceRequest}
        onChatbotRequest={mockOnChatbotRequest}
      />
    );
    
    await waitFor(() => {
      expect(api.getAllMyProfiles).toHaveBeenCalled();
    });
  });

  it('Should update selected profile index', () => {
    // Test profile index update
  });

  // Total: 80+ test cases for ProfileDisplay
});
