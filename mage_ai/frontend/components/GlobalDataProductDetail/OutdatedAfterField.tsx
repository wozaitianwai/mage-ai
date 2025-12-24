import GlobalDataProductType from '@interfaces/GlobalDataProductType';
import Spacing from '@oracle/elements/Spacing';
import Table from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
import { useTranslation } from 'react-i18next';
import { PADDING_UNITS } from '@oracle/styles/units/spacing';

type OutdatedAfterFieldProps = {
  objectAttributes: GlobalDataProductType;
  originalAttributes?: GlobalDataProductType;
  setObjectAttributes: (func: (prev: GlobalDataProductType) => GlobalDataProductType) => void;
};

function OutdatedAfterField({
  objectAttributes,
  originalAttributes,
  setObjectAttributes,
}: OutdatedAfterFieldProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <Spacing mb={1} px={PADDING_UNITS}>
        <Text bold>
          {t('global_data_products.outdated_after.title')}
        </Text>
        <Text muted small>
          {t('global_data_products.outdated_after.description')}
        </Text>
      </Spacing>

      <Table
        columnFlex={[null, 1]}
        columns={[
          {
            label: () => t('global_data_products.unit'),
            uuid: 'Unit',
          },
          {
            label: () => t('global_data_products.value'),
            uuid: 'Value',
          },
        ]}
        rows={[
          {
            uuid: 'seconds',
          },
          {
            uuid: 'weeks',
          },
          {
            uuid: 'months',
          },
          {
            uuid: 'years',
          },
        ].map(({
          uuid,
        }: {
          uuid: string;
        }) => {
          const value = objectAttributes?.outdated_after?.[uuid];
          const valueOriginal = originalAttributes?.outdated_after?.[uuid];

          return [
            <Text default key={`label-${uuid}`} monospace>
              {t(`global_data_products.outdated_after.units.${uuid}`)}{valueOriginal && (
                <Text inline monospace muted>
                  {t('global_data_products.default_value', { value: valueOriginal })}
                </Text>
              )}
            </Text>,
            <TextInput
              compact
              key={`input-${uuid}`}
              monospace
              // @ts-ignore
              onChange={e => setObjectAttributes(prev => ({
                ...prev,
                outdated_after: {
                  ...prev?.outdated_after,
                  [uuid]: e.target.value?.length === 0 ? null : Number(e.target.value),
                },
              }))}
              placeholder={t('global_data_products.enter_a_number')}
              primary
              setContentOnMount
              small
              type="number"
              value={(typeof value === 'undefined' || value === null) ? '' : value}
            />,
          ];
        })}
      />
    </>
  );
}

export default OutdatedAfterField;
