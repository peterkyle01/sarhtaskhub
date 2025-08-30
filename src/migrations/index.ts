import * as migration_20250817_144250 from './20250817_144250';
import * as migration_20250830_162232 from './20250830_162232';

export const migrations = [
  {
    up: migration_20250817_144250.up,
    down: migration_20250817_144250.down,
    name: '20250817_144250',
  },
  {
    up: migration_20250830_162232.up,
    down: migration_20250830_162232.down,
    name: '20250830_162232'
  },
];
