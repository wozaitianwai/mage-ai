import NextLink from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import Button from '@oracle/elements/Button';
import FlexContainer from '@oracle/components/FlexContainer';
import Link from '@oracle/elements/Link';
import PipelineRunType from '@interfaces/PipelineRunType';
import RowDataTable, { RowStyle } from '@oracle/components/RowDataTable';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import Tooltip from '@oracle/components/Tooltip';
import {
  ALL_PIPELINE_RUNS_TYPE,
  PipelineTypeEnum,
  PIPELINE_TYPE_ICON_MAPPING,
  PIPELINE_TYPE_LABEL_MAPPING,
} from '@interfaces/PipelineType';
import { ImageStyle } from '@components/Dashboard/index.style';
import { SHARED_UTC_TOOLTIP_PROPS } from '@components/PipelineRun/shared/constants';
import { TAB_URL_PARAM } from '@oracle/components/Tabs';
import {
  TIME_PERIOD_DISPLAY_MAPPING,
  TimePeriodEnum,
  datetimeInLocalTimezone,
} from '@utils/date';
import { UNIT } from '@oracle/styles/units/spacing';
import { queryFromUrl } from '@utils/url';
import { shouldDisplayLocalTimezone } from '@components/settings/workspace/utils';

const MAX_HEIGHT = UNIT * 40;
const MIN_HEIGHT = UNIT * 40;

type WidgetProps = {
  pipelineType: PipelineTypeEnum | string;
  pipelineRuns: PipelineRunType[];
  workspaceFormatting?: boolean;
};

function Widget({
  pipelineType,
  pipelineRuns = [],
  workspaceFormatting = false,
}: WidgetProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const q = queryFromUrl();
  const timePeriod = q?.[TAB_URL_PARAM] || TimePeriodEnum.TODAY;
  const displayLocalTimezone = shouldDisplayLocalTimezone();
  const isAllRuns = pipelineType === ALL_PIPELINE_RUNS_TYPE;
  const pipelineTypeLabel = useMemo(() => {
    if (isAllRuns) {
      return t('dashboard.all');
    }

    if (pipelineType === PipelineTypeEnum.INTEGRATION) {
      return t('dashboard.integration');
    }

    if (pipelineType === PipelineTypeEnum.STREAMING) {
      return t('dashboard.streaming');
    }

    return t('dashboard.standard');
  }, [isAllRuns, pipelineType, t]);

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

    return TIME_PERIOD_DISPLAY_MAPPING[timePeriod] || timePeriod;
  }, [t, timePeriod]);
  const Icon = PIPELINE_TYPE_ICON_MAPPING[pipelineType];
  const count = pipelineRuns.length;
  const countDisplay = count === 0
    ? ''
    : `(${count})`;
  const workspacePrefix = workspaceFormatting ? '/manage' : '';

  const utcTooltipEl = useMemo(() => (
    displayLocalTimezone
      ? (
        <Spacing ml="4px">
          <Tooltip
            {...SHARED_UTC_TOOLTIP_PROPS}
            label={t('dashboard.utc_failures_note')}
            maxWidth={UNIT * 24}
            widthFitContent={false}
          />
        </Spacing>
      ) : null
  ), [displayLocalTimezone, t]);

  return (
    <RowDataTable
      footer={
        <FlexContainer alignItems="center" justifyContent="center">
          <NextLink
            as={`${workspacePrefix}/pipeline-runs?status=failed`}
            href={`${workspacePrefix}/pipeline-runs`}
            passHref
          >
            <Link
              sameColorAsText
            >
              {t('dashboard.view_more')}
            </Link>
          </NextLink>
        </FlexContainer>
      }
      header={
        <FlexContainer alignItems="center">
          <Button
            beforeIcon={<Icon size={UNIT * 2.5} />}
            compact
            notClickable
          >
            {pipelineTypeLabel}
          </Button>
          <Spacing ml={2} />
          <Text bold>
            {isAllRuns
              ? t('dashboard.latest_pipeline_run_failures')
              : t('dashboard.latest_type_pipeline_run_failures', {
                type: pipelineTypeLabel,
              })
            } {countDisplay}
          </Text>
          {utcTooltipEl}
        </FlexContainer>
      }
      maxHeight={MAX_HEIGHT}
      minHeight={MIN_HEIGHT}
    >
      {count === 0
        ? (
          <FlexContainer
            alignItems="center"
            fullWidth
            justifyContent="center"
          >
            <Spacing px={5} py={10}>
              <FlexContainer alignItems="center" flexDirection="column">
                <ImageStyle
                  imageUrl={`${router?.basePath}/images/blocks/grey_block.webp`}
                />
                <Spacing mb={3} />
                <Text large>
                  {isAllRuns
                    ? t('dashboard.no_pipeline_run_failures_for_period', {
                      period: timePeriodLabel,
                    })
                    : t('dashboard.no_type_pipeline_run_failures_for_period', {
                      period: timePeriodLabel,
                      type: pipelineTypeLabel,
                    })
                  }
                </Text>
              </FlexContainer>
            </Spacing>
          </FlexContainer>
        ) : pipelineRuns.map(({
          created_at: createdAt,
          id: pipelineRunId,
          pipeline_uuid: pipelineUUID,
        }) => (
          <RowStyle key={`pipeline_run_${pipelineRunId}`}>
            <FlexContainer alignItems="center">
              {workspaceFormatting
                ? <Text monospace small>{pipelineUUID}</Text>
                : (
                  <NextLink
                    as={`/pipelines/${pipelineUUID}`}
                    href="/pipelines/[pipeline]"
                    passHref
                  >
                    <Link monospace sameColorAsText small>
                      {pipelineUUID}
                    </Link>
                  </NextLink>
                )
              }
              <Text monospace small>
                &nbsp;&#62;&nbsp;
              </Text>
              {workspaceFormatting
                ? (
                  <Text danger monospace small>
                    {t('dashboard.run_created_on')}&nbsp;
                    {displayLocalTimezone
                      ? datetimeInLocalTimezone(createdAt, displayLocalTimezone)
                      : createdAt
                    }
                  </Text>
                ) : (
                  <NextLink
                    as={`/pipelines/${pipelineUUID}/runs/${pipelineRunId}`}
                    href="/pipelines/[pipeline]/runs/[run]"
                    passHref
                  >
                    <Link danger monospace sameColorAsText small>
                      {t('dashboard.run_created_on')}&nbsp;
                      {displayLocalTimezone
                        ? datetimeInLocalTimezone(createdAt, displayLocalTimezone)
                        : createdAt
                      }
                    </Link>
                  </NextLink>
                )
              }
            </FlexContainer>
          </RowStyle>
        ))}
    </RowDataTable>
  );
}

export default Widget;
