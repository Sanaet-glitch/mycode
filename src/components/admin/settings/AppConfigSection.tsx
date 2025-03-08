import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Undo } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppSettings, updateAppSettings } from "@/services/configService";

// Define the settings interface
interface AppSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportEmail: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
  defaultUserRole: string;
  allowedFileTypes: string;
  maxFileSize: number;
  maintenanceMode: boolean;
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
}

// Default settings - will be used if no settings are found in the database
const defaultSettings: AppSettings = {
  siteName: "Campus Connect",
  siteDescription: "A comprehensive campus management system",
  contactEmail: "contact@campusconnect.com",
  supportEmail: "support@campusconnect.com",
  logoUrl: "/images/logo.png",
  faviconUrl: "/favicon.ico",
  primaryColor: "#3b82f6",
  allowRegistration: true,
  requireEmailVerification: true,
  maxLoginAttempts: 5,
  sessionTimeout: 120,
  defaultUserRole: "student",
  allowedFileTypes: "pdf,doc,docx,jpg,jpeg,png",
  maxFileSize: 10,
  maintenanceMode: false,
  timeZone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h"
};

export default function AppConfigSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState("general");
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(defaultSettings);
  const queryClient = useQueryClient();

  // Fetch app settings
  const { data: fetchedSettings, isLoading: isFetchingSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: getAppSettings,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Update settings mutation
  const { mutate: saveSettingsMutation, isPending: isSaving } = useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      toast({
        title: "Settings Saved",
        description: "Application settings have been updated successfully.",
      });
      setOriginalSettings(settings);
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update settings when fetched
  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | 
    React.ChangeEvent<HTMLSelectElement> | 
    { name: string; value: any }
  ) => {
    const { name, value, type, checked } = e.target || e;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Save settings
  const saveSettings = async () => {
    saveSettingsMutation(settings);
  };

  // Reset settings to last saved state
  const resetSettings = () => {
    setSettings(originalSettings);
    toast({
      title: "Settings Reset",
      description: "Changes have been discarded.",
    });
  };

  // Check if settings have changed
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Configuration</CardTitle>
          <CardDescription>
            Manage general settings and configuration for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetchingSettings ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="registration">Registration</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={settings.siteName}
                      onChange={handleChange}
                      placeholder="Campus Connect"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Input
                      id="siteDescription"
                      name="siteDescription"
                      value={settings.siteDescription}
                      onChange={handleChange}
                      placeholder="A comprehensive campus management system"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      value={settings.contactEmail}
                      onChange={handleChange}
                      placeholder="contact@example.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      value={settings.supportEmail}
                      onChange={handleChange}
                      placeholder="support@example.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeZone">Default Time Zone</Label>
                    <Select
                      value={settings.timeZone}
                      onValueChange={(value) => handleSelectChange("timeZone", value)}
                    >
                      <SelectTrigger id="timeZone">
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={(value) => handleSelectChange("dateFormat", value)}
                    >
                      <SelectTrigger id="dateFormat">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      name="maxLoginAttempts"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.maxLoginAttempts}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of failed login attempts before account lockout
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      name="sessionTimeout"
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.sessionTimeout}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Inactive session timeout in minutes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMode" className="block mb-2">Maintenance Mode</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="maintenanceMode"
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => handleSwitchChange("maintenanceMode", checked)}
                      />
                      <Label htmlFor="maintenanceMode">
                        {settings.maintenanceMode ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When enabled, only administrators can access the system
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Registration Settings */}
              <TabsContent value="registration" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allowRegistration" className="block mb-2">Allow Public Registration</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowRegistration"
                        checked={settings.allowRegistration}
                        onCheckedChange={(checked) => handleSwitchChange("allowRegistration", checked)}
                      />
                      <Label htmlFor="allowRegistration">
                        {settings.allowRegistration ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Allow users to self-register on the platform
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requireEmailVerification" className="block mb-2">Require Email Verification</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireEmailVerification"
                        checked={settings.requireEmailVerification}
                        onCheckedChange={(checked) => handleSwitchChange("requireEmailVerification", checked)}
                      />
                      <Label htmlFor="requireEmailVerification">
                        {settings.requireEmailVerification ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Require email verification before users can log in
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultUserRole">Default User Role</Label>
                    <Select
                      value={settings.defaultUserRole}
                      onValueChange={(value) => handleSelectChange("defaultUserRole", value)}
                    >
                      <SelectTrigger id="defaultUserRole">
                        <SelectValue placeholder="Select default role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="lecturer">Lecturer</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Default role assigned to new users
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      value={settings.logoUrl}
                      onChange={handleChange}
                      placeholder="/images/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      name="faviconUrl"
                      value={settings.faviconUrl}
                      onChange={handleChange}
                      placeholder="/favicon.ico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        id="primaryColor"
                        name="primaryColor"
                        value={settings.primaryColor}
                        onChange={handleChange}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        id="primaryColorText"
                        name="primaryColor"
                        value={settings.primaryColor}
                        onChange={handleChange}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select
                      value={settings.timeFormat}
                      onValueChange={(value) => handleSelectChange("timeFormat", value)}
                    >
                      <SelectTrigger id="timeFormat">
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                        <SelectItem value="24h">24-hour (13:30)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <div className="flex items-center text-xs text-muted-foreground">
            {hasChanges ? "Unsaved changes" : "No changes"}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              disabled={!hasChanges || isSaving}
            >
              <Undo className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 