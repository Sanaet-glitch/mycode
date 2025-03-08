import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Settings, Save, ServerCrash, Mail, Database, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { getSystemInfo } from "@/services/configService";

// Import the section components
import AppConfigSection from "@/components/admin/settings/AppConfigSection";
import EmailTemplatesSection from "@/components/admin/settings/EmailTemplatesSection";
import SystemMaintenanceSection from "@/components/admin/settings/SystemMaintenanceSection";

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("app-config");
  
  // Fetch system information
  const { data: systemInfo, isLoading: isLoadingSystemInfo } = useQuery({
    queryKey: ['systemInfo'],
    queryFn: getSystemInfo,
    staleTime: 60 * 1000 // 1 minute
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings, email templates, and system maintenance
        </p>
      </div>

      {/* System Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">System Status</CardTitle>
            <Badge 
              variant={systemInfo?.databaseConnection === 'healthy' ? "success" : "destructive"}
              className={systemInfo?.databaseConnection === 'healthy' 
                ? "bg-green-600 hover:bg-green-600/90" 
                : "bg-red-600 hover:bg-red-600/90"
              }
            >
              {systemInfo?.databaseConnection === 'healthy' ? "Operational" : "Issues Detected"}
            </Badge>
          </div>
          <CardDescription>Current system information and performance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSystemInfo ? (
            <div className="space-y-2">
              <Progress value={undefined} className="h-2" />
              <Progress value={undefined} className="h-2" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Version</div>
                <div className="text-lg font-semibold">{systemInfo?.version}</div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Environment</div>
                <div className="text-lg font-semibold">{systemInfo?.environment}</div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Node.js</div>
                <div className="text-lg font-semibold">{systemInfo?.nodeVersion}</div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Uptime</div>
                <div className="text-lg font-semibold">{systemInfo?.uptime}</div>
              </div>
            </div>
          )}

          {/* System Load Indicators */}
          {systemInfo && (
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>CPU Usage</span>
                  <span>{systemInfo.serverLoad.cpu}%</span>
                </div>
                <Progress 
                  value={systemInfo.serverLoad.cpu} 
                  className={`h-2 ${systemInfo.serverLoad.cpu > 80 ? "bg-red-500" : (systemInfo.serverLoad.cpu > 60 ? "bg-yellow-500" : "")}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Memory Usage</span>
                  <span>{systemInfo.serverLoad.memory}%</span>
                </div>
                <Progress 
                  value={systemInfo.serverLoad.memory} 
                  className={`h-2 ${systemInfo.serverLoad.memory > 80 ? "bg-red-500" : (systemInfo.serverLoad.memory > 60 ? "bg-yellow-500" : "")}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Disk Usage</span>
                  <span>{systemInfo.serverLoad.disk}%</span>
                </div>
                <Progress 
                  value={systemInfo.serverLoad.disk} 
                  className={`h-2 ${systemInfo.serverLoad.disk > 80 ? "bg-red-500" : (systemInfo.serverLoad.disk > 60 ? "bg-yellow-500" : "")}`}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="app-config" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="app-config">
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">App Configuration</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger value="email-templates">
            <Mail className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Email Templates</span>
            <span className="sm:hidden">Email</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <ServerCrash className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">System Maintenance</span>
            <span className="sm:hidden">Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* Application Configuration */}
        <TabsContent value="app-config">
          <AppConfigSection />
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email-templates">
          <EmailTemplatesSection />
        </TabsContent>

        {/* System Maintenance */}
        <TabsContent value="maintenance">
          <SystemMaintenanceSection />
        </TabsContent>
      </Tabs>
    </div>
  );
} 