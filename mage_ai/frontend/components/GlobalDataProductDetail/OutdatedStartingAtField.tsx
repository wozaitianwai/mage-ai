import GlobalDataProductType from '@interfaces/GlobalDataProductType';
import Select from '@oracle/elements/Inputs/Select';
import Spacing from '@oracle/elements/Spacing';
import Table from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
import { useTranslation } from 'react-i18next';
import { PADDING_UNITS } from '@oracle/styles/units/spacing';
import { range } from '@utils/array';

type OutdatedStartingAtFieldProps = {
  objectAttributes: GlobalDataProductType;
  originalAttributes?: GlobalDataProductType;
  setObjectAttributes: (func: (prev: GlobalDataProductType) => GlobalDataProductType) => void;
};

function OutdatedStartingAtField({
  objectAttributes,
  originalAttributes,
  setObjectAttributes,
}: OutdatedStartingAtFieldProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <Spacing mb={1} px={PADDING_UNITS}>
        <Text bold>
          {t('global_data_products.outdated_starting_at.title')}
          <Text inline muted>
            {t('global_data_products.optional')}
          </Text>
        </Text>
        <Text muted small>
          {t('global_data_products.outdated_starting_at.description')}
        </Text>

        <div style={{ marginTop: 4 }}>
          <Text muted small>
            {t('global_data_products.outdated_starting_at.example_before')}
            <Text bold inline muted small>
              {t('global_data_products.outdated_starting_at.title')}
            </Text>
            {t('global_data_products.outdated_starting_at.example_between')}
            <Text bold inline muted small>
              {t('global_data_products.outdated_starting_at.units.hour_of_day')}
            </Text>
            {t('global_data_products.outdated_starting_at.example_after')}
          </Text>
        </div>
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
            uuid: 'second_of_minute',
            values: range(60).map((_, i) => ({
              uuid: i,
              value: i,
            })),
          },
          {
            uuid: 'minute_of_hour',
            values: range(60).map((_, i) => ({
              uuid: i,
              value: i,
            })),
          },
          {
            uuid: 'hour_of_day',
            values: range(24).map((_, i) => ({
              uuid: i,
              value: i,
            })),
          },
          {
            uuid: 'day_of_week',
            values: [
              { key: 'sunday', value: 0 },
              { key: 'monday', value: 1 },
              { key: 'tuesday', value: 2 },
              { key: 'wednesday', value: 3 },
              { key: 'thursday', value: 4 },
              { key: 'friday', value: 5 },
              { key: 'saturday', value: 6 },
            ].map(({ key, value }) => ({
              uuid: t(`global_data_products.outdated_starting_at.days_of_week.${key}`),
              value,
            })),
          },
          {
            uuid: 'day_of_month',
            values: range(31).map((_, i) => ({
              uuid: i + 1,
              value: i + 1,
            })),
          },
          {
            uuid: 'day_of_year',
            values: range(365).map((_, i) => ({
              uuid: i + 1,
              value: i + 1,
            })),
          },
          {
            uuid: 'week_of_month',
            values: range(5).map((_, i) => ({
              uuid: i + 1,
              value: i + 1,
            })),
          },
          {
            uuid: 'week_of_year',
            values: range(52).map((_, i) => ({
              uuid: i + 1,
              value: i + 1,
            })),
          },
          {
            uuid: 'month_of_year',
            values: [
              { key: 'january', value: 1 },
              { key: 'february', value: 2 },
              { key: 'march', value: 3 },
              { key: 'april', value: 4 },
              { key: 'may', value: 5 },
              { key: 'june', value: 6 },
              { key: 'july', value: 7 },
              { key: 'august', value: 8 },
              { key: 'september', value: 9 },
              { key: 'october', value: 10 },
              { key: 'november', value: 11 },
              { key: 'december', value: 12 },
            ].map(({ key, value }) => ({
              uuid: t(`global_data_products.outdated_starting_at.months_of_year.${key}`),
              value,
            })),
          },
          // @ts-ignore
        ].map(({
          uuid,
          values,
        }: {
          uuid: string;
          values?: {
            uuid: string;
            value: number;
          };
        }) => {
          let inputEl;

          const value = objectAttributes?.outdated_starting_at?.[uuid];
          const valueOriginal = originalAttributes?.outdated_starting_at?.[uuid];

          const sharedProps = {
            compact: true,
            key: `outdated-starting-at-input-${uuid}`,
            monospace: true,
            onChange: e => setObjectAttributes(prev => ({
              ...prev,
              outdated_starting_at: {
                ...prev?.outdated_starting_at,
                [uuid]: e.target.value?.length === 0 ? null : Number(e.target.value),
              },
            })),
            primary: true,
            small: true,
            value: (typeof value === 'undefined' || value === null) ? '' : value,
          };

          if (values) {
            inputEl = (
              <Select
                {...sharedProps}
                placeholder={t('global_data_products.select_a_value')}
              >
                {/* @ts-ignore */}
                {values.map(({
                  uuid,
                  value,
                }) => (
                  <option key={value} value={value}>
                    {uuid}
                  </option>
                ))}
              </Select>
            );
          } else {
            inputEl = (
              <TextInput
                {...sharedProps}
                placeholder={t('global_data_products.enter_a_number')}
                setContentOnMount
                type="number"
              />
            );
          }

          return [
            <Text default key={`outdated-starting-at-label-${uuid}`} monospace>
              {t(`global_data_products.outdated_starting_at.units.${uuid}`)}{valueOriginal && (
                <Text inline monospace muted>
                  {t('global_data_products.default_value', { value: valueOriginal })}
                </Text>
              )}
            </Text>,
            inputEl,
          ];
        })}
      />
    </>
  );
}

export default OutdatedStartingAtField;
