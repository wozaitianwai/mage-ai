import NextLink from 'next/link';
import { toast } from 'react-toastify';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import BlockType from '@interfaces/BlockType';
import Button from '@oracle/elements/Button';
import Divider from '@oracle/elements/Divider';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import GlobalDataProductType, {
  GlobalDataProductObjectTypeEnum,
} from '@interfaces/GlobalDataProductType';
import Headline from '@oracle/elements/Headline';
import Link from '@oracle/elements/Link';
import OutdatedAfterField from './OutdatedAfterField';
import OutdatedStartingAtField from './OutdatedStartingAtField';
import PipelineRunsTable from '@components/PipelineDetail/Runs/Table';
import PipelineScheduleType from '@interfaces/PipelineScheduleType';
import PipelineType from '@interfaces/PipelineType';
import Select from '@oracle/elements/Inputs/Select';
import SettingsField from './SettingsField';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
import TriggersTable from '@components/Triggers/Table';
import TripleLayout from '@components/TripleLayout';
import api from '@api';
import usePrevious from '@utils/usePrevious';
import { ButtonsStyle } from '@components/CustomTemplates/TemplateDetail/index.style';
import { PADDING_UNITS, UNITS_BETWEEN_ITEMS_IN_SECTIONS } from '@oracle/styles/units/spacing';
import { VERTICAL_NAVIGATION_WIDTH } from '@components/Dashboard/index.style';
import { onSuccess } from '@api/utils/response';
import { sortByKey } from '@utils/array';
import { useError } from '@context/Error';

type GlobalDataProductDetailProps = {
  globalDataProduct: GlobalDataProductType;
  isNew?: boolean;
};

function GlobalDataProductDetail({ globalDataProduct, isNew }: GlobalDataProductDetailProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [showError] = useError(null, {}, [], {
    uuid: 'GlobalDataProductDetail',
  });

  const [beforeHidden, setBeforeHidden] = useState<boolean>(false);
  const [beforeWidth, setBeforeWidth] = useState<number>(600);
  const [objectAttributes, setObjectAttributesState] = useState<GlobalDataProductType>(null);
  const setObjectAttributes = useCallback(handlePrevious => {
    setObjectAttributesState(handlePrevious);
  }, []);

  const objectPrev = usePrevious(globalDataProduct);
  useEffect(() => {
    if (!globalDataProduct?.uuid || objectPrev?.uuid !== globalDataProduct?.uuid) {
      setObjectAttributesState(globalDataProduct);
    }
  }, [globalDataProduct, objectPrev]);

  const buttonDisabled = useMemo(() => !objectAttributes?.uuid, [objectAttributes]);

  const [updateObject, { isLoading: isLoadingUpdateObject }] = useMutation(
    (gdp: {
      global_data_product: GlobalDataProductType;
    }) => api.global_data_products.useUpdate(isNew ? objectAttributes?.uuid : globalDataProduct?.uuid)(gdp),
    {
      onSuccess: (response: any) =>
        onSuccess(response, {
          callback: ({ global_data_product: gdp }) => {
            if (isNew || (globalDataProduct?.uuid && gdp?.uuid !== globalDataProduct?.uuid)) {
              router.replace(
                '/global-data-products/[...slug]',
                `/global-data-products/${gdp?.uuid}`,
              );
            } else {
              setObjectAttributesState(gdp);

              toast.success(t('global_data_products.success_save'), {
                position: toast.POSITION.BOTTOM_RIGHT,
                toastId: 'custom_pipeline_template',
              });
            }
          },
          onErrorCallback: (response, errors) =>
            showError({
              errors,
              response,
            }),
        }),
    },
  );

  const { data: dataPipeline } = api.pipelines.detail(
    GlobalDataProductObjectTypeEnum.PIPELINE === globalDataProduct?.object_type
      ? globalDataProduct?.object_uuid
      : null,
  );
  const pipeline: PipelineType = useMemo(() => dataPipeline?.pipeline, [dataPipeline]);
  const blocks: BlockType[] = useMemo(() => pipeline?.blocks || [], [pipeline]);

  const { data: dataPipelines } = api.pipelines.list(
    !isNew && globalDataProduct?.repo_path ? { repo_path: globalDataProduct?.repo_path } : {},
  );
  const pipelines: PipelineType[] = useMemo(
    () => sortByKey(dataPipelines?.pipelines || [], 'uuid'),
    [dataPipelines],
  );

  const objectTypeLabel = useMemo(() => {
    if (GlobalDataProductObjectTypeEnum.PIPELINE === objectAttributes?.object_type) {
      return t('common.pipeline')?.toLowerCase();
    }

    return objectAttributes?.object_type || t('global_data_products.object_type')?.toLowerCase();
  }, [objectAttributes?.object_type, t]);

  const before = useMemo(
    () => (
      <FlexContainer flexDirection="column" fullHeight>
        <Flex flexDirection="column">
          <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS} px={PADDING_UNITS}>
            <Spacing mb={1}>
              <Text bold>{t('global_data_products.uuid')}</Text>
              <Text muted small>
                {t('global_data_products.uuid_description')}
              </Text>
            </Spacing>

            <TextInput
              monospace
              // @ts-ignore
              onChange={e =>
                setObjectAttributes(prev => ({
                  ...prev,
                  uuid: e.target.value,
                }))
              }
              placeholder={t('global_data_products.uuid_placeholder')}
              primary
              setContentOnMount
              value={objectAttributes?.uuid || ''}
            />
          </Spacing>

          <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS} px={PADDING_UNITS}>
            <Spacing mb={1}>
              <Text bold>{t('global_data_products.object_type')}</Text>
              <Text muted small>
                {t('global_data_products.object_type_description')}
              </Text>
            </Spacing>

            <Select
              onChange={e =>
                setObjectAttributes(prev => ({
                  ...prev,
                  object_type: e.target.value,
                }))
              }
              placeholder={t('global_data_products.only_pipeline_supported')}
              primary
              value={objectAttributes?.object_type || ''}
            >
              {[GlobalDataProductObjectTypeEnum.PIPELINE].map(val => (
                <option key={val} value={val}>
                  {t('common.pipeline')}
                </option>
              ))}
            </Select>
          </Spacing>

          <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS} px={PADDING_UNITS}>
            <Spacing mb={1}>
              <Text bold>{t('global_data_products.object_uuid')}</Text>
              <Text muted small>
                {t('global_data_products.object_uuid_description', {
                  type: objectTypeLabel,
                })}
              </Text>
            </Spacing>

            <Select
              monospace
              // @ts-ignore
              onChange={e =>
                setObjectAttributes(prev => ({
                  ...prev,
                  object_uuid: e.target.value,
                }))
              }
              placeholder={t('global_data_products.select_object_uuid')}
              primary
              value={objectAttributes?.object_uuid || ''}
            >
              {pipelines?.map(({ uuid }) => (
                <option key={uuid} value={uuid}>
                  {uuid}
                </option>
              ))}
            </Select>

            {GlobalDataProductObjectTypeEnum.PIPELINE === objectAttributes?.object_type &&
              objectAttributes?.object_uuid && (
                <Spacing mt={1}>
                  <Text muted small>
                    {t('global_data_products.view_pipeline')}{' '}
                    <NextLink
                      as={`/pipelines/${objectAttributes?.object_uuid}/edit`}
                      href={'/pipelines/[pipeline]/edit'}
                      passHref
                    >
                      <Link bold inline monospace openNewWindow small>
                        {objectAttributes?.object_uuid}
                      </Link>
                    </NextLink>
                    .
                  </Text>
                </Spacing>
              )}
          </Spacing>

          {!isNew && (
            <>
              <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
                <OutdatedAfterField
                  objectAttributes={objectAttributes}
                  setObjectAttributes={setObjectAttributes}
                />
              </Spacing>

              <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
                <OutdatedStartingAtField
                  objectAttributes={objectAttributes}
                  setObjectAttributes={setObjectAttributes}
                />
              </Spacing>

              {blocks?.length >= 1 && (
                <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
                  <SettingsField
                    blocks={blocks}
                    objectAttributes={objectAttributes}
                    setObjectAttributes={setObjectAttributes}
                  />
                </Spacing>
              )}
            </>
          )}
        </Flex>

        <ButtonsStyle>
          <Spacing p={PADDING_UNITS}>
            <FlexContainer>
              <Button
                disabled={buttonDisabled}
                fullWidth
                loading={isLoadingUpdateObject}
                // @ts-ignore
                onClick={() =>
                  updateObject({
                    global_data_product: objectAttributes,
                  })
                }
                primary
              >
                {isNew ? t('global_data_products.create_product') : t('global_data_products.save_product')}
              </Button>
            </FlexContainer>
          </Spacing>
        </ButtonsStyle>
      </FlexContainer>
    ),
    [
      blocks,
      buttonDisabled,
      isLoadingUpdateObject,
      isNew,
      objectAttributes,
      objectTypeLabel,
      pipelines,
      setObjectAttributes,
      t,
      updateObject,
    ],
  );

  const { data: dataPipelineSchedules } = api.pipeline_schedules.list(
    {
      global_data_product_uuid: globalDataProduct?.uuid,
    },
    {},
    {
      pauseFetch: !globalDataProduct?.uuid,
    },
  );
  const pipelineSchedules: PipelineScheduleType[] = useMemo(
    () => dataPipelineSchedules?.pipeline_schedules || [],
    [dataPipelineSchedules],
  );

  const { data: dataPipelineRuns } = api.pipeline_runs.list(
    {
      global_data_product_uuid: globalDataProduct?.uuid,
    },
    {},
    {
      pauseFetch: !globalDataProduct?.uuid,
    },
  );
  const pipelineRuns = useMemo(() => dataPipelineRuns?.pipeline_runs || [], [dataPipelineRuns]);

  return (
    // @ts-ignore
    <TripleLayout
      before={before}
      beforeHeader={
        <Spacing px={PADDING_UNITS}>
          <Text>{t('global_data_products.attributes')}</Text>
        </Spacing>
      }
      beforeHidden={beforeHidden}
      beforeWidth={beforeWidth}
      excludeOffsetFromBeforeDraggableLeft
      leftOffset={VERTICAL_NAVIGATION_WIDTH}
      setBeforeHidden={setBeforeHidden}
      setBeforeWidth={setBeforeWidth}
    >
      {!isNew && (
        <>
          <Spacing p={PADDING_UNITS}>
            <Headline>{t('global_data_products.triggers')}</Headline>
          </Spacing>

          <Divider light />

          <TriggersTable disableActions pipeline={pipeline} pipelineSchedules={pipelineSchedules} />

          <Spacing p={PADDING_UNITS}>
            <Headline>{t('global_data_products.runs')}</Headline>
          </Spacing>

          <Divider light />

          <PipelineRunsTable hideTriggerColumn pipelineRuns={pipelineRuns} />
        </>
      )}
    </TripleLayout>
  );
}

export default GlobalDataProductDetail;
