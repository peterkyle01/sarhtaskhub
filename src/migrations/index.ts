import * as migration_20250811_125451 from './20250811_125451';
import * as migration_20250812_194449 from './20250812_194449';

export const migrations = [
  {
    up: migration_20250811_125451.up,
    down: migration_20250811_125451.down,
    name: '20250811_125451',
  },
  {
    up: migration_20250812_194449.up,
    down: migration_20250812_194449.down,
    name: '20250812_194449'
  },
];
