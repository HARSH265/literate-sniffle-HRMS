import { useState } from 'react';
import { Card, Select, Typography, Tag, Space, Modal, InputNumber, Switch, Button } from 'antd';
import { EmptyState } from '../../../core/components/EmptyState';
import { DataTable } from '../../../core/components/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/trainingService';
import { employeeService } from '../../employees/services/employeeService';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { usePermission } from '../../../core/hooks/usePermission';
import { message } from 'antd';

const { Text } = Typography;
const getId = (record: any) => record?.id || record?._id;

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const PROFICIENCY_COLORS: Record<string, string> = {
  beginner: 'orange', intermediate: 'blue', advanced: 'purple', expert: 'green',
};

export function SkillMatrixPage() {
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-training');
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<{ employeeId: string; skillId: string; proficiency: string; yearsOfExperience?: number; certified?: boolean } | null>(null);

  const { data: employees } = useQuery({
    queryKey: ['employees', 'active-list'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const { data: allSkillsData } = useQuery({
    queryKey: ['training', 'skills'],
    queryFn: () => trainingService.listSkills(),
  });

  const { data: employeeSkillsData, isLoading } = useQuery({
    queryKey: ['training', 'skills', 'employee', selectedEmployee],
    queryFn: () => selectedEmployee ? trainingService.listEmployeeSkills(selectedEmployee) : Promise.resolve({ success: true, data: [] }),
    enabled: !!selectedEmployee,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { employeeId: string; skillId: string; proficiency: string; yearsOfExperience?: number; certified?: boolean }) =>
      trainingService.updateEmployeeSkill(payload.employeeId, payload.skillId, payload),
    onSuccess: (res) => { message.success(res.message || 'Skill updated'); queryClient.invalidateQueries({ queryKey: ['training', 'skills'] }); setEditModalOpen(false); },
    onError: (err: any) => { message.error(err?.response?.data?.message || 'Failed to update'); },
  });

  const employeeList = employees?.data || [];
  const allSkills = allSkillsData?.data || [];
  const employeeSkills = employeeSkillsData?.data || [];

  const skillMap = new Map(employeeSkills.map((es: any) => [getId(es.skill) || es.skill, es]));

  const columns = [
    { title: 'Skill', key: 'name', render: (_: any, r: any) => <Text strong>{r.name}</Text> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag>{c}</Tag> },
    {
      title: 'Proficiency', key: 'proficiency',
      render: (_: any, r: any) => {
        const es = skillMap.get(getId(r));
        if (!es) return <Text type="secondary">—</Text>;
        return <Tag color={PROFICIENCY_COLORS[es.proficiency] || 'default'}>{es.proficiency}</Tag>;
      },
    },
    {
      title: 'Experience', key: 'experience',
      render: (_: any, r: any) => {
        const es = skillMap.get(getId(r));
        return es?.yearsOfExperience ? `${es.yearsOfExperience}y` : '-';
      },
    },
    {
      title: 'Certified', key: 'certified',
      render: (_: any, r: any) => {
        const es = skillMap.get(getId(r));
        return es?.certified ? <Tag color="green">Yes</Tag> : '-';
      },
    },
    {
      title: '', key: 'actions', width: 80,
      render: (_: any, r: any) => canManage ? (
        <Button size="small" onClick={() => {
          const skillId = getId(r);
          const es = skillMap.get(skillId);
          setEditSkill({ employeeId: selectedEmployee!, skillId, proficiency: es?.proficiency || 'beginner', yearsOfExperience: es?.yearsOfExperience, certified: es?.certified });
          setEditModalOpen(true);
        }}>Edit</Button>
      ) : null,
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Skill Matrix" subtitle="View and manage employee skills" />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select placeholder="Select an employee" value={selectedEmployee} onChange={(v) => { setSelectedEmployee(v); setEditModalOpen(false); }} allowClear showSearch optionFilterProp="label" style={{ width: 320 }}
            options={employeeList.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: getId(e) })).filter((option: any) => Boolean(option.value))}
          />
        </Space>
        {!selectedEmployee ? (
          <EmptyState description="Select an employee to view their skills" />
        ) : (
          <DataTable dataSource={allSkills} columns={columns} rowKey={(record) => getId(record)} loading={isLoading} hidePagination />
        )}
      </Card>

      <Modal title="Update Skill" open={editModalOpen} onOk={() => { if (editSkill) updateMutation.mutate(editSkill); }}
        onCancel={() => setEditModalOpen(false)} confirmLoading={updateMutation.isPending} destroyOnClose
      >
        {editSkill && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div><Text>Proficiency:</Text>
              <Select value={editSkill.proficiency} onChange={(v) => setEditSkill({ ...editSkill, proficiency: v })} style={{ width: '100%', marginTop: 4 }}
                options={PROFICIENCY_LEVELS.map(p => ({ label: p, value: p }))} />
            </div>
            <div><Text>Years of Experience:</Text>
              <InputNumber min={0} value={editSkill.yearsOfExperience} onChange={(v) => setEditSkill({ ...editSkill, yearsOfExperience: v ?? undefined })} style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div><Text>Certified:</Text>
              <Switch checked={editSkill.certified} onChange={(v) => setEditSkill({ ...editSkill, certified: v })} style={{ marginLeft: 8 }} />
            </div>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
}
