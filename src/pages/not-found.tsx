import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFound() {
  const { isAuthenticated, user } = useAuth();
  
  // Determine where to send the user based on their authentication status and role
  const getHomeLink = () => {
    if (!isAuthenticated) {
      return "/login";
    }
    
    switch (user?.role) {
      case "student":
        return "/student/dashboard";
      case "lecturer":
        return "/lecturer/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/profile-setup";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-4 text-center dark:from-gray-900 dark:to-gray-800">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold">Page Not Found</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button asChild variant="default" size="lg">
            <Link to={getHomeLink()}>
              Go to Home
            </Link>
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please contact the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
} 