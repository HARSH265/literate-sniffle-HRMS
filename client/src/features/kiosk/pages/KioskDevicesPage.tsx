import { useState, useRef, useCallback } from 'react';
import { Button, Input, InputNumber, message, Modal, Form, Tooltip, Switch, Tag, Typography, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, QrcodeOutlined, NotificationOutlined, CopyOutlined, LinkOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { kioskService, KioskDevice, CreateKioskDevice, UpdateKioskDevice } from '../services/kioskService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode-generator';

const { Text } = Typography;

function drawQR(canvas: HTMLCanvasElement, qrData: string) {
  const qr = QRCode(0, 'M');
  qr.addData(qrData);
  qr.make();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cellSize = 6;
  const margin = 4;
  const size = qr.getModuleCount();
  const canvasSize = (size + margin * 2) * cellSize;
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = '#1a1a2e';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect((col + margin) * cellSize, (row + margin) * cellSize, cellSize, cellSize);
      }
    }
  }
}

export function KioskDevicesPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDevice, setQrDevice] = useState<KioskDevice | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdDevice, setCreatedDevice] = useState<KioskDevice | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const successCanvasRef = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['kiosk-devices', page, limit, search],
    queryFn: () => kioskService.list({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateKioskDevice) => kioskService.create(payload),
    onSuccess: (res) => {
      setIsModalOpen(false);
      form.resetFields();
      const device = res?.data;
      if (device) {
        setCreatedDevice(device);
        setSuccessModalOpen(true);
      }
      queryClient.invalidateQueries({ queryKey: ['kiosk-devices'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to register kiosk'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateKioskDevice }) =>
      kioskService.update(id, payload),
    onSuccess: () => {
      message.success('Kiosk updated successfully');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['kiosk-devices'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update kiosk'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      kioskService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kiosk-devices'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to toggle status'),
  });

  const broadcastMutation = useMutation({
    mutationFn: (id: string) => kioskService.broadcast(id),
    onSuccess: () => {
      message.success('QR broadcast started');
      queryClient.invalidateQueries({ queryKey: ['kiosk-devices'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to broadcast'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => kioskService.delete(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: () => {
      message.success('Kiosk device deleted');
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['kiosk-devices'] });
    },
    onError: (err: any) => {
      setDeletingId(null);
      message.error(err?.response?.data?.message || 'Failed to delete kiosk');
    },
  });

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingId) updateMutation.mutate({ id: editingId, payload: values });
      else createMutation.mutate(values as CreateKioskDevice);
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openQRModal = (record: KioskDevice) => {
    setQrDevice(record);
    setQrModalOpen(true);
  };

  const drawQrCanvas = useCallback(() => {
    if (canvasRef.current && qrDevice) {
      drawQR(canvasRef.current, getKioskUrl(qrDevice.deviceCode));
    }
  }, [qrDevice]);

  const getKioskUrl = (code: string) => `${window.location.origin}/kiosk?kioskId=${code}`;

  const copyKioskUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => message.success('Kiosk URL copied'));
  };

  const drawSuccessQR = useCallback(() => {
    if (successCanvasRef.current && createdDevice) {
      const url = getKioskUrl(createdDevice.deviceCode);
      const qr = QRCode(0, 'M');
      qr.addData(url);
      qr.make();
      const ctx = successCanvasRef.current.getContext('2d');
      if (!ctx) return;
      const cellSize = 6;
      const margin = 4;
      const size = qr.getModuleCount();
      const canvasSize = (size + margin * 2) * cellSize;
      successCanvasRef.current.width = canvasSize;
      successCanvasRef.current.height = canvasSize;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = '#1a1a2e';
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect((col + margin) * cellSize, (row + margin) * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }, [createdDevice]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const columns: ColumnsType<KioskDevice> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: 'Device Code',
      dataIndex: 'deviceCode',
      key: 'deviceCode',
      width: 140,
      render: (code: string) => <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{code}</Tag>,
    },
    {
      title: 'Location',
      key: 'location',
      width: 220,
      render: (_: unknown, r: KioskDevice) => (
        <span style={{ color: 'var(--hrms-text-secondary)', fontSize: 13 }}>
          {r.address || (r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : '—')}
        </span>
      ),
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      width: 180,
      render: (date?: string) => (
        <span style={{ color: date ? 'var(--hrms-text-secondary)' : 'var(--hrms-text-muted)', fontSize: 13 }}>
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_: unknown, r: KioskDevice) => {
        const isOnline = r.lastSeenAt && Date.now() - new Date(r.lastSeenAt).getTime() < 120_000;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch
              checked={r.isActive}
              size="small"
              onChange={(checked) => toggleMutation.mutate({ id: r.id, isActive: checked })}
            />
            {r.isActive && (
              <Tag
                color={isOnline ? 'green' : 'default'}
                style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: KioskDevice) => (
        <div className="action-group">
          <Tooltip title="View QR">
            <Button type="text" size="small" icon={<QrcodeOutlined />} onClick={() => openQRModal(record)}
              style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Broadcast QR">
            <Button type="text" size="small" icon={<NotificationOutlined />} onClick={() => broadcastMutation.mutate(record.id)}
              loading={broadcastMutation.isPending}
              style={{ color: '#6366f1', borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this kiosk device?"
              description="Attendance records will not be affected."
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" icon={<DeleteOutlined />}
                loading={deletingId === record.id}
                style={{ color: '#ef4444', borderRadius: 6 }} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Kiosk Devices"
        subtitle="Manage attendance kiosk devices"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Register Kiosk
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        total={data?.meta?.total ?? 0}
        page={page}
        pageSize={limit}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
        toolbarLeft={
          <Input.Search
            placeholder="Search kiosk devices..."
            onSearch={(val) => { setSearch(val); setPage(1); }}
            style={{ width: 280 }}
            allowClear
            prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />}
            enterButton={false}
            loading={isFetching}
          />
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
            {data?.meta?.total ?? 0} devices
          </span>
        }
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hrms-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrcodeOutlined style={{ fontSize: 16, color: 'var(--hrms-primary)' }} />
            </div>
            {editingId ? 'Edit Kiosk' : 'Register Kiosk'}
          </div>
        }
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingId ? 'Update' : 'Register'}
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <div style={{ padding: '8px 0 0' }}>
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="Kiosk Name" rules={[{ required: true, message: 'Name is required' }]}>
              <Input placeholder="e.g. Main Gate Kiosk" style={{ height: 40 }} />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input placeholder="e.g. Gate 1, Main Entrance" style={{ height: 40 }} />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="latitude" label="Latitude">
                <InputNumber placeholder="e.g. 28.6139" style={{ width: '100%', height: 40 }} />
              </Form.Item>
              <Form.Item name="longitude" label="Longitude">
                <InputNumber placeholder="e.g. 77.2090" style={{ width: '100%', height: 40 }} />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrcodeOutlined style={{ fontSize: 18, color: 'var(--hrms-primary)' }} />
            {qrDevice?.name || 'Kiosk'} QR Code
          </div>
        }
        open={qrModalOpen}
        onCancel={() => { setQrModalOpen(false); setQrDevice(null); }}
        afterOpenChange={(open) => { if (open) setTimeout(drawQrCanvas, 100); }}
        footer={[
          <Button key="close" style={{ borderRadius: 8 }} onClick={() => { setQrModalOpen(false); setQrDevice(null); }}>
            Close
          </Button>,
        ]}
      >
        {qrDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
            <Text strong style={{ fontSize: 16, marginBottom: 4 }}>{qrDevice.name}</Text>
            <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 16 }}>
              {qrDevice.deviceCode}
            </Tag>

            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8, marginBottom: 16 }} />

            <div style={{
              background: '#f5f5f5', borderRadius: 8, padding: '10px 14px',
              width: '100%', wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace',
              marginBottom: 12,
            }}>
              {getKioskUrl(qrDevice.deviceCode)}
            </div>

            <Button
              icon={<CopyOutlined />}
              style={{ borderRadius: 8 }}
              onClick={() => copyKioskUrl(getKioskUrl(qrDevice.deviceCode))}
            >
              Copy Kiosk URL
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LinkOutlined style={{ fontSize: 18, color: '#52c41a' }} />
            Kiosk Connected
          </div>
        }
        open={successModalOpen}
        onCancel={() => { setSuccessModalOpen(false); setCreatedDevice(null); }}
        footer={[
          <Button key="done" type="primary" style={{ borderRadius: 8 }} onClick={() => { setSuccessModalOpen(false); setCreatedDevice(null); }}>
            Done
          </Button>,
        ]}
        afterOpenChange={(open) => { if (open) setTimeout(drawSuccessQR, 100); }}
      >
        {createdDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
            <Text strong style={{ fontSize: 16, marginBottom: 4 }}>{createdDevice.name}</Text>
            <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 16 }}>
              {createdDevice.deviceCode}
            </Tag>

            <canvas ref={successCanvasRef} style={{ display: 'block', borderRadius: 8, marginBottom: 16 }} />

            <div style={{
              background: '#f5f5f5', borderRadius: 8, padding: '10px 14px',
              width: '100%', wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace',
              marginBottom: 12,
            }}>
              {getKioskUrl(createdDevice.deviceCode)}
            </div>

            <Button
              icon={<CopyOutlined />}
              style={{ borderRadius: 8 }}
              onClick={() => copyKioskUrl(getKioskUrl(createdDevice.deviceCode))}
            >
              Copy Kiosk URL
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
