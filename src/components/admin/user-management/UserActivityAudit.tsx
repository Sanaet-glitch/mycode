import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Drawer, 
  Typography, 
  DatePicker, 
  Input, 
  Select, 
  Tooltip, 
  Badge,
  Empty,
  Row,
  Col,
  Checkbox,
  Alert,
  Popover
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ExportOutlined, 
  InfoCircleOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { format, parseISO, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Type definitions
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'purple',
  LOGOUT: 'orange',
  VIEW: 'cyan',
  DOWNLOAD: 'magenta',
  UPLOAD: 'gold',
  RESET: 'volcano',
  BULK: 'geekblue',
};

export const UserActivityAudit: React.FC = () => {
  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // Filter state
  const [dateRange, setDateRange] = useState<[Date, Date]>([subDays(new Date(), 7), new Date()]);
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [entityFilter, setEntityFilter] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<string[]>([]);
  
  // Unique values for filters
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  
  // Load logs on component mount and when filters change
  useEffect(() => {
    fetchAuditLogs();
    loadFilterOptions();
  }, [dateRange, actionFilter, entityFilter, userFilter, pagination.current, pagination.pageSize]);

  // Fetch audit logs with filters
  const fetchAuditLogs = async () => {
    setLoading(true);
    
    try {
      // Build the base query
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            firstName,
            lastName,
            email,
            role
          )
        `, { count: 'exact' });
      
      // Apply date range filter
      if (dateRange) {
        query = query
          .gte('created_at', dateRange[0].toISOString())
          .lte('created_at', dateRange[1].toISOString());
      }
      
      // Apply action filter
      if (actionFilter.length > 0) {
        const actions = actionFilter.map(action => {
          if (action.includes('_')) {
            return action;
          }
          // Match any action starting with the filter value
          return action + '_%';
        });
        
        query = query.or(actions.map(action => {
          if (action.endsWith('%')) {
            return `action.ilike.${action}`;
          }
          return `action.eq.${action}`;
        }).join(','));
      }
      
      // Apply entity filter
      if (entityFilter.length > 0) {
        query = query.in('entity_type', entityFilter);
      }
      
      // Apply user filter
      if (userFilter.length > 0) {
        query = query.in('user_id', userFilter);
      }
      
      // Apply search text
      if (searchText) {
        // Search across multiple fields using metadata
        query = query.or(`
          metadata.ilike.%${searchText}%,
          entity_id.ilike.%${searchText}%
        `);
      }
      
      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(
          (pagination.current - 1) * pagination.pageSize,
          pagination.current * pagination.pageSize - 1
        );
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Process the results
      const formattedLogs = data.map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        metadata: log.metadata,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at,
        userName: log.profiles ? `${log.profiles.firstName} ${log.profiles.lastName}` : 'Unknown',
        userEmail: log.profiles?.email,
      }));
      
      setLogs(formattedLogs);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load unique values for filter dropdowns
  const loadFilterOptions = async () => {
    try {
      // Get unique action types
      const { data: actionData } = await supabase
        .from('audit_logs')
        .select('action')
        .order('action');
      
      if (actionData) {
        const uniqueActions = Array.from(new Set(
          actionData.map(item => {
            // Get base action type (before underscore)
            const baseAction = item.action.split('_')[0];
            return baseAction;
          })
        )).filter(Boolean);
        
        setActionTypes(uniqueActions);
      }
      
      // Get unique entity types
      const { data: entityData } = await supabase
        .from('audit_logs')
        .select('entity_type')
        .order('entity_type');
      
      if (entityData) {
        const uniqueEntities = Array.from(new Set(
          entityData.map(item => item.entity_type)
        )).filter(Boolean);
        
        setEntityTypes(uniqueEntities);
      }
      
      // Get active users
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, firstName, lastName, email, role')
        .order('lastName');
      
      if (userData) {
        setUsers(userData.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        })));
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Handle viewing log details
  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setDrawerVisible(true);
  };

  // Handle exporting logs to Excel
  const handleExportLogs = async () => {
    try {
      // Fetch all logs based on current filters but without pagination
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            firstName,
            lastName,
            email,
            role
          )
        `);
      
      // Apply date range filter
      if (dateRange) {
        query = query
          .gte('created_at', dateRange[0].toISOString())
          .lte('created_at', dateRange[1].toISOString());
      }
      
      // Apply action filter
      if (actionFilter.length > 0) {
        const actions = actionFilter.map(action => {
          if (action.includes('_')) {
            return action;
          }
          return action + '_%';
        });
        
        query = query.or(actions.map(action => {
          if (action.endsWith('%')) {
            return `action.ilike.${action}`;
          }
          return `action.eq.${action}`;
        }).join(','));
      }
      
      // Apply entity filter
      if (entityFilter.length > 0) {
        query = query.in('entity_type', entityFilter);
      }
      
      // Apply user filter
      if (userFilter.length > 0) {
        query = query.in('user_id', userFilter);
      }
      
      // Apply search text
      if (searchText) {
        query = query.or(`
          metadata.ilike.%${searchText}%,
          entity_id.ilike.%${searchText}%
        `);
      }
      
      // Order by date
      query = query.order('created_at', { ascending: false });
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format data for export
      const exportData = data.map(log => ({
        'Date & Time': format(parseISO(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        'User': log.profiles ? `${log.profiles.firstName} ${log.profiles.lastName}` : 'Unknown',
        'Email': log.profiles?.email || 'Unknown',
        'Role': log.profiles?.role || 'Unknown',
        'Action': log.action,
        'Resource Type': log.entity_type,
        'Resource ID': log.entity_id,
        'IP Address': log.ip_address,
        'Details': JSON.stringify(log.metadata),
      }));
      
      // Create and download Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
      
      // Add column widths
      const colWidths = [
        { wch: 20 }, // Date & Time
        { wch: 20 }, // User
        { wch: 30 }, // Email
        { wch: 10 }, // Role
        { wch: 20 }, // Action
        { wch: 15 }, // Resource Type
        { wch: 15 }, // Resource ID
        { wch: 15 }, // IP Address
        { wch: 50 }, // Details
      ];
      
      worksheet['!cols'] = colWidths;
      
      // Create filename with date range
      const startDate = format(dateRange[0], 'yyyy-MM-dd');
      const endDate = format(dateRange[1], 'yyyy-MM-dd');
      const filename = `user-activity-audit_${startDate}_to_${endDate}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  // Handle pagination change
  const handleTableChange = (pagination: any) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setDateRange([subDays(new Date(), 7), new Date()]);
    setSearchText('');
    setActionFilter([]);
    setEntityFilter([]);
    setUserFilter([]);
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  // Format action name for display
  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format entity type for display
  const formatEntityType = (entityType: string) => {
    return entityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get color for action tag
  const getActionColor = (action: string) => {
    const baseAction = action.split('_')[0];
    return ACTION_COLORS[baseAction] || 'default';
  };

  // Table columns
  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => format(parseISO(text), 'yyyy-MM-dd HH:mm:ss'),
      width: 170,
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string, record: AuditLog) => (
        <Tooltip title={record.userEmail}>
          <div>
            <Text>{text}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.userEmail}</Text>
            </div>
          </div>
        </Tooltip>
      ),
      width: 200,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => (
        <Tag color={getActionColor(text)}>{formatActionName(text)}</Tag>
      ),
      width: 180,
    },
    {
      title: 'Resource',
      key: 'resource',
      render: (record: AuditLog) => (
        <div>
          <div>
            <Badge status="processing" text={formatEntityType(record.entityType)} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.entityId}</Text>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: 'Details',
      key: 'details',
      render: (record: AuditLog) => {
        const metadataEntries = record.metadata ? Object.entries(record.metadata) : [];
        const previewText = metadataEntries.length > 0
          ? `${metadataEntries[0][0]}: ${JSON.stringify(metadataEntries[0][1]).substring(0, 30)}...`
          : 'No details';
        
        return (
          <div>
            <Popover
              content={
                <div style={{ maxWidth: 400, maxHeight: 300, overflow: 'auto' }}>
                  {metadataEntries.length > 0 ? (
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {metadataEntries.map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {JSON.stringify(value, null, 2)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No additional details</div>
                  )}
                </div>
              }
              title="Metadata Details"
              trigger="hover"
            >
              <Text
                style={{ cursor: 'pointer' }}
                ellipsis={{ tooltip: true }}
              >
                {previewText}
              </Text>
            </Popover>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AuditLog) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewLog(record)}
        />
      ),
      width: 80,
    },
  ];

  // Filter section component
  const renderFilters = () => (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={5}>Filter Audit Logs</Title>
        </Col>
        
        <Col xs={24} md={12} lg={8}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Date Range</Text>
          </div>
          <RangePicker
            style={{ width: '100%' }}
            value={[dateRange[0], dateRange[1]].map(date => date) as any}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0] as any, dates[1] as any]);
              }
            }}
          />
        </Col>
        
        <Col xs={24} md={12} lg={8}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Search</Text>
          </div>
          <Input
            placeholder="Search in details or resource ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={fetchAuditLogs}
          />
        </Col>
        
        <Col xs={24} md={12} lg={8}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Action Type</Text>
          </div>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Filter by action"
            value={actionFilter}
            onChange={setActionFilter}
            maxTagCount={2}
          >
            {actionTypes.map(action => (
              <Option key={action} value={action}>
                <Tag color={ACTION_COLORS[action] || 'default'}>
                  {action}
                </Tag>
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} md={12} lg={8}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Resource Type</Text>
          </div>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Filter by resource"
            value={entityFilter}
            onChange={setEntityFilter}
            maxTagCount={2}
          >
            {entityTypes.map(entity => (
              <Option key={entity} value={entity}>
                {formatEntityType(entity)}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} md={12} lg={8}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>User</Text>
          </div>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Filter by user"
            value={userFilter}
            onChange={setUserFilter}
            maxTagCount={2}
            showSearch
            filterOption={(input, option) => 
              option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {users.map(user => (
              <Option key={user.id} value={user.id}>
                {`${user.firstName} ${user.lastName}`}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} md={12} lg={8}>
          <div style={{ marginTop: 24 }}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchAuditLogs}
                type="primary"
              >
                Apply Filters
              </Button>
              <Button onClick={resetFilters}>
                Reset
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportLogs}
              >
                Export
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            <span>User Activity Audit Log</span>
          </div>
        }
      >
        {renderFilters()}
        
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No audit logs found matching your filters
                  </span>
                }
              />
            ),
          }}
        />
      </Card>
      
      {/* Log details drawer */}
      <Drawer
        title="Audit Log Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        {selectedLog && (
          <div>
            <Card title="Event Information" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Date & Time:</Text>
                  <div>
                    <Text strong>
                      {format(parseISO(selectedLog.createdAt), 'PPpp')}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Action:</Text>
                  <div>
                    <Tag color={getActionColor(selectedLog.action)}>
                      {formatActionName(selectedLog.action)}
                    </Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Resource Type:</Text>
                  <div>
                    <Text strong>{formatEntityType(selectedLog.entityType)}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Resource ID:</Text>
                  <div>
                    <Text strong>{selectedLog.entityId}</Text>
                  </div>
                </Col>
              </Row>
            </Card>
            
            <Card title={<><UserOutlined /> User Information</>} style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text type="secondary">Name:</Text>
                  <div>
                    <Text strong>{selectedLog.userName}</Text>
                  </div>
                </Col>
                <Col span={24}>
                  <Text type="secondary">Email:</Text>
                  <div>
                    <Text strong>{selectedLog.userEmail}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">IP Address:</Text>
                  <div>
                    <Text strong>{selectedLog.ipAddress}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">User Agent:</Text>
                  <div>
                    <Text strong style={{ wordBreak: 'break-all' }}>
                      {selectedLog.userAgent || 'Not recorded'}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
            
            <Card title={<><DatabaseOutlined /> Metadata</>}>
              {selectedLog.metadata ? (
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: 16, 
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 300
                }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              ) : (
                <Alert
                  message="No metadata available"
                  type="info"
                  showIcon
                />
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UserActivityAudit; 