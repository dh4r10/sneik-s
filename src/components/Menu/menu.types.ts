import { MenuProps } from 'antd';

export type MenuItem = Required<MenuProps>['items'][number];

export type MenuKey =
  | 'home'
  | 'dashboard'
  | 'projects'
  | 'projects:all'
  | 'projects:mine'
  | 'projects:shared'
  | 'documents'
  | 'reports'
  | 'reports:sales'
  | 'reports:analytics'
  | 'reports:export'
  | 'team'
  | 'profile'
  | 'settings';

export interface AppMenuProps {
  onMenuSelect?: (key: MenuKey) => void;
}
