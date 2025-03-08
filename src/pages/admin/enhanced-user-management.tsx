import React, { useState } from 'react';
import { Tabs } from 'antd';
import { 
  UserOutlined, 
  UploadOutlined, 
  LockOutlined, 
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';

// Import our user management components
import BulkUserImport from '@/components/admin/user-management/BulkUserImport';
import RolePermissionsManager from '@/components/admin/user-management/RolePermissionsManager';
import UserActivityAudit from '@/components/admin/user-management/UserActivityAudit';
import PasswordManagement from '@/components/admin/user-management/PasswordManagement';

// Tab enum for better type safety
enum TabKeys {
  USERS = 'users',
  BULK_IMPORT = 'bulk_import',
  ROLES_PERMISSIONS = 'roles_permissions',
  ACTIVITY_AUDIT = 'activity_audit',
  PASSWORD_MANAGEMENT = 'password_management'
}

const EnhancedUserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKeys>(TabKeys.USERS);

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKeys);
  };

  // Define tab items to replace deprecated TabPane
  const tabItems = [
    {
      key: TabKeys.USERS,
      label: (
        <span>
          <UserOutlined />
          Users
        </span>
      ),
      children: (
        <div className="p-6">
          <iframe 
            src="/admin/users" 
            style={{ 
              width: '100%', 
              height: 'calc(100vh - 350px)', 
              border: 'none', 
              borderRadius: '0.5rem', 
              backgroundColor: 'rgba(17, 25, 40, 0.6)' 
            }}
            title="User Management"
          />
        </div>
      ),
    },
    {
      key: TabKeys.BULK_IMPORT,
      label: (
        <span>
          <UploadOutlined />
          Bulk Import
        </span>
      ),
      children: (
        <div className="p-6">
          <BulkUserImport />
        </div>
      ),
    },
    {
      key: TabKeys.ROLES_PERMISSIONS,
      label: (
        <span>
          <TeamOutlined />
          Roles & Permissions
        </span>
      ),
      children: (
        <div className="p-6">
          <RolePermissionsManager />
        </div>
      ),
    },
    {
      key: TabKeys.ACTIVITY_AUDIT,
      label: (
        <span>
          <ClockCircleOutlined />
          Activity Audit
        </span>
      ),
      children: (
        <div className="p-6">
          <UserActivityAudit />
        </div>
      ),
    },
    {
      key: TabKeys.PASSWORD_MANAGEMENT,
      label: (
        <span>
          <LockOutlined />
          Password Management
        </span>
      ),
      children: (
        <div className="p-6">
          <PasswordManagement />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <UserOutlined className="text-blue-400 text-xl" />
          <h2 className="text-xl font-semibold text-white">Enhanced User Management</h2>
        </div>
        <p className="text-gray-400">
          This area provides comprehensive tools for managing users, roles, permissions, and account settings.
        </p>
      </div>
      
      <div className="glass-card overflow-hidden">
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange} 
          size="large"
          type="card"
          items={tabItems}
        />
      </div>
    </div>
  );
};

export default EnhancedUserManagementPage; 