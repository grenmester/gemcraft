# Inventory — Design Doc

| Status: Implemented | Owner: System | Last Updated: 2026-03-30 |

---

## 1. Executive Summary

Inventory is the item storage and management system that holds all materials, gems, and equipment.

**Why it exists:** Players need a place to store collected materials, processed gems, and crafted items before using or selling them.

---

## 2. Design Goals

- **Primary goal:** Store and organize player items
- **Secondary goals:** Enable item transfer between systems, provide quick access
- **Non-goals:** Complex inventory management, item degradation
- **Fun factor:** Organized abundance, seeing your collection grow

---

## 3. Core Behavior

### 3.1 Player State

```typescript
interface PlayerState {
  coins: number;           // Cash balance
  gems: Array<{ gemId: string; quality: number }>;  // Inventory: gems
  minerals: Array<{ id: string; quantity: number }>; // Inventory: minerals
  equipment: string[];     // Owned discovery equipment IDs
  processEquipment: string[]; // Owned processing equipment IDs
  gemdex: string[];       // Discovered gem IDs
  workers: WorkerInstance[]; // Owned workers
  lastOnlineTimestamp: number;
  totalWorkerXp: number;
}
```

### 3.2 Item Categories

| Category | Storage Format | Examples |
|----------|---------------|----------|
| Raw Gems | Quantity | rough_ruby, rough_sapphire |
| Raw Minerals | Quantity | raw_quartz, raw_obsidian |
| Processed Gems | Quality + Quantity | ruby, sapphire |
| Processed Minerals | Quantity | quartz, obsidian |
| Crafted Items | Individual items | Gold Ring, Platinum Necklace |

### 3.3 Item Schema

```yaml
items:
  - id: string              # unique identifier (e.g., "ruby", "clear_quartz")
    name: string            # display name (e.g., "Ruby")
    category: Gem|Mineral   # item category
    hardness: number        # Mohs scale (1-10)
    value: number           # base coin value
    rarity: Common|Uncommon|Rare|Epic|Legendary
    realWorldLocations: []  # for flavor/flair
    processing:
      canClean: boolean
      canCut: boolean
      canFacet: boolean
      baseProcessTime: number
      processDifficulty: number
```

---

## 4. Dependencies & Interactions

- **Requires from other systems:**
  - Discover → Raw materials added
  - Process → Processed materials added
  - Craft → Crafted items added
- **Provides to other systems:**
  - Process → Materials consumed
  - Craft → Gems consumed
  - Sell → Items consumed

---

## 5. User Experience

### Inputs
- View inventory grid
- Click item for details
- Drag items (for crafting/processing)
- Select items for selling

### Outputs / Feedback
- Item count display
- Item tooltips
- Drag-and-drop feedback
- Stack splitting

### Screens / UI Elements
- **InventoryView** — Item grid display
  - Category tabs
  - Sort options
  - Item cards
  - Stack management

---

## 6. Storage Expansion

### Upgrade Tiers

| Level | Capacity | Unlock |
|-------|----------|--------|
| Base | 100 items | Start |
| Tier 1 | 200 items | Upgrade |
| Tier 2 | 400 items | Upgrade |
| Tier 3 | 1000 items | Upgrade |

---

## 7. Open Questions / Risks

- [x] Basic inventory implemented
- [ ] Stack limit per item type
- [ ] Inventory sorting options
- [ ] Bulk item management
