import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStatistics } from "@/services/reportingService";
import { Users, Shield, School, BookOpen } from "lucide-react";
import ChartPlaceholder from "./ChartPlaceholder";

interface UserStatisticsCardProps {
  userStats: UserStatistics | null;
  loading: boolean;
}

/**
 * Component to display user statistics in a card with breakdown by role
 */
export const UserStatisticsCard = ({ userStats, loading }: UserStatisticsCardProps) => {
  // Calculate counts by role
  const adminCount = userStats?.usersByRole?.admin || 0;
  const lecturerCount = userStats?.usersByRole?.teacher || 0;
  const studentCount = userStats?.usersByRole?.student || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Statistics</CardTitle>
        <CardDescription>Overview of user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-500" />
                <span>Total Users</span>
              </div>
              <span className="font-bold">{userStats?.totalUsers || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-500" />
                <span>Administrators</span>
              </div>
              <span className="font-bold">{adminCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <School className="h-5 w-5 mr-2 text-blue-500" />
                <span>Lecturers</span>
              </div>
              <span className="font-bold">{lecturerCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-green-500" />
                <span>Students</span>
              </div>
              <span className="font-bold">{studentCount}</span>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Active Users</span>
                <span className="font-medium">{userStats?.activeUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">New Users (Last Week)</span>
                <span className="font-medium">{userStats?.newUsers || 0}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!loading && userStats && (
          <div className="w-full">
            <div className="text-sm text-gray-500 mb-2">User Status</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-green-100 p-2 rounded text-center">
                <div className="font-semibold text-green-800">{userStats.usersByStatus.active}</div>
                <div>Active</div>
              </div>
              <div className="bg-yellow-100 p-2 rounded text-center">
                <div className="font-semibold text-yellow-800">{userStats.usersByStatus.inactive}</div>
                <div>Inactive</div>
              </div>
              <div className="bg-red-100 p-2 rounded text-center">
                <div className="font-semibold text-red-800">{userStats.usersByStatus.locked}</div>
                <div>Locked</div>
              </div>
              <div className="bg-blue-100 p-2 rounded text-center">
                <div className="font-semibold text-blue-800">{userStats.usersByStatus.pendingActivation}</div>
                <div>Pending</div>
              </div>
            </div>
          </div>
        )}
        {loading && <ChartPlaceholder type="pie" height={200} />}
      </CardFooter>
    </Card>
  );
};

export default UserStatisticsCard; 