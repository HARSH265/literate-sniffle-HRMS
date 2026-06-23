import { Card, Descriptions, Spin, Button, Form, Input, Space, Tag } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useEssProfile, useUpdateProfile } from '../hooks/useEssProfile';
import dayjs from 'dayjs';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssProfilePage() {
  const { data: profileData, isLoading, refetch } = useEssProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;

  const profile = profileData?.data;
  if (!profile) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--hrms-text-muted)' }}>Failed to load profile</div>;

  const editableFields = profile.editableFields || [];

  const handleEdit = () => {
    form.setFieldsValue({
      contactNumber: profile.contactNumber,
      address: profile.address,
      bankDetails: profile.bankDetails,
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
  };

  const handleSave = async (values: any) => {
    try {
      await updateProfile.mutateAsync(values);
      setEditing(false);
      refetch();
    } catch {
      // error handled in hook
    }
  };

  const canEdit = editableFields.length > 0;

  return (
    <div>
      <Card style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>My Profile</div>
          {canEdit && !editing && (
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={handleEdit}>
              Edit
            </Button>
          )}
        </div>

        <Descriptions bordered column={1} size="small" labelStyle={{ fontSize: 13, whiteSpace: 'nowrap' }} contentStyle={{ fontSize: 13 }}>
          <Descriptions.Item label="Employee Code">{profile.employeeCode}</Descriptions.Item>
          <Descriptions.Item label="Full Name">{profile.fullName}</Descriptions.Item>
          <Descriptions.Item label="Father's Name">{profile.fatherName}</Descriptions.Item>
          <Descriptions.Item label="Department">{profile.department?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Department Head">
            {profile.department?.head ? (
              <Space>
                {profile.department.name} - {profile.department.head?.fullName}
                <Tag color="blue" style={{ marginLeft: 4, fontSize: 11 }}>Head</Tag>
              </Space>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Designation">{profile.designation?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Shift">{profile.shift?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Joining Date">{profile.joiningDate ? dayjs(profile.joiningDate).format('DD MMM YYYY') : '-'}</Descriptions.Item>
        </Descriptions>

        {canEdit && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--hrms-text-muted)' }}>
              <span style={{ fontWeight: 600 }}>Editable Fields</span>
              {editableFields.map((field: string) => (
                <Tag key={field} color="blue" style={{ marginLeft: 6, fontSize: 11 }}>
                  {field}
                </Tag>
              ))}
            </div>

            {editing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                size="small"
              >
                {editableFields.includes('contactNumber') && (
                  <Form.Item name="contactNumber" label={<span style={{ fontSize: 13 }}>Contact Number</span>}>
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                )}
                {editableFields.includes('address') && (
                  <Form.Item name="address" label={<span style={{ fontSize: 13 }}>Address</span>}>
                    <Input.TextArea rows={3} placeholder="Enter address" />
                  </Form.Item>
                )}
                {editableFields.includes('bankDetails') && (
                  <>
                    <Form.Item name={['bankDetails', 'bankName']} label={<span style={{ fontSize: 13 }}>Bank Name</span>}>
                      <Input placeholder="Enter bank name" />
                    </Form.Item>
                    <Form.Item name={['bankDetails', 'accountNumber']} label={<span style={{ fontSize: 13 }}>Account Number</span>}>
                      <Input placeholder="Enter account number" />
                    </Form.Item>
                    <Form.Item name={['bankDetails', 'ifscCode']} label={<span style={{ fontSize: 13 }}>IFSC Code</span>}>
                      <Input placeholder="Enter IFSC code" />
                    </Form.Item>
                  </>
                )}
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button size="small" icon={<CloseOutlined />} onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="primary" size="small" icon={<SaveOutlined />} htmlType="submit" loading={updateProfile.isPending}>
                    Save
                  </Button>
                </Space>
              </Form>
            ) : (
              <Descriptions bordered column={1} size="small" labelStyle={{ fontSize: 13, whiteSpace: 'nowrap' }} contentStyle={{ fontSize: 13 }}>
                {editableFields.includes('contactNumber') && (
                  <Descriptions.Item label="Contact Number">{profile.contactNumber || '-'}</Descriptions.Item>
                )}
                {editableFields.includes('address') && (
                  <Descriptions.Item label="Address">{profile.address || '-'}</Descriptions.Item>
                )}
                {editableFields.includes('bankDetails') && (
                  <>
                    <Descriptions.Item label="Bank Name">{profile.bankDetails?.bankName || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Account Number">{profile.bankDetails?.accountNumber || '-'}</Descriptions.Item>
                    <Descriptions.Item label="IFSC Code">{profile.bankDetails?.ifscCode || '-'}</Descriptions.Item>
                  </>
                )}
              </Descriptions>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}