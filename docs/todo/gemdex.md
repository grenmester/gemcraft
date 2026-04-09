# Gemdex — Design Doc

| Status: Implemented | Owner: System | Last Updated: 2026-03-30 |

---

## 1. Executive Summary

Gemdex is the collection/encyclopedia system that tracks all discovered items, workers, and upgrades.

**Why it exists:** Collection drives long-term engagement and provides a sense of progress beyond coin accumulation.

---

## 2. Design Goals

- **Primary goal:** Track player discoveries and collection progress
- **Secondary goals:** Provide item information, motivate exploration
- **Non-goals:** Trading collectibles, achievements/leaderboards
- **Fun factor:** Completionism, discovering rare items, viewing stats

---

## 3. Core Behavior

### 3.1 Four Tabs

| Tab | Contents |
|-----|----------|
| **Raw Materials** | All unprocessed items discovered |
| **Processed** | Refined gems and minerals |
| **Workers** | All owned workers, XP, assignments |
| **Upgrades** | Purchased upgrades, current bonuses |

### 3.2 Entry Information

Each entry shows:
- Name and icon
- Stack size / quantity
- Location found (for raw materials)
- Processing options (for raw materials)
- Market price

### 3.3 Progress Tracking

- X/Y discovered count
- Percentage completion
- Category-specific progress bars

### 3.4 Search Function

- Filter by name
- Filter by rarity
- Filter by category

---

## 4. Dependencies & Interactions

- **Requires from other systems:**
  - All discovery → Raw materials tab
  - Process phase → Processed tab
  - Workers → Workers tab
  - Upgrades → Upgrades tab
- **Provides to other systems:**
  - Discovery state tracking

---

## 5. User Experience

### Inputs
- Click tab to switch view
- Type in search box
- Click entry for details

### Outputs / Feedback
- Filtered/sorted item lists
- Entry detail modal
- Progress percentages

### Screens / UI Elements
- **GemdexScreen** — Main encyclopedia view
  - Tab navigation
  - Search bar
  - Progress summary
  - Item grid/list toggle

---

## 6. Open Questions / Risks

- [x] Basic implementation complete
- [ ] Detailed entry pages
- [ ] Completion rewards
- [ ] "First found" tracking
