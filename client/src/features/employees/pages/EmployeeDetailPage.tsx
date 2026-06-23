import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Avatar, Button, Spin, Card, Descriptions, Tag, message, Upload, Select, Popconfirm, Modal, Tabs } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, UploadOutlined, FileTextOutlined, EyeOutlined, DownloadOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { EmptyState } from '../../../core/components/EmptyState';
import { ErrorState } from '../../../core/components/ErrorState';
import { DataTable } from '../../../core/components/DataTable';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../../attendance/services/attendanceService';
import { payrollService } from '../../payroll/services/payrollService';
import { EMPLOYEE_STATUS_COLORS } from '../../../core/constants/statusColors';
import { formatCurrency } from '../../../core/constants/currency';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const docTypeLabels: Record<string, string> = {
  aadhar: 'Aadhar Card',
  pan: 'PAN Card',
  voter: 'Voter ID',
  driver_license: 'Driver License',
  passport: 'Passport',
  other: 'Other',
};

const CATEGORY_LABELS: Record<'worker' | 'office-staff', string> = {
  worker: 'Worker', 'office-staff': 'Office Staff',
};

const loadingFlex: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' };

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('aadhar');
  const [activeTab, setActiveTab] = useState('overview');

  const queryEnabled = !!(id && id !== 'new');

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getById(id!),
    enabled: queryEnabled,
    retry: 1,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

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

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['employee-attendance', id],
    queryFn: () => attendanceService.getByEmployee(id!, undefined, undefined),
    enabled: !!id && id !== 'new' && activeTab === 'attendance',
  });

  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['employee-payroll', id],
    queryFn: () => payrollService.getByEmployee(id!),
    enabled: !!id && id !== 'new' && activeTab === 'payroll',
  });

  const attendanceColumns = useMemo(() => [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'present' ? 'green' : s === 'absent' ? 'red' : 'default'}>{s}</Tag> },
    { title: 'In Time', dataIndex: 'inTime', key: 'inTime' },
    { title: 'Out Time', dataIndex: 'outTime', key: 'outTime' },
    { title: 'Shift', dataIndex: ['shift', 'name'], key: 'shift' },
    { title: 'Late', dataIndex: 'isLate', key: 'isLate', render: (late: boolean) => late ? <Tag color="orange">Late</Tag> : '-' },
  ], []);

  const payrollColumns = useMemo(() => [
    { title: 'Month', dataIndex: 'month', key: 'month', render: (m: string) => dayjs(m + '-01').format('MMM YYYY') },
    { title: 'Present Days', dataIndex: 'presentDays', key: 'presentDays' },
    { title: 'Basic', dataIndex: 'basicEarnings', key: 'basicEarnings', render: (v: number) => formatCurrency(v ?? 0) },
    { title: 'Allowances', dataIndex: 'allowancesTotal', key: 'allowancesTotal', render: (v: number) => formatCurrency(v ?? 0) },
    { title: 'Deductions', dataIndex: 'totalDeductions', key: 'totalDeductions', render: (v: number) => formatCurrency(v ?? 0) },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>{formatCurrency(v ?? 0)}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'finalized' ? 'green' : 'orange'}>{s}</Tag> },
  ], []);

  if (!queryEnabled || isLoading) {
    return (
      <PageContainer>
        <div style={loadingFlex}><Spin size="large" /></div>
      </PageContainer>
    );
  }

  if (error && !isFetching) {
    return (
      <PageContainer>
        <ErrorState message="Something went wrong" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (!data?.data) {
    return (
      <PageContainer>
        <EmptyState title="Employee not found" action={{ label: 'Go Back', onClick: () => navigate('/employees') }} />
      </PageContainer>
    );
  }

  const employee = data.data;

  const DOC_MAX_SIZE = 5 * 1024 * 1024;

  const handleUpload = (file: File) => {
    if (file.size > DOC_MAX_SIZE) {
      message.error(`File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return false;
    }
    uploadMutation.mutate({ file, docType: selectedDocType });
    return false;
  };

  return (
    <PageContainer>
      <PageHeader
        title={employee.fullName}
        breadcrumbs={[
          { label: 'Employees', path: '/employees' },
          { label: employee.employeeCode },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')} aria-label="Go back to employees list">
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
              aria-label="Edit employee"
            >
              Edit Employee
            </Button>
          </div>
        }
        subtitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Tag color={EMPLOYEE_STATUS_COLORS[employee.status as keyof typeof EMPLOYEE_STATUS_COLORS]} style={{ margin: 0 }}>
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
            <Card style={{ marginBottom: 24 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Avatar
                  size={100}
                  src={employee.photo}
                  icon={<UserOutlined />}
                  style={{ background: 'linear-gradient(135deg, var(--hrms-primary), var(--hrms-primary))', flexShrink: 0 }}
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
                      ? <CheckCircleOutlined style={{ color: 'var(--hrms-success)' }} />
                      : <CloseCircleOutlined style={{ color: 'var(--hrms-text-muted)' }} />
                    }
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title="Organization" style={{ marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
                <Descriptions.Item label="Department">{employee.department?.name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Department Head">
                  {employee.department?.name || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Designation">{employee.designation?.name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Shift">{employee.shift?.name || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Salary Information" style={{ marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Salary Type">
                  <Tag color="cyan">{employee.salaryType === 'monthly' ? 'Monthly' : 'Daily'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Base Salary">
                  <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>
                    {formatCurrency(employee.baseSalary || 0)}/month
                  </span>
                </Descriptions.Item>
                {employee.dailyWage && (
                  <Descriptions.Item label="Daily Wage">
                    <span style={{ fontWeight: 600 }}>{formatCurrency(employee.dailyWage || 0)}/day</span>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Card title="Contact & Address" style={{ marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Contact Number">{employee.contactNumber || '—'}</Descriptions.Item>
                <Descriptions.Item label="Email">{employee.email || '—'}</Descriptions.Item>
                <Descriptions.Item label="Emergency Contact">{employee.emergencyContact || '—'}</Descriptions.Item>
                <Descriptions.Item label="Gender">{employee.gender || '—'}</Descriptions.Item>
                <Descriptions.Item label="Blood Group">{employee.bloodGroup || '—'}</Descriptions.Item>
                <Descriptions.Item label="Marital Status">{employee.maritalStatus || '—'}</Descriptions.Item>
                <Descriptions.Item label="Date of Birth">{employee.dateOfBirth ? dayjs(employee.dateOfBirth).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>{employee.address || '—'}</Descriptions.Item>
                {employee.permanentAddress && (
                  <Descriptions.Item label="Permanent Address" span={2}>{employee.permanentAddress}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {employee.bankDetails && (
              <Card title="Bank Details" style={{ marginBottom: 24 }}>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label="Bank Name">{employee.bankDetails.bankName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Account Number">{employee.bankDetails.accountNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="IFSC Code">{employee.bankDetails.ifscCode || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Account Holder">{employee.bankDetails.accountHolderName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Account Type">
                    {employee.bankDetails.accountType ? (
                      <Tag>{employee.bankDetails.accountType}</Tag>
                    ) : '—'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Card title="Statutory Compliance" style={{ marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="PF UAN">{employee.pfUAN || '—'}</Descriptions.Item>
                <Descriptions.Item label="ESI Number">{employee.esiNumber || '—'}</Descriptions.Item>
                <Descriptions.Item label="PF Joining Date">{employee.pfJoiningDate ? dayjs(employee.pfJoiningDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                <Descriptions.Item label="PF Exempted">
                  {employee.pfExempted ? <Tag color="red">Exempted</Tag> : <Tag color="green">Not Exempted</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="ESI Exempted">
                  {employee.esiExempted ? <Tag color="red">Exempted</Tag> : <Tag color="green">Not Exempted</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="PT Exempted">
                  {employee.ptExempted ? <Tag color="red">Exempted</Tag> : <Tag color="green">Not Exempted</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="PT State">{employee.ptState || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card style={{ marginTop: 24 }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'overview',
                    label: <span><FileTextOutlined /> Documents</span>,
                    children: (
                      <div>
                        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)} style={{ marginBottom: 16 }} aria-label="Upload document">
                          Add Document
                        </Button>
                        {employee.documents && employee.documents.length > 0 ? (
                          <Row gutter={16}>
                            {employee.documents.map((doc) => (
                              <Col xs={24} sm={12} md={8} key={doc._id}>
                                <Card size="small" style={{ marginBottom: 12 }}
                                  actions={[
                                    <EyeOutlined key="view" onClick={() => window.open(doc.filePath, '_blank,noopener,noreferrer')} />,
                                    <DownloadOutlined key="download" onClick={() => window.open(employeeService.getDocumentUrl(employee.id, doc._id), '_blank,noopener,noreferrer')} />,
                                    <Popconfirm key="delete" title="Delete this document?" onConfirm={() => deleteMutation.mutate(doc._id)}>
                                      <DeleteOutlined style={{ color: 'var(--hrms-danger)' }} />
                                    </Popconfirm>
                                  ]}
                                >
                                  <Card.Meta avatar={<FileTextOutlined style={{ fontSize: 24, color: 'var(--hrms-primary)' }} />} title={docTypeLabels[doc.type] || doc.type} description={doc.fileName} />
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        ) : (
                          <EmptyState title="No documents uploaded yet" />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'attendance',
                    label: <span><CalendarOutlined /> Attendance History</span>,
                    children: (
                      <DataTable
                        dataSource={attendanceData || []}
                        rowKey="id"
                        loading={attendanceLoading}
                        hidePagination
                        noCard
                        disableRowClick
                        columns={attendanceColumns}
                      />
                    ),
                  },
                  {
                    key: 'payroll',
                    label: <span><DollarOutlined /> Payroll History</span>,
                    children: (
                      <DataTable
                        dataSource={payrollData || []}
                        rowKey="id"
                        loading={payrollLoading}
                        hidePagination
                        noCard
                        disableRowClick
                        columns={payrollColumns}
                      />
                    ),
                  },
                ]}
              />
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
    </PageContainer>
  );
}
