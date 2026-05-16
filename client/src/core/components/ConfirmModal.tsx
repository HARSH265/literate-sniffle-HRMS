import { Modal } from 'antd';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{ danger }}
    >
      <p>{message}</p>
    </Modal>
  );
}