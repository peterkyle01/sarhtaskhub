import * as migration_20250811_125451 from './20250811_125451';

export const migrations = [
  {
    up: migration_20250811_125451.up,
    down: migration_20250811_125451.down,
    name: '20250811_125451'
  },
];
