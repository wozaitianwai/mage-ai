import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeContext } from 'styled-components';
import { useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';

import AutocompleteItemType from '@interfaces/AutocompleteItemType';
import BlockType, {
  BlockLanguageEnum,
  BLOCK_TYPES_NOT_SUPPORTED_WITH_CHARTS,
  BlockTypeEnum,
  OutputType,
  StatusTypeEnum,
} from '@interfaces/BlockType';
import ChartController from './ChartController';
import Chip from '@oracle/components/Chip';
import CodeEditor, { CodeEditorSharedProps } from '@components/CodeEditor';
import CodeOutput from '@components/CodeBlock/CodeOutput';
import Col from '@components/shared/Grid/Col';
import ErrorsType from '@interfaces/ErrorsType';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import KernelOutputType, { DataTypeEnum, ExecutionStateEnum } from '@interfaces/KernelOutputType';
import KeyboardShortcutButton from '@oracle/elements/Button/KeyboardShortcutButton';
import LabelWithValueClicker from '@oracle/components/LabelWithValueClicker';
import Link from '@oracle/elements/Link';
import MultiSelect from '@oracle/elements/Inputs/MultiSelect';
import PipelineType from '@interfaces/PipelineType';
import Select from '@oracle/elements/Inputs/Select';
import Spacing from '@oracle/elements/Spacing';
import Spinner from '@oracle/components/Spinner';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
import Tooltip from '@oracle/components/Tooltip';
import api from '@api';
import buildAutocompleteProvider from '@components/CodeEditor/autocomplete';
import dark from '@oracle/styles/themes/dark';
import usePrevious from '@utils/usePrevious';
import {
  AGGREGATE_FUNCTIONS,
  CHART_TYPES,
  ChartStyleEnum,
  ChartTypeEnum,
  ConfigurationType,
  SortOrderEnum,
  VARIABLE_NAMES,
  VARIABLE_NAME_CHART_STYLE,
  VARIABLE_NAME_TIME_INTERVAL,
  VARIABLE_NAME_WIDTH_PERCENTAGE,
  VARIABLE_NAME_Y_SORT_ORDER,
} from '@interfaces/ChartBlockType';
import {
  CONFIGURATIONS_BY_CHART_TYPE,
  ConfigurationItemType,
  ConfigurationOptionType,
  DEFAULT_SETTINGS_BY_CHART_TYPE,
  VARIABLE_INFO_BY_CHART_TYPE,
} from './constants';
import {
  ChartBlockStyle,
  CodeHelperStyle,
  CodeStyle,
  ConfigurationOptionsStyle,
} from './index.style';
import { Edit, PlayButtonFilled, Trash } from '@oracle/icons';
import { KEY_CODE_ENTER, KEY_CODE_META } from '@utils/hooks/keyboardShortcuts/constants';
import { UNIT } from '@oracle/styles/units/spacing';
import { capitalize, isJsonString } from '@utils/string';
import { getColorsForBlockType } from '@components/CodeBlock/index.style';
import { indexBy, remove, sortByKey } from '@utils/array';
import { isEmptyObject } from '@utils/hash';
import { onSuccess } from '@api/utils/response';
import { useKeyboardContext } from '@context/Keyboard';

const chartLabelKey = (labelValue: string) =>
  labelValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

export type ChartPropsShared = {
  autocompleteItems: AutocompleteItemType[];
  blockRefs: any;
  blocks: BlockType[];
  chartRefs: any;
  deleteWidget: (block: BlockType) => void;
  fetchPipeline: () => void;
  fetchFileTree: () => void;
  pipeline: PipelineType;
  runBlock: (
    payload: {
      block: BlockType;
      code: string;
      ignoreAlreadyRunning?: boolean;
      runUpstream?: boolean;
    },
    opts?: {
      skipUpdating?: boolean;
    },
  ) => Promise<any> | void;
  runningBlocks: BlockType[];
  savePipelineContent: () => Promise<any>;
  setAnyInputFocused: (value: boolean) => void;
  setErrors: (errors: ErrorsType) => void;
  setSelectedBlock: (block: BlockType) => void;
  updateWidget: (block: BlockType) => void;
  width?: number;
} & CodeEditorSharedProps;

type ChartBlockType = {
  block: BlockType;
  executionState: ExecutionStateEnum;
  messages: KernelOutputType[];
  onChangeContent: (value: string) => void;
} & ChartPropsShared;

function ChartBlock(
  {
    autocompleteItems,
    block,
    blockRefs,
    blocks,
    deleteWidget,
    executionState,
    fetchPipeline,
    fetchFileTree,
    messages = [],
    onChangeContent,
    pipeline,
    runBlock,
    runningBlocks,
    savePipelineContent,
    selected,
    setAnyInputFocused,
    setErrors,
    setSelectedBlock,
    setTextareaFocused,
    textareaFocused,
    updateWidget,
    width,
  }: ChartBlockType,
  ref,
) {
  const refChartContainer = useRef(null);
  const themeContext = useContext(ThemeContext);
  const { t } = useTranslation('common');

  const { data: dataBlock } = api.blocks.pipelines.detail(
    encodeURIComponent(pipeline?.uuid),
    encodeURIComponent(block?.upstream_blocks[0]),
  );
  const outputs = dataBlock?.block?.outputs || block?.outputs || [];

  const [autocompleteProviders, setAutocompleteProviders] = useState(null);
  const [chartType, setChartType] = useState<ChartTypeEnum>(block.configuration?.chart_type);
  const [configuration, setConfiguration] = useState<ConfigurationType>(block.configuration);
  const [content, setContent] = useState<string>(block.content);
  const [isEditing, setIsEditing] = useState<boolean>(!chartType || outputs.length === 0);
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [chartWidth, setChartWidth] = useState<number>(null);
  const [upstreamBlocks, setUpstreamBlocks] = useState<string[]>(block?.upstream_blocks);
  const [runCount, setRunCount] = useState<number>(outputs?.length || 0);
  const [newBlockUuid, setNewBlockUuid] = useState(block.uuid);

  const configurationOptions = CONFIGURATIONS_BY_CHART_TYPE[chartType];
  const defaultSettings = DEFAULT_SETTINGS_BY_CHART_TYPE[chartType];
  const chartTypeLabels = useMemo(
    () => ({
      [ChartTypeEnum.BAR_CHART]: t('pipeline_detail.code_block.chart_types.bar_chart'),
      [ChartTypeEnum.HISTOGRAM]: t('pipeline_detail.code_block.chart_types.histogram'),
      [ChartTypeEnum.LINE_CHART]: t('pipeline_detail.code_block.chart_types.line_chart'),
      [ChartTypeEnum.PIE_CHART]: t('pipeline_detail.code_block.chart_types.pie_chart'),
      [ChartTypeEnum.TABLE]: t('pipeline_detail.code_block.chart_types.table'),
      [ChartTypeEnum.TIME_SERIES_BAR_CHART]: t(
        'pipeline_detail.code_block.chart_types.time_series_bar_chart',
      ),
      [ChartTypeEnum.TIME_SERIES_LINE_CHART]: t(
        'pipeline_detail.code_block.chart_types.time_series_line_chart',
      ),
    }),
    [t],
  );
  const optionLabel = useCallback(
    (uuid: string, value: string | null) => {
      if (uuid === VARIABLE_NAME_CHART_STYLE) {
        if (value === ChartStyleEnum.HORIZONTAL) {
          return t('pipeline_detail.chart_block.options.chart_style.horizontal', {
            defaultValue: value,
          });
        }
        if (value === ChartStyleEnum.VERTICAL) {
          return t('pipeline_detail.chart_block.options.chart_style.vertical', {
            defaultValue: value,
          });
        }
      }

      if (uuid === VARIABLE_NAME_Y_SORT_ORDER) {
        if (value === null) {
          return t('pipeline_detail.chart_block.options.sort_direction.none', {
            defaultValue: 'none',
          });
        }
        if (value === SortOrderEnum.ASCENDING) {
          return t('pipeline_detail.chart_block.options.sort_direction.ascending', {
            defaultValue: value,
          });
        }
        if (value === SortOrderEnum.DESCENDING) {
          return t('pipeline_detail.chart_block.options.sort_direction.descending', {
            defaultValue: value,
          });
        }
      }

      if (uuid === VARIABLE_NAME_TIME_INTERVAL && value) {
        return t(`pipeline_detail.chart_block.options.time_interval.${value}`, {
          defaultValue: value,
        });
      }

      return value;
    },
    [t],
  );
  const blocksOfType = useMemo(
    () =>
      blocks?.filter(({ type }: BlockType) =>
        !BLOCK_TYPES_NOT_SUPPORTED_WITH_CHARTS.includes(type),
      ),
    [blocks],
  );
  const blocksMapping = useMemo(
    () => indexBy(blocksOfType, ({ uuid }: BlockType) => uuid),
    [blocksOfType],
  );

  const isInProgress =
    !!runningBlocks.find(({ uuid }) => uuid === block.uuid) ||
    (messages?.length >= 1 && executionState !== ExecutionStateEnum.IDLE);

  const messagesWithType = useMemo(
    () => messages?.filter((kernelOutput: KernelOutputType) => kernelOutput?.type),
    [messages],
  );
  const hasError = !!messagesWithType.find(({ error }) => error);
  const hasOutput = messagesWithType.length >= 1;
  const borderColorShareProps = useMemo(
    () => ({
      blockType: block.type,
      hasError,
      selected,
    }),
    [block.type, hasError, selected],
  );

  const chartData = useMemo(() => {
    let chartData2;
    let chartDataRaw;

    if (messagesWithType?.length) {
      const messagesIndex = messagesWithType.length - 1;
      chartDataRaw = messagesWithType?.[messagesIndex]?.data?.[0]
        // @ts-ignore
        || messagesWithType?.[messagesIndex]?.data?.data?.[0];
    }

    if (chartDataRaw) {
      chartDataRaw = chartDataRaw.slice(1, chartDataRaw.length - 1);
      chartDataRaw = chartDataRaw.replaceAll('\\"', '"').replaceAll('\\\'', '\'');
      if (isJsonString(chartDataRaw)) {
        chartData2 = JSON.parse(chartDataRaw);
      }
    } else if (outputs?.length >= 1) {
      chartData2 = {};

      outputs.forEach((output: OutputType) => {
        const { text_data: textData, type: outputType, variable_uuid: variableUUID } = output || {};
        if (DataTypeEnum.TEXT === outputType && isJsonString(textData)) {
          chartData2[variableUUID] = JSON.parse(textData);
        }
      });
    }

    return chartData2;
  }, [
    messagesWithType,
    outputs,
  ]);

  const saveAndRun = useCallback(
    (data: BlockType) => {
      const widget = {
        ...block,
        ...data,
        configuration: {
          ...block.configuration,
          ...data.configuration,
        },
      };

      savePipelineContent().then(() => {
        runBlock({
          block: widget,
          code: content,
          ignoreAlreadyRunning: true,
          runUpstream: !!upstreamBlocks.find(
            (uuid: string) =>
              ![StatusTypeEnum.EXECUTED, StatusTypeEnum.UPDATED].includes(
                blocksMapping[uuid]?.status,
              ),
          ),
        });
      });

      setRunCount((runCountPrev) => runCountPrev + 1);
    },
    [block, blocksMapping, content, runBlock, savePipelineContent, setRunCount, upstreamBlocks],
  );

  const updateContent = useCallback(
    (val: string) => {
      setContent(val);
      onChangeContent(val);
    },
    [onChangeContent, setContent],
  );
  const updateConfiguration = useCallback(
    (
      data: {
        [key: string]: string | number;
      },
      opts: {
        autoRun?: boolean;
      } = {},
    ) => {
      const { autoRun } = opts;

      setConfiguration((config) => ({
        ...config,
        ...data,
      }));

      const widget = {
        ...block,
        configuration: {
          ...configuration,
          ...data,
          chart_type: chartType,
        },
      };
      updateWidget(widget);

      if (runCount && autoRun) {
        saveAndRun(widget);
      }
    },
    [block, chartType, configuration, runCount, saveAndRun, setConfiguration, updateWidget],
  );

  useEffect(() => {
    setAutocompleteProviders({
      python: buildAutocompleteProvider({
        autocompleteItems,
        block,
        blocks,
        pipeline,
      }),
    });
  }, [autocompleteItems, block, blocks, pipeline]);

  const codeEditorEl = useMemo(
    () => (
      <CodeEditor
        autoHeight
        autocompleteProviders={autocompleteProviders}
        onChange={updateContent}
        selected={selected}
        setSelected={(value: boolean) => setSelectedBlock(value === true ? block : null)}
        setTextareaFocused={setTextareaFocused}
        showLineNumbers={false}
        textareaFocused={textareaFocused || (ChartTypeEnum.TABLE === chartType && !isEditing)}
        value={content}
        width="100%"
      />
    ),
    [
      autocompleteProviders,
      block,
      chartType,
      content,
      isEditing,
      selected,
      setSelectedBlock,
      setTextareaFocused,
      textareaFocused,
      updateContent,
    ],
  );

  const codeOutputEl = useMemo(
    () =>
      (hasError || hasOutput) && (
        <CodeOutput
          {...borderColorShareProps}
          block={block}
          contained={false}
          hideExtraInfo
          isInProgress={isInProgress}
          messages={messagesWithType}
          selected={selected}
        />
      ),
    [block, borderColorShareProps, hasError, hasOutput, isInProgress, messagesWithType, selected],
  );

  const widthPercentage = useMemo(
    () => configuration[VARIABLE_NAME_WIDTH_PERCENTAGE] || 1,
    [configuration],
  );

  const isEditingPrevious = usePrevious(isEditing);
  const widthPrevious = usePrevious(width);
  const widthPercentagePrevious = usePrevious(configuration?.[VARIABLE_NAME_WIDTH_PERCENTAGE]);
  useEffect(() => {
    const rect = refChartContainer?.current?.getBoundingClientRect();
    if (
      isEditingPrevious !== isEditing ||
      widthPrevious !== width ||
      widthPercentagePrevious !== widthPercentage
    ) {
      setChartWidth(0);
      setTimeout(() => {
        const w = refChartContainer?.current?.getBoundingClientRect()?.width;
        if (w) {
          setChartWidth(w);
        }
      }, 100);
    } else if (rect) {
      setChartWidth(rect.width);
    }
  }, [
    isEditing,
    isEditingPrevious,
    refChartContainer,
    setChartWidth,
    width,
    widthPrevious,
    widthPercentage,
    widthPercentagePrevious,
  ]);

  const availableVariables = useMemo(() => {
    const arr = [];

    upstreamBlocks.forEach((blockUUID: string, idx: number) => {
      const b = blocksMapping[blockUUID];
      const blockColor = getColorsForBlockType(b?.type, {
        blockColor: b?.color,
        theme: themeContext,
      }).accent;

      arr.push(
        <Spacing key={blockUUID} ml={2}>
          <Text bold inline monospace small>
            df_{idx + 1}
          </Text>{' '}
          <Text inline monospace muted small>
            {'->'}
          </Text>{' '}
          <Link
            color={blockColor}
            inline
            onClick={() => {
              const refBlock = blockRefs?.current?.[`${b?.type}s/${b?.uuid}.py`];
              refBlock?.current?.scrollIntoView();
            }}
            preventDefault
            small
          >
            <Text color={blockColor} inline monospace small>
              {blockUUID}
            </Text>
          </Link>
        </Spacing>,
      );
    });

    return arr;
  }, [blockRefs, blocksMapping, themeContext, upstreamBlocks]);

  const variablesMustDefine = useMemo(() => {
    const arr = [];

    // @ts-ignore
    const vars = configurationOptions?.code?.reduce(
      (acc, { uuid }) => (VARIABLE_NAMES.includes(uuid) ? acc.concat(uuid) : acc),
      [],
    );

    vars?.forEach((varName: string) => {
      const varNameValue = configuration[varName];
      if (varNameValue) {
        const info = VARIABLE_INFO_BY_CHART_TYPE[chartType]?.[varName]?.();

        arr.push(
          <Spacing key={varNameValue} ml={2}>
            <Text bold inline monospace small>
              {varNameValue}
            </Text>{' '}
            {info && (
              <>
                <Text inline monospace muted small>
                  {'->'}
                </Text>{' '}
                <Text default inline small>
                  {info}
                </Text>
              </>
            )}
          </Spacing>,
        );
      }
    });

    return arr;
  }, [chartType, configuration, configurationOptions]);

  const chartTypePrevious = usePrevious(chartType);
  const upstreamBlocksPrevious = usePrevious(upstreamBlocks);
  useEffect(() => {
    if (
      (!chartTypePrevious && chartType && upstreamBlocks?.length) ||
      (!upstreamBlocksPrevious?.length && upstreamBlocks?.length >= 1 && chartType)
    ) {
      if (!content && isEmptyObject(configuration) && defaultSettings) {
        const blockUpdated = {
          ...block,
          upstream_blocks: upstreamBlocks,
        };
        if (defaultSettings.configuration) {
          updateConfiguration(defaultSettings.configuration(blockUpdated));
        }
        // @ts-ignore
        if (defaultSettings.content) {
          // @ts-ignore
          updateContent(defaultSettings.content(blockUpdated));
        }
      }
    }
  }, [
    block,
    chartType,
    chartTypePrevious,
    configuration,
    content,
    defaultSettings,
    updateConfiguration,
    updateContent,
    upstreamBlocks,
    upstreamBlocksPrevious,
  ]);

  const {
    code: configurationOptionsElsForCode,
    noCode: configurationOptionsEls,
  }: {
    code?: ConfigurationOptionType[];
    noCode: ConfigurationOptionType[];
  } = useMemo(
    () =>
      Object.entries(configurationOptions || {}).reduce(
        (acc, [key, arr]) => ({
          ...acc,
          [key]: arr.map(({ autoRun, label, monospace, options, settings = {}, type, uuid }) => {
            const labelValue = label();
            const labelKey = chartLabelKey(labelValue);
            const labelText = t(`pipeline_detail.chart_block.labels.${labelKey}`, {
              defaultValue: capitalize(labelValue),
            });
            let el;
            const sharedProps = {
              fullWidth: true,
              key: uuid,
              label: labelText,
              monospace: monospace,
              onBlur: () => setSelectedBlock(block),
              onChange: (e) =>
                updateConfiguration(
                  {
                    [uuid]: e.target.value,
                  },
                  {
                    autoRun,
                  },
                ),
              onFocus: () => setSelectedBlock(block),
              value: configuration?.[uuid] || '',
            };

            const blocks = dataBlock?.block ? [dataBlock.block] : [];

            const columns = blocks.reduce((acc, { outputs }) => {
              if (!outputs) {
                return acc;
              }

              return acc.concat(
                outputs.reduce((acc2, { sample_data: sampleData }) => {
                  if (sampleData?.columns) {
                    return acc2.concat(sampleData?.columns?.filter((v) => !acc2.includes(v)));
                  }

                  return acc2;
                }, []),
              );
            }, []);

            if (ConfigurationItemType.COLUMNS === type) {
              const columnsFromConfig = configuration[uuid] || [];

              el = (
                <>
                  {(!settings.maxValues || columnsFromConfig.length < settings.maxValues) && (
                    <Select
                      {...sharedProps}
                      onChange={(e) => {
                        let arr = configuration[uuid] || [];
                        const column = e.target.value;
                        if (arr.includes(column)) {
                          arr = remove(arr, (v) => v === column);
                        } else {
                          arr.push(column);
                        }

                        updateConfiguration(
                          {
                            [uuid]: arr,
                          },
                          {
                            autoRun,
                          },
                        );
                      }}
                      value={null}
                    >
                      {sortByKey(
                        columns.filter((col) => !columnsFromConfig.includes(col)),
                        (v) => v,
                      ).map((val: string) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </Select>
                  )}

                  {columnsFromConfig.map((col: string) => (
                    <div
                      key={col}
                      style={{
                        display: 'inline-block',
                        marginRight: 2,
                        marginTop: 2,
                      }}
                    >
                      <Chip
                        label={col}
                        onClick={() => {
                          updateConfiguration(
                            {
                              [uuid]: remove(columnsFromConfig, (v) => v === col),
                            },
                            {
                              autoRun,
                            },
                          );
                        }}
                      />
                    </div>
                  ))}
                </>
              );
            } else if (ConfigurationItemType.METRICS === type) {
              const metricsFromConfig = configuration[uuid] || [];

              el = (
                <>
                  <Text bold>{t('pipeline_detail.chart_block.metrics.title')}</Text>
                  <Text muted small>
                    {t('pipeline_detail.chart_block.metrics.description')}
                  </Text>
                  <MultiSelect
                    onChange={(values, { resetValues, setValues }) => {
                      // @ts-ignore
                      if (values.filter((v) => !!v).length === 2) {
                        const existingMetric = metricsFromConfig.find(
                          ({ aggregation, column }) =>
                            column === values[1] && aggregation === values[0],
                        );

                        if (!existingMetric) {
                          updateConfiguration(
                            {
                              [uuid]: metricsFromConfig.concat({
                                aggregation: values[0],
                                column: values[1],
                              }),
                            },
                            {
                              autoRun,
                            },
                          );
                          setValues([null, null]);
                          resetValues();
                        }
                      }
                      }}
                    >
                    <Select
                      {...sharedProps}
                      label={t('pipeline_detail.chart_block.metrics.aggregation', {
                        defaultValue: 'aggregation',
                      })}
                    >
                      {sortByKey(AGGREGATE_FUNCTIONS, (v) => v).map((val: string) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </Select>

                    <Select
                      {...sharedProps}
                      label={t('pipeline_detail.chart_block.metrics.column', {
                        defaultValue: 'column',
                      })}
                    >
                      {sortByKey(columns, (v) => v).map((val: string) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </Select>
                  </MultiSelect>

                  {metricsFromConfig.map(({ aggregation, column }) => (
                    <div
                      key={`${aggregation}(${column})`}
                      style={{
                        display: 'inline-block',
                        marginRight: 2,
                        marginTop: 2,
                      }}
                    >
                      <Chip
                        label={
                          <>
                            <Text inline monospace>
                              {aggregation}(
                            </Text>
                            {column}
                            <Text inline monospace>
                              )
                            </Text>
                          </>
                        }
                        onClick={() => {
                          updateConfiguration(
                            {
                              [uuid]: remove(
                                metricsFromConfig,
                                ({ aggregation: aggregation2, column: column2 }) =>
                                  aggregation === aggregation2 && column === column2,
                              ),
                            },
                            {
                              autoRun,
                            },
                          );
                        }}
                      />
                    </div>
                  ))}
                </>
              );
            } else if (options) {
              el = (
                <Select {...sharedProps}>
                  {options.map((val: string | null) => (
                    <option key={`${uuid}-${String(val)}`} value={val}>
                      {optionLabel(uuid, val)}
                    </option>
                  ))}
                </Select>
              );
            } else {
              el = <TextInput {...sharedProps} type={type} />;
            }

            return (
              <Spacing key={uuid} mb={1}>
                {el}
              </Spacing>
            );
          }),
        }),
        {
          noCode: [],
        },
      ),
    [
      block,
      configuration,
      configurationOptions,
      dataBlock,
      optionLabel,
      setSelectedBlock,
      t,
      updateConfiguration,
    ],
  );

  const [updateBlock]: any = useMutation(
    api.widgets.pipelines.useUpdate(
      encodeURIComponent(pipeline?.uuid),
      encodeURIComponent(block.uuid),
    ),
    {
      onSuccess: (response: any) =>
        onSuccess(response, {
          callback: () => {
            setIsEditingBlock(false);
            fetchPipeline();
            fetchFileTree?.();
          },
          onErrorCallback: (response, errors) =>
            setErrors?.({
              errors,
              response,
            }),
        }),
    },
  );

  const uuidKeyboard = `ChartBlock/${block.uuid}`;
  const { registerOnKeyDown, unregisterOnKeyDown } = useKeyboardContext();

  useEffect(
    () => () => {
      unregisterOnKeyDown(uuidKeyboard);
    },
    [unregisterOnKeyDown, uuidKeyboard],
  );

  registerOnKeyDown(
    uuidKeyboard,
    (event, keyMapping, keyHistory) => {
      if (
        isEditingBlock &&
        String(keyHistory[0]) === String(KEY_CODE_ENTER) &&
        String(keyHistory[1]) !== String(KEY_CODE_META)
      ) {
        updateBlock({
          widget: {
            ...block,
            name: newBlockUuid,
          },
        });
      }
    },
    [block, isEditingBlock, newBlockUuid, updateBlock],
  );

  return (
    <Col md={12 * widthPercentage} sm={12}>
      <ChartBlockStyle ref={ref}>
        <Spacing mt={1} pt={1} px={1}>
          <FlexContainer alignItems="center" fullWidth justifyContent="space-between">
            <Flex flex={1} style={{ position: 'relative' }}>
              <LabelWithValueClicker
                bold={false}
                fullWidth
                inputValue={newBlockUuid}
                inputWidth={ref?.current?.getBoundingClientRect()?.width < 265 ? UNIT * 7 : null}
                notRequired
                onBlur={() => setTimeout(() => setIsEditingBlock(false), 300)}
                onChange={(e) => {
                  setNewBlockUuid(e.target.value);
                  e.preventDefault();
                }}
                onClick={() => {
                  setAnyInputFocused(true);
                  setIsEditingBlock(true);
                }}
                onFocus={() => {
                  setAnyInputFocused(true);
                  setIsEditingBlock(true);
                }}
                small
                stacked
                value={!isEditingBlock && block.uuid}
              />

              {isEditingBlock && (
                <>
                  <Spacing ml={1} />

                  <Link
                    noWrapping
                    onClick={() =>
                      updateBlock({
                        widget: {
                          ...block,
                          name: newBlockUuid,
                        },
                      })
                    }
                    preventDefault
                    sameColorAsText
                    small
                  >
                    {t('pipeline_detail.chart_block.update_chart_name')}
                  </Link>
                </>
              )}
            </Flex>

            <Spacing mr={1} />

            <FlexContainer alignItems="center">
              <Select
                compact
                onChange={(e) => {
                  const value = [e.target.value];
                  const widget = {
                    ...block,
                    upstream_blocks: value,
                  };
                  updateWidget(widget);
                  saveAndRun(widget);
                  setUpstreamBlocks(value);
                }}
                placeholder={t('pipeline_detail.chart_block.source_block')}
                small
                value={upstreamBlocks?.[0] || ''}
              >
                {blocksOfType?.map(({ uuid }: BlockType) => (
                  <option key={uuid} value={uuid}>
                    {uuid}
                  </option>
                ))}
              </Select>

              <Spacing mr={1} />

              {!isInProgress && (
                <Tooltip
                  appearBefore
                  default
                  label={t('pipeline_detail.chart_block.run_chart_block')}
                  size={null}
                  widthFitContent
                >
                  <KeyboardShortcutButton
                    blackBorder
                    compact
                    inline
                    onClick={() => saveAndRun(block)}
                    uuid={`ChartBlock/run/${block.uuid}`}
                  >
                    <PlayButtonFilled size={UNIT * 2} />
                  </KeyboardShortcutButton>
                </Tooltip>
              )}

              {ExecutionStateEnum.QUEUED === executionState && (
                <Spinner color={(themeContext || dark).content.active} small type="cylon" />
              )}
              {ExecutionStateEnum.BUSY === executionState && (
                <Spinner color={(themeContext || dark).content.active} small />
              )}

              <Spacing mr={1} />

              <Tooltip
                appearBefore
                default
                label={t('pipeline_detail.chart_block.edit_chart')}
                size={null}
                widthFitContent
              >
                <KeyboardShortcutButton
                  blackBorder
                  compact
                  inline
                  onClick={() => setIsEditing((prev) => !prev)}
                  selected={isEditing}
                  uuid={`ChartBlock/edit/${block.uuid}`}
                >
                  <Edit size={UNIT * 2} />
                </KeyboardShortcutButton>
              </Tooltip>

              <Spacing mr={1} />

              <Tooltip
                appearBefore
                default
                label={t('pipeline_detail.chart_block.delete_chart')}
                size={null}
                widthFitContent
              >
                <KeyboardShortcutButton
                  blackBorder
                  compact
                  inline
                  onClick={() => deleteWidget(block)}
                  uuid={`ChartBlock/delete/${block.uuid}`}
                >
                  <Trash size={UNIT * 2} />
                </KeyboardShortcutButton>
              </Tooltip>
            </FlexContainer>
          </FlexContainer>
        </Spacing>

        <Spacing mt={1} />

        <FlexContainer fullWidth justifyContent="space-between">
          <Flex flex={6} ref={refChartContainer}>
            {chartData && !isEmptyObject(chartData) && (
              <Spacing pb={3}>
                <ChartController
                  block={{
                    ...block,
                    configuration: {
                      ...block.configuration,
                      ...configuration,
                    },
                  }}
                  data={chartData}
                  width={chartWidth}
                />
              </Spacing>
            )}
          </Flex>

          {isEditing && (
            <ConfigurationOptionsStyle>
              <FlexContainer flexDirection="column" fullWidth>
                <Spacing mb={1}>
                  <Select
                    onChange={(e) => {
                      const value = e.target.value;
                      const widget = {
                        ...block,
                        configuration: {
                          ...configuration,
                          chart_type: value,
                        },
                      };
                      updateWidget(widget);
                      saveAndRun(widget);
                      setChartType(value);
                    }}
                    placeholder={t('pipeline_detail.chart_block.select_chart_type')}
                    value={chartType}
                  >
                    {CHART_TYPES.map((chartType: string) => (
                      <option key={chartType} value={chartType}>
                        {chartTypeLabels[chartType] || capitalize(chartType)}
                      </option>
                    ))}
                  </Select>
                </Spacing>

                <Spacing mb={1}>
                  <Select
                    onChange={(e) =>
                      updateConfiguration({
                        [VARIABLE_NAME_WIDTH_PERCENTAGE]: e.target.value,
                      })
                    }
                    placeholder={t('pipeline_detail.chart_block.chart_width')}
                    value={configuration?.[VARIABLE_NAME_WIDTH_PERCENTAGE] || 1}
                  >
                    {[
                      [t('pipeline_detail.chart_block.width_options.half'), 0.5],
                      [t('pipeline_detail.chart_block.width_options.full'), 1],
                    ].map(([label, value]) => (
                      <option key={label} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Spacing>

                {configurationOptionsEls}
              </FlexContainer>
            </ConfigurationOptionsStyle>
          )}
        </FlexContainer>

        {isEditing &&
          !!configurationOptionsElsForCode?.length &&
          BlockLanguageEnum.SQL !== block.language && (
            <>
              <Spacing my={1} px={1}>
                <Text bold>{t('pipeline_detail.chart_block.custom_chart_code')}</Text>
                <Text muted>
                  {t('pipeline_detail.chart_block.custom_chart_code_description.line1')}
                  <br />
                  {t('pipeline_detail.chart_block.custom_chart_code_description.line2')}
                </Text>
              </Spacing>

              <CodeStyle>
                {upstreamBlocks.length >= 1 && (
                  <CodeHelperStyle>
                    <div>
                      <Text inline muted small>
                        {t('pipeline_detail.chart_block.variables_available')}
                      </Text>{' '}
                      {availableVariables}
                    </div>
                    <div>
                      <Text inline muted small>
                        {t('pipeline_detail.chart_block.variables_required')}
                      </Text>{' '}
                      {variablesMustDefine}
                    </div>
                  </CodeHelperStyle>
                )}

                {codeEditorEl}
              </CodeStyle>
            </>
          )}

        {codeOutputEl && <Spacing px={1}>{codeOutputEl}</Spacing>}
      </ChartBlockStyle>
    </Col>
  );
}

export default React.forwardRef(ChartBlock);
