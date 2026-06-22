import { Table, Button, Space, Modal, Input } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { usePendingApprovals, useApproveSwap, useRejectSwap } from '../hooks/useShiftSwaps';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { useState } from 'react';
import dayjs from 'dayjs';

export function ShiftSwapApprovalsPage() {
  const { data, isLoading } = usePendingApprovals();
  const approveSwap = useApproveSwap();
  const rejectSwap = useRejectSwap();
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [rejectReason, setRejectReason] = useState('');

  const columns = [
    { title: 'Requestor', dataIndex: ['requestor', 'fullName'], key: 'requestor', render: (_text: string, record: any) => record.requestor?.fullName || 'N/A' },
    { title: 'From Shift', dataIndex: ['fromShift', 'name'], key: 'fromShift', render: (_text: string, record: any) => record.fromShift?.name || 'N/A' },
    { title: 'To Shift', dataIndex: ['toShift', 'name'], key: 'toShift', render: (_text: string, record: any) => record.toShift?.name || 'N/A' },
    { title: 'From Date', dataIndex: 'fromDate', key: 'fromDate', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'To Date', dataIndex: 'toDate', key: 'toDate', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => approveSwap.mutate(record._id)} loading={approveSwap.isPending}>Approve</Button>
          <Button danger size="small" icon={<CloseOutlined />} onClick={() => setRejectModal({ open: true, id: record._id })}>Reject</Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Swap Approvals" subtitle="Approve or reject shift swap requests" />
      <Table dataSource={data?.data || []} columns={columns} rowKey="_id" loading={isLoading} />

      <Modal title="Reject Swap" open={rejectModal.open} onCancel={() => setRejectModal({ open: false, id: '' })} onOk={() => {
        rejectSwap.mutate({ id: rejectModal.id, reason: rejectReason }, {
          onSuccess: () => { setRejectModal({ open: false, id: '' }); setRejectReason(''); },
        });
      }} okText="Reject" okButtonProps={{ danger: true }} confirmLoading={rejectSwap.isPending}>
        <Input.TextArea rows={3} placeholder="Reason for rejection (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} maxLength={500} />
      </Modal>
    </PageContainer>
  );
}
