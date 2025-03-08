// Mock API client for development
// This will be replaced with actual API implementation

type MockFunction<T> = {
  useQuery: (params: any, options?: any) => {
    data: T | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  useMutation: (options?: any) => {
    mutate: (params: any) => Promise<T>;
    isLoading: boolean;
    error: Error | null;
  };
};

// Create a mock API client with typed endpoints
export const api = {
  students: {
    searchStudents: {
      useQuery: (params: { query: string; courseId?: string }, options: any = {}) => {
        // Mock implementation for student search
        console.log('Mock API call: searchStudents', params);
        
        const mockStudents = [
          { id: 'ST001', name: 'John Doe', email: 'john.doe@example.com' },
          { id: 'ST002', name: 'Jane Smith', email: 'jane.smith@example.com' },
          { id: 'ST003', name: 'Alex Johnson', email: 'alex.j@example.com' },
        ];
        
        const filtered = params.query 
          ? mockStudents.filter(student => 
              student.name.toLowerCase().includes(params.query.toLowerCase()) ||
              student.id.toLowerCase().includes(params.query.toLowerCase())
            )
          : [];
          
        return {
          data: options.enabled === false ? undefined : filtered,
          isLoading: false,
          error: null
        };
      }
    },
    getStudentByIdentifier: {
      useQuery: (params: { identifier: string }, callbacks?: any) => {
        console.log('Mock API call: getStudentByIdentifier', params);
        
        const mockStudents = [
          { id: 'ST001', name: 'John Doe', email: 'john.doe@example.com' },
          { id: 'ST002', name: 'Jane Smith', email: 'jane.smith@example.com' },
          { id: 'ST003', name: 'Alex Johnson', email: 'alex.j@example.com' },
        ];
        
        const student = mockStudents.find(s => 
          s.id.toLowerCase() === params.identifier.toLowerCase());
          
        // Call the success callback if provided
        if (callbacks?.onSuccess) {
          setTimeout(() => callbacks.onSuccess(student || null), 500);
        }
        
        return {
          data: student,
          isLoading: false,
          error: null
        };
      }
    }
  },
  attendance: {
    markManualAttendance: {
      useMutation: (options: any = {}) => {
        return {
          mutate: async (params: { sessionId: string; studentId: string; method: string }) => {
            console.log('Mock API call: markManualAttendance', params);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Call the success callback if provided
            if (options.onSuccess) {
              options.onSuccess({ success: true });
            }
            
            return { success: true };
          },
          isLoading: false,
          error: null
        };
      }
    }
  }
}; 