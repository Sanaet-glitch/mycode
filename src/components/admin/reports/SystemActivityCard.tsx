import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityDay } from "@/services/reportingService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SystemActivityCardProps {
  data: ActivityDay[];
  loading: boolean;
}

/**
 * Component to display system activity in a card with a chart
 */
export const SystemActivityCard = ({ data, loading }: SystemActivityCardProps) => {
  // Format data for the chart
  const chartData = data.map(day => ({
    date: day.date.split('T')[0].split('-').slice(1).join('/'), // Format as MM/DD
    Logins: day.logins,
    Views: day.contentViews,
    Submissions: day.submissions,
    Comments: day.comments
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Activity</CardTitle>
        <CardDescription>Daily user actions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : data.length > 0 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Logins" fill="#8884d8" stackId="a" />
                <Bar dataKey="Views" fill="#82ca9d" stackId="a" />
                <Bar dataKey="Submissions" fill="#ffc658" stackId="a" />
                <Bar dataKey="Comments" fill="#ff8042" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[200px] text-gray-500">
            No activity data available
          </div>
        )}
        
        {data.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
            <div className="bg-purple-100 p-2 rounded">
              <div className="font-semibold text-purple-800">
                {data.reduce((sum, day) => sum + day.logins, 0)}
              </div>
              <div>Logins</div>
            </div>
            <div className="bg-green-100 p-2 rounded">
              <div className="font-semibold text-green-800">
                {data.reduce((sum, day) => sum + day.contentViews, 0)}
              </div>
              <div>Views</div>
            </div>
            <div className="bg-yellow-100 p-2 rounded">
              <div className="font-semibold text-yellow-800">
                {data.reduce((sum, day) => sum + day.submissions, 0)}
              </div>
              <div>Submissions</div>
            </div>
            <div className="bg-orange-100 p-2 rounded">
              <div className="font-semibold text-orange-800">
                {data.reduce((sum, day) => sum + day.comments, 0)}
              </div>
              <div>Comments</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemActivityCard; 