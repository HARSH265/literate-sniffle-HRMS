import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  DollarOutlined,
  SwapOutlined,
  LaptopOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { Drawer, List } from 'antd';

const tabs = [
  { key: '/ess', icon: <HomeOutlined />, label: 'Home' },
  { key: '/ess/attendance', icon: <ClockCircleOutlined />, label: 'Attendance' },
  { key: '/ess/leave', icon: <CalendarOutlined />, label: 'Leave' },
  { key: '/ess/profile', icon: <UserOutlined />, label: 'Profile' },
  { key: 'more', icon: <EllipsisOutlined />, label: 'More' },
];

const moreItems = [
  { key: '/ess/documents', icon: <FileTextOutlined />, label: 'Documents' },
  { key: '/ess/payslips', icon: <DollarOutlined />, label: 'Payslips' },
  { key: '/ess/shift-swaps', icon: <SwapOutlined />, label: 'Shift Swap' },
  { key: '/ess/shift-swaps/preferences', icon: <SwapOutlined />, label: 'Shift Preference' },
  { key: '/ess/assets', icon: <LaptopOutlined />, label: 'Assets' },
  { key: '/ess/training', icon: <BookOutlined />, label: 'Training' },
];

export function EssBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeKey = tabs
    .filter((t) => t.key !== 'more')
    .find((t) => location.pathname === t.key)?.key;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: 56,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          const isMore = tab.key === 'more';

          return (
            <div
              key={tab.key}
              onClick={() => {
                if (isMore) {
                  setDrawerOpen(true);
                } else {
                  navigate(tab.key);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                flex: 1,
                height: '100%',
                cursor: 'pointer',
                color: isActive ? '#1a1a2e' : '#999',
                fontSize: 10,
                transition: 'color 0.2s',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>
                {tab.icon}
              </span>
              <span style={{ fontWeight: isActive ? 600 : 400 }}>
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      <Drawer
        title="More"
        placement="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        height="auto"
        style={{ borderRadius: '16px 16px 0 0' }}
      >
        <List
          dataSource={moreItems}
          renderItem={(item) => (
            <List.Item
              onClick={() => {
                navigate(item.key);
                setDrawerOpen(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<span style={{ fontSize: 20 }}>{item.icon}</span>}
                title={item.label}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </>
  );
}
