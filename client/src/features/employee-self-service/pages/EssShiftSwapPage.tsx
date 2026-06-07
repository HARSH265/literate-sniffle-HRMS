import { useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Modal, Form,
  Input, DatePicker, Spin, Empty, Alert,
} from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useMySwaps, useSwapEligibility, useEssRequestSwap, useEssCancelSwap } from '../hooks/useEssShiftSwaps';
import dayjs from 'dayjs';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssShiftSwapPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { data: swapsData, isLoading: swapsLoading } = useMySwaps();
  const { data: eligibilityData, isLoading: eligLoading } = useSwapEligibility();
  const requestSwap = useEssRequestSwap();
  const cancelSwap = useEssCancelSwap();

  const swaps = swapsData?.data || [];
  const eligibility = eligibilityData?.data;

  const columns = [
    {
      title: 'From Shift', dataIndex: ['fromShift', 'name'], key: 'fromShift',
      render: (name: string) => <Tag color="blue" style={{ fontSize: 11 }}>{name || 'N/A'}</Tag>,
    },
    {
      title: 'To Shift', dataIndex: ['toShift', 'name'], key: 'toShift',
      render: (name: string) => <Tag color="green" style={{ fontSize: 11 }}>{name || 'N/A'}</Tag>,
    },
    { title: 'From', dataIndex: 'fromDate', key: 'fromDate', render: (d: string) => dayjs(d).format('DD/MM'), width: 80 },
    { title: 'To', dataIndex: 'toDate', key: 'toDate', render: (d: string) => dayjs(d).format('DD/MM'), width: 80 },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => {
        const colors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };
        return <Tag color={colors[status] || 'default'} style={{ fontSize: 11 }}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: '', key: 'action', width: 60,
      render: (_: any, record: any) =>
        record.status === 'pending' ? (
          <Button size="small" danger onClick={() => cancelSwap.mutate(record._id)} loading={cancelSwap.isPending}>
            Cancel
          </Button>
        ) : null,
    },
  ];

  if (swapsLoading || eligLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <div>
      {eligibility && !eligibility.shiftSwapEnabled && (
        <Alert message="Shift swaps are currently disabled" type="warning" showIcon style={{ marginBottom: 12, borderRadius: 12 }} />
      )}

      <Row gutter={[12, 12]}>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Remaining Swaps</span>}
              value={eligibility?.remainingSwaps ?? '-'}
              suffix={eligibility ? `/ ${eligibility.maxSwaps}` : ''}
              valueStyle={{ fontSize: 20, fontWeight: 600, color: (eligibility?.remainingSwaps ?? 0) > 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Used This Month</span>}
              value={eligibility?.usedSwaps ?? '-'}
              valueStyle={{ fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ fontSize: 15 }}>My Swap Requests</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={{ ...cardStyle, marginTop: 12 }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => setModalOpen(true)}
            disabled={!eligibility?.shiftSwapEnabled || (eligibility?.remainingSwaps ?? 0) <= 0}
          >
            Request Swap
          </Button>
        }
      >
        {swaps.length === 0 ? (
          <Empty description="No swap requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table
              dataSource={swaps}
              columns={columns}
              rowKey={(r: any) => r._id || r.id}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              bordered
            />
          </div>
        )}
      </Card>

      <Modal
        title="Request Shift Swap"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={form.submit}
        okText="Submit"
        confirmLoading={requestSwap.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => {
          requestSwap.mutate({
            fromShift: values.fromShift,
            toShift: values.toShift,
            fromDate: values.fromDate.toISOString(),
            toDate: values.toDate.toISOString(),
            reason: values.reason,
            swapType: 'one-time',
          }, {
            onSuccess: () => { setModalOpen(false); form.resetFields(); },
          });
        }}>
          <Form.Item name="fromShift" label="Current Shift ID" rules={[{ required: true }]}>
            <Input placeholder="Enter your current shift ID" />
          </Form.Item>
          <Form.Item name="toShift" label="Desired Shift ID" rules={[{ required: true }]}>
            <Input placeholder="Enter the desired shift ID" />
          </Form.Item>
          <Form.Item name="fromDate" label="From Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          <Form.Item name="toDate" label="To Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={2} maxLength={500} placeholder="Why do you need this swap?" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
