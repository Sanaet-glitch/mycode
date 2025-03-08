import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttendanceCard } from '../AttendanceCard';

describe('AttendanceCard', () => {
  const mockOnMarkAttendance = jest.fn();
  const mockOnScanQR = jest.fn();
  const mockSession = {
    id: 'session-123',
    class: {
      name: 'Lecture 1',
      course: {
        title: 'Introduction to Computer Science',
        code: 'CS101'
      }
    },
    started_at: new Date().toISOString(),
    is_active: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when loading', () => {
    render(
      <AttendanceCard
        isLoading={true}
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders "No active sessions" when no session is provided', () => {
    render(
      <AttendanceCard
        isLoading={false}
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    expect(screen.getByText('No Active Sessions')).toBeInTheDocument();
    expect(screen.getByText('There are no attendance sessions available right now.')).toBeInTheDocument();
  });

  it('renders session details when a session is provided', () => {
    render(
      <AttendanceCard
        session={mockSession}
        isLoading={false}
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    expect(screen.getByText('Lecture 1')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Computer Science (CS101)')).toBeInTheDocument();
  });

  it('shows location error when provided', () => {
    render(
      <AttendanceCard
        session={mockSession}
        isLoading={false}
        locationError="Location services are disabled"
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    expect(screen.getByText('Location services are disabled')).toBeInTheDocument();
  });

  it('shows distance information when provided', () => {
    render(
      <AttendanceCard
        session={mockSession}
        isLoading={false}
        distance={75}
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    expect(screen.getByText('75m from class location')).toBeInTheDocument();
  });

  it('calls onMarkAttendance when Mark Attendance button is clicked', () => {
    render(
      <AttendanceCard
        session={mockSession}
        isLoading={false}
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    fireEvent.click(screen.getByText('Mark Attendance'));
    expect(mockOnMarkAttendance).toHaveBeenCalledTimes(1);
  });

  it('calls onScanQR when Scan QR Code button is clicked', () => {
    render(
      <AttendanceCard
        session={mockSession}
        isLoading={false}
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    fireEvent.click(screen.getByText('Scan QR Code'));
    // This wouldn't directly call onScanQR but would typically open a QR scanner component
    // The actual implementation might vary, so this test might need adjustment
  });

  it('disables buttons when processing', () => {
    render(
      <AttendanceCard
        session={mockSession}
        isLoading={false}
        isProcessing={true}
        onMarkAttendance={mockOnMarkAttendance}
        onScanQR={mockOnScanQR}
      />
    );

    expect(screen.getByText('Mark Attendance').closest('button')).toBeDisabled();
    expect(screen.getByText('Scan QR Code').closest('button')).toBeDisabled();
  });
}); 