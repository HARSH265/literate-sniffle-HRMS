import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Avatar, Button, Spin, Card, Descriptions, Tag, message, Upload, Select, Popconfirm, Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, UploadOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { employeeService } from '../services/employeeService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  inactive: '#f59e0b', 
  terminated: '#ef4444',
  archived: '#6b7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  worker: 'Manufacturing Worker',
  'office-staff': 'Office Staff',
};

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('aadhar');

  if (id === 'new') {
    navigate('/employees/new');
    return null;
  }

  const queryEnabled = !!(id && id !== 'new');

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getById(id!),
    enabled: queryEnabled,
    retry: 1,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  if (!queryEnabled) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const hasError = error && !isFetching;

  if (hasError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: 16 }}>
        <div>Something went wrong</div>
        <Button type="primary" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: 16 }}>
        <div>Employee not found</div>
        <Button type="primary" onClick={() => navigate('/employees')}>
          Go Back
        </Button>
      </div>
    );
  }

  const employee = data.data;

  const uploadMutation = useMutation({
    mutationFn: ({ file, docType }: { file: File; docType: string }) => 
      employeeService.uploadDocument(id!, file, docType),
    onSuccess: () => {
      message.success('Document uploaded');
      setUploadModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
    onError: () => message.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => employeeService.deleteDocument(id!, docId),
    onSuccess: () => {
      message.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
    onError: () => message.error('Delete failed'),
  });

  const docTypeLabels: Record<string, string> = {
    aadhar: 'Aadhar Card',
    pan: 'PAN Card',
    voter: 'Voter ID',
    driver_license: 'Driver License',
    passport: 'Passport',
    other: 'Other',
  };

  const handleUpload = (file: File) => {
    uploadMutation.mutate({ file, docType: selectedDocType });
    return false;
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title={employee.fullName}
        breadcrumbs={[
          { label: 'Employees', path: '/employees' },
          { label: employee.employeeCode },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')}>
              Back
            </Button>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              Edit Employee
            </Button>
          </div>
        }
        subtitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Tag color={STATUS_COLORS[employee.status]} style={{ margin: 0 }}>
              {employee.status?.toUpperCase()}
            </Tag>
            <span style={{ color: 'var(--hrms-text-muted)', fontSize: 13 }}>
              {employee.employeeCode}
            </span>
          </div>
        }
      />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={24}>
          <Col xs={24} lg={8}>
            <Card style={{ borderRadius: 12, marginBottom: 24 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Avatar
                  size={100}
                  src={employee.photo}
                  icon={<UserOutlined />}
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                />
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16, color: 'var(--hrms-text-primary)' }}>
                  {employee.fullName}
                </div>
                <div style={{ fontSize: 14, color: 'var(--hrms-text-muted)', marginTop: 4 }}>
                  {employee.fatherName ? `S/o ${employee.fatherName}` : ''}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Tag color={employee.category === 'worker' ? 'blue' : 'purple'} style={{ fontSize: 12, padding: '4px 12px' }}>
                    {CATEGORY_LABELS[employee.category] || employee.category}
                  </Tag>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--hrms-border-light)', paddingTop: 20, marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--hrms-text-muted)', marginBottom: 12 }}>
                  Employment Details
                </div>
                <Descriptions column={1} size="small" colon={false}>
                  <Descriptions.Item label="Employment Type">
                    <Tag>{employee.employmentType}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Joining Date">
                    {employee.joiningDate ? dayjs(employee.joiningDate).format('DD MMM YYYY') : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Overtime Eligible">
                    {employee.overtimeEligible 
                      ? <CheckCircleOutlined style={{ color: '#22c55e' }} /> 
                      : <CloseCircleOutlined style={{ color: '#9ca3af' }} />
                    }
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title="Organization" style={{ borderRadius: 12, marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
                <Descriptions.Item label="Department">{employee.department?.name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Designation">{employee.designation?.name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Shift">{employee.shift?.name || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Salary Information" style={{ borderRadius: 12, marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Salary Type">
                  <Tag color="cyan">{employee.salaryType === 'monthly' ? 'Monthly' : 'Daily'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Base Salary">
                  <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>
                    ₹{employee.baseSalary?.toLocaleString()}/month
                  </span>
                </Descriptions.Item>
                {employee.dailyWage && (
                  <Descriptions.Item label="Daily Wage">
                    <span style={{ fontWeight: 600 }}>₹{employee.dailyWage}/day</span>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Card title="Contact & Address" style={{ borderRadius: 12, marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Contact Number">{employee.contactNumber || '—'}</Descriptions.Item>
                <Descriptions.Item label="Email">{employee.email || '—'}</Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>{employee.address || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {employee.bankDetails && (
              <Card title="Bank Details" style={{ borderRadius: 12, marginBottom: 24 }}>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label="Bank Name">{employee.bankDetails.bankName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Account Number">{employee.bankDetails.accountNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="IFSC Code">{employee.bankDetails.ifscCode || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Account Type">
                    {employee.bankDetails.accountType ? (
                      <Tag>{employee.bankDetails.accountType}</Tag>
                    ) : '—'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Card 
              title="Documents" 
              style={{ borderRadius: 12 }}
              extra={
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalOpen(true)}
                >
                  Add Document
                </Button>
              }
            >
              {employee.documents && employee.documents.length > 0 ? (
                <Row gutter={16}>
                  {employee.documents.map((doc: any) => (
                    <Col xs={24} sm={12} md={8} key={doc._id}>
                      <Card 
                        size="small" 
                        style={{ marginBottom: 12 }}
                        actions={[
                          <EyeOutlined key="view" onClick={() => window.open(doc.filePath, '_blank')} />,
                          <Popconfirm 
                            key="delete"
                            title="Delete this document?" 
                            onConfirm={() => deleteMutation.mutate(doc._id)}
                          >
                            <DeleteOutlined style={{ color: '#ff4d4f' }} />
                          </Popconfirm>
                        ]}
                      >
                        <Card.Meta 
                          avatar={<FileTextOutlined style={{ fontSize: 24, color: '#4f46e5' }} />}
                          title={docTypeLabels[doc.type] || doc.type}
                          description={doc.fileName}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--hrms-text-muted)', padding: 24 }}>
                  No documents uploaded yet
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Modal
          title="Upload Document"
          open={uploadModalOpen}
          onCancel={() => setUploadModalOpen(false)}
          footer={null}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Document Type</label>
            <Select
              style={{ width: '100%' }}
              value={selectedDocType}
              onChange={setSelectedDocType}
              options={[
                { value: 'aadhar', label: 'Aadhar Card' },
                { value: 'pan', label: 'PAN Card' },
                { value: 'voter', label: 'Voter ID' },
                { value: 'driver_license', label: 'Driver License' },
                { value: 'passport', label: 'Passport' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <Upload.Dragger
            accept="image/*,.pdf"
            maxCount={1}
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={uploadMutation.isPending}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to upload</p>
            <p className="ant-upload-hint">Supports image or PDF, max 5MB</p>
          </Upload.Dragger>
        </Modal>
      </div>
    </div>
  );
}