import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BrowseTemplates from '@components/CustomTemplates/BrowseTemplates';
import Dashboard from '@components/Dashboard';
import PrivateRoute from '@components/shared/PrivateRoute';
import { NAV_TAB_PIPELINES } from '@components/CustomTemplates/BrowseTemplates/constants';
import { OBJECT_TYPE_PIPELINES } from '@interfaces/CustomTemplateType';
import { queryFromUrl } from '@utils/url';

function Templates() {
  const { t } = useTranslation('common');
  const [isNew, setIsNew] = useState<boolean>(false);
  const [objectType, setObjectType] = useState<string>(null);
  const [pipelineUUID, setPipelineUUID] = useState<string>(null);
  const q = queryFromUrl();

  useEffect(() => {
    const {
      new: newParam,
      object_type: objectTypeParam,
      pipeline_uuid: pipelineUUIDParam,
    } = q;

    if (objectTypeParam) {
      setObjectType(objectTypeParam);
    }

    if (pipelineUUIDParam) {
      setPipelineUUID(pipelineUUIDParam);
    }

    setIsNew(!!newParam);
  }, [q]);

  const keys = useMemo(() => {
    const arr = [isNew ? 'new' : 'browse'];

    if (objectType) {
      arr.push(objectType);
    }

    if (pipelineUUID) {
      arr.push(pipelineUUID);
    }

    return arr;
  }, [
    isNew,
    objectType,
    pipelineUUID,
  ]);

  const isPipeline = useMemo(() => OBJECT_TYPE_PIPELINES === objectType, [objectType]);

  return (
    <Dashboard
      addProjectBreadcrumbToCustomBreadcrumbs={isNew}
      // @ts-ignore
      breadcrumbs={isNew
        ? [
          {
            label: () => t('templates.title'),
            linkProps: {
              href: isPipeline ? `/templates?object_type=${OBJECT_TYPE_PIPELINES}` : '/templates',
            },
          },
          {
            bold: true,
            label: () => t('templates.new'),
          },
        ]
        : null
      }
      title={t('templates.title')}
      uuid="Templates/index"
    >
      <BrowseTemplates
        defaultTab={isPipeline ? NAV_TAB_PIPELINES : null}
        key={keys.join('_')}
        objectType={objectType}
        pipelineUUID={pipelineUUID}
        showAddingNewTemplates={isNew}
      />
    </Dashboard>
  );
}

Templates.getInitialProps = async () => ({});

export default PrivateRoute(Templates);
