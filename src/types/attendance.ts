export interface Class {
  id: string;
  name: string;
  schedule: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  date: string;
  status: "present" | "absent";
  location: string;
}