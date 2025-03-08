import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from '@/contexts/SessionContext';
import { useTheme } from '@/hooks/use-theme';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Header } from './header';
import { 
  Clock, 
  Radio, 
  Users, 
  GraduationCap, 
  BookOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare,
  CalendarDays,
  Bell,
  LogOut
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  role?: string[];
}

const getNavItems = (role: string): NavItem[] => {
  const commonItems: NavItem[] = [
    {
      title: 'Home',
      href: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: 'Schedule',
      href: '/schedule',
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      title: 'Attendance',
      href: '/attendance',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: 'Courses',
      href: '/courses',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: 'Messages',
      href: '/messages',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: <Avatar className="h-5 w-5"><AvatarFallback>P</AvatarFallback></Avatar>,
    },
  ];

  const roleSpecificItems: Record<string, NavItem[]> = {
    student: [],
    lecturer: [
      {
        title: 'Attendance Beacon',
        href: '/lecturer/attendance',
        icon: <Radio className="h-5 w-5" />,
      },
      {
        title: 'Student Management',
        href: '/lecturer/students',
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: 'Analytics',
        href: '/lecturer/analytics',
        icon: <BarChart3 className="h-5 w-5" />,
      },
    ],
    admin: [
      {
        title: 'User Management',
        href: '/admin/users',
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: 'Course Management',
        href: '/admin/courses',
        icon: <GraduationCap className="h-5 w-5" />,
      },
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: <Settings className="h-5 w-5" />,
      },
    ],
  };

  return [...commonItems, ...(roleSpecificItems[role] || [])];
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const { session } = useSession();
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: session?.user?.name || 'User',
    email: session?.user?.email || '',
    role: session?.user?.role || 'student',
    avatar: session?.user?.image,
  });
  const [userRole, setUserRole] = useState<"admin" | "lecturer" | "student" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [greeting, setGreeting] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role as "admin" | "lecturer" | "student");
    } else {
      // Default to student if no role is specified
      setUserRole('student');
    }
    fetchUserProfile();
  }, [session]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    if (session?.user) {
      setUserProfile({
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'student',
        avatar: session.user.image,
      });
    }
  }, [session]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Fetch user profile data from API
      // This is just a placeholder - implement your actual API call
      const mockProfile = {
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'student',
        avatar: session.user.image,
      };
      
      setUserProfile(mockProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Get navigation items based on user role
  const navItems = getNavItems(userRole || 'student');

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#090E23] to-[#1A1E35] flex flex-col">
      {/* Animated particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed rounded-full z-0 opacity-50"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.3 + 0.1,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight
            ],
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth
            ],
            opacity: [
              Math.random() * 0.3 + 0.1, 
              Math.random() * 0.2
            ]
          }}
          transition={{ 
            duration: 15 + Math.random() * 15, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: i % 2 === 0 ? 
              `rgba(155, 135, 245, ${Math.random() * 0.5 + 0.3})` : 
              `rgba(126, 105, 171, ${Math.random() * 0.5 + 0.3})`
          }}
        />
      ))}
      
      {/* Glowing orbs */}
      <div className="fixed top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full filter blur-[100px] z-0" />
      <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-accent/20 rounded-full filter blur-[100px] z-0" />
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen glass-effect border-r border-white/10 transition-all duration-300 shadow-glass',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!isCollapsed && (
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 neon-border">
                <div className="absolute w-full h-full rounded-full animate-pulse-ring" />
                <div className="w-4 h-4 rounded-full bg-primary" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent text-shadow-glow">
                AttendBeacon
              </span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="glass-button hover:glass-button hover:translate-y-[-2px] transition-all"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5 neon-text" /> : <ChevronLeft className="h-5 w-5 neon-text" />}
          </Button>
        </div>

        {/* User info */}
        <div className={cn(
          'p-4 border-b border-white/10',
          isCollapsed && 'flex justify-center'
        )}>
          {isCollapsed ? (
            <Avatar className="h-10 w-10 ring-2 ring-primary/30 hover:ring-primary/60 transition-all">
              <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
              <AvatarFallback className="bg-primary/10 text-primary neon-text">{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 ring-2 ring-primary/30 hover:ring-primary/60 transition-all">
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                <AvatarFallback className="bg-primary/10 text-primary neon-text">{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{userProfile.name}</p>
                <Badge variant="outline" className="mt-1 text-xs bg-primary/10 text-primary border-primary/30 neon-border font-normal">
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href || 
                            (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <motion.div
                key={item.href}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
              >
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "default"}
                  className={cn(
                    'w-full transition-all hover:translate-y-[-2px]',
                    isCollapsed ? 'justify-center h-10 px-0' : 'justify-start h-10',
                    isActive
                      ? 'glass-button neon-border text-primary hover:bg-primary/30'
                      : 'text-white/70 hover:text-white hover:glass-button'
                  )}
                  asChild
                  onClick={() => navigate(item.href)}
                >
                  <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                  {!isCollapsed && <span>{item.title}</span>}
                </Button>
              </motion.div>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              'w-full transition-colors border border-white/10 text-white/70 hover:text-white hover:bg-white/10',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-5 w-5", isCollapsed ? '' : 'mr-3')} />
            {!isCollapsed && <span>Sign out</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-1 flex-col relative z-10 transition-all duration-300",
        isCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <Header title="AttendBeacon" />
        <main className="flex-1 px-4 py-4 md:px-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 