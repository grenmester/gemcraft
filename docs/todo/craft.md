# Craft — Design Doc

| Status: Design | Owner: System | Last Updated: 2026-03-30 |

---

## 1. Executive Summary

Craft is the jewelry creation phase where processed gems are combined with metals to create valuable finished items.

**Why it exists:** Crafting transforms processed gems into even higher-value products, providing the ultimate value-addition in the game economy.

---

## 2. Design Goals

- **Primary goal:** Create a meaningful transformation layer between processed gems and sellable items
- **Secondary goals:** Provide prestige through rare jewelry, metal acquisition progression
- **Non-goals:** Complex crafting recipes, gear/stats systems
- **Fun factor:** Creating something beautiful, prestige of legendary jewelry

---

## 3. Core Behavior

### 3.1 Jewelry Types

| Type | Gem Slots | Metal Required | Base Multiplier | Complexity |
|------|-----------|----------------|-----------------|------------|
| Ring | 1 | Any metal | 2.5x | Simple |
| Pendant | 1 | Gold/Platinum | 3.0x | Simple |
| Earrings | 2 (paired) | Any metal | 2.8x | Medium |
| Bracelet | 3 | Any metal | 3.5x | Medium |
| Necklace | 4 (1 centerpiece + 3 accent) | Platinum only | 5.0x | Complex |
| Crown | 6 (1 centerpiece + 5 accent) | Platinum only | 8.0x | Expert |

### 3.2 Metal Types

| Metal | Rarity | Value | Used For |
|-------|--------|-------|----------|
| Copper | Common | Low | Basic jewelry |
| Silver | Uncommon | Medium | Standard jewelry |
| Gold | Rare | High | Premium jewelry |
| Platinum | Epic | Very High | Legendary jewelry |

### 3.3 Crafting Multipliers

Base value calculation:
```
Final Value = (Sum of Gem Values) × Jewelry Multiplier × Metal Bonus × Quality Bonus
```

### 3.4 Crafting Chain

```
Processed Gems (from Process)
         │
         ▼
    Select Jewelry Type
         │
         ▼
    Insert Gem(s) into Slots
         │
         ▼
    Select Metal
         │
         ▼
    Craft! → Crafted Jewelry
         │
         ▼
    Sell or Use
```

---

## 4. Dependencies & Interactions

- **Requires from other systems:**
  - Process output (processed gems)
  - Metal acquisition (purchased or found)
  - Inventory system
- **Provides to other systems:**
  - Crafted jewelry → Sell
  - Achievement tracking → Gemdex

---

## 5. User Experience

### Inputs
- Select jewelry type from menu
- Drag gems into slot positions
- Select metal type
- Confirm craft

### Outputs / Feedback
- Preview of final item value
- Quality indicator
- Materials consumed from inventory

### Screens / UI Elements
- **CraftScreen** — Main crafting interface
  - Jewelry type selector
  - Gem slot interface
  - Metal selector
  - Preview panel
  - Craft button

---

## 6. Failure & Mitigation

| Failure | Handling |
|---------|----------|
| Missing gems | Cannot start crafting |
| Missing metal | Cannot craft specific jewelry |
| Inventory full | Warn before crafting |

---

## 7. Tuning & Metrics

### Exposed Variables

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| Ring multiplier | 2.5x | 2.0-3.0x | Entry-level jewelry |
| Crown multiplier | 8.0x | 6.0-10.0x | Top-tier jewelry |
| Platinum bonus | 1.5x | 1.2-2.0x | Premium metal |

### Success Criteria
- Crafting jewelry is more profitable than selling gems
- Higher-tier jewelry justifies effort
- Metal scarcity creates meaningful choices

---

## 8. Open Questions / Risks

- [ ] Metal acquisition mechanics (purchase, find, craft?)
- [ ] Minimum gem quality for each jewelry type
- [ ] Batch crafting UI
- [ ] Jewelry aesthetic variety
