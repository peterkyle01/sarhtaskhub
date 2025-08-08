import * as migration_20250808_070725 from './20250808_070725';

export const migrations = [
  {
    up: migration_20250808_070725.up,
    down: migration_20250808_070725.down,
    name: '20250808_070725'
  },
];
