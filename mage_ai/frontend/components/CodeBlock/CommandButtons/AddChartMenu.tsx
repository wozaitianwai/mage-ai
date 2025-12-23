import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BlockType, { BlockLanguageEnum, BlockTypeEnum, StatusTypeEnum } from '@interfaces/BlockType';
import FlyoutMenu from '@oracle/components/FlyoutMenu';
import { CHART_TYPES, ChartTypeEnum } from '@interfaces/ChartBlockType';
import {
  CHART_TEMPLATES,
  DEFAULT_SETTINGS_BY_CHART_TYPE,
} from '@components/ChartBlock/constants';
import { UNIT } from '@oracle/styles/units/spacing';
import {
  capitalizeRemoveUnderscoreLower,
  randomSimpleHashGenerator,
} from '@utils/string';

type AddChartMenuProps = {
  addWidget: (widget: BlockType, opts?: {
    onCreateCallback?: (block: BlockType) => void;
  }) => Promise<any>;
  block?: BlockType;
  left?: number;
  rightOffset?: number;
  onClickCallback: () => void;
  open: boolean;
  parentRef: any;
  runBlock?: (payload: {
    block: BlockType;
    code?: string;
    disableReset?: boolean;
    runDownstream?: boolean;
    runUpstream?: boolean;
  }) => void;
  topOffset?: number;
};

function AddChartMenu({
  addWidget,
  block,
  left,
  rightOffset,
  onClickCallback,
  open,
  parentRef,
  runBlock,
  topOffset,
}: AddChartMenuProps) {
  const { t } = useTranslation('common');
  const chartTypeLabels = useMemo(() => ({
    [ChartTypeEnum.BAR_CHART]: t('pipeline_detail.code_block.chart_types.bar_chart'),
    [ChartTypeEnum.HISTOGRAM]: t('pipeline_detail.code_block.chart_types.histogram'),
    [ChartTypeEnum.LINE_CHART]: t('pipeline_detail.code_block.chart_types.line_chart'),
    [ChartTypeEnum.PIE_CHART]: t('pipeline_detail.code_block.chart_types.pie_chart'),
    [ChartTypeEnum.TABLE]: t('pipeline_detail.code_block.chart_types.table'),
    [ChartTypeEnum.TIME_SERIES_BAR_CHART]:
      t('pipeline_detail.code_block.chart_types.time_series_bar_chart'),
    [ChartTypeEnum.TIME_SERIES_LINE_CHART]:
      t('pipeline_detail.code_block.chart_types.time_series_line_chart'),
  }), [t]);
  const chartTemplateLabelKeys = useMemo(() => ({
    '% of missing values': 'pipeline_detail.code_block.chart_templates.missing_values_percentage',
    'Unique values': 'pipeline_detail.code_block.chart_templates.unique_values',
    'Most frequent values': 'pipeline_detail.code_block.chart_templates.most_frequent_values',
    'Summary overview': 'pipeline_detail.code_block.chart_templates.summary_overview',
    'Feature profiles': 'pipeline_detail.code_block.chart_templates.feature_profiles',
  }), []);
  const chartMenuItems = useMemo(() => CHART_TYPES.map((chartType: string) => {
    const widget = {
      configuration: {
        chart_type: chartType,
      },
      language: block.language,
      type: BlockTypeEnum.CHART,
      upstream_blocks: block ? [block.uuid] : null,
    };
    const defaultSettings = DEFAULT_SETTINGS_BY_CHART_TYPE[chartType];
    const configuration = defaultSettings?.configuration?.(widget) || {};
    const content = BlockLanguageEnum.SQL === block?.language
      ? null
      : defaultSettings?.content?.(widget) || null;

    let widgetName = chartType;
    if (block) {
      widgetName = `${block.uuid}_${widgetName}`;
    }

    return {
      label: () => chartTypeLabels[chartType as ChartTypeEnum]
        || capitalizeRemoveUnderscoreLower(chartType),
      onClick: () => addWidget({
        ...widget,
        configuration: {
          ...widget.configuration,
          ...configuration,
        },
        content,
        name: `${widgetName}_${randomSimpleHashGenerator()}`,
      }, {
        onCreateCallback: (widget: BlockType) => {
          if (block && BlockLanguageEnum.SQL !== block.language) {
            if ([StatusTypeEnum.EXECUTED, StatusTypeEnum.UPDATED].includes(block.status)) {
              runBlock?.({
                block: widget,
                code: content,
                disableReset: true,
              });
            } else {
              runBlock?.({
                block,
                runDownstream: true,
              });
            }
          }
        },
      }),
      uuid: chartType,
    };
  }), [
    addWidget,
    block,
    chartTypeLabels,
    runBlock,
  ]);
  const chartTemplateMenuItems = useMemo(() => CHART_TEMPLATES.map(({
    label,
    widgetTemplate,
  }) => {
    const templateLabel = label?.();
    const labelKey = chartTemplateLabelKeys?.[templateLabel];
    const widget = {
      ...widgetTemplate({
        block,
      }),
      language: block.language,
      type: BlockTypeEnum.CHART,
      upstream_blocks: block ? [block.uuid] : null,
    };

    return {
      label: () => labelKey ? t(labelKey) : templateLabel,
      onClick: () => addWidget(widget, {
        onCreateCallback: (widget: BlockType) => {
          if (block && BlockLanguageEnum.SQL !== block.language) {
            if ([StatusTypeEnum.EXECUTED, StatusTypeEnum.UPDATED].includes(block.status)) {
              runBlock?.({
                block: widget,
                code: widget.content,
                disableReset: true,
              });
            } else {
              runBlock?.({
                block,
                runDownstream: true,
              });
            }
          }
        },
      }),
      uuid: templateLabel,
    };
  }), [
    addWidget,
    block,
    chartTemplateLabelKeys,
    runBlock,
    t,
  ]);

  const items = [
    {
      isGroupingTitle: true,
      label: () => t('pipeline_detail.code_block.custom_charts'),
      uuid: 'custom_charts',
    },
    ...chartMenuItems,
  ];

  if (BlockLanguageEnum.SQL !== block.language) {
    items.push(...[
      {
        isGroupingTitle: true,
        label: () => t('templates.title'),
        uuid: 'chart_templates',
      },
      ...chartTemplateMenuItems,
    ]);
  }

  return (
    <FlyoutMenu
      items={items}
      left={left}
      onClickCallback={onClickCallback}
      open={open}
      parentRef={parentRef}
      rightOffset={rightOffset}
      topOffset={topOffset}
      uuid="CommandButtons/add_charts"
      width={UNIT * 25}
    />
  );
}

export default AddChartMenu;
