import { AttendanceRecord } from "@/types/attendance";

type MonthlyAttendanceData = {
  month: string;
  present: number;
  absent: number;
  total: number;
  attendanceRate: string;
};

export const exportToCSV = (data: AttendanceRecord[] | MonthlyAttendanceData[]) => {
  let csvContent: string;

  if ('month' in data[0]) {
    // Handle monthly attendance data
    const headers = ["Month", "Present", "Absent", "Total", "Attendance Rate"];
    csvContent = [
      headers.join(","),
      ...(data as MonthlyAttendanceData[]).map(record => [
        record.month,
        record.present,
        record.absent,
        record.total,
        record.attendanceRate
      ].join(","))
    ].join("\n");
  } else {
    // Handle regular attendance records
    const headers = ["Class", "Date", "Status", "Location"];
    csvContent = [
      headers.join(","),
      ...(data as AttendanceRecord[]).map(record => [
        record.className,
        record.date,
        record.status,
        record.location
      ].join(","))
    ].join("\n");
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};