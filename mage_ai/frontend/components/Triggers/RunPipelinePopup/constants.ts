import type { TFunction } from 'i18next';
import type { TabType } from '@oracle/components/Tabs/ButtonTabs';

export const TAB_RUNTIME_VARIABLES: TabType = { uuid: 'RUNTIME VARIABLES' };
export const TAB_BOOKMARK_VALUES: TabType = { uuid: 'BOOKMARK VALUES' };

export const getTabs = (t?: TFunction) => ([
  {
    ...TAB_RUNTIME_VARIABLES,
    label: () => t?.('triggers.run_pipeline_popup.tabs.runtime_variables') || 'Runtime variables',
  },
  {
    ...TAB_BOOKMARK_VALUES,
    label: () => t?.('triggers.run_pipeline_popup.tabs.bookmark_values') || 'Bookmark values',
  },
]);
