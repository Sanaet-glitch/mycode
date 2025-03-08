import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceStatistics } from "@/services/reportingService";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AttendanceStatisticsCardProps {
  data: AttendanceStatistics | null;
  loading: boolean;
}

/**
 * Component to display attendance statistics with visualizations
 */
export const AttendanceStatisticsCard = ({ data, loading }: AttendanceStatisticsCardProps) => {
  // Format department data for chart
  const departmentData = data 
    ? Object.entries(data.by_department).map(([name, rate]) => ({
        name,
        rate: Math.round(rate * 100)
      }))
    : [];
  
  // Format time of day data for chart
  const timeOfDayData = data 
    ? Object.entries(data.by_time_of_day).map(([name, rate]) => ({
        name,
        rate: Math.round(rate * 100)
      }))
    : [];

  // Format day of week data for chart
  const dayOfWeekData = data 
    ? Object.entries(data.by_day_of_week).map(([name, rate]) => ({
        name,
        rate: Math.round(rate * 100),
      }))
    : [];

  // Colors for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Trend data for line chart
  const trendData = data?.trends || [];
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Attendance Statistics</CardTitle>
        <CardDescription>
          {data && `Overall attendance rate: ${Math.round(data.overall_rate * 100)}%`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : !data ? (
          <div className="flex justify-center items-center h-[300px] text-gray-500">
            No attendance data available
          </div>
        ) : (
          <Tabs defaultValue="trends">
            <TabsList className="mb-4">
              <TabsTrigger value="trends">Attendance Trends</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="timeOfDay">By Time of Day</TabsTrigger>
              <TabsTrigger value="dayOfWeek">By Day of Week</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trends">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth()+1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      name="Attendance Rate"
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                      // Convert from decimal to percentage
                      data={trendData.map(item => ({
                        ...item,
                        rate: Math.round(item.rate * 100)
                      }))}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="departments">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Legend />
                    <Bar dataKey="rate" name="Attendance Rate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="timeOfDay">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeOfDayData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Legend />
                    <Bar dataKey="rate" name="Attendance Rate" fill="#82ca9d">
                      {timeOfDayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="dayOfWeek">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dayOfWeekData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                      <Legend />
                      <Bar dataKey="rate" name="Attendance Rate" fill="#ffc658">
                        {dayOfWeekData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dayOfWeekData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, rate }) => `${name}: ${rate}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="rate"
                      >
                        {dayOfWeekData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceStatisticsCard; 