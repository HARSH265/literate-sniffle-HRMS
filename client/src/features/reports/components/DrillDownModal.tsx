import { Modal } from 'antd';
import { DataTable } from '../../../core/components/DataTable';
import type { DrillDownModalProps } from '../types/reportTypes';

export function DrillDownModal({ visible, onClose, data, loading }: DrillDownModalProps) {
  return (
    <Modal
      title={`Drill Down: ${data?.entity || ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {data?.records?.length > 0 ? (
        <DataTable
          dataSource={data.records}
          loading={loading}
          columns={data.records[0] ? Object.keys(data.records[0]).filter(k => k !== '_id' && k !== '__v').map(k => ({
            title: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
            dataIndex: k,
            key: k,
            render: (v: any) => {
              if (v && typeof v === 'object' && v.fullName) return v.fullName;
              if (v && typeof v === 'object' && v.name) return v.name;
              return v != null ? String(v) : '-';
            },
          })) : []}
          rowKey={(_, idx) => String(idx)}
          noCard
          total={data.records.length}
          disableRowClick
        />
      ) : (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--hrms-text-muted)' }}>No records found</div>
      )}
    </Modal>
  );
}
