import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Typography, Divider, Popconfirm, Modal, Input, Tag } from 'antd';
import {
  EditOutlined, SwapRightOutlined, RollbackOutlined,
  ToolOutlined, StopOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAsset, useAllocateAsset, useReturnAsset, useMarkMaintenance, useRetireAsset } from '../hooks/useAssets';
import { AssetStatusBadge } from '../components/AssetStatusBadge';
import { AssetHistoryTimeline } from '../components/AssetHistoryTimeline';
import { AssetAllocateModal } from '../components/AssetAllocateModal';
import { AssetReturnModal } from '../components/AssetReturnModal';
import { PageContainer } from '../../../core/components/PageContainer';
import { ErrorState } from '../../../core/components/ErrorState';
import { usePermission } from '../../../core/hooks/usePermission';

const { Text, Title } = Typography;

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-assets');
  const { data, isLoading } = useAsset(id!);

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [retireNotes, setRetireNotes] = useState('');
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [retireModalOpen, setRetireModalOpen] = useState(false);

  const allocateMutation = useAllocateAsset();
  const returnMutation = useReturnAsset();
  const maintenanceMutation = useMarkMaintenance();
  const retireMutation = useRetireAsset();

  const asset = data?.data;

  if (isLoading) {
    return <PageContainer><Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 80 }} /></PageContainer>;
  }

  if (!asset) {
    return <PageContainer><ErrorState message="Asset not found" /></PageContainer>;
  }

  return (
    <PageContainer>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/assets')}>Back to Assets</Button>
      </Space>

      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>{asset.name}</Title>
            <Text code>{asset.assetCode}</Text>
            <AssetStatusBadge status={asset.status} />
          </Space>
        }
        extra={
          canManage && (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/assets/${id}/edit`)}>Edit</Button>
              {asset.status === 'available' && (
                <Button type="primary" icon={<SwapRightOutlined />} onClick={() => setAllocateOpen(true)}>
                  Allocate
                </Button>
              )}
              {asset.status === 'allocated' && (
                <Button icon={<RollbackOutlined />} onClick={() => setReturnOpen(true)}>
                  Return
                </Button>
              )}
              {asset.status !== 'retired' && asset.status !== 'maintenance' && (
                <Button icon={<ToolOutlined />} onClick={() => setMaintenanceModalOpen(true)}>
                  Maintenance
                </Button>
              )}
              {asset.status !== 'retired' && (
                <Popconfirm
                  title="Retire this asset?"
                  description="This action cannot be undone. The asset will be marked as retired."
                  onConfirm={() => setRetireModalOpen(true)}
                  okText="Retire"
                  okType="danger"
                >
                  <Button danger icon={<StopOutlined />}>Retire</Button>
                </Popconfirm>
              )}
            </Space>
          )
        }
      >
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Category"><Tag>{asset.category}</Tag></Descriptions.Item>
          <Descriptions.Item label="Serial Number">{asset.serialNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="Brand">{asset.brand || '-'}</Descriptions.Item>
          <Descriptions.Item label="Model">{asset.assetModel || '-'}</Descriptions.Item>
          <Descriptions.Item label="Condition">{asset.condition}</Descriptions.Item>
          <Descriptions.Item label="Location">{asset.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="Purchase Date">
            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('en-IN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Purchase Price">
            {asset.purchasePrice ? `₹${asset.purchasePrice.toLocaleString('en-IN')}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned To" span={2}>
            {asset.assignedTo
              ? `${asset.assignedTo.fullName} (${asset.assignedTo.employeeCode})`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Notes" span={2}>{asset.notes || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />
        <Title level={5}>History</Title>
        <AssetHistoryTimeline history={asset.history} />
      </Card>

      <AssetAllocateModal
        open={allocateOpen}
        onCancel={() => setAllocateOpen(false)}
        onAllocate={(employeeId, notes) => {
          allocateMutation.mutate(
            { assetId: asset._id, employeeId, notes },
            { onSuccess: () => setAllocateOpen(false) },
          );
        }}
        loading={allocateMutation.isPending}
      />

      <AssetReturnModal
        open={returnOpen}
        onCancel={() => setReturnOpen(false)}
        onReturn={(condition, notes) => {
          returnMutation.mutate(
            { assetId: asset._id, condition, notes },
            { onSuccess: () => setReturnOpen(false) },
          );
        }}
        loading={returnMutation.isPending}
      />

      <Modal
        title="Mark as Maintenance"
        open={maintenanceModalOpen}
        onOk={() => {
          maintenanceMutation.mutate(
            { assetId: asset._id, notes: maintenanceNotes || undefined },
            { onSuccess: () => { setMaintenanceModalOpen(false); setMaintenanceNotes(''); } },
          );
        }}
        onCancel={() => { setMaintenanceModalOpen(false); setMaintenanceNotes(''); }}
        okText="Mark Maintenance"
        confirmLoading={maintenanceMutation.isPending}
      >
        <Input.TextArea
          rows={3}
          value={maintenanceNotes}
          onChange={(e) => setMaintenanceNotes(e.target.value)}
          placeholder="Optional notes about maintenance"
        />
      </Modal>

      <Modal
        title="Retire Asset"
        open={retireModalOpen}
        onOk={() => {
          retireMutation.mutate(
            { assetId: asset._id, notes: retireNotes || undefined },
            { onSuccess: () => { setRetireModalOpen(false); setRetireNotes(''); } },
          );
        }}
        onCancel={() => { setRetireModalOpen(false); setRetireNotes(''); }}
        okText="Confirm Retire"
        okButtonProps={{ danger: true }}
        confirmLoading={retireMutation.isPending}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>Are you sure you want to retire <Text strong>{asset.name}</Text>?</Text>
        </div>
        <Input.TextArea
          rows={3}
          value={retireNotes}
          onChange={(e) => setRetireNotes(e.target.value)}
          placeholder="Optional notes about retirement"
        />
      </Modal>
    </PageContainer>
  );
}
