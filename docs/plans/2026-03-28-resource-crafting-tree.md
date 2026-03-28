# Gemstone: Resource & Crafting Tree Design

**Version:** 2.0  
**Date:** 2026-03-28  
**Status:** Draft for Review - Enhanced with Real-World Locations

---

## Core Concept

Replace the single "gems" currency with a **multi-resource ecosystem** where:
- Different locations around the world yield different gem families
- Real-world mining regions inspire resource availability
- Equipment upgrades unlock access to deeper/harder minerals
- Complexity increases with tier - early game is linear, late game requires cross-location planning
- Processing chains transform raw materials into refined gems

---

## World Map: Mining Locations

Each location is inspired by real-world gem mining regions. Players unlock access to locations as they progress.

### Starter Region (Always Available)

| Location | Real Inspiration | Available Resources | Equipment Required |
|----------|------------------|--------------------|--------------------|
| **River Panning** | World rivers | Quartz, Feldspar, Calcite | None |

### Early Game Regions (Unlock at Level 5)

| Location | Real Inspiration | Available Resources | Equipment Required |
|----------|------------------|--------------------|--------------------|
| **Ozark Hills** | Arkansas, USA | Amethyst, Quartz, Garnet | Basic Pickaxe |
| **Bavarian Fields** | Germany/Czech Republic | Smoky Quartz, Pyrite | Basic Pickaxe |
| **Ural Shores** | Russia | Imperial Topaz, Amethyst | Basic Pickaxe |

### Mid Game Regions (Unlock at Level 15)

| Location | Real Inspiration | Available Resources | Equipment Required |
|----------|------------------|--------------------|--------------------|
| **Mogok Valley** | Myanmar (Burma) | Ruby, Sapphire, Peridot, Quartz | Diamond Drill |
| **Bahia Mines** | Brazil | Aquamarine, Tourmaline, Morganite, Citrine | Diamond Drill |
| **Minas Gerais** | Brazil | Topaz, Imperial Topaz, Emerald, Beryl | Diamond Drill |

### Advanced Regions (Unlock at Level 30)

| Location | Real Inspiration | Available Resources | Equipment Required |
|----------|------------------|--------------------|--------------------|
| **Muzo Highlands** | Colombia | Emerald, Calcite, Pyrite | Heavy Machinery |
| **Zambezi Depths** | Zambia | Emerald, Garnet | Heavy Machinery |
| **Sri Lanka Fields** | Sri Lanka | Padparadscha, Sapphire, Ruby, Cat's Eye | Heavy Machinery |

### Expert Regions (Unlock at Level 50)

| Location | Real Inspiration | Available Resources | Equipment Required |
|----------|------------------|--------------------|--------------------|
| **Kashmir Heights** | India | Kashmir Sapphire, Ruby | Mining Dynasty |
| **Argyle Caverns** | Australia | Pink Diamond, Opal | Mining Dynasty |
| **Golconda Depths** | India | Diamond, various | Mining Dynasty |

### Legendary Regions (Unlock at Level 75)

| Location | Real Inspiration | Available Resources | Equipment Required |
|----------|------------------|--------------------|--------------------|
| **Androy Dunes** | Tanzania | Tanzanite, Tsavorite | Elite Operations |
| **Mogok Hidden** | Myanmar | Alexandrite, Red Beryl | Elite Operations |
| **Montana Streambed** | USA | Fancy Sapphire, Ruby | Elite Operations |

---

## Resource Families by Location

### River Panning (Starter)
Simple panning for common materials. Linear - just collect whatever you find.

| Resource | Tier | Drop Rate | Notes |
|----------|------|-----------|-------|
| Quartz | T1 | 40% | Most common |
| Feldspar | T1 | 30% | Common |
| Calcite | T1 | 20% | Uncommon |
| Gold Pan | Tool | - | Unlocks at 10 collected |

### Ozark Hills
First real mining location. Still relatively linear.

| Resource | Tier | Drop Rate | Notes |
|----------|------|-----------|-------|
| Amethyst | T2 | 35% | Purple quartz |
| Rose Quartz | T2 | 25% | Pink variety |
| Quartz | T1 | 25% | Common find |
| Garnet | T2 | 15% | Red almandine |

### Mogok Valley (Myanmar)
First multi-resource location. Requires equipment upgrade.

| Resource | Tier | Drop Rate | Notes |
|----------|------|-----------|-------|
| Ruby | T4 | 15% | Requires Diamond Drill |
| Sapphire | T4 | 20% | Blue corundum |
| Peridot | T3 | 25% | Olive green |
| Quartz | T1 | 40% | Common |

**Complexity Note:** To process rubies, you need sapphire (same location) AND peridot (different chemical process).

### Minas Gerais (Brazil)
Diverse location with multiple gem families.

| Resource | Tier | Drop Rate | Notes |
|----------|------|-----------|-------|
| Imperial Topaz | T4 | 10% | Rare orange/pink |
| Topaz | T3 | 25% | Common yellow |
| Emerald | T5 | 5% | Requires Heavy Machinery |
| Beryl | T3 | 30% | Raw beryl |
| Citrine | T2 | 30% | Heat-treated topaz |

**Complexity Note:** Emeralds require Heavy Machinery AND processing chain through raw Beryl.

### Muzo Highlands (Colombia)
Specialized emerald region.

| Resource | Tier | Drop Rate | Notes |
|----------|------|-----------|-------|
| Colombian Emerald | T5 | 15% | Pure green, finest quality |
| Trapiche Emerald | T5 | 5% | Rare star pattern |
| Pyrite | T2 | 40% | Fool's gold |
| Calcite | T1 | 40% | Common |

**Complexity Note:** Highest tier requires both location unlock AND Heavy Machinery.

---

## Progressive Complexity Model

### Tier 1-2: Linear & Simple
- Single location access (River Panning)
- Single resource type per session
- Basic tumbling for processing
- No cross-recipe requirements
- **Example:** Pan for Quartz → Tumble → Sell

### Tier 3-4: Multi-Location Introduction
- 2-3 locations accessible
- May need to visit different locations for different materials
- Processing introduces heat treatment, faceting
- **Example:** Mine Topaz (Ural) + Mine Beryl (Bahia) → Combine for new products

### Tier 5: Complex Crafting
- 4+ locations accessible
- Materials from multiple locations required
- Processing chains (Raw → Treated → Cut → Set)
- Equipment upgrades mandatory
- **Example:** 
  1. Mine Raw Corundum (Mogok)
  2. Heat treat in Lab → Sapphire
  3. Mine Raw Beryl (Minas)
  4. Oil treat → Emerald
  5. Mine Diamond (Golconda)
  6. Combine all in Platinum Setting → Museum Piece

---

## Processing Tree

Raw materials must be processed before use in crafting.

### Tier 1-2: Basic Processing
Single-step, forgiving. Low risk of failure.

```
Quartz ──── Tumbling ──── Polished Quartz
Amethyst ── Tumbling ──── Polished Amethyst
Citrine ─── Heat ─────── Citrine (from Amethyst)
```

### Tier 3-4: Intermediate Processing
Multi-step with choices. Risk/reward decisions.

```
Raw Beryl ─┬─ Heat Treatment ──── Aquamarine
           └─ Natural Formation ─── Morganite

Raw Corundum ─┬─ Heat + Titanium ─── Sapphire (Blue)
              ├─ Heat + Chromium ─── Ruby (Red)
              └─ Natural ─────────── Padparadscha (Rare)

Peridot ──────── Faceting ───────── Fine Peridot
```

### Tier 5: Advanced Processing
Complex chains, specific equipment, value-add steps.

```
Colombian Emerald ─┬─ Oil Treatment ──── Enhanced Emerald
                   └─ Natural ───────── Fine Emerald

Raw Diamond ──────── Laser Cut ────────── Diamond Gem
                   └─ Industrial ─────── Diamond Dust

Opal ──────────────── Bedding ─────────── Precious Opal
                     └─ Picture Stone ── Value-Add

Raw Chrysoberyl ──── Color Align ─────── Alexandrite
```

---

## Jewelry Crafting Tree

Final products require specific gem combinations and settings.

### Tier 1-2: Starter Recipes
Simple, single-material, forgiving.

| Recipe | Materials | Result | Value | Unlock |
|--------|-----------|--------|-------|--------|
| Quartz Pendant | 2× Polished Quartz | Pendant | 50 | Start |
| Amethyst Ring | 1× Amethyst, 1× Silver | Ring | 120 | Ozark |
| Rose Quartz Bracelet | 3× Rose Quartz | Bracelet | 80 | Ozark |
| Citrine Earrings | 2× Citrine, 1× Silver | Earrings | 100 | Ural |

### Tier 3: Intermediate Recipes
Multi-material, introduces settings.

| Recipe | Materials | Result | Value | Unlock |
|--------|-----------|--------|-------|--------|
| Aquamarine & Peridot Necklace | 2× Aquamarine, 1× Peridot, Gold | Necklace | 350 | Bahia |
| Topaz & Tourmaline Ring | 1× Topaz, 1× Tourmaline, Gold | Ring | 280 | Minas |
| Beryl Pendant | 1× Morganite, 1× Silver | Pendant | 220 | Bahia |
| Garnet Star Pendant | 1× Garnet, 1× Silver | Pendant | 180 | Ozark |

### Tier 4: Advanced Recipes
Multi-location materials, complex requirements.

| Recipe | Materials | Result | Value | Unlock |
|--------|-----------|--------|-------|--------|
| Ruby & Sapphire Ring | 1× Ruby, 1× Sapphire, Platinum | Ring | 1200 | Mogok |
| Imperial Topaz Crown | 2× Imperial Topaz, Gold | Crown | 900 | Minas |
| Peridot & Diamond Earrings | 1× Peridot, 2× Diamond, Gold | Earrings | 1500 | Mogok |
| Sapphire & Diamond Pendant | 1× Sapphire, 1× Diamond, Platinum | Pendant | 1800 | Sri Lanka |

### Tier 5: Expert/Master Recipes
End-game content, requires planning, highest value.

| Recipe | Materials | Result | Value | Unlock |
|--------|-----------|--------|-------|--------|
| Colombian Emerald Ring | 1× Emerald, Platinum | Ring | 2500 | Muzo |
| Kashmir Sapphire Brooch | 1× Kashmir Sapphire, Platinum | Brooch | 3000 | Kashmir |
| Padparadscha & Diamond Ring | 1× Padparadscha, 2× Diamond, Platinum | Ring | 3500 | Sri Lanka |
| Tanzanite Statement Necklace | 1× Tanzanite, 2× Diamond, Gold | Necklace | 4000 | Androy |
| Trapiche Emerald Pendant | 1× Trapiche, Platinum | Pendant | 5000 | Muzo |

### Legendary Recipes
Aspirational, requires significant investment.

| Recipe | Materials | Result | Value | Unlock |
|--------|-----------|--------|-------|--------|
| Argyle Pink Diamond Ring | 1× Pink Diamond, Platinum | Ring | 10000 | Argyle |
| Alexandrite Collector's Set | 1× Alexandrite, 1× Diamond, Platinum | Set | 8000 | Mogok Hidden |
| Golconda Diamond Necklace | 3× Golconda Diamond, Platinum | Necklace | 15000 | Golconda |
| Museum Piece: Royal Crown | 1× Diamond, 1× Ruby, 1× Sapphire, 2× Emerald, Gold | Crown | 25000 | All Regions |

---

## Equipment & Progression

### Equipment Tiers

| Equipment | Cost | Unlock | Enables |
|-----------|------|--------|---------|
| Basic Pickaxe | 0 | Start | T1-T2 locations |
| Diamond Drill | 500 | Level 15 | T3-T4 locations, Mohs 9 |
| Heavy Machinery | 2000 | Level 30 | T5 locations, Deep mining |
| Mining Dynasty | 5000 | Level 50 | Expert locations |
| Elite Operations | 15000 | Level 75 | Legendary locations |

### Equipment Effects

| Equipment | Mining Speed | Gem Quality | Special |
|----------|-------------|------------|---------|
| Basic Pickaxe | 1.0x | +0% | - |
| Diamond Drill | 1.5x | +10% | Can mine Mohs 9 |
| Heavy Machinery | 2.0x | +20% | Deep veins |
| Mining Dynasty | 3.0x | +30% | Rare find chance |
| Elite Operations | 4.0x | +50% | Legendary finds |

### Location Equipment Requirements

| Location | Required Equipment | Reason |
|----------|------------------|--------|
| River Panning | None | Surface activity |
| Ozark Hills | Basic Pickaxe | Soft rock |
| Ural Shores | Basic Pickaxe | Soft rock |
| Mogok Valley | Diamond Drill | Hard rock, Mohs 9 gems |
| Bahia Mines | Diamond Drill | Pegmatite formations |
| Minas Gerais | Diamond Drill | Deep pegmatites |
| Muzo Highlands | Heavy Machinery | Deep Colombian mines |
| Sri Lanka | Heavy Machinery | Alluvial deep |
| Kashmir | Mining Dynasty | High altitude, hard rock |
| Argyle | Mining Dynasty | Kimberlite pipes |
| Golconda | Mining Dynasty | Historic deep mines |
| Androy | Elite Operations | Remote, complex |
| Mogok Hidden | Elite Operations | Secret deposits |

---

## Multi-Resource Shift System

Each location/resource type has its own Shift Point progression.

### Shift Point Categories

| Category | Earned From | Idle Rewards |
|----------|-------------|--------------|
| **Panning Shift** | River Panning | T1 materials |
| **Quarry Shift** | Early mines (Ozark, Ural) | T2 materials |
| **Gem Shift** | Mid mines (Mogok, Bahia, Minas) | T3-T4 materials |
| **Rare Shift** | Advanced (Muzo, Sri Lanka) | T5 materials |
| **Legendary Shift** | Expert/Legendary | Special finds |

### Tier Thresholds (Same for All)

| Tier | Points Required | Reward |
|------|-----------------|--------|
| 0 | 0 | No idle collection |
| 1 | 10 | 1 resource/hr |
| 2 | 30 | 3 resources/hr |
| 3 | 75 | 8 resources/hr |
| 4 | 150 | 15 resources/hr |
| 5 | 300 | 25 resources/hr + quality bonus |

---

## Cross-Recipe Dependencies

Higher tier items require resources from multiple locations.

### Example: Ruby & Sapphire Ring (T4)

**Requirements:**
1. **Mine Ruby** - Mogok Valley (Diamond Drill required)
2. **Mine Sapphire** - Mogok Valley OR Sri Lanka
3. **Process Ruby** - Heat treatment lab
4. **Process Sapphire** - Heat treatment lab
5. **Craft** - Platinum setting (requires Gold smelting unlocked)

### Example: Colombian Emerald Ring (T5)

**Requirements:**
1. **Unlock Muzo Highlands** - Level 30, Heavy Machinery
2. **Mine Raw Beryl** - Minas Gerais (for oil treatment)
3. **Mine Emerald** - Muzo Highlands
4. **Process Beryl** - Oil treatment lab
5. **Set Emerald** - Platinum setting
6. **Craft** - Expert crafting skill

### Example: Museum Piece: Royal Crown (Legendary)

**Requirements:**
1. **Unlock All Regions** - Level 75, Elite Operations
2. **Mine Diamond** - Golconda or Argyle
3. **Mine Ruby** - Mogok Valley or Kashmir
4. **Mine Sapphire** - Sri Lanka or Mogok
5. **Mine Emeralds** - Muzo or Zambia
6. **Process All** - Heat treatment, oil treatment, precision cutting
7. **Craft Gold Settings** - 2× Gold (requires smelting)
8. **Assemble** - Master crafting skill
9. **Value** - 25,000 coins

---

## Gemdex Integration

Each material has detailed entries unlocked through discovery.

### Gemdex Categories

1. **Geology** - Formation, crystal system, Mohs hardness
2. **Geography** - Where found, historical mining
3. **History** - Cultural significance, famous stones
4. **Science** - Optical properties, treatments
5. ** Collecting** - Quality factors, valuation

### Gemdex Rewards

| Completion | Bonus |
|------------|-------|
| 25% of family | +5% idle rate |
| 50% of family | Identify at a glance |
| 100% of family | Unlock rare varieties |

---

## Economic Balance

### Raw Material Base Values

| Tier | Example | Base Value | Shift Multiplier |
|------|---------|-----------|-----------------|
| T1 | Quartz | 5 | 1.0x |
| T2 | Amethyst | 15 | 1.2x |
| T3 | Aquamarine | 80 | 1.5x |
| T4 | Ruby | 200 | 2.0x |
| T5 | Emerald | 300 | 2.5x |
| Legendary | Pink Diamond | 1000 | 5.0x |

### Processing Value Multipliers

| Process | Value Increase | Required |
|---------|---------------|----------|
| Tumbling | 2x | Start |
| Heat Treatment | 1.5x | Level 20 |
| Oil Treatment | 2x | Level 35 |
| Precision Cut | 3x | Level 40 |
| Master Cut | 5x | Level 60 |

### Setting Value Multipliers

| Setting | Value Increase | Unlock |
|---------|---------------|--------|
| Silver | 1.5x | Start |
| Gold | 2.5x | Level 15 |
| Platinum | 4x | Level 40 |

---

## Questions for Review

1. **Locations:** Do the real-world inspirations make sense? Any regions you'd add/remove?
2. **Progression:** Does the tier-to-complexity curve feel right (linear early, complex late)?
3. **Equipment:** Is the equipment-gated access intuitive?
4. **Cross-Recipe:** Are the dependencies too complex? Too simple?
5. **Shift System:** Does multi-category shift make sense?
6. **Resources:** Any gems/minerals you'd add?

---

## Next Steps

1. **Approve Design** - Confirm direction
2. **Gemdex Research** - Deep dive on specific gem families
3. **Mini-Game Mapping** - Assign mini-games to locations
4. **Balance Testing** - Playtest values
5. **Implementation** - Build the system

---

*Document Version: 2.0 - Enhanced with Real-World Locations*
