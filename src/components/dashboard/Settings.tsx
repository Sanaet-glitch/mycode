import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  Mail, 
  Calendar, 
  Download, 
  ChevronRight, 
  AlarmClock,
  ClipboardList,
  Eye,
  EyeOff,
  Smartphone,
  User,
  Loader2
} from "lucide-react";
import { 
  requestNotificationPermission, 
  areNotificationsSupported, 
  areNotificationsEnabled,
  getNotificationPreferences,
  saveNotificationPreference
} from "@/utils/notifications";

export const Settings = () => {
  const [activeTab, setActiveTab] = useState("notifications");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [classNotifications, setClassNotifications] = useState(true);
  const [attendanceNotifications, setAttendanceNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get user's profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      return data;
    }
  });

  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Load notification preferences from local storage
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      // Check if browser notifications are supported and enabled
      const notificationsSupported = areNotificationsSupported();
      const notificationsPermitted = areNotificationsEnabled();
      setNotificationsEnabled(notificationsPermitted);
      
      if (notificationsSupported) {
        // Load preferences from local storage
        const prefs = getNotificationPreferences();
        setClassNotifications(prefs.class !== false); // Default to true
        setAttendanceNotifications(prefs.attendance !== false); // Default to true
        setReminderNotifications(prefs.reminder !== false); // Default to true
        setReminderTime(prefs.reminderTime || 15);
      }
      
      // Load email preferences from user profile
      if (profile) {
        setEmailNotifications(profile.email_notifications || false);
      }
      
      setIsLoading(false);
    };
    
    loadNotificationPreferences();
  }, [profile]);

  // Request notification permission
  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission === "granted");
    
    if (permission === "granted") {
      toast({
        title: "Notifications enabled",
        description: "You will now receive notifications for classes and attendance."
      });
    } else {
      toast({
        title: "Notifications disabled",
        description: "You will not receive browser notifications. You can enable them in your browser settings.",
        variant: "destructive"
      });
    }
  };

  // Save notification settings
  const handleSaveNotificationSettings = () => {
    // Save to local storage
    saveNotificationPreference("class", classNotifications);
    saveNotificationPreference("attendance", attendanceNotifications);
    saveNotificationPreference("reminder", reminderNotifications);
    saveNotificationPreference("reminderTime", reminderTime);
    
    // Save email preference to profile
    updateProfile({ email_notifications: emailNotifications });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your app preferences and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Eye className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Browser Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications in your browser
                      </p>
                    </div>
                    {areNotificationsSupported() ? (
                      notificationsEnabled ? (
                        <Button variant="outline" size="sm" onClick={handleRequestPermission}>
                          <Bell className="h-4 w-4 mr-2 text-green-500" />
                          Enabled
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={handleRequestPermission}>
                          <Bell className="h-4 w-4 mr-2 text-red-500" />
                          Disabled
                        </Button>
                      )
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <Bell className="h-4 w-4 mr-2" />
                        Not Supported
                      </Button>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Notification Types</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="class-notifications">Class Schedule</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive notifications about upcoming classes
                        </p>
                      </div>
                      <Switch
                        id="class-notifications"
                        checked={classNotifications}
                        onCheckedChange={setClassNotifications}
                        disabled={!notificationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="attendance-notifications">Attendance</Label>
                        <p className="text-xs text-muted-foreground">
                          Notifications for attendance marking and verification
                        </p>
                      </div>
                      <Switch
                        id="attendance-notifications"
                        checked={attendanceNotifications}
                        onCheckedChange={setAttendanceNotifications}
                        disabled={!notificationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="reminder-notifications">Class Reminders</Label>
                        <p className="text-xs text-muted-foreground">
                          Get reminders before your classes start
                        </p>
                      </div>
                      <Switch
                        id="reminder-notifications"
                        checked={reminderNotifications}
                        onCheckedChange={setReminderNotifications}
                        disabled={!notificationsEnabled}
                      />
                    </div>
                    
                    {reminderNotifications && (
                      <div className="pl-6 border-l-2 border-muted">
                        <Label htmlFor="reminder-time" className="text-sm">
                          Reminder time (minutes before class)
                        </Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <input
                            id="reminder-time"
                            type="range"
                            min="5"
                            max="30"
                            step="5"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(Number(e.target.value))}
                            className="w-32"
                            disabled={!notificationsEnabled}
                          />
                          <span className="text-sm">{reminderTime} minutes</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Other Notifications</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive important updates via email
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSaveNotificationSettings} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="appearance">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Customize the appearance of the application
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="justify-start">
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button variant="outline" className="justify-start">
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button variant="default" className="justify-start">
                  <Laptop className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Text Size</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="text-size" className="text-sm">
                    Adjust text size
                  </Label>
                  <input
                    id="text-size"
                    type="range"
                    min="80"
                    max="120"
                    step="10"
                    defaultValue="100"
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="account">
            <div className="space-y-4">
              {isLoadingProfile ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Account Information</h3>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <div className="col-span-3 flex items-center">
                          <span>{profile?.first_name} {profile?.last_name}</span>
                          <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <div className="col-span-3 flex items-center">
                          <span>{profile?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Privacy</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketing">Share usage data</Label>
                        <Switch id="marketing" defaultChecked={false} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We collect anonymous usage data to improve the application.
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Actions</h3>
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" className="justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Your Data
                      </Button>
                      <Button variant="outline" className="justify-start text-red-500 hover:text-red-600">
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Missing component imports
const Sun = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const Moon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const Laptop = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
  </svg>
);

const Trash = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
); 