import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuditLog } from '@/types/database';
import { 
  resetUserPassword, 
  getUserActivityLogs, 
  getAllDepartments, 
  logUserAction,
  countUsersByRole
} from '@/services/userService';
import { 
  Button, 
  Input, 
  Table, 
  Modal, 
  Form, 
  Select, 
  Switch, 
  Tabs, 
  Badge, 
  notification, 
  Tooltip, 
  Popconfirm,
  Tag,
  Card,
  Space,
  Drawer,
  List,
  Typography,
  Divider,
  Checkbox,
  Row,
  Col,
  Spin
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SearchOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  EyeOutlined, 
  DownloadOutlined, 
  UploadOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  TeamOutlined,
  SettingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;

// Type definition for our form
interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  studentId?: string;
  phoneNumber?: string;
  isActive: boolean;
}

// Main component
const EnhancedUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [activityLogsVisible, setActivityLogsVisible] = useState(false);
  const [currentUserLogs, setCurrentUserLogs] = useState<AuditLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [bulkActionVisible, setBulkActionVisible] = useState(false);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState('xlsx');
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);
  
  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters();
  }, [searchText, filterRole, filterDepartment, filterActive, users]);
  
  // Fetch all users from Supabase
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('lastName', { ascending: true });

      if (error) throw error;
      
      // Log this admin action
      if (user) {
        await logUserAction(
          user.id,
          'VIEW_ALL_USERS',
          'profiles',
          'all',
          { count: data?.length || 0 }
        );
      }
      
      setUsers(data || []);
      setPagination(prev => ({ ...prev, total: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching users:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch users. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const depts = await getAllDepartments();
      setDepartments(depts || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };
  
  // Apply filters to the user list
  const applyFilters = () => {
    let result = [...users];
    
    // Apply text search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        user => 
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          (user as any).studentId?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply role filter
    if (filterRole) {
      result = result.filter(user => user.role === filterRole);
    }
    
    // Apply department filter
    if (filterDepartment) {
      result = result.filter(user => (user as any).department === filterDepartment);
    }
    
    // Apply active status filter
    if (filterActive !== null) {
      result = result.filter(user => (user as any).is_active === filterActive);
    }
    
    setFilteredUsers(result);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setFilterRole(null);
    setFilterDepartment(null);
    setFilterActive(null);
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      // Log this admin action
      if (user) {
        await logUserAction(
          user.id,
          'DELETE_USER',
          'auth.users',
          userId,
          { deleted_by: user.id }
        );
      }
      
      notification.success({
        message: 'Success',
        description: 'User has been deleted successfully.',
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to delete user. Please try again later.',
      });
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (userId: string) => {
    try {
      const result = await resetUserPassword(userId);
      
      if (!result.success) throw new Error('Password reset failed');
      
      // Log this admin action
      if (user) {
        await logUserAction(
          user.id,
          'RESET_PASSWORD',
          'auth.users',
          userId,
          { reset_by: user.id }
        );
      }
      
      notification.success({
        message: 'Password Reset',
        description: `Temporary password: ${result.temporaryPassword}`,
        duration: 0, // Don't auto close this notification
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to reset password. Please try again later.',
      });
    }
  };
  
  // Show edit modal
  const showEditModal = (record: Profile) => {
    setEditingUser(record);
    form.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      role: record.role,
      department: (record as any).department,
      studentId: (record as any).studentId,
      phoneNumber: (record as any).phoneNumber,
      isActive: (record as any).is_active !== false, // Default to true if undefined
    });
    setIsModalVisible(true);
  };
  
  // Show create user modal
  const showCreateModal = () => {
    createForm.resetFields();
    setIsCreateModalVisible(true);
  };
  
  // Handle user update
  const handleUpdateUser = async (values: UserFormData) => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          department: values.department,
          student_id: values.studentId,
          phone_number: values.phoneNumber,
          is_active: values.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;
      
      // If email was changed, update auth user as well
      if (values.email !== editingUser.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          editingUser.id,
          { email: values.email }
        );
        
        if (authError) throw authError;
      }
      
      // Log this admin action
      if (user) {
        await logUserAction(
          user.id,
          'UPDATE_USER',
          'profiles',
          editingUser.id,
          { 
            updated_fields: Object.keys(values).filter(
              key => values[key as keyof UserFormData] !== 
                (editingUser as any)[key === 'isActive' ? 'is_active' : key]
            )
          }
        );
      }
      
      notification.success({
        message: 'Success',
        description: 'User has been updated successfully.',
      });
      
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update user. Please try again later.',
      });
    }
  };
  
  // Handle user creation
  const handleCreateUser = async (values: UserFormData) => {
    try {
      // Create user in Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: values.email,
        email_confirm: true,
        user_metadata: {
          firstName: values.firstName,
          lastName: values.lastName,
        },
        app_metadata: {
          role: values.role,
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role,
            department: values.department,
            student_id: values.studentId,
            phone_number: values.phoneNumber,
            is_active: values.isActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (profileError) throw profileError;
        
        // Log this admin action
        if (user) {
          await logUserAction(
            user.id,
            'CREATE_USER',
            'profiles',
            data.user.id,
            { created_by: user.id }
          );
        }
        
        notification.success({
          message: 'Success',
          description: 'User has been created successfully.',
        });
        
        setIsCreateModalVisible(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      notification.error({
        message: 'Error',
        description: `Failed to create user: ${(error as any)?.message || 'Please try again later.'}`,
      });
    }
  };
  
  // View user activity logs
  const handleViewActivityLogs = async (userId: string) => {
    setActivityLogsVisible(true);
    setLogLoading(true);
    
    try {
      const logs = await getUserActivityLogs(userId);
      setCurrentUserLogs(logs);
      
      // Log this admin action
      if (user) {
        await logUserAction(
          user.id,
          'VIEW_USER_LOGS',
          'audit_logs',
          userId,
          { logs_count: logs.length }
        );
      }
    } catch (error) {
      console.error('Error fetching user logs:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch user activity logs.',
      });
    } finally {
      setLogLoading(false);
    }
  };
  
  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    try {
      if (bulkAction === 'activate') {
        // Activate users
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: true })
          .in('id', selectedUsers);
          
        if (error) throw error;
        
        // Log this admin action
        if (user) {
          await logUserAction(
            user.id,
            'BULK_ACTIVATE_USERS',
            'profiles',
            'multiple',
            { user_ids: selectedUsers }
          );
        }
      } else if (bulkAction === 'deactivate') {
        // Deactivate users
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .in('id', selectedUsers);
          
        if (error) throw error;
        
        // Log this admin action
        if (user) {
          await logUserAction(
            user.id,
            'BULK_DEACTIVATE_USERS',
            'profiles',
            'multiple',
            { user_ids: selectedUsers }
          );
        }
      } else if (bulkAction === 'delete') {
        // Delete users
        for (const userId of selectedUsers) {
          const { error } = await supabase.auth.admin.deleteUser(userId);
          if (error) throw error;
        }
        
        // Log this admin action
        if (user) {
          await logUserAction(
            user.id,
            'BULK_DELETE_USERS',
            'auth.users',
            'multiple',
            { user_ids: selectedUsers }
          );
        }
      } else if (bulkAction === 'change_department') {
        const department = form.getFieldValue('bulkDepartment');
        
        // Change department
        const { error } = await supabase
          .from('profiles')
          .update({ department })
          .in('id', selectedUsers);
          
        if (error) throw error;
        
        // Log this admin action
        if (user) {
          await logUserAction(
            user.id,
            'BULK_CHANGE_DEPARTMENT',
            'profiles',
            'multiple',
            { user_ids: selectedUsers, department }
          );
        }
      }
      
      notification.success({
        message: 'Success',
        description: `Bulk action "${bulkAction}" completed successfully for ${selectedUsers.length} users.`,
      });
      
      setSelectedUsers([]);
      setBulkActionVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      notification.error({
        message: 'Error',
        description: `Failed to perform bulk action: ${(error as any)?.message || 'Please try again later.'}`,
      });
    }
  };
  
  // Export users
  const handleExportUsers = () => {
    try {
      const dataToExport = filteredUsers.map(user => ({
        'ID': user.id,
        'Email': user.email,
        'First Name': user.firstName,
        'Last Name': user.lastName,
        'Role': user.role,
        'Department': (user as any).department || '',
        'Student ID': (user as any).studentId || '',
        'Phone': (user as any).phoneNumber || '',
        'Active': (user as any).is_active ? 'Yes' : 'No',
        'Created At': (user as any).created_at ? new Date(user.created_at).toLocaleString() : '',
        'Last Login': (user as any).last_login ? new Date((user as any).last_login).toLocaleString() : '',
      }));
      
      if (exportFormat === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        XLSX.writeFile(workbook, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (exportFormat === 'csv') {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else if (exportFormat === 'json') {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
      
      // Log this admin action
      if (user) {
        logUserAction(
          user.id,
          'EXPORT_USERS',
          'profiles',
          'multiple',
          { 
            format: exportFormat, 
            count: dataToExport.length,
            filters: {
              searchText: searchText || null,
              role: filterRole,
              department: filterDepartment,
              active: filterActive
            }
          }
        );
      }
      
      notification.success({
        message: 'Export Successful',
        description: `${dataToExport.length} users exported to ${exportFormat.toUpperCase()} format.`,
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      notification.error({
        message: 'Export Failed',
        description: 'Failed to export users. Please try again later.',
      });
    }
  };
  
  // Table columns configuration
  const columns = [
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'name',
      render: (_: any, record: Profile) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{`${record.firstName} ${record.lastName}`}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          {(record as any).studentId && (
            <div style={{ fontSize: '12px', color: '#888' }}>
              ID: {(record as any).studentId}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = 'default';
        if (role === 'admin') color = 'red';
        else if (role === 'lecturer') color = 'blue';
        else if (role === 'student') color = 'green';
        
        return <Tag color={color}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || 'N/A',
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Profile) => {
        const isActive = (record as any).is_active !== false;
        return (
          <Badge
            status={isActive ? 'success' : 'error'}
            text={isActive ? 'Active' : 'Inactive'}
          />
        );
      },
    },
    {
      title: 'Last Login',
      key: 'lastLogin',
      render: (record: Profile) => {
        const lastLogin = (record as any).last_login;
        return lastLogin 
          ? format(new Date(lastLogin), 'MMM dd, yyyy HH:mm')
          : 'Never';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Profile) => (
        <Space>
          <Tooltip title="Edit User">
            <Button
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Reset Password">
            <Button
              icon={<LockOutlined />}
              onClick={() => handleResetPassword(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="View Activity">
            <Button
              icon={<HistoryOutlined />}
              onClick={() => handleViewActivityLogs(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete User">
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="Yes"
              cancelText="No"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  // Render component
  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col>
          <Title level={2}>
            <UserOutlined /> User Management
          </Title>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />} 
              onClick={showCreateModal}
            >
              Add User
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportUsers}
            >
              Export
            </Button>
            <Select
              value={exportFormat}
              onChange={setExportFormat}
              style={{ width: 80 }}
            >
              <Option value="xlsx">XLSX</Option>
              <Option value="csv">CSV</Option>
              <Option value="json">JSON</Option>
            </Select>
          </Space>
        </Col>
      </Row>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col flex="1">
            <Input
              placeholder="Search by name, email, or ID"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Role"
              style={{ width: 120 }}
              allowClear
              value={filterRole}
              onChange={setFilterRole}
            >
              <Option value="admin">Admin</Option>
              <Option value="lecturer">Lecturer</Option>
              <Option value="student">Student</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Department"
              style={{ width: 180 }}
              allowClear
              value={filterDepartment}
              onChange={setFilterDepartment}
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Status"
              style={{ width: 120 }}
              allowClear
              value={filterActive}
              onChange={setFilterActive}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>
      
      {selectedUsers.length > 0 && (
        <Card style={{ marginBottom: 16, backgroundColor: '#f0f7ff' }}>
          <Space>
            <Text strong>{selectedUsers.length} users selected</Text>
            <Button 
              onClick={() => setBulkActionVisible(true)}
              type="primary"
            >
              Bulk Actions
            </Button>
            <Button onClick={() => setSelectedUsers([])}>
              Clear Selection
            </Button>
          </Space>
        </Card>
      )}
      
      <Table
        rowKey="id"
        dataSource={filteredUsers}
        columns={columns}
        loading={loading}
        rowSelection={{
          selectedRowKeys: selectedUsers,
          onChange: setSelectedUsers,
        }}
        pagination={{
          ...pagination,
          onChange: page => setPagination({ ...pagination, current: page }),
        }}
      />
      
      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select>
                  <Option value="admin">Admin</Option>
                  <Option value="lecturer">Lecturer</Option>
                  <Option value="student">Student</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
              >
                <Select allowClear>
                  {departments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="Student ID"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update User
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Create User Modal */}
      <Modal
        title="Create User"
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select>
                  <Option value="admin">Admin</Option>
                  <Option value="lecturer">Lecturer</Option>
                  <Option value="student">Student</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
              >
                <Select allowClear>
                  {departments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                  <Option value="other">Other (Add New)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="Student ID"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch defaultChecked />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create User
              </Button>
              <Button onClick={() => setIsCreateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Activity Logs Drawer */}
      <Drawer
        title="User Activity Logs"
        width={600}
        placement="right"
        onClose={() => setActivityLogsVisible(false)}
        visible={activityLogsVisible}
      >
        {logLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <List
            dataSource={currentUserLogs}
            renderItem={log => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{log.action}</Tag>
                      <span>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</span>
                    </Space>
                  }
                  description={
                    <>
                      <div>Entity: {log.entity_type} ({log.entity_id})</div>
                      {log.details && (
                        <div>
                          <Text type="secondary">
                            Details: {typeof log.details === 'object' 
                              ? JSON.stringify(log.details) 
                              : log.details}
                          </Text>
                        </div>
                      )}
                      {log.ip_address && (
                        <div>
                          <Text type="secondary">IP: {log.ip_address}</Text>
                        </div>
                      )}
                    </>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No activity logs found' }}
          />
        )}
      </Drawer>
      
      {/* Bulk Action Modal */}
      <Modal
        title="Bulk Actions"
        visible={bulkActionVisible}
        onCancel={() => setBulkActionVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="bulkAction"
            label="Select Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select
              placeholder="Select an action"
              onChange={setBulkAction}
              value={bulkAction}
            >
              <Option value="activate">Activate Selected Users</Option>
              <Option value="deactivate">Deactivate Selected Users</Option>
              <Option value="delete">Delete Selected Users</Option>
              <Option value="change_department">Change Department</Option>
            </Select>
          </Form.Item>
          
          {bulkAction === 'change_department' && (
            <Form.Item
              name="bulkDepartment"
              label="Select Department"
              rules={[{ required: true, message: 'Please select a department' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                danger={bulkAction === 'delete'}
                onClick={handleBulkAction}
              >
                Apply to {selectedUsers.length} Users
              </Button>
              <Button onClick={() => setBulkActionVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedUserManagement; 