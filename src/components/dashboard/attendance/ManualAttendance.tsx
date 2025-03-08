import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserPlus, X, CheckCircle, AlertCircle, UserX, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface ManualAttendanceProps {
  sessionId: string;
  className: string;
  courseName: string;
}

export const ManualAttendance = ({ sessionId, className, courseName }: ManualAttendanceProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState("");
  const { toast } = useToast();
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);

  // Mock student search for now - in a real implementation, this would be connected to your API
  const { data: searchResults, isLoading: isSearching } = api.students.searchStudents.useQuery(
    { query: searchQuery, courseId: sessionId.split("-")[0] },
    { enabled: searchQuery.length > 2, staleTime: 1000 * 60 }
  );

  // Add a new query to fetch attendance records
  const { data: sessionAttendance, isLoading: isLoadingAttendance } = api.attendance.getSessionAttendance.useQuery(
    { sessionId },
    { 
      enabled: showAttendanceHistory,
      refetchInterval: 30000 // Refresh every 30 seconds when viewing
    }
  );

  // Add a new mutation for bulk attendance marking
  const markBulkAttendanceMutation = api.attendance.markBulkAttendance.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bulk attendance marked successfully",
      });
      setSelectedStudents([]);
      setShowBulkOptions(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark bulk attendance",
        variant: "destructive",
      });
    },
  });

  // Add a new mutation for attendance override
  const overrideAttendanceMutation = api.attendance.overrideAttendance.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance status updated successfully",
      });
      
      // Refresh the attendance list
      if (showAttendanceHistory) {
        // Trigger refetch of attendance records
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance status",
        variant: "destructive",
      });
    }
  });

  // Mock mutation for marking attendance - connect to your actual API
  const markAttendanceMutation = api.attendance.markManualAttendance.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
      setSelectedStudent(null);
      setIsModalOpen(false);
      setSearchQuery("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  // Add this for student lookup by ID
  const [lookupId, setLookupId] = useState("");
  
  // Use the query at component level, outside of the handler
  const { isLoading: isLookingUpStudent } = api.students.getStudentByIdentifier.useQuery(
    { identifier: lookupId },
    {
      enabled: lookupId !== "",
      onSuccess: (student) => {
        if (student) {
          handleStudentSelect(student);
        } else if (lookupId) {
          setSearchError("No student found with this ID or registration number");
        }
        setIsSubmitting(false);
        setLookupId(""); // Reset after lookup
      },
      onError: () => {
        setSearchError("Error looking up student information");
        setIsSubmitting(false);
        setLookupId(""); // Reset after lookup
      }
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    if (searchQuery.length < 3) {
      setSearchError("Please enter at least 3 characters to search");
    }
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleManualIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSearchError("");

    if (!manualInput.trim()) {
      setSearchError("Please enter a student ID or registration number");
      setIsSubmitting(false);
      return;
    }

    // Set the ID to trigger the query
    setLookupId(manualInput);
  };

  const confirmAttendance = () => {
    if (!selectedStudent || !sessionId) return;
    
    markAttendanceMutation.mutate({
      sessionId,
      studentId: selectedStudent.id,
      method: "MANUAL",
    });
  };

  // Function to toggle student selection for bulk actions
  const toggleStudentSelection = (student: any) => {
    if (selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  // Function to handle bulk attendance marking
  const handleBulkAttendance = (status: 'present' | 'absent' | 'late') => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    markBulkAttendanceMutation.mutate({
      sessionId,
      studentIds: selectedStudents.map(student => student.id),
      status,
      method: "MANUAL_BULK",
    });
  };

  // Function to toggle attendance status for a student
  const toggleAttendanceStatus = (attendanceId: string, currentStatus: string) => {
    // Determine the new status (toggle between present and absent)
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    
    overrideAttendanceMutation.mutate({
      attendanceId,
      status: newStatus,
      sessionId, // Include for context in the API
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Manual Attendance</CardTitle>
            <CardDescription>Add students who couldn't scan the QR code</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAttendanceHistory(!showAttendanceHistory)}
            >
              {showAttendanceHistory ? "Hide Records" : "View Records"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBulkOptions(!showBulkOptions)}
            >
              {showBulkOptions ? "Cancel Bulk" : "Bulk Actions"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showAttendanceHistory ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Attendance Records</h3>
              <div className="flex space-x-2">
                <Select 
                  value={statusFilter} 
                  onValueChange={(value: any) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoadingAttendance ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sessionAttendance && sessionAttendance.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionAttendance
                      .filter(record => statusFilter === 'all' || record.status === statusFilter)
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.student.name}</p>
                              <p className="text-sm text-muted-foreground">{record.student.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'present' ? 'success' : 'destructive'}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.method}</TableCell>
                          <TableCell>{new Date(record.verification_time).toLocaleTimeString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleAttendanceStatus(record.id, record.status)}
                              disabled={overrideAttendanceMutation.isPending}
                            >
                              {overrideAttendanceMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : record.status === 'present' ? (
                                "Mark Absent"
                              ) : (
                                "Mark Present"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md bg-muted/20">
                <UserX className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">No attendance records found for this session</p>
              </div>
            )}
          </div>
        ) : showBulkOptions ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Bulk Attendance Marking</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedStudents([])}
                disabled={selectedStudents.length === 0}
              >
                Clear Selection ({selectedStudents.length})
              </Button>
            </div>
            
            <div className="space-y-2">
              {searchResults && searchResults.length > 0 ? (
                <ScrollArea className="h-[300px] border rounded-md p-2">
                  <div className="space-y-1">
                    {searchResults.map((student) => (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between p-2 rounded ${
                          selectedStudents.some(s => s.id === student.id)
                            ? 'bg-primary/10 dark:bg-primary/20'
                            : 'hover:bg-accent'
                        } cursor-pointer`}
                        onClick={() => toggleStudentSelection(student)}
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={selectedStudents.some(s => s.id === student.id)}
                            onCheckedChange={() => toggleStudentSelection(student)}
                          />
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-4 text-muted-foreground">Start typing to search for students</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 space-y-2">
              <h4 className="text-sm font-medium mb-2">Apply to {selectedStudents.length} selected students:</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => handleBulkAttendance('present')}
                  disabled={selectedStudents.length === 0 || markBulkAttendanceMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Present
                </Button>
                <Button 
                  onClick={() => handleBulkAttendance('absent')}
                  disabled={selectedStudents.length === 0 || markBulkAttendanceMutation.isPending}
                  variant="destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Mark Absent
                </Button>
                <Button 
                  onClick={() => handleBulkAttendance('late')}
                  disabled={selectedStudents.length === 0 || markBulkAttendanceMutation.isPending}
                  variant="outline"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Mark Late
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="search">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="search">Search Student</TabsTrigger>
              <TabsTrigger value="id">Enter Student ID</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name or ID number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={isSearching}
                    />
                  </div>
                  <Button type="submit" disabled={isSearching || searchQuery.length < 3}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                
                {searchError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}
                
                {searchQuery.length > 2 && (
                  <div className="mt-4">
                    {isSearching ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : searchResults && searchResults.length > 0 ? (
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {searchResults.map((student) => (
                            <div 
                              key={student.id} 
                              className="flex items-center justify-between p-2 rounded border hover:bg-accent cursor-pointer"
                              onClick={() => handleStudentSelect(student)}
                            >
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.id}</p>
                              </div>
                              <UserPlus className="h-4 w-4 text-primary" />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-center py-4 text-muted-foreground">No students found</p>
                    )}
                  </div>
                )}
              </form>
            </TabsContent>
            
            <TabsContent value="id">
              <form onSubmit={handleManualIdSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-id">Student ID or Registration Number</Label>
                  <Input
                    id="student-id"
                    placeholder="Enter student ID or registration number"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                {searchError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || isLookingUpStudent || !manualInput.trim()}
                >
                  {isSubmitting || isLookingUpStudent ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Verify & Add
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      {/* Confirmation Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Attendance</DialogTitle>
            <DialogDescription>
              You are about to manually mark attendance for:
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="py-4">
              <div className="space-y-2">
                <p className="font-medium">{selectedStudent.name}</p>
                <p className="text-sm text-muted-foreground">ID: {selectedStudent.id}</p>
                
                <div className="mt-4 text-sm space-y-1">
                  <p><span className="font-medium">Course:</span> {courseName}</p>
                  <p><span className="font-medium">Class:</span> {className}</p>
                  <p><span className="font-medium">Session:</span> {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={confirmAttendance} 
              disabled={markAttendanceMutation.isPending}
            >
              {markAttendanceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 