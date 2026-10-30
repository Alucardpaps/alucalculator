import type { Bank } from './_helpers';
import { UNIT_01 } from './unit01';
import { UNIT_02 } from './unit02';
import { UNIT_03 } from './unit03';
import { UNIT_04 } from './unit04';
import { UNIT_05 } from './unit05';
import { UNIT_06 } from './unit06';
import { UNIT_07 } from './unit07';
import { UNIT_08 } from './unit08';
import { UNIT_09 } from './unit09';
import { UNIT_10 } from './unit10';

/** Her ders slug’ına özel, tekrar kullanılmayan soru bankası. */
export const QUESTION_BANK: Bank = {
  ...UNIT_01,
  ...UNIT_02,
  ...UNIT_03,
  ...UNIT_04,
  ...UNIT_05,
  ...UNIT_06,
  ...UNIT_07,
  ...UNIT_08,
  ...UNIT_09,
  ...UNIT_10,
};
