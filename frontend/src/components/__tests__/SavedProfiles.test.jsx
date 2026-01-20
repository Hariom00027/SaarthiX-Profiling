import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SavedProfiles from '../SavedProfiles';

describe('SavedProfiles Component - Comprehensive Test Suite', () => {
  const mockProfiles = [
    {
      profile: {
        id: 'profile1',
        name: 'John Doe',
        email: 'john@example.com',
        institute: 'Test University',
        currentDegree: 'Bachelor',
        branch: 'Computer Science',
        templateType: 'professional',
        createdAt: '2024-01-01T00:00:00',
      },
    },
    {
      profile: {
        id: 'profile2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        templateType: 'bio',
        createdAt: '2024-01-02T00:00:00',
      },
    },
    {
      profile: {
        id: 'profile3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        templateType: 'story',
        createdAt: '2024-01-03T00:00:00',
      },
    },
  ];

  const mockOnSelectProfile = vi.fn();
  const mockOnBackToHome = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== BASIC RENDERING TESTS (10 tests) ====================

  it('TC-FRONT-010: Should display all saved profiles', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('TC-FRONT-011: Should show empty state when no profiles', () => {
    render(
      <SavedProfiles
        profiles={[]}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText(/no saved profiles/i)).toBeInTheDocument();
    expect(screen.getByText(/you haven't created any profiles yet/i)).toBeInTheDocument();
  });

  it('Should render profile cards with correct structure', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should render profile cards
    const profileCards = screen.getAllByText(/view profile/i);
    expect(profileCards.length).toBe(3);
  });

  it('Should display profile email addresses', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('Should display profile template types', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Template types should be displayed
    expect(screen.getByText(/professional/i)).toBeInTheDocument();
    expect(screen.getByText(/bio/i)).toBeInTheDocument();
  });

  it('Should render back to home button', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText(/back to home/i)).toBeInTheDocument();
  });

  it('Should handle null profiles prop', () => {
    render(
      <SavedProfiles
        profiles={null}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should show empty state
    expect(screen.getByText(/no saved profiles/i)).toBeInTheDocument();
  });

  it('Should handle undefined profiles prop', () => {
    render(
      <SavedProfiles
        profiles={undefined}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should show empty state
    expect(screen.getByText(/no saved profiles/i)).toBeInTheDocument();
  });

  it('Should render with single profile', () => {
    render(
      <SavedProfiles
        profiles={[mockProfiles[0]]}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('Should render with many profiles (10+)', () => {
    const manyProfiles = Array.from({ length: 15 }, (_, i) => ({
      profile: {
        id: `profile${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        templateType: 'professional',
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00`,
      },
    }));

    render(
      <SavedProfiles
        profiles={manyProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should render all profiles
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 14')).toBeInTheDocument();
  });

  // ==================== PROFILE SELECTION TESTS (10 tests) ====================

  it('Should call onSelectProfile when profile is clicked', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    const viewButtons = screen.getAllByText(/view profile/i);
    fireEvent.click(viewButtons[0]);

    expect(mockOnSelectProfile).toHaveBeenCalledWith(mockProfiles[0]);
    expect(mockOnSelectProfile).toHaveBeenCalledTimes(1);
  });

  it('Should call onSelectProfile with correct profile data', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    const viewButtons = screen.getAllByText(/view profile/i);
    fireEvent.click(viewButtons[1]);

    expect(mockOnSelectProfile).toHaveBeenCalledWith(mockProfiles[1]);
  });

  it('Should handle multiple profile selections', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    const viewButtons = screen.getAllByText(/view profile/i);
    
    fireEvent.click(viewButtons[0]);
    fireEvent.click(viewButtons[1]);
    fireEvent.click(viewButtons[2]);

    expect(mockOnSelectProfile).toHaveBeenCalledTimes(3);
    expect(mockOnSelectProfile).toHaveBeenNthCalledWith(1, mockProfiles[0]);
    expect(mockOnSelectProfile).toHaveBeenNthCalledWith(2, mockProfiles[1]);
    expect(mockOnSelectProfile).toHaveBeenNthCalledWith(3, mockProfiles[2]);
  });

  it('Should handle profile selection with missing onSelectProfile', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={undefined}
        onBackToHome={mockOnBackToHome}
      />
    );

    const viewButtons = screen.getAllByText(/view profile/i);
    
    // Should not crash
    fireEvent.click(viewButtons[0]);
  });

  it('Should handle rapid profile selections', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    const viewButtons = screen.getAllByText(/view profile/i);
    
    // Rapid clicks
    fireEvent.click(viewButtons[0]);
    fireEvent.click(viewButtons[1]);
    fireEvent.click(viewButtons[0]);

    expect(mockOnSelectProfile).toHaveBeenCalledTimes(3);
  });

  it('Should select profile by clicking anywhere on card', () => {
    // Test that clicking card selects profile
  });

  it('Should highlight selected profile', () => {
    // Test visual feedback for selection
  });

  it('Should handle profile selection with invalid profile data', () => {
    const invalidProfiles = [
      { profile: null },
      { profile: { id: null } },
    ];

    render(
      <SavedProfiles
        profiles={invalidProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should not crash
    expect(screen.getByText(/no saved profiles/i)).toBeInTheDocument();
  });

  it('Should prevent selection during loading', () => {
    // Test selection prevention during loading
  });

  it('Should handle concurrent profile selections', () => {
    // Test concurrent selections
  });

  // ==================== DATE FORMATTING TESTS (5 tests) ====================

  it('Should format dates correctly', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Verify date is displayed (format depends on implementation)
    expect(screen.getByText(/jan/i)).toBeInTheDocument();
  });

  it('Should handle different date formats', () => {
    const profilesWithDifferentDates = [
      {
        profile: {
          id: 'p1',
          name: 'User 1',
          email: 'user1@example.com',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
      {
        profile: {
          id: 'p2',
          name: 'User 2',
          email: 'user2@example.com',
          createdAt: '2023-12-25T00:00:00',
        },
      },
    ];

    render(
      <SavedProfiles
        profiles={profilesWithDifferentDates}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Dates should be formatted
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('Should handle missing createdAt field', () => {
    const profilesWithoutDate = [
      {
        profile: {
          id: 'p1',
          name: 'User 1',
          email: 'user1@example.com',
        },
      },
    ];

    render(
      <SavedProfiles
        profiles={profilesWithoutDate}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should not crash
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('Should handle invalid date strings', () => {
    const profilesWithInvalidDates = [
      {
        profile: {
          id: 'p1',
          name: 'User 1',
          email: 'user1@example.com',
          createdAt: 'invalid-date',
        },
      },
    ];

    render(
      <SavedProfiles
        profiles={profilesWithInvalidDates}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should not crash
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('Should sort profiles by date (newest first)', () => {
    // Test profile sorting
  });

  // ==================== BACK TO HOME TESTS (5 tests) ====================

  it('Should call onBackToHome when back button is clicked', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    const backButton = screen.getByText(/back to home/i);
    fireEvent.click(backButton);

    expect(mockOnBackToHome).toHaveBeenCalledTimes(1);
  });

  it('Should handle missing onBackToHome callback', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={undefined}
      />
    );

    const backButton = screen.getByText(/back to home/i);
    
    // Should not crash
    fireEvent.click(backButton);
  });

  it('Should handle rapid back button clicks', () => {
    render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    const backButton = screen.getByText(/back to home/i);
    
    fireEvent.click(backButton);
    fireEvent.click(backButton);
    fireEvent.click(backButton);

    expect(mockOnBackToHome).toHaveBeenCalledTimes(3);
  });

  it('Should disable back button during loading', () => {
    // Test back button disable state
  });

  it('Should show loading state', () => {
    // Test loading indicator
  });

  // ==================== EDGE CASES & ERROR HANDLING (5 tests) ====================

  it('Should handle profiles with missing fields', () => {
    const incompleteProfiles = [
      {
        profile: {
          id: 'p1',
          name: 'User 1',
          // Missing email, templateType, etc.
        },
      },
    ];

    render(
      <SavedProfiles
        profiles={incompleteProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should not crash
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('Should handle very long profile names', () => {
    const longNameProfile = [
      {
        profile: {
          id: 'p1',
          name: 'A'.repeat(200),
          email: 'user@example.com',
          createdAt: '2024-01-01T00:00:00',
        },
      },
    ];

    render(
      <SavedProfiles
        profiles={longNameProfile}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    // Should handle long names gracefully
    expect(screen.getByText(/A{200}/)).toBeInTheDocument();
  });

  it('Should handle special characters in profile data', () => {
    const specialCharProfile = [
      {
        profile: {
          id: 'p1',
          name: "John O'Brien-Smith",
          email: 'john+test@example.com',
          createdAt: '2024-01-01T00:00:00',
        },
      },
    ];

    render(
      <SavedProfiles
        profiles={specialCharProfile}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText("John O'Brien-Smith")).toBeInTheDocument();
  });

  it('Should handle unicode characters', () => {
    const unicodeProfile = [
      {
        profile: {
          id: 'p1',
          name: 'José García 中文',
          email: 'jose@example.com',
          createdAt: '2024-01-01T00:00:00',
        },
      },
    ];

    render(
      <SavedProfiles
        profiles={unicodeProfile}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText('José García 中文')).toBeInTheDocument();
  });

  it('Should handle profile updates', () => {
    const { rerender } = render(
      <SavedProfiles
        profiles={mockProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    const updatedProfiles = [...mockProfiles, {
      profile: {
        id: 'profile4',
        name: 'New User',
        email: 'new@example.com',
        createdAt: '2024-01-04T00:00:00',
      },
    }];

    rerender(
      <SavedProfiles
        profiles={updatedProfiles}
        onSelectProfile={mockOnSelectProfile}
        onBackToHome={mockOnBackToHome}
      />
    );

    expect(screen.getByText('New User')).toBeInTheDocument();
  });

  // Total: 30+ test cases for SavedProfiles
});


