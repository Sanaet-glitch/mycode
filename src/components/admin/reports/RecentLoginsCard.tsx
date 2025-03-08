import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, School, BookOpen, Clock, Monitor, Smartphone, Laptop } from "lucide-react";
import { LoginRecord } from "@/services/reportingService";
import { formatDistanceToNow } from "date-fns";

interface RecentLoginsCardProps {
  recentLogins: LoginRecord[];
  loading: boolean;
}

/**
 * Component to display recent login activities in a card with a table
 */
export const RecentLoginsCard = ({ recentLogins, loading }: RecentLoginsCardProps) => {
  // Helper function to get the appropriate icon for the device
  const getDeviceIcon = (device: string) => {
    if (device.includes('Phone') || device.includes('iPhone')) return <Smartphone className="h-3 w-3 mr-1 text-gray-500" />;
    if (device.includes('iPad') || device.includes('Tablet')) return <Monitor className="h-3 w-3 mr-1 text-gray-500" />;
    return <Laptop className="h-3 w-3 mr-1 text-gray-500" />;
  };

  // Helper function to get the appropriate icon for the role
  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('admin')) return <Shield className="h-3 w-3 mr-1 text-red-500" />;
    if (role.toLowerCase().includes('teacher') || role.toLowerCase().includes('lecturer')) return <School className="h-3 w-3 mr-1 text-blue-500" />;
    if (role.toLowerCase().includes('student')) return <BookOpen className="h-3 w-3 mr-1 text-green-500" />;
    return <Shield className="h-3 w-3 mr-1 text-gray-500" />;
  };

  // Helper function to format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Logins</CardTitle>
        <CardDescription>Last user login activities</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : recentLogins.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogins.map((login) => (
                <TableRow key={login.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{login.user_name}</div>
                      <div className="text-xs text-gray-500">{login.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {getRoleIcon(login.role)}
                      {login.role.charAt(0).toUpperCase() + login.role.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-xs">
                      {getDeviceIcon(login.device)}
                      <span>{login.device}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-xs">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      {formatTimestamp(login.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      login.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {login.status}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">No recent logins found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentLoginsCard; 