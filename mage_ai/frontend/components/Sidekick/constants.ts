import PipelineType, { PipelineTypeEnum } from '@interfaces/PipelineType';
import ProjectType, { FeatureUUIDEnum } from '@interfaces/ProjectType';
import {
  Callback,
  Charts,
  Interactions,
  Lightning,
  NavReport,
  Secrets,
  Settings,
  SettingsWithKnobs,
  Table,
  Terminal,
  Tree,
  Union,
  Variables,
} from '@oracle/icons';
import { indexBy } from '@utils/array';

export const VIEW_QUERY_PARAM = 'sideview';
export const VH_PERCENTAGE = 90;

export enum ViewKeyEnum {
  ADDON_BLOCKS = 'addon_blocks',
  BLOCK_SETTINGS = 'block_settings',
  CALLBACKS = 'callbacks',
  CHARTS = 'charts',
  DATA = 'data',
  EXTENSIONS = 'power_ups',
  FILES = 'files',
  FILE_VERSIONS = 'file_versions',
  GRAPHS = 'graphs',
  INTERACTIONS = 'interactions',
  REPORTS = 'reports',
  SECRETS = 'secrets',
  SETTINGS = 'settings',
  TERMINAL = 'terminal',
  TREE = 'tree',
  VARIABLES = 'variables',
}

export const FULL_WIDTH_VIEWS = [
  ViewKeyEnum.BLOCK_SETTINGS,
  ViewKeyEnum.CALLBACKS,
  ViewKeyEnum.CHARTS,
  ViewKeyEnum.DATA,
  ViewKeyEnum.EXTENSIONS,
  ViewKeyEnum.TREE,
];

export const MESSAGE_VIEWS = [
  ViewKeyEnum.DATA,
];

export function SIDEKICK_VIEWS(opts?: {
  pipeline?: PipelineType;
  project?: ProjectType;
  t?: any;
}): {
  buildLabel?: (opts: {
    pipeline: PipelineType;
    secrets?: {
      [key: string]: any;
    }[];
    variables?: {
      [key: string]: any;
    }[];
  }) => string;
  key: ViewKeyEnum;
  label?: string;
}[] {
  const t = opts?.t || ((str: string) => str);
  const arr: {
    buildLabel?: (opts: {
      pipeline: PipelineType;
      secrets?: {
        [key: string]: any;
      }[];
      variables?: {
        [key: string]: any;
      }[];
    }) => string;
    key: ViewKeyEnum;
    label?: string;
  }[] = [
    {
      key: ViewKeyEnum.TREE,
      label: t('sidekick.tree'),
    },
    {
      buildLabel: ({
        pipeline,
      }) => {
        const { widgets = [] } = pipeline || {};

        if (widgets?.length >= 1) {
          return `${t('sidekick.charts')} (${widgets.length})`;
        }

        return t('sidekick.charts');
      },
      key: ViewKeyEnum.CHARTS,
    },
    {
      buildLabel: ({
        variables,
      }) => {
        if (variables?.length >= 1) {
          return `${t('sidekick.variables')} (${variables.length})`;
        }

        return t('sidekick.variables');
      },
      key: ViewKeyEnum.VARIABLES,
    },
    {
      buildLabel: ({
        secrets,
      }) => {
        if (secrets?.length >= 1) {
          return `${t('sidekick.secrets')} (${secrets.length})`;
        }

        return t('sidekick.secrets');
      },
      key: ViewKeyEnum.SECRETS,
    },
  ];

  if (PipelineTypeEnum.PYSPARK !== opts?.pipeline?.type) {
    arr.push(...[
      {
        buildLabel: ({
          pipeline,
        }) => t('sidekick.addon_blocks'),
        key: ViewKeyEnum.ADDON_BLOCKS,
      },
      {
        buildLabel: ({
          pipeline,
        }) => {
          const { extensions = {} } = pipeline || {};
          let extensionsCount = 0;
          Object.values(extensions).forEach(({ blocks }) => {
            extensionsCount += blocks?.length || 0;
          });

          if (extensionsCount >= 1) {
            return `${t('sidekick.power_ups')} (${extensionsCount})`;
          }

          return t('sidekick.power_ups');
        },
        key: ViewKeyEnum.EXTENSIONS,
      },
    ]);
  }

  arr.push(...[
    {
      key: ViewKeyEnum.DATA,
      label: t('sidekick.data'),
    },
    {
      key: ViewKeyEnum.TERMINAL,
      label: t('sidekick.terminal'),
    },
    {
      key: ViewKeyEnum.BLOCK_SETTINGS,
      label: t('sidekick.block_settings'),
    },
  ]);

  if (opts?.project?.features?.[FeatureUUIDEnum.INTERACTIONS]) {
    arr.push({
      key: ViewKeyEnum.INTERACTIONS,
      label: t('sidekick.interactions'),
    });
  }

  return arr;
}

export function SIDEKICK_VIEWS_BY_KEY(opts?: {
  pipeline?: PipelineType;
  project?: ProjectType;
}) {
  return indexBy(SIDEKICK_VIEWS(opts), ({ key }) => key)
};

export const NAV_ICON_MAPPING = {
  [ViewKeyEnum.ADDON_BLOCKS]: Union,
  [ViewKeyEnum.BLOCK_SETTINGS]: SettingsWithKnobs,
  [ViewKeyEnum.CALLBACKS]: Callback,
  [ViewKeyEnum.CHARTS]: Charts,
  [ViewKeyEnum.DATA]: Table,
  [ViewKeyEnum.EXTENSIONS]: Lightning,
  [ViewKeyEnum.INTERACTIONS]: Interactions,
  [ViewKeyEnum.SECRETS]: Secrets,
  [ViewKeyEnum.SETTINGS]: Settings,
  [ViewKeyEnum.TERMINAL]: Terminal,
  [ViewKeyEnum.TREE]: Tree,
  [ViewKeyEnum.VARIABLES]: Variables,
};
