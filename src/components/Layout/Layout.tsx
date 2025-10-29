import React, { useState } from 'react';
import { Layout, Button, Typography } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Menu from '../Menu';
import { MenuKey } from './layout.types.ts';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mapeo de rutas a keys del menú
  const routeToKeyMap: Record<string, MenuKey> = {
    '/': 'home',
    '/devices': 'devices',
    '/signals': 'signals',
    '/signals/test': 'signals:test',
    '/signals/mine': 'signals:mine',
    '/signals/shared': 'signals:shared',
    '/documents': 'documents',
    '/reports': 'reports',
    '/reports/sales': 'reports:sales',
    '/reports/analytics': 'reports:analytics',
    '/reports/export': 'reports:export',
    '/team': 'team',
    '/profile': 'profile',
    '/settings': 'settings',
  };

  // Mapeo de keys del menú a rutas
  const keyToRouteMap: Record<MenuKey, string> = {
    home: '/',
    devices: '/devices',
    signals: '/signals',
    'signals:test': '/signals/test',
    'signals:mine': '/signals/mine',
    'signals:shared': '/signals/shared',
    documents: '/documents',
    reports: '/reports',
    'reports:sales': '/reports/sales',
    'reports:analytics': '/reports/analytics',
    'reports:export': '/reports/export',
    team: '/team',
    profile: '/profile',
    settings: '/settings',
  };

  const handleMenuSelect = (key: MenuKey): void => {
    const route = keyToRouteMap[key];
    if (route) {
      navigate(route);
    }
  };

  const getSectionTitle = (): string => {
    const currentKey = routeToKeyMap[location.pathname] || 'home';
    const titles: Record<MenuKey, string> = {
      home: 'Inicio',
      devices: 'Dispositivos',
      signals: 'Señales',
      'signals:test': 'Test',
      'signals:mine': 'Mis Señales',
      'signals:shared': 'Señales Compartidos',
      documents: 'Documentos',
      reports: 'Reportes',
      'reports:sales': 'Reportes de Ventas',
      'reports:analytics': 'Análisis',
      'reports:export': 'Exportar Reportes',
      team: 'Equipo',
      profile: 'Perfil',
      settings: 'Configuración',
    };
    return titles[currentKey] || 'Aplicación';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? (
            <img
              src='/img/logo-sin-fondo-2.png'
              className='w-6 rotate-90 mt-1'
            />
          ) : (
            <div className='flex justify-center items-center gap-4'>
              <p className='text-2xl'>SneikS</p>
              <img
                src='/img/logo-sin-fondo-2.png'
                className='w-6 rotate-90 mt-1'
              />
            </div>
          )}
        </div>
        <Menu onMenuSelect={handleMenuSelect} />
      </Sider>

      <Layout
        style={{ marginLeft: collapsed ? 80 : 200, transition: 'test 0.2s' }}
      >
        <Header
          style={{
            padding: 0,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type='text'
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <Title level={4} style={{ margin: '0 16px' }}>
              {getSectionTitle()}
            </Title>
          </div>
        </Header>

        <Content
          style={{
            // margin: '24px',
            padding: 24,
            background: '#fff',
            // borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
