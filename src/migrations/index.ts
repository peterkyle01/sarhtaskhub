import * as migration_20250808_070725 from './20250808_070725';
import * as migration_20250808_175826 from './20250808_175826';
import * as migration_20250811_124741 from './20250811_124741';

export const migrations = [
  {
    up: migration_20250808_070725.up,
    down: migration_20250808_070725.down,
    name: '20250808_070725',
  },
  {
    up: migration_20250808_175826.up,
    down: migration_20250808_175826.down,
    name: '20250808_175826',
  },
  {
    up: migration_20250811_124741.up,
    down: migration_20250811_124741.down,
    name: '20250811_124741'
  },
];
