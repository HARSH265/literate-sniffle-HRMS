import { useState } from 'react';
import { Card, Select, Typography, Tag, Space, Empty, Spin } from 'antd';
import { DataTable } from '../../../core/components/DataTable';
import { useQuery } from '@tanstack/react-query';
import { trainingService } from '../services/trainingService';
import { employeeService } from '../../employees/services/employeeService';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';

const { Text } = Typography;
const getId = (record: any) => record?.id || record?._id;

const PROFICIENCY_COLORS: Record<string, string> = {
  beginner: 'orange', intermediate: 'blue', advanced: 'purple', expert: 'green',
};

export function SkillGapPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();

  const { data: employees } = useQuery({
    queryKey: ['employees', 'active-list'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const { data: allSkillsData } = useQuery({
    queryKey: ['training', 'skills'],
    queryFn: () => trainingService.listSkills(),
  });

  const { data: employeeSkillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ['training', 'skills', 'employee', selectedEmployee],
    queryFn: () => selectedEmployee ? trainingService.listEmployeeSkills(selectedEmployee) : Promise.resolve({ success: true, data: [] }),
    enabled: !!selectedEmployee,
  });

  const allSkills = allSkillsData?.data || [];
  const employeeSkills = employeeSkillsData?.data || [];
  const employeeList = employees?.data || [];

  const employeeSkillNames = new Set(employeeSkills.map((es: any) => es.skill?.name));

  const missingSkills = allSkills.filter((s: any) => !employeeSkillNames.has(s.name));

  const columns = [
    { title: 'Skill', key: 'name', render: (_: any, r: any) => <Text strong>{r.name}</Text> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag>{c}</Tag> },
    {
      title: 'Status', key: 'status', width: 120,
      render: (_: any, r: any) => employeeSkillNames.has(r.name)
        ? <Tag color="green">Acquired</Tag>
        : <Tag color="red">Gap</Tag>,
    },
  ];

  const existingSkillColumns = [
    { title: 'Skill', key: 'skill', render: (_: any, r: any) => <Text strong>{r.skill?.name || '-'}</Text> },
    { title: 'Category', key: 'category', render: (_: any, r: any) => <Tag>{r.skill?.category || '-'}</Tag> },
    { title: 'Proficiency', key: 'proficiency', render: (_: any, r: any) =>
      <Tag color={PROFICIENCY_COLORS[r.proficiency]}>{r.proficiency}</Tag>
    },
    { title: 'Experience', key: 'yearsOfExperience', render: (_: any, r: any) => r.yearsOfExperience ? `${r.yearsOfExperience}y` : '-' },
    { title: 'Certified', key: 'certified', render: (_: any, r: any) => r.certified ? <Tag color="green">Yes</Tag> : '-' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Skill Gap Analysis" subtitle="Identify missing skills for employees" />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select placeholder="Select employee" value={selectedEmployee} onChange={setSelectedEmployee} allowClear showSearch optionFilterProp="label" style={{ width: 320 }}
            options={employeeList.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: getId(e) })).filter((option: any) => Boolean(option.value))}
          />
        </Space>

        {!selectedEmployee ? (
          <Empty description="Select an employee to view skill gaps" />
        ) : skillsLoading ? <Spin /> : (
          <div>
            <Text strong style={{ fontSize: 16 }}>Existing Skills ({employeeSkills.length})</Text>
            <div style={{ marginBottom: 24, marginTop: 8 }}><DataTable dataSource={employeeSkills} columns={existingSkillColumns} rowKey={(record) => getId(record)} hidePagination /></div>

            <Text strong style={{ fontSize: 16, color: missingSkills.length > 0 ? 'var(--hrms-danger)' : 'var(--hrms-success)' }}>
              {missingSkills.length > 0 ? `Missing Skills (${missingSkills.length})` : 'No skill gaps found'}
            </Text>
            <div style={{ marginTop: 8 }}><DataTable dataSource={missingSkills} columns={columns} rowKey={(record) => getId(record)} hidePagination /></div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
