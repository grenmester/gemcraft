# Phase 0: Data Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan task-by-task.

**Goal:** Create the data foundation for the game redesign — workers, raw materials, and upgrades as YAML data files with JS loader utilities. No migration logic — schema changes delete saved state.

**Approach:**
- YAML files in `src/data/` for human readability
- JS loader files that import YAML and re-export with helper functions
- `js-yaml` package for YAML parsing at import time
- Schema changes = localStorage cleared, no migration code

---

## Task 1: Install js-yaml

**Files:**
- Modify: `package.json`

**Step 1: Install dependency**

```bash
cd /Users/grenmester/workspace/gemstone/.worktrees/prototype && npm install js-yaml --save
```

**Step 2: Verify install**

```bash
npm run build
```
Expected: Build passes with new dependency

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add js-yaml for YAML data files"
```

---

## Task 2: Create Workers data

### Task 2a: Write workers YAML

**Files:**
- Create: `src/data/workers.yaml`
- Create: `src/data/workers.js` (loader)

**Step 1: Write workers.yaml**

```yaml
workers:
  apprentice:
    id: apprentice
    name: Apprentice Miner
    description: A fresh recruit with basic mining skills.
    baseStats:
      miningSpeed: 1.0
      collectionRate: 1.0
      rareGemBonus: 0.0
    cost: 0
    unlockLevel: 0

  experienced:
    id: experienced
    name: Experienced Digger
    description: Knows their way around a mine and finds more gems.
    baseStats:
      miningSpeed: 1.3
      collectionRate: 1.2
      rareGemBonus: 0.05
    cost: 500
    unlockLevel: 5

  specialist:
    id: specialist
    name: Gem Specialist
    description: Expert at identifying and extracting valuable gems.
    baseStats:
      miningSpeed: 1.0
      collectionRate: 1.5
      rareGemBonus: 0.15
    cost: 2000
    unlockLevel: 15

  master:
    id: master
    name: Master Prospector
    description: Legendary miner with decades of experience.
    baseStats:
      miningSpeed: 1.8
      collectionRate: 2.0
      rareGemBonus: 0.25
    cost: 10000
    unlockLevel: 30
```

**Step 2: Write workers.js loader**

```js
// src/data/workers.js
import yaml from 'js-yaml';
import workersYaml from './workers.yaml';

const { workers } = yaml.load(workersYaml);

export const WORKERS = workers;

export const getWorkerById = (id) => WORKERS[id];

export const getAvailableWorkers = (playerLevel = 0) =>
  Object.values(WORKERS).filter(w => w.unlockLevel <= playerLevel);

export const getWorkerCount = () => Object.keys(WORKERS).length;
```

**Step 3: Run build to verify yaml loads correctly**

Run: `npm run build`
Expected: Build passes (yaml imported correctly)

**Step 4: Commit**

```bash
git add src/data/workers.yaml src/data/workers.js
git commit -m "feat: add workers data as YAML"
```

---

### Task 2b: Write workers tests

**Files:**
- Create: `src/data/__tests__/workers.test.js`

**Step 1: Write tests**

```js
import { describe, it, expect } from 'vitest';
import { WORKERS, getWorkerById, getAvailableWorkers, getWorkerCount } from '../workers';

describe('workers', () => {
  describe('WORKERS constant', () => {
    it('exports 4 worker templates', () => {
      expect(getWorkerCount()).toBe(4);
    });

    it('each worker has required fields', () => {
      Object.values(WORKERS).forEach(w => {
        expect(w).toHaveProperty('id');
        expect(w).toHaveProperty('name');
        expect(w).toHaveProperty('description');
        expect(w).toHaveProperty('baseStats');
        expect(w.baseStats).toHaveProperty('miningSpeed');
        expect(w.baseStats).toHaveProperty('collectionRate');
        expect(w.baseStats).toHaveProperty('rareGemBonus');
        expect(w).toHaveProperty('cost');
        expect(w).toHaveProperty('unlockLevel');
      });
    });

    it('starter worker (apprentice) is free', () => {
      expect(WORKERS.apprentice.cost).toBe(0);
      expect(WORKERS.apprentice.unlockLevel).toBe(0);
    });

    it('rarer workers cost more and unlock later', () => {
      expect(WORKERS.experienced.cost).toBeGreaterThan(WORKERS.apprentice.cost);
      expect(WORKERS.specialist.cost).toBeGreaterThan(WORKERS.experienced.cost);
      expect(WORKERS.master.cost).toBeGreaterThan(WORKERS.specialist.cost);
      expect(WORKERS.master.unlockLevel).toBeGreaterThan(WORKERS.specialist.unlockLevel);
    });
  });

  describe('getWorkerById', () => {
    it('returns correct worker', () => {
      const w = getWorkerById('apprentice');
      expect(w.name).toBe('Apprentice Miner');
    });

    it('returns undefined for invalid id', () => {
      expect(getWorkerById('nonexistent')).toBeUndefined();
    });
  });

  describe('getAvailableWorkers', () => {
    it('returns all workers for high level player', () => {
      const available = getAvailableWorkers(100);
      expect(available.length).toBe(4);
    });

    it('returns only apprentice for level 0', () => {
      const available = getAvailableWorkers(0);
      expect(available.length).toBe(1);
      expect(available[0].id).toBe('apprentice');
    });

    it('returns apprentice and experienced for level 5', () => {
      const available = getAvailableWorkers(5);
      expect(available.length).toBe(2);
      expect(available.map(w => w.id)).toContain('apprentice');
      expect(available.map(w => w.id)).toContain('experienced');
    });
  });
});
```

**Step 2: Run tests**

Run: `npm run test:run -- src/data/__tests__/workers.test.js`
Expected: PASS (4 tests)

**Step 3: Commit**

```bash
git add src/data/__tests__/workers.test.js
git commit -m "test: add workers data tests"
```

---

## Task 3: Create Upgrades data

### Task 3a: Write upgrades YAML

**Files:**
- Create: `src/data/upgrades.yaml`
- Create: `src/data/upgrades.js` (loader)

**Step 1: Write upgrades.yaml**

```yaml
upgrades:
  # Area unlocks
  unlock_tier1b:
    id: unlock_tier1b
    name: Survey Ozark Hills
    category: area
    cost: 200
    effect:
      type: unlockArea
      area: TIER_1_B
    description: Unlock the Ozark Hills mine area.
    unlockLevel: 0

  unlock_tier1c:
    id: unlock_tier1c
    name: Explore Bavarian Fields
    category: area
    cost: 300
    effect:
      type: unlockArea
      area: TIER_1_C
    description: Unlock the Bavarian Fields mine area.
    unlockLevel: 0

  unlock_tier2a:
    id: unlock_tier2a
    name: Explore Ural Shores
    category: area
    cost: 1000
    effect:
      type: unlockArea
      area: TIER_2_A
    description: Unlock the Ural Shores mine area.
    unlockLevel: 5

  unlock_tier2b:
    id: unlock_tier2b
    name: Survey Bahia Mines
    category: area
    cost: 1500
    effect:
      type: unlockArea
      area: TIER_2_B
    description: Unlock the Bahia Mines. Requires sacrifice materials.
    unlockLevel: 7

  unlock_tier2c:
    id: unlock_tier2c
    name: Explore Montana Streambed
    category: area
    cost: 2000
    effect:
      type: unlockArea
      area: TIER_2_C
    description: Unlock the Montana Streambed mine area.
    unlockLevel: 10

  # Worker efficiency
  worker_speed_1:
    id: worker_speed_1
    name: Better Pickaxes
    category: worker
    cost: 500
    effect:
      type: statBonus
      stat: allWorkerMiningSpeed
      value: 0.1
    description: All workers mine 10% faster.
    unlockLevel: 3

  worker_speed_2:
    id: worker_speed_2
    name: Steel Tools
    category: worker
    cost: 2000
    effect:
      type: statBonus
      stat: allWorkerMiningSpeed
      value: 0.25
    description: All workers mine 25% faster.
    unlockLevel: 10

  worker_collection_1:
    id: worker_collection_1
    name: Better Sorting
    category: worker
    cost: 800
    effect:
      type: statBonus
      stat: allWorkerCollectionRate
      value: 0.15
    description: All workers collect 15% more materials.
    unlockLevel: 5

  # Processing speed
  faster_cleaning:
    id: faster_cleaning
    name: Tumble Polisher
    category: processing
    cost: 800
    effect:
      type: statBonus
      stat: cleaningSpeed
      value: 0.25
    description: Cleaning processing is 25% faster.
    unlockLevel: 5

  faster_cutting:
    id: faster_cutting
    name: Precision Cutter
    category: processing
    cost: 3000
    effect:
      type: statBonus
      stat: cuttingSpeed
      value: 0.3
    description: Cutting processing is 30% faster.
    unlockLevel: 15

  # Marketplace
  better_prices:
    id: better_prices
    name: Trade Connections
    category: marketplace
    cost: 3000
    effect:
      type: statBonus
      stat: sellPriceBonus
      value: 0.1
    description: All sale prices are 10% higher.
    unlockLevel: 10

  lower_fees:
    id: lower_fees
    name: Market Stall
    category: marketplace
    cost: 1500
    effect:
      type: statBonus
      stat: marketplaceFeeReduction
      value: 0.05
    description: Marketplace fees reduced by 5%.
    unlockLevel: 8
```

**Step 2: Write upgrades.js loader**

```js
// src/data/upgrades.js
import yaml from 'js-yaml';
import upgradesYaml from './upgrades.yaml';

const { upgrades } = yaml.load(upgradesYaml);

export const UPGRADES = upgrades;

export const getUpgradeById = (id) => UPGRADES[id];

export const getUpgradesByCategory = (category) =>
  Object.values(UPGRADES).filter(u => u.category === category);

export const getAvailableUpgrades = (playerLevel = 0, ownedIds = []) =>
  Object.values(UPGRADES).filter(u => 
    u.unlockLevel <= playerLevel && !ownedIds.includes(u.id)
  );

export const getUpgradeCount = () => Object.keys(UPGRADES).length;
```

**Step 3: Run build to verify**

**Step 4: Commit**

---

### Task 3b: Write upgrades tests

**Files:**
- Create: `src/data/__tests__/upgrades.test.js`

**Step 1: Write tests**

```js
import { describe, it, expect } from 'vitest';
import { UPGRADES, getUpgradeById, getUpgradesByCategory, getAvailableUpgrades, getUpgradeCount } from '../upgrades';

describe('upgrades', () => {
  describe('UPGRADES constant', () => {
    it('defines multiple upgrades', () => {
      expect(getUpgradeCount()).toBeGreaterThan(5);
    });

    it('each upgrade has required fields', () => {
      Object.values(UPGRADES).forEach(u => {
        expect(u).toHaveProperty('id');
        expect(u).toHaveProperty('name');
        expect(u).toHaveProperty('category');
        expect(u).toHaveProperty('cost');
        expect(u).toHaveProperty('effect');
        expect(u).toHaveProperty('description');
        expect(u).toHaveProperty('unlockLevel');
        expect(u.effect).toHaveProperty('type');
      });
    });

    it('effect types are valid', () => {
      const validTypes = ['unlockArea', 'statBonus', 'unlockBuyer'];
      Object.values(UPGRADES).forEach(u => {
        expect(validTypes).toContain(u.effect.type);
      });
    });

    it('categories are valid', () => {
      const validCategories = ['area', 'worker', 'processing', 'marketplace'];
      Object.values(UPGRADES).forEach(u => {
        expect(validCategories).toContain(u.category);
      });
    });

    it('area unlock upgrades have target area', () => {
      const areaUpgrades = getUpgradesByCategory('area');
      areaUpgrades.forEach(u => {
        expect(u.effect.type).toBe('unlockArea');
        expect(u.effect).toHaveProperty('area');
        expect(typeof u.effect.area).toBe('string');
      });
    });
  });

  describe('getUpgradeById', () => {
    it('returns correct upgrade', () => {
      const u = getUpgradeById('unlock_tier1b');
      expect(u.name).toBe('Survey Ozark Hills');
      expect(u.category).toBe('area');
    });

    it('returns undefined for invalid id', () => {
      expect(getUpgradeById('nonexistent')).toBeUndefined();
    });
  });

  describe('getUpgradesByCategory', () => {
    it('returns only upgrades of that category', () => {
      const area = getUpgradesByCategory('area');
      area.forEach(u => expect(u.category).toBe('area'));
    });

    it('returns at least one upgrade per valid category', () => {
      ['area', 'worker', 'processing', 'marketplace'].forEach(cat => {
        const results = getUpgradesByCategory(cat);
        expect(results.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getAvailableUpgrades', () => {
    it('excludes owned upgrades', () => {
      const all = getAvailableUpgrades(100, ['unlock_tier1b']);
      expect(all.find(u => u.id === 'unlock_tier1b')).toBeUndefined();
    });

    it('excludes upgrades above player level', () => {
      const available = getAvailableUpgrades(5);
      available.forEach(u => expect(u.unlockLevel).toBeLessThanOrEqual(5));
    });

    it('starter upgrade is available at level 0', () => {
      const available = getAvailableUpgrades(0);
      expect(available.find(u => u.id === 'unlock_tier1b')).toBeDefined();
    });
  });
});
```

**Step 2: Run tests, commit**

---

## Task 4: Create Raw Materials data

### Task 4a: Write raw materials YAML

**Files:**
- Create: `src/data/raw-materials.yaml`
- Create: `src/data/rawMaterials.js` (loader)

**Step 1: Write raw-materials.yaml**

Create ~30 raw materials mapped to the 40 items in items.json. Each raw material has:
- `id`: prefixed with `raw_` (e.g., `raw_diamond`, `raw_quartz`)
- `name`: "Rough Diamond", "Raw Quartz", etc.
- `category`: "Raw Gem" or "Raw Mineral"
- `value`: ~40% of processed item value (base sell price)
- `processing`: which operations apply:
  - `cleaning`: always true for raw materials
  - `cutting`: true/false based on whether it can be cut
  - `faceting`: true/false based on whether it can be faceted
- `produces`: the ID of the item created when cleaning (e.g., `diamond` from `raw_diamond`)
- `foundIn`: which area tiers can yield this material

```yaml
# Grouped by rarity tier matching items.json
raw_materials:
  # Tier 1: Common gems and minerals
  raw_quartz:
    id: raw_quartz
    name: Raw Quartz
    category: Raw Mineral
    value: 5
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: quartz
    foundIn: [TIER_1, TIER_1_B]

  raw_amethyst:
    id: raw_amethyst
    name: Rough Amethyst
    category: Raw Gem
    value: 8
    processing:
      cleaning: true
      cutting: true
      faceting: false
    produces: amethyst
    foundIn: [TIER_1, TIER_1_B]

  raw_citrine:
    id: raw_citrine
    name: Rough Citrine
    category: Raw Gem
    value: 10
    processing:
      cleaning: true
      cutting: true
      faceting: false
    produces: citrine
    foundIn: [TIER_1, TIER_1_B]

  # Tier 2: Uncommon
  raw_aquamarine:
    id: raw_aquamarine
    name: Rough Aquamarine
    category: Raw Gem
    value: 20
    processing:
      cleaning: true
      cutting: true
      faceting: false
    produces: aquamarine
    foundIn: [TIER_1_B, TIER_1_C]

  raw_tourmaline:
    id: raw_tourmaline
    name: Rough Tourmaline
    category: Raw Gem
    value: 18
    processing:
      cleaning: true
      cutting: true
      faceting: false
    produces: tourmaline
    foundIn: [TIER_1_B, TIER_1_C]

  raw_peridot:
    id: raw_peridot
    name: Rough Peridot
    category: Raw Gem
    value: 22
    processing:
      cleaning: true
      cutting: true
      faceting: false
    produces: peridot
    foundIn: [TIER_1_C, TIER_2_A]

  raw_turquoise:
    id: raw_turquoise
    name: Raw Turquoise
    category: Raw Mineral
    value: 15
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: turquoise
    foundIn: [TIER_1_C, TIER_2_A]

  # Tier 3: Rare
  raw_sapphire:
    id: raw_sapphire
    name: Rough Sapphire
    category: Raw Gem
    value: 40
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: sapphire
    foundIn: [TIER_2_A, TIER_2_B]

  raw_spinel:
    id: raw_spinel
    name: Rough Spinel
    category: Raw Gem
    value: 35
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: spinel
    foundIn: [TIER_2_B, TIER_2_C]

  raw_opal:
    id: raw_opal
    name: Rough Opal
    category: Raw Gem
    value: 30
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: opal
    foundIn: [TIER_2_B, TIER_2_C]

  raw_topaz:
    id: raw_topaz
    name: Imperial Topaz Rough
    category: Raw Gem
    value: 45
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: imperial_topaz
    foundIn: [TIER_2_B, TIER_2_C]

  # Tier 4: Epic
  raw_ruby:
    id: raw_ruby
    name: Ruby-in-the-Rough
    category: Raw Gem
    value: 80
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: ruby
    foundIn: [TIER_3_A, TIER_3_B]

  raw_emerald:
    id: raw_emerald
    name: Emerald Matrix
    category: Raw Gem
    value: 75
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: emerald
    foundIn: [TIER_3_A, TIER_3_B]

  raw_tanzanite:
    id: raw_tanzanite
    name: Tanzanite Crystal
    category: Raw Gem
    value: 70
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: tanzanite
    foundIn: [TIER_3_B, TIER_3_C]

  # Tier 5: Legendary
  raw_diamond:
    id: raw_diamond
    name: Uncut Diamond
    category: Raw Gem
    value: 150
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: diamond
    foundIn: [TIER_4_A, TIER_4_B, TIER_4_C]

  raw_alexandrite:
    id: raw_alexandrite
    name: Alexandrite Rough
    category: Raw Gem
    value: 200
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: alexandrite
    foundIn: [TIER_4_B, TIER_4_C, TIER_5_A]

  raw_taaffeite:
    id: raw_taaffeite
    name: Taaffeite Crystal
    category: Raw Gem
    value: 180
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: taaffeite
    foundIn: [TIER_4_C, TIER_5_A]

  raw_musgravite:
    id: raw_musgravite
    name: Musgravite Specimen
    category: Raw Gem
    value: 175
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: musgravite
    foundIn: [TIER_5_A, TIER_5_B]

  raw_red_beryl:
    id: raw_red_beryl
    name: Red Beryl Crystal
    category: Raw Gem
    value: 190
    processing:
      cleaning: true
      cutting: true
      faceting: true
    produces: red_beryl
    foundIn: [TIER_5_A, TIER_5_B]

  # Common minerals
  raw_obsidian:
    id: raw_obsidian
    name: Obsidian Nodule
    category: Raw Mineral
    value: 3
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: obsidian
    foundIn: [TIER_1, TIER_1_C]

  raw_fluorite:
    id: raw_fluorite
    name: Fluorite Cluster
    category: Raw Mineral
    value: 4
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: fluorite
    foundIn: [TIER_1, TIER_1_B]

  raw_calcite:
    id: raw_calcite
    name: Calcite Deposit
    category: Raw Mineral
    value: 3
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: calcite
    foundIn: [TIER_1, TIER_1_B]

  raw_hematite:
    id: raw_hematite
    name: Hematite Nodule
    category: Raw Mineral
    value: 4
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: hematite
    foundIn: [TIER_1_B, TIER_2_A]

  raw_pyrite:
    id: raw_pyrite
    name: Pyrite Nugget
    category: Raw Mineral
    value: 6
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: pyrite
    foundIn: [TIER_1_B, TIER_2_A]

  raw_malachite:
    id: raw_malachite
    name: Malachite Formation
    category: Raw Mineral
    value: 8
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: malachite
    foundIn: [TIER_2_A, TIER_2_B]

  raw_azurite:
    id: raw_azurite
    name: Azurite Deposit
    category: Raw Mineral
    value: 7
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: azurite
    foundIn: [TIER_2_A, TIER_2_B]

  raw_lapis_lazuli:
    id: raw_lapis_lazuli
    name: Lapis Lazuli Rough
    category: Raw Mineral
    value: 12
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: lapis_lazuli
    foundIn: [TIER_2_B, TIER_3_C]

  raw_labradorite:
    id: raw_labradorite
    name: Labradorite Specimen
    category: Raw Mineral
    value: 9
    processing:
      cleaning: true
      cutting: false
      faceting: false
    produces: labradorite
    foundIn: [TIER_1_C, TIER_3_C]
```

**Step 2: Write rawMaterials.js loader**

```js
// src/data/rawMaterials.js
import yaml from 'js-yaml';
import rawMaterialsYaml from './raw-materials.yaml';

const { raw_materials } = yaml.load(rawMaterialsYaml);

export const RAW_MATERIALS = raw_materials;

export const getRawMaterialById = (id) => RAW_MATERIALS[id];

export const getRawMaterialsForArea = (areaKey) =>
  Object.values(RAW_MATERIALS).filter(m => m.foundIn.includes(areaKey));

export const getRawMaterialsByCategory = (category) =>
  Object.values(RAW_MATERIALS).filter(m => m.category === category);

export const canProcessRaw = (rawMaterialId, processType) => {
  const mat = getRawMaterialById(rawMaterialId);
  if (!mat) return false;
  if (processType === 'cleaning') return mat.processing.cleaning === true;
  if (processType === 'cutting') return mat.processing.cutting === true;
  if (processType === 'faceting') return mat.processing.faceting === true;
  return false;
};

export const getRawMaterialCount = () => Object.keys(RAW_MATERIALS).length;
```

**Step 3: Run build to verify yaml loads**

**Step 4: Commit**

---

### Task 4b: Write raw materials tests

**Files:**
- Create: `src/data/__tests__/rawMaterials.test.js`

**Step 1: Write tests**

```js
import { describe, it, expect } from 'vitest';
import { RAW_MATERIALS, getRawMaterialById, getRawMaterialsForArea, canProcessRaw, getRawMaterialCount } from '../rawMaterials';

describe('rawMaterials', () => {
  describe('RAW_MATERIALS constant', () => {
    it('defines multiple raw materials', () => {
      expect(getRawMaterialCount()).toBeGreaterThan(20);
    });

    it('each raw material has required fields', () => {
      Object.values(RAW_MATERIALS).forEach(m => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('category');
        expect(['Raw Gem', 'Raw Mineral']).toContain(m.category);
        expect(m).toHaveProperty('value');
        expect(typeof m.value).toBe('number');
        expect(m).toHaveProperty('processing');
        expect(m.processing).toHaveProperty('cleaning');
        expect(m.processing).toHaveProperty('cutting');
        expect(m.processing).toHaveProperty('faceting');
        expect(m).toHaveProperty('produces');
        expect(typeof m.produces).toBe('string');
        expect(m).toHaveProperty('foundIn');
        expect(Array.isArray(m.foundIn)).toBe(true);
      });
    });

    it('cleaning is always available for raw materials', () => {
      Object.values(RAW_MATERIALS).forEach(m => {
        expect(m.processing.cleaning).toBe(true);
      });
    });

    it('value is positive', () => {
      Object.values(RAW_MATERIALS).forEach(m => {
        expect(m.value).toBeGreaterThan(0);
      });
    });

    it('produces references a valid item id', () => {
      Object.values(RAW_MATERIALS).forEach(m => {
        expect(typeof m.produces).toBe('string');
        expect(m.produces.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getRawMaterialById', () => {
    it('returns correct raw material', () => {
      const m = getRawMaterialById('raw_diamond');
      expect(m.name).toBe('Uncut Diamond');
      expect(m.produces).toBe('diamond');
    });

    it('returns undefined for invalid id', () => {
      expect(getRawMaterialById('nonexistent')).toBeUndefined();
    });
  });

  describe('getRawMaterialsForArea', () => {
    it('returns materials found in that area', () => {
      const tier1 = getRawMaterialsForArea('TIER_1');
      expect(tier1.length).toBeGreaterThan(0);
      tier1.forEach(m => expect(m.foundIn).toContain('TIER_1'));
    });

    it('returns empty array for area with no materials', () => {
      const empty = getRawMaterialsForArea('NONEXISTENT');
      expect(empty).toEqual([]);
    });

    it('returns materials from multiple areas', () => {
      const tier2b = getRawMaterialsForArea('TIER_2_B');
      expect(tier2b.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('canProcessRaw', () => {
    it('all raw materials can be cleaned', () => {
      Object.values(RAW_MATERIALS).forEach(m => {
        expect(canProcessRaw(m.id, 'cleaning')).toBe(true);
      });
    });

    it('cutting varies by material', () => {
      const canCut = Object.values(RAW_MATERIALS).filter(m => m.processing.cutting);
      const cannotCut = Object.values(RAW_MATERIALS).filter(m => !m.processing.cutting);
      expect(canCut.length).toBeGreaterThan(0);
      expect(cannotCut.length).toBeGreaterThan(0);
    });

    it('faceting is rarer than cutting', () => {
      const canCut = Object.values(RAW_MATERIALS).filter(m => m.processing.cutting).length;
      const canFacet = Object.values(RAW_MATERIALS).filter(m => m.processing.faceting).length;
      expect(canFacet).toBeLessThan(canCut);
    });

    it('returns false for invalid raw material id', () => {
      expect(canProcessRaw('nonexistent', 'cleaning')).toBe(false);
    });
  });
});
```

**Step 2: Run tests**

Run: `npm run test:run -- src/data/__tests__/rawMaterials.test.js`
Expected: PASS

**Step 3: Commit**

---

## Task 5: Verify all Phase 0 data files work together

**Files:**
- Read: All Phase 0 files

**Step 1: Build**

Run: `npm run build`
Expected: Build passes

**Step 2: All tests**

Run: `npm run test:run`
Expected: All tests pass

**Step 3: Verify no import conflicts**

Ensure `items.js`, `rawMaterials.js`, `workers.js`, and `upgrades.js` all import correctly and don't conflict with existing code.

**Step 4: Commit Phase 0**

```bash
git add -A
git commit -m "feat: Phase 0 complete - workers, upgrades, raw materials data as YAML"
```
