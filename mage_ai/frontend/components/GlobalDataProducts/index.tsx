import NextLink from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import GlobalDataProductType, {
  GlobalDataProductObjectTypeEnum,
} from '@interfaces/GlobalDataProductType';
import Link from '@oracle/elements/Link';
import Spacing from '@oracle/elements/Spacing';
import Spinner from '@oracle/components/Spinner';
import Table from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import api from '@api';
import { PADDING_UNITS } from '@oracle/styles/units/spacing';
import { pauseEvent } from '@utils/events';

type GlobalDataProductsProps = {
  globalDataProducts?: GlobalDataProductType[];
  onClickRow?: (globalDataProduct: GlobalDataProductType) => void;
};

function GlobalDataProducts({
  globalDataProducts: globalDataProductsProps,
  onClickRow,
}: GlobalDataProductsProps) {
  const { t } = useTranslation('common');
  const router = useRouter();

  const { data: dataGlobalProducts } = api.global_data_products.list(
    {},
    {},
    {
      pauseFetch: !!globalDataProductsProps,
    },
  );
  const globalDataProducts: GlobalDataProductType[] = useMemo(
    () => globalDataProductsProps || dataGlobalProducts?.global_data_products || [],
    [dataGlobalProducts, globalDataProductsProps],
  );

  if (!dataGlobalProducts && !globalDataProductsProps) {
    return (
      <Spacing p={PADDING_UNITS}>
        <Spinner />
      </Spacing>
    );
  }

  if (dataGlobalProducts && globalDataProducts?.length === 0) {
    return (
      <Spacing p={PADDING_UNITS}>
        <Text>{t('global_data_products.no_products')}</Text>
      </Spacing>
    );
  }

  return (
    <Table
      columnFlex={[null, null, null, null]}
      columns={[
        {
          label: () => t('global_data_products.uuid'),
          uuid: 'UUID',
        },
        {
          label: () => t('global_data_products.object_type'),
          uuid: 'Object type',
        },
        {
          label: () => t('global_data_products.object_uuid'),
          uuid: 'Object UUID',
        },
        {
          label: () => t('global_data_products.project'),
          uuid: 'Project',
        },
      ]}
      onClickRow={(rowIndex: number) => {
        const gdp = globalDataProducts?.[rowIndex];
        if (gdp) {
          if (onClickRow) {
            onClickRow?.(gdp);
          } else {
            router.push(
              '/global-data-products/[...slug]',
              `/global-data-products${gdp?.project ? '/' + gdp?.project : ''}/${gdp?.uuid}`,
            );
          }
        }
      }}
      rows={globalDataProducts?.map((globalDataProduct: GlobalDataProductType) => {
        const {
          object_type: objectType,
          object_uuid: objectUUID,
          project,
          uuid,
        } = globalDataProduct;
        const linkProps: {
          as?: string;
          href?: string;
        } = {
          as: null,
          href: null,
        };

        if (GlobalDataProductObjectTypeEnum.PIPELINE === objectType) {
          linkProps.as = `/pipelines/${objectUUID}/edit`;
          linkProps.href = '/pipelines/[pipeline]/edit';
        }

        return [
          <Text key="uuid" monospace>
            {uuid}
          </Text>,
          <Text default key="objectType" monospace>
            {GlobalDataProductObjectTypeEnum.PIPELINE === objectType
              ? t('common.pipeline')
              : objectType
            }
          </Text>,
          <NextLink as={linkProps?.as} href={linkProps?.href || ''} key="objectUUID" passHref>
            <Link
              default
              monospace
              onClick={e => {
                pauseEvent(e);
                router.push(linkProps.href, linkProps.as);
              }}
              preventDefault
            >
              {objectUUID}
            </Link>
          </NextLink>,
          <Text default key="project" monospace>
            {project}
          </Text>,
        ];
      })}
      uuid="global-data-products"
    />
  );
}

export default GlobalDataProducts;
