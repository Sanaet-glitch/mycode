import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, updateUser, resetUserPassword, deleteUser, UserUpdateData } from "@/services/userService";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, UserCog, Shield, BookOpen, Calendar, School, Mail, Phone, Check, X, KeyRound, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { sendPasswordResetEmail } from "@/services/emailService";

const AdminUserDetails = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ success: boolean; temporaryPassword?: string }>({ success: false });
  const [showResetPasswordResult, setShowResetPasswordResult] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setUser(userData);
        
        // Set form values
        setFullName(userData.full_name || "");
        setEmail(userData.email || "");
        setRole(userData.role || "student");
        setDepartment(userData.department || "");
        setStudentId(userData.student_id || "");
        setPhoneNumber(userData.phone_number || "");
        setIsActive(userData.is_active !== false); // Default to true if not set
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    
    try {
      setSaving(true);
      
      const updateData: UserUpdateData = {
        fullName,
        role: role as any,
        department,
        studentId,
        phoneNumber,
        isActive,
      };
      
      const result = await updateUser(userId, updateData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "User profile updated successfully",
        });
      } else {
        throw new Error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId) return;
    
    try {
      const result = await resetUserPassword(userId);
      setResetPasswordResult(result);
      setShowResetPasswordResult(true);
      
      if (result.success && user?.email) {
        // Send email notification
        await sendPasswordResetEmail(user.email, result.temporaryPassword || "");
        toast({
          title: "Password Reset",
          description: "Password has been reset and emailed to the user.",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;
    
    try {
      const result = await deleteUser(userId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        navigate("/admin/users");
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/users")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Summary and basic information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.avatar_url} alt={fullName} />
                <AvatarFallback className="text-2xl">
                  {fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{fullName}</h2>
              <p className="text-sm text-gray-500">{email}</p>
              <div className="mt-2">
                <Badge variant={role === "admin" ? "destructive" : role === "lecturer" ? "default" : "secondary"}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
                <Badge variant={isActive ? "outline" : "destructive"} className="ml-2">
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-6 w-full space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">{email}</span>
                </div>
                {phoneNumber && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{phoneNumber}</span>
                  </div>
                )}
                {department && (
                  <div className="flex items-center">
                    <School className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{department}</span>
                  </div>
                )}
                {studentId && (
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">ID: {studentId}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button onClick={() => navigate(`/admin/users/${userId}/activity`)} className="w-full" variant="outline">
                View Activity Log
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user
                      account and remove their data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser}>Delete User</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>

          {/* Edit User Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>Update user information</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="account">Account Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fullName" className="text-right">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="lecturer">Lecturer</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="department" className="text-right">
                        Department
                      </Label>
                      <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="studentId" className="text-right">
                        Student ID
                      </Label>
                      <Input
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phoneNumber" className="text-right">
                        Phone Number
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="account" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Account Status</h3>
                        <p className="text-sm text-gray-500">Enable or disable user access</p>
                      </div>
                      <Switch 
                        checked={isActive} 
                        onCheckedChange={setIsActive} 
                      />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Password Management</h3>
                      <p className="text-sm text-gray-500 mb-4">Reset the user's password</p>
                      
                      <AlertDialog open={showResetPasswordResult} onOpenChange={setShowResetPasswordResult}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset Password
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          {!resetPasswordResult.success ? (
                            <>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset User Password</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will reset the user's password to a temporary one. 
                                  They will be required to change it on their next login.
                                  Do you want to proceed?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetPassword}>Reset Password</AlertDialogAction>
                              </AlertDialogFooter>
                            </>
                          ) : (
                            <>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Password Reset Successfully</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <p>The user's password has been reset. Here is the temporary password:</p>
                                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-center">
                                    {resetPasswordResult.temporaryPassword}
                                  </div>
                                  <p className="mt-2">
                                    Please share this with the user securely. They will be asked to change
                                    this password on their next login.
                                  </p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogAction>Done</AlertDialogAction>
                              </AlertDialogFooter>
                            </>
                          )}
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminUserDetails; 