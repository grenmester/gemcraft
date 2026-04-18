# Recipe System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement recipe system with recipe data and recipe browser UI in Craft component

**Architecture:** Create data file with jewelry types, settings, findings, and recipes. Update Craft.jsx with tabbed recipe browser using existing UI patterns from Process component.

**Tech Stack:** React, existing game components, React Icons

---

### Task 1: Create recipes.js data file

**Files:**
- Create: `src/data/recipes.js`

**Step 1: Create the recipes data file**

Write the file with the exact structure provided in the task.

**Step 2: Build and verify**

Run: `pnpm build`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add src/data/recipes.js
git commit -m "feat(craft): add recipes data file with jewelry types, settings, findings, and craft tiers"
```

---

### Task 2: Update Craft.jsx with recipe browser UI

**Files:**
- Modify: `src/features/craft/components/Craft.jsx`

**Step 1: Implement recipe browser with tabs**

Following the UI pattern from Process.jsx (tab navigation with state), implement:
- Import recipes data (JEWELRY_TYPES, RECIPES, CRAFT_TIERS)
- Tab state for jewelry types: ring, pendant, earrings, bracelet, necklace, crown
- Recipe cards showing:
  - Recipe name and difficulty
  - Requirements (gems, metal, findings)
  - Locked/unlocked status (display all as unlocked for now)
  - Value preview

**Step 2: Build and verify**

Run: `pnpm build`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add src/features/craft/components/Craft.jsx
git commit -m "feat(craft): add recipe browser UI with tabbed navigation"
```

---

### Task 3: Verify complete implementation

**Step 1: Final build test**

Run: `pnpm build`
Expected: BUILD SUCCESS

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat(craft): add recipe data and recipe browser UI"
```

---