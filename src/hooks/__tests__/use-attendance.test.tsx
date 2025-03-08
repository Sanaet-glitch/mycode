import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudentAttendance, useLecturerAttendance } from '../use-attendance';
import { AuthProvider } from '@/contexts/AuthContext';
import * as attendanceService from '@/services/attendanceService';
import React from 'react';

// Mock the attendance service
jest.mock('@/services/attendanceService');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id' },
    profile: { role: 'student' }
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Create a wrapper for the hooks with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('useStudentAttendance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock default return values
    (attendanceService.getActiveSessionsForStudent as jest.Mock).mockResolvedValue({
      data: [{ id: 'session-1', class_id: 'class-1' }],
      error: null
    });
    (attendanceService.getStudentAttendanceStats as jest.Mock).mockResolvedValue({
      data: { 
        presentCount: 10, 
        absentCount: 2, 
        attendancePercentage: 83, 
        records: []
      },
      error: null
    });
    (attendanceService.getMonthlyAttendanceData as jest.Mock).mockResolvedValue({
      data: [
        { month: 'Jan', present: 5, absent: 1 },
        { month: 'Feb', present: 5, absent: 1 }
      ],
      error: null
    });
  });

  it('should fetch active sessions', async () => {
    const { result, waitFor } = renderHook(() => useStudentAttendance(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      return result.current.activeSessions !== undefined;
    });

    expect(attendanceService.getActiveSessionsForStudent).toHaveBeenCalledWith('test-user-id');
    expect(result.current.activeSessions).toEqual([{ id: 'session-1', class_id: 'class-1' }]);
  });

  it('should fetch attendance stats', async () => {
    const { result, waitFor } = renderHook(() => useStudentAttendance(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      return result.current.attendanceStats !== undefined;
    });

    expect(attendanceService.getStudentAttendanceStats).toHaveBeenCalledWith('test-user-id');
    expect(result.current.attendanceStats.presentCount).toEqual(10);
    expect(result.current.attendanceStats.attendancePercentage).toEqual(83);
  });

  it('should mark attendance by location', async () => {
    (attendanceService.markAttendance as jest.Mock).mockResolvedValue({
      data: { id: 'attendance-1' },
      error: null
    });

    const { result, waitFor } = renderHook(() => useStudentAttendance(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => !result.current.isLoadingActiveSessions);
    
    // Mock location for test
    result.current.location = { latitude: 40.7128, longitude: -74.0060 };
    
    await act(async () => {
      await result.current.markAttendanceByLocation('session-1');
    });

    expect(attendanceService.markAttendance).toHaveBeenCalled();
    expect(result.current.isMarkingAttendance).toBe(false);
  });
});

describe('useLecturerAttendance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock default return values
    (attendanceService.getActiveClassSessions as jest.Mock).mockResolvedValue({
      data: [{ id: 'session-1', class_id: 'class-1' }],
      error: null
    });
  });

  it('should fetch active sessions for lecturer', async () => {
    const { result, waitFor } = renderHook(() => useLecturerAttendance(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      return result.current.activeSessions !== undefined;
    });

    expect(attendanceService.getActiveClassSessions).toHaveBeenCalledWith('test-user-id');
    expect(result.current.activeSessions).toEqual([{ id: 'session-1', class_id: 'class-1' }]);
  });

  it('should start a class session', async () => {
    (attendanceService.startClassSession as jest.Mock).mockResolvedValue({
      data: { id: 'new-session-1' },
      error: null
    });

    const { result, waitFor } = renderHook(() => useLecturerAttendance(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => !result.current.isLoadingActiveSessions);
    
    const location = { latitude: 40.7128, longitude: -74.0060 };
    const proximityRadius = 100;
    
    await act(async () => {
      await result.current.startClassSession('class-1', location, proximityRadius);
    });

    expect(attendanceService.startClassSession).toHaveBeenCalledWith(
      'class-1', 
      'test-user-id', 
      location, 
      proximityRadius
    );
    expect(result.current.isStartingSession).toBe(false);
  });
}); 