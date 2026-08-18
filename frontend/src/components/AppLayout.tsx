import { Button, Drawer, Layout, Menu, Space, Typography } from 'antd';
import {
  BookOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  InboxOutlined,
  MenuOutlined,
  SafetyOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { formatUserName } from '../types/auth';
import { SCREEN_CODES } from '../types/permissions';
import { NotificationBell } from './NotificationBell';

const { Header, Sider, Content } = Layout;

const SCREEN_ICONS: Record<string, React.ReactNode> = {
  [SCREEN_CODES.DASHBOARD]: <DashboardOutlined />,
  [SCREEN_CODES.WAREHOUSE]: <InboxOutlined />,
  [SCREEN_CODES.ORDERS]: <ShoppingCartOutlined />,
  [SCREEN_CODES.SUPPLIER_ORDERS]: <TruckOutlined />,
  [SCREEN_CODES.MATERIALS]: <DatabaseOutlined />,
  [SCREEN_CODES.USERS]: <TeamOutlined />,
  [SCREEN_CODES.REFERENCES]: <BookOutlined />,
  [SCREEN_CODES.PERMISSIONS]: <SafetyOutlined />,
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const { permissions } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = useMemo(
    () =>
      permissions
        .filter((item): item is typeof item & { path: string } =>
          Boolean(item.canRead && item.path),
        )
        .map((item) => ({
          key: item.path,
          icon: SCREEN_ICONS[item.screenCode] ?? <DashboardOutlined />,
          label: item.screenName,
        })),
    [permissions],
  );

  const selectedKey =
    menuItems.find((item) => location.pathname === item.key)?.key ??
    menuItems.find((item) => item.key !== '/' && location.pathname.startsWith(item.key))?.key ??
    '/';

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const menu = (
    <Menu
      theme={isMobile ? 'light' : 'dark'}
      mode="inline"
      inlineCollapsed={!isMobile && collapsed}
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleMenuClick}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
          collapsedWidth={72}
          theme="dark"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              paddingInline: collapsed ? 0 : 24,
            }}
          >
            <Typography.Title
              level={4}
              style={{
                color: '#fff',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {collapsed ? 'W' : 'WMS'}
            </Typography.Title>
          </div>

          {menu}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          title="WMS"
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={280}
          styles={{ body: { padding: 0 } }}
        >
          {menu}
        </Drawer>
      )}

      <Layout>
        <Header
          className="app-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            paddingInline: isMobile ? 12 : 24,
            lineHeight: 'normal',
            height: isMobile ? 56 : 64,
          }}
        >
          {isMobile ? (
            <Button
              type="text"
              icon={<MenuOutlined />}
              aria-label="Открыть меню"
              onClick={() => setDrawerOpen(true)}
            />
          ) : (
            <span />
          )}

          <Space size={isMobile ? 8 : 12} wrap={false}>
            <NotificationBell />
            <Typography.Text
              ellipsis
              style={{ maxWidth: isMobile ? 140 : undefined }}
            >
              {user ? formatUserName(user) : ''}
            </Typography.Text>
            <Button size={isMobile ? 'small' : 'middle'} onClick={logout}>
              Выйти
            </Button>
          </Space>
        </Header>

        <Content
          className="app-content"
          style={{
            padding: isMobile ? 12 : 24,
            background: '#f5f5f5',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
