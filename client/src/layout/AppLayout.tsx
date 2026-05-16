import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../core/stores/uiStore';

const { Content } = Layout;

export function AppLayout() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        <Header />
        <Content style={{
          margin: '24px 28px 0',
          padding: 0,
          background: 'var(--hrms-bg)',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}>
          <div style={{ padding: '0 0 32px' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}