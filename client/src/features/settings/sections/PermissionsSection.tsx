import { useState, useEffect } from 'react';
import {
  Card, Tabs, Checkbox, Button, Space, Typography, Tag, Row, Col,
  Divider, message, Popconfirm, Spin, Alert,
} from 'antd';
import {
  SaveOutlined, ReloadOutlined, SafetyCertificateOutlined,
  UserOutlined, TeamOutlined, BankOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsService } from '../services/permissionsService';
import { useAuthStore } from '../../../core/stores/authStore';

const { Text } = Typography;

const ROLE_META: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  'super-admin': { label: 'Super Admin', color: 'var(--hrms-danger)', icon: <SafetyCertificateOutlined />, description: 'Full system access — bypasses all checks' },
  'hr-admin': { label: 'HR Admin', color: 'var(--hrms-info)', icon: <UserOutlined />, description: 'Manages all HR operations, employees, attendance, payroll' },
  'hr-staff': { label: 'HR Staff', color: 'var(--hrms-success)', icon: <TeamOutlined />, description: 'Daily operations — attendance, leave, view reports' },
  'accounts': { label: 'Accounts', color: 'var(--hrms-warning)', icon: <BankOutlined />, description: 'Payroll processing, loans, statutory compliance' },
  'manager': { label: 'Manager', color: 'var(--hrms-primary)', icon: <UserOutlined />, description: 'Team management — approve leaves, performance' },
  'worker': { label: 'Worker', color: 'var(--hrms-info)', icon: <UserOutlined />, description: 'Mobile-first ESS — check-in/out, leave, own data only' },
};

interface PermissionsSectionProps {
  form: any;
  onSave: (values: any) => void;
}

export function PermissionsSection(_props: PermissionsSectionProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const setPermissions = useAuthStore((state) => state.setPermissions);
  const [activeRole, setActiveRole] = useState('hr-admin');
  const [editedPermissions, setEditedPermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['permission-groups'],
    queryFn: () => permissionsService.getGroups(),
  });

  const { data: rolePermissions, isLoading: rolesLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => permissionsService.getRolePermissions(),
  });

  // Initialize edited permissions when data loads
  useEffect(() => {
    if (rolePermissions) {
      const initial: Record<string, string[]> = {};
      for (const [role, config] of Object.entries(rolePermissions)) {
        initial[role] = [...config.permissions];
      }
      setEditedPermissions(initial);
      setHasChanges(false);
    }
  }, [rolePermissions]);

  const updateMutation = useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
      permissionsService.updateRolePermissions(role, permissions),
    onSuccess: (_data, variables) => {
      message.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      setHasChanges(false);

      // If admin modified their own role, refresh stored permissions
      if (currentUser?.role === variables.role) {
        setPermissions(variables.permissions);
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update permissions');
    },
  });

  const resetMutation = useMutation({
    mutationFn: (role: string) => permissionsService.resetRolePermissions(role),
    onSuccess: (_data, role) => {
      message.success('Permissions reset to defaults');
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });

      // If admin reset their own role, refetch permissions from API
      if (currentUser?.role === role) {
        permissionsService.getRolePermissions().then((allPerms) => {
          const roleData = allPerms[role];
          if (roleData?.permissions) {
            setPermissions(roleData.permissions);
          }
        }).catch(() => {});
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to reset permissions');
    },
  });

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    setEditedPermissions((prev) => {
      const current = prev[activeRole] || [];
      const updated = checked
        ? [...current, permission]
        : current.filter((p) => p !== permission);
      return { ...prev, [activeRole]: updated };
    });
    setHasChanges(true);
  };

  const handleGroupToggle = (_groupName: string, permissions: readonly string[], checked: boolean) => {
    setEditedPermissions((prev) => {
      const current = new Set(prev[activeRole] || []);
      for (const perm of permissions) {
        if (checked) {
          current.add(perm);
        } else {
          current.delete(perm);
        }
      }
      return { ...prev, [activeRole]: Array.from(current) };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const permissions = editedPermissions[activeRole] || [];
    updateMutation.mutate({ role: activeRole, permissions });
  };

  const handleReset = () => {
    resetMutation.mutate(activeRole);
    setHasChanges(false);
  };

  if (groupsLoading || rolesLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: 'var(--hrms-text-secondary)' }}>Loading permissions...</div>
      </div>
    );
  }

  const groupsDataFinal = groupsData || {};
  const rolePerms = rolePermissions || {};
  const currentPermissions = new Set(editedPermissions[activeRole] || []);
  const isSuperAdmin = activeRole === 'super-admin';
  const isCustom = rolePerms[activeRole]?.isCustom || false;

  return (
    <div>
      <h3 style={{ marginBottom: 8 }}>Role Permissions</h3>
      <p style={{ marginBottom: 24, color: 'var(--hrms-text-secondary)' }}>
        Customize what each role can access. Changes take effect immediately for all users with that role.
      </p>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message="Super Admin bypasses all permission checks"
        description="The Super Admin role always has full access regardless of these settings. It cannot be modified."
      />

      <Tabs
        activeKey={activeRole}
        onChange={setActiveRole}
        items={Object.entries(ROLE_META).map(([role, meta]) => ({
          key: role,
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: meta.color }}>{meta.icon}</span>
              {meta.label}
              {rolePerms[role]?.isCustom && (
                <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>Custom</Tag>
              )}
            </span>
          ),
        }))}
      />

      <Card
        size="small"
        style={{ marginBottom: 16, background: 'var(--hrms-bg)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ fontSize: 15 }}>{ROLE_META[activeRole]?.label}</Text>
            <Text type="secondary" style={{ marginLeft: 12, fontSize: 13 }}>
              {ROLE_META[activeRole]?.description}
            </Text>
          </div>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {currentPermissions.size} permissions selected
            </Text>
          </Space>
        </div>
      </Card>

      {isSuperAdmin ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: 'var(--hrms-danger)', marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Super Admin — Full Access</div>
            <Text type="secondary">
              Super Admin bypasses all permission checks. This role always has access to everything.
            </Text>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflow: 'auto', paddingRight: 8 }}>
            {Object.entries(groupsDataFinal).map(([groupName, permissions]) => {
              const permArray = Array.isArray(permissions) ? permissions : [];
              if (permArray.length === 0) return null;
              const allChecked = permArray.every((p) => currentPermissions.has(p));
              const someChecked = permArray.some((p) => currentPermissions.has(p));

              return (
                <Card
                  key={groupName}
                  size="small"
                  style={{ marginBottom: 8 }}
                  styles={{ body: { padding: '12px 16px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Checkbox
                      indeterminate={someChecked && !allChecked}
                      checked={allChecked}
                      onChange={(e) => handleGroupToggle(groupName, permArray, e.target.checked)}
                    >
                      <Text strong style={{ fontSize: 13 }}>{groupName}</Text>
                    </Checkbox>
                    <Tag style={{ fontSize: 11 }}>
                      {permArray.filter((p) => currentPermissions.has(p)).length}/{permArray.length}
                    </Tag>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <Row gutter={[16, 8]}>
                    {permArray.map((perm) => (
                      <Col key={perm} xs={24} sm={12} md={8} lg={6}>
                        <Checkbox
                          checked={currentPermissions.has(perm)}
                          onChange={(e) => handlePermissionToggle(perm, e.target.checked)}
                        >
                          <Text style={{ fontSize: 12 }} code>{perm}</Text>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Card>
              );
            })}
          </div>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Popconfirm
              title="Reset to default permissions?"
              description="This will discard all custom changes for this role."
              onConfirm={handleReset}
              okText="Reset"
              cancelText="Cancel"
            >
              <Button icon={<ReloadOutlined />} danger>
                Reset to Defaults
              </Button>
            </Popconfirm>

            <Space size={4}>
              {isCustom && (
                <Tag color="orange">Modified from defaults</Tag>
              )}
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={!hasChanges}
                loading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
}
