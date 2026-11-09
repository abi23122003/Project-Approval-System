import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../pages/authentication-role-selection/components/LoginForm';
import HODAnalyticsDashboard from '../pages/hod-analytics-dashboard/index';
import UploadZone from '../pages/student-document-management/components/UploadZone';
import * as apiModule from '../utils/api';

vi.mock('../components/ui/Header', () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../components/AppIcon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

describe('Audit Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Login error display
  it('renders login error message when error prop is provided and hides when absent', () => {
    const errorMessage = 'Invalid credentials. Please check your email and password.';
    const { rerender } = render(
      <LoginForm
        selectedRole={{ label: 'Student', value: 'student' }}
        error={errorMessage}
        isLoading={false}
      />
    );

    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveClass('text-error');

    // Rerender without error
    rerender(
      <LoginForm
        selectedRole={{ label: 'Student', value: 'student' }}
        error=""
        isLoading={false}
      />
    );

    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  // 2. HOD reject button disabled without reason
  it('disables the HOD reject button when reason is empty and enables it once a reason is typed', async () => {
    const mockPendingProjects = [
      {
        id: 42,
        title: 'Autonomous Drone Navigation',
        status: 'SUBMITTED',
        student_name: 'Alice Johnson',
        mentor_name: 'Dr. Smith',
        approved_stages: 1,
        required_stages: 1,
        awaiting_hod: true,
        can_hod_approve: true,
      },
    ];

    vi.spyOn(apiModule, 'fetchHodProjects').mockResolvedValue(mockPendingProjects);
    vi.spyOn(apiModule, 'fetchHodApprovals').mockResolvedValue([]);
    vi.spyOn(apiModule, 'fetchHodFaculty').mockResolvedValue([]);
    vi.spyOn(apiModule, 'apiFetch').mockImplementation((path) => {
      if (path === '/hod/projects/42/') {
        return Promise.resolve(mockPendingProjects[0]);
      }
      return Promise.resolve({});
    });

    render(<HODAnalyticsDashboard />);

    // Wait for project to load
    await waitFor(() => {
      expect(screen.getByText('Autonomous Drone Navigation')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /^reject$/i });
    const reasonTextarea = screen.getByLabelText(/reason/i);

    // Initial state: no reason provided -> Reject button is disabled
    expect(reasonTextarea).toHaveValue('');
    expect(rejectButton).toBeDisabled();

    // Type whitespace only -> still disabled
    fireEvent.change(reasonTextarea, { target: { value: '   ' } });
    expect(rejectButton).toBeDisabled();

    // Type an actual rejection reason -> Reject button is enabled
    fireEvent.change(reasonTextarea, { target: { value: 'Incomplete literature review and methodology.' } });
    expect(rejectButton).not.toBeDisabled();

    // Clear the reason -> Reject button becomes disabled again
    fireEvent.change(reasonTextarea, { target: { value: '' } });
    expect(rejectButton).toBeDisabled();
  });

  // 3. HOD approval eligibility with can_hod_approve false, awaiting_hod false, and 1 of 2 stages approved
  it('disables Approve button, shows Faculty Review in Progress badge and stage count when can_hod_approve and awaiting_hod are false', async () => {
    const mockMultiStageProject = {
      id: 55,
      title: 'Quantum Key Distribution',
      status: 'UNDER_REVIEW',
      student_name: 'Bob Miller',
      mentor_name: 'Prof. Turing',
      approved_stages: 1,
      required_stages: 2,
      awaiting_hod: false,
      can_hod_approve: false,
    };

    vi.spyOn(apiModule, 'fetchHodProjects').mockResolvedValue([mockMultiStageProject]);
    vi.spyOn(apiModule, 'fetchHodApprovals').mockResolvedValue([]);
    vi.spyOn(apiModule, 'fetchHodFaculty').mockResolvedValue([]);
    vi.spyOn(apiModule, 'apiFetch').mockImplementation((path) => {
      if (path === '/hod/projects/55/') {
        return Promise.resolve(mockMultiStageProject);
      }
      return Promise.resolve({});
    });

    render(<HODAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quantum Key Distribution')).toBeInTheDocument();
    });

    // Assert Approve button is disabled
    const approveButton = screen.getByRole('button', { name: /^approve$/i });
    expect(approveButton).toBeDisabled();

    // Assert "Faculty Review in Progress" badge appears
    expect(screen.getByText('Faculty Review in Progress')).toBeInTheDocument();

    // Assert stage count is shown (1 / 2 stages approved)
    expect(screen.getByText(/1 \/ 2 stages approved/)).toBeInTheDocument();
  });

  // 4. HOD approval eligibility fallback when can_hod_approve is absent
  it('falls back to awaiting_hod flag when can_hod_approve is absent', async () => {
    // Project with can_hod_approve absent (undefined) but awaiting_hod true -> Approve enabled
    const projectWithAwaitingTrue = {
      id: 61,
      title: 'Solar Cell Efficiency Study',
      status: 'UNDER_REVIEW',
      student_name: 'Carol White',
      mentor_name: 'Dr. Tesla',
      approved_stages: 2,
      required_stages: 2,
      awaiting_hod: true,
      // can_hod_approve is absent
    };

    vi.spyOn(apiModule, 'fetchHodProjects').mockResolvedValue([projectWithAwaitingTrue]);
    vi.spyOn(apiModule, 'fetchHodApprovals').mockResolvedValue([]);
    vi.spyOn(apiModule, 'fetchHodFaculty').mockResolvedValue([]);
    vi.spyOn(apiModule, 'apiFetch').mockImplementation((path) => {
      if (path === '/hod/projects/61/') {
        return Promise.resolve(projectWithAwaitingTrue);
      }
      return Promise.resolve({});
    });

    const { unmount } = render(<HODAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Solar Cell Efficiency Study')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: /^approve$/i });
    expect(approveButton).not.toBeDisabled();
    expect(screen.getByText('Awaiting HOD Decision')).toBeInTheDocument();

    unmount();

    // Now test with awaiting_hod false and can_hod_approve absent -> Approve disabled
    const projectWithAwaitingFalse = {
      ...projectWithAwaitingTrue,
      id: 62,
      title: 'Bio-polymer Synthesis',
      awaiting_hod: false,
    };

    vi.spyOn(apiModule, 'fetchHodProjects').mockResolvedValue([projectWithAwaitingFalse]);
    vi.spyOn(apiModule, 'apiFetch').mockImplementation((path) => {
      if (path === '/hod/projects/62/') {
        return Promise.resolve(projectWithAwaitingFalse);
      }
      return Promise.resolve({});
    });

    render(<HODAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Bio-polymer Synthesis')).toBeInTheDocument();
    });

    const approveButtonDisabled = screen.getByRole('button', { name: /^approve$/i });
    expect(approveButtonDisabled).toBeDisabled();
    expect(screen.getByText('Faculty Review in Progress')).toBeInTheDocument();
  });

  // 5. UploadZone disabled when project not APPROVED
  it('disables file upload controls when project status is not APPROVED and enables them when APPROVED', () => {
    const progressUpdates = [{ id: 101, created_at: '2026-03-01T10:00:00Z' }];

    // Non-approved project (SUBMITTED)
    const { rerender } = render(
      <UploadZone
        project={{ id: 1, status: 'SUBMITTED' }}
        progressUpdates={progressUpdates}
      />
    );

    expect(screen.getByText('Uploads are available once your project is approved.')).toBeInTheDocument();
    const browseButton = screen.getByRole('button', { name: /browse files/i });
    expect(browseButton).toBeDisabled();

    // Non-approved project (UNDER_REVIEW)
    rerender(
      <UploadZone
        project={{ id: 1, status: 'UNDER_REVIEW' }}
        progressUpdates={progressUpdates}
      />
    );
    expect(screen.getByText('Uploads are available once your project is approved.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse files/i })).toBeDisabled();

    // Approved project (APPROVED)
    rerender(
      <UploadZone
        project={{ id: 1, status: 'APPROVED' }}
        progressUpdates={progressUpdates}
      />
    );
    expect(screen.queryByText('Uploads are available once your project is approved.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse files/i })).not.toBeDisabled();
  });
});
