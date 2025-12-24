import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import BarStackChart from '@components/charts/BarStack';
import ButtonTabs, { TabType } from '@oracle/components/Tabs/ButtonTabs';
import ErrorsType from '@interfaces/ErrorsType';
import FlexContainer from '@oracle/components/FlexContainer';
import Headline from '@oracle/elements/Headline';
import PageSectionHeader from '@components/shared/Sticky/PageSectionHeader';
import PrivateRoute from '@components/shared/PrivateRoute';
import ProjectType, { FeatureUUIDEnum } from '@interfaces/ProjectType';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import Tooltip from '@oracle/components/Tooltip';
import Widget from '@components/PipelineRun/Widget';
import WorkspacesDashboard from '@components/workspaces/Dashboard';
import api from '@api';
import dark from '@oracle/styles/themes/dark';
import { ALL_PIPELINE_RUNS_TYPE } from '@interfaces/PipelineType';
import {
  BAR_STACK_COLORS,
  BAR_STACK_STATUSES,
  TOOLTIP_LEFT_OFFSET,
} from '@components/Monitor/constants';
import { LOCAL_STORAGE_KEY_OVERVIEW_TAB_SELECTED, set, get } from 'storage/localStorage';
import { MonitorStatsEnum } from '@interfaces/MonitorStatsType';
import { RunStatus } from '@interfaces/BlockRunType';
import { SHARED_UTC_TOOLTIP_PROPS } from '@components/PipelineRun/shared/constants';
import { TAB_URL_PARAM } from '@oracle/components/Tabs';
import {
  TIME_PERIOD_DISPLAY_MAPPING,
  TIME_PERIOD_INTERVAL_MAPPING,
  TimePeriodEnum,
  getDateRange,
  getFullDateRangeString,
  getStartDateStringFromPeriod,
  unixTimestampFromDate,
} from '@utils/date';
import { TIME_PERIOD_TABS, TAB_TODAY } from '@components/Dashboard/constants';
import { WorkspacesPageNameEnum } from '@components/workspaces/Dashboard/constants';
import { capitalize } from '@utils/string';
import { formatNumber } from '@utils/number';
import { getAllPipelineRunDataGrouped } from '@components/PipelineRun/shared/utils';
import { goToWithQuery } from '@utils/routing';
import { onSuccess } from '@api/utils/response';
import {
  shouldDisplayLocalTimezone,
  storeLocalTimezoneSetting,
} from '@components/settings/workspace/utils';
import { CustomEventUUID } from '@utils/events/constants';

const SHARED_WIDGET_SPACING_PROPS = {
  mt: 2,
  mx: 3,
};
const SHARED_FETCH_OPTIONS = {
  refreshInterval: 60000,
  revalidateOnFocus: false,
};

function OverviewPage({ tab }: { tab?: TimePeriodEnum }) {
  const { t } = useTranslation('common');
  const abortRef = useRef(null);
  const mountedRef = useRef(false);
  const refSubheader = useRef(null);

  const timePeriodTabs = useMemo(
    () =>
      TIME_PERIOD_TABS.map(tab => ({
        ...tab,
        label: () => {
          if (TimePeriodEnum.TODAY === tab.uuid) {
            return t('header.today');
          }
          if (TimePeriodEnum.WEEK === tab.uuid) {
            return t('header.last_7_days');
          }
          if (TimePeriodEnum.MONTH === tab.uuid) {
            return t('header.last_30_days');
          }

          return tab?.label ? tab.label() : tab.uuid;
        },
      })),
    [t],
  );
  const allTabs = useMemo(() => timePeriodTabs, [timePeriodTabs]);
  const [selectedTab, setSelectedTabState] = useState<TabType>(
    allTabs.find(
      ({ uuid }) => uuid === (tab ? tab : get(LOCAL_STORAGE_KEY_OVERVIEW_TAB_SELECTED)?.uuid),
    ) || TAB_TODAY,
  );

  const [errors, setErrors] = useState<ErrorsType>(null);
  const [displayLocalTimezone, setDisplayLocalTimezone] = useState<boolean>(
    shouldDisplayLocalTimezone(),
  );

  const timePeriod = selectedTab?.uuid;

  const startDateString = useMemo(
    () =>
      getStartDateStringFromPeriod(timePeriod, {
        isoString: true,
        localTime: displayLocalTimezone,
      }),
    [displayLocalTimezone, timePeriod],
  );
  const timezoneOffset = useMemo(() => moment().format('Z'), []);
  const monitorStatsQueryParams = useMemo(
    () =>
      displayLocalTimezone
        ? {
            start_time: startDateString,
            timezone_offset: timezoneOffset,
          }
        : {
            start_time: startDateString,
          },
    [displayLocalTimezone, startDateString, timezoneOffset],
  );

  const [monitorStats, setMonitorStats] = useState();
  const [fetchMonitorStats, { isLoading: isValidatingMonitorStats }] = useMutation(
    () =>
      api.monitor_stats?.detailAsync(MonitorStatsEnum.PIPELINE_RUN_COUNT, monitorStatsQueryParams, {
        signal: abortRef?.current?.signal,
      }),
    {
      onSuccess: (response: any) =>
        onSuccess(response, {
          callback: ({ monitor_stat: { stats } }) => {
            setMonitorStats(stats);
          },
        }),
    },
  );

  const setSelectedTab = useCallback(
    (prev: TabType | ((tab: TabType) => TabType)) => {
      if (abortRef?.current !== null) {
        abortRef?.current?.abort();
      }
      abortRef.current = new AbortController();

      setSelectedTabState((current: TabType) => {
        const tab = typeof prev === 'function' ? prev(current) : prev;

        if (current?.uuid !== tab?.uuid) {
          goToWithQuery({ [TAB_URL_PARAM]: tab?.uuid }, { replaceParams: true });

          fetchMonitorStats();
        }

        set(LOCAL_STORAGE_KEY_OVERVIEW_TAB_SELECTED, tab);

        return tab;
      });
    },
    [fetchMonitorStats],
  );

  useEffect(() => {
    if (!mountedRef?.current) {
      mountedRef.current = true;
      fetchMonitorStats();
    }

    if (!tab) {
      goToWithQuery(
        {
          [TAB_URL_PARAM]: selectedTab ? selectedTab?.uuid : allTabs?.[0]?.uuid,
        },
        {
          pushHistory: false,
        },
      );
    }
  }, [allTabs, fetchMonitorStats, selectedTab, tab]);

  const { data: dataPipelineRuns } = api.pipeline_runs.list(
    {
      _limit: 50,
      include_all_pipeline_schedules: true,
      'order_by[]': 'created_at desc',
      start_timestamp: unixTimestampFromDate(startDateString),
      status: RunStatus.FAILED,
    },
    { ...SHARED_FETCH_OPTIONS },
  );
  const pipelineRuns = useMemo(
    () => (dataPipelineRuns?.pipeline_runs || []),
    [dataPipelineRuns?.pipeline_runs],
  );

  const dateRange = useMemo(
    () =>
      getDateRange(TIME_PERIOD_INTERVAL_MAPPING[timePeriod] + 1, {
        localTime: displayLocalTimezone,
      }),
    [displayLocalTimezone, timePeriod],
  );
  const allPipelineRunData = useMemo(
    () => getAllPipelineRunDataGrouped(monitorStats, dateRange, true),
    [monitorStats, dateRange],
  );
  const { totalPipelineRunCount, ungroupedPipelineRunData } =
    allPipelineRunData;

  const selectedDateRange = useMemo(
    () =>
      getFullDateRangeString(TIME_PERIOD_INTERVAL_MAPPING[timePeriod], {
        endDateOnly: timePeriod === TimePeriodEnum.TODAY,
        localTime: displayLocalTimezone,
      }),
    [displayLocalTimezone, timePeriod],
  );

  const { data: dataProjects } = api.projects.list();
  const project: ProjectType = useMemo(() => dataProjects?.projects?.[0], [dataProjects]);
  const timePeriodLabel = useMemo(() => {
    if (TimePeriodEnum.TODAY === timePeriod) {
      return t('header.today');
    }

    if (TimePeriodEnum.WEEK === timePeriod) {
      return t('header.last_7_days');
    }

    if (TimePeriodEnum.MONTH === timePeriod) {
      return t('header.last_30_days');
    }

    return capitalize(TIME_PERIOD_DISPLAY_MAPPING[timePeriod]) || timePeriod;
  }, [t, timePeriod]);
  const timeZoneLabel = displayLocalTimezone ? t('dashboard.local_time') : 'UTC';

  useEffect(() => {
    if (typeof project?.features?.[FeatureUUIDEnum.LOCAL_TIMEZONE] !== 'undefined') {
      storeLocalTimezoneSetting(project?.features?.[FeatureUUIDEnum.LOCAL_TIMEZONE]);
      setDisplayLocalTimezone(shouldDisplayLocalTimezone());
    }
  }, [project?.features]);

  useEffect(() => {
    const handleTimezoneChange = (event: Event) => {
      const detail = (event as CustomEvent<{ displayLocalTimezone?: boolean }>)?.detail;
      if (typeof detail?.displayLocalTimezone === 'boolean') {
        setDisplayLocalTimezone(detail.displayLocalTimezone);
        return;
      }

      setDisplayLocalTimezone(shouldDisplayLocalTimezone());
    };

    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener(CustomEventUUID.LOCAL_TIMEZONE_CHANGED, handleTimezoneChange);

    return () =>
      window.removeEventListener(CustomEventUUID.LOCAL_TIMEZONE_CHANGED, handleTimezoneChange);
  }, []);

  const utcTooltipEl = useMemo(
    () =>
      displayLocalTimezone ? (
        <Spacing ml="4px">
          <Tooltip
            {...SHARED_UTC_TOOLTIP_PROPS}
            label={t('dashboard.utc_counts_note')}
          />
        </Spacing>
      ) : null,
    [displayLocalTimezone, t],
  );

  return (
    <WorkspacesDashboard
      breadcrumbs={[
        {
          label: () => t('settings_dashboard.workspace'),
          linkProps: {
            as: '/manage',
            href: '/manage',
          },
        },
        {
          bold: true,
          label: () => t('sidebar.overview'),
        },
      ]}
      errors={errors}
      pageName={WorkspacesPageNameEnum.OVERVIEW}
      setErrors={setErrors}
    >
      <PageSectionHeader backgroundColor={dark.background.panel} ref={refSubheader}>
        <Spacing py={2}>
          <FlexContainer alignItems="center">
            <ButtonTabs
              onClickTab={({ uuid }) => {
                setSelectedTab(() => allTabs.find(t => uuid === t.uuid));
              }}
              regularSizeText
              selectedTabUUID={timePeriod}
              tabs={allTabs}
            />
          </FlexContainer>
        </Spacing>
      </PageSectionHeader>

      <Spacing mx={3} my={2}>
        <Headline level={4}>
          {`${timePeriodLabel || capitalize(timePeriod)} (${timeZoneLabel}): ${selectedDateRange}`}
        </Headline>

        <Spacing mt={2}>
          <Spacing ml={2}>
            <FlexContainer alignItems="center">
              <Text bold large>
                {isValidatingMonitorStats ? '--' : formatNumber(totalPipelineRunCount)}{' '}
                {t('dashboard.total_pipeline_runs')}
              </Text>
              {utcTooltipEl}
            </FlexContainer>
          </Spacing>
          <Spacing mt={1}>
            <BarStackChart
              colors={BAR_STACK_COLORS}
              data={ungroupedPipelineRunData}
              getXValue={data => data['date']}
              height={500}
              keys={BAR_STACK_STATUSES}
              margin={{
                bottom: 30,
                left: 35,
                right: 0,
                top: 10,
              }}
              tooltipLeftOffset={TOOLTIP_LEFT_OFFSET}
              xLabelFormat={label =>
                (displayLocalTimezone ? moment(label) : moment.utc(label)).format('MMM DD')
              }
            />
          </Spacing>
        </Spacing>
      </Spacing>

      <Spacing {...SHARED_WIDGET_SPACING_PROPS}>
        <FlexContainer alignItems="center" justifyContent="center">
          <Widget
            pipelineRuns={pipelineRuns}
            pipelineType={ALL_PIPELINE_RUNS_TYPE}
            workspaceFormatting
          />
        </FlexContainer>
      </Spacing>

      <Spacing mb={2} />
    </WorkspacesDashboard>
  );
}

OverviewPage.getInitialProps = async ctx => ({
  tab: ctx?.query?.tab ? (ctx?.query?.tab as TimePeriodEnum) : null,
});

export default PrivateRoute(OverviewPage);
