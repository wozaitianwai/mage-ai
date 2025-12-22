import {
  BACKFILL_TYPE_DATETIME,
  BACKFILL_TYPE_CODE,
} from '@interfaces/BackfillType';
import type { TFunction } from 'i18next';

export const getBackfillTypes = (t?: TFunction) => ([
  {
    label: () => t?.('backfills.edit.types.datetime.label') || 'Date and time window',
    description: () => t?.('backfills.edit.types.datetime.description') || 'Backfill between a date and time range.',
    uuid: BACKFILL_TYPE_DATETIME,
  },
  // {
  //   label: () => t?.('backfills.edit.types.code.label') || 'Custom code',
  //   description: () => t?.('backfills.edit.types.code.description') || 'Use the output of a block to generate backfills.',
  //   uuid: BACKFILL_TYPE_CODE,
  // },
]);
