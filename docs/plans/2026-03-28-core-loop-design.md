# Gemstone: Core Loop Design Document

**Version:** 1.1  
**Date:** 2026-03-28  
**Status:** Updated - Earned Idle Model

---

## Executive Summary

Gemstone is a discovery-driven casual game where players build a gem-focused enterprise through multiple career paths. The game teaches real mineralogy through organic play, not tutorials. Players choose their own adventure—becoming prospectors, lapidaries, gemologists, or jewelers—while developing expertise through layered progression systems.

**Target Platform:** Web-first (HTML5), playable on mobile and desktop  
**Monetization:** Free-to-play with cosmetic purchases  
**Session Style:** Flexible (2-5 minute micro-sessions or 15-20 minute deep dives)

---

## Core Philosophy

### 1. Discovery-Led Education
Players learn by doing, not by reading. The Gemdex fills naturally as players encounter gems. Educational facts appear as optional "whispers" that enhance understanding without forcing memorization.

### 2. Organic Specialization
No forced paths. Players naturally drift toward the playstyle that engages them:
- **Collectors** focus on discovering rare specimens
- **Crafters** chase mastery of mini-games
- **Traders** optimize the economy
- **Explorers** push the boundaries of the map

### 3. Layered Depth
Every mechanic has 4+ layers of depth. Casual players enjoy the surface; dedicated players find infinite rabbit holes.

### 4. Earned Idle
Idle rewards are not free—they are earned through active mini-game performance. Better performance = faster Shift Point accumulation = better idle collection. This ensures every moment of idle time feels deserved and meaningful.

---

## The Multi-Path System

The game world contains five interconnected career paths. Players can dabble in all or specialize in one.

```
┌─────────────────────────────────────────────────────────────┐
│                     PATH OVERVIEW                           │
├─────────────────────────────────────────────────────────────┤
│  PROSPECTOR     │  LAPIDARY     │  GEMOLOGIST              │
│  Find raw gems  │  Cut & shape  │  Analyze & certify        │
├─────────────────┼───────────────┼──────────────────────────┤
│  JEWELER        │  DEALER                                 │
│  Craft pieces   │  Trade & negotiate                       │
└─────────────────────────────────────────────────────────────┘
```

### Path Descriptions

#### 1. Prospector
**Focus:** Finding and acquiring raw materials

| Layer | Name | Activities |
|-------|------|------------|
| 1 | Sifter | Pan for common materials (quartz, feldspar) |
| 2 | Miner | Drill into basic veins for agates, jaspers |
| 3 | Excavator | Extract embedded gems from host rock |
| 4 | Blaster | Controlled explosions for rare deposits |
| 5 | Seeker | Deep prospecting for legendary specimens |

**Key Mechanic:** Different methods yield different gems. Panning finds lightweight materials; blasting reveals hard-to-reach treasures.

#### 2. Lapidary
**Focus:** Transforming rough stones into polished gems

| Layer | Name | Activities |
|-------|------|------------|
| 1 | Tumbler | Basic polishing of tumbled stones |
| 2 | Cabber | Shape smooth domed cabochons |
| 3 | Faceter | Cut geometric faceted stones |
| 4 | Master Cutter | Precision cuts for maximum brilliance |
| 5 | Artificer | Experimental cuts and proprietary designs |

**Key Mechanic:** Each gem type requires specific techniques. Opals need different handling than diamonds.

#### 3. Gemologist
**Focus:** Understanding gem properties and authenticity

| Layer | Name | Activities |
|-------|------|------------|
| 1 | Identifier | Basic visual identification |
| 2 | Tester | Use gemological tools (refractometer, loupe) |
| 3 | Grader | Apply quality ratings using industry standards |
| 4 | Specialist | Expertise in specific gem families |
| 5 | Oracle | Discover hidden properties and treatments |

**Key Mechanic:** Proper identification affects value. A treated gem might look identical to natural.

#### 4. Jeweler
**Focus:** Creating finished jewelry pieces

| Layer | Name | Activities |
|-------|------|------------|
| 1 | Assembler | Simple wire wrapping, basic settings |
| 2 | Setter | Prong, bezel, and channel settings |
| 3 | Smith | Metalwork, soldering, casting |
| 4 | Designer | Original designs and creative compositions |
| 5 | Master | Museum-quality bespoke pieces |

**Key Mechanic:** Design synergy bonuses exist. Diamond halos around emeralds boost value.

#### 5. Dealer
**Focus:** Trading, negotiating, and building reputation

| Layer | Name | Activities |
|-------|------|------------|
| 1 | hawker | Basic buying and selling |
| 2 | Merchant | Access to wholesale markets |
| 3 | Auctioneer | Bidding on rare lots |
| 4 | Gallery Owner | Consignment and exhibitions |
| 5 | mogul | International trade, exclusive access |

**Key Mechanic:** Negotiation mini-games. Price isn't fixed—skill affects outcomes.

---

## Cross-Path Synergies

Cross-path activities provide optional buffs. All paths are independently viable.

| Combination | Bonus |
|------------|-------|
| Prospector + Lapidary | Better yield from self-found gems |
| Gemologist + Dealer | Detect undervalued opportunities |
| Lapidary + Jeweler | Reduced material waste |
| Any 3+ paths | Small global efficiency bonus |

---

## The Core Loop

The loop exists at multiple scales:

### Micro-Loop (5 minutes)
```
[Quick Prospect] → [Basic Process] → [Simple Sale]
```
Casual session: Pan some quartz → tumble it → sell for profit.

### Meso-Loop (20 minutes)
```
[Prospect Deeply] → [Cut & Grade] → [Set in Design] → [Sell to Client]
```
Commute session: Find a nice amethyst → facet it → set in a ring → fulfill a special order.

### Macro-Loop (Days/Weeks)
```
[Build Reputation] → [Unlock Regions] → [Access Rare Gems] → [Create Masterpiece]
```
Long-term: Become known as an emerald specialist → unlock Colombian mines → create museum piece.

---

## Phase Mechanics

### Phase 1: Discover

**Active Mini-Games (Earn Shift Points + Immediate Rewards):**
- **Panning Mini-Game:** Swipe/drag to catch gems, avoid debris
- **Drilling Mini-Game:** Tap rhythmically to extract without shattering
- **Blasting Mini-Game:** Plan charges, trigger in sequence

**Idle Collection (Earned via Shift Tier):**
- Gem collection rate determined by Shift Tier (1-25 gems/hr)
- Tier unlocked through mini-game performance
- Cannot collect if Shift Tier is 0

**Layer Scaling:**
| Layer | Method | Gems Available |
|-------|--------|----------------|
| 1 | Panning | Quartz family, common jasper |
| 2 | Basic Mining | Agates, amethyst, garnet |
| 3 | Vein Mining | Beryl family, tourmaline |
| 4 | Deep Mining | Corundum, precious opal |
| 5 | Legendary | Alexandrite, Paraiba, rare specimens |

### Phase 2: Process

**Active Mini-Games (Earn Shift Points + Immediate Rewards):**
- **Tumbling Strategy:** Choose grit sequence to affect final polish quality
- **Cabochon Mini-Game:** Shape by grinding along template curves
- **Faceting Mini-Game:** Set angles, execute cuts, maximize brilliance
- **Inclusion Mapping:** (Emeralds) Plan cuts to avoid/incorporate flaws

**Idle Collection (Earned via Shift Tier):**
- Processing speed bonus based on Shift Tier
- Higher tier = faster processing timers
- Cannot access if Shift Tier is 0

**Layer Scaling:**
| Layer | Technique | Time Required |
|-------|-----------|---------------|
| 1 | Tumbling | 5 min |
| 2 | Cabochon | 30-second mini-game |
| 3 | Basic Faceting | 2-minute mini-game |
| 4 | Precision Faceting | 5-minute mini-game |
| 5 | Master Cuts | 10-minute challenge |

### Phase 3: Craft

**Active Mini-Games (Earn Shift Points + Immediate Rewards):**
- **Setting Mini-Game:** Secure gem in metal frame
- **Soldering Mini-Game:** Join metal pieces with precision heat
- **Design Mode:** Compose finished pieces from components

**Idle Collection (Earned via Shift Tier):**
- Auto-assembly for simple designs based on Shift Tier
- Higher tier = more complex auto-assembly options

**Key Mechanic:** Gem + Metal + Design = Finished Piece
- Combinations create synergies (Diamond + Ruby = Classic Luxury)
- Symmetry and balance affect final value

### Phase 4: Sell / Display

**Active Mini-Games (Earn Shift Points + Immediate Rewards):**
- **Negotiation Mini-Game:** Haggling with clients
- **Auction Participation:** Bid on lots or sell own pieces
- **Special Orders:** Fulfill client requests for bonuses

**Idle Collection (Earned via Shift Tier):**
- Museum visitors generate passive income (based on displayed pieces)
- Client arrivals (but higher-tier clients need higher Shift Tier)

**Display/Museum System:**
- Donate pieces to personal museum
- Each piece generates "Visitors" (idle income multiplier)
- Complete sets unlock bonuses
- Rarity tiers: Common → Rare → Exceptional → Masterpiece → Legendary

---

## Educational Integration

### Dual-Layer Education System

1. **Shared Gemdex** (Unified Knowledge)
   - All paths contribute to a single encyclopedia
   - Entries unlock as gems are encountered
   - Contains: mineralogy, history, lore, practical uses
   - Completion grants global bonuses

2. **Path-Specific Expertise** (Specialized Knowledge)
   - Each path has its own skill tree
   - Expertise unlocks advanced techniques
   - Reflects real professional specializations

### Discovery Flow
```
Encounter gem → Gemdex entry appears → "Whisper" fact offered →
[Read it] → Gain small bonus → [Skip] → No penalty
```

### Example Whisper
*"This smoky quartz formed in massive crystals in the Alps. Miners once used hollow reeds to blow the dust away while cutting—hence 'smoky.'"*

---

## Idle/Active Balance System

### The Earned Idle Model

**Core Principle:** Idle rewards are not standalone—they are earned through active gameplay. You cannot gain idle rewards without first engaging in the active mini-games.

**How It Works:**
```
Active Mini-Game Performance → Earned "Shift" Rewards → Idle Collection
```

Every time you play an active mini-game:
1. You earn **immediate rewards** (gems, coins) based on your score
2. You also earn **Shift Points** based on your performance
3. Shift Points accumulate and can be "banked" for idle collection

**Shift System:**
- **Shift Points:** Earned per mini-game based on score tier
  - Below average = 1 Shift Point
  - Average = 3 Shift Points  
  - Good = 5 Shift Points
  - Excellent = 8 Shift Points
  - Perfect/Mastery = 15 Shift Points

- **Shift Tiers:** Accumulated Shift Points unlock tiers
  - Tier 1 (10 points): 1 gem/hr during idle
  - Tier 2 (30 points): 3 gems/hr during idle
  - Tier 3 (75 points): 8 gems/hr during idle
  - Tier 4 (150 points): 15 gems/hr during idle
  - Tier 5 (300 points): 25 gems/hr + quality bonus during idle

- **Quality Bonus:** At higher tiers, idle collection has a chance to include higher-quality gems

**The Rhythm:**
```
[Play Mini-Game] → Earn gems + Shift Points
     ↓
[Reach Shift Threshold] → Unlock higher idle tier
     ↓
[Go Idle] → Collect gems based on Shift Tier
     ↓
[Return to Play] → Earn more Shift Points, push to higher tier
```

### Example Flow

1. Player starts with 0 Shift Points (Tier 0 = no idle collection)
2. Plays panning mini-game, scores 85 (Excellent)
3. Earns: 3 gems + 50 coins + 8 Shift Points
4. Now has 8 Shift Points (Tier 1 unlocked!)
5. Goes idle for 2 hours
6. Returns to find 2 gems collected (Tier 1 = 1 gem/hr × 2 hrs)
7. Plays again, scores higher, earns more Shift Points
8. Eventually reaches Tier 5 where idle generates 25 gems/hr

### Why This Works

1. **No Free Lunch:** Players must engage with mini-games to earn idle rewards
2. **Skill Matters:** Better performance = faster Shift Point accumulation = better idle
3. **Progression Drives Engagement:** Want better idle? Master the mini-games
4. **Session-Based:** Players can binge for Shift Points, then idle, then binge again
5. **No Guilt:** Players never feel obligated to keep the game running for passive gains

### Tier Decay (Soft Reset)

To prevent permanent max-tier states:
- Shift Points decay slowly over time (1% per hour of being offline)
- Decay resets when player returns and plays
- This encourages regular play without punishing casual players

### Calibration Mini-Game (Towers of Hanoi)

The Towers of Hanoi mini-game serves a special role:
- **Purpose:** "Boost" your current Shift Tier temporarily
- **Mechanic:** Solve 3-7 disk puzzle to gain a 2-8 hour multiplier
- **Effect:** Your current Shift Tier output is multiplied (not the tier itself)
- **Example:** Tier 3 player solves 7-disk perfectly → 8-hour 2x multiplier on idle collection

This gives players a way to optimize their idle returns before extended offline periods.

---

## Progression Systems

### Player Level
Global XP from any activity. Unlocks:
- New tool tiers
- Expanded storage
- Access to new regions
- Quality-of-life features

### Path Level
Separate track per path. Unlocks:
- New techniques
- Access to higher-tier materials
- Efficiency improvements
- Specialized tools

### Gemdex Completion
Complete entries for bonuses:
- 25% = Minor boost to that gem family
- 50% = Ability to identify at a glance
- 100% = Exclusive knowledge (treatments, origins)

### Museum Prestige
Display pieces generate:
- Visitor income (idle)
- Expertise Points (permanent global bonuses)
- Set completion bonuses

---

## Monetization (Free-to-Play)

### What Players Get Free
- Full game access (all paths, all tiers)
- Basic cosmetics
- All educational content
- Reasonable idle income

### Cosmetic Purchases
- Workshop visual themes
- Tool skins
- Display case decorations
- Character accessories

### Convenience Purchases (Optional)
- Idle speed boosts (not required, just faster)
- Additional processing slots
- Skip tokens for long timers

### What We DON'T Monetize
- Progression gates
- Exclusive gems
- Power advantages
- P2W mechanics

---

## Technical Considerations

### Web-First Architecture
- HTML5/JavaScript (or framework choice)
- LocalStorage for offline/idle progress
- Responsive design for mobile/desktop
- Touch-friendly interfaces

### Session Persistence
- Game state saves continuously
- Shift Points decay at 1% per hour offline
- Decay stops when player returns and plays

### Performance
- Shift Tier calculations are simple arithmetic (no heavy processing)
- Mini-games are the computational focus (canvas rendering)
- Idle collection uses simple timers, no background workers needed

---

## Next Steps

1. **Prototype 2-3 Mini-Games**
   - Panning (collector)
   - Faceting (lapidary)
   - Calibration puzzle (hanoi)

2. **Define Gem Tiers**
   - Complete mineral hierarchy
   - Assign mini-game requirements
   - Map progression unlocks

3. **Build Economic Model**
   - Material values
   - Time-to-value calculations
   - Balance casual vs. dedicated play

4. **Design Gemdex Structure**
   - Entry categories
   - Fact types
   - Unlock triggers

---

## Appendix: Mini-Game Ideas by Path

### Prospector Mini-Games
| Name | Type | Core Mechanic |
|------|------|---------------|
| Pan & Sort | Swipe/Drag | Catch gems, avoid debris |
| Vein Tap | Rhythm | Tap in time to extract |
| Blast Planning | Puzzle | Place charges optimally |
| Core Sample | Rotation | Extract without contamination |

### Lapidary Mini-Games
| Name | Type | Core Mechanic |
|------|------|---------------|
| Tumble Timer | Strategy | Choose grit sequence |
| Shape Guide | Precision | Follow template curves |
| Facet Angles | Puzzle | Set and execute cuts |
| Inclusion Map | Planning | Plan around flaws |

### Jeweler Mini-Games
| Name | Type | Core Mechanic |
|------|------|---------------|
| Setting Hold | Timing | Secure without slipping |
| Solder Flow | Precision | Heat metal correctly |
| Design Compose | Creative | Arrange pieces pleasingly |
| Polish Final | Swipe | Final shine pass |

### Dealer Mini-Games
| Name | Type | Core Mechanic |
|------|------|---------------|
| Haggle | Negotiation | Read cues, counter offer |
| Auction Bid | Timing | Know when to drop out |
| Spot Value | Pattern | Find gems in crowd |

---

*Document Version: 1.0 - Ready for review and iteration*
