import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Table, 
  Tag, 
  Switch, 
  Button, 
  Popconfirm, 
  message, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  Typography,
  Divider,
  Alert,
  Tree,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  ExclamationCircleOutlined,
  SaveOutlined,
  LockOutlined
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { logUserAction } from '@/services/userService';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Option } = Select;

// Types for permission management
interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

// Permission tree node for grouped view
interface PermissionNode {
  title: string;
  key: string;
  children?: PermissionNode[];
  isPermission?: boolean;
  permission?: Permission;
}

export const RolePermissionsManager: React.FC = () => {
  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'role' | 'permission'>('role');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [permissionChanged, setPermissionChanged] = useState(false);
  
  const [form] = Form.useForm();
  
  // Fetch data on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchRolePermissions();
  }, []);
  
  // Build permission tree when permissions change
  useEffect(() => {
    buildPermissionTree();
  }, [permissions, rolePermissions, selectedRole]);
  
  // Fetch roles from database
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setRoles(data || []);
      
      // Select the first role by default
      if (data && data.length > 0 && !selectedRole) {
        setSelectedRole(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      message.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch permissions from database
  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      message.error('Failed to fetch permissions');
    }
  };
  
  // Fetch role-permission mappings
  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');
        
      if (error) throw error;
      
      setRolePermissions(data || []);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      message.error('Failed to fetch role permissions');
    }
  };
  
  // Build hierarchical permission tree
  const buildPermissionTree = () => {
    const tree: PermissionNode[] = [];
    const resourceMap = new Map<string, PermissionNode>();
    
    permissions.forEach(permission => {
      // Get or create resource node
      if (!resourceMap.has(permission.resource)) {
        const resourceNode: PermissionNode = {
          title: formatResourceName(permission.resource),
          key: `resource_${permission.resource}`,
          children: []
        };
        resourceMap.set(permission.resource, resourceNode);
        tree.push(resourceNode);
      }
      
      // Add permission to resource node
      const resourceNode = resourceMap.get(permission.resource);
      if (resourceNode && resourceNode.children) {
        resourceNode.children.push({
          title: permission.name,
          key: permission.id,
          isPermission: true,
          permission
        });
      }
    });
    
    // Sort tree by resource name
    tree.sort((a, b) => a.title.localeCompare(b.title));
    
    // Set expanded keys to all resource nodes by default
    setExpandedKeys(tree.map(node => node.key));
    
    // Set checked keys based on selected role
    if (selectedRole) {
      const permissionIds = rolePermissions
        .filter(rp => rp.roleId === selectedRole)
        .map(rp => rp.permissionId);
      
      setCheckedKeys(permissionIds);
    } else {
      setCheckedKeys([]);
    }
    
    setPermissionTree(tree);
  };
  
  // Format resource name for display
  const formatResourceName = (resource: string) => {
    return resource
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Handle form submission
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalType === 'role') {
        if (editingId) {
          // Update existing role
          const { error } = await supabase
            .from('roles')
            .update({
              name: values.name,
              description: values.description,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingId);
            
          if (error) throw error;
          
          message.success('Role updated successfully');
          
          // Log admin action
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            await logUserAction(
              user.id,
              'UPDATE_ROLE',
              'roles',
              editingId,
              { updated_fields: ['name', 'description'] }
            );
          }
        } else {
          // Create new role
          const { data, error } = await supabase
            .from('roles')
            .insert({
              name: values.name,
              description: values.description,
              is_system: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
            
          if (error) throw error;
          
          message.success('Role created successfully');
          
          // Log admin action
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            await logUserAction(
              user.id,
              'CREATE_ROLE',
              'roles',
              data[0].id,
              { role_name: values.name }
            );
          }
        }
      } else if (modalType === 'permission') {
        if (editingId) {
          // Update existing permission
          const { error } = await supabase
            .from('permissions')
            .update({
              name: values.name,
              description: values.description,
              resource: values.resource,
              action: values.action,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingId);
            
          if (error) throw error;
          
          message.success('Permission updated successfully');
          
          // Log admin action
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            await logUserAction(
              user.id,
              'UPDATE_PERMISSION',
              'permissions',
              editingId,
              { 
                updated_fields: ['name', 'description', 'resource', 'action']
              }
            );
          }
        } else {
          // Create new permission
          const { data, error } = await supabase
            .from('permissions')
            .insert({
              name: values.name,
              description: values.description,
              resource: values.resource,
              action: values.action,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
            
          if (error) throw error;
          
          message.success('Permission created successfully');
          
          // Log admin action
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            await logUserAction(
              user.id,
              'CREATE_PERMISSION',
              'permissions',
              data[0].id,
              { permission_name: values.name }
            );
          }
        }
      }
      
      // Close modal and refresh data
      setModalVisible(false);
      setEditingId(null);
      form.resetFields();
      
      fetchRoles();
      fetchPermissions();
    } catch (error) {
      console.error('Error saving form:', error);
      message.error('Failed to save changes');
    }
  };
  
  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      message.success('Role deleted successfully');
      
      // Log admin action
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await logUserAction(
          user.id,
          'DELETE_ROLE',
          'roles',
          roleId,
          { deleted_by: user.id }
        );
      }
      
      fetchRoles();
      
      // If the deleted role was selected, select another one
      if (selectedRole === roleId) {
        const otherRole = roles.find(r => r.id !== roleId);
        setSelectedRole(otherRole ? otherRole.id : null);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      message.error('Failed to delete role');
    }
  };
  
  // Handle permission deletion
  const handleDeletePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', permissionId);
        
      if (error) throw error;
      
      message.success('Permission deleted successfully');
      
      // Log admin action
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await logUserAction(
          user.id,
          'DELETE_PERMISSION',
          'permissions',
          permissionId,
          { deleted_by: user.id }
        );
      }
      
      fetchPermissions();
      fetchRolePermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
      message.error('Failed to delete permission');
    }
  };
  
  // Open create/edit modal
  const openModal = (type: 'role' | 'permission', id?: string) => {
    setModalType(type);
    setEditingId(id || null);
    
    // Reset form
    form.resetFields();
    
    // If editing, populate form with existing data
    if (id) {
      if (type === 'role') {
        const role = roles.find(r => r.id === id);
        if (role) {
          form.setFieldsValue({
            name: role.name,
            description: role.description
          });
        }
      } else if (type === 'permission') {
        const permission = permissions.find(p => p.id === id);
        if (permission) {
          form.setFieldsValue({
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action
          });
        }
      }
    }
    
    setModalVisible(true);
  };
  
  // Handle tree checkbox change
  const handleTreeCheck = (checkedKeys: any) => {
    setCheckedKeys(checkedKeys);
    setPermissionChanged(true);
  };
  
  // Save role permissions
  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    
    try {
      // Get current permissions for this role
      const currentPermissions = rolePermissions
        .filter(rp => rp.roleId === selectedRole)
        .map(rp => rp.permissionId);
      
      // Determine permissions to add
      const permissionsToAdd = checkedKeys.filter(
        key => !currentPermissions.includes(key)
      );
      
      // Determine permissions to remove
      const permissionsToRemove = currentPermissions.filter(
        id => !checkedKeys.includes(id)
      );
      
      // Remove permissions
      if (permissionsToRemove.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', selectedRole)
          .in('permission_id', permissionsToRemove);
          
        if (error) throw error;
      }
      
      // Add permissions
      if (permissionsToAdd.length > 0) {
        const permissionsToInsert = permissionsToAdd.map(permissionId => ({
          role_id: selectedRole,
          permission_id: permissionId,
          created_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert);
          
        if (error) throw error;
      }
      
      // Log admin action
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await logUserAction(
          user.id,
          'UPDATE_ROLE_PERMISSIONS',
          'role_permissions',
          selectedRole,
          { 
            added: permissionsToAdd.length,
            removed: permissionsToRemove.length
          }
        );
      }
      
      message.success('Role permissions updated successfully');
      setPermissionChanged(false);
      fetchRolePermissions();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      message.error('Failed to update role permissions');
    } finally {
      setLoading(false);
    }
  };
  
  // Table columns for roles
  const roleColumns = [
    {
      title: 'Role',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Type',
      key: 'type',
      render: (record: Role) => (
        <Tag color={record.isSystem ? 'blue' : 'green'}>
          {record.isSystem ? 'System' : 'Custom'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Role) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openModal('role', record.id)}
            disabled={record.isSystem}
          />
          <Popconfirm
            title="Are you sure you want to delete this role?"
            description="This action cannot be undone."
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDeleteRole(record.id)}
            disabled={record.isSystem}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              disabled={record.isSystem}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // Table columns for permissions
  const permissionColumns = [
    {
      title: 'Permission',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (text: string) => (
        <Tag color="blue">{formatResourceName(text)}</Tag>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => (
        <Tag color="purple">{text.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Permission) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openModal('permission', record.id)}
          />
          <Popconfirm
            title="Are you sure you want to delete this permission?"
            description="This will remove it from all roles. This action cannot be undone."
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDeletePermission(record.id)}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // Render content for role-permission assignment
  const renderRolePermissionContent = () => {
    if (!selectedRole) {
      return (
        <Alert
          message="Select a role"
          description="Please select a role from the list to manage its permissions."
          type="info"
          showIcon
        />
      );
    }
    
    const role = roles.find(r => r.id === selectedRole);
    
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4}>
                {role?.name} Role Permissions
              </Title>
              {permissionChanged && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={saveRolePermissions}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              )}
            </div>
            <Text>Select the permissions that should be assigned to this role:</Text>
          </Space>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Tree
            checkable
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            onCheck={handleTreeCheck}
            treeData={permissionTree}
            height={400}
          />
        )}
      </div>
    );
  };
  
  return (
    <Card title="Role & Permissions Management">
      <Tabs defaultActiveKey="assign">
        <TabPane tab="Role-Permission Assignment" key="assign">
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 300 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Title level={5}>Roles</Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  size="small"
                  onClick={() => openModal('role')}
                >
                  New Role
                </Button>
              </div>
              <div style={{ maxHeight: 500, overflow: 'auto' }}>
                <Table
                  dataSource={roles}
                  columns={roleColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  rowClassName={(record) => record.id === selectedRole ? 'ant-table-row-selected' : ''}
                  onRow={(record) => ({
                    onClick: () => setSelectedRole(record.id),
                  })}
                />
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              {renderRolePermissionContent()}
            </div>
          </div>
        </TabPane>
        <TabPane tab="Manage Permissions" key="permissions">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5}>System Permissions</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => openModal('permission')}
            >
              New Permission
            </Button>
          </div>
          <Table
            dataSource={permissions}
            columns={permissionColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>
      
      {/* Modal for creating/editing roles and permissions */}
      <Modal
        title={`${editingId ? 'Edit' : 'Create'} ${modalType === 'role' ? 'Role' : 'Permission'}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          {modalType === 'permission' && (
            <>
              <Form.Item
                name="resource"
                label="Resource"
                rules={[{ required: true, message: 'Please enter a resource' }]}
              >
                <Input placeholder="e.g., users, courses, reports" />
              </Form.Item>
              
              <Form.Item
                name="action"
                label="Action"
                rules={[{ required: true, message: 'Please enter an action' }]}
              >
                <Select placeholder="Select an action">
                  <Option value="read">read</Option>
                  <Option value="create">create</Option>
                  <Option value="update">update</Option>
                  <Option value="delete">delete</Option>
                  <Option value="manage">manage</Option>
                </Select>
              </Form.Item>
            </>
          )}
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RolePermissionsManager; 