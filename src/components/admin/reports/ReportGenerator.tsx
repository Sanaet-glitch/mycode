import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { FileDown, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';
import { generateReport } from "@/services/reportingService";

/**
 * Component for generating and downloading custom reports
 */
export const ReportGenerator = () => {
  const [reportType, setReportType] = useState("user_activity");
  const [selectedFormat, setSelectedFormat] = useState("excel");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [generating, setGenerating] = useState(false);

  // Handle date change
  const handleDateChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  // Convert to API-friendly report type
  const getApiReportType = () => {
    switch (reportType) {
      case 'user_activity':
      case 'logins':
        return 'user_activity';
      case 'course_enrollment':
      case 'course_engagement':
        return 'course_engagement';
      case 'attendance':
        return 'attendance';
      default:
        return reportType;
    }
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      if (!dateRange.from || !dateRange.to) {
        toast({
          title: "Date Range Required",
          description: "Please select a valid date range for the report.",
          variant: "destructive",
        });
        return;
      }
      
      setGenerating(true);
      
      // Build filter object
      const filters: Record<string, any> = {};
      
      if (selectedRole !== 'all') {
        filters.role = selectedRole;
      }
      
      if (selectedDepartment !== 'all') {
        filters.department = selectedDepartment;
      }
      
      // Call the API to generate the report
      const reportData = await generateReport(
        getApiReportType(),
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd'),
        filters
      );
      
      if (!reportData || reportData.length === 0) {
        toast({
          title: "No Data",
          description: "No data available for the selected filters and date range.",
          variant: "default",
        });
        return;
      }
      
      // Process and download the report in the selected format
      await downloadReport(reportData);
      
      toast({
        title: "Report Generated",
        description: `The ${reportType} report has been generated and downloaded.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // Download the report in the requested format
  const downloadReport = async (data: any[]) => {
    const fileName = `${reportType}_report_${format(dateRange.from!, 'yyyy-MM-dd')}_to_${format(dateRange.to!, 'yyyy-MM-dd')}`;
    
    switch (selectedFormat) {
      case 'excel':
        // Create a workbook and format the data
        const worksheet = XLSX.utils.json_to_sheet(processDataForExport(data));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        break;
        
      case 'csv':
        // Convert to CSV and download
        const csvContent = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(processDataForExport(data)));
        downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
        break;
        
      case 'json':
        // Download as JSON
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `${fileName}.json`, 'application/json');
        break;
        
      case 'pdf':
        // In a real app, you would generate a PDF here
        // This is a simplified placeholder
        toast({
          title: "PDF Generation",
          description: "PDF generation would require additional libraries.",
          variant: "default",
        });
        break;
    }
  };
  
  // Helper to create a downloadable file
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Process data for export to make it flat (for Excel/CSV)
  const processDataForExport = (data: any[]) => {
    return data.map(item => {
      const flatItem: Record<string, any> = {};
      
      // Flatten nested objects
      const flattenObject = (obj: any, prefix = '') => {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            flattenObject(obj[key], `${prefix}${key}_`);
          } else {
            flatItem[`${prefix}${key}`] = obj[key];
          }
        }
      };
      
      flattenObject(item);
      return flatItem;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Custom Reports</CardTitle>
        <CardDescription>Create and download reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user_activity">User Activity</SelectItem>
                <SelectItem value="logins">Login History</SelectItem>
                <SelectItem value="course_engagement">Course Engagement</SelectItem>
                <SelectItem value="attendance">Attendance Statistics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                <SelectItem value="json">JSON (.json)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Date Range</Label>
          <DateRangePicker 
            date={dateRange}
            onDateChange={handleDateChange}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="userRole">User Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="lecturer">Lecturers</SelectItem>
                <SelectItem value="student">Students</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="computer_science">Computer Science</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="humanities">Humanities</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleGenerateReport} disabled={generating}>
          {generating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportGenerator; 