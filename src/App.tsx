import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./hooks/use-theme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import AdminDashboardLayout from './components/AdminDashboardLayout';
import React from "react";
import { GlassmorphismDemo } from './components/ui/glassmorphism-demo';

// Import pages with lazy loading
const LoginPage = lazy(() => import("./pages/login-page"));
const RegisterPage = lazy(() => import("./pages/register-page"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password-page"));
const ResetPasswordPage = lazy(() => 
  import("./components/auth/reset-password").then(module => ({
    default: () => <module.ResetPassword />
  }))
);
const DashboardPage = lazy(() => import("./pages/dashboard"));
const ProfilePage = lazy(() => import("./pages/profile-page"));
const ProfileSetupPage = lazy(() => import("./pages/profile-setup"));
const AttendanceOverviewPage = lazy(() => import("./pages/admin/attendance-overview"));
const CourseManagementPage = lazy(() => import("./pages/admin/course-management"));
const AdminLogsPage = lazy(() => 
  import("./pages/admin/logs").catch(() => {
    return {
      default: () => (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Admin Logs Page</h1>
          <p>This page is currently under development.</p>
        </div>
      ),
    };
  })
);

// Import role-specific dashboards
const LecturerDashboard = lazy(() => import("./pages/lecturer-dashboard"));
const StudentDashboard = lazy(() => import("./pages/student-dashboard"));
const AdminDashboard = lazy(() => import("./pages/admin-dashboard"));
const NotFound = lazy(() => import("./pages/not-found"));
const AdminUserManagement = lazy(() => import("./pages/admin-user-management"));
const EnhancedUserManagementPage = lazy(() => import("./pages/admin/enhanced-user-management"));

// Import admin pages
const SystemSettingsPage = lazy(() => import("./pages/admin/system-settings"));
const ReportsPage = lazy(() => import("./pages/admin/reports"));

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading indicator for route transitions
function RouteTransitionIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Progress value={undefined} className="h-1" />
    </div>
  );
}

// Loading spinner for auth checks
function AuthLoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" />
      <span className="ml-2 text-lg">Loading...</span>
    </div>
  );
}

interface ProtectedRouteProps {
  requiredRole?: 'student' | 'lecturer' | 'admin';
}

function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RouteTransitionIndicator />;
  }

  if (!isAuthenticated) {
    // Redirect to login but save the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If a role is required but the user doesn't have it, redirect to their dashboard
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user?.role === 'lecturer') {
      return <Navigate to="/lecturer/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      // If role is unknown, redirect to profile setup
      return <Navigate to="/profile-setup" replace />;
    }
  }

  // If user is authenticated and has the required role, render the child routes
  return <Outlet />;
}

function AuthRoute() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <RouteTransitionIndicator />;
  }
  
  if (isAuthenticated) {
    // Redirect authenticated users to their appropriate dashboard
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user?.role === 'lecturer') {
      return <Navigate to="/lecturer/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      // If user is authenticated but has no role, redirect to profile to complete setup
      return <Navigate to="/profile-setup" replace />;
    }
  }
  
  // If not authenticated, render the auth-related pages
  return <Outlet />;
}

export default function App() {
  // Global app initialization logic can go here
  useEffect(() => {
    // Force dark mode and set body styles directly
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#0F172A';
    document.body.style.color = 'white';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Fix root element styles
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.maxWidth = '100%';
      rootElement.style.margin = '0';
      rootElement.style.padding = '0';
      rootElement.style.height = '100vh';
      rootElement.style.width = '100vw';
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteTransitionIndicator />}>
              <Routes>
                {/* Auth Routes */}
                <Route element={<AuthRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/profile-setup" element={<ProfileSetupPage />} />
                </Route>

                {/* Glassmorphism Demo Route - Public */}
                <Route path="/glassmorphism-demo" element={<GlassmorphismDemo theme="dark" />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  {/* Student Routes */}
                  <Route path="/student/*" element={<StudentDashboard />} />
                  
                  {/* Lecturer Routes */}
                  <Route path="/lecturer/*" element={<LecturerDashboard />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboardLayout><Outlet /></AdminDashboardLayout>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUserManagement />} />
                    <Route path="enhanced-users" element={<EnhancedUserManagementPage />} />
                    <Route path="logs" element={<AdminLogsPage />} />
                    <Route path="settings" element={<SystemSettingsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="course-management" element={<CourseManagementPage />} />
                    <Route path="attendance-overview" element={<AttendanceOverviewPage />} />
                  </Route>

                  <Route path="/" element={<IndexRedirect />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>

            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Component to handle redirection from the index route
function IndexRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <RouteTransitionIndicator />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  } else if (user?.role === 'lecturer') {
    return <Navigate to="/lecturer/dashboard" replace />;
  } else if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <Navigate to="/profile-setup" replace />;
}