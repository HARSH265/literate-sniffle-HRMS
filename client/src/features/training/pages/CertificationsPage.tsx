import { useState } from 'react';
import { Card, Typography, Tag, Space, Select, Empty } from 'antd';
import { DataTable } from '../../../core/components/DataTable';
import { useQuery } from '@tanstack/react-query';
import { trainingService } from '../services/trainingService';
import { employeeService } from '../../employees/services/employeeService';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';

const { Text } = Typography;
const getId = (record: any) => record?.id || record?._id;

export function CertificationsPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();

  const { data: employees } = useQuery({
    queryKey: ['employees', 'active-list'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const { data: employeeSkillsData, isLoading } = useQuery({
    queryKey: ['training', 'skills', 'employee', selectedEmployee],
    queryFn: () => selectedEmployee ? trainingService.listEmployeeSkills(selectedEmployee) : Promise.resolve({ success: true, data: [] }),
    enabled: !!selectedEmployee,
  });

  const employeeList = employees?.data || [];
  const allSkills = employeeSkillsData?.data || [];
  const certifications = allSkills.filter((es: any) => es.certified);

  const columns = [
    { title: 'Skill', key: 'skill', render: (_: any, r: any) => <Text strong>{r.skill?.name || '-'}</Text> },
    { title: 'Category', key: 'category', render: (_: any, r: any) => <Tag>{r.skill?.category || '-'}</Tag> },
    { title: 'Proficiency', dataIndex: 'proficiency', key: 'proficiency', render: (p: string) => <Tag>{p}</Tag> },
    { title: 'Experience', dataIndex: 'yearsOfExperience', key: 'yearsOfExperience', render: (y: number | undefined) => y ? `${y}y` : '-' },
    { title: 'Cert. Expiry', dataIndex: 'certificationExpiry', key: 'certificationExpiry', render: (d: string | undefined) => {
      if (!d) return '-';
      const dt = new Date(d);
      const expired = dt < new Date();
      return <Tag color={expired ? 'red' : 'green'}>{dt.toLocaleDateString('en-IN')}{expired ? ' (Expired)' : ''}</Tag>;
    }},
  ];

  return (
    <PageContainer>
      <PageHeader title="Certifications" subtitle="Track employee certifications" />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select placeholder="Select employee" value={selectedEmployee} onChange={setSelectedEmployee} allowClear showSearch optionFilterProp="label" style={{ width: 320 }}
            options={employeeList.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: getId(e) })).filter((option: any) => Boolean(option.value))}
          />
        </Space>
        {!selectedEmployee ? (
          <Empty description="Select an employee to view certifications" />
        ) : (
          <>
            <Text strong style={{ fontSize: 16 }}>{certifications.length} Certification{certifications.length !== 1 ? 's' : ''}</Text>
            <div style={{ marginTop: 8 }}><DataTable dataSource={certifications} columns={columns} rowKey={(record) => getId(record)} loading={isLoading} hidePagination /></div>
          </>
        )}
      </Card>
    </PageContainer>
  );
}
