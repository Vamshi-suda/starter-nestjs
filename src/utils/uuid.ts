import {randomUUID} from 'node:crypto';

export const UUIDVersion = '4';
export const uuid = () => {
  return randomUUID();
};
