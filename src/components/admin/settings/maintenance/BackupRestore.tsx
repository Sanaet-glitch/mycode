import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Download, Calendar, Upload, Save, FileUp, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsItem, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getBackupList, 
  getBackupConfig, 
  createBackup, 
  downloadBackup, 
  deleteBackup, 
  restoreBackup, 
  updateBackupConfig, 
  uploadBackup 
} from "@/services/configService";

// Backup item interface
interface BackupItem {
  id: string;
  name: string;
  date: string;
  size: string;
  type: "full" | "data" | "files";
  status: "completed" | "failed" | "in_progress";
}

// Backup configuration interface
interface BackupConfig {
  autoBackup: boolean;
  schedule: "daily" | "weekly" | "monthly";
  time: string;
  retentionPeriod: number;
  includedElements: {
    database: boolean;
    files: boolean;
    settings: boolean;
    logs: boolean;
  };
}

export default function BackupRestore() {
  const { toast } = useToast();
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "restore" | "delete" | null;
    backup?: BackupItem;
  }>({ type: null });
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [backupConfigState, setBackupConfigState] = useState<BackupConfig | null>(null);
  
  const queryClient = useQueryClient();

  // Get backup list
  const { data: backups, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['backupList'],
    queryFn: getBackupList,
    staleTime: 60 * 1000 // 1 minute
  });

  // Get backup configuration
  const { data: backupConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['backupConfig'],
    queryFn: getBackupConfig,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Create backup mutation
  const { mutate: createBackupMutation } = useMutation({
    mutationFn: createBackup,
    onMutate: () => {
      setIsBackingUp(true);
      setBackupProgress(0);
      // Start progress simulation
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 300);
      return { interval };
    },
    onSuccess: () => {
      setBackupProgress(100);
      queryClient.invalidateQueries({ queryKey: ['backupList'] });
      setTimeout(() => {
        setIsBackingUp(false);
        toast({
          title: "Backup Completed",
          description: "Your system backup has been completed successfully."
        });
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Backup Failed",
        description: "There was an error creating the backup.",
        variant: "destructive"
      });
      setIsBackingUp(false);
    },
    onSettled: (_data, _error, _variables, context) => {
      // Clear the interval if it exists
      if (context && 'interval' in context) {
        clearInterval(context.interval as NodeJS.Timeout);
      }
    }
  });

  // Restore backup mutation
  const { mutate: restoreBackupMutation } = useMutation({
    mutationFn: restoreBackup,
    onMutate: () => {
      setIsRestoring(true);
      setRestoreProgress(0);
      // Start progress simulation
      const interval = setInterval(() => {
        setRestoreProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 300);
      return { interval };
    },
    onSuccess: () => {
      setRestoreProgress(100);
      setTimeout(() => {
        setIsRestoring(false);
        toast({
          title: "Restore Completed",
          description: "Your system has been restored successfully. You may need to refresh the page."
        });
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Restore Failed",
        description: "There was an error restoring the backup.",
        variant: "destructive"
      });
      setIsRestoring(false);
    },
    onSettled: (_data, _error, _variables, context) => {
      // Clear the interval if it exists
      if (context && 'interval' in context) {
        clearInterval(context.interval as NodeJS.Timeout);
      }
    }
  });

  // Delete backup mutation
  const { mutate: deleteBackupMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupList'] });
      setConfirmDialog({ type: null });
      toast({
        title: "Backup Deleted",
        description: "The selected backup has been deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the backup.",
        variant: "destructive"
      });
      setConfirmDialog({ type: null });
    }
  });

  // Update backup config mutation
  const { mutate: updateBackupConfigMutation, isPending: isSavingConfig } = useMutation({
    mutationFn: updateBackupConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupConfig'] });
      toast({
        title: "Configuration Saved",
        description: "Backup configuration has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "There was an error saving the backup configuration.",
        variant: "destructive"
      });
    }
  });

  // Upload backup mutation
  const { mutate: uploadBackupMutation, isPending: isUploading } = useMutation({
    mutationFn: uploadBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupList'] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      toast({
        title: "Backup Uploaded",
        description: "Your backup file has been uploaded successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the backup file.",
        variant: "destructive"
      });
    }
  });

  // Update local state when backup config is loaded
  useEffect(() => {
    if (backupConfig) {
      setBackupConfigState(backupConfig);
    }
  }, [backupConfig]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd HH:mm");
  };

  // Handle creating a new backup
  const handleCreateBackup = () => {
    createBackupMutation();
  };

  // Handle restoring a backup
  const handleRestore = (backup: BackupItem) => {
    setConfirmDialog({ type: "restore", backup });
  };

  // Handle deleting a backup
  const handleDelete = (backup: BackupItem) => {
    setConfirmDialog({ type: "delete", backup });
  };

  // Perform backup restore
  const performRestore = () => {
    if (!confirmDialog.backup) return;
    restoreBackupMutation(confirmDialog.backup.id);
    setConfirmDialog({ type: null });
  };

  // Perform backup deletion
  const performDelete = () => {
    if (!confirmDialog.backup) return;
    deleteBackupMutation(confirmDialog.backup.id);
  };

  // Download a backup
  const handleDownloadBackup = (backup: BackupItem) => {
    toast({
      title: "Download Started",
      description: "Your backup is being prepared for download."
    });
    
    downloadBackup(backup.id)
      .then(url => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${backup.name.replace(/ /g, '_')}_${backup.date.split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Complete",
          description: "Backup download has started."
        });
      })
      .catch(error => {
        toast({
          title: "Download Failed",
          description: "There was an error downloading the backup.",
          variant: "destructive"
        });
      });
  };

  // Handle backup config change
  const handleConfigChange = (key: keyof BackupConfig, value: any) => {
    if (!backupConfigState) return;
    
    setBackupConfigState({
      ...backupConfigState,
      [key]: value
    });
  };

  // Handle included elements change
  const handleElementChange = (element: keyof BackupConfig['includedElements'], checked: boolean) => {
    if (!backupConfigState) return;
    
    setBackupConfigState({
      ...backupConfigState,
      includedElements: {
        ...backupConfigState.includedElements,
        [element]: checked
      }
    });
  };

  // Save backup configuration
  const saveConfig = () => {
    if (!backupConfigState) return;
    updateBackupConfigMutation(backupConfigState);
  };

  // Handle backup upload
  const handleBackupUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    uploadBackupMutation(uploadFile);
  };

  return (
    <div className="space-y-6">
      {/* Backup Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>About Backups</AlertTitle>
        <AlertDescription>
          Backups contain system data and configurations. Regular backups are recommended to prevent data loss.
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Backup List</TabsTrigger>
          <TabsTrigger value="settings">Backup Settings</TabsTrigger>
        </TabsList>
        
        {/* Backup List Tab */}
        <TabsContent value="list" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Backups</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button onClick={handleCreateBackup} disabled={isBackingUp}>
                {isBackingUp ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {isBackingUp && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span>Creating backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="h-2" />
            </div>
          )}

          {isLoadingBackups ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : backups && backups.length > 0 ? (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-popover divide-y divide-border">
                  {backups.map((backup) => (
                    <tr key={backup.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {backup.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatDate(backup.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {backup.size}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm capitalize">
                        {backup.type.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(backup)}
                          >
                            <FileUp className="h-4 w-4" />
                            <span className="sr-only">Restore</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(backup)}
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border rounded-md flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-muted-foreground">No backups available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a backup to protect your data
                </p>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Backup Settings Tab */}
        <TabsContent value="settings" className="space-y-4 pt-4">
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : backupConfigState ? (
            <Card>
              <CardHeader>
                <CardTitle>Backup Configuration</CardTitle>
                <CardDescription>
                  Configure automatic backup settings and retention policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoBackup"
                    checked={backupConfigState.autoBackup}
                    onCheckedChange={(checked) => 
                      handleConfigChange('autoBackup', checked === true)
                    }
                  />
                  <Label htmlFor="autoBackup">Enable automatic backups</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Backup Schedule</Label>
                    <Select
                      value={backupConfigState.schedule}
                      onValueChange={(value) => 
                        handleConfigChange('schedule', value)
                      }
                      disabled={!backupConfigState.autoBackup}
                    >
                      <SelectTrigger id="schedule">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Backup Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={backupConfigState.time}
                      onChange={(e) => handleConfigChange('time', e.target.value)}
                      disabled={!backupConfigState.autoBackup}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                  <Input
                    id="retentionPeriod"
                    type="number"
                    min="1"
                    max="365"
                    value={backupConfigState.retentionPeriod}
                    onChange={(e) => handleConfigChange('retentionPeriod', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Backups older than this will be automatically deleted
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label>Include in Backup</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeDatabase"
                        checked={backupConfigState.includedElements.database}
                        onCheckedChange={(checked) => 
                          handleElementChange('database', checked === true)
                        }
                      />
                      <Label htmlFor="includeDatabase">Database</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeFiles"
                        checked={backupConfigState.includedElements.files}
                        onCheckedChange={(checked) => 
                          handleElementChange('files', checked === true)
                        }
                      />
                      <Label htmlFor="includeFiles">Files</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeSettings"
                        checked={backupConfigState.includedElements.settings}
                        onCheckedChange={(checked) => 
                          handleElementChange('settings', checked === true)
                        }
                      />
                      <Label htmlFor="includeSettings">Settings</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeLogs"
                        checked={backupConfigState.includedElements.logs}
                        onCheckedChange={(checked) => 
                          handleElementChange('logs', checked === true)
                        }
                      />
                      <Label htmlFor="includeLogs">Logs</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={saveConfig} disabled={isSavingConfig}>
                  {isSavingConfig ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Could not load backup configuration</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.type === "restore"} 
        onOpenChange={(open) => !open && setConfirmDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Restore</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore from this backup? This will replace your current system data.
            </DialogDescription>
          </DialogHeader>
          {isRestoring ? (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between text-sm">
                <span>Restoring...</span>
                <span>{restoreProgress}%</span>
              </div>
              <Progress value={restoreProgress} className="h-2" />
            </div>
          ) : (
            <>
              <div className="py-4">
                <p className="text-sm font-medium">Backup details:</p>
                <ul className="mt-2 text-sm text-muted-foreground">
                  <li>Name: {confirmDialog.backup?.name}</li>
                  <li>Date: {confirmDialog.backup ? formatDate(confirmDialog.backup.date) : ''}</li>
                  <li>Type: {confirmDialog.backup?.type}</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ type: null })}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={performRestore}>
                  Restore System
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.type === "delete"} 
        onOpenChange={(open) => !open && setConfirmDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium">Backup details:</p>
            <ul className="mt-2 text-sm text-muted-foreground">
              <li>Name: {confirmDialog.backup?.name}</li>
              <li>Date: {confirmDialog.backup ? formatDate(confirmDialog.backup.date) : ''}</li>
              <li>Type: {confirmDialog.backup?.type}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ type: null })}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={performDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>Delete Backup</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Backup Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Backup</DialogTitle>
            <DialogDescription>
              Upload a backup file to restore your system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBackupUpload}>
            <div className="space-y-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="backupFile">Backup File</Label>
                <Input
                  id="backupFile"
                  type="file"
                  accept=".zip,.sql,.gz"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: .zip, .sql, .gz
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!uploadFile || isUploading}>
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>Upload</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 