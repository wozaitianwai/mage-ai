import PipelineType, { PipelineTypeEnum } from '@interfaces/PipelineType';
import {
  BackfillV2,
  Code,
  Lightning,
  Logs,
  Monitor,
  NavDashboard,
  PipeIcon,
  Schedule,
  SettingsWithKnobs,
} from '@oracle/icons';
import { PageNameEnum } from './constants';

export function buildNavigationItems(
  pageName: PageNameEnum,
  pipeline: PipelineType,
  pipelineUUIDFromUrl?: string,
  t?: (key: string, options?: any) => string,
) {
  const { uuid } = pipeline || {};
  const pipelineUUID = uuid || pipelineUUIDFromUrl;

  const labelEditPipeline = t?.('pipeline_detail.navigation.edit_pipeline') || 'Edit pipeline';
  const labelTriggers = t?.('pipeline_detail.navigation.triggers') || 'Triggers';
  const labelRuns = t?.('pipeline_detail.navigation.runs') || 'Runs';
  const labelLogs = t?.('pipeline_detail.navigation.logs') || 'Logs';
  const labelMonitor = t?.('pipeline_detail.navigation.monitor') || 'Monitor';
  const labelBackfills = t?.('pipeline_detail.navigation.backfills') || 'Backfills';
  const labelSyncs = t?.('pipeline_detail.navigation.syncs') || 'Syncs';
  const labelPipelineSettings = t?.('pipeline_detail.navigation.pipeline_settings') || 'Pipeline settings';

  const navigationItems = [
    {
      Icon: Lightning,
      id: PageNameEnum.TRIGGERS,
      isSelected: () => PageNameEnum.TRIGGERS === pageName,
      label: () => labelTriggers,
      linkProps: {
        as: `/pipelines/${pipelineUUID}/triggers`,
        href: '/pipelines/[pipeline]/triggers',
      },
    },
    {
      Icon: Schedule,
      id: PageNameEnum.RUNS,
      isSelected: () => PageNameEnum.RUNS === pageName,
      label: () => labelRuns,
      linkProps: {
        as: `/pipelines/${pipelineUUID}/runs`,
        href: '/pipelines/[pipeline]/runs',
      },
    },
    {
      Icon: Logs,
      id: PageNameEnum.PIPELINE_LOGS,
      isSelected: () => PageNameEnum.PIPELINE_LOGS === pageName,
      label: () => labelLogs,
      linkProps: {
        as: `/pipelines/${pipelineUUID}/logs`,
        href: '/pipelines/[pipeline]/logs',
      },
    },
    {
      Icon: Monitor,
      id: PageNameEnum.MONITOR,
      isSelected: () => PageNameEnum.MONITOR === pageName,
      label: () => labelMonitor,
      linkProps: {
        as: `/pipelines/${pipelineUUID}/monitors`,
        href: '/pipelines/[pipeline]/monitors',
      },
    },
  ];

  if (PipelineTypeEnum.PYTHON === pipeline?.type) {
    navigationItems.splice(2, 0, {
      Icon: BackfillV2,
      id: PageNameEnum.BACKFILLS,
      isSelected: () => PageNameEnum.BACKFILLS === pageName,
      label: () => labelBackfills,
      linkProps: {
        as: `/pipelines/${pipelineUUID}/backfills`,
        href: '/pipelines/[pipeline]/backfills',
      },
    });
  }

  if (PipelineTypeEnum.INTEGRATION === pipeline?.type) {
    navigationItems.unshift({
      Icon: PipeIcon,
      id: PageNameEnum.SYNCS,
      isSelected: () => PageNameEnum.SYNCS === pageName,
      label: () => labelSyncs,
      linkProps: {
        as: `/pipelines/${pipelineUUID}/syncs`,
        href: '/pipelines/[pipeline]/syncs',
      },
    });
  }

  // @ts-ignore
  navigationItems.unshift({
    Icon: Code,
    // @ts-ignore
    disabled: !pipelineUUID,
    id: PageNameEnum.EDIT,
    isSelected: () => PageNameEnum.EDIT === pageName,
    label: () => labelEditPipeline,
    linkProps: {
      as: `/pipelines/${pipelineUUID}/edit`,
      href: '/pipelines/[pipeline]/edit',
    },
  });

  // @ts-ignore
  navigationItems.push({
    Icon: SettingsWithKnobs,
    id: PageNameEnum.SETTINGS,
    isSelected: () => PageNameEnum.SETTINGS === pageName,
    label: () => labelPipelineSettings,
    linkProps: {
      as: `/pipelines/${pipelineUUID}/settings`,
      href: '/pipelines/[pipeline]/settings',
    },
  });

  return navigationItems;
}
