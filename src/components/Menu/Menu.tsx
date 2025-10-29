import React, { useState } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faWaveSquare } from '@fortawesome/free-solid-svg-icons';

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
      label: 'Dispositivos',
      key: 'devices',
      icon: <FontAwesomeIcon icon={faLaptop} style={{ fontSize: '11px' }} />,
    },
    {
      label: 'Señales',
      key: 'signals',
      icon: <FontAwesomeIcon icon={faWaveSquare} />,
      children: [
        {
          label: 'Test',
          key: 'signals:test',
        },
        {
          label: 'Mis Señales',
          key: 'signals:mine',
        },
        {
          label: 'Compartidos',
          key: 'signals:shared',
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
