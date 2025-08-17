import * as migration_20250817_144250 from './20250817_144250';

export const migrations = [
  {
    up: migration_20250817_144250.up,
    down: migration_20250817_144250.down,
    name: '20250817_144250'
  },
];
