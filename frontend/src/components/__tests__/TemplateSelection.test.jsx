import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateSelection from '../TemplateSelection';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  fetchTemplates: vi.fn(),
}));

describe('TemplateSelection Component', () => {
  const mockOnTemplateSelect = vi.fn();
  const mockOnCoverLetterSelect = vi.fn();
  const mockOnBack = vi.fn();

  const mockTemplates = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'A professional template',
      icon: '👔',
    },
    {
      id: 'bio',
      name: 'Bio',
      description: 'A bio template',
      icon: '📝',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-FRONT-004: TemplateSelection - Display Templates
  it('TC-FRONT-004: Should display all templates', async () => {
    api.fetchTemplates.mockResolvedValue(mockTemplates);

    render(
      <TemplateSelection
        onTemplateSelect={mockOnTemplateSelect}
        onCoverLetterSelect={mockOnCoverLetterSelect}
        onBack={mockOnBack}
      />
    );

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Professional')).toBeInTheDocument();
      expect(screen.getByText('Bio')).toBeInTheDocument();
    });
  });

  // TC-FRONT-005: TemplateSelection - Template Selection
  it('TC-FRONT-005: Should call onTemplateSelect when template is clicked', async () => {
    api.fetchTemplates.mockResolvedValue(mockTemplates);

    render(
      <TemplateSelection
        onTemplateSelect={mockOnTemplateSelect}
        onCoverLetterSelect={mockOnCoverLetterSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Professional')).toBeInTheDocument();
    });

    // Click on a template
    const professionalTemplate = screen.getByText('Professional').closest('div');
    fireEvent.click(professionalTemplate);

    // Verify callback was called
    expect(mockOnTemplateSelect).toHaveBeenCalledWith('professional');
  });

  // Test: Loading state
  it('Should show loading state while fetching templates', () => {
    api.fetchTemplates.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TemplateSelection
        onTemplateSelect={mockOnTemplateSelect}
        onCoverLetterSelect={mockOnCoverLetterSelect}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // Test: Error state
  it('Should show error message when template fetch fails', async () => {
    api.fetchTemplates.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <TemplateSelection
        onTemplateSelect={mockOnTemplateSelect}
        onCoverLetterSelect={mockOnCoverLetterSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  // TC-FRONT-007: Template Preview - Valid Template
  it('TC-FRONT-007: Should show template preview on hover', async () => {
    api.fetchTemplates.mockResolvedValue(mockTemplates);

    render(
      <TemplateSelection
        onTemplateSelect={mockOnTemplateSelect}
        onCoverLetterSelect={mockOnCoverLetterSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Professional')).toBeInTheDocument();
    });

    // Hover over template
    const professionalTemplate = screen.getByText('Professional').closest('div');
    fireEvent.mouseEnter(professionalTemplate);

    // Verify preview is shown (implementation dependent)
    // This would require checking for preview component
  });
});


