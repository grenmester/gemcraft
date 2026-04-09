# Sell — Design Doc

| Status: Design | Owner: System | Last Updated: 2026-03-30 |

---

## 1. Executive Summary

The Marketplace is where players convert items to Cash, providing the economic闭环 for all progression.

**Why it exists:** Selling is how players monetize their collection, enabling upgrades, worker hiring, and area unlocks.

---

## 2. Design Goals

- **Primary goal:** Convert items to coins efficiently
- **Secondary goals:** Create market dynamics, price optimization opportunities
- **Non-goals:** Real-money trading, PvP trading
- **Fun factor:** Finding the best deals, watching your wealth grow

---

## 3. Core Behavior

### 3.1 Selling Modes

| Mode | Description | Speed | Price |
|------|-------------|-------|-------|
| **Quick-sell** | Instant sale at base market rates | Immediate | Base value |
| **List items** | Set custom prices, wait for buyers | Delayed | Player-set |
| **Auctions** | Time-limited bidding | Timed | Winning bid |

### 3.2 Value Factors

| Factor | Effect |
|--------|--------|
| Item rarity | Higher rarity = higher base price |
| Quality % | 40-110% affects final price |
| Processing stage | Raw < Processed < Crafted |
| Jewelry type | Higher-tier jewelry = higher prices |

### 3.3 Price Formula

```
Final Price = Base Value × Quality Modifier × Processing Bonus × Marketplace Modifier

Where:
- Base Value: From items.yaml
- Quality Modifier: Quality% (0.40-1.10)
- Processing Bonus: 1.0x (raw), 1.3-1.5x (cleaned), etc.
- Marketplace Modifier: 0.95-1.05 (based on market conditions)
```

### 3.4 Profit Margins

| Item Type | Margin | Encourages |
|-----------|--------|------------|
| Raw materials | Lowest | Processing |
| Processed gems/minerals | Medium | More processing or crafting |
| Crafted jewelry | Highest | Full value chain |

---

## 4. User Experience

### Inputs
- Select items to sell
- Choose quick-sell or list
- Set custom price (if listing)
- Confirm transaction

### Outputs / Feedback
- Coins added to balance
- Items removed from inventory
- Transaction history

### Screens / UI Elements
- **MarketplaceScreen** — Main selling interface
  - Inventory grid
  - Sell mode tabs
  - Price calculator
  - Transaction history

---

## 5. Failure & Mitigation

| Failure | Handling |
|---------|----------|
| No items selected | Sell button disabled |
| Listing with no buyers | Item returns to inventory after 7 days |
| Insufficient inventory space | Warn before selling |

---

## 6. Open Questions / Risks

- [ ] Buyer AI for listed items
- [ ] Marketplace fee structure
- [ ] Price history persistence
- [ ] Bulk selling interface
