# Gemstone: Resource & Crafting Tree Design

**Version:** 1.0  
**Date:** 2026-03-28  
**Status:** Draft for Review

---

## Core Concept

Replace the single "gems" currency with a **multi-resource ecosystem** where:
- Different raw materials are found through different activities
- Materials have real mineralogical relationships
- Crafting transforms raw materials into refined gems and jewelry
- Progression unlocks access to rarer materials and recipes

---

## Mineral & Gem Hierarchy

### Tier 1: Common Materials (Starter)
These materials are abundant and teach basic mechanics.

| ID | Name | Source | Mohs | Real-World Notes |
|----|------|--------|------|------------------|
| T1_QUARTZ | Quartz | Panning | 7 | Most common mineral on Earth |
| T1_FELDSPAR | Feldspar | Panning | 6-6.5 | 60% of Earth's crust |
| T1_CALCITE | Calcite | Panning | 3 | Forms limestone and marble |
| T1_TALC | Talc | Panning | 1 | Softest mineral, used in talcum powder |

### Tier 2: Quartz Varieties (Early Game)
Variations of the most common starter gem.

| ID | Name | Source | Mohs | Real-World Notes |
|----|------|--------|------|------------------|
| T2_AMETHYST | Amethyst | Basic Mining | 7 | Purple quartz, February birthstone |
| T2_CITRINE | Citrine | Basic Mining | 7 | Yellow quartz, often heat-treated amethyst |
| T2_ROSE_QUARTZ | Rose Quartz | Basic Mining | 7 | Pink quartz, used in cosmetics |
| T2_SMOKY_QUARTZ | Smoky Quartz | Basic Mining | 7 | Brown/black quartz, found in Scotland |

### Tier 3: Beryl Family (Mid Game)
Beryl is the mineral family that includes emeralds and aquamarine.

| ID | Name | Source | Mohs | Real-World Notes |
|----|------|--------|------|------------------|
| T3_BERYL_RAW | Raw Beryl | Vein Mining | 7.5-8 | Hexagonal crystal structure |
| T3_AQUAMARINE | Aquamarine | Vein Mining | 7.5-8 | Blue beryl, March birthstone |
| T3_MORGANITE | Morganite | Vein Mining | 7.5-8 | Pink beryl, named after J.P. Morgan |
| T3_GOSHENITE | Goshenite | Vein Mining | 7.5-8 | Clear/colorless beryl |

**Processing Chain:** Raw Beryl → (Heat Treatment) → Aquamarine OR (Natural) → Morganite

### Tier 4: Corundum Family (Advanced)
Corundum includes ruby and sapphire - the second hardest natural gem.

| ID | Name | Source | Mohs | Real-World Notes |
|----|------|--------|------|------------------|
| T4_CORUNDUM_RAW | Raw Corundum | Deep Mining | 9 | Requires diamond tools to cut |
| T4_RUBY | Ruby | Deep Mining | 9 | Red corundum, Chromium gives color |
| T4_SAPPHIRE | Sapphire | Deep Mining | 9 | Blue corundum, Iron/Titanium gives color |
| T4_PADPARADSCHA | Padparadscha | Deep Mining | 9 | Rare pink-orange sapphire, Sri Lanka |

**Processing Chain:** Raw Corundum → (Heat Treatment) → Sapphire OR (with Chromium) → Ruby

### Tier 5: Rare & Exotic (End Game)
The rarest and most valuable materials.

| ID | Name | Source | Mohs | Real-World Notes |
|----|------|--------|------|------------------|
| T5_EMERALD | Emerald | Colombian Mines | 7.5-8 | Green beryl, Chromium/Vanadium gives color |
| T5_DIAMOND | Diamond | Kimberlite Mining | 10 | Hardest natural material, formed under extreme pressure |
| T5_OPAL | Opal | Australian Fields | 5-6 | Hydrated silica, no crystal structure |
| T5_ALEXANDRITE | Alexandrite | Brazilian Mines | 8.5 | Color-change chrysoberyl, extremely rare |

---

## Processing Tree

Raw materials must be processed before use in crafting.

```
RAW MATERIALS
     │
     ├── QUARTZ FAMILY
     │      └── Tumbling → Polished Quartz (T1)
     │                │
     │                ├── Heat Treatment → Citrine
     │                └── Irradiation → Smoky Quartz
     │
     ├── BERYL FAMILY  
     │      ├── Faceting → Aquamarine (T3)
     │      ├── Faceting → Morganite (T3)
     │      └── Oil Treatment → Emerald (T5) [Requires Chromium additive]
     │
     ├── CORUNDUM FAMILY
     │      ├── Heat Treatment → Sapphire (T4)
     │      ├── Heat Treatment + Chromium → Ruby (T4)
     │      └── Precision Faceting → Padparadscha (T5)
     │
     ├── DIAMOND
     │      └── Diamond Cut → Gem Diamond (T5)
     │
     └── ORGANIC GEMS
            ├── Pearl Farm → Natural Pearl
            └── Amber Sifting → Amber with Inclusion
```

---

## Jewelry Crafting Tree

Final products require specific gem combinations.

### Starter Recipes (Tier 1-2 Materials)

| Recipe | Materials Required | Result | Value |
|--------|-------------------|--------|-------|
| Quartz Pendant | 2× Polished Quartz | Simple Pendant | 50 |
| Amethyst Ring | 1× Amethyst, 1× Silver Setting | Basic Ring | 120 |
| Citrine Earrings | 2× Citrine, 1× Silver Setting | Simple Earrings | 100 |
| Feldspar Beads | 5× Feldspar | Bead Strand | 30 |

### Intermediate Recipes (Tier 3-4 Materials)

| Recipe | Materials Required | Result | Value |
|--------|-------------------|--------|-------|
| Aquamarine Bracelet | 3× Aquamarine, 2× Gold Setting | Quality Bracelet | 400 |
| Ruby Ring | 1× Ruby, 1× Gold Setting | Ruby Ring | 600 |
| Sapphire Pendant | 1× Sapphire, 1× Platinum Setting | Fine Pendant | 550 |
| Beryl & Quartz Necklace | 2× Aquamarine, 4× Rose Quartz | Artisan Necklace | 350 |

### Advanced Recipes (Tier 5 Materials)

| Recipe | Materials Required | Result | Value |
|--------|-------------------|--------|-------|
| Emerald Ring | 1× Emerald, 1× Gold Setting | Fine Emerald Ring | 1200 |
| Diamond Solitaire | 1× Diamond, 1× Platinum Setting | Diamond Ring | 2000 |
| Opal Brooch | 1× Opal, 1× Silver Setting | Decorative Brooch | 800 |
| Alexandrite Pendant | 1× Alexandrite, 1× Platinum Setting | Museum Piece | 3000 |

### Master Recipes (Special Combinations)

| Recipe | Materials Required | Result | Value | Unlock |
|--------|-------------------|--------|-------|--------|
| Royal Crown | 1× Diamond, 1× Ruby, 1× Sapphire, 2× Gold | Museum Crown | 5000 | Gemdex 50% |
| Anniversary Set | 1× Emerald, 2× Diamond, 1× Pearl | Wedding Set | 4000 | Reputation 10 |
| Collector Trio | 1× Alexandrite, 1× Padparadscha, 1× Opal | Display Set | 4500 | All T5 discovered |

---

## Progression Unlocks

### Mining Depth Unlocks

| Unlock | Requirement | Access To |
|--------|-------------|-----------|
| Basic Panning | Start | T1 Quartz, Feldspar, Calcite |
| Basic Mining | 5 Quartz collected | T2 Amethyst, Citrine, Rose Quartz |
| Vein Mining | 10 gems processed | T3 Beryl, Aquamarine, Morganite |
| Deep Mining | 20 gems processed, 500 coins | T4 Corundum, Ruby, Sapphire |
| Kimberlite Mining | 50 gems processed, 2000 coins | T5 Diamond |
| Colombian Mines | Reputation 5, Deep Mining | T5 Emerald |
| Rare Expeditions | All T4 unlocked | T5 Alexandrite, Padparadscha |

### Processing Unlocks

| Unlock | Requirement | Enables |
|--------|-------------|---------|
| Basic Tumbler | Start | Tumbling T1-T2 materials |
| Faceting Machine | 10 gems processed | Faceting T3-T4 materials |
| Heat Treatment Lab | 25 gems processed, 300 coins | Heat treating corundum/beryl |
| Precision Tools | 50 gems processed, 1000 coins | T5 material processing |
| Oil Treatment | 30 gems processed, Emerald access | Emerald enhancement |

### Crafting Unlocks

| Unlock | Requirement | Enables |
|--------|-------------|---------|
| Silver Setting | Start | Basic jewelry recipes |
| Gold Smelting | 20 gems processed | Gold setting recipes |
| Platinum Work | 50 gems processed, 1500 coins | Platinum setting recipes |
| Master Craftsman | All basic recipes learned | Master recipes |

---

## Multi-Resource Shift System

Instead of generic "Shift Points," each resource type has its own progression.

### Shift Point Categories

| Category | Earned From | Tier Thresholds | Idle Rate |
|----------|-------------|-----------------|-----------|
| Quartz Shift | Panning performance | 10/30/75/150/300 | 1-5 common gems/hr |
| Gem Shift | Mining performance | 10/30/75/150/300 | 1-5 rare gems/hr |
| Processing Shift | Processing speed | 10/30/75/150/300 | 10-50% faster processing |
| Crafting Shift | Crafting quality | 10/30/75/150/300 | 10-50% value bonus |

### How It Works

1. **Panning Mini-Game** → Earns Quartz Shift Points
2. **Mining Mini-Game** → Earns Gem Shift Points
3. **Processing Mini-Game** → Earns Processing Shift Points
4. **Crafting Mini-Game** → Earns Crafting Shift Points

Each category has its own 5-tier system. Better performance = faster tier progression = better idle gains for that resource type.

---

## Gemdex Integration

Each material has Gemdex entries that unlock:

1. **Basic Info** - Name, Mohs hardness, crystal system
2. **Formation** - How it forms geologically
3. **History** - Cultural and historical significance
4. **Properties** - Optical and physical properties
5. **Treatments** - Common treatments used
6. **Collecting** - Tips for collectors

### Gemdex Rewards

| Completion | Bonus |
|------------|-------|
| 25% of family | +5% idle rate for that family |
| 50% of family | Unlock identification at a glance |
| 100% of family | Unlock rare varieties |

### Example Gemdex Entry

**Ruby (T4_RUBY)**
- **Mineral:** Corundum (Al₂O₃)
- **Mohs Hardness:** 9
- **Crystal System:** Trigonal
- **Color Origin:** Chromium traces
- **Primary Sources:** Myanmar, Thailand, Sri Lanka
- **Formation:** Metamorphic rocks, marble
- **Treatments:** Heat treatment common
- **Value Factors:** Color, clarity, cut, carat weight
- **Fun Fact:** Red spinel was often mistaken for ruby in crown jewels

---

## Economic Balance

### Raw Material Values (Unprocessed)

| Material | Base Value | Idle Rate Multiplier |
|----------|-----------|---------------------|
| Quartz | 5 | 1.0x |
| Feldspar | 3 | 0.8x |
| Amethyst | 15 | 1.2x |
| Aquamarine | 80 | 1.5x |
| Ruby | 200 | 2.0x |
| Emerald | 300 | 2.5x |
| Diamond | 500 | 3.0x |

### Processing Value Multipliers

| Process | Value Increase |
|---------|---------------|
| Tumbling | 2x base value |
| Basic Faceting | 3x base value |
| Precision Faceting | 5x base value |
| Heat Treatment | 1.5x (unlocks new gem) |
| Oil Treatment | 2x (Emerald only) |

### Crafting Value Multipliers

| Setting | Value Increase |
|---------|---------------|
| Silver | 1.5x gem value |
| Gold | 2.5x gem value |
| Platinum | 4x gem value |

---

## Next Steps

1. **Review & Approve** - Does this progression feel right?
2. **Research** - Dive deeper into specific gem families for Gemdex
3. **Balance** - Adjust values based on playtesting
4. **Implement** - Build the resource system in code

---

## Questions for Review

1. Is the tier progression (T1→T5) intuitive?
2. Are the material requirements for recipes balanced?
3. Should there be alternative paths (e.g., can you get emeralds another way)?
4. Do the Shift Point categories make sense (Quartz/Gem/Processing/Crafting)?
5. Are there materials you'd like to add or remove?

---

*Document Version: 1.0 - Ready for review*
