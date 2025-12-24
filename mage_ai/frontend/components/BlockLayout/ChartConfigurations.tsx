import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Chip from '@oracle/components/Chip';
import FlexContainer from '@oracle/components/FlexContainer';
import MultiSelect from '@oracle/elements/Inputs/MultiSelect';
import Select from '@oracle/elements/Inputs/Select';
import ToggleSwitch from '@oracle/elements/Inputs/ToggleSwitch';
import Spacing from '@oracle/elements/Spacing';
import Spinner from '@oracle/components/Spinner';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
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
} from '@components/ChartBlock/constants';
import { capitalize } from '@utils/string';
import { remove, sortByKey } from '@utils/array';
import TextArea from '@oracle/elements/Inputs/TextArea';
import Panel from '@oracle/components/Panel';
import { PADDING_UNITS } from 'oracle/styles/units/spacing';
import { dig, setNested } from '@utils/hash';
import BlockLayoutItemType from '@interfaces/BlockLayoutItemType';

const chartLabelKey = (labelValue: string) =>
  labelValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

function ChartConfigurations({
  block,
  updateConfiguration,
}: {
  block: BlockLayoutItemType;
  updateConfiguration: (configuration: ConfigurationType, options?: { autoRun?: boolean, skip_render?: boolean }) => void;
}) {
  const { t } = useTranslation('common');
  const { data, configuration } = block || {};
  const { chart_type: chartType } = configuration || {};
  const { columns } = data || {};
  const configurationOptions = CONFIGURATIONS_BY_CHART_TYPE[chartType];
  const optionLabel = useMemo(
    () =>
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
          [key]: arr.map(
            ({ autoRun, description, label, monospace, options, settings = {}, type, uuid }) => {
              const labelValue = label();
              const labelKey = chartLabelKey(labelValue);
              const labelText = t(`pipeline_detail.chart_block.labels.${labelKey}`, {
                defaultValue: capitalize(labelValue),
              });
              const renderWithLabelDescription = (
                elInit?: JSX.Element,
                opts?: {
                  inline?: boolean;
                },
              ) => {
                const { inline } = opts || {
                  inline: false,
                };
                const elMore = (
                  <>
                    <Text bold>{sharedProps?.label}</Text>
                    {description && (
                      <Spacing mb={1}>
                        {(Array.isArray(description) ? description : [description]).map(
                          (desc, i) => (
                            <Text key={`${desc}-${i}`} monospace={monospace} muted xsmall>
                              <span dangerouslySetInnerHTML={{ __html: desc }} />
                            </Text>
                          ),
                        )}
                      </Spacing>
                    )}
                    {elInit && <Spacing mt={2}>{elInit}</Spacing>}
                  </>
                );

                if (inline) {
                  return elMore;
                }

                return <Panel>{elMore}</Panel>;
              };

              let el;
              const sharedProps = {
                fullWidth: true,
                key: uuid,
                label: labelText,
                monospace: monospace,
                // onBlur: () => setSelectedBlock(block),
                onChange: e =>
                  updateConfiguration(
                    {
                      ...setNested(configuration, uuid, e.target.value),
                    },
                    {
                      autoRun,
                    },
                  ),
                // onFocus: () => setSelectedBlock(block),
                value: configuration ? dig(configuration || {}, uuid) : '',
              };

              if (ConfigurationItemType.COLUMNS === type) {
                const columnsFromConfig = configuration[uuid] || [];

                el = (
                  <>
                    {(!settings.maxValues || columnsFromConfig.length < settings.maxValues) && (
                      <Select
                        {...sharedProps}
                        onChange={e => {
                          let arr = configuration[uuid] || [];
                          const column = e.target.value;
                          if (arr.includes(column)) {
                            arr = remove(arr, v => v === column);
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
                          (columns || []).filter(col => !columnsFromConfig.includes(col)),
                          v => v,
                        ).map((val: string) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </Select>
                    )}
                    {columnsFromConfig.length > 0 && <div style={{ marginTop: 4 }} />}
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
                                [uuid]: remove(columnsFromConfig, v => v === col),
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
                        if (values.filter(v => !!v).length === 2) {
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
                        {sortByKey(AGGREGATE_FUNCTIONS, v => v).map((val: string) => (
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
                        {sortByKey(columns || [], v => v).map((val: string) => (
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
                          marginTop: 4,
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
              } else if (ConfigurationItemType.CODE === type) {
                el = renderWithLabelDescription(
                  <>
                    <Text monospace small>
                      <Text color="#00CC99" inline monospace small>
                        function
                      </Text>{' '}
                      <Text color="#0080FF" inline monospace small>
                        format
                      </Text>
                      <Text color="#FF9933" inline monospace small>
                        (
                      </Text>
                      <Text color="#00FFFF" inline monospace small>
                        value
                      </Text>
                      ,{' '}
                      <Text color="#00FFFF" inline monospace small>
                        index
                      </Text>
                      ,{' '}
                      <Text color="#00FFFF" inline monospace small>
                        values
                      </Text>
                      <Text color="#FF9933" inline monospace small>
                        )
                      </Text>{' '}
                      <Text color="#FF9933" inline monospace small>
                        {'{'}
                      </Text>
                    </Text>
                    <TextArea
                      {...sharedProps}
                      autoGrow
                      borderless
                      label={null}
                      monospace
                      onChange={e => {
                        updateConfiguration(
                          {
                            [uuid]: e.target.value,
                          },
                          {
                            skip_render: true,
                          },
                        );
                      }}
                      paddingVertical={0}
                      primary
                      rows={1}
                      small
                    />
                    <Text color="#FF9933" inline monospace small>
                      {'}'}
                    </Text>
                  </>,
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
              } else if (ConfigurationItemType.TOGGLE === type) {
                el = (
                  <Spacing mt={PADDING_UNITS}>
                    <FlexContainer alignItems="center">
                      <ToggleSwitch
                        checked={!!sharedProps?.value}
                        compact
                        onCheck={(valFunc: (val: boolean) => boolean) =>
                          sharedProps?.onChange({
                            target: {
                              value: valFunc(sharedProps?.value),
                            },
                          })
                        }
                      />

                      <Spacing mr={PADDING_UNITS} />

                      {renderWithLabelDescription(null, { inline: true })}
                    </FlexContainer>
                  </Spacing>
                );
              } else {
                el = (
                  <TextInput
                    {...sharedProps}
                    label={!description ? sharedProps?.label : undefined}
                    placeholder={description ? sharedProps?.label : undefined}
                    type={type}
                  />
                );

                if (description) {
                  el = renderWithLabelDescription(el);
                }
              }

              return (
                <Spacing key={uuid} mb={1}>
                  {el}
                </Spacing>
              );
            },
          ),
        }),
        {
          noCode: [],
        },
      ),
    [
      // block,
      columns,
      configuration,
      configurationOptions,
      // dataBlock,
      // setSelectedBlock,
      t,
      updateConfiguration,
    ],
  );

  return <>{configurationOptionsEls}</>;
}

export default ChartConfigurations;
