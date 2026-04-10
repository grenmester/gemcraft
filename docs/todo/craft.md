# Craft — Design Doc

| Status: Design | Owner: System | Last Updated: 2026-04-10 |

---

## 1. Executive Summary

Craft is the jewelry creation phase where processed gems are combined with metals to create valuable finished jewelry items.

**Why it exists:** Crafting transforms processed gems into even higher-value products, providing the ultimate value-addition in the game economy. It creates a satisfying end-to-end gameplay loop: Discover → Process → Craft → Sell.

**Core Loop:**
```
Raw Materials (Discover)
    →
Processed Gems + Metals (Process - refine ore into metal)
    →
Jewelry (Craft - combine gems + metal + findings)
    →
Sell (profit!)
```

---

## 2. Design Goals

- **Primary goal:** Create a meaningful transformation layer between processed gems and sellable items
- **Secondary goals:** Prestige through rare jewelry, deep crafting system with variety
- **Non-goals:** Stats/gear systems, overly complex simulations
- **Fun factor:** Creating beautiful jewelry, recipe discovery, mastery progression

---

## 3. Core Systems

### 3.1 Metal Acquisition (New!)

Metals are acquired through ore processing, not purchase or loot:

**Flow:** Discover → Mine ore → Process (refine) → Metal

| Ore | Metal Output | Quality Range | Value | Found At |
|-----|-------------|-------------|-------|----------|
| Copper Ore | Copper | 60-85% | 5 | TIER_1, TIER_2 |
| Silver Ore | Silver | 65-85% | 25 | TIER_2, TIER_3 |
| Gold Ore | Gold | 70-90% | 100 | TIER_3, TIER_4 |
| Platinum Ore | Platinum | 75-95% | 500 | TIER_4, TIER_5 |

**Metal Quality** represents purity/alloy quality:
- Higher quality = better Crafting multiplier
- Quality affects final jewelry value
- Realistic: 24K gold = 99%+ pure, 14K = 58%

### 3.2 Jewelry Types & Slots

| Type | Gem Slots | Metal Required | Base Multiplier | Complexity |
|------|----------|--------------|---------------|-----------|
| Ring | 1 | Any metal | 2.5x | Simple |
| Pendant | 1 | Any metal (not copper) | 3.0x | Simple |
| Earrings | 2 | Any metal (not copper) | 2.8x | Medium |
| Bracelet | 3 | Silver+ | 3.5x | Medium |
| Necklace | 4 | Gold+ | 5.0x | Complex |
| Crown | 6 | Platinum only | 8.0x | Expert |

### 3.3 Settings (New!)

Settings affect final value and aesthetic:

| Setting | Description | Multiplier | Best For |
|---------|------------|-----------|---------|
| Prong | Classic claw setting | 1.0x | All gems, maximizes sparkle |
| Bezel | Metal rim around gem | 1.2x | Softer gems, active wear |
| Pavé | Tiny diamonds set in metal | 1.5x | Accent gems, luxury |
| Channel | Gems set in channel | 1.3x | Wedding bands |
| Illusion | Gem + metal reflection | 1.4x | Diamond looks bigger |

### 3.4 Recipes (New!)

Crafted items use **recipes** — multiple materials combined:

**Recipe Structure:**
```
Jewelry Type + Design Name
├── Gem(s) Required (type + quality min)
├── Metal Required (type + quality min)
├── Findings/Wiring (type)
└── Settings Style
```

**Example Recipes:**

| Recipe | Gems | Metal | Findings | Setting | Base Value |
|--------|------|-------|-----------|---------|-----------|
| Classic Gold Ring | 1 Diamond (70%+) | Gold (75%+) | Band | Prong | 15,000 |
| Rose Gold Earrings | 2 Rubies (65%+) | Gold (70%+) | Ear wires | Bezel | 8,000 |
| Platinum Tennis Bracelet | 8 Sapphires (80%+) | Platinum (85%+) | Clasp | Pavé | 35,000 |
| Emerald Drop Earrings | 2 Emeralds (75%+) | Silver (75%+) | Ear wires + findings | Prong | 4,500 |
| Diamond Halo Pendant | 1 Diamond (85%+) + 12 small | Platinum (85%+) | Chain + bail | Illusion | 45,000 |

**Findings** (hardware):
- Ear wires (earrings)
- Earring backs/finders
- Jump rings
- Necklace chains/bails
- Bracelet clasps
- Ring shanks/bands
- Head settings (for solitaires)

### 3.5 Unlocks (New!)

Crafting requires **XP** to unlock recipes:

| Unlock Tier | XP Required | Recipes Unlocked |
|-------------|-------------|----------------|
| Apprentice | 0 | Basic rings, pendants (copper/silver) |
| Journeyman | 500 | Earrings, bracelets |
| Expert | 2,000 | Gold necklaces |
| Master | 5,000 | Platinum crowns, advanced designs |
| Legendary | 10,000 | All recipes, custom commissions |

**Crafting XP** earned by:
- Successfully crafting: +10 XP base, +1 per gem quality above 80%
- Failed craft attempt: +2 XP (learning from mistakes)

---

## 4. Crafting Value Formula

```
Final Value = 
  (Σ Gem Values × Gem Quality%) × 
  (Σ Metal Values × Metal Quality%) × 
  Jewelry Multiplier × 
  Setting Multiplier × 
  Design Bonus
```

Where:
- **Gem Quality%**: average quality of gems used (0.45 - 1.0)
- **Metal Quality%**: metal purity factor (0.6 - 0.95)
- **Design Bonus**: 1.0 - 1.5x based on recipe rarity

---

## 5. Complete Crafting Flow

```
1. Select Jewelry Type (ring, earrings, etc.)
                          │
2. Choose Recipe/Design (unlocks based on XP)
                          │
3. View Required Materials
   - Gem type + quality minimum
   - Metal type + quality minimum  
   - Findings required
                          │
4. Select Gems from Inventory (must meet quality min)
                          │
5. Select Metal from Inventory (must meet quality min)
                          │
6. Select (or auto-fill) Findings
                          │
7. Select Setting Style
                          │
8. Preview Value Calculation
                          │
9. CRAFT! → Success/Failure check
                          │
10. Add to Inventory (crafted jewelry)
```

**Failure Condition:**
- If any material below recipe minimum: 20% chance of material loss
- If all materials at/above minimum: guaranteed success

---

## 6. Dependencies & Interactions

### From Other Systems:
- **Discover**: Ore drops → processed into metals
- **Process**: Refines ore into metal, gem processing
- **Inventory**: Stores gems, metals, findings, crafted jewelry

### To Other Systems:
- **Sell**: Crafted jewelry sold for profit
- **Gemdex**: Track unique designs crafted
- **Player Progression**: Crafting XP + unlocks

---

## 7. Inventory Categories (New!)

| Category | Contents | Source |
|----------|----------|--------|
| Minerals | Raw minerals | Discover |
| Gems | Processed gems | Process |
| Metals | Refined metals | Process (ore) |
| Findings | Hardware components | Discover + Process |
| Jewelry | Crafted items | Craft |

---

## 8. User Experience

### Inputs
- Select jewelry type category
- Browse/filter recipes (by unlocked)
- Select gems meeting recipe requirements
- Select metal meeting requirements
- Choose setting style
- Preview and confirm

### Outputs / Feedback
- Real-time value preview with breakdown
- Quality indicators for each material
- Success probability
- XP gain on completion

### Screens
- **CraftScreen**: Main interface
  - Category tabs (by jewelry type)
  - Recipe grid (locked/unlocked indicators)
  - Material selectors
  - Preview panel
  - Craft button

---

## 9. Tuning & Metrics

### Exposed Variables

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| Ring multiplier | 2.5x | 2.0-3.0x | Entry-level jewelry |
| Crown multiplier | 8.0x | 6.0-10.0x | Top-tier jewelry |
| Platinum bonus | 1.5x | 1.2-2.0x | Premium metal |
| Bezel multiplier | 1.2x | 1.0-1.5x | Setting style |
| XP per craft | 10 | 5-20 | Progression |
| Quality floor | 70% | 50-80% | Minimum viable |

### Success Criteria
- Crafting > selling raw gems in profit
- Recipe variety provides long-term goals
- Metal quality creates meaningful processing choices
- Findings add acquisition variety

---

## 10. Open Questions

- [ ] How many total recipes per jewelry type? (5-10?)
- [ ] Findings acquisition breakdown (which from Discover vs Process)?
- [ ] Can players sell/buy findings or are they free/gated?
- [ ] Recipe discovery: all visible or hidden until craft attempt?
- [ ] Failed craft: materials lost, partially lost, or full recovery?

---

## 11. Realistic Gemology Notes

Reference for realistic jewelry making:

**Metal Purity:**
- Copper: typically alloyed (not used pure)
- Sterling Silver: 92.5% silver
- 14K Gold: 58.3% gold
- 18K Gold: 75% gold
- 24K Gold: 99.9% gold (too soft for jewelry)
- Platinum: 90-95% pure

**Hardness Considerations:**
- Softer gems (opal, pearl) → bezel setting
- Harder gems (diamond, sapphire) → prong settings

**Findings Availability:**
- Simple: ear wires, jump rings (common)
- Complex: tennis bracelet clasp, necklace chain (premium)