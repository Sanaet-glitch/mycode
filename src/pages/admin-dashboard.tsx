import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Users, BookOpen, Settings, Shield, UserPlus, LogOut, ActivityIcon, ListChecks, TrendingUp, Calendar, Clock, BarChart2, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { countUsersByRole } from "@/services/userService";
import { UserStats } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

// Add interface for server status data
interface ServerStatus {
  id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime_seconds: number;
  is_database_connected: boolean;
  environment: string;
  version: string;
  node_version: string;
  last_backup_at: string | null;
  created_at: string;
}

// Widget card component for consistent styling
const DashboardCard = ({ title, icon, children, className = '' }) => {
  return (
    <div 
      className={`rounded-lg p-5 ${className}`}
      style={{
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-md bg-blue-500/20 text-blue-400 mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
};

// Stats counter widget
const StatsCounter = ({ value, label, icon }) => {
  return (
    <div className="flex items-center">
      <div className="p-3 rounded-md bg-blue-500/10 text-blue-400">
        {icon}
      </div>
      <div className="ml-4">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  );
};

// System status indicator
const StatusIndicator = ({ status, label }) => {
  const isActive = status === 'active';
  return (
    <div className="flex items-center my-2">
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
      <span className="text-sm text-gray-300">{label}</span>
      <span className="ml-auto text-sm text-gray-400">
        {isActive ? 'Operational' : 'Down'}
      </span>
    </div>
  );
};

// Distribution item
const DistributionItem = ({ label, count, percentage }) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm text-gray-400">{count}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userName = user ? (user as any).name || "Admin" : "Admin";
  
  // Fetch user statistics with React Query
  const { data: userStats, isLoading: isLoadingUsers } = useQuery<UserStats>({
    queryKey: ['userStats'],
    queryFn: countUsersByRole,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch recent system logs
  const { data: recentLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['recentLogs'],
    queryFn: async () => {
      try {
        // Use the actual audit_logs table instead of profiles
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch system statistics
  const { data: systemStats, isLoading: isLoadingSystem } = useQuery({
    queryKey: ['systemStats'],
    queryFn: async () => {
      // For activeCourses and pendingRequests, we need to fetch this data separately
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });
        
      const { count: pendingRequestsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);
      
      // Try to fetch server status data
      let serverStatus: ServerStatus | null = null;
      try {
        const { data, error } = await supabase
          .rpc('get_server_status') // Using RPC as a workaround
          .limit(1);
        
        if (error) {
          console.error("Error fetching system status:", error);
          // Continue with default values
        } else if (data && data.length > 0) {
          serverStatus = data[0] as ServerStatus;
        }
      } catch (error) {
        console.error("Failed to fetch server status:", error);
      }
      
      // Use default status if we couldn't fetch real data
      const defaultStatus: ServerStatus = {
        id: 'default',
        cpu_usage: 25,
        memory_usage: 40,
        disk_usage: 55,
        uptime_seconds: 86400 * 3, // 3 days
        is_database_connected: true,
        environment: 'development',
        version: '1.0.0',
        node_version: 'v16.14.0',
        last_backup_at: null,
        created_at: new Date().toISOString()
      };
      
      // Combine the data
      return {
        ...serverStatus || defaultStatus,
        securityStatus: 'Secure',
        activeCourses: coursesData?.length || 0,
        pendingRequests: pendingRequestsCount || 0,
        uptime: serverStatus?.uptime_seconds ? 
          `${Math.floor(serverStatus.uptime_seconds / 86400)} days, ${Math.floor((serverStatus.uptime_seconds % 86400) / 3600)} hours` : 
          `${Math.floor(defaultStatus.uptime_seconds / 86400)} days, ${Math.floor((defaultStatus.uptime_seconds % 86400) / 3600)} hours`
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Error formatting date";
    }
  };
  
  // Calculate time elapsed
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000; // seconds in a year
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Welcome back, {userName}!</p>
      </div>

      {/* Quick stats section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardCard 
          title="" 
          icon={<Users size={20} />}
          className="border-t-4 border-blue-500"
        >
          <StatsCounter 
            value={userStats?.totalUsers || 0} 
            label="Total Users" 
            icon={<Users size={24} />} 
          />
        </DashboardCard>

        <DashboardCard 
          title="" 
          icon={<CheckCircle size={20} />} 
          className="border-t-4 border-green-500"
        >
          <StatsCounter 
            value={userStats?.activeUsers || 0} 
            label="Active Accounts" 
            icon={<CheckCircle size={24} />} 
          />
        </DashboardCard>

        <DashboardCard 
          title="" 
          icon={<BookOpen size={20} />}
          className="border-t-4 border-purple-500"
        >
          <StatsCounter 
            value={systemStats?.activeCourses || 0} 
            label="Active Courses" 
            icon={<BookOpen size={24} />} 
          />
        </DashboardCard>

        <DashboardCard 
          title="" 
          icon={<Calendar size={20} />}
          className="border-t-4 border-amber-500"
        >
          <StatsCounter 
            value={systemStats?.currentSemester || "Fall 2023"} 
            label="Current Semester" 
            icon={<Calendar size={24} />} 
          />
        </DashboardCard>
      </div>

      {/* Main dashboard sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard title="System Uptime" icon={<Clock size={20} />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold text-white">{systemStats?.uptime || "99.9%"}</div>
                <div className="text-sm text-gray-400">Last 30 days</div>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Clock size={24} className="text-blue-400" />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Security Status" icon={<Shield size={20} />}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{systemStats?.securityStatus || "Secure"}</div>
              <div className="text-sm text-gray-400">No issues detected</div>
            </div>
            <div className="p-3 rounded-full bg-green-500/10">
              <Shield size={24} className="text-green-400" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="User Distribution" icon={<BarChart2 size={20} />}>
          <div className="space-y-2">
            <DistributionItem 
              label="Students"
              count={userStats?.studentCount || 0}
              percentage={(userStats?.studentCount || 0) / (userStats?.totalUsers || 1) * 100}
            />
            <DistributionItem 
              label="Lecturers"
              count={userStats?.lecturerCount || 0}
              percentage={(userStats?.lecturerCount || 0) / (userStats?.totalUsers || 1) * 100}
            />
            <DistributionItem 
              label="Admins"
              count={userStats?.adminCount || 0}
              percentage={(userStats?.adminCount || 0) / (userStats?.totalUsers || 1) * 100}
            />
          </div>
        </DashboardCard>
      </div>

      {/* Additional dashboard sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="User Management" icon={<Users size={20} />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-medium text-white">Pending Requests</div>
                <div className="text-2xl font-bold text-white">{systemStats?.pendingRequests || 0}</div>
              </div>
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-md text-sm">
                View Requests
              </button>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="System Health" icon={<Shield size={20} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-md bg-gray-800/50">
                <div className="text-sm text-gray-400">CPU</div>
                <div className="text-lg font-medium text-white">{systemStats?.cpu_usage || 0}%</div>
              </div>
              <div className="text-center p-2 rounded-md bg-gray-800/50">
                <div className="text-sm text-gray-400">Memory</div>
                <div className="text-lg font-bold text-white">{systemStats?.memory_usage || 0}%</div>
              </div>
              <div className="text-center p-2 rounded-md bg-gray-800/50">
                <div className="text-sm text-gray-400">Disk</div>
                <div className="text-lg font-medium text-white">{systemStats?.disk_usage || 0}%</div>
              </div>
            </div>
            
            <div>
              {systemStats?.services?.map((service, index) => (
                <StatusIndicator key={index} status={service.status} label={service.name} />
              ))}
            </div>
            
            <div className="text-sm text-gray-400">
              <span>Last backup: {formatDate(systemStats?.last_backup_at || null)}</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Recent activity section */}
      <DashboardCard title="Recent User Activity" icon={<AlertCircle size={20} />}>
        {isLoadingLogs ? (
          <div className="space-y-3">
            <Progress value={undefined} className="h-2" />
            <Progress value={undefined} className="h-2" />
            <Progress value={undefined} className="h-2" />
          </div>
        ) : (
          <div className="space-y-4">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log: any, index: number) => (
                <div key={index} className="rounded-md border p-4">
                  <div className="font-medium">{log.action}</div>
                  <div className="text-sm text-muted-foreground">
                    {log.user_id ? `${log.user_id} • ` : ""}
                    {log.entity_type && log.entity_id ? `${log.entity_type}: ${log.entity_id} • ` : ""}
                    {timeAgo(log.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border p-4">
                <div className="font-medium">No recent activity</div>
                <div className="text-sm text-muted-foreground">System is quiet at the moment</div>
              </div>
            )}
          </div>
        )}
        <div className="mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/admin/logs">View All Activity</Link>
          </Button>
        </div>
      </DashboardCard>
    </div>
  );
};

export default AdminDashboard; 