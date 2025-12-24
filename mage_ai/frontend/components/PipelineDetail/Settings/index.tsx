import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@oracle/elements/Button';
import Checkbox from '@oracle/elements/Checkbox';
import FlexContainer from '@oracle/components/FlexContainer';
import Headline from '@oracle/elements/Headline';
import Link from '@oracle/elements/Link';
import PipelineType, { ConcurrencyConfigRunLimitReachedActionEnum } from '@interfaces/PipelineType';
import Select from '@oracle/elements/Inputs/Select';
import SetupSection, { SetupSectionRow } from '@components/shared/SetupSection';
import Spacing from '@oracle/elements/Spacing';
import TagType from '@interfaces/TagType';
import TagsAutocompleteInputField from '@components/Tags/TagsAutocompleteInputField';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
import api from '@api';
import usePrevious from '@utils/usePrevious';
import useProject from '@utils/models/project/useProject';
import { EXECUTOR_TYPES } from '@interfaces/ExecutorType';
import {
  LOCAL_STORAGE_KEY_PIPELINE_EDIT_BLOCK_OUTPUT_LOGS,
  LOCAL_STORAGE_KEY_PIPELINE_EDIT_HIDDEN_BLOCKS,
} from '@storage/constants';
import {
  PADDING_UNITS,
  UNITS_BETWEEN_ITEMS_IN_SECTIONS,
  UNITS_BETWEEN_SECTIONS,
} from '@oracle/styles/units/spacing';
import { get, set } from '@storage/localStorage';
import { isEqual } from '@utils/hash';
import { isJsonString } from '@utils/string';
import { pushUnique } from '@utils/array';

type PipelineSettingsProps = {
  isPipelineUpdating?: boolean;
  pipeline: PipelineType;
  updatePipeline: (pipeline: PipelineType) => void;
};

function PipelineSettings({
  isPipelineUpdating,
  pipeline,
  updatePipeline,
}: PipelineSettingsProps) {
  const { t } = useTranslation('common');
  const {
    project,
  } = useProject();
  const refExecutorTypeSelect = useRef(null);
  const refExecutorTypeTextInput = useRef(null);

  const pipelineUUID = pipeline?.uuid;
  const blocks = useMemo(() => pipeline?.blocks || [], [pipeline]);

  const [pipelineAttributesTouched, setPipelineAttributesTouched] = useState<boolean>(false);

  const [editCustomExecutorType, setEditCustomExecutorType] = useState<boolean>(false);
  const [pipelineAttributes, setPipelineAttributesState] = useState<PipelineType>(null);

  const pipelinePrev = usePrevious(pipeline);
  useEffect(() => {
    if (!isEqual(pipeline, pipelinePrev)) {
      setPipelineAttributesState(pipeline);
    }
  }, [
    pipeline,
    pipelinePrev,
  ]);

  const setPipelineAttributes = useCallback((handlePrevious) => {
    setPipelineAttributesTouched(true);
    setPipelineAttributesState(handlePrevious);
  }, []);

  const localStorageHiddenBlocksKey =
    `${LOCAL_STORAGE_KEY_PIPELINE_EDIT_HIDDEN_BLOCKS}_${pipelineUUID}`;
  const [hiddenBlocks, setHiddenBlocksState] = useState<{
    [uuid: string]: boolean;
  }>({});

  const localStorageBlockOutputLogsKey =
    `${LOCAL_STORAGE_KEY_PIPELINE_EDIT_BLOCK_OUTPUT_LOGS}_${pipelineUUID}`;
  const [blockOutputLogs, setBlockOutputLogsState] = useState<boolean>(false);

  const setHiddenBlocks = useCallback((callback) => {
    setHiddenBlocksState((prev) => {
      const data = callback(prev);
      set(localStorageHiddenBlocksKey, JSON.stringify(data));

      return data;
    });
  }, [
    localStorageHiddenBlocksKey,
    setHiddenBlocksState,
  ]);

  const setBlockOutputLogs = useCallback((callback) => {
    setBlockOutputLogsState((prev) => {
      const data = callback(prev);
      set(localStorageBlockOutputLogsKey, data);

      return data;
    });
  }, [
    localStorageBlockOutputLogsKey,
    setBlockOutputLogsState,
  ]);

  useEffect(() => {
    const hiddenBlocksInitString = get(localStorageHiddenBlocksKey);
    if (hiddenBlocksInitString && isJsonString(hiddenBlocksInitString)) {
      setHiddenBlocksState(JSON.parse(hiddenBlocksInitString));
    }
  }, [
    localStorageHiddenBlocksKey,
    setHiddenBlocksState,
  ]);

  useEffect(() => {
    const initValue = get(localStorageBlockOutputLogsKey);
    if (initValue) {
      setBlockOutputLogsState(initValue);
    }
  }, [
    localStorageBlockOutputLogsKey,
    setBlockOutputLogsState,
  ]);

  const executorType = useMemo(() => pipelineAttributes?.executor_type, [pipelineAttributes]);
  useEffect(() => {
    if (!editCustomExecutorType
      && executorType
      && !EXECUTOR_TYPES.find(et => et === executorType)
    ) {
      setEditCustomExecutorType(true);
    }
  }, [
    editCustomExecutorType,
    executorType,
  ]);

  const allBlocksHidden = useMemo(() => {
    const arr = blocks?.filter(({ uuid }) => !!hiddenBlocks?.[uuid]);

    return arr.length === blocks.length;
  }, [
    blocks,
    hiddenBlocks,
  ]);

  const noBlocks = useMemo(() => !blocks?.length, [blocks]);

  const pipelineTags = useMemo(() => pipelineAttributes?.tags || [], [pipelineAttributes]);
  const { data: dataTags } = api.tags.list();
  const unselectedTags =
    useMemo(() => (dataTags?.tags || []).filter(({ uuid }) => !pipelineTags.includes(uuid)), [
      dataTags,
      pipelineTags,
    ]);

  const projectPipelineSettings = useMemo(() => project?.pipelines?.settings, [project]);
  const saveInCodeAutomaticallyToggled =
    useMemo(() => projectPipelineSettings?.triggers?.save_in_code_automatically
      && typeof pipelineAttributes?.settings?.triggers?.save_in_code_automatically === 'undefined',
    [
      pipelineAttributes,
      projectPipelineSettings,
    ]);

  return (
    <Spacing p={PADDING_UNITS}>
      <SetupSection title={t('pipeline_detail.settings.sections.details')}>
        <SetupSectionRow
          invalid={pipelineAttributesTouched && !pipelineAttributes?.name}
          textInput={{
            onChange: e => setPipelineAttributes(prev => ({
              ...prev,
              name: e.target.value,
            })),
            value: pipelineAttributes?.name,
          }}
          title={t('pipeline_detail.settings.pipeline_name')}
        />

        <SetupSectionRow
          textInput={{
            onChange: e => setPipelineAttributes(prev => ({
              ...prev,
              description: e.target.value,
            })),
            placeholder: t('pipeline_detail.settings.pipeline_description_placeholder'),
            value: pipelineAttributes?.description || '',
          }}
          title={t('pipeline_detail.settings.pipeline_description')}
        />

        <SetupSectionRow
          description={t('pipeline_detail.settings.run_pipeline_single_process_description')}
          title={t('pipeline_detail.settings.run_pipeline_single_process')}
          toggleSwitch={{
            checked: !!pipelineAttributes?.run_pipeline_in_one_process,
            onCheck: (valFunc: (val: boolean) => boolean) => setPipelineAttributes(prev => ({
              ...prev,
              run_pipeline_in_one_process: valFunc(prev?.run_pipeline_in_one_process),
            })),
          }}
        />

        <SetupSectionRow
          description={(
            <>
              <Text muted small>
                {t('triggers.save_triggers_description')}
              </Text>

              {projectPipelineSettings?.triggers?.save_in_code_automatically && (
                <Text small warning>
                  {t('pipeline_detail.settings.triggers.project_level_warning')}
                </Text>
              )}
            </>
          )}
          title={t('triggers.save_triggers_automatically')}
          toggleSwitch={{
            checked: saveInCodeAutomaticallyToggled || !!pipelineAttributes?.settings?.triggers?.save_in_code_automatically,
            onCheck: (valFunc: (val: boolean) => boolean) => setPipelineAttributes(prev => ({
              ...prev,
              settings: {
                ...prev?.settings,
                triggers: {
                  ...prev?.settings?.triggers,
                  save_in_code_automatically: valFunc(
                    saveInCodeAutomaticallyToggled ||  prev?.settings?.triggers?.save_in_code_automatically,
                  ),
                },
              },
            })),
          }}
        />
      </SetupSection>

      <Spacing mt={UNITS_BETWEEN_SECTIONS}>
        <SetupSection title={t('pipeline_detail.settings.sections.pipeline_level_concurrency')}>
          <SetupSectionRow
            description={(
              <>
                <Text muted small>
                  {t('pipeline_detail.settings.concurrency.pipeline_run_limit_all_triggers_description')}
                </Text>
              </>
            )}
            textInput={{
              monospace: true,
              onChange: e => setPipelineAttributes(prev => ({
                ...prev,
                concurrency_config: {
                  ...prev?.concurrency_config,
                  pipeline_run_limit_all_triggers: Number(e.target.value),
                },
              })),
              placeholder: t('pipeline_detail.settings.concurrency.pipeline_run_limit_all_triggers_placeholder'),
              type: 'number',
              value: String(pipelineAttributes?.concurrency_config?.pipeline_run_limit_all_triggers || ''),
            }}
            title={t('pipeline_detail.settings.concurrency.pipeline_run_limit_all_triggers_title')}
          />

          <SetupSectionRow
            description={(
              <>
                <Text muted small>
                  {t('pipeline_detail.settings.concurrency.pipeline_run_limit_per_trigger_description')}
                </Text>
              </>
            )}
            textInput={{
              monospace: true,
              onChange: e => setPipelineAttributes(prev => ({
                ...prev,
                concurrency_config: {
                  ...prev?.concurrency_config,
                  pipeline_run_limit: Number(e.target.value),
                },
              })),
              placeholder: t('pipeline_detail.settings.concurrency.pipeline_run_limit_per_trigger_placeholder'),
              type: 'number',
              value: String(pipelineAttributes?.concurrency_config?.pipeline_run_limit || ''),
            }}
            title={t('pipeline_detail.settings.concurrency.pipeline_run_limit_per_trigger_title')}
          />

          <SetupSectionRow
            description={(
              <>
                <Text muted small>
                  {t('pipeline_detail.settings.concurrency.block_run_limit_description')}
                </Text>
              </>
            )}
            textInput={{
              monospace: true,
              onChange: e => setPipelineAttributes(prev => ({
                ...prev,
                concurrency_config: {
                  ...prev?.concurrency_config,
                  block_run_limit: Number(e.target.value),
                },
              })),
              placeholder: t('pipeline_detail.settings.concurrency.block_run_limit_placeholder'),
              type: 'number',
              value: String(pipelineAttributes?.concurrency_config?.block_run_limit || ''),
            }}
            title={t('pipeline_detail.settings.concurrency.block_run_limit_title')}
          />

          <SetupSectionRow
            description={(
              <>
                <Text muted small>
                  {t('pipeline_detail.settings.concurrency.on_limit_reached_description')}
                </Text>
              </>
            )}
            selectInput={{
              onChange: e => setPipelineAttributes(prev => ({
                ...prev,
                concurrency_config: {
                  ...prev?.concurrency_config,
                    on_pipeline_run_limit_reached: e.target.value,
                },
              })),
              options: Object.values(ConcurrencyConfigRunLimitReachedActionEnum)?.map(key => ({
                label: t(`pipeline_detail.settings.concurrency.on_limit_reached_actions.${key}`),
                value: key,
              })),
              placeholder: t('pipeline_detail.settings.select_option_placeholder'),
              value: pipelineAttributes?.concurrency_config?.on_pipeline_run_limit_reached || '',
            }}
            title={t('pipeline_detail.settings.concurrency.on_limit_reached_title')}
          />
        </SetupSection>
      </Spacing>

      <Spacing mt={UNITS_BETWEEN_SECTIONS}>
        <Headline>
          {t('pipeline_detail.settings.executor_type.heading')}
        </Headline>

        <Text muted>
          {t('pipeline_detail.settings.more_info_prefix')}<Link
            href="https://docs.mage.ai/production/configuring-production-settings/compute-resource#2-set-executor-type-and-customize-the-compute-resource-of-the-mage-executor"
            openNewWindow
          >
            {t('pipeline_detail.settings.documentation_link')}
          </Link>{t('pipeline_detail.settings.more_info_suffix')}
        </Text>

        <Spacing mt={1}>
          {!editCustomExecutorType && (
            <Select
              label={t('pipeline_detail.settings.executor_type.label')}
              onChange={e => setPipelineAttributes(prev => ({
                ...prev,
                executor_type: e.target.value,
              }))}
              primary
              ref={refExecutorTypeSelect}
              value={pipelineAttributes?.executor_type || ''}
            >
              {EXECUTOR_TYPES.map(executorTypeOption => (
                <option key={executorTypeOption} value={executorTypeOption}>
                  {executorTypeOption}
                </option>
              ))}
            </Select>
          )}
          {editCustomExecutorType && (
            <TextInput
              label={t('pipeline_detail.settings.executor_type.label')}
              monospace
              onChange={e => setPipelineAttributes(prev => ({
                ...prev,
                executor_type: e.target.value,
              }))}
              ref={refExecutorTypeTextInput}
              setContentOnMount
              value={pipelineAttributes?.executor_type || ''}
            />
          )}

          <Spacing mt={1}>
            <Link
              muted
              onClick={() => {
                if (editCustomExecutorType) {
                  setPipelineAttributes(prev => ({
                    ...prev,
                    executor_type: pipeline?.executor_type,
                  }));

                  setTimeout(() => refExecutorTypeSelect?.current?.focus(), 1);
                } else {
                  setTimeout(() => refExecutorTypeTextInput?.current?.focus(), 1);
                }
                setEditCustomExecutorType(!editCustomExecutorType);
              }}
              preventDefault
              small
            >
              {editCustomExecutorType
                ? t('pipeline_detail.settings.executor_type.select_preset')
                : t('pipeline_detail.settings.executor_type.enter_custom')
              }
            </Link>
          </Spacing>
        </Spacing>
      </Spacing>

      <Spacing mt={UNITS_BETWEEN_SECTIONS}>
        <Headline>
          {t('pipeline_detail.settings.retry_configuration.heading')}
        </Headline>

        <Text muted>
          {t('pipeline_detail.settings.more_info_prefix')}<Link
            href="https://docs.mage.ai/orchestration/pipeline-runs/retrying-block-runs"
            openNewWindow
          >
            {t('pipeline_detail.settings.documentation_link')}
          </Link>{t('pipeline_detail.settings.more_info_suffix')}
        </Text>

        <Spacing mt={1}>
          <FlexContainer>
            <TextInput
              label={t('pipeline_detail.settings.retry_configuration.retries')}
              monospace
              onChange={e => setPipelineAttributes(prev => ({
                ...prev,
                retry_config: {
                  ...prev?.retry_config,
                  retries: typeof e.target.value !== 'undefined' && e.target.value !== null
                    ? Number(e.target.value)
                    : e.target.value,
                },
              }))}
              setContentOnMount
              type="number"
              value={pipelineAttributes?.retry_config?.retries || ''}
            />

            <Spacing mr={1} />

            <TextInput
              label={t('pipeline_detail.settings.retry_configuration.delay')}
              monospace
              onChange={e => setPipelineAttributes(prev => ({
                ...prev,
                retry_config: {
                  ...prev?.retry_config,
                  delay: typeof e.target.value !== 'undefined' && e.target.value !== null
                    ? Number(e.target.value)
                    : e.target.value,
                },
              }))}
              setContentOnMount
              type="number"
              value={pipelineAttributes?.retry_config?.delay || ''}
            />

            <Spacing mr={1} />

            <TextInput
              label={t('pipeline_detail.settings.retry_configuration.max_delay')}
              monospace
              onChange={e => setPipelineAttributes(prev => ({
                ...prev,
                retry_config: {
                  ...prev?.retry_config,
                  max_delay: typeof e.target.value !== 'undefined' && e.target.value !== null
                    ? Number(e.target.value)
                    : e.target.value,
                },
              }))}
              setContentOnMount
              type="number"
              value={pipelineAttributes?.retry_config?.max_delay || ''}
            />

            <Spacing mr={1} />

            <Checkbox
              checked={!!pipelineAttributes?.retry_config?.exponential_backoff}
              label={t('pipeline_detail.settings.retry_configuration.exponential_backoff')}
              onClick={() => setPipelineAttributes(prev => ({
                ...prev,
                retry_config: {
                  ...prev?.retry_config,
                  exponential_backoff: !prev?.retry_config?.exponential_backoff,
                },
              }))}
            />
          </FlexContainer>
        </Spacing>
      </Spacing>

      <Spacing mt={UNITS_BETWEEN_SECTIONS}>
        <Headline>
          {t('pipelines.configure.tags')}
        </Headline>

        <Spacing mt={1}>
          <TagsAutocompleteInputField
            removeTag={(tag: TagType) => {
              setPipelineAttributes(prev => ({
                ...prev,
                tags: pipelineTags.filter(uuid => uuid !== tag.uuid),
              }));
            }}
            selectTag={(tag: TagType) => {
              setPipelineAttributes(prev => ({
                ...prev,
                tags: pushUnique(tag.uuid, pipelineTags, uuid => uuid === tag.uuid),
              }));
            }}
            selectedTags={pipelineTags?.map(tag => ({ uuid: tag }))}
            tags={unselectedTags}
            uuid={`TagsAutocompleteInputField-${pipeline?.uuid}`}
          />
        </Spacing>
      </Spacing>

      <Spacing mt={UNITS_BETWEEN_SECTIONS}>
        <FlexContainer>
          <Button
            disabled={!pipelineAttributesTouched}
            loading={isPipelineUpdating}
            // @ts-ignore
            onClick={() => updatePipeline({
              concurrency_config: pipelineAttributes?.concurrency_config,
              description: pipelineAttributes?.description,
              executor_type: pipelineAttributes?.executor_type,
              name: pipelineAttributes?.name,
              retry_config: pipelineAttributes?.retry_config,
              run_pipeline_in_one_process: pipelineAttributes?.run_pipeline_in_one_process,
              settings: pipelineAttributes?.settings,
              tags: pipelineAttributes?.tags,
              // @ts-ignore
            }).then(() => setPipelineAttributesTouched(false))}
            primary
          >
            {t('pipeline_detail.settings.save_pipeline_settings')}
          </Button>
        </FlexContainer>
      </Spacing>

      <Spacing mt={UNITS_BETWEEN_SECTIONS}>
        <Checkbox
          checked={allBlocksHidden && !noBlocks}
          disabled={noBlocks}
          label={t('pipeline_detail.settings.hide_all_blocks_in_notebook')}
          onClick={() => setHiddenBlocks(() => {
            if (allBlocksHidden) {
              return {};
            }

            return blocks?.reduce((acc, { uuid }) => ({
              ...acc,
              [uuid]: true,
            }), {});
          })}
        />
      </Spacing>

      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        <Checkbox
          checked={blockOutputLogs}
          label={t('pipeline_detail.settings.output_block_messages_to_logs')}
          // @ts-ignore
          onClick={() => setBlockOutputLogs(prev => !prev)}
        />
      </Spacing>
    </Spacing>
  );
}

export default PipelineSettings;
