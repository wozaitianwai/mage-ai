import NextLink from 'next/link';
import { toast } from 'react-toastify';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import Button from '@oracle/elements/Button';
import ButtonTabs, { TabType } from '@oracle/components/Tabs/ButtonTabs';
import CustomTemplateType, { OBJECT_TYPE_PIPELINES } from '@interfaces/CustomTemplateType';
import DependencyGraph from '@components/DependencyGraph';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import Link from '@oracle/elements/Link';
import PipelineType, { PipelineTypeEnum } from '@interfaces/PipelineType';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import TextArea from '@oracle/elements/Inputs/TextArea';
import TextInput from '@oracle/elements/Inputs/TextInput';
import TripleLayout from '@components/TripleLayout';
import api from '@api';
import useConfirmLeave from '@utils/hooks/useConfirmLeave';
import usePrevious from '@utils/usePrevious';
import { HEADER_HEIGHT } from '@components/shared/Header/index.style';
import {
  NAV_TABS,
  NAV_TAB_DEFINE,
  NAV_TAB_DOCUMENT,
} from './constants';
import { PADDING_UNITS } from '@oracle/styles/units/spacing';
import {
  ButtonsStyle,
  TabsStyle,
} from '@components/CustomTemplates/TemplateDetail/index.style';
import { VERTICAL_NAVIGATION_WIDTH } from '@components/Dashboard/index.style';
import { onSuccess } from '@api/utils/response';
import { useError } from '@context/Error';
import { useWindowSize } from '@utils/sizes';

type PipelineTemplateDetailProps = {
  defaultTab?: TabType;
  onMutateSuccess?: () => void;
  pipelineUUID?: string;
  template?: CustomTemplateType;
  templateAttributes?: {
    description?: string;
    name?: string;
    pipeline_type?: PipelineTypeEnum;
    template_uuid?: string;
  };
  templateUUID?: string;
};

function PipelineTemplateDetail({
  defaultTab,
  onMutateSuccess,
  pipelineUUID,
  template,
  templateAttributes: templateAttributesProp,
  templateUUID,
}: PipelineTemplateDetailProps) {
  const {
    height: heightWindow,
  } = useWindowSize();
  const heightOffset = HEADER_HEIGHT;

  const router = useRouter();
  const { t } = useTranslation('common');
  const [showError] = useError(null, {}, [], {
    uuid: 'CustomTemplates/PipelineTemplateDetail',
  });

  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [touched, setTouched] = useState<boolean>(false);
  const [templateAttributes, setTemplateAttributesState] =
    useState<CustomTemplateType | {
      description?: string;
      name?: string;
      template_uuid?: string;
    }>(templateAttributesProp);
  const setTemplateAttributes = useCallback((handlePrevious) => {
    setTouched(true);
    setTemplateAttributesState(handlePrevious);
  }, []);

  const templatePrev = usePrevious(template);
  useEffect(() => {
    if (templatePrev?.template_uuid !== template?.template_uuid) {
      setTemplateAttributesState(template);
    }
  }, [template, templatePrev]);

  const { data: dataPipeline } = api.pipelines.detail(pipelineUUID);
  const pipeline = useMemo(() => template?.pipeline || dataPipeline?.pipeline, [
    dataPipeline,
    template,
  ]);
  const blocks = useMemo(() => pipeline?.blocks || [], [pipeline]);

  const isNewCustomTemplate: boolean = useMemo(() => !template && !templateUUID, [
    template,
    templateUUID,
  ]);

  const tabs = useMemo(() => NAV_TABS.map(tab => ({
    ...tab,
    label: tab?.label || (() => {
      if (tab?.uuid === NAV_TAB_DEFINE.uuid) {
        return t('templates.tabs.define');
      }

      if (tab?.uuid === NAV_TAB_DOCUMENT.uuid) {
        return t('templates.tabs.document');
      }

      return tab?.uuid;
    }),
  })), [t]);
  const [selectedTab, setSelectedTab] = useState<TabType>(defaultTab
    ? tabs.find(({ uuid }) => uuid === defaultTab?.uuid)
    : tabs[0],
  );

  const buttonDisabled = useMemo(() => {
    if (isNewCustomTemplate) {
      return !templateAttributes?.template_uuid;
    }

    return false;
  }, [
    isNewCustomTemplate,
    templateAttributes,
  ]);

  const [beforeHidden, setBeforeHidden] = useState<boolean>(false);
  const [beforeWidth, setBeforeWidth] = useState<number>(isNewCustomTemplate ? 400 : 300);

  const [createCustomTemplate, { isLoading: isLoadingCreateCustomTemplate }] = useMutation(
    api.custom_templates.useCreate(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({
            custom_template: ct,
          }) => {
            if (onMutateSuccess) {
              onMutateSuccess?.();
            }

            setIsRedirecting(true);
            setTimeout(() => {
              router.push(
                '/templates/[...slug]',
                `/templates/${encodeURIComponent(ct?.template_uuid)}?object_type=${OBJECT_TYPE_PIPELINES}`,
              );
            }, 1);
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const [updateCustomTemplate, { isLoading: isLoadingUpdateCustomTemplate }] = useMutation(
    api.custom_templates.useUpdate(template
        ? encodeURIComponent(template?.template_uuid)
        : templateUUID && encodeURIComponent(templateUUID),
      {
        object_type: OBJECT_TYPE_PIPELINES,
      },
    ),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({
            custom_template: ct,
          }) => {
            if (onMutateSuccess) {
              onMutateSuccess?.();
            }

            if (
              (template?.template_uuid && ct?.template_uuid !== template?.template_uuid)
                || (templateUUID && ct?.template_uuid !== templateUUID)
            ) {
              router.replace(
                '/templates/[...slug]',
                `/templates/${encodeURIComponent(ct?.template_uuid)}?object_type=${OBJECT_TYPE_PIPELINES}`,
              );
            } else {
              setTemplateAttributesState(ct);
              setTouched(false);

              toast.success(
                t('templates.toast_template_saved'),
                {
                  position: toast.POSITION.BOTTOM_RIGHT,
                  toastId: 'custom_pipeline_template',
                },
              );
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

  const saveCustomTemplate = useCallback(() => {
    const payload = {
      custom_template: {
        ...templateAttributes,
        object_type: OBJECT_TYPE_PIPELINES,
      },
    };

    if (isNewCustomTemplate) {
      // @ts-ignore
      createCustomTemplate({
        ...payload,
        custom_template: {
          ...payload?.custom_template,
          pipeline_uuid: pipelineUUID,
        },
      });
    } else {
      // @ts-ignore
      updateCustomTemplate(payload);
    }
  }, [
    createCustomTemplate,
    isNewCustomTemplate,
    pipelineUUID,
    templateAttributes,
    updateCustomTemplate,
  ]);

  const before = useMemo(() => (
    <FlexContainer
      flexDirection="column"
      fullHeight
    >
      <TabsStyle>
        <ButtonTabs
          noPadding
          onClickTab={(tab: TabType) => {
            setSelectedTab(tab);
          }}
          selectedTabUUID={selectedTab?.uuid}
          tabs={tabs}
        />
      </TabsStyle>

      <Flex
        // flex={1}
        flexDirection="column"
      >
        {NAV_TAB_DEFINE.uuid === selectedTab?.uuid && (
          <>
            {pipelineUUID && (
              <Spacing mt={PADDING_UNITS} px={PADDING_UNITS}>
                <Text default>
                  {t('templates.pipeline_template_based_on_prefix')}{' '}<NextLink
                    as={`/pipelines/${pipelineUUID}`}
                    href={'/pipelines/[pipeline]'}
                    passHref
                  >
                    <Link
                      bold
                      default
                      inline
                      monospace
                      openNewWindow
                    >
                      {pipelineUUID}
                    </Link>
                  </NextLink>{t('templates.pipeline_template_based_on_suffix')}
                </Text>
              </Spacing>
            )}

            <Spacing mt={PADDING_UNITS} px={PADDING_UNITS}>
              <Spacing mb={1}>
                <Text bold>
                  {t('templates.uuid_label')}
                </Text>
                <Text muted small>
                  {t('templates.uuid_description')}
                </Text>
              </Spacing>

              <TextInput
                monospace
                // @ts-ignore
                onChange={e => setTemplateAttributes(prev => ({
                  ...prev,
                  template_uuid: e.target.value,
                }))}
                placeholder={t('templates.uuid_placeholder')}
                primary
                setContentOnMount
                value={templateAttributes?.template_uuid || ''}
              />
            </Spacing>
          </>
        )}

        {NAV_TAB_DOCUMENT.uuid === selectedTab?.uuid && (
          <>
            <Spacing mt={PADDING_UNITS} px={PADDING_UNITS}>
              <Spacing mb={1}>
                <Text bold>
                  {t('common.name')}
                </Text>
                <Text muted small>
                  {t('templates.name_description')}
                </Text>
              </Spacing>

              <TextInput
                // @ts-ignore
                onChange={e => setTemplateAttributes(prev => ({
                  ...prev,
                  name: e.target.value,
                }))}
                placeholder={t('templates.name_placeholder')}
                primary
                setContentOnMount
                value={templateAttributes?.name || ''}
              />
            </Spacing>

            <Spacing mt={PADDING_UNITS} px={PADDING_UNITS}>
              <TextArea
                label={t('common.description')}
                // @ts-ignore
                onChange={e => setTemplateAttributes(prev => ({
                  ...prev,
                  description: e.target.value,
                }))}
                placeholder={t('templates.description_placeholder')}
                primary
                setContentOnMount
                value={templateAttributes?.description || ''}
              />
            </Spacing>
          </>
        )}
      </Flex>

      <ButtonsStyle>
        <Spacing p={PADDING_UNITS}>
          <FlexContainer>
            <Button
              disabled={buttonDisabled}
              fullWidth
              loading={isLoadingCreateCustomTemplate || isLoadingUpdateCustomTemplate}
              onClick={() => saveCustomTemplate()}
              primary
            >
              {!isNewCustomTemplate && t('templates.save_template')}
              {isNewCustomTemplate && t('templates.create_new_template')}
            </Button>
          </FlexContainer>
        </Spacing>
      </ButtonsStyle>
    </FlexContainer>
  ), [
    buttonDisabled,
    isLoadingCreateCustomTemplate,
    isLoadingUpdateCustomTemplate,
    isNewCustomTemplate,
    pipelineUUID,
    saveCustomTemplate,
    selectedTab?.uuid,
    setTemplateAttributes,
    templateAttributes,
  ]);

  const { ConfirmLeaveModal } = useConfirmLeave({
    shouldWarn: !isRedirecting && touched,
    warningMessage: t('templates.unsaved_changes_leave_warning'),
  });

  return (
    // @ts-ignore
    <TripleLayout
      before={before}
      beforeHidden={beforeHidden}
      beforeWidth={beforeWidth}
      leftOffset={VERTICAL_NAVIGATION_WIDTH}
      setBeforeHidden={setBeforeHidden}
      setBeforeWidth={setBeforeWidth}
    >
      <ConfirmLeaveModal />
      <DependencyGraph
        blocks={blocks}
        height={heightWindow}
        heightOffset={HEADER_HEIGHT}
        noStatus
        pipeline={pipeline as PipelineType}
      />
    </TripleLayout>
  );
}

export default PipelineTemplateDetail;
