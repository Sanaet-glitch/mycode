import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseBackup, HardDrive, Database, Files } from "lucide-react";

// Import maintenance components
import BackupRestore from "@/components/admin/settings/maintenance/BackupRestore";
import SystemLogs from "@/components/admin/settings/maintenance/SystemLogs";
import CacheManagement from "@/components/admin/settings/maintenance/CacheManagement";
import DatabaseManagement from "@/components/admin/settings/maintenance/DatabaseManagement";

/**
 * System Maintenance Section Component
 * This component organizes all maintenance-related functionality
 */
export default function SystemMaintenanceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Maintenance</CardTitle>
        <CardDescription>
          Manage system backups, logs, cache, and database maintenance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backup">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="backup">
              <DatabaseBackup className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Backup & Restore</span>
              <span className="sm:hidden">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Files className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">System Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="cache">
              <HardDrive className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cache Management</span>
              <span className="sm:hidden">Cache</span>
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Database</span>
              <span className="sm:hidden">DB</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup">
            <BackupRestore />
          </TabsContent>
          
          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>
          
          <TabsContent value="cache">
            <CacheManagement />
          </TabsContent>
          
          <TabsContent value="database">
            <DatabaseManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 