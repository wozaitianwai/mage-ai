import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';

import Button from '@oracle/elements/Button';
import Divider from '@oracle/elements/Divider';
import Flex from '@oracle/components/Flex';
import FlexContainer, {
  JUSTIFY_SPACE_BETWEEN_PROPS,
} from '@oracle/components/FlexContainer';
import Headline from '@oracle/elements/Headline';
import Link from '@oracle/elements/Link';
import Panel from '@oracle/components/Panel';
import ProjectType, {
  AIProviderEnum,
  FeatureUUIDEnum,
  ProjectRequestPayloadType,
} from '@interfaces/ProjectType';
import SetupSection, { SetupSectionRow } from '@components/shared/SetupSection';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import Select from '@oracle/elements/Inputs/Select';
import TextInput from '@oracle/elements/Inputs/TextInput';
import ToggleSwitch from '@oracle/elements/Inputs/ToggleSwitch';
import Tooltip from '@oracle/components/Tooltip';
import api from '@api';
import useProject from '@utils/models/project/useProject';
import { ContainerStyle } from './index.style';
import { Edit } from '@oracle/icons';
import { ICON_SIZE_SMALL } from '@oracle/styles/units/icons';
import { LOCAL_TIMEZONE_TOOLTIP_PROPS, storeLocalTimezoneSetting } from './utils';
import { PADDING_UNITS, UNITS_BETWEEN_SECTIONS } from '@oracle/styles/units/spacing';
import { capitalizeRemoveUnderscoreLower } from '@utils/string';
import { ignoreKeys } from '@utils/hash';
import { onSuccess } from '@api/utils/response';
import { getAIConfig } from '@utils/models/project';
import { useError } from '@context/Error';

type PreferencesProps = {
  cancelButtonText?: string;
  contained?: boolean;
  header?: any;
  onCancel?: () => void;
  onSaveSuccess?: (project: ProjectType) => void;
  rootProject?: boolean;
};

const AI_PROVIDER_DEFAULTS = {
  [AIProviderEnum.OPEN_AI]: {
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  [AIProviderEnum.DEEPSEEK]: {
    base_url: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  [AIProviderEnum.GROK]: {
    base_url: 'https://api.x.ai/v1',
    model: 'grok-2-latest',
  },
  [AIProviderEnum.QWEN]: {
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen2.5-72b-instruct',
  },
  [AIProviderEnum.OPENAI_COMPATIBLE]: {
    base_url: '',
    model: '',
  },
  [AIProviderEnum.HUGGING_FACE]: {},
};

function Preferences({
  cancelButtonText,
  contained,
  header,
  onCancel,
  onSaveSuccess,
  rootProject: rootProjectUse,
}: PreferencesProps) {
  const [showError] = useError(null, {}, [], {
    uuid: 'settings/workspace/preferences',
  });
  const [projectAttributes, setProjectAttributes] = useState<ProjectType>(null);
  const [editingAIKey, setEditingAIKey] = useState<boolean>(false);
  const { t } = useTranslation('common');

  const {
    fetchProjects,
    project: projectInit,
    projectPlatformActivated,
    rootProject,
  } = useProject();

  const project = useMemo(() => rootProjectUse ? rootProject : projectInit, [
    projectInit,
    rootProject,
    rootProjectUse,
  ]);

  const {
    name: projectName,
    project_uuid: projectUUID,
  } = project || {};

  const isDemoApp = useMemo(() =>
    typeof window !== 'undefined' && window.location.hostname === 'demo.mage.ai',
    [],
  );

  useEffect(() => {
    if (!projectAttributes && project) {
      setProjectAttributes({
        ...project,
        ai_config: getAIConfig(project),
      });
    }
  }, [project, projectAttributes]);

  const [updateProjectBase, { isLoading: isLoadingUpdateProject }]: any = useMutation(
    api.projects.useUpdate(projectName),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({ project: p }) => {
            fetchProjects();
            setProjectAttributes(p);
            setEditingAIKey(false);
            storeLocalTimezoneSetting(p?.features?.[FeatureUUIDEnum.LOCAL_TIMEZONE]);

            if (onSaveSuccess) {
              onSaveSuccess?.(p);
            }
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const updateProject = useCallback((payload: ProjectRequestPayloadType) => updateProjectBase({
    project: {
      ...payload,
      root_project: rootProjectUse,
    },
  }), [
    rootProjectUse,
    updateProjectBase,
  ]);

  const aiConfig = useMemo(
    () => getAIConfig(projectAttributes || project),
    [projectAttributes, project],
  );
  const aiMode = aiConfig?.mode || AIProviderEnum.OPEN_AI;
  const openAIConfig = aiConfig?.open_ai_config || {};
  const huggingFaceConfig = aiConfig?.hugging_face_config || {};
  const apiKey = openAIConfig?.openai_api_key;

  const aiProviderOptions = useMemo(() => ([
    {
      label: 'OpenAI',
      value: AIProviderEnum.OPEN_AI,
    },
    {
      label: 'DeepSeek',
      value: AIProviderEnum.DEEPSEEK,
    },
    {
      label: 'Grok',
      value: AIProviderEnum.GROK,
    },
    {
      label: 'Qwen',
      value: AIProviderEnum.QWEN,
    },
    {
      label: 'Hugging Face',
      value: AIProviderEnum.HUGGING_FACE,
    },
    {
      label: t('preferences.ai_provider_custom'),
      value: AIProviderEnum.OPENAI_COMPATIBLE,
    },
  ]), [t]);

  const el = (
    <>
      {header}

      <Panel noPadding>
        <Spacing p={PADDING_UNITS}>
          <Spacing mb={1}>
            <Headline level={5}>
              {t('preferences.project_name')}
            </Headline>
          </Spacing>

          <Text default monospace>
            {projectName}
          </Text>
        </Spacing>

        <Divider light />

        <Spacing p={PADDING_UNITS}>
          <Spacing mb={1}>
            <Headline level={5}>
              {t('preferences.project_uuid')}
            </Headline>
          </Spacing>

          <Text default={!!projectUUID} monospace muted={!projectUUID}>
            {projectUUID || t('preferences.not_required')}
          </Text>
        </Spacing>

        <Divider light />

        <Spacing p={PADDING_UNITS}>
          <FlexContainer
            alignItems="center"
            justifyContent="space-between"
          >
            <Flex flexDirection="column">
              <Spacing mb={1}>
                <Headline level={5}>
                  {t('preferences.help_improve_mage')}
                </Headline>
              </Spacing>

              <Text default>
                {t('preferences.contribute_usage')}
                &nbsp;
                <Link
                  href="https://docs.mage.ai/contributing/statistics/overview"
                  openNewWindow
                >
                  {t('preferences.here')}
                </Link>.
              </Text>
            </Flex>

            <Spacing mr={PADDING_UNITS} />

            <ToggleSwitch
              checked={projectAttributes?.help_improve_mage}
              compact
              id="help_improve_mage_toggle"
              onCheck={() => setProjectAttributes(prev => ({
                ...prev,
                help_improve_mage: !projectAttributes?.help_improve_mage,
              }))}
            />
          </FlexContainer>
        </Spacing>

        {/*<Divider light />

        <Spacing p={PADDING_UNITS}>
          <Spacing mb={1}>
            <Headline level={5}>
              Automatically generate block names
            </Headline>
          </Spacing>

          <FlexContainer alignItems="center">
            <Checkbox
              checked={automaticallyNameBlocks}
              label="Use randomly generated names for blocks created in the future"
              onClick={() => {
                setAutomaticallyNameBlocks(!automaticallyNameBlocks);
                set(LOCAL_STORAGE_KEY_AUTOMATICALLY_NAME_BLOCKS, !automaticallyNameBlocks);
              }}
            />
          </FlexContainer>
        </Spacing>*/}
      </Panel>

      <Spacing mt={UNITS_BETWEEN_SECTIONS} />

      <SetupSection
        description={t('preferences.pipeline_settings_description')}
        title={t('preferences.pipeline_settings')}
      >
        <SetupSectionRow
          description={t('triggers.save_triggers_description')}
          title={t('triggers.save_triggers_automatically')}
          toggleSwitch={{
            checked: !!projectAttributes?.pipelines?.settings?.triggers?.save_in_code_automatically,
            onCheck: (valFunc: (val: boolean) => boolean) => setProjectAttributes(prev => ({
              ...prev,
              pipelines: {
                ...prev?.pipelines,
                settings: {
                  ...prev?.pipelines?.settings,
                  triggers: {
                    ...prev?.pipelines?.settings?.triggers,
                    save_in_code_automatically: valFunc(
                      prev?.pipelines?.settings?.triggers?.save_in_code_automatically,
                    ),
                  },
                },
              },
            })),
          }}
        />
      </SetupSection>

      <Spacing mt={UNITS_BETWEEN_SECTIONS} />

      <Panel noPadding overflowVisible>
        <Spacing p={PADDING_UNITS}>
          <Spacing mb={1}>
            <Headline level={5}>
              {t('preferences.features')}&nbsp;
              <Link
                bold
                href="https://docs.mage.ai/development/project/features"
                largeSm
                openNewWindow
              >
                ({t('preferences.here')})
              </Link>
            </Headline>
          </Spacing>

          {Object.entries(ignoreKeys(projectAttributes?.features, [
            FeatureUUIDEnum.CODE_BLOCK_V2,
            FeatureUUIDEnum.COMMAND_CENTER,
            FeatureUUIDEnum.COMPUTE_MANAGEMENT,
            FeatureUUIDEnum.CUSTOM_DESIGN,
            FeatureUUIDEnum.DBT_V2,
            FeatureUUIDEnum.GLOBAL_HOOKS,
            FeatureUUIDEnum.NOTEBOOK_BLOCK_OUTPUT_SPLIT_VIEW,
          ]) || {}).map(([k, v], idx) => {
            const overrideFromRootProject = projectPlatformActivated
              && !rootProjectUse
              && project?.features_override
              && k in project?.features_override;

            return (
              <Spacing
                key={k}
                mt={idx === 0 ? 0 : 1}
              >
                <FlexContainer
                  alignItems="center"
                >
                  <Flex flex={1}>
                    <ToggleSwitch
                      disabled={overrideFromRootProject}
                      checked={!!v}
                      compact
                      onCheck={() => setProjectAttributes(prev => ({
                        ...prev,
                        features: {
                          ...projectAttributes?.features,
                          [k]: !v,
                        },
                      }))}
                    />

                    <Spacing mr={PADDING_UNITS} />

                  <Flex>
                      <Text default={!v} monospace>
                        {t(`features.${k}`, capitalizeRemoveUnderscoreLower(k))}
                      </Text>

                      {k === FeatureUUIDEnum.LOCAL_TIMEZONE &&
                        <Spacing ml={1}>
                          <Tooltip
                            {...LOCAL_TIMEZONE_TOOLTIP_PROPS}
                          />
                        </Spacing>
                      }
                    </Flex>
                  </Flex>

                  {overrideFromRootProject && (
                    <Text monospace muted small>
                      {t('preferences.overridden')}
                    </Text>
                  )}
                </FlexContainer>
              </Spacing>
            );
          })}
        </Spacing>
      </Panel>

      <Spacing mt={UNITS_BETWEEN_SECTIONS} />

      <Panel noPadding>
        <Spacing p={PADDING_UNITS}>
          <Spacing mb={1}>
            <Headline level={5}>
              {t('preferences.ai_provider')}
            </Headline>
          </Spacing>

          <Text default>
            {t('preferences.ai_provider_description')}
          </Text>

          <Spacing mt={2}>
            <Select
              onChange={(e) => {
                const mode = e.target.value as AIProviderEnum;
                const defaults = AI_PROVIDER_DEFAULTS[mode] || {};
                setProjectAttributes(prev => {
                  const prevAIConfig = getAIConfig(prev);
                  const nextAIConfig = {
                    ...prevAIConfig,
                    mode,
                  };
                  if (mode !== AIProviderEnum.HUGGING_FACE) {
                    nextAIConfig.open_ai_config = {
                      ...prevAIConfig.open_ai_config,
                      base_url: defaults.base_url ?? prevAIConfig.open_ai_config?.base_url,
                      model: defaults.model ?? prevAIConfig.open_ai_config?.model,
                    };
                  }
                  return {
                    ...prev,
                    ai_config: nextAIConfig,
                  };
                });
                setEditingAIKey(false);
              }}
              value={aiMode}
            >
              {aiProviderOptions.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Spacing>

          {aiMode !== AIProviderEnum.HUGGING_FACE && (
            <>
              <Spacing mt={2}>
                {(apiKey && !editingAIKey)
                  ?
                    <FlexContainer {...JUSTIFY_SPACE_BETWEEN_PROPS} >
                      <Text default monospace>
                        {t('preferences.api_key_hidden')}
                      </Text>
                      <Button
                        iconOnly
                        onClick={() => setEditingAIKey(true)}
                        secondary
                        title={t('preferences.edit')}
                      >
                        <Edit size={ICON_SIZE_SMALL} />
                      </Button>
                    </FlexContainer>
                  :
                    <TextInput
                      disabled={isDemoApp}
                      label={isDemoApp
                        ? t('preferences.api_key_disabled_demo')
                        : t('preferences.api_key')
                      }
                      monospace
                      onChange={e => setProjectAttributes(prev => {
                        const prevAIConfig = getAIConfig(prev);
                        const nextOpenAIConfig = {
                          ...prevAIConfig.open_ai_config,
                          openai_api_key: e.target.value,
                        };
                        const nextProject = {
                          ...prev,
                          ai_config: {
                            ...prevAIConfig,
                            open_ai_config: nextOpenAIConfig,
                          },
                        };
                        if (prevAIConfig.mode === AIProviderEnum.OPEN_AI) {
                          nextProject.openai_api_key = e.target.value;
                        }
                        return nextProject;
                      })}
                      primary
                      setContentOnMount
                      value={apiKey || ''}
                    />
                }
              </Spacing>

              <Spacing mt={2}>
                <TextInput
                  label={t('preferences.ai_base_url')}
                  monospace
                  onChange={e => setProjectAttributes(prev => {
                    const prevAIConfig = getAIConfig(prev);
                    return {
                      ...prev,
                      ai_config: {
                        ...prevAIConfig,
                        open_ai_config: {
                          ...prevAIConfig.open_ai_config,
                          base_url: e.target.value,
                        },
                      },
                    };
                  })}
                  primary
                  setContentOnMount
                  value={openAIConfig?.base_url || ''}
                />
              </Spacing>

              <Spacing mt={2}>
                <TextInput
                  label={t('preferences.ai_model')}
                  monospace
                  onChange={e => setProjectAttributes(prev => {
                    const prevAIConfig = getAIConfig(prev);
                    return {
                      ...prev,
                      ai_config: {
                        ...prevAIConfig,
                        open_ai_config: {
                          ...prevAIConfig.open_ai_config,
                          model: e.target.value,
                        },
                      },
                    };
                  })}
                  primary
                  setContentOnMount
                  value={openAIConfig?.model || ''}
                />
              </Spacing>
            </>
          )}

          {aiMode === AIProviderEnum.HUGGING_FACE && (
            <>
              <Spacing mt={2}>
                <TextInput
                  label={t('preferences.ai_hf_api_url')}
                  monospace
                  onChange={e => setProjectAttributes(prev => {
                    const prevAIConfig = getAIConfig(prev);
                    return {
                      ...prev,
                      ai_config: {
                        ...prevAIConfig,
                        hugging_face_config: {
                          ...prevAIConfig.hugging_face_config,
                          huggingface_api: e.target.value,
                        },
                      },
                    };
                  })}
                  primary
                  setContentOnMount
                  value={huggingFaceConfig?.huggingface_api || ''}
                />
              </Spacing>

              <Spacing mt={2}>
                <TextInput
                  label={t('preferences.ai_hf_api_token')}
                  monospace
                  onChange={e => setProjectAttributes(prev => {
                    const prevAIConfig = getAIConfig(prev);
                    return {
                      ...prev,
                      ai_config: {
                        ...prevAIConfig,
                        hugging_face_config: {
                          ...prevAIConfig.hugging_face_config,
                          huggingface_inference_api_token: e.target.value,
                        },
                      },
                    };
                  })}
                  primary
                  setContentOnMount
                  value={huggingFaceConfig?.huggingface_inference_api_token || ''}
                />
              </Spacing>
            </>
          )}
        </Spacing>
      </Panel>

      <Spacing mt={UNITS_BETWEEN_SECTIONS} />

      <FlexContainer alignItems="center">
        <Button
          id="save-project-settings"
          loading={isLoadingUpdateProject}
          onClick={() => {
            const updateProjectPayload: ProjectRequestPayloadType = {
              ai_config: projectAttributes?.ai_config,
              features: projectAttributes?.features,
              help_improve_mage: projectAttributes?.help_improve_mage,
              openai_api_key: projectAttributes?.openai_api_key,
              pipelines: projectAttributes?.pipelines,
            };
            if (project?.help_improve_mage === true
              && projectAttributes?.help_improve_mage === false
            ) {
              updateProjectPayload.deny_improve_mage = true;
            }
            updateProject(updateProjectPayload);
          }}
          primary
        >
          {t('preferences.save_settings')}
        </Button>

        {onCancel && (
          <>
            <Spacing mr={PADDING_UNITS} />

            <Button
              onClick={onCancel}
              secondary
            >
              {cancelButtonText || t('preferences.cancel')}
            </Button>
          </>
        )}
      </FlexContainer>
    </>
  );

  if (contained) {
    return (
      <ContainerStyle>
        {el}
      </ContainerStyle>
    );
  }

  return el;
}

export default Preferences;
