import type { TabType } from '@oracle/components/Tabs/ButtonTabs';

export const NAV_TAB_DEFINE: TabType = {
  uuid: 'Define',
};

export const NAV_TAB_DOCUMENT: TabType = {
  uuid: 'Document',
};

export const NAV_TAB_BLOCKS: TabType = {
  uuid: 'Blocks',
};

export const NAV_TAB_TRIGGERS: TabType = {
  uuid: 'Triggers',
};

// Specific order
export const NAV_TABS: TabType[] = [
  NAV_TAB_DEFINE,
  NAV_TAB_DOCUMENT,
  // NAV_TAB_BLOCKS,
  // NAV_TAB_TRIGGERS,
];
