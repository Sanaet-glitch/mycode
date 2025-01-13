import { AttendanceRecord } from "@/types/attendance";

export const exportToCSV = (data: AttendanceRecord[]) => {
  const headers = ["Class", "Date", "Status", "Location"];
  const csvContent = [
    headers.join(","),
    ...data.map(record => [
      record.className,
      record.date,
      record.status,
      record.location
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};