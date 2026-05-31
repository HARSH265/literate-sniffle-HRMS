import { useState } from 'react';
import { Card, Select, Button, Space, message, Row, Col, Input } from 'antd';
import { FilterOutlined, EyeOutlined, BarChartOutlined } from '@ant-design/icons';
import { DataTable } from '../../../core/components/DataTable';
import apiClient from '../../../core/api/apiClient';
import type { CustomReportTabProps } from '../types/reportTypes';

const AVAILABLE_FIELDS = [
  { label: 'Employee Code', value: 'employeeCode' },
  { label: 'Full Name', value: 'fullName' },
  { label: "Father's Name", value: 'fatherName' },
  { label: 'Category', value: 'category' },
  { label: 'Employment Type', value: 'employmentType' },
  { label: 'Salary Type', value: 'salaryType' },
  { label: 'Base Salary', value: 'baseSalary' },
  { label: 'Daily Wage', value: 'dailyWage' },
  { label: 'Status', value: 'status' },
  { label: 'Department', value: 'department' },
  { label: 'Designation', value: 'designation' },
  { label: 'Shift', value: 'shift' },
  { label: 'Joining Date', value: 'joiningDate' },
  { label: 'Contact Number', value: 'contactNumber' },
];

export function CustomReportTab({ deptData }: CustomReportTabProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(['fullName', 'employeeCode', 'department', 'status']);
  const [customFilters, setCustomFilters] = useState<Record<string, any>>({});
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [customResult, setCustomResult] = useState<any>(null);
  const [customLoading, setCustomLoading] = useState(false);

  const handleBuildCustomReport = async () => {
    try {
      setCustomLoading(true);
      const res = await apiClient.post('/reports/custom', {
        fields: selectedFields,
        filters: customFilters,
        groupBy: groupBy || undefined,
        limit: 500,
      });
      const result = res.data;
      if (result.success) {
        setCustomResult(result.data);
        message.success(`Report generated: ${result.data.total} records`);
      } else {
        message.error(result.message || 'Failed to generate report');
      }
    } catch {
      message.error('Failed to generate custom report');
    } finally {
      setCustomLoading(false);
    }
  };

  const deptOptions = deptData.data?.data?.map((d: any) => ({ label: d.name, value: d.id })) || [];

  return (
    <div>
      <Card title={<Space><FilterOutlined /> Custom Report Builder</Space>} style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={24} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Fields</label>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select fields to include"
              value={selectedFields}
              onChange={setSelectedFields}
              options={AVAILABLE_FIELDS}
            />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Status Filter</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Statuses" value={customFilters.status} onChange={(v) => setCustomFilters({ ...customFilters, status: v })} options={[
              { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Terminated', value: 'terminated' },
            ]} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Category Filter</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Categories" value={customFilters.category} onChange={(v) => setCustomFilters({ ...customFilters, category: v })} options={[
              { label: 'Worker', value: 'worker' }, { label: 'Office Staff', value: 'office-staff' },
            ]} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Department Filter</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Departments" value={customFilters.department} onChange={(v) => setCustomFilters({ ...customFilters, department: v })} options={deptOptions} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Employment Type</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Types" value={customFilters.employmentType} onChange={(v) => setCustomFilters({ ...customFilters, employmentType: v })} options={[
              { label: 'Permanent', value: 'permanent' }, { label: 'Contract', value: 'contract' }, { label: 'Temporary', value: 'temporary' }, { label: 'Trainee', value: 'trainee' },
            ]} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Search</label>
            <Input placeholder="Search by name or code" value={customFilters.search} onChange={(e) => setCustomFilters({ ...customFilters, search: e.target.value })} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Group By</label>
            <Select allowClear style={{ width: '100%' }} placeholder="No grouping" value={groupBy} onChange={setGroupBy} options={AVAILABLE_FIELDS} />
          </Col>
        </Row>
        <Button type="primary" icon={<EyeOutlined />} onClick={handleBuildCustomReport} loading={customLoading}>
          Generate Report
        </Button>
      </Card>

      {customResult && (
        <Card title={<Space><BarChartOutlined /> Results ({customResult.total} records{customResult.groupBy ? ` grouped by ${customResult.groupBy}` : ''})</Space>}>
          {customResult.groupBy ? (
            <DataTable
              dataSource={customResult.data}
              loading={customLoading}
              columns={[
                { title: 'Group', dataIndex: 'group', key: 'group' },
                { title: 'Count', dataIndex: 'count', key: 'count' },
              ]}
              rowKey="group"
              hidePagination
              noCard
              disableRowClick
            />
          ) : (
            <DataTable
              dataSource={customResult.data}
              loading={customLoading}
              columns={customResult.fields.map((f: string) => ({ title: f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()), dataIndex: f, key: f, render: (v: any) => v ?? '-' }))}
              rowKey={(_, idx) => String(idx)}
              noCard
              hidePagination={false}
              total={customResult.total}
              pageSize={50}
              pageSizeOptions={['10', '20', '50', '100']}
              disableRowClick
            />
          )}
        </Card>
      )}
    </div>
  );
}
