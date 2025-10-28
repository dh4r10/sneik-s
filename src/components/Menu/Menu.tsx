import React, { useState } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { AppMenuProps, MenuItem, MenuKey } from './menu.types.ts';

const AppMenu: React.FC<AppMenuProps> = ({ onMenuSelect }) => {
  const [current, setCurrent] = useState<MenuKey>('home');

  const items: MenuItem[] = [
    {
      label: 'Inicio',
      key: 'home',
      icon: <HomeOutlined />,
    },
    {
      label: 'Dashboard',
      key: 'dashboard',
      icon: <AppstoreOutlined />,
    },
    {
      label: 'Proyectos',
      key: 'projects',
      icon: <FolderOutlined />,
      children: [
        {
          label: 'Todos los Proyectos',
          key: 'projects:all',
        },
        {
          label: 'Mis Proyectos',
          key: 'projects:mine',
        },
        {
          label: 'Compartidos',
          key: 'projects:shared',
        },
      ],
    },
    {
      label: 'Documentos',
      key: 'documents',
      icon: <FileTextOutlined />,
    },
    {
      label: 'Reportes',
      key: 'reports',
      icon: <BarChartOutlined />,
      children: [
        {
          label: 'Ventas',
          key: 'reports:sales',
        },
        {
          label: 'Análisis',
          key: 'reports:analytics',
        },
        {
          label: 'Exportar',
          key: 'reports:export',
        },
      ],
    },
    {
      label: 'Equipo',
      key: 'team',
      icon: <TeamOutlined />,
    },
    {
      type: 'divider',
    },
    {
      label: 'Perfil',
      key: 'profile',
      icon: <UserOutlined />,
    },
    {
      label: 'Configuración',
      key: 'settings',
      icon: <SettingOutlined />,
    },
  ];

  const onClick: MenuProps['onClick'] = (e) => {
    setCurrent(e.key as MenuKey);
    if (onMenuSelect) {
      onMenuSelect(e.key as MenuKey);
    }
  };

  return (
    <Menu
      onClick={onClick}
      selectedKeys={[current]}
      mode='inline'
      items={items}
      style={{ height: '100%', borderRight: 0 }}
      theme='dark'
    />
  );
};

export default AppMenu;
