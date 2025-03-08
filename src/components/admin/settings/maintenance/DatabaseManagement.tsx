import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Database, RotateCw, RefreshCw, Trash2, DownloadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Sample database information
interface DbInfo {
  size: string;
  lastOptimized: string;
  version: string;
  connections: number;
  tables: number;
  status: "healthy" | "warning" | "critical";
  uptime: string;
}

export default function DatabaseManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<DbInfo>({
    size: "1.2 GB",
    lastOptimized: "2023-11-15",
    version: "PostgreSQL 14.5",
    connections: 12,
    tables: 45,
    status: "healthy",
    uptime: "24 days, 5 hours"
  });

  // Simulate database operation
  const performOperation = async (operation: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (operation) {
        case "refresh":
          toast({
            title: "Database Stats Refreshed",
            description: "Database statistics have been updated."
          });
          break;
        case "vacuum":
          simulateOptimization("Database vacuum completed successfully.");
          break;
        case "reindex":
          simulateOptimization("Database reindexing completed successfully.");
          break;
        case "reset":
          toast({
            title: "Database Connections Reset",
            description: "All database connections have been reset."
          });
          setDbInfo({
            ...dbInfo,
            connections: Math.floor(Math.random() * 5) + 1
          });
          break;
        case "export":
          toast({
            title: "Database Export Started",
            description: "Your database export is being prepared for download."
          });
          // Simulate download after 2 seconds
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = '#';
            link.download = `database_export_${new Date().toISOString().split('T')[0]}.sql`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
              title: "Database Export Complete",
              description: "Database has been exported successfully."
            });
          }, 2000);
          break;
      }
      
      setConfirmAction(null);
    } catch (error) {
      console.error(`Error during ${operation}:`, error);
      toast({
        title: "Operation Failed",
        description: `Failed to perform ${operation} operation. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate optimization process with progress
  const simulateOptimization = (successMessage: string) => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    const interval = setInterval(() => {
      setOptimizationProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 10) + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsOptimizing(false);
            setDbInfo({
              ...dbInfo,
              lastOptimized: new Date().toISOString().split('T')[0]
            });
            toast({
              title: "Operation Completed",
              description: successMessage
            });
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  // Get status badge styling
  const getStatusBadge = () => {
    switch (dbInfo.status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Warning</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Database Information</CardTitle>
            <CardDescription>Current database status and statistics</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => performOperation("refresh")}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <div className="flex items-center">
                {getStatusBadge()}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Database Size</p>
              <p className="text-sm">{dbInfo.size}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Optimized</p>
              <p className="text-sm">{dbInfo.lastOptimized}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Database Version</p>
              <p className="text-sm">{dbInfo.version}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Active Connections</p>
              <p className="text-sm">{dbInfo.connections}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Tables Count</p>
              <p className="text-sm">{dbInfo.tables}</p>
            </div>
            <div className="space-y-1 md:col-span-3">
              <p className="text-sm font-medium">Uptime</p>
              <p className="text-sm">{dbInfo.uptime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Maintenance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Database Maintenance</CardTitle>
          <CardDescription>Optimize database performance and perform maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isOptimizing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Optimization in progress...</p>
              <Progress value={optimizationProgress} />
              <p className="text-xs text-muted-foreground">{optimizationProgress}% complete</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Vacuum Database</CardTitle>
                <CardDescription>Remove deleted rows and optimize storage</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={() => setConfirmAction("vacuum")} 
                  className="w-full" 
                  disabled={isLoading || isOptimizing}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Run Vacuum
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reindex Tables</CardTitle>
                <CardDescription>Rebuild database indexes for faster queries</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={() => setConfirmAction("reindex")} 
                  className="w-full" 
                  disabled={isLoading || isOptimizing}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Reindex
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reset Connections</CardTitle>
                <CardDescription>Close and reset all database connections</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={() => setConfirmAction("reset")} 
                  className="w-full" 
                  variant="outline" 
                  disabled={isLoading || isOptimizing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Export Database</CardTitle>
                <CardDescription>Export database structure and data</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={() => performOperation("export")} 
                  className="w-full" 
                  variant="outline"
                  disabled={isLoading || isOptimizing}
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              Maintenance operations may temporarily reduce system performance. It's recommended to perform 
              these operations during off-peak hours.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirmAction && confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}</DialogTitle>
            <DialogDescription>
              {confirmAction === "vacuum" && "This will remove deleted rows and optimize storage. This process may take several minutes."}
              {confirmAction === "reindex" && "This will rebuild all database indexes. The system may be slower during this operation."}
              {confirmAction === "reset" && "This will reset all database connections. Users may experience temporary disconnection."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmAction && performOperation(confirmAction)}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 