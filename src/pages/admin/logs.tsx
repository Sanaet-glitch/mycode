import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, RotateCcw, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Profile } from "@/types/database";

// Types for audit logs
interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export default function LogsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("audit-logs");
  const pageSize = 10;
  
  // Fetch audit logs
  const { data: auditLogs, isLoading: isLoadingAuditLogs, refetch: refetchAuditLogs } = useQuery({
    queryKey: ['auditLogs', currentPage, searchTerm, actionFilter, entityTypeFilter, dateFilter],
    queryFn: async () => {
      try {
        // Use the real audit_logs table now
        let query = supabase
          .from('audit_logs')
          .select('*', { count: 'exact' });
        
        // Apply filters
        if (searchTerm) {
          query = query.or(`user_id.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`);
        }
        
        if (actionFilter) {
          query = query.eq('action', actionFilter);
        }
        
        if (entityTypeFilter) {
          query = query.eq('entity_type', entityTypeFilter);
        }
        
        if (dateFilter) {
          const dateStr = format(dateFilter, 'yyyy-MM-dd');
          query = query.gte('created_at', `${dateStr}T00:00:00`).lte('created_at', `${dateStr}T23:59:59`);
        }
        
        // Pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('created_at', { ascending: false });
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          logs: data || [],
          totalCount: count || 0
        };
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast({
          title: "Error",
          description: "Failed to fetch audit logs.",
          variant: "destructive",
        });
        return { logs: [], totalCount: 0 };
      }
    },
    staleTime: 30 * 1000 // 30 seconds
  });
  
  // Fetch system logs
  const { data: systemLogs, isLoading: isLoadingSystemLogs } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: async () => {
      // This would normally fetch from a backend API
      // Returning mock data for demo purposes
      return {
        logs: [
          { id: 1, level: 'info', message: 'System started', timestamp: new Date().toISOString() },
          { id: 2, level: 'info', message: 'Database connected', timestamp: new Date(Date.now() - 60000).toISOString() },
          { id: 3, level: 'warn', message: 'High memory usage detected', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
          { id: 4, level: 'error', message: 'Failed to connect to email service', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
          { id: 5, level: 'info', message: 'Backup completed successfully', timestamp: new Date(Date.now() - 8 * 60 * 60000).toISOString() }
        ]
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Get unique values for filters - extract from transformed logs
  const uniqueActions = Array.from(
    new Set(auditLogs?.logs.map(log => log.action) || [])
  );
  
  const uniqueEntityTypes = Array.from(
    new Set(auditLogs?.logs.map(log => log.entity_type) || [])
  );
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  // Download logs as CSV
  const downloadLogs = () => {
    if (!auditLogs || auditLogs.logs.length === 0) {
      toast({
        title: "No logs to download",
        description: "There are no logs matching your current filters.",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV header
    const header = ["ID", "User ID", "Action", "Entity Type", "Entity ID", "Details", "Created At", "IP Address", "User Agent"];
    
    // Create CSV rows
    const rows = auditLogs.logs.map(log => [
      log.id,
      log.user_id,
      log.action,
      log.entity_type,
      log.entity_id,
      JSON.stringify(log.details),
      log.created_at,
      log.ip_address || '',
      log.user_agent || ''
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
      
      toast({
      title: "Logs downloaded",
      description: "The logs have been downloaded as a CSV file.",
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setActionFilter("");
    setEntityTypeFilter("");
    setDateFilter(undefined);
    setCurrentPage(1);
  };
  
  // Calculate total pages
  const totalPages = auditLogs ? Math.ceil(auditLogs.totalCount / pageSize) : 0;
  
  // Badge color based on log level
  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'warning';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
      <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-4">System Logs</h1>
      
      <Tabs defaultValue="audit-logs" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="system-logs">System Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                View all user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                      type="search"
                  placeholder="Search logs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="">All Actions</SelectItem>
                      {uniqueActions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
                  
                  <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {uniqueEntityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[190px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFilter}
                        onSelect={setDateFilter}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetFilters}
                    title="Reset filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={downloadLogs}
                    disabled={!auditLogs || auditLogs.logs.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </div>
          </div>
          
              {isLoadingAuditLogs ? (
                <div className="space-y-3 py-6">
                  <Progress value={undefined} className="h-2" />
                  <Progress value={undefined} className="h-2" />
                  <Progress value={undefined} className="h-2" />
                </div>
              ) : auditLogs && auditLogs.logs.length > 0 ? (
                <>
                  <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Entity</TableHead>
                          <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        {auditLogs.logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {formatDate(log.created_at)}
                          </TableCell>
                            <TableCell>{log.user_id}</TableCell>
                          <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                            <TableCell>{log.entity_type && log.entity_id ? `${log.entity_type}: ${log.entity_id}` : "—"}</TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              {log.details ? JSON.stringify(log.details) : "—"}
                          </TableCell>
                        </TableRow>
                        ))}
                  </TableBody>
                </Table>
                  </div>
                
                  {totalPages > 1 && (
                    <div className="mt-4 flex justify-center">
                      <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                    </PaginationItem>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Display 5 pages at most, centered around current page
                            let pageToShow = currentPage;
                            if (currentPage < 3) {
                              pageToShow = i + 1;
                            } else if (currentPage > totalPages - 2) {
                              pageToShow = totalPages - 4 + i;
                            } else {
                              pageToShow = currentPage - 2 + i;
                            }
                            
                            if (pageToShow > 0 && pageToShow <= totalPages) {
                              return (
                                <PaginationItem key={pageToShow}>
                                  <PaginationLink
                                    isActive={pageToShow === currentPage}
                                    onClick={() => setCurrentPage(pageToShow)}
                                  >
                                    {pageToShow}
                                  </PaginationLink>
                    </PaginationItem>
                              );
                            }
                            return null;
                          })}
                          
                    <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <Filter className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                      No logs match your current filters. Try adjusting your search terms or clear the filters.
                    </p>
                    <Button variant="outline" onClick={resetFilters}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>
          
        <TabsContent value="system-logs">
            <Card>
              <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                View system performance and error logs
              </CardDescription>
              </CardHeader>
              <CardContent>
              {isLoadingSystemLogs ? (
                <div className="space-y-3 py-6">
                  <Progress value={undefined} className="h-2" />
                  <Progress value={undefined} className="h-2" />
                  <Progress value={undefined} className="h-2" />
                </div>
              ) : systemLogs && systemLogs.logs.length > 0 ? (
                <div className="rounded-md border">
                <Table>
                  <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemLogs.logs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getLevelBadgeColor(log.level)}>
                              {log.level}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.message}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <h3 className="mt-4 text-lg font-semibold">No system logs found</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                      No system logs are available at this time.
                    </p>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
} 