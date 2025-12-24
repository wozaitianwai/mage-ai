import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@oracle/elements/Button';
import Dashboard from '@components/Dashboard';
import GlobalDataProductDetail from '@components/GlobalDataProductDetail';
import GlobalDataProductsPageComponent from '@components/GlobalDataProducts';
import PrivateRoute from '@components/shared/PrivateRoute';
import Spacing from '@oracle/elements/Spacing';
import { Add } from '@oracle/icons';
import { GlobalDataProductObjectTypeEnum } from '@interfaces/GlobalDataProductType';
import { PADDING_UNITS, UNIT } from '@oracle/styles/units/spacing';
import { queryFromUrl } from '@utils/url';

function GlobalDataProductsPage() {
  const { t } = useTranslation('common');
  const [isNew, setIsNew] = useState<boolean>(false);
  const [objectUUID, setObjectUUID] = useState<string>(null);
  const [objectType, setObjectType] = useState<string>(null);
  const q = queryFromUrl();

  useEffect(() => {
    const {
      new: newParam,
      object_type: objectTypeParam,
      object_uuid: objectUUIDParam,
    } = q;

    if (objectTypeParam) {
      setObjectType(objectTypeParam);
    }

    if (objectUUIDParam) {
      setObjectUUID(objectUUIDParam);
    }

    setIsNew(!!newParam);
  }, [q]);

  return (
    <Dashboard
      addProjectBreadcrumbToCustomBreadcrumbs={isNew}
      // @ts-ignore
      breadcrumbs={isNew
        ? [
          {
            label: () => t('global_data_products.title'),
            linkProps: {
              href: '/global-data-products',
            },
          },
          {
            bold: true,
            label: () => t('global_data_products.new'),
          },
        ]
        : null
      }
      title={t('global_data_products.title')}
      uuid="GlobalDataProducts/index"
    >
      <Spacing p={PADDING_UNITS}>
        <Button
          beforeIcon={<Add size={UNIT * 2.5} />}
          // @ts-ignore
          inline
          linkProps={{
            as: '/global-data-products?new=1',
            href: '/global-data-products',
          }}
          noHoverUnderline
          primary
          sameColorAsText
        >
          {t('global_data_products.new_product')}
        </Button>
      </Spacing>

      {isNew && (
        <GlobalDataProductDetail
          globalDataProduct={{
            object_type: objectType ? objectType as GlobalDataProductObjectTypeEnum : null,
            object_uuid: objectUUID,
          }}
          isNew={isNew}
        />
      )}

      {!isNew && (
        <GlobalDataProductsPageComponent />
      )}
    </Dashboard>
  );
}

GlobalDataProductsPage.getInitialProps = async () => ({});

export default PrivateRoute(GlobalDataProductsPage);
