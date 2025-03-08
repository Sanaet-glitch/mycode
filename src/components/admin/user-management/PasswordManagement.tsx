import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  message, 
  Select,
  Typography,
  Divider,
  Alert,
  Tag,
  Tooltip,
  Popconfirm,
  Badge,
  Tabs,
  Radio,
  Switch,
  Row,
  Col,
  Checkbox,
  Spin
} from 'antd';
import { 
  LockOutlined, 
  UserOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { resetUserPassword, logUserAction } from '@/services/userService';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays } from 'date-fns';

const { Text, Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Type definitions
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  lastLogin: string | null;
  lastPasswordChange: string | null;
  isActive: boolean;
  forcePasswordChange: boolean;
  failedLoginAttempts: number;
  accountLocked: boolean;
  department?: string;
  studentId?: string;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  enforcePreviousPasswordCheck: boolean;
  previousPasswordCount: number;
  maxFailedAttempts: number;
  lockoutDuration: number;
}

export const PasswordManagement: React.FC = () => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterPasswordStatus, setFilterPasswordStatus] = useState<string | null>(null);
  const [filterAccountStatus, setFilterAccountStatus] = useState<string | null>(null);
  
  // Modal state
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [resetType, setResetType] = useState<'email' | 'manual'>('email');
  const [resetReason, setResetReason] = useState('admin_requested');
  
  // Password policy state
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiryDays: 90,
    enforcePreviousPasswordCheck: true,
    previousPasswordCount: 3,
    maxFailedAttempts: 5,
    lockoutDuration: 30,
  });
  const [policyLoading, setPolicyLoading] = useState(false);
  
  const [form] = Form.useForm();
  const [policyForm] = Form.useForm();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchPasswordPolicy();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [searchText, filterRole, filterPasswordStatus, filterAccountStatus, users]);

  // Fetch users from database
  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('lastName', { ascending: true });
        
      if (error) throw error;
      
      // Transform data to match our User interface
      const transformedData: User[] = data.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.last_login,
        lastPasswordChange: user.last_password_change,
        isActive: user.is_active !== false,
        forcePasswordChange: user.force_password_change === true,
        failedLoginAttempts: user.failed_login_attempts || 0,
        accountLocked: user.account_locked === true,
        department: user.department,
        studentId: user.student_id,
      }));
      
      setUsers(transformedData);
      setFilteredUsers(transformedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch password policy from database
  const fetchPasswordPolicy = async () => {
    setPolicyLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'password_policy')
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No policy found, create default
          await createDefaultPasswordPolicy();
        } else {
          throw error;
        }
      } else if (data) {
        setPasswordPolicy(data.value);
      }
    } catch (error) {
      console.error('Error fetching password policy:', error);
      message.error('Failed to fetch password policy');
    } finally {
      setPolicyLoading(false);
    }
  };

  // Create default password policy if none exists
  const createDefaultPasswordPolicy = async () => {
    try {
      const defaultPolicy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiryDays: 90,
        enforcePreviousPasswordCheck: true,
        previousPasswordCount: 3,
        maxFailedAttempts: 5,
        lockoutDuration: 30,
      };
      
      const { error } = await supabase
        .from('system_settings')
        .insert({
          key: 'password_policy',
          value: defaultPolicy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      setPasswordPolicy(defaultPolicy);
    } catch (error) {
      console.error('Error creating default password policy:', error);
    }
  };

  // Apply filters to the user list
  const applyFilters = useCallback(() => {
    let result = [...users];
    
    // Text search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        user => 
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.studentId && user.studentId.toLowerCase().includes(searchLower))
      );
    }
    
    // Role filter
    if (filterRole) {
      result = result.filter(user => user.role === filterRole);
    }
    
    // Password status filter
    if (filterPasswordStatus) {
      if (filterPasswordStatus === 'expired') {
        result = result.filter(user => {
          if (!user.lastPasswordChange) return true;
          const daysSinceChange = differenceInDays(
            new Date(),
            parseISO(user.lastPasswordChange)
          );
          return daysSinceChange > passwordPolicy.passwordExpiryDays;
        });
      } else if (filterPasswordStatus === 'force_change') {
        result = result.filter(user => user.forcePasswordChange);
      } else if (filterPasswordStatus === 'never_changed') {
        result = result.filter(user => !user.lastPasswordChange);
      }
    }
    
    // Account status filter
    if (filterAccountStatus) {
      if (filterAccountStatus === 'locked') {
        result = result.filter(user => user.accountLocked);
      } else if (filterAccountStatus === 'inactive') {
        result = result.filter(user => !user.isActive);
      } else if (filterAccountStatus === 'never_logged_in') {
        result = result.filter(user => !user.lastLogin);
      }
    }
    
    setFilteredUsers(result);
  }, [users, searchText, filterRole, filterPasswordStatus, filterAccountStatus, passwordPolicy]);

  // Handle bulk password reset
  const handleBulkPasswordReset = async (values: any) => {
    if (selectedUsers.length === 0) {
      message.warning('No users selected');
      return;
    }
    
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      for (const userId of selectedUsers) {
        if (resetType === 'email') {
          // Send password reset email
          const { data, error } = await supabase.auth.admin.sendPasswordResetEmail(
            users.find(u => u.id === userId)?.email || ''
          );
          
          if (error) throw error;
        } else {
          // Manually set password
          const { data, error } = await supabase.auth.admin.updateUserById(
            userId,
            { password: values.password }
          );
          
          if (error) throw error;
          
          // Update force password change flag
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              force_password_change: true,
              last_password_change: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
            
          if (updateError) throw updateError;
        }
        
        // Log the action
        if (currentUser) {
          await logUserAction(
            currentUser.id,
            'RESET_PASSWORD',
            'profiles',
            userId,
            {
              reset_type: resetType,
              reason: resetReason,
              force_change: true,
            }
          );
        }
      }
      
      message.success(`Password reset ${resetType === 'email' ? 'emails sent' : 'completed'} for ${selectedUsers.length} users`);
      setResetModalVisible(false);
      fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error resetting passwords:', error);
      message.error('Failed to reset passwords');
    }
  };

  // Handle saving password policy
  const handleSavePasswordPolicy = async (values: PasswordPolicy) => {
    setPolicyLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'password_policy')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Update existing policy
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({
            value: values,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'password_policy');
          
        if (updateError) throw updateError;
      } else {
        // Create new policy
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert({
            key: 'password_policy',
            value: values,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (insertError) throw insertError;
      }
      
      // Log the action
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser) {
        await logUserAction(
          currentUser.id,
          'UPDATE_PASSWORD_POLICY',
          'system_settings',
          'password_policy',
          { updated_by: currentUser.id }
        );
      }
      
      setPasswordPolicy(values);
      message.success('Password policy updated successfully');
      setSettingsModalVisible(false);
    } catch (error) {
      console.error('Error saving password policy:', error);
      message.error('Failed to save password policy');
    } finally {
      setPolicyLoading(false);
    }
  };

  // Handle unlocking user accounts
  const handleUnlockAccounts = async () => {
    if (selectedUsers.length === 0) {
      message.warning('No users selected');
      return;
    }
    
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      for (const userId of selectedUsers) {
        const { error } = await supabase
          .from('profiles')
          .update({
            account_locked: false,
            failed_login_attempts: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
          
        if (error) throw error;
        
        // Log the action
        if (currentUser) {
          await logUserAction(
            currentUser.id,
            'UNLOCK_ACCOUNT',
            'profiles',
            userId,
            {
              unlocked_by: currentUser.id,
            }
          );
        }
      }
      
      message.success(`Unlocked ${selectedUsers.length} accounts`);
      fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error unlocking accounts:', error);
      message.error('Failed to unlock accounts');
    }
  };

  // Handle activating/deactivating user accounts
  const handleActivateAccounts = async (activate: boolean) => {
    if (selectedUsers.length === 0) {
      message.warning('No users selected');
      return;
    }
    
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      for (const userId of selectedUsers) {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_active: activate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
          
        if (error) throw error;
        
        // Log the action
        if (currentUser) {
          await logUserAction(
            currentUser.id,
            activate ? 'ACTIVATE_ACCOUNT' : 'DEACTIVATE_ACCOUNT',
            'profiles',
            userId,
            {
              action_by: currentUser.id,
            }
          );
        }
      }
      
      message.success(`${activate ? 'Activated' : 'Deactivated'} ${selectedUsers.length} accounts`);
      fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error(`Error ${activate ? 'activating' : 'deactivating'} accounts:`, error);
      message.error(`Failed to ${activate ? 'activate' : 'deactivate'} accounts`);
    }
  };

  // Get password status for a user
  const getPasswordStatus = (user: User) => {
    if (user.forcePasswordChange) {
      return { status: 'force_change', text: 'Force Change', color: 'volcano' };
    }
    
    if (!user.lastPasswordChange) {
      return { status: 'never_changed', text: 'Never Changed', color: 'red' };
    }
    
    const daysSinceChange = differenceInDays(
      new Date(),
      parseISO(user.lastPasswordChange)
    );
    
    if (daysSinceChange > passwordPolicy.passwordExpiryDays) {
      return { status: 'expired', text: 'Expired', color: 'orange' };
    }
    
    const daysUntilExpiry = passwordPolicy.passwordExpiryDays - daysSinceChange;
    
    if (daysUntilExpiry <= 7) {
      return { status: 'expiring_soon', text: `Expires in ${daysUntilExpiry} days`, color: 'gold' };
    }
    
    return { status: 'valid', text: 'Valid', color: 'green' };
  };

  // Get account status for a user
  const getAccountStatus = (user: User) => {
    if (!user.isActive) {
      return { status: 'inactive', text: 'Inactive', color: 'default' };
    }
    
    if (user.accountLocked) {
      return { status: 'locked', text: 'Locked', color: 'red' };
    }
    
    if (!user.lastLogin) {
      return { status: 'never_logged_in', text: 'Never Logged In', color: 'purple' };
    }
    
    return { status: 'active', text: 'Active', color: 'green' };
  };

  // Table columns
  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: User) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{`${record.firstName} ${record.lastName}`}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          {record.studentId && (
            <div style={{ fontSize: '12px', color: '#888' }}>
              ID: {record.studentId}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'lecturer' ? 'blue' : 'green'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Password Status',
      key: 'passwordStatus',
      render: (record: User) => {
        const { text, color } = getPasswordStatus(record);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Account Status',
      key: 'accountStatus',
      render: (record: User) => {
        const { text, color } = getAccountStatus(record);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Last Login',
      key: 'lastLogin',
      render: (record: User) => (
        record.lastLogin 
          ? format(parseISO(record.lastLogin), 'yyyy-MM-dd HH:mm')
          : 'Never'
      ),
    },
    {
      title: 'Last Password Change',
      key: 'lastPasswordChange',
      render: (record: User) => (
        record.lastPasswordChange 
          ? format(parseISO(record.lastPasswordChange), 'yyyy-MM-dd')
          : 'Never'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Tooltip title="Reset Password">
            <Button
              icon={<LockOutlined />}
              size="small"
              onClick={() => {
                setSelectedUsers([record.id]);
                setResetModalVisible(true);
              }}
            />
          </Tooltip>
          
          {record.accountLocked && (
            <Tooltip title="Unlock Account">
              <Button
                icon={<KeyOutlined />}
                size="small"
                onClick={() => {
                  setSelectedUsers([record.id]);
                  handleUnlockAccounts();
                }}
              />
            </Tooltip>
          )}
          
          <Tooltip title={record.isActive ? 'Deactivate Account' : 'Activate Account'}>
            <Button
              icon={<UserOutlined />}
              size="small"
              type={record.isActive ? 'default' : 'primary'}
              danger={record.isActive}
              onClick={() => {
                setSelectedUsers([record.id]);
                handleActivateAccounts(!record.isActive);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Filter controls
  const renderFilters = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Search users..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Filter by role"
          style={{ width: '100%' }}
          allowClear
          value={filterRole}
          onChange={setFilterRole}
        >
          <Option value="admin">Admin</Option>
          <Option value="lecturer">Lecturer</Option>
          <Option value="student">Student</Option>
        </Select>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Password status"
          style={{ width: '100%' }}
          allowClear
          value={filterPasswordStatus}
          onChange={setFilterPasswordStatus}
        >
          <Option value="expired">Expired</Option>
          <Option value="force_change">Force Change</Option>
          <Option value="never_changed">Never Changed</Option>
        </Select>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Account status"
          style={{ width: '100%' }}
          allowClear
          value={filterAccountStatus}
          onChange={setFilterAccountStatus}
        >
          <Option value="locked">Locked</Option>
          <Option value="inactive">Inactive</Option>
          <Option value="never_logged_in">Never Logged In</Option>
        </Select>
      </Col>
    </Row>
  );

  // Bulk action buttons
  const renderBulkActions = () => (
    <div style={{ marginBottom: 16 }}>
      <Space>
        <Button
          icon={<LockOutlined />}
          type="primary"
          onClick={() => {
            if (selectedUsers.length > 0) {
              setResetModalVisible(true);
            } else {
              message.warning('No users selected');
            }
          }}
        >
          Reset Passwords
        </Button>
        
        <Button
          icon={<KeyOutlined />}
          onClick={() => {
            if (selectedUsers.length > 0) {
              handleUnlockAccounts();
            } else {
              message.warning('No users selected');
            }
          }}
        >
          Unlock Accounts
        </Button>
        
        <Button
          icon={<UserOutlined />}
          onClick={() => {
            if (selectedUsers.length > 0) {
              handleActivateAccounts(true);
            } else {
              message.warning('No users selected');
            }
          }}
        >
          Activate Accounts
        </Button>
        
        <Button
          icon={<UserOutlined />}
          danger
          onClick={() => {
            if (selectedUsers.length > 0) {
              handleActivateAccounts(false);
            } else {
              message.warning('No users selected');
            }
          }}
        >
          Deactivate Accounts
        </Button>
        
        <Button
          icon={<SettingOutlined />}
          onClick={() => {
            setSettingsModalVisible(true);
            policyForm.setFieldsValue(passwordPolicy);
          }}
        >
          Password Policy
        </Button>
      </Space>
    </div>
  );

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <LockOutlined style={{ marginRight: 8 }} />
            <span>Password & Account Management</span>
          </div>
        }
      >
        {/* Selected user count */}
        {selectedUsers.length > 0 && (
          <Alert
            message={`${selectedUsers.length} users selected`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => setSelectedUsers([])}>
                Clear Selection
              </Button>
            }
          />
        )}
        
        {renderFilters()}
        {renderBulkActions()}
        
        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys: selectedUsers,
            onChange: keys => setSelectedUsers(keys as string[]),
          }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {/* Password Reset Modal */}
      <Modal
        title="Reset User Passwords"
        open={resetModalVisible}
        onCancel={() => setResetModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBulkPasswordReset}
        >
          <Form.Item
            name="resetType"
            label="Reset Method"
            initialValue="email"
          >
            <Radio.Group value={resetType} onChange={e => setResetType(e.target.value)}>
              <Radio.Button value="email">Send Reset Email</Radio.Button>
              <Radio.Button value="manual">Set Password Manually</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          {resetType === 'manual' && (
            <Form.Item
              name="password"
              label="New Password"
              rules={[{ required: true, message: 'Please enter a password' }]}
              extra="The user will be forced to change this password on next login."
            >
              <Input.Password />
            </Form.Item>
          )}
          
          <Form.Item
            name="reason"
            label="Reset Reason"
            initialValue="admin_requested"
          >
            <Select value={resetReason} onChange={value => setResetReason(value)}>
              <Option value="admin_requested">Administrator Requested</Option>
              <Option value="user_requested">User Requested</Option>
              <Option value="security_policy">Security Policy</Option>
              <Option value="suspicious_activity">Suspicious Activity</Option>
              <Option value="account_locked">Account Locked</Option>
            </Select>
          </Form.Item>
          
          <div style={{ marginBottom: 16 }}>
            <Alert
              message={`This will reset passwords for ${selectedUsers.length} users`}
              type="warning"
              showIcon
            />
          </div>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {resetType === 'email' ? 'Send Reset Emails' : 'Reset Passwords'}
              </Button>
              <Button onClick={() => setResetModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Password Policy Modal */}
      <Modal
        title="Password Policy Settings"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
        width={700}
      >
        {policyLoading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin />
          </div>
        ) : (
          <Form
            form={policyForm}
            layout="vertical"
            onFinish={handleSavePasswordPolicy}
            initialValues={passwordPolicy}
          >
            <Tabs defaultActiveKey="complexity">
              <TabPane tab="Password Complexity" key="complexity">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="minLength"
                      label="Minimum Length"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        {[6, 8, 10, 12, 14, 16].map(length => (
                          <Option key={length} value={length}>{length} characters</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name="requireUppercase"
                  valuePropName="checked"
                  label="Character Requirements"
                >
                  <Checkbox>Require uppercase letters (A-Z)</Checkbox>
                </Form.Item>
                
                <Form.Item
                  name="requireLowercase"
                  valuePropName="checked"
                >
                  <Checkbox>Require lowercase letters (a-z)</Checkbox>
                </Form.Item>
                
                <Form.Item
                  name="requireNumbers"
                  valuePropName="checked"
                >
                  <Checkbox>Require numbers (0-9)</Checkbox>
                </Form.Item>
                
                <Form.Item
                  name="requireSpecialChars"
                  valuePropName="checked"
                >
                  <Checkbox>Require special characters (e.g., !@#$%^&*)</Checkbox>
                </Form.Item>
              </TabPane>
              
              <TabPane tab="Password Aging" key="aging">
                <Form.Item
                  name="passwordExpiryDays"
                  label="Password Expiry"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value={30}>30 days</Option>
                    <Option value={60}>60 days</Option>
                    <Option value={90}>90 days</Option>
                    <Option value={180}>180 days</Option>
                    <Option value={365}>365 days</Option>
                    <Option value={0}>Never expire</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="enforcePreviousPasswordCheck"
                  valuePropName="checked"
                  label="Password History"
                >
                  <Checkbox>Remember previous passwords and prevent reuse</Checkbox>
                </Form.Item>
                
                <Form.Item
                  name="previousPasswordCount"
                  label="Number of previous passwords to remember"
                  dependencies={['enforcePreviousPasswordCheck']}
                >
                  <Select disabled={!policyForm.getFieldValue('enforcePreviousPasswordCheck')}>
                    {[1, 2, 3, 4, 5, 10].map(count => (
                      <Option key={count} value={count}>{count} passwords</Option>
                    ))}
                  </Select>
                </Form.Item>
              </TabPane>
              
              <TabPane tab="Account Lockout" key="lockout">
                <Form.Item
                  name="maxFailedAttempts"
                  label="Maximum Failed Login Attempts"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {[3, 5, 10, 15].map(count => (
                      <Option key={count} value={count}>{count} attempts</Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="lockoutDuration"
                  label="Account Lockout Duration"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value={15}>15 minutes</Option>
                    <Option value={30}>30 minutes</Option>
                    <Option value={60}>1 hour</Option>
                    <Option value={120}>2 hours</Option>
                    <Option value={1440}>24 hours</Option>
                    <Option value={0}>Until manually unlocked</Option>
                  </Select>
                </Form.Item>
              </TabPane>
            </Tabs>
            
            <Divider />
            
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={policyLoading}
                >
                  Save Policy
                </Button>
                <Button onClick={() => setSettingsModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default PasswordManagement; 