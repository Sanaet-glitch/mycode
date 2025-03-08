import { useState, useEffect } from 'react';
import { createUser, getAllUsers, UserData, UserRole } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<{ user: any; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  
  // Load all users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users. Please try again.');
      }
    };
    
    loadUsers();
  }, []);
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreateSuccess(null);
    
    try {
      const userData: UserData = {
        email,
        fullName,
        role,
      };
      
      const result = await createUser(userData);
      
      if (result.success) {
        setCreateSuccess({
          user: result.user,
          password: result.temporaryPassword,
        });
        
        // Reset form
        setEmail('');
        setFullName('');
        setRole('student');
        
        // Refresh user list
        const updatedUsers = await getAllUsers();
        setUsers(updatedUsers);
      } else {
        setError(result.error?.message || 'Failed to create user. Please try again.');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container p-4 mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <Tabs defaultValue="create">
        <TabsList className="mb-4">
          <TabsTrigger value="create">Create User</TabsTrigger>
          <TabsTrigger value="list">User List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Create a new user account with a temporary password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {createSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>User Created Successfully</AlertTitle>
                  <AlertDescription>
                    <p>User {createSuccess.user.email} was created successfully.</p>
                    <p className="mt-2 font-semibold">
                      Temporary Password: <span className="font-mono">{createSuccess.password}</span>
                    </p>
                    <p className="text-sm mt-2">
                      Please provide this password to the user. They will be asked to change it
                      on their first login.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating User...' : 'Create User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>
                Manage existing user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No users found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Password Reset</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.force_password_change ? (
                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Completed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 