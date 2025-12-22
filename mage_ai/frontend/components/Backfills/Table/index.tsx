import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BackfillType, {
  BACKFILL_TYPE_DATETIME,
  BACKFILL_TYPE_CODE,
  IntervalTypeEnum,
} from '@interfaces/BackfillType';
import Button from '@oracle/elements/Button';
import FlexContainer from '@oracle/components/FlexContainer';
import Link from '@oracle/elements/Link';
import Table, { ColumnType } from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import api from '@api';
import useDeleteConfirmDialogue from '@components/shared/Table/useDeleteConfirmDialogue';
import { Edit } from '@oracle/icons';
import { RunStatus } from '@interfaces/PipelineRunType';
import {
  TIMEZONE_TOOLTIP_PROPS,
  getRunStatusTextProps,
} from '@components/shared/Table/constants';
import { UNIT } from '@oracle/styles/units/spacing';
import { displayLocalOrUtcTime } from '@components/Triggers/utils';
import { isViewer } from '@utils/session';
import { shouldDisplayLocalTimezone } from '@components/settings/workspace/utils';
import { utcStringToElapsedTime } from '@utils/date';

const SHARED_COLUMN_TEXT_PROPS = {
  default: true,
  monospace: true,
};

type BackfillsTableProps = {
  fetchBackfills: () => void;
  pipeline: {
    uuid: string;
  };
  models: BackfillType[];
  onClickRow?: (backfill: BackfillType) => void;
  selectedRow?: BackfillType;
};

function BackfillsTable({
  fetchBackfills,
  models,
  onClickRow,
  pipeline,
  selectedRow,
}: BackfillsTableProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const isViewerRole = isViewer(router?.basePath);
  const displayLocalTimezone = shouldDisplayLocalTimezone();
  const pipelineUUID = pipeline?.uuid;
  const timezoneTooltipProps = displayLocalTimezone ? TIMEZONE_TOOLTIP_PROPS : {};

  const { deleteButton } = useDeleteConfirmDialogue({
    fetchItems: fetchBackfills,
    mutationFn: api.backfills.useDelete,
    path: 'backfills',
    pipelineUUID,
  });

  const intervalTypeLabelMapping = useMemo(() => ({
    [IntervalTypeEnum.CUSTOM]: t('backfills.interval_types.custom'),
    [IntervalTypeEnum.DAY]: t('backfills.interval_types.day'),
    [IntervalTypeEnum.HOUR]: t('backfills.interval_types.hour'),
    [IntervalTypeEnum.MINUTE]: t('backfills.interval_types.minute'),
    [IntervalTypeEnum.MONTH]: t('backfills.interval_types.month'),
    [IntervalTypeEnum.SECOND]: t('backfills.interval_types.second'),
    [IntervalTypeEnum.WEEK]: t('backfills.interval_types.week'),
    [IntervalTypeEnum.YEAR]: t('backfills.interval_types.year'),
  }), [t]);

  const statusLabelMapping = useMemo(() => ({
    [RunStatus.CANCELLED]: t('pipeline_runs.statuses.cancelled'),
    [RunStatus.COMPLETED]: t('pipeline_runs.statuses.done'),
    [RunStatus.FAILED]: t('pipeline_runs.statuses.failed'),
    [RunStatus.INITIAL]: t('pipeline_runs.statuses.ready'),
    [RunStatus.RUNNING]: t('pipeline_runs.statuses.running'),
  }), [t]);

  const columnFlex = [null, 1, 1, null, null, null, null, null, null, 1, 1, null, null, null, null];
  const columns: ColumnType[] = useMemo(() => {
    const arr: ColumnType[] = [
      {
        uuid: t('pipeline_runs.status'),
      },
      {
        uuid: t('common.name'),
      },
      {
        ...timezoneTooltipProps,
        uuid: t('backfills.table.backfill'),
      },
      {
        uuid: t('pipeline_runs.statuses.ready'),
      },
      {
        uuid: t('pipeline_runs.statuses.running'),
      },
      {
        uuid: t('pipeline_runs.statuses.cancelled'),
      },
      {
        uuid: t('pipeline_runs.statuses.done'),
      },
      {
        uuid: t('pipeline_runs.statuses.failed'),
      },
      {
        uuid: t('backfills.table.total_runs'),
      },
      {
        ...timezoneTooltipProps,
        uuid: t('pipeline_runs.started_at'),
      },
      {
        ...timezoneTooltipProps,
        uuid: t('pipeline_runs.completed_at'),
      },
      {
        uuid: t('backfills.table.interval'),
      },
      {
        uuid: t('backfills.table.interval_units'),
      },
      {
        uuid: t('common.type'),
      },
    ];

    if (!isViewerRole) {
      arr.push({
        label: () => '',
        uuid: 'edit_delete_backfill',
      });
    }

    return arr;
  }, [isViewerRole, t, timezoneTooltipProps]);

  return (
    <Table
      columnFlex={columnFlex}
      columns={columns}
      isSelectedRow={(rowIndex: number) => models[rowIndex].id === selectedRow?.id}
      onClickRow={(rowIndex: number) => onClickRow?.(models[rowIndex])}
      rows={models.map(({
        block_uuid: blockUUID,
        completed_at: completedAt,
        end_datetime: endDatetime,
        id,
        interval_type: intervalType,
        interval_units: intervalUnits,
        name,
        run_status_counts: runStatusCounts = {},
        start_datetime: startDatetime,
        started_at: startedAt,
        status,
        total_run_count: totalRunCount,
      }, idx) => {
        const arr = [
          <Text
            {...getRunStatusTextProps(status)}
            key={`status_${idx}`}
          >
            {statusLabelMapping[status] || t('pipelines.status.inactive')}
          </Text>,
          <NextLink
            as={`/pipelines/${pipelineUUID}/backfills/${id}`}
            href={'/pipelines/[pipeline]/backfills/[...slug]'}
            key={`name_${idx}`}
            passHref
          >
            <Link bold sameColorAsText>
              {name}
            </Link>
          </NextLink>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`backfill_${idx}`}
            small
          >
            {(startDatetime && endDatetime) && (
              <>
                {displayLocalOrUtcTime(startDatetime, displayLocalTimezone)}
                &nbsp;-&nbsp;
                {displayLocalOrUtcTime(endDatetime, displayLocalTimezone)}
              </>
            )}
            {!(startDatetime && endDatetime) && <>&#8212;</>}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`ready_${idx}`}
          >
            {runStatusCounts[RunStatus.INITIAL] || 0}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            info={runStatusCounts[RunStatus.RUNNING] > 0}
            key={`running_${idx}`}
          >
            {runStatusCounts[RunStatus.RUNNING] || 0}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`cancelled_${idx}`}
            warning={runStatusCounts[RunStatus.CANCELLED] > 0}
          >
            {runStatusCounts[RunStatus.CANCELLED] || 0}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`completed_${idx}`}
            success={runStatusCounts[RunStatus.COMPLETED] > 0}
          >
            {runStatusCounts[RunStatus.COMPLETED] || 0}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            danger={runStatusCounts[RunStatus.FAILED] > 0}
            key={`failed_${idx}`}
          >
            {runStatusCounts[RunStatus.FAILED] || 0}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            bold
            key={`total_runs_${idx}`}
          >
            {totalRunCount || 0}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`started_at_${idx}`}
            small
            title={startedAt ? utcStringToElapsedTime(startedAt) : null}
          >
            {startedAt
              ? displayLocalOrUtcTime(startedAt, displayLocalTimezone)
              : <>&#8212;</>
            }
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`completed_at_${idx}`}
            small
            title={completedAt ? utcStringToElapsedTime(completedAt) : null}
          >
            {completedAt
              ? displayLocalOrUtcTime(completedAt, displayLocalTimezone)
              : <>&#8212;</>
            }
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`interval_${idx}`}
          >
            {intervalTypeLabelMapping[intervalType] || <>&#8212;</>}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`interval_units_${idx}`}
          >
            {intervalUnits || <>&#8212;</>}
          </Text>,
          <Text
            {...SHARED_COLUMN_TEXT_PROPS}
            key={`type_${idx}`}
          >
            {blockUUID
              ? t('backfills.types.code', { defaultValue: BACKFILL_TYPE_CODE })
              : t('backfills.types.datetime', { defaultValue: BACKFILL_TYPE_DATETIME })
            }
          </Text>,
        ];
        if (!isViewerRole) {
          arr.push(
            <FlexContainer key={`edit_delete_backfill_${idx}`}>
              <Button
                default
                disabled={!!startedAt}
                iconOnly
                key={`${idx}_edit_button`}
                linkProps={{
                  as: `/pipelines/${pipelineUUID}/backfills/${id}/edit`,
                  href: '/pipelines/[pipeline]/backfills/[...slug]',
                }}
                noBackground
                title={t('common.edit')}
              >
                <Edit default size={2 * UNIT} />
              </Button>
              {deleteButton(
                id,
                idx,
                t('backfills.delete_confirmation', { name }),
              )}
            </FlexContainer>,
          );
        }

        return arr;
      })}
      uuid="pipeline-runs"
    />
  );
}

export default BackfillsTable;
