import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  LayoutDashboard,
  BookOpen,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  UserPlus,
  FileText,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { ArwesCard, ArwesButton, ArwesNavMenu, ArwesNavItem } from './ui/arwes-components';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    {
      path: '/admin',
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
    },
    {
      path: '/admin/users',
      icon: <Users size={20} />,
      label: 'User Management',
    },
    {
      path: '/admin/enhanced-users',
      icon: <UserPlus size={20} />,
      label: 'Enhanced Users',
    },
    {
      path: '/admin/course-management',
      icon: <BookOpen size={20} />,
      label: 'Courses',
    },
    {
      path: '/admin/attendance-overview',
      icon: <Calendar size={20} />,
      label: 'Attendance',
    },
    {
      path: '/admin/reports',
      icon: <BarChart2 size={20} />,
      label: 'Reports',
    },
    {
      path: '/admin/logs',
      icon: <FileText size={20} />,
      label: 'Logs',
    },
    {
      path: '/admin/settings',
      icon: <Settings size={20} />,
      label: 'Settings',
    },
  ];

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar content */}
        <ArwesCard className="flex flex-col h-full" palette="secondary">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">
              Admin<span className="text-blue-400">Beacon</span>
            </h1>
            <button
              className="p-1 rounded-md md:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-500/20 text-white border-r-2 border-blue-400'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className={`mr-3 ${location.pathname === item.path ? 'text-blue-400' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-white font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.email || 'Admin'}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
            <ArwesButton
              onClick={handleLogout}
              className="mt-4 w-full"
              variant="secondary"
              size="sm"
            >
              <LogOut size={16} className="mr-2" />
              <span>Logout</span>
            </ArwesButton>
          </div>
        </ArwesCard>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16">
          <ArwesCard className="flex items-center justify-between px-6 h-full" palette="primary">
            <div className="flex items-center">
              <button
                className="p-1 mr-4 rounded-md md:hidden text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-medium text-white">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center">
              <button className="p-1 mr-4 rounded-full text-white relative hover:bg-white/10">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-white font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </ArwesCard>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 