import { useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import BackfillType, {
  BACKFILL_TYPE_CODE,
  BACKFILL_TYPE_DATETIME,
  BackfillStatusEnum,
  IntervalTypeEnum,
} from '@interfaces/BackfillType';
import Button from '@oracle/elements/Button';
import Divider from '@oracle/elements/Divider';
import ErrorsType from '@interfaces/ErrorsType';
import FlexContainer from '@oracle/components/FlexContainer';
import Headline from '@oracle/elements/Headline';
import Paginate from '@components/shared/Paginate';
import PipelineDetailPage from '@components/PipelineDetailPage';
import PipelineRunsTable from '@components/PipelineDetail/Runs/Table';
import PipelineRunType, {
  LAST_RUN_FAILED_STATUS,
  PIPELINE_RUN_STATUSES,
  PipelineRunReqQueryParamsType,
  RunStatus,
} from '@interfaces/PipelineRunType';
import PipelineType from '@interfaces/PipelineType';
import PipelineVariableType, {
  GLOBAL_VARIABLES_UUID,
  VariableType,
} from '@interfaces/PipelineVariableType';
import Select from '@oracle/elements/Inputs/Select';
import Spacing from '@oracle/elements/Spacing';
import Spinner from '@oracle/components/Spinner';
import Table from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import Tooltip from '@oracle/components/Tooltip';
import api from '@api';
import buildTableSidekick, { TABS } from '@components/PipelineRun/shared/buildTableSidekick';
import {
  Backfill,
  CalendarDate,
  NumberHash,
  MultiShare,
  Pause,
  PlayButtonFilled,
  Schedule,
  Switch,
} from '@oracle/icons';
import { BeforeStyle } from '@components/PipelineDetail/shared/index.style';
import { ICON_SIZE_DEFAULT } from '@oracle/styles/units/icons';
import {
  PADDING_UNITS,
  UNIT,
  UNITS_BETWEEN_SECTIONS,
} from '@oracle/styles/units/spacing';
import { PageNameEnum } from '@components/PipelineDetailPage/constants';
import { displayLocalOrUtcTime } from '@components/Triggers/utils';
import {
  getFormattedVariable,
  getFormattedVariables,
} from '@components/Sidekick/utils';
import { getRunStatusTextProps } from '@components/shared/Table/constants';
import { goToWithQuery } from '@utils/routing';
import { isEmptyObject } from '@utils/hash';
import { isViewer } from '@utils/session';
import { onSuccess } from '@api/utils/response';
import { pauseEvent } from '@utils/events';
import { queryFromUrl, queryString } from '@utils/url';
import { shouldDisplayLocalTimezone } from '@components/settings/workspace/utils';

const LIMIT = 40;

type BackfillDetailProps = {
  backfill: BackfillType;
  errors: ErrorsType;
  fetchBackfill: () => void;
  pipeline: PipelineType;
  setErrors: (errors: ErrorsType) => void;
  variables?: PipelineVariableType[];
};

function BackfillDetail({
  backfill: model,
  errors,
  fetchBackfill,
  pipeline,
  setErrors,
  variables,
}: BackfillDetailProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const isViewerRole = isViewer(router?.basePath);
  const displayLocalTimezone = shouldDisplayLocalTimezone();
  const {
    block_uuid: blockUUID,
    end_datetime: endDatetime,
    id: modelID,
    interval_type: intervalType,
    interval_units: intervalUnits,
    name: modelName,
    pipeline_run_dates: pipelineRunDates,
    start_datetime: startDatetime,
    started_at: startedAt,
    status,
    total_run_count: totalRunCount,
    variables: modelVariablesInit = {},
  } = model || {};
  const {
    uuid: pipelineUUID,
  } = pipeline;

  const q = queryFromUrl();

  const pipelineRunsRequestQuery: PipelineRunReqQueryParamsType = {
    _limit: LIMIT,
    _offset: (q?.page ? q.page : 0) * LIMIT,
  };
  if (q?.status) {
    pipelineRunsRequestQuery.status = q.status;
  }
  const {
    data: dataPipelineRuns,
    mutate: fetchPipelineRuns,
  } = api.pipeline_runs.list(
    {
      ...pipelineRunsRequestQuery,
      backfill_id: modelID,
    },
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    },
    {
      pauseFetch: !modelID,
    },
  );

  const isNotConfigured = !(startDatetime && endDatetime && intervalType && intervalUnits);
  const showPreviewRuns = !status;
  const pipelineRuns = useMemo(() => ((
    showPreviewRuns
      ? pipelineRunDates
      : dataPipelineRuns?.pipeline_runs)
    || []
    ), [
      dataPipelineRuns,
      pipelineRunDates,
      showPreviewRuns,
    ],
  );
  const totalRuns = useMemo(
    () => showPreviewRuns ? totalRunCount : dataPipelineRuns?.metadata?.count,
    [dataPipelineRuns, showPreviewRuns, totalRunCount],
  );

  const [selectedRun, setSelectedRun] = useState<PipelineRunType>(null);
  const pipelineRunStatusLabelMapping = useMemo(() => ({
    [LAST_RUN_FAILED_STATUS]: t('pipeline_runs.statuses.last_run_failed'),
    [RunStatus.CANCELLED]: t('pipeline_runs.statuses.cancelled'),
    [RunStatus.COMPLETED]: t('pipeline_runs.statuses.done'),
    [RunStatus.FAILED]: t('pipeline_runs.statuses.failed'),
    [RunStatus.INITIAL]: t('pipeline_runs.statuses.ready'),
    [RunStatus.RUNNING]: t('pipeline_runs.statuses.running'),
  }), [t]);
  const tablePipelineRuns = useMemo(() => {
    const page = q?.page ? q.page : 0;

    return (
      <>
        <PipelineRunsTable
          disableRowSelect={showPreviewRuns}
          emptyMessage={(!q?.status && !status)
            ? t('backfills.detail.no_runs_available_setup_needed')
            : t('pipeline_runs.no_runs_available')
          }
          fetchPipelineRuns={fetchPipelineRuns}
          hidePipelineColumn
          onClickRow={(rowIndex: number) => setSelectedRun((prev) => {
            const run = pipelineRuns[rowIndex];

            return prev?.id !== run.id ? run : null;
          })}
          pipelineRuns={pipelineRuns}
          selectedRun={selectedRun}
          setErrors={setErrors}
          setSelectedRun={setSelectedRun}
        />
        <Spacing p={2}>
          <Paginate
            maxPages={9}
            onUpdate={(p) => {
              const newPage = Number(p);
              const updatedQuery = {
                ...q,
                page: newPage >= 0 ? newPage : 0,
              };
              router.push(
                '/pipelines/[pipeline]/backfills/[...slug]',
                `/pipelines/${pipelineUUID}/backfills/${modelID}?${queryString(updatedQuery)}`,
              );
            }}
            page={Number(page)}
            totalPages={Math.ceil(totalRuns / LIMIT)}
          />
        </Spacing>
      </>
    );
  }, [
    fetchPipelineRuns,
    modelID,
    pipelineRuns,
    pipelineUUID,
    q,
    router,
    selectedRun,
    setErrors,
    showPreviewRuns,
    status,
    t,
    totalRuns,
  ]);

  const [selectedTab, setSelectedTab] = useState(TABS[0]);

  const [updateModel, { isLoading: isLoadingUpdate }] = useMutation(
    api.backfills.useUpdate(modelID),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => {
            fetchBackfill();
            fetchPipelineRuns();
          },
          onErrorCallback: (response, errors) => setErrors({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const isActive = useMemo(() => status
    ? BackfillStatusEnum.CANCELLED !== status && BackfillStatusEnum.FAILED !== status
    : false,
    [
      status,
    ],
  );
  const cannotStartOrCancel = useMemo(() => status
    && BackfillStatusEnum.CANCELLED !== status
    && BackfillStatusEnum.FAILED !== status
    && BackfillStatusEnum.INITIAL !== status
    && BackfillStatusEnum.RUNNING !== status, [status]);

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

  const backfillStatusLabelMapping = useMemo(() => ({
    [BackfillStatusEnum.CANCELLED]: t('pipeline_runs.statuses.cancelled'),
    [BackfillStatusEnum.COMPLETED]: t('pipeline_runs.statuses.done'),
    [BackfillStatusEnum.FAILED]: t('pipeline_runs.statuses.failed'),
    [BackfillStatusEnum.INITIAL]: t('pipeline_runs.statuses.ready'),
    [BackfillStatusEnum.RUNNING]: t('pipeline_runs.statuses.running'),
  }), [t]);

  const detailsMemo = useMemo(() => {
    const iconProps = {
      default: true,
      size: 1.5 * UNIT,
    };

    const rows = [
      [
        <FlexContainer
          alignItems="center"
          key="backfill_type_label"
        >
          <MultiShare {...iconProps} />
          <Spacing mr={1} />
          <Text default>
            {t('backfills.detail.backfill_type')}
          </Text>
        </FlexContainer>,
        <Text
          key="backfill_type"
          monospace
        >
          {blockUUID
            ? t('backfills.types.code', { defaultValue: BACKFILL_TYPE_CODE })
            : t('backfills.types.datetime', { defaultValue: BACKFILL_TYPE_DATETIME })
          }
        </Text>,
      ],
      [
        <FlexContainer
          alignItems="center"
          key="backfill_status_label"
        >
          <Switch {...iconProps} />
          <Spacing mr={1} />
          <Text default>
            {t('pipeline_runs.status')}
          </Text>
        </FlexContainer>,
        <Text
          {...getRunStatusTextProps(status)}
          key="backfill_status"
        >
          {backfillStatusLabelMapping[status] || t('pipelines.status.inactive')}
        </Text>,
      ],
    ];

    if (blockUUID) {

    } else {
      rows.push(...[
        [
          <FlexContainer
            alignItems="center"
            key="backfill_start_date_label"
          >
            <CalendarDate {...iconProps} />
            <Spacing mr={1} />
            <Text default>
              {t('backfills.detail.start_date_and_time')}
            </Text>
          </FlexContainer>,
          <Text
            key="backfill_start_date"
            monospace
            small
          >
            {displayLocalOrUtcTime(startDatetime, displayLocalTimezone)}
          </Text>,
        ],
        [
          <FlexContainer
            alignItems="center"
            key="backfill_end_date_label"
          >
            <CalendarDate {...iconProps} />
            <Spacing mr={1} />
            <Text default>
              {t('backfills.detail.end_date_and_time')}
            </Text>
          </FlexContainer>,
          <Text
            key="backfill_end_date"
            monospace
            small
          >
            {displayLocalOrUtcTime(endDatetime, displayLocalTimezone)}
          </Text>,
        ],
        [
          <FlexContainer
            alignItems="center"
            key="interval_type_label"
          >
            <Schedule {...iconProps} />
            <Spacing mr={1} />
            <Text default>
              {t('backfills.table.interval')}
            </Text>
          </FlexContainer>,
          <Text
            key="interval_type"
            monospace
          >
            {intervalTypeLabelMapping[intervalType]}
          </Text>,
        ],
        [
          <FlexContainer
            alignItems="center"
            key="interval_units_label"
          >
            <Schedule {...iconProps} />
            <Spacing mr={1} />
            <Text default>
              {t('backfills.table.interval_units')}
            </Text>
          </FlexContainer>,
          <Text
            key="interval_units"
            monospace
          >
            {intervalUnits}
          </Text>,
        ],
        [
          <FlexContainer
            alignItems="center"
            key="total_runs_label"
          >
            <NumberHash {...iconProps} />
            <Spacing mr={1} />
            <Text default>
              {t('backfills.table.total_runs')}
            </Text>
            <Spacing mr={1} />
            <Tooltip
              default
              label={t('backfills.detail.total_runs_excludes_retries_tooltip')}
              size={ICON_SIZE_DEFAULT}
              widthFitContent
            />
          </FlexContainer>,
          <Text
            key="total_runs"
            monospace
          >
            {totalRunCount}
          </Text>,
        ],
      ]);
    }

    return (
      <Table
        columnFlex={[null, 1]}
        rows={rows}
      />
    );
  }, [
    blockUUID,
    intervalTypeLabelMapping,
    backfillStatusLabelMapping,
    displayLocalTimezone,
    endDatetime,
    intervalType,
    intervalUnits,
    startDatetime,
    status,
    t,
    totalRunCount,
  ]);

  const modelVariables = useMemo(() => modelVariablesInit || {}, [modelVariablesInit]);
  const variablesTable = useMemo(() => {
    const arr = getFormattedVariables(variables, block => block.uuid === GLOBAL_VARIABLES_UUID) || [];

    if (!isEmptyObject(modelVariables)) {
      Object.entries(modelVariables).forEach(([k, v]) => {
        const currentVarIdx = arr.findIndex((pipelineVar: VariableType) => pipelineVar?.uuid === k);
        if (currentVarIdx !== -1) {
          arr.splice(currentVarIdx, 1, {
            uuid: k,
            value: getFormattedVariable(v),
          });
        } else {
          arr.push({
            uuid: k,
            value: getFormattedVariable(v),
          });
        }
      });
    }

    if (typeof arr === 'undefined' || !arr?.length) {
      return null;
    }

    return (
      <Table
        columnFlex={[null, 1]}
        rows={arr.map(({
          uuid,
          value,
        }) => [
          <Text
            default
            key={`settings_variable_label_${uuid}`}
            monospace
            small
          >
            {uuid}
          </Text>,
          <Text
            key={`settings_variable_${uuid}`}
            monospace
            small
          >
            {value}
          </Text>,
        ])}
      />
    );
  }, [
    modelVariables,
    variables,
  ]);

  return (
    <>
      <PipelineDetailPage
        afterHidden={!selectedRun}
        before={(
          <BeforeStyle>
            <Spacing
              mb={UNITS_BETWEEN_SECTIONS}
              pt={PADDING_UNITS}
              px={PADDING_UNITS}
            >
              <Spacing mb={PADDING_UNITS}>
                <Backfill size={5 * UNIT} />
              </Spacing>

              <Headline>
                {modelName}
              </Headline>
            </Spacing>

            <Spacing px={PADDING_UNITS}>
              <Headline level={5}>
                {t('backfills.detail.settings')}
              </Headline>
            </Spacing>

            <Divider light mt={1} short />

            {detailsMemo}

            {variablesTable && (
              <Spacing my={UNITS_BETWEEN_SECTIONS}>
                <Spacing px={PADDING_UNITS}>
                  <Headline level={5}>
                    {t('backfills.detail.runtime_variables')}
                  </Headline>
                </Spacing>

                <Divider light mt={1} short />

                {variablesTable}
              </Spacing>
            )}
          </BeforeStyle>
        )}
        beforeWidth={34 * UNIT}
        breadcrumbs={[
          {
            label: () => t('pipeline_detail.navigation.backfills'),
            linkProps: {
              as: `/pipelines/${pipelineUUID}/backfills`,
              href: '/pipelines/[pipeline]/backfills',
            },
          },
          {
            label: () => modelName,
            linkProps: {
              as: `/pipelines/${pipelineUUID}/backfills/${modelID}`,
              href: '/pipelines/[pipeline]/backfills/[...slug]',
            },
          },
        ]}
        buildSidekick={props => buildTableSidekick({
          ...props,
          t,
          selectedRun,
          selectedTab,
          setSelectedTab,
        })}
        errors={errors}
        pageName={PageNameEnum.BACKFILLS}
        pipeline={pipeline}
        setErrors={setErrors}
        subheader={(
          <FlexContainer alignItems="center">
            {!cannotStartOrCancel && (
              <>
                <Button
                  beforeIcon={isActive
                    ? <Pause size={2 * UNIT} />
                    : <PlayButtonFilled
                        inverted={!(BackfillStatusEnum.CANCELLED === status || BackfillStatusEnum.FAILED === status)}
                        size={2 * UNIT}
                      />
                  }
                  danger={isActive}
                  disabled={isNotConfigured}
                  loading={isLoadingUpdate}
                  onClick={(e) => {
                    pauseEvent(e);
                    // @ts-ignore
                    updateModel({
                      backfill: {
                        status: isActive
                          ? BackfillStatusEnum.CANCELLED
                          : BackfillStatusEnum.INITIAL,
                      },
                    });
                  }}
                  outline
                  success={!isActive
                    && !(BackfillStatusEnum.CANCELLED === status || BackfillStatusEnum.FAILED === status)
                    && !isNotConfigured
                  }
                >
                  {isActive
                    ? t('backfills.detail.actions.cancel_backfill')
                    : BackfillStatusEnum.CANCELLED === status || BackfillStatusEnum.FAILED === status
                      ? t('backfills.detail.actions.retry_backfill')
                      : t('backfills.detail.actions.start_backfill')
                  }
                </Button>
                <Spacing mr={PADDING_UNITS} />
              </>
            )}

            {(!isViewerRole && !startedAt) &&
              <Button
                linkProps={{
                  as: `/pipelines/${pipelineUUID}/backfills/${modelID}/edit`,
                  href: '/pipelines/[pipeline]/backfills/[...slug]',
                }}
                noHoverUnderline
                outline
                sameColorAsText
                title={t('backfills.detail.actions.cannot_edit_tooltip')}
              >
                {t('backfills.detail.actions.edit_backfill')}
              </Button>
            }

            {!showPreviewRuns &&
              <>
                <Text bold default large>
                  {t('pipeline_detail.runs.filter_runs_by_status')}
                </Text>
                <Spacing mr={PADDING_UNITS} />
                <Select
                  compact
                  defaultColor
                  onChange={e => {
                    e.preventDefault();
                    const updatedStatus = e.target.value;
                    if (updatedStatus === 'all') {
                      router.push(
                        '/pipelines/[pipeline]/backfills/[...slug]',
                        `/pipelines/${pipelineUUID}/backfills/${modelID}`,
                      );
                    } else {
                      goToWithQuery(
                        {
                          page: 0,
                          status: e.target.value,
                        },
                      );
                    }
                  }}
                  paddingRight={UNIT * 4}
                  placeholder={t('pipeline_detail.runs.select_run_status')}
                  value={q?.status || 'all'}
                >
                  <option key="all_statuses" value="all">
                    {t('pipeline_detail.runs.all_statuses')}
                  </option>
                  {PIPELINE_RUN_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {pipelineRunStatusLabelMapping[status] || status}
                    </option>
                  ))}
                </Select>
              </>
            }
          </FlexContainer>
        )}
        title={() => modelName}
        uuid="backfill/detail"
      >
        <Spacing mt={PADDING_UNITS} px={PADDING_UNITS}>
          <Headline level={5}>
            {t('backfills.detail.runs_for_this_backfill')}
          </Headline>
        </Spacing>

        <Divider light mt={PADDING_UNITS} short />

        {!dataPipelineRuns
          ?
            <Spacing m={2}>
              <Spinner inverted />
            </Spacing>
          : tablePipelineRuns}
      </PipelineDetailPage>
    </>
  );
}

export default BackfillDetail;
