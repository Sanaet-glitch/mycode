import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from "@/contexts/SessionContext";
import { useProfile } from "@/hooks/use-api-query";
import { z } from "zod";
import { ProfileImageUpload } from '@/components/ProfileImageUpload';

// Form validation schema
const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional(),
  role: z.string(),
  department: z.string().optional(),
  phone_number: z.string().optional(),
  // Add more fields as needed
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { useUserProfile, useUpdateProfile } = useProfile();
  const { data: profile, isLoading } = useUserProfile(userId as string);
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Setup form with default values from the profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      email: session?.user?.email || "",
      role: profile?.role || "student",
      department: profile?.department || "",
      phone_number: profile?.phone_number || "",
    },
    values: {
      full_name: profile?.full_name || "",
      email: session?.user?.email || "",
      role: profile?.role || "student",
      department: profile?.department || "",
      phone_number: profile?.phone_number || "",
    },
  });

  // Handle profile update
  const onSubmit = async (values: ProfileFormValues) => {
    if (!userId) return;
    
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        updates: {
          full_name: values.full_name,
          department: values.department,
          phone_number: values.phone_number,
        }
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="account">Account Settings</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                <div>
                  <ProfileImageUpload 
                    userId={userId as string}
                    currentAvatarUrl={profile?.avatar_url}
                    onAvatarChange={(url) => updateProfileMutation.mutateAsync({
                      userId: userId as string,
                      updates: { avatar_url: url }
                    })}
                    size="lg"
                  />
                </div>
                
                <div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email" disabled {...field} />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support for help.</p>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <Input placeholder="Your role" disabled {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Input placeholder="Your department" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </TabsContent>
            
            {/* Account Settings Tab */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account security and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                  
                  <div className="space-y-1 mt-6">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                  
                  <div className="space-y-1 mt-6">
                    <h3 className="text-lg font-medium">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage how and when you receive notifications
                    </p>
                  </div>
                  <Button variant="outline">Notification Settings</Button>
                  
                  <div className="space-y-1 mt-6">
                    <h3 className="text-lg font-medium">Language & Region</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your preferred language and regional settings
                    </p>
                  </div>
                  <Button variant="outline">Language & Region Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage; 