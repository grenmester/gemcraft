# Discover — Design Doc

| Status: Implemented | Owner: System | Last Updated: 2026-03-30 |

---

## 1. Executive Summary

Discover is the mining/expedition phase where players find raw materials through workers and manual extraction.

**Why it exists:** Discovery creates anticipation and excitement—finding materials is the foundation of the entire game economy.

---

## 2. Design Goals

- **Primary goal:** Provide a consistent stream of raw materials for processing
- **Secondary goals:** Create area variety, unlock progression, rare gem excitement
- **Non-goals:** Combat or survival elements, procedural map generation
- **Fun factor:** The thrill of rare drops, strategic area selection, idle accumulation

---

## 3. Core Behavior

### 3.1 Key Concepts

- **Areas:** Each mine location can have ONE worker assigned
- **Idle Generation:** Assigned workers produce materials automatically (1-minute tick)
- **Manual Extraction:** Player can manually mine for immediate rewards
- **Raw Materials:** Distinct items from processed gems (e.g., `rough_quartz` vs `clear_quartz`)

### 3.2 Mining Modes

| Mode | Description | Trigger |
|------|-------------|---------|
| **Idle** | Worker auto-generates materials | Worker assigned to area |
| **Active** | Manual mining for immediate rewards | Player clicks "Mine" button |

### 3.3 Area Progression

Unlocked through:
1. Player level requirements
2. Equipment upgrades (purchased with Cash)
3. Optional: Material requirements (later feature)

### 3.4 Area Loot Tables

Each area has a loot table defining drop rates:

```javascript
{
  TIER_1: {
    rough_quartz: 0.30,
    raw_obsidian: 0.25,
    raw_fluorite: 0.20,
    // ...
  }
}
```

### 3.5 Rare Drop System

- Base drop rates from loot table
- Worker Luck stat: `1 + (luck / 200)` modifier
- 5% chance to upgrade rarity tier on any drop

---

## 4. Mine Locations (Areas)

### 15 Location Tiers

| Tier | ID | Name | Unlock Level | Unlock Equipment | Unlocks |
|------|----|------|-------------|------------------|---------|
| 1 | TIER_1 | River Panning | 0 | NONE | Starter area |
| 1 | TIER_1_B | Ozark Hills | 2 | BASIC_PICKAXE | — |
| 1 | TIER_1_C | Bavarian Fields | 3 | BASIC_PICKAXE | — |
| 2 | TIER_2_A | Ural Shores | 5 | IRON_PICKAXE | — |
| 2 | TIER_2_B | Bahia Mines | 7 | IRON_PICKAXE | clear_quartz: 10 |
| 2 | TIER_2_C | Montana Streambed | 10 | STEEL_DRILL | — |
| 3 | TIER_3_A | Minas Gerais | 15 | STEEL_DRILL | clear_quartz: 20, obsidian: 10 |
| 3 | TIER_3_B | Mogok Valley | 20 | DIAMOND_DRILL | — |
| 3 | TIER_3_C | Sri Lanka Fields | 25 | DIAMOND_DRILL | lapis_lazuli: 5 |
| 4 | TIER_4_A | Muzo Highlands | 30 | HEAVY_MACHINERY | — |
| 4 | TIER_4_B | Kashmir Heights | 35 | HEAVY_MACHINERY | malachite: 10, azurite: 5 |
| 4 | TIER_4_C | Argyle Caverns | 40 | ELITE_OPERATIONS | — |
| 5 | TIER_5_A | Golconda Depths | 50 | ELITE_OPERATIONS | hematite: 20, pyrite: 10 |
| 5 | TIER_5_B | Androy Dunes | 60 | ELITE_OPERATIONS | labradorite: 5, celestite: 5 |
| 5 | TIER_5_C | Mogok Hidden | 75 | ELITE_OPERATIONS | lapis_lazuli: 3, malachite: 3, azurite: 3 |

---

## 5. Discovery Equipment

Purchased with Cash, unlocks new mine areas.

| ID | Name | Cost | Unlock Level | Drop Rate Bonus | Extra Items | Unlocks |
|----|------|------|------------|---------------|-------------|---------|
| `NONE` | None | 0 | 0 | 0% | 0 | TIER_1 |
| `BASIC_PICKAXE` | Basic Pickaxe | 100 | 2 | +10% | 0 | TIER_1_B, TIER_1_C |
| `IRON_PICKAXE` | Iron Pickaxe | 500 | 5 | +20% | 0 | TIER_2_A, TIER_2_B |
| `STEEL_DRILL` | Steel Drill | 2,000 | 10 | +30% | 1 | TIER_2_C, TIER_3_A |
| `DIAMOND_DRILL` | Diamond Drill | 5,000 | 20 | +40% | 1 | TIER_3_B, TIER_3_C |
| `HEAVY_MACHINERY` | Heavy Machinery | 15,000 | 35 | +50% | 2 | TIER_4_A, TIER_4_B |
| `ELITE_OPERATIONS` | Elite Operations | 50,000 | 50 | +60% | 2 | TIER_4_C, TIER_5_A, TIER_5_B, TIER_5_C |

---

## 6. Raw Materials

Raw materials are items found in the wild before processing.

### Material Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Raw Gems** | Uncut precious stones | rough_ruby, rough_sapphire |
| **Raw Minerals** | Industrial/crafting minerals | raw_quartz, raw_obsidian |

### Processing Affordances

| Raw Material Type | Can Clean | Can Cut | Can Facet |
|-------------------|-----------|---------|-----------|
| Gems | ✓ | Most | Premium only (Mohs ≥ 6) |
| Minerals | ✓ | Some crystalline | No |

---

## 7. Dependencies & Interactions

- **Requires from other systems:**
  - Workers (for idle generation)
  - Loot tables (for drop rates)
  - Equipment system (for unlocks)
- **Provides to other systems:**
  - Raw materials → Process phase
  - Discovery tracking → Gemdex
  - Coins through selling → Economy

---

## 8. User Experience

### Inputs
- Click area tab → Switch to that area
- Click "Mine" button → Manual extraction
- Assign worker dropdown → Assign to area

### Outputs / Feedback
- Area shows current worker and status
- "Mine" button shows last drop result
- Materials added to inventory
- XP gained notification

### Screens / UI Elements
- **DiscoverScreen** — Main mining view
  - Area selector tabs
  - Worker assignment panel
  - Manual mine button
  - Loot preview

---

## 9. Failure & Mitigation

| Failure | Handling |
|---------|----------|
| No worker assigned | Show "Assign a worker" prompt |
| Area locked | Show unlock requirements |
| Insufficient materials for unlock | Gray out with cost shown |
| Empty loot table | Fallback to lowest tier drops |

---

## 10. Tuning & Metrics

### Exposed Variables for Balancing

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| Base drop rate common | 30% | 20-40% | Common item frequency |
| Rare drop threshold | 0.95 | 0.90-0.99 | Legendary chance |
| Rarity upgrade chance | 1 tier | 1-2 tiers | Rare scaling |

### Success Criteria
- Players find first rare gem within 30 minutes
- TIER_5 feels meaningfully different from TIER_1
- Worker placement creates strategic decisions

---

## 11. Open Questions / Risks

- [x] Area count (decided: 15 across 5 tiers)
- [x] Equipment progression (decided: 7 tiers)
- [ ] Manual mining scaling (deferred)
- [ ] Area-specific minigames (out of scope)
