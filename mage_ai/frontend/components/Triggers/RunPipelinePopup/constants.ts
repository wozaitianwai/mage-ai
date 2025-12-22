export const TAB_RUNTIME_VARIABLES = { uuid: 'RUNTIME VARIABLES' };
export const TAB_BOOKMARK_VALUES = { uuid: 'BOOKMARK VALUES' };

export const getTabs = (t?: (key: string, options?: any) => string) => ([
  {
    ...TAB_RUNTIME_VARIABLES,
    label: () => t?.('triggers.run_pipeline_popup.tabs.runtime_variables') || 'Runtime variables',
  },
  {
    ...TAB_BOOKMARK_VALUES,
    label: () => t?.('triggers.run_pipeline_popup.tabs.bookmark_values') || 'Bookmark values',
  },
]);
