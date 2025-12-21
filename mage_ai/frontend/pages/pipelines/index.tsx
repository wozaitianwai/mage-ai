import NextLink from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MutateFunction, useMutation } from 'react-query';
import { useRouter } from 'next/router';

import AIControlPanel from '@components/AI/ControlPanel';
import BrowseTemplates from '@components/CustomTemplates/BrowseTemplates';
import Button from '@oracle/elements/Button';
import ButtonTabs from '@oracle/components/Tabs/ButtonTabs';
import Chip from '@oracle/components/Chip';
import ConfigurePipeline from '@components/PipelineDetail/ConfigurePipeline';
import Dashboard from '@components/Dashboard';
import ErrorsType from '@interfaces/ErrorsType';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import InputModal from '@oracle/elements/Inputs/InputModal';
import Link from '@oracle/elements/Link';
import Paginate, { MAX_PAGES, ROW_LIMIT } from '@components/shared/Paginate';
import PipelineType, {
  FILTERABLE_PIPELINE_STATUSES,
  PipelineGroupingEnum,
  PipelineQueryEnum,
  PipelineStatusEnum,
  PipelineTypeEnum,
  PIPELINE_TYPE_INVALID,
} from '@interfaces/PipelineType';
import Preferences from '@components/settings/workspace/Preferences';
import PrivateRoute from '@components/shared/PrivateRoute';
import ProjectType, { FeatureUUIDEnum } from '@interfaces/ProjectType';
import Select from '@oracle/elements/Inputs/Select';
import Spacing from '@oracle/elements/Spacing';
import Spinner from '@oracle/components/Spinner';
import Table, { SortedColumnType } from '@components/shared/Table';
import TagType from '@interfaces/TagType';
import TagsContainer from '@components/Tags/TagsContainer';
import Text from '@oracle/elements/Text';
import Toolbar from '@components/shared/Table/Toolbar';
import UploadPipeline from '@components/PipelineDetail/UploadPipeline';
import api from '@api';
import dark from '@oracle/styles/themes/dark';
import useProject from '@utils/models/project/useProject';
import { BORDER_RADIUS_SMALL } from '@oracle/styles/units/borders';
import { BlockTypeEnum } from '@interfaces/BlockType';
import {
  Check,
  Circle,
  Clone,
  File,
  Open,
  Pause,
  PipelineV3,
  PlayButtonFilled,
  Save,
  Schedule,
} from '@oracle/icons';
import { ErrorProvider } from '@context/Error';
import { GlobalDataProductObjectTypeEnum } from '@interfaces/GlobalDataProductType';
import { HEADER_HEIGHT } from '@components/shared/Header/index.style';
import {
  LOCAL_STORAGE_KEY_PIPELINE_LIST_SORT_COL_IDX,
  LOCAL_STORAGE_KEY_PIPELINE_LIST_SORT_DIRECTION,
  LOCAL_STORAGE_KEY_PIPELINE_SELECTED_TAB_UUID,
  getFilters,
  getGroupBys,
  setFilters,
  setGroupBys,
} from '@storage/pipelines';
import { META_QUERY_KEYS, MetaQueryEnum } from '@api/constants';
import { NAV_TAB_PIPELINES } from '@components/CustomTemplates/BrowseTemplates/constants';
import { OBJECT_TYPE_PIPELINES } from '@interfaces/CustomTemplateType';
import {
  PADDING_UNITS,
  UNIT,
  UNITS_BETWEEN_ITEMS_IN_SECTIONS,
} from '@oracle/styles/units/spacing';
import { ScheduleStatusEnum } from '@interfaces/PipelineScheduleType';
import {
  SortDirectionEnum,
  SortQueryEnum,
  TIMEZONE_TOOLTIP_PROPS,
} from '@components/shared/Table/constants';
import { TableContainerStyle } from '@components/shared/Table/index.style';
import {
  capitalizeRemoveUnderscoreLower,
  isNumeric,
  randomNameGenerator,
} from '@utils/string';
import { dateFormatLong, datetimeInLocalTimezone, utcStringToElapsedTime } from '@utils/date';
import { displayErrorFromReadResponse, onSuccess } from '@api/utils/response';
import { filterQuery, queryFromUrl } from '@utils/url';
import { get, set } from '@storage/localStorage';
import { getNewPipelineButtonMenuItems } from '@components/Dashboard/utils';
import { goToWithQuery } from '@utils/routing';
import { isEmptyObject, selectEntriesWithValues } from '@utils/hash';
import { pauseEvent } from '@utils/events';
import { range, sortByKey } from '@utils/array';
import { storeLocalTimezoneSetting } from '@components/settings/workspace/utils';
import { useModal } from '@context/Modal';
import { initiateDownload } from '@utils/downloads';
import Setup from '@components/AI/Setup';

const TAB_ALL_UUID = 'all';
const TAB_RECENT_UUID = 'recent';
const QUERY_PARAM_TAB = 'tab';
const NON_ARRAY_QUERY_KEYS = [
  PipelineQueryEnum.SEARCH,
];

const sharedOpenButtonProps = {
  borderRadius: `${BORDER_RADIUS_SMALL}px`,
  iconOnly: true,
  noBackground: true,
  noBorder: true,
  outline: true,
  padding: '4px',
};

function PipelineListPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const refButtonTabs = useRef(null);
  const refTable = useRef(null);
  const refPaginate = useRef(null);
  const timeout = useRef(null);

  const {
    fetchProjects,
    project,
  } = useProject();

  const [buttonTabsHeight, setButtonTabsHeight] = useState<number>(null);

  const [selectedPipeline, setSelectedPipeline] = useState<PipelineType>(null);
  const [searchText, setSearchTextState] = useState<string>(null);
  const setSearchText = useCallback((searchQuery: string) => {
    setSearchTextState(searchQuery);

    clearTimeout(timeout.current);

    timeout.current = setTimeout(() => goToWithQuery({
      [MetaQueryEnum.OFFSET]: 0,
      [PipelineQueryEnum.SEARCH]: searchQuery,
    }), 500);
  }, [
    setSearchTextState,
  ]);

  const [pipelinesEditing, setPipelinesEditing] = useState<{
    [uuid: string]: boolean;
  }>({});
  const [errors, setErrors] = useState<ErrorsType>(null);

  const q = queryFromUrl();
  const query = {
    ...filterQuery(q, [
      PipelineQueryEnum.SEARCH,
      PipelineQueryEnum.STATUS,
      PipelineQueryEnum.TAG,
      PipelineQueryEnum.TYPE,
      ...META_QUERY_KEYS,
    ]),
  };

  const selectedTabUUID = useMemo(() => q?.[QUERY_PARAM_TAB], [
    q,
  ]);

  const tabs = useMemo(() => ([
    {
      Icon: PipelineV3,
      label: (opts) => {
        const count = opts?.count;

        return count
          ? t('pipelines.tabs.all_pipelines_with_count', { count })
          : t('pipelines.tabs.all_pipelines');
      },
      uuid: TAB_ALL_UUID,
    },
    {
      Icon: Schedule,
      label: () => t('pipelines.tabs.recently_viewed'),
      uuid: TAB_RECENT_UUID,
    },
  ]), [t]);

  useEffect(() => {
    setButtonTabsHeight(refButtonTabs?.current?.getBoundingClientRect().height);
  }, [
    q,
    refButtonTabs,
  ]);

  const displayLocalTimezone = useMemo(
    () => storeLocalTimezoneSetting(project?.features?.[FeatureUUIDEnum.LOCAL_TIMEZONE]),
    [project?.features],
  );
  const operationHistoryEnabled =
    useMemo(() => project?.features?.[FeatureUUIDEnum.OPERATION_HISTORY], [project]);
  const timezoneTooltipProps = useMemo(() =>
    displayLocalTimezone ? TIMEZONE_TOOLTIP_PROPS : {}
    , [displayLocalTimezone]);

  const { data, mutate: fetchPipelines } = api.pipelines.list({
    ...query,
    include_schedules: 1,
  }, {
    revalidateOnFocus: false,
  });

  const fromHistoryDays = useMemo(() => q?.[PipelineQueryEnum.HISTORY_DAYS] || 7, [q]);

  const {
    data: dataPipelinesFromHistory,
    mutate: fetchPipelinesFromHistory,
  } = api.pipelines.list({
    ...query,
    [PipelineQueryEnum.HISTORY_DAYS]: isNumeric(fromHistoryDays)
      ? Number(fromHistoryDays)
      : fromHistoryDays,
    include_schedules: 1,
  }, {}, {
    pauseFetch: !operationHistoryEnabled || !selectedTabUUID || TAB_RECENT_UUID !== selectedTabUUID,
  });

  const filterPipelinesBySearchText = useCallback(
    (arr: PipelineType[]): PipelineType[] => arr,
    [],
  );

  const pipelines: PipelineType[] = useMemo(
    () => {
      let pipelinesFiltered = filterPipelinesBySearchText(data?.pipelines || []);
      if (q?.[PipelineQueryEnum.TAG]) {
        const tagsFromQuery = q[PipelineQueryEnum.TAG];
        pipelinesFiltered = pipelinesFiltered
          .filter(({ tags }) => (
            tags.some(t => tagsFromQuery.includes(t))
            || (tags.length === 0 && tagsFromQuery.includes(PipelineQueryEnum.NO_TAGS))
          ));
      }

      return pipelinesFiltered;
    },
    [
      data,
      filterPipelinesBySearchText,
      q,
    ],
  );

  const pipelinesFromHistory: PipelineType[] = useMemo(
    () => filterPipelinesBySearchText(dataPipelinesFromHistory?.pipelines || []),
    [
      dataPipelinesFromHistory,
      filterPipelinesBySearchText,
    ]);

  const pipelineStatusLabelMapping = useMemo(() => ({
    [PipelineStatusEnum.ACTIVE]: t('pipelines.status.active', {
      defaultValue: capitalizeRemoveUnderscoreLower(PipelineStatusEnum.ACTIVE),
    }),
    [PipelineStatusEnum.INACTIVE]: t('pipelines.status.inactive', {
      defaultValue: capitalizeRemoveUnderscoreLower(PipelineStatusEnum.INACTIVE),
    }),
    [PipelineStatusEnum.NO_SCHEDULES]: t('pipelines.status.no_schedules'),
  }), [t]);

  const pipelineTypeLabelMapping = useMemo(() => ({
    [PipelineTypeEnum.EXECUTION_FRAMEWORK]: t('pipelines.types.execution_framework', {
      defaultValue: capitalizeRemoveUnderscoreLower(PipelineTypeEnum.EXECUTION_FRAMEWORK),
    }),
    [PipelineTypeEnum.INTEGRATION]: t('pipelines.types.integration', { defaultValue: 'Integration' }),
    [PipelineTypeEnum.PYTHON]: t('pipelines.types.python', { defaultValue: 'Standard' }),
    [PipelineTypeEnum.PYSPARK]: t('pipelines.types.pyspark', { defaultValue: 'PySpark' }),
    [PipelineTypeEnum.STREAMING]: t('pipelines.types.streaming', { defaultValue: 'Streaming' }),
    [PIPELINE_TYPE_INVALID]: t('pipelines.types.invalid', { defaultValue: 'Invalid' }),
  }), [t]);

  const groupByLabelMapping = useMemo(() => ({
    [PipelineGroupingEnum.STATUS]: t('pipelines.headers.status'),
    [PipelineGroupingEnum.TAG]: t('pipelines.headers.tags'),
    [PipelineGroupingEnum.TYPE]: t('pipelines.headers.type'),
  }), [t]);

  const sortableColumnIndexes = useMemo(() => [1, 2, 3, 4, 5, 6, 8, 9], []);
  const sortColumnIndexQuery = q?.[SortQueryEnum.SORT_COL_IDX];
  const sortDirectionQuery = q?.[SortQueryEnum.SORT_DIRECTION];
  const sortedColumnInit: SortedColumnType = useMemo(() => (sortColumnIndexQuery
    ?
    {
      columnIndex: +sortColumnIndexQuery,
      sortDirection: sortDirectionQuery || SortDirectionEnum.ASC,
    }
    : undefined
  ), [sortColumnIndexQuery, sortDirectionQuery]);
  const groupByQuery = q?.[PipelineQueryEnum.GROUP];

  const [downloadPipeline] = useMutation(
    ({
      pipelineUUID,
      filesOnly = false,
    }: {
      pipelineUUID: string;
      filesOnly?: boolean;
    }) =>
      api.downloads.pipelines.useCreate(pipelineUUID)({
        download: { ignore_folder_structure: filesOnly },
      }),
    {
      onSuccess: (response: any) =>
        onSuccess(response, {
          callback: () => {
            const token = response.data.download.token;
            initiateDownload(token);
          },
          onErrorCallback: (response, errors) =>
            setErrors({
              errors,
              response,
            }),
        }),
    },
  );

  useEffect(() => {
    if (query?.[PipelineQueryEnum.SEARCH] && searchText === null) {
      setSearchTextState(query?.[PipelineQueryEnum.SEARCH]);
    }
  }, [
    query,
    searchText,
    setSearchTextState,
  ]);

  useEffect(() => {
    let queryFinal = {};

    if (!sortColumnIndexQuery) {
      const sortColumnIndexFromStorage = get(LOCAL_STORAGE_KEY_PIPELINE_LIST_SORT_COL_IDX, null);
      const sortDirectionFromStorage = get(LOCAL_STORAGE_KEY_PIPELINE_LIST_SORT_DIRECTION, SortDirectionEnum.ASC);
      if (sortColumnIndexFromStorage !== null) {
        queryFinal[SortQueryEnum.SORT_COL_IDX] = sortColumnIndexFromStorage;
        queryFinal[SortQueryEnum.SORT_DIRECTION] = sortDirectionFromStorage;
      }
    }

    if (operationHistoryEnabled) {
      if (selectedTabUUID) {
        set(LOCAL_STORAGE_KEY_PIPELINE_SELECTED_TAB_UUID, selectedTabUUID);
      } else {
        queryFinal[QUERY_PARAM_TAB] = get(
          LOCAL_STORAGE_KEY_PIPELINE_SELECTED_TAB_UUID,
          tabs?.[0]?.uuid || TAB_ALL_UUID,
        );
      }
    }

    if (groupByQuery) {
      setGroupBys({
        [groupByQuery]: true,
      });
    } else {
      let val;
      const groupBys = getGroupBys();
      if (groupBys) {
        Object.entries(groupBys).forEach(([k, v]) => {
          if (!val && v) {
            val = k;
          }
        });
      }

      if (val) {
        queryFinal[PipelineQueryEnum.GROUP] = val;
      }
    }

    if (isEmptyObject(query)) {
      const filtersQuery = {
        [MetaQueryEnum.LIMIT]: ROW_LIMIT,
      };
      const f = getFilters();

      if (f) {
        Object.entries(f).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== null) {
            // @ts-ignore
            if (META_QUERY_KEYS.includes(k) || NON_ARRAY_QUERY_KEYS.includes(k)) {
              filtersQuery[k] = v;
            } else {
              filtersQuery[k] = [];

              Object.entries(v).forEach(([k2, v2]) => {
                if (v2) {
                  filtersQuery[k].push(k2);
                }
              });
            }
          }
        });
      }

      if (!isEmptyObject(filtersQuery)) {
        queryFinal = {};
        Object.entries({
          ...queryFinal,
          ...filtersQuery,
        } || {}).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== null) {
            queryFinal[k] = v;
          }
        });
      }
    } else {
      const f = {};
      Object.entries(query).forEach(([k, v]) => {
        f[k] = {};

        let v2 = v;

        if (typeof v !== 'undefined' && v !== null) {
          // @ts-ignore
          if (META_QUERY_KEYS.includes(k) || NON_ARRAY_QUERY_KEYS.includes(k)) {
            f[k] = v2;
          } else {
            if (!Array.isArray(v2)) {
              // @ts-ignore
              v2 = [v2];
            }

            if (v2 && Array.isArray(v2)) {
              v2?.forEach((v3) => {
                f[k][v3] = true;
              });
            }
          }
        }
      });

      setFilters(selectEntriesWithValues(f));
    }

    if (!isEmptyObject(queryFinal)) {
      goToWithQuery(selectEntriesWithValues(queryFinal), {
        pushHistory: false,
      });
    }
  }, [
    groupByQuery,
    operationHistoryEnabled,
    query,
    selectedTabUUID,
    tabs,
    sortableColumnIndexes,
    sortColumnIndexQuery,
    sortDirectionQuery,
  ]);

  useEffect(() => {
    displayErrorFromReadResponse(data, setErrors);
  }, [data]);

  const useCreatePipelineMutation = (onSuccessCallback) => useMutation(
    api.pipelines.useCreate(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
        callback: ({
          pipeline: {
            uuid,
          },
        }) => {
          onSuccessCallback?.(uuid);
        },
        onErrorCallback: (response, errors) => setErrors({
          errors,
          response,
        }),
      },
      ),
    },
  );
  const [createPipeline, { isLoading: isLoadingCreate }]: [
    MutateFunction<any>,
    { isLoading: boolean },
  ] = useCreatePipelineMutation((pipelineUUID: string) => router.push(
    '/pipelines/[pipeline]/edit',
    `/pipelines/${pipelineUUID}/edit`,
  ));
  const [clonePipeline, { isLoading: isLoadingClone }]: [
    MutateFunction<any>,
    { isLoading: boolean },
  ] = useCreatePipelineMutation(() => {
    fetchPipelines?.();
    fetchPipelinesFromHistory?.();
  });

  const [updatePipeline, { isLoading: isLoadingUpdate }] = useMutation(
    (pipeline: PipelineType & {
      status?: ScheduleStatusEnum;
    }) => api.pipelines.useUpdate(pipeline.uuid)({ pipeline }),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
        callback: ({
          pipeline: {
            uuid,
          },
        }) => {
          setPipelinesEditing(prev => ({
            ...prev,
            [uuid]: false,
          }));
          fetchPipelines();
          fetchPipelinesFromHistory?.();
          hideInputModal?.();
          setSelectedPipeline(null);
        },
        onErrorCallback: (response, errors) => {
          const pipelineUUID = response?.url_parameters?.pk;
          setPipelinesEditing(prev => ({
            ...prev,
            [pipelineUUID]: false,
          }));
          setErrors({
            errors,
            response,
          });
        },
      },
      ),
    },
  );
  const [deletePipeline, { isLoading: isLoadingDelete }] = useMutation(
    (uuid: string) => api.pipelines.useDelete(uuid)(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
        callback: () => {
          fetchPipelines?.();
          fetchPipelinesFromHistory?.();
        },
        onErrorCallback: (response, errors) => setErrors({
          errors,
          response,
        }),
      },
      ),
    },
  );

  const [showCreatePipelineModal, hideCreatePipelineModal] = useModal(({
    pipelineType,
  }: {
    pipelineType: PipelineTypeEnum,
  }) => (
    <ConfigurePipeline
      onClose={hideCreatePipelineModal}
      onSave={({
        name,
        description,
        tags,
      }) => {
        createPipeline({
          pipeline: {
            description,
            name,
            tags,
            type: pipelineType,
          },
        });
      }}
      pipelineType={pipelineType}
    />
  ), {
  }, [
    createPipeline,
  ], {
    background: true,
    disableEscape: true,
    uuid: 'overview/create_pipeline',
  });

  const [showInputModal, hideInputModal] = useModal(({
    pipeline,
    pipelineDescription,
    pipelineName,
  }: {
    pipeline?: PipelineType;
    pipelineDescription?: string;
    pipelineName?: string;
  }) => (
    <InputModal
      isLoading={isLoadingUpdate}
      minWidth={UNIT * 55}
      noEmptyValue={!!pipelineName}
      onClose={hideInputModal}
      onSave={(value: string) => {
        const pipelineToUse = pipeline || selectedPipeline;

        if (pipelineToUse) {
          const selectedPipelineUUID = pipelineToUse.uuid;
          const pipelineUpdateRequestBody: PipelineType = {
            uuid: selectedPipelineUUID,
          };
          if (pipelineName) {
            pipelineUpdateRequestBody.name = value;
          } else {
            pipelineUpdateRequestBody.description = value;
          }

          setPipelinesEditing(prev => ({
            ...prev,
            [selectedPipelineUUID]: true,
          }));
          updatePipeline(pipelineUpdateRequestBody);
        }
      }}
      textArea={!pipelineName}
      title={pipelineName
        ? t('pipelines.actions.rename')
        : t('pipelines.actions.edit_description_for', { name: pipeline?.uuid })
      }
      value={pipelineName ? pipelineName : pipelineDescription}
    />
  ), {}, [
    isLoadingUpdate,
    selectedPipeline,
    t,
  ], {
    background: true,
    uuid: 'rename_pipeline_and_save',
  });

  const [showImportPipelineModal, hideImportPipelineModal] = useModal(() => (
    <UploadPipeline
      fetchPipelines={fetchPipelines}
      onCancel={hideImportPipelineModal}
    />
  ), {
  }, [
    fetchPipelines,
  ], {
    background: true,
    uuid: 'upload_pipeline',
  });

  const [showBrowseTemplates, hideBrowseTemplates] = useModal(() => (
    <ErrorProvider>
      <BrowseTemplates
        contained
        onClickCustomTemplate={(customTemplate) => {
          createPipeline({
            pipeline: {
              custom_template_uuid: customTemplate?.template_uuid,
              name: randomNameGenerator(),
            },
          }).then(() => {
            hideBrowseTemplates();
          });
        }}
        showBreadcrumbs
        tabs={[NAV_TAB_PIPELINES]}
      />
    </ErrorProvider>
  ), {
  }, [
    createPipeline,
  ], {
    background: true,
    uuid: 'browse_templates',
  });

  const [showConfigureProjectModal, hideConfigureProjectModal] = useModal(({
    cancelButtonText,
    header,
    onCancel,
    onSaveSuccess,
  }: {
    cancelButtonText?: string;
    header?: any;
    onCancel?: () => void;
    onSaveSuccess?: (project: ProjectType) => void;
  }) => (
    <ErrorProvider>
      <Preferences
        cancelButtonText={cancelButtonText}
        contained
        header={<Setup />}
        onCancel={() => {
          onCancel?.();
          hideConfigureProjectModal();
        }}
        onSaveSuccess={(project: ProjectType) => {
          fetchProjects();
          hideConfigureProjectModal();
          onSaveSuccess?.(project);
        }}
      />
    </ErrorProvider>
  ), {
  }, [
    fetchProjects,
  ], {
    background: true,
    uuid: 'configure_project',
  });

  const [showAIModal, hideAIModal] = useModal(() => (
    <ErrorProvider>
      <AIControlPanel
        createPipeline={createPipeline}
        isLoading={isLoadingCreate}
        onClose={hideAIModal}
      />
    </ErrorProvider>
  ), {
  }, [
    createPipeline,
    isLoadingCreate,
  ], {
    background: true,
    disableClickOutside: true,
    disableCloseButton: true,
    uuid: 'AI_modal',
  });

  const newPipelineButtonMenuItems = useMemo(() => getNewPipelineButtonMenuItems(
    createPipeline,
    {
      t,
      showAIModal: () => {
        if (!project?.openai_api_key) {
          showConfigureProjectModal({
            onSaveSuccess: () => {
              showAIModal();
            },
          });
        } else {
          showAIModal();
        }
      },
      showBrowseTemplates,
      showCreatePipelineModal,
      showImportPipelineModal,
    },
  ), [
    createPipeline,
    project,
    showAIModal,
    showBrowseTemplates,
    showConfigureProjectModal,
    showCreatePipelineModal,
    showImportPipelineModal,
    t,
  ]);

  const { data: dataTags } = api.tags.list();
  const tags: TagType[] = useMemo(() => sortByKey(dataTags?.tags || [], ({ uuid }) => uuid), [
    dataTags,
  ]);

  const toolbarEl = useMemo(() => (
    <Toolbar
      addButtonProps={{
        isLoading: isLoadingCreate,
        label: t('pipelines.new'),
        menuItems: newPipelineButtonMenuItems,
      }}
      deleteRowProps={{
        confirmationMessage: t('pipelines.actions.delete_warning'),
        isLoading: isLoadingDelete,
        item: t('common.pipeline'),
        onDelete: () => {
          if (typeof window !== 'undefined'
            && window.confirm(
              t('pipelines.actions.delete_confirmation', { uuid: selectedPipeline?.uuid }),
            )
          ) {
            deletePipeline(selectedPipeline?.uuid);
          }
        },
      }}
      extraActionButtonProps={{
        Icon: Clone,
        confirmationDescription: t('pipelines.actions.clone_confirmation_description'),
        confirmationMessage: t('pipelines.actions.clone_confirmation_title', {
          uuid: selectedPipeline?.uuid,
        }),
        isLoading: isLoadingClone,
        onClick: () => clonePipeline({
          pipeline: { clone_pipeline_uuid: selectedPipeline?.uuid },
        }),
        openConfirmationDialogue: true,
        tooltip: t('pipelines.actions.clone'),
      }}
      filterOptions={{
        status: FILTERABLE_PIPELINE_STATUSES,
        tag: [PipelineQueryEnum.NO_TAGS, ...tags.map(({ uuid }) => uuid)],
        type: Object.values(PipelineTypeEnum),
      }}
      filterValueLabelMapping={{
        status: FILTERABLE_PIPELINE_STATUSES.reduce(
          (acc, cv) => ({ ...acc, [cv]: pipelineStatusLabelMapping[cv] }), {},
        ),
        tag: {
          [PipelineQueryEnum.NO_TAGS]: t('pipelines.no_tags'),
          ...tags.reduce((acc, { uuid }) => ({
            ...acc,
            [uuid]: uuid,
          }), {}),
        },
        type: pipelineTypeLabelMapping,
      }}
      groupButtonProps={{
        groupByLabel: groupByQuery ? groupByLabelMapping[groupByQuery] : null,
        menuItems: [
          {
            beforeIcon: groupByQuery === PipelineGroupingEnum.STATUS
              ? <Check
                fill={dark.content.default}
                size={UNIT * 1.5}
              />
              : <Circle muted size={UNIT * 1.5} />
            ,
            label: () => groupByLabelMapping[PipelineGroupingEnum.STATUS],
            onClick: () => {
              const val = groupByQuery === PipelineGroupingEnum.STATUS
                ? null
                : PipelineGroupingEnum.STATUS;

              if (!val) {
                setGroupBys({});
              }

              goToWithQuery({
                [PipelineQueryEnum.GROUP]: val,
              }, {
                pushHistory: true,
              });
            },
            uuid: 'Pipelines/GroupMenu/Status',
          },
          {
            beforeIcon: groupByQuery === PipelineGroupingEnum.TAG
              ? <Check
                fill={dark.content.default}
                size={UNIT * 1.5}
              />
              : <Circle muted size={UNIT * 1.5} />
            ,
            label: () => groupByLabelMapping[PipelineGroupingEnum.TAG],
            onClick: () => {
              const val = groupByQuery === PipelineGroupingEnum.TAG
                ? null
                : PipelineGroupingEnum.TAG;

              if (!val) {
                setGroupBys({});
              }

              goToWithQuery({
                [PipelineQueryEnum.GROUP]: val,
              }, {
                pushHistory: true,
              });
            },
            uuid: 'Pipelines/GroupMenu/Tag',
          },
          {
            beforeIcon: groupByQuery === PipelineGroupingEnum.TYPE
              ? <Check
                fill={dark.content.default}
                size={UNIT * 1.5}
              />
              : <Circle muted size={UNIT * 1.5} />
            ,
            label: () => groupByLabelMapping[PipelineGroupingEnum.TYPE],
            onClick: () => {
              const val = groupByQuery === PipelineGroupingEnum.TYPE
                ? null
                : PipelineGroupingEnum.TYPE;

              if (!val) {
                setGroupBys({});
              }

              goToWithQuery({
                [PipelineQueryEnum.GROUP]: val,
              }, {
                pushHistory: true,
              });
            },
            uuid: 'Pipelines/GroupMenu/Type',
          },
        ],
      }}
      moreActionsMenuItems={[
        {
          label: () => t('pipelines.actions.rename'),
          onClick: () => showInputModal({ pipelineName: selectedPipeline?.name }),
          uuid: 'Pipelines/MoreActionsMenu/Rename',
        },
        {
          label: () => t('pipelines.actions.edit_description'),
          onClick: () => showInputModal({
            pipeline: selectedPipeline,
            pipelineDescription: selectedPipeline?.description,
          }),
          uuid: 'Pipelines/MoreActionsMenu/EditDescription',
        },
      ]}
      onClickFilterDefaults={() => {
        setFilters({});
        setSearchTextState('');
        fetchPipelines?.().then(() => {
          goToWithQuery({
            [MetaQueryEnum.LIMIT]: query?.[MetaQueryEnum.LIMIT] || ROW_LIMIT,
            [PipelineQueryEnum.SEARCH]: '',
          }, {
            replaceParams: true,
          });
        });
      }}
      onFilterApply={(query, updatedQuery) => {
        // @ts-ignore
        if (Object.values(updatedQuery).every(arr => !arr?.length)) {
          setFilters({});
        }
      }}
      // @ts-ignore
      query={query}
      resetLimitOnFilterApply
      searchProps={{
        placeholder: t('pipelines.search_placeholder'),
        onChange: setSearchText,
        value: searchText,
      }}
      selectedRowId={selectedPipeline?.uuid}
      setSelectedRow={setSelectedPipeline}
    />
  ), [
    clonePipeline,
    deletePipeline,
    fetchPipelines,
    groupByQuery,
    groupByLabelMapping,
    isLoadingClone,
    isLoadingCreate,
    isLoadingDelete,
    newPipelineButtonMenuItems,
    pipelineStatusLabelMapping,
    pipelineTypeLabelMapping,
    query,
    searchText,
    selectedPipeline,
    setSearchText,
    showInputModal,
    tags,
    t,
  ]);

  const buildRowGroupInfo = useCallback((pipelinesInner: PipelineType[]) => {
    const mapping = {};

    pipelinesInner?.forEach((pipeline, idx: number) => {
      let value = pipeline?.[groupByQuery];

      if (PipelineGroupingEnum.STATUS === groupByQuery) {
        const { schedules = [] } = pipeline || {};
        // TODO (tommy dang): when is the pipeline status RETRY?
        const schedulesCount = schedules.length;
        const isActive = schedules.find(({ status }) => ScheduleStatusEnum.ACTIVE === status);
        value = isActive
          ? PipelineStatusEnum.ACTIVE
          : schedulesCount >= 1 ? PipelineStatusEnum.INACTIVE : PipelineStatusEnum.NO_SCHEDULES;

      } else if (PipelineGroupingEnum.TAG === groupByQuery) {
        const pt = pipeline?.tags;
        if (pt) {
          value = sortByKey(pipeline.tags, uuid => uuid).join(', ');
        } else {
          value = '';
        }
      }

      if (!mapping[value]) {
        mapping[value] = [];
      }

      mapping[value].push(idx);
    });

    const arr = [];
    const headers = [];

    if (PipelineGroupingEnum.STATUS === groupByQuery) {
      Object.values(PipelineStatusEnum).forEach((val) => {
        arr.push(mapping[val]);
        headers.push(pipelineStatusLabelMapping[val] || capitalizeRemoveUnderscoreLower(val));
      });
    } else if (PipelineGroupingEnum.TAG === groupByQuery) {
      sortByKey(Object.keys(mapping), uuid => uuid).forEach((val: string) => {
        arr.push(mapping[val]);
        if (val) {
          headers.push(val.split(', ').map((v: string, idx: number) => (
            <>
              <div
                key={`${v}-${idx}-spacing`}
                style={{
                  marginLeft: idx >= 1 ? 4 : 0,
                }}
              />
              <Chip key={`${v}-${idx}`} small>
                <Text>
                  {v}
                </Text>
              </Chip>
            </>
          )));
        } else {
          headers.push(t('pipelines.no_tags'));
        }
      });
    } else if (PipelineGroupingEnum.TYPE === groupByQuery) {
      Object.values(PipelineTypeEnum).forEach((val) => {
        arr.push(mapping[val]);
        headers.push(pipelineTypeLabelMapping[val]);
      });
    }

    const headersFinal = [];
    const arrFinal = [];

    arr?.forEach((rows, idx: number) => {
      if (typeof rows !== 'undefined' && rows !== null && rows?.length >= 1) {
        arrFinal.push(rows);
        headersFinal.push(headers?.[idx]);
      }
    });

    return {
      rowGroupHeaders: headersFinal,
      rowsGroupedByIndex: arrFinal,
    };
  }, [
    groupByQuery,
    pipelineStatusLabelMapping,
    pipelineTypeLabelMapping,
    t,
  ]);

  const {
    rowGroupHeaders,
    rowsGroupedByIndex,
  } = useMemo(() => buildRowGroupInfo(pipelines), [
    buildRowGroupInfo,
    pipelines,
  ]);

  const {
    rowGroupHeaders: rowGroupHeadersFromHistory,
    rowsGroupedByIndex: rowsGroupedByIndexFromHistory,
  } = useMemo(() => buildRowGroupInfo(pipelinesFromHistory), [
    buildRowGroupInfo,
    pipelinesFromHistory,
  ]);

  const renderTable = useCallback((
    pipelinesInner: PipelineType[],
    rowGroupHeadersInner: string[] | any[],
    rowsGroupedByIndexInner: number[][],
  ) => (
    <Table
      columnFlex={[null, null, null, 2, null, null, null, 1, null, null, null]}
      columns={[
        {
          label: () => '',
          uuid: 'action',
        },
        {
          label: () => t('pipelines.headers.status'),
          uuid: PipelineGroupingEnum.STATUS,
        },
        {
          label: () => t('pipelines.headers.name'),
          uuid: 'name',
        },
        {
          label: () => t('pipelines.headers.description'),
          uuid: 'description',
        },
        {
          label: () => t('pipelines.headers.type'),
          uuid: PipelineGroupingEnum.TYPE,
        },
        {
          ...timezoneTooltipProps,
          label: () => t('pipelines.headers.updated_at'),
          uuid: 'updated_at',
        },
        {
          ...timezoneTooltipProps,
          label: () => t('pipelines.headers.created_at'),
          uuid: 'created_at',
        },
        {
          label: () => t('pipelines.headers.tags'),
          uuid: 'tags',
        },
        {
          label: () => t('common.blocks'),
          uuid: 'blocks',
        },
        {
          label: () => t('pipeline.triggers'),
          uuid: 'triggers',
        },
        {
          center: true,
          label: () => '',
          uuid: 'actions',
        },
      ]}
      isSelectedRow={(rowIndex: number) => pipelinesInner[rowIndex]?.uuid === selectedPipeline?.uuid}
      localStorageKeySortColIdx={LOCAL_STORAGE_KEY_PIPELINE_LIST_SORT_COL_IDX}
      localStorageKeySortDirection={LOCAL_STORAGE_KEY_PIPELINE_LIST_SORT_DIRECTION}
      onClickRow={(rowIndex: number) => setSelectedPipeline(prev => {
        const pipeline = pipelinesInner[rowIndex];

        return (prev?.uuid !== pipeline?.uuid) ? pipeline : null;
      })}
      onDoubleClickRow={(rowIndex: number) => {
        router.push(
          '/pipelines/[pipeline]/edit',
          `/pipelines/${pipelinesInner[rowIndex].uuid}/edit`,
        );
      }}
      ref={refTable}
      renderRightClickMenuItems={(rowIndex: number) => {
        const selectedPipeline = pipelinesInner[rowIndex];

        return [
          {
            label: () => t('pipelines.actions.edit_description'),
            onClick: () => showInputModal({
              pipeline: selectedPipeline,
              pipelineDescription: selectedPipeline?.description,
            }),
            uuid: 'edit_description',
          },
          {
            label: () => t('pipelines.actions.rename'),
            onClick: () => showInputModal({
              pipeline: selectedPipeline,
              pipelineName: selectedPipeline?.name,
            }),
            uuid: 'rename',
          },
          {
            label: () => t('pipelines.actions.clone'),
            onClick: () => clonePipeline({
              pipeline: {
                clone_pipeline_uuid: selectedPipeline?.uuid,
              },
            }),
            uuid: 'clone',
          },
          {
            label: () => t('pipelines.actions.download_folder'),
            onClick: () => {
              downloadPipeline({
                filesOnly: false,
                pipelineUUID: selectedPipeline?.uuid,
              });
            },
            uuid: 'download_keep_folder_structure',
          },
          {
            label: () => t('pipelines.actions.download_zip'),
            onClick: () => {
              downloadPipeline({
                filesOnly: true,
                pipelineUUID: selectedPipeline?.uuid,
              });
            },
            uuid: 'download_without_folder_structure',
          },
          {
            label: () => t('pipelines.actions.add_remove_tags'),
            onClick: () => {
              router.push(
                '/pipelines/[pipeline]/settings',
                `/pipelines/${selectedPipeline?.uuid}/settings`,
              );
            },
            uuid: 'add_tags',
          },
          {
            label: () => t('pipelines.actions.create_template'),
            onClick: () => {
              router.push(
                `/templates?object_type=${OBJECT_TYPE_PIPELINES}&new=1&pipeline_uuid=${selectedPipeline?.uuid}`,
              );
            },
            uuid: 'create_custom_template',
          },
          {
            label: () => t('pipelines.actions.create_global_data_product'),
            onClick: () => {
              router.push(
                `/global-data-products?object_type=${GlobalDataProductObjectTypeEnum.PIPELINE}&new=1&object_uuid=${selectedPipeline?.uuid}`,
              );
            },
            uuid: 'create_global_data_product',
          },
          {
            label: () => t('pipelines.actions.delete'),
            onClick: () => {
              if (typeof window !== 'undefined'
                && window.confirm(
                  t('pipelines.actions.delete_confirmation', { uuid: selectedPipeline?.uuid }),
                )
              ) {
                deletePipeline(selectedPipeline?.uuid);
              }
            },
            uuid: 'delete',
          },
        ];
      }}
      rightClickMenuHeight={36 * 7}
      rightClickMenuWidth={UNIT * 30}
      rowGroupHeaders={rowGroupHeadersInner}
      rows={pipelinesInner?.map((pipeline, idx) => {
        const {
          blocks,
          created_at: createdAt,
          description,
          schedules,
          tags,
          type,
          updated_at: updatedAt,
          uuid,
        } = pipeline;
        const blocksCount = blocks.filter(({ type }) => BlockTypeEnum.SCRATCHPAD !== type).length;
        const schedulesCount = schedules.length;
        const isActive = schedules.find(({ status }) => ScheduleStatusEnum.ACTIVE === status);
        const isInvalid = type as string === PIPELINE_TYPE_INVALID;
        const statusLabel = isActive
          ? pipelineStatusLabelMapping[PipelineStatusEnum.ACTIVE]
          : schedulesCount >= 1
            ? pipelineStatusLabelMapping[PipelineStatusEnum.INACTIVE]
            : pipelineStatusLabelMapping[PipelineStatusEnum.NO_SCHEDULES];
        const typeLabel = isInvalid
          ? pipelineTypeLabelMapping[PIPELINE_TYPE_INVALID]
          : pipelineTypeLabelMapping[type]
            || (type ? capitalizeRemoveUnderscoreLower(type as string) : '');

        const tagsEl = (
          <div key={`pipeline_tags_${idx}`}>
            <TagsContainer
              tags={tags?.map(tag => ({ uuid: tag }))}
            />
          </div>
        );

        return [
          (schedulesCount >= 1 || !!pipelinesEditing[uuid])
            ? (
              <Button
                iconOnly
                loading={!!pipelinesEditing[uuid]}
                noBackground
                noBorder
                noPadding
                onClick={(e) => {
                  pauseEvent(e);
                  setPipelinesEditing(prev => ({
                    ...prev,
                    [uuid]: true,
                  }));
                  updatePipeline({
                    ...pipeline,
                    status: isActive
                      ? ScheduleStatusEnum.INACTIVE
                      : ScheduleStatusEnum.ACTIVE,
                  });
                }}
              >
                {isActive
                  ? <Pause muted size={2 * UNIT} />
                  : <PlayButtonFilled default size={2 * UNIT} />
                }
              </Button>
            )
            : null
          ,
          <Text
            default={!isActive}
            key={`pipeline_status_${idx}`}
            monospace
            success={!!isActive}
          >
            {statusLabel}
          </Text>,
          <NextLink
            as={`/pipelines/${uuid}`}
            href="/pipelines/[pipeline]"
            key={`pipeline_name_${idx}`}
            passHref
          >
            <Link sameColorAsText>
              {uuid}
            </Link>
          </NextLink>,
          <Text
            default
            key={`pipeline_description_${idx}`}
            preWrap
            title={description}
          >
            {description}
          </Text>,
          <Text
            bold={isInvalid}
            danger={isInvalid}
            key={`pipeline_type_${idx}`}
          >
            {typeLabel}
          </Text>,
          <Text
            key={`pipeline_updated_at_${idx}`}
            monospace
            small
            title={updatedAt ? utcStringToElapsedTime(updatedAt) : null}
          >
            {updatedAt
              ? datetimeInLocalTimezone(
                dateFormatLong(updatedAt, { includeSeconds: true, utcFormat: true }),
                displayLocalTimezone,
              )
              : <>&#8212;</>}
          </Text>,
          <Text
            key={`pipeline_created_at_${idx}`}
            monospace
            small
            title={createdAt ? utcStringToElapsedTime(createdAt) : null}
          >
            {createdAt
              ? datetimeInLocalTimezone(createdAt.slice(0, 19), displayLocalTimezone)
              : <>&#8212;</>}
          </Text>,
          tagsEl,
          <Text
            default={blocksCount === 0}
            key={`pipeline_block_count_${idx}`}
            monospace
          >
            {blocksCount}
          </Text>,
          <Text
            default={schedulesCount === 0}
            key={`pipeline_trigger_count_${idx}`}
            monospace
          >
            {schedulesCount}
          </Text>,
          <Flex
            flex={1} justifyContent="flex-end"
            key={`chevron_icon_${idx}`}
          >
            <Button
              {...sharedOpenButtonProps}
              onClick={() => {
                downloadPipeline({ pipelineUUID: uuid });
              }}
              title={t('pipelines.actions.download_folder')}
            >
              <Save default size={2 * UNIT} />
            </Button>
            <Spacing mr={1} />
            <Button
              {...sharedOpenButtonProps}
              onClick={() => {
                router.push(
                  '/pipelines/[pipeline]',
                  `/pipelines/${uuid}`,
                );
              }}
              title={t('common.detail')}
            >
              <Open default size={2 * UNIT} />
            </Button>
            <Spacing mr={1} />
            <Button
              {...sharedOpenButtonProps}
              onClick={() => {
                router.push(
                  '/pipelines/[pipeline]/logs',
                  `/pipelines/${uuid}/logs`,
                );
              }}
              title={t('common.logs')}
            >
              <File default size={2 * UNIT} />
            </Button>
          </Flex>,
        ];
      })}
      rowsGroupedByIndex={rowsGroupedByIndexInner}
      sortableColumnIndexes={sortableColumnIndexes}
      sortedColumn={sortedColumnInit}
      stickyHeader
      uuid="pipelines_table"
    />
  ), [
    clonePipeline,
    deletePipeline,
    downloadPipeline,
    displayLocalTimezone,
    pipelinesEditing,
    pipelineStatusLabelMapping,
    pipelineTypeLabelMapping,
    router,
    selectedPipeline,
    setPipelinesEditing,
    setSelectedPipeline,
    showInputModal,
    sortableColumnIndexes,
    sortedColumnInit,
    timezoneTooltipProps,
    t,
    updatePipeline,
  ]);

  const pipelinesTableMemo = useMemo(() => renderTable(
    pipelines,
    rowGroupHeaders,
    rowsGroupedByIndex,
  ), [
    pipelines,
    renderTable,
    rowGroupHeaders,
    rowsGroupedByIndex,
  ]);

  const pipelinesFromHistoryTableMemo = useMemo(() => renderTable(
    pipelinesFromHistory,
    rowGroupHeadersFromHistory,
    rowsGroupedByIndexFromHistory,
  ), [
    pipelinesFromHistory,
    renderTable,
    rowGroupHeadersFromHistory,
    rowsGroupedByIndexFromHistory,
  ]);

  const pipelinesCount = useMemo(() => pipelines?.length || 0, [pipelines]);
  const pipelinesFromHistoryCount =
    useMemo(() => pipelinesFromHistory?.length || 0, [pipelinesFromHistory]);

  const showNoPipelinesForTab =
    useMemo(() => ((!operationHistoryEnabled || TAB_ALL_UUID === selectedTabUUID) && !pipelinesCount)
      || (operationHistoryEnabled && TAB_RECENT_UUID === selectedTabUUID && !pipelinesFromHistoryCount),
      [
        operationHistoryEnabled,
        pipelinesCount,
        pipelinesFromHistoryCount,
        selectedTabUUID,
      ]);

  const limitMemo = useMemo(() => {
    const limit = query?.[MetaQueryEnum.LIMIT];

    return (
      <FlexContainer alignItems="center">
        <Text muted small>
          {t('pipelines.per_page')}
        </Text>

        <Spacing mr={1} />

        <Select
          compact
          onChange={e => goToWithQuery({
            [MetaQueryEnum.LIMIT]: e.target.value,
            [MetaQueryEnum.OFFSET]: 0,
          }, {
            pushHistory: true,
          })}
          small
          value={limit}
        >
          {limit && ((limit > (5 * ROW_LIMIT)) || (limit % ROW_LIMIT)) && (
            <option value={limit}>
              {limit}
            </option>
          )}
          {range(5).map((i, idx) => {
            const val = (idx + 1) * ROW_LIMIT;

            return (
              <option key={val} value={val}>
                {val}
              </option>
            );
          })}
        </Select>
      </FlexContainer>
    );
  }, [
    query,
    t,
  ]);

  const paginateMemo = useMemo(() => {
    let dataUse = data;
    if (operationHistoryEnabled && TAB_RECENT_UUID === selectedTabUUID) {
      dataUse = dataPipelinesFromHistory;
    }
    const count = dataUse?.metadata?.count || 0;
    const limit = query?.[MetaQueryEnum.LIMIT] || ROW_LIMIT;
    const offset = query?.[MetaQueryEnum.OFFSET] || 0;
    const totalPages = Math.ceil(count / limit);

    return (
      <Spacing p={PADDING_UNITS}>
        <Paginate
          maxPages={MAX_PAGES}
          onUpdate={(p) => {
            const newPage = Number(p);
            goToWithQuery({
              [MetaQueryEnum.OFFSET]: newPage * limit,
            });
          }}
          page={Math.floor(offset / limit)}
          totalPages={totalPages}
        />
      </Spacing>
    );
  }, [
    data,
    dataPipelinesFromHistory,
    operationHistoryEnabled,
    query,
    selectedTabUUID,
  ]);

  return (
    <Dashboard
      errors={errors}
      setErrors={setErrors}
      subheaderChildren={(
        <FlexContainer alignItems="center" justifyContent="space-between">
          {toolbarEl}

          {limitMemo}
        </FlexContainer>
      )}
      title={t('sidebar.pipelines')}
      uuid="pipelines/index"
    >
      {operationHistoryEnabled && (
        <Spacing
          px={PADDING_UNITS}
          ref={refButtonTabs}
        >
          <ButtonTabs
            noPadding
            onClickTab={({ uuid }) => goToWithQuery({
              [QUERY_PARAM_TAB]: uuid,
              [MetaQueryEnum.OFFSET]: 0,
            }, {
              pushHistory: true,
            })}
            regularSizeText
            selectedTabUUID={selectedTabUUID}
            tabs={tabs.map(({
              Icon,
              label,
              uuid,
            }) => ({
              Icon,
              label: () => label({
                count: data?.metadata?.count,
              }),
              uuid,
            }))}
            underlineStyle
          />
        </Spacing>
      )}

      {showNoPipelinesForTab
        ? (
          <Spacing p={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
            {!data
              ?
              <Spinner inverted large />
              :
              <Text bold default monospace muted>
                {t('pipelines.no_pipelines')}
              </Text>
            }
          </Spacing>
        ) : null
      }

      <TableContainerStyle
        hide={showNoPipelinesForTab}
        includePadding={!!groupByQuery}
        // 74 is the subheader height. 68 is the pagination bar height.
        maxHeight={`calc(100vh - ${HEADER_HEIGHT + 74 + (buttonTabsHeight || 44) + 68}px)`}
      >
        {(!operationHistoryEnabled || TAB_ALL_UUID === selectedTabUUID)
          && pipelinesTableMemo
        }

        {operationHistoryEnabled
          && TAB_RECENT_UUID === selectedTabUUID
          && pipelinesFromHistoryTableMemo
        }
      </TableContainerStyle>

      <div ref={refPaginate}>
        {paginateMemo}
      </div>
    </Dashboard>
  );
}

PipelineListPage.getInitialProps = async () => ({});

export default PrivateRoute(PipelineListPage);
