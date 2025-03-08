import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { 
  getActiveSessionsForStudent,
  markAttendance,
  verifyAttendanceByQR,
  getMonthlyAttendanceData,
  getStudentAttendanceStats,
  getActiveClassSessions,
  startClassSession,
  endClassSession
} from '@/services/attendanceService';
import { calculateDistance } from '@/utils/distance';

/**
 * Hook for managing student attendance functionality
 */
export function useStudentAttendance() {
  const { user } = useAuth();
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Get the student's active sessions
  const activeSessions = useQuery({
    queryKey: ['active-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getActiveSessionsForStudent(user.id);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  // Get the student's attendance statistics
  const attendanceStats = useQuery({
    queryKey: ['attendance-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getStudentAttendanceStats(user.id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  // Get the student's monthly attendance data for charts
  const monthlyData = useQuery({
    queryKey: ['monthly-attendance', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getMonthlyAttendanceData(user.id, 'student');
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  // Mutation for marking attendance via QR code
  const markAttendanceByQR = useMutation({
    mutationFn: async (qrData: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await verifyAttendanceByQR(qrData, user.id, location || undefined);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Attendance Marked',
        description: 'Your attendance has been successfully recorded.',
      });
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Mark Attendance',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for marking attendance via location
  const markAttendanceByLocation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!location) throw new Error('Location not available');
      
      const result = await markAttendance({
        student_id: user.id,
        class_session_id: sessionId,
        status: 'present',
        verification_method: 'location',
        distance: 0, // Will be calculated on the server
        device_info: {
          userAgent: navigator.userAgent,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          },
          timestamp: new Date().toISOString(),
        },
      });
      
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Attendance Marked',
        description: 'Your attendance has been successfully recorded based on your location.',
      });
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Mark Attendance',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Start watching location
  const startLocationWatch = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    // Clear any existing watch
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          setLocation(position.coords);
          setLocationError(null);
        },
        (error) => {
          let errorMessage = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setLocationError(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      setLocationWatchId(id);
    } catch (err) {
      setLocationError('Failed to start location tracking');
    }
  };

  // Stop watching location
  const stopLocationWatch = () => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
  };

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  // Calculate distance between student and class location
  const calculateSessionDistance = (sessionLocation?: { latitude: number; longitude: number }) => {
    if (!location || !sessionLocation) return null;

    return calculateDistance(
      location.latitude,
      location.longitude,
      sessionLocation.latitude,
      sessionLocation.longitude
    );
  };

  return {
    activeSessions: activeSessions.data || [],
    isLoadingActiveSessions: activeSessions.isLoading,
    attendanceStats: attendanceStats.data,
    isLoadingStats: attendanceStats.isLoading,
    monthlyData: monthlyData.data || [],
    isLoadingMonthlyData: monthlyData.isLoading,
    isMarkingAttendance: markAttendanceByQR.isPending || markAttendanceByLocation.isPending,
    location,
    locationError,
    isScanning,
    setIsScanning,
    startLocationWatch,
    stopLocationWatch,
    markAttendanceByQR: markAttendanceByQR.mutate,
    markAttendanceByLocation: markAttendanceByLocation.mutate,
    calculateSessionDistance,
  };
}

/**
 * Hook for managing lecturer attendance functionality
 */
export function useLecturerAttendance() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [proximityRadius, setProximityRadius] = useState<number>(50);
  const queryClient = useQueryClient();

  // Get active sessions for this lecturer
  const activeSessions = useQuery({
    queryKey: ['lecturer-active-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getActiveClassSessions(user.id);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get monthly attendance data for charts
  const monthlyData = useQuery({
    queryKey: ['lecturer-monthly-attendance', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getMonthlyAttendanceData(user.id, 'lecturer');
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  // Mutation for starting a class session
  const startSession = useMutation({
    mutationFn: async ({ classId }: { classId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await startClassSession(classId, user.id, location || undefined, proximityRadius);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Class Session Started',
        description: 'Students can now mark their attendance for this session.',
      });
      queryClient.invalidateQueries({ queryKey: ['lecturer-active-sessions'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Start Session',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for ending a class session
  const endSession = useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const result = await endClassSession(sessionId);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Class Session Ended',
        description: 'The attendance period for this session has been closed.',
      });
      queryClient.invalidateQueries({ queryKey: ['lecturer-active-sessions'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to End Session',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        let errorMessage = 'Unknown location error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return {
    activeSessions: activeSessions.data || [],
    isLoadingActiveSessions: activeSessions.isLoading,
    monthlyData: monthlyData.data || [],
    isLoadingMonthlyData: monthlyData.isLoading,
    isStartingSession: startSession.isPending,
    isEndingSession: endSession.isPending,
    location,
    locationError,
    proximityRadius,
    setProximityRadius,
    getCurrentLocation,
    startSession: startSession.mutate,
    endSession: endSession.mutate,
  };
} 