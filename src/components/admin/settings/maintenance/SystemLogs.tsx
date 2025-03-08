import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Download, RefreshCw, AlertTriangle, Info, 
  AlertCircle, Trash2, Filter, Calendar, Clock, FileText,
  ChevronLeft, ChevronRight, Settings
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { formatTimeAgo } from "@/lib/utils";

// Log entry interface
interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  source: string;
  message: string;
  details?: string;
  user?: string;
  ip?: string;
}

// Log settings interface
interface LogSettings {
  retention: number;
  minLevel: "debug" | "info" | "warning" | "error";
  sources: {
    system: boolean;
    auth: boolean;
    database: boolean;
    api: boolean;
    userActivity: boolean;
  };
  enableLogging: boolean;
  rotateLogs: boolean;
  rotationSize: number;
}

// Log file interface
interface LogFile {
  id: string;
  name: string;
  date: string;
  size: string;
}

export default function SystemLogs() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  
  // Sample log entries
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log-1",
      timestamp: "2023-12-22T14:25:30Z",
      level: "info",
      source: "system",
      message: "Application startup completed successfully",
      details: "Server started on port 3000, environment: production",
      user: "system",
      ip: "127.0.0.1"
    },
    {
      id: "log-2",
      timestamp: "2023-12-22T14:26:12Z",
      level: "info",
      source: "auth",
      message: "User login successful",
      details: "Login method: password",
      user: "admin@example.com",
      ip: "192.168.1.45"
    },
    {
      id: "log-3",
      timestamp: "2023-12-22T14:30:45Z",
      level: "warning",
      source: "database",
      message: "Slow query detected",
      details: "Query took 1.2s to execute: SELECT * FROM users WHERE last_login > '2023-01-01' ORDER BY created_at DESC",
      user: "system",
      ip: "127.0.0.1"
    },
    {
      id: "log-4",
      timestamp: "2023-12-22T14:40:22Z",
      level: "error",
      source: "api",
      message: "API request failed with status 500",
      details: "Endpoint: /api/users/sync, Error: Failed to connect to external service",
      user: "system",
      ip: "127.0.0.1"
    },
    {
      id: "log-5",
      timestamp: "2023-12-22T15:05:18Z",
      level: "debug",
      source: "system",
      message: "Cache refreshed",
      details: "Refreshed 128 cache items, expired 15 items",
      user: "system",
      ip: "127.0.0.1"
    },
    {
      id: "log-6",
      timestamp: "2023-12-22T15:10:33Z",
      level: "info",
      source: "auth",
      message: "Password reset requested",
      details: "Reset link sent to user email",
      user: "user@example.com",
      ip: "203.0.113.45"
    },
    {
      id: "log-7",
      timestamp: "2023-12-22T15:25:11Z",
      level: "warning",
      source: "system",
      message: "High memory usage detected",
      details: "Memory usage at 85% of allocated resources",
      user: "system",
      ip: "127.0.0.1"
    },
    {
      id: "log-8",
      timestamp: "2023-12-22T16:02:55Z",
      level: "error",
      source: "database",
      message: "Database connection timeout",
      details: "Failed to connect to database after 30s, retrying...",
      user: "system",
      ip: "127.0.0.1"
    }
  ]);
  
  // Sample log files
  const [logFiles, setLogFiles] = useState<LogFile[]>([
    { id: "file-1", name: "system-2023-12-22.log", date: "2023-12-22", size: "1.2 MB" },
    { id: "file-2", name: "system-2023-12-21.log", date: "2023-12-21", size: "1.8 MB" },
    { id: "file-3", name: "system-2023-12-20.log", date: "2023-12-20", size: "1.5 MB" },
    { id: "file-4", name: "error-2023-12-22.log", date: "2023-12-22", size: "450 KB" },
    { id: "file-5", name: "error-2023-12-21.log", date: "2023-12-21", size: "320 KB" },
    { id: "file-6", name: "access-2023-12-22.log", date: "2023-12-22", size: "3.2 MB" },
    { id: "file-7", name: "access-2023-12-21.log", date: "2023-12-21", size: "2.9 MB" }
  ]);
  
  // Sample log settings
  const [logSettings, setLogSettings] = useState<LogSettings>({
    retention: 30,
    minLevel: "info",
    sources: {
      system: true,
      auth: true,
      database: true,
      api: true,
      userActivity: true
    },
    enableLogging: true,
    rotateLogs: true,
    rotationSize: 10
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd HH:mm:ss");
  };
  
  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    // Apply search query
    if (searchQuery && 
        !log.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.details?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply level filter
    if (levelFilter.length > 0 && !levelFilter.includes(log.level)) {
      return false;
    }
    
    // Apply source filter
    if (sourceFilter.length > 0 && !sourceFilter.includes(log.source)) {
      return false;
    }
    
    // Apply date filter
    if (dateFilter && !log.timestamp.startsWith(dateFilter)) {
      return false;
    }
    
    return true;
  });
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setLevelFilter([]);
    setSourceFilter([]);
    setDateFilter("");
  };
  
  // Handle level filter change
  const toggleLevelFilter = (level: string) => {
    if (levelFilter.includes(level)) {
      setLevelFilter(levelFilter.filter(l => l !== level));
    } else {
      setLevelFilter([...levelFilter, level]);
    }
  };
  
  // Handle source filter change
  const toggleSourceFilter = (source: string) => {
    if (sourceFilter.includes(source)) {
      setSourceFilter(sourceFilter.filter(s => s !== source));
    } else {
      setSourceFilter([...sourceFilter, source]);
    }
  };
  
  // Update settings
  const handleSettingChange = (key: keyof LogSettings, value: any) => {
    setLogSettings({
      ...logSettings,
      [key]: value
    });
    setSettingsChanged(true);
  };
  
  // Update source settings
  const handleSourceChange = (source: keyof LogSettings["sources"], value: boolean) => {
    setLogSettings({
      ...logSettings,
      sources: {
        ...logSettings.sources,
        [source]: value
      }
    });
    setSettingsChanged(true);
  };
  
  // Save settings
  const saveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSettingsChanged(false);
      setIsSettingsOpen(false);
      
      toast({
        title: "Settings Saved",
        description: "Log settings have been updated successfully."
      });
    }, 800);
  };
  
  // Clear all logs
  const clearAllLogs = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLogs([]);
      setIsLoading(false);
      
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared successfully."
      });
    }, 800);
  };
  
  // Download logs
  const downloadLogs = () => {
    toast({
      title: "Downloading Logs",
      description: "Preparing logs for download..."
    });
    
    // Simulate download process
    setTimeout(() => {
      // Create a fake download
      const element = document.createElement("a");
      const file = new Blob(
        [filteredLogs.map(log => 
          `[${formatDate(log.timestamp)}] [${log.level.toUpperCase()}] [${log.source}] ${log.message} ${log.details ? "- " + log.details : ""}`
        ).join("\n")], 
        { type: "text/plain" }
      );
      element.href = URL.createObjectURL(file);
      element.download = `system-logs-${new Date().toISOString().split("T")[0]}.log`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Download Complete",
        description: "Logs have been downloaded successfully."
      });
    }, 1000);
  };
  
  // Download log file
  const downloadLogFile = (file: LogFile) => {
    toast({
      title: "Downloading File",
      description: `Preparing ${file.name} for download...`
    });
    
    // Simulate download process
    setTimeout(() => {
      // Create a fake download
      const element = document.createElement("a");
      element.href = "#";
      element.download = file.name;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Download Complete",
        description: `${file.name} has been downloaded successfully.`
      });
    }, 1000);
  };
  
  // Load more logs for "live" tab
  const loadMoreLogs = () => {
    setIsLoading(true);
    
    // Simulate API call to load more logs
    setTimeout(() => {
      // Generate random log entries
      const newLogs: LogEntry[] = [];
      const sources = ["system", "auth", "database", "api", "userActivity"];
      const levels = ["info", "warning", "error", "debug"];
      const messages = [
        "User logged in",
        "File uploaded",
        "Database query executed",
        "Cache invalidated",
        "Email sent",
        "API request processed"
      ];
      
      for (let i = 0; i < 5; i++) {
        const level = levels[Math.floor(Math.random() * levels.length)] as "info" | "warning" | "error" | "debug";
        const source = sources[Math.floor(Math.random() * sources.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        newLogs.push({
          id: `log-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          level,
          source,
          message,
          details: `Details for ${message.toLowerCase()}`,
          user: Math.random() > 0.5 ? "system" : "user@example.com",
          ip: "127.0.0.1"
        });
      }
      
      // Add to existing logs
      setLogs([...newLogs, ...logs]);
      setIsLoading(false);
    }, 800);
  };
  
  // Get Level Badge
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return <Badge className="bg-blue-500">Info</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Warning</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "debug":
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Debug</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get Level Icon
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "debug":
        return <Info className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">Live Logs</TabsTrigger>
          <TabsTrigger value="files">Log Files</TabsTrigger>
        </TabsList>
        
        {/* Live Logs Tab */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>
                  View and filter system log entries
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => loadMoreLogs()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadLogs}
                  disabled={filteredLogs.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={clearAllLogs}
                  disabled={logs.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search logs..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <Input 
                        type="date" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium">Level:</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-info" 
                          checked={levelFilter.includes("info")}
                          onCheckedChange={() => toggleLevelFilter("info")}
                        />
                        <Label htmlFor="filter-info" className="text-xs">Info</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-warning" 
                          checked={levelFilter.includes("warning")}
                          onCheckedChange={() => toggleLevelFilter("warning")}
                        />
                        <Label htmlFor="filter-warning" className="text-xs">Warning</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-error" 
                          checked={levelFilter.includes("error")}
                          onCheckedChange={() => toggleLevelFilter("error")}
                        />
                        <Label htmlFor="filter-error" className="text-xs">Error</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-debug" 
                          checked={levelFilter.includes("debug")}
                          onCheckedChange={() => toggleLevelFilter("debug")}
                        />
                        <Label htmlFor="filter-debug" className="text-xs">Debug</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Label className="text-sm font-medium">Source:</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-system" 
                          checked={sourceFilter.includes("system")}
                          onCheckedChange={() => toggleSourceFilter("system")}
                        />
                        <Label htmlFor="filter-system" className="text-xs">System</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-auth" 
                          checked={sourceFilter.includes("auth")}
                          onCheckedChange={() => toggleSourceFilter("auth")}
                        />
                        <Label htmlFor="filter-auth" className="text-xs">Auth</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-database" 
                          checked={sourceFilter.includes("database")}
                          onCheckedChange={() => toggleSourceFilter("database")}
                        />
                        <Label htmlFor="filter-database" className="text-xs">Database</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox 
                          id="filter-api" 
                          checked={sourceFilter.includes("api")}
                          onCheckedChange={() => toggleSourceFilter("api")}
                        />
                        <Label htmlFor="filter-api" className="text-xs">API</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Log Table */}
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No logs found</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Level</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Source</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLogs.map(log => (
                          <tr 
                            key={log.id} 
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedLog(log)}
                          >
                            <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center">
                                {getLevelIcon(log.level)}
                                <span className="ml-1.5 text-xs">{log.level}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-xs">{log.source}</td>
                            <td className="px-4 py-2 text-xs truncate max-w-xs">{log.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Pagination */}
              {filteredLogs.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredLogs.length} log entries
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadMoreLogs()}
                      disabled={isLoading}
                    >
                      Load More
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Log Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log Files</CardTitle>
              <CardDescription>
                Manage system log files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No log files found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {logFiles.map(file => (
                      <Card key={file.id}>
                        <CardContent className="pt-6 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-muted rounded-md">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 mr-1" />
                                  <span>{file.date}</span>
                                  <span className="mx-2">•</span>
                                  <span>{file.size}</span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadLogFile(file)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedLog && getLevelIcon(selectedLog.level)}
              <span className="ml-2">Log Details</span>
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.timestamp)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Level</Label>
                  <p className="text-sm">{getLevelBadge(selectedLog.level)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <p className="text-sm">{selectedLog.source}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">User</Label>
                  <p className="text-sm">{selectedLog.user || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">IP Address</Label>
                  <p className="text-sm">{selectedLog.ip || "N/A"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <div className="p-3 bg-muted rounded-md text-sm">{selectedLog.message}</div>
              </div>
              
              {selectedLog.details && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Details</Label>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="text-xs">{selectedLog.details}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Log Settings
            </DialogTitle>
            <DialogDescription>
              Configure system log settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableLogging">Enable Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Turn system logging on or off
                </p>
              </div>
              <Switch
                id="enableLogging"
                checked={logSettings.enableLogging}
                onCheckedChange={(checked) => handleSettingChange("enableLogging", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rotateLogs">Rotate Log Files</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically rotate log files when they reach the size limit
                </p>
              </div>
              <Switch
                id="rotateLogs"
                checked={logSettings.rotateLogs}
                onCheckedChange={(checked) => handleSettingChange("rotateLogs", checked)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retention">Log Retention (days)</Label>
                <Input
                  id="retention"
                  type="number"
                  value={logSettings.retention}
                  onChange={(e) => handleSettingChange("retention", parseInt(e.target.value))}
                  min="1"
                  max="365"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days to keep logs before deletion
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rotationSize">Rotation Size (MB)</Label>
                <Input
                  id="rotationSize"
                  type="number"
                  value={logSettings.rotationSize}
                  onChange={(e) => handleSettingChange("rotationSize", parseInt(e.target.value))}
                  min="1"
                  max="1000"
                />
                <p className="text-xs text-muted-foreground">
                  Max file size before rotation (in MB)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minLevel">Minimum Log Level</Label>
                <Select
                  value={logSettings.minLevel}
                  onValueChange={(value: "debug" | "info" | "warning" | "error") => 
                    handleSettingChange("minLevel", value)
                  }
                >
                  <SelectTrigger id="minLevel">
                    <SelectValue placeholder="Select minimum level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only log events at or above this level
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-base">Log Sources</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="source-system" 
                    checked={logSettings.sources.system}
                    onCheckedChange={(checked) => 
                      handleSourceChange("system", checked === true)
                    }
                  />
                  <Label htmlFor="source-system">System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="source-auth" 
                    checked={logSettings.sources.auth}
                    onCheckedChange={(checked) => 
                      handleSourceChange("auth", checked === true)
                    }
                  />
                  <Label htmlFor="source-auth">Authentication</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="source-database" 
                    checked={logSettings.sources.database}
                    onCheckedChange={(checked) => 
                      handleSourceChange("database", checked === true)
                    }
                  />
                  <Label htmlFor="source-database">Database</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="source-api" 
                    checked={logSettings.sources.api}
                    onCheckedChange={(checked) => 
                      handleSourceChange("api", checked === true)
                    }
                  />
                  <Label htmlFor="source-api">API</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="source-userActivity" 
                    checked={logSettings.sources.userActivity}
                    onCheckedChange={(checked) => 
                      handleSourceChange("userActivity", checked === true)
                    }
                  />
                  <Label htmlFor="source-userActivity">User Activity</Label>
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Storage Consideration</AlertTitle>
              <AlertDescription>
                Log files can consume significant disk space. Configure retention and rotation settings 
                appropriately for your system resources.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveSettings}
              disabled={!settingsChanged || isLoading}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 