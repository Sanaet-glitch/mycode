import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityDay } from "@/services/reportingService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface UserActivitySummaryProps {
  activitySummary: ActivityDay[];
  loading: boolean;
}

/**
 * Component to display user activity summary over time
 */
export const UserActivitySummary = ({ activitySummary, loading }: UserActivitySummaryProps) => {
  // Format data for the chart
  const chartData = activitySummary.map(day => ({
    date: day.date.split('T')[0].split('-').slice(1).join('/'), // Format as MM/DD
    Total: day.total,
    Logins: day.logins,
    "Content Views": day.contentViews,
    Submissions: day.submissions,
    Comments: day.comments,
    "Other Actions": day.otherActions
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity Summary</CardTitle>
        <CardDescription>Activity trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : activitySummary.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Total" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                <Line type="monotone" dataKey="Logins" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Content Views" stroke="#ffc658" />
                <Line type="monotone" dataKey="Submissions" stroke="#ff8042" />
                <Line type="monotone" dataKey="Comments" stroke="#0088fe" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[300px] text-gray-500">
            No activity data available
          </div>
        )}
        
        {activitySummary.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Activities</div>
              <div className="text-2xl font-bold">
                {activitySummary.reduce((sum, day) => sum + day.total, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Daily Average</div>
              <div className="text-2xl font-bold">
                {Math.round(activitySummary.reduce((sum, day) => sum + day.total, 0) / activitySummary.length).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Most Active Day</div>
              <div className="text-2xl font-bold">
                {activitySummary.reduce((max, day) => day.total > max.total ? day : max, activitySummary[0]).date.split('T')[0]}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserActivitySummary; 