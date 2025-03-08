import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStatistics } from "@/services/reportingService";
import { Shield, School, BookOpen } from "lucide-react";

interface ActivityByUserTypeCardProps {
  userStats: UserStatistics | null;
  loading: boolean;
}

/**
 * Component to display activity breakdown by user type
 */
export const ActivityByUserTypeCard = ({ userStats, loading }: ActivityByUserTypeCardProps) => {
  // Calculate percentages for the progress bars
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const totalUsers = userStats?.totalUsers || 0;
  const adminCount = userStats?.usersByRole?.admin || 0;
  const teacherCount = userStats?.usersByRole?.teacher || 0;
  const studentCount = userStats?.usersByRole?.student || 0;

  const adminPercentage = calculatePercentage(adminCount, totalUsers);
  const teacherPercentage = calculatePercentage(teacherCount, totalUsers);
  const studentPercentage = calculatePercentage(studentCount, totalUsers);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Distribution</CardTitle>
        <CardDescription>Breakdown by user type</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-sm font-medium">Administrators</span>
                </div>
                <span className="text-sm text-gray-500">{adminCount} ({adminPercentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${adminPercentage}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <School className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">Teachers</span>
                </div>
                <span className="text-sm text-gray-500">{teacherCount} ({teacherPercentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${teacherPercentage}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm font-medium">Students</span>
                </div>
                <span className="text-sm text-gray-500">{studentCount} ({studentPercentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${studentPercentage}%` }}></div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t">
              <div className="text-sm font-medium mb-2">User Status Distribution</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-xs text-gray-500">Active</div>
                  <div className="text-lg font-semibold text-green-700">
                    {calculatePercentage(userStats?.usersByStatus.active || 0, totalUsers)}%
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-xs text-gray-500">Inactive</div>
                  <div className="text-lg font-semibold text-red-700">
                    {calculatePercentage(userStats?.usersByStatus.inactive || 0, totalUsers)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityByUserTypeCard; 