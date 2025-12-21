import UserType, { RoleValueEnum } from '@interfaces/UserType';
import { REQUIRE_USER_AUTHENTICATION, REQUIRE_USER_PERMISSIONS } from '@utils/session';
import {
  BlocksSeparated,
  Locked,
  Settings,
  SettingsWithKnobs,
  Sun,
  VisibleEye,
  WorkspacesIcon,
  WorkspacesUsersIcon,
} from '@oracle/icons';

export const SECTION_ITEM_UUID_GIT_SETTINGS = 'Git settings';
export const SECTION_ITEM_UUID_PREFERENCES = 'Preferences';
export const SECTION_ITEM_UUID_PLATFORM_PREFERENCES = 'Preferences';
export const SECTION_ITEM_UUID_PLATFORM_SETTINGS = 'Settings';
export const SECTION_ITEM_UUID_USERS = 'Users';
export const SECTION_UUID_WORKSPACE = 'Workspace';

export enum SectionEnum {
  PROJECT_PLATFORM = 'Platform',
  WORKSPACE = 'Workspace',
  USER_MANAGEMENT = 'User management',
}

export enum SectionItemEnum {
  PERMISSIONS = 'Permissions',
  PREFERENCES = 'Preferences',
  ROLES = 'Roles',
  SETTINGS = 'Settings',
  USERS = 'Users',
}

export const SECTION_UUID_ACCOUNT = 'Account';
export const SECTION_ITEM_UUID_PROFILE = 'Profile';

export const SECTIONS = ({ owner, roles, project_access }: UserType, opts?: {
  projectPlatformActivated?: boolean;
  t?: any;
}) => {
  const {
    projectPlatformActivated,
    t,
  } = opts || {
    projectPlatformActivated: false,
  };
  const hasAdminPrivileges = owner || roles === RoleValueEnum.ADMIN || (project_access & 3) !== 0;

  const workspaceItems = [
    {
      Icon: WorkspacesIcon,
      label: () => t?.('settings_dashboard.preferences') || SECTION_ITEM_UUID_PREFERENCES,
      linkProps: {
        href: '/settings/workspace/preferences',
      },
      uuid: SECTION_ITEM_UUID_PREFERENCES,
    },
    {
      Icon: Settings,
      label: () => t?.('settings_dashboard.git_settings') || SECTION_ITEM_UUID_GIT_SETTINGS,
      linkProps: {
        href: '/settings/workspace/sync-data',
      },
      uuid: SECTION_ITEM_UUID_GIT_SETTINGS,
    },
  ];

  const arr = [
    {
      title: () => t?.('settings_dashboard.workspace') || SectionEnum.WORKSPACE,
      items: workspaceItems,
      uuid: SECTION_UUID_WORKSPACE,
    },
  ];

  if (REQUIRE_USER_AUTHENTICATION() && hasAdminPrivileges) {
    const items = [
      {
        Icon: WorkspacesUsersIcon,
        label: () => t?.('settings_dashboard.users') || SectionItemEnum.USERS,
        linkProps: {
          href: '/settings/workspace/users',
        },
        uuid: SectionItemEnum.USERS,
      },
    ];

    if (REQUIRE_USER_PERMISSIONS()) {
      items.push(...[
        {
          Icon: VisibleEye,
          label: () => t?.('settings_dashboard.roles') || SectionItemEnum.ROLES,
          linkProps: {
            href: '/settings/workspace/roles',
          },
          uuid: SectionItemEnum.ROLES,
        },
        {
          Icon: Locked,
          label: () => t?.('settings_dashboard.permissions') || SectionItemEnum.PERMISSIONS,
          linkProps: {
            href: '/settings/workspace/permissions',
          },
          uuid: SectionItemEnum.PERMISSIONS,
        },
      ]);
    }

    arr.push({
      title: () => t?.('settings_dashboard.user_management') || SectionEnum.USER_MANAGEMENT,
      items,
      uuid: SectionEnum.USER_MANAGEMENT,
    });
  }

  if (projectPlatformActivated
    && (!REQUIRE_USER_AUTHENTICATION() || hasAdminPrivileges)
  ) {
    arr.push({
      title: () => t?.('settings_dashboard.platform') || SectionEnum.PROJECT_PLATFORM,
      items: [
        {
          Icon: BlocksSeparated,
          label: () => t?.('settings_dashboard.preferences') || SectionItemEnum.PREFERENCES,
          linkProps: {
            href: '/settings/platform/preferences',
          },
          uuid: SectionItemEnum.PREFERENCES,
        },
        {
          Icon: SettingsWithKnobs,
          label: () => t?.('settings_dashboard.settings') || SectionItemEnum.SETTINGS,
          linkProps: {
            href: '/settings/platform/settings',
          },
          uuid: SectionItemEnum.SETTINGS,
        },
      ],
      uuid: SectionEnum.PROJECT_PLATFORM,
    });
  }

  if (!REQUIRE_USER_AUTHENTICATION()) {
    return arr;
  }

  return arr.concat([
    {
      title: () => t?.('settings_dashboard.account') || SECTION_UUID_ACCOUNT,
      items: [
        {
          Icon: Sun,
          label: () => t?.('settings_dashboard.profile') || SECTION_ITEM_UUID_PROFILE,
          linkProps: {
            href: '/settings/account/profile',
          },
          uuid: SECTION_ITEM_UUID_PROFILE,
        },
      ],
      uuid: SECTION_UUID_ACCOUNT,
    },
  ]);
};
