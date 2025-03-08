import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, MapPin, CheckCircle2, QrCode, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { QRCodeScanner } from "./attendance/qr-code-scanner";

interface AttendanceCardProps {
  session?: any;
  isLoading?: boolean;
  distance?: number | null;
  locationError?: string | null;
  onMarkAttendance: () => void;
  onScanQR: (qrData: string) => void;
  isProcessing?: boolean;
}

export function AttendanceCard({
  session,
  isLoading = false,
  distance,
  locationError,
  onMarkAttendance,
  onScanQR,
  isProcessing = false,
}: AttendanceCardProps) {
  const [showQrScanner, setShowQrScanner] = useState(false);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-7 w-[250px] mb-1" />
          <Skeleton className="h-4 w-[180px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>No Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="bg-muted">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              There are no active class sessions right now. Check back later or ask your lecturer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate if the student is within the proximity radius
  const isWithinRadius = distance !== null && distance <= (session.proximity_radius || 100);
  const courseTitle = session.class?.course?.title || "Class Session";
  const classroomInfo = session.class?.room || "Not specified";
  const sessionStartTime = session.started_at 
    ? formatTime(new Date(session.started_at).toTimeString())
    : "Unknown time";
  const sessionDate = session.started_at
    ? formatDate(new Date(session.started_at), "PPP")
    : "Unknown date";
    
  const attendanceAlreadyMarked = session.attendance_status === "marked";

  return (
    <Card className="h-full shadow-sm hover:shadow transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{courseTitle}</CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{sessionStartTime} • {sessionDate}</span>
            </div>
          </div>
          <Badge 
            variant={isWithinRadius ? "success" : "default"}
            className={cn(
              "px-2 py-1 text-xs font-medium",
              isWithinRadius ? "bg-green-500" : "bg-secondary"
            )}
          >
            {isWithinRadius ? 'In Range' : 'Out of Range'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Location</div>
              <div className="text-sm text-muted-foreground">{classroomInfo}</div>
            </div>
          </div>
          
          {distance !== null && (
            <div className="text-sm">
              <span className="font-medium">Distance: </span>
              <span className={isWithinRadius ? "text-green-600" : "text-amber-600"}>
                {Math.round(distance)} meters
                {!isWithinRadius && (
                  <span className="ml-1 text-xs">
                    (limit: {session.proximity_radius || 100}m)
                  </span>
                )}
              </span>
            </div>
          )}

          {locationError && (
            <Alert variant="destructive" className="p-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {locationError}
              </AlertDescription>
            </Alert>
          )}

          {attendanceAlreadyMarked && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Attendance already marked!</span>
            </div>
          )}

          {showQrScanner && (
            <QRCodeScanner
              onClose={() => setShowQrScanner(false)}
              onScan={(data) => {
                onScanQR(data);
                setShowQrScanner(false);
              }}
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          className="w-full"
          onClick={onMarkAttendance}
          disabled={attendanceAlreadyMarked || isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="mr-2">Processing</span>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </>
          ) : (
            'Mark Attendance'
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowQrScanner(true)}
          disabled={attendanceAlreadyMarked || isProcessing}
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 