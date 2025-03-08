import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Upload, 
  message, 
  Steps, 
  Table, 
  Divider, 
  Typography, 
  Alert,
  Space,
  Progress,
  Select
} from 'antd';
import { UploadOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { InboxOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { logUserAction } from '@/services/userService';

const { Dragger } = Upload;
const { Step } = Steps;
const { Title, Text } = Typography;
const { Option } = Select;

interface UserImportData {
  key?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  studentId?: string;
  phoneNumber?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export const BulkUserImport: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [importData, setImportData] = useState<UserImportData[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
  }>({ total: 0, success: 0, failed: 0 });
  const [templateFormat, setTemplateFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');

  // Template download handler
  const handleDownloadTemplate = () => {
    const template: any[] = [
      {
        'Email (Required)': 'john.doe@example.com',
        'First Name (Required)': 'John',
        'Last Name (Required)': 'Doe',
        'Role (Required)': 'student',
        'Department': 'Computer Science',
        'Student ID': 'ST12345',
        'Phone Number': '+1234567890'
      }
    ];

    if (templateFormat === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(template);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'User Import Template');
      XLSX.writeFile(workbook, 'user_import_template.xlsx');
    } else if (templateFormat === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(template);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'user_import_template.csv';
      link.click();
    } else if (templateFormat === 'json') {
      const json = JSON.stringify(template, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'user_import_template.json';
      link.click();
    }
  };

  // File upload handler
  const handleFileUpload = (info: any) => {
    setFileList(info.fileList.slice(-1));
    
    const file = info.file;
    
    if (file.status !== 'uploading') {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const transformedData: UserImportData[] = jsonData.map((row: any, index) => ({
            key: index.toString(),
            email: row['Email (Required)'] || row['email'] || '',
            firstName: row['First Name (Required)'] || row['firstName'] || '',
            lastName: row['Last Name (Required)'] || row['lastName'] || '',
            role: row['Role (Required)'] || row['role'] || '',
            department: row['Department'] || row['department'] || '',
            studentId: row['Student ID'] || row['studentId'] || '',
            phoneNumber: row['Phone Number'] || row['phoneNumber'] || '',
            status: 'pending'
          }));
          
          setImportData(transformedData);
          setCurrentStep(1);
          message.success(`${file.name} file read successfully`);
        } catch (error) {
          console.error('Error parsing file:', error);
          message.error('Failed to parse file. Please ensure it\'s a valid Excel, CSV, or JSON file.');
        }
      };
      
      reader.readAsArrayBuffer(file.originFileObj);
    }
  };

  // Validate import data
  const validateImportData = () => {
    const validatedData = importData.map(user => {
      // Simple validation - check required fields
      if (!user.email || !user.firstName || !user.lastName || !user.role) {
        return {
          ...user,
          status: 'error' as const,
          error: 'Missing required field(s)'
        };
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        return {
          ...user,
          status: 'error' as const,
          error: 'Invalid email format'
        };
      }
      
      // Role validation
      if (!['admin', 'lecturer', 'student'].includes(user.role.toLowerCase())) {
        return {
          ...user,
          status: 'error' as const,
          error: 'Role must be admin, lecturer, or student'
        };
      }
      
      return user;
    });
    
    setImportData(validatedData);
    
    // If all users are valid, go to next step
    if (!validatedData.some(user => user.status === 'error')) {
      setCurrentStep(2);
    } else {
      message.warning('Please fix the errors before proceeding');
    }
  };

  // Import users to database
  const importUsers = async () => {
    setImporting(true);
    setImportProgress(0);
    
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    try {
      let successCount = 0;
      let failedCount = 0;
      
      // Process each user
      for (let i = 0; i < importData.length; i++) {
        const user = importData[i];
        
        try {
          // Create user in Auth
          const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            email_confirm: true,
            user_metadata: {
              firstName: user.firstName,
              lastName: user.lastName,
            },
            app_metadata: {
              role: user.role.toLowerCase(),
            },
          });
          
          if (error) throw error;
          
          if (data.user) {
            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.toLowerCase(),
                department: user.department,
                student_id: user.studentId,
                phone_number: user.phoneNumber,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            
            if (profileError) throw profileError;
            
            // Update status
            const updatedData = [...importData];
            updatedData[i] = {
              ...user,
              status: 'success'
            };
            setImportData(updatedData);
            successCount++;
          }
        } catch (error: any) {
          console.error('Error importing user:', error);
          
          // Update status with error
          const updatedData = [...importData];
          updatedData[i] = {
            ...user,
            status: 'error',
            error: error.message || 'Import failed'
          };
          setImportData(updatedData);
          failedCount++;
        }
        
        // Update progress
        const progress = Math.floor(((i + 1) / importData.length) * 100);
        setImportProgress(progress);
      }
      
      // Log the bulk import action
      if (userId) {
        await logUserAction(
          userId,
          'BULK_IMPORT_USERS',
          'profiles',
          'multiple',
          { 
            total: importData.length,
            success: successCount,
            failed: failedCount
          }
        );
      }
      
      setImportResults({
        total: importData.length,
        success: successCount,
        failed: failedCount
      });
      
      if (failedCount === 0) {
        message.success(`Successfully imported ${successCount} users`);
      } else {
        message.warning(`Imported ${successCount} users, ${failedCount} failed`);
      }
      
      setCurrentStep(3);
    } catch (error) {
      console.error('Bulk import error:', error);
      message.error('An error occurred during the import process');
    } finally {
      setImporting(false);
    }
  };

  // Reset the import process
  const resetImport = () => {
    setCurrentStep(0);
    setImportData([]);
    setFileList([]);
    setImportProgress(0);
    setImportResults({ total: 0, success: 0, failed: 0 });
  };

  // Table columns for review step
  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Student ID',
      dataIndex: 'studentId',
      key: 'studentId',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: UserImportData) => {
        if (status === 'error') {
          return <Alert type="error" message={record.error} showIcon />;
        } else if (status === 'success') {
          return <Alert type="success" message="Success" showIcon />;
        }
        return <Alert type="info" message="Pending" showIcon />;
      },
    },
  ];

  // Steps content
  const steps = [
    {
      title: 'Upload File',
      content: (
        <Card>
          <div style={{ marginBottom: 20 }}>
            <Title level={4}>Import Users from File</Title>
            <Text>
              Upload a spreadsheet file (Excel, CSV) containing user information to bulk import users.
              You can use the template below as a guide.
            </Text>
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <Space>
                <Select 
                  defaultValue="xlsx" 
                  style={{ width: 120 }} 
                  onChange={(value) => setTemplateFormat(value as any)}
                >
                  <Option value="xlsx">Excel (.xlsx)</Option>
                  <Option value="csv">CSV (.csv)</Option>
                  <Option value="json">JSON (.json)</Option>
                </Select>
                <Button 
                  onClick={handleDownloadTemplate}
                  icon={templateFormat === 'xlsx' ? <FileExcelOutlined /> : 
                       templateFormat === 'csv' ? <FileTextOutlined /> : 
                       <FilePdfOutlined />}
                >
                  Download Template
                </Button>
              </Space>
            </div>
          </div>
          <Dragger
            fileList={fileList}
            accept=".xlsx,.xls,.csv,.json"
            beforeUpload={() => false}
            onChange={handleFileUpload}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for Excel, CSV, and JSON formats.
            </p>
          </Dragger>
        </Card>
      ),
    },
    {
      title: 'Review Data',
      content: (
        <Card>
          <Title level={4}>Review Import Data</Title>
          <Text>
            Review the data below to ensure it's correct before proceeding with the import.
            Fix any errors in your file and re-upload if needed.
          </Text>
          <Divider />
          <Table
            dataSource={importData}
            columns={columns}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 5 }}
          />
          <div style={{ marginTop: 16 }}>
            <Text type="danger">
              {importData.filter(user => user.status === 'error').length} errors found
            </Text>
          </div>
        </Card>
      ),
    },
    {
      title: 'Import',
      content: (
        <Card>
          <Title level={4}>Import Users</Title>
          <Text>
            You are about to import {importData.length} users. This process will:
          </Text>
          <ul>
            <li>Create user accounts with the provided email addresses</li>
            <li>Send welcome emails to all new users</li>
            <li>Set initial passwords that users will need to change on first login</li>
          </ul>
          
          {importing ? (
            <div style={{ marginTop: 20 }}>
              <Progress percent={importProgress} status="active" />
              <Text>Importing users... {importProgress}% complete</Text>
            </div>
          ) : (
            <Button 
              type="primary" 
              onClick={importUsers} 
              style={{ marginTop: 16 }}
              disabled={importing}
            >
              Start Import
            </Button>
          )}
        </Card>
      ),
    },
    {
      title: 'Complete',
      content: (
        <Card>
          <Title level={4}>Import Complete</Title>
          <div style={{ marginBottom: 20 }}>
            <Alert
              message="Import Summary"
              description={
                <div>
                  <p>Total users processed: {importResults.total}</p>
                  <p>Successfully imported: {importResults.success}</p>
                  <p>Failed to import: {importResults.failed}</p>
                </div>
              }
              type={importResults.failed > 0 ? "warning" : "success"}
              showIcon
            />
          </div>
          
          {importResults.failed > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Failed Imports</Title>
              <Table
                dataSource={importData.filter(user => user.status === 'error')}
                columns={columns}
                pagination={false}
              />
            </div>
          )}
          
          <Button type="primary" onClick={resetImport}>
            Start New Import
          </Button>
        </Card>
      ),
    }
  ];

  return (
    <div>
      <Card title="Bulk User Import">
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <div>{steps[currentStep].content}</div>
        
        <div style={{ marginTop: 24 }}>
          {currentStep > 0 && currentStep < 3 && (
            <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(currentStep - 1)}>
              Previous
            </Button>
          )}
          
          {currentStep === 1 && (
            <Button type="primary" onClick={validateImportData}>
              Continue
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BulkUserImport; 