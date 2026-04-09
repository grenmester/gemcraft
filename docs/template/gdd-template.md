# Master Game Design Doc — Suggested Structure

| Field                  | Value                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| **Game Title**         | [Title]                                                           |
| **Genre**              | [e.g., Action RPG / Cozy Sim / Tactical Roguelite]                |
| **Target Platform(s)** | [PC, Switch, PS5, Mobile, etc.]                                   |
| **Target Audience**    | [e.g., Fans of Hades, casual builders, hardcore strategy players] |
| **Current Version**    | [v0.1 - Pre-production]                                           |
| **Last Updated**       | [Date]                                                            |

---

## 1. Executive Summary (1 page max)

- **Elevator pitch:** 2-3 sentences that sell the game
- **Core fantasy:** What does the player _feel_ when playing? (e.g., "A cunning spy outsmarting an entire fortress")
- **Key differentiators:** What makes this game different from similar titles?
- **Reference games:** 3-5 games that inspire mechanics or feel

---

## 2. Design Pillars (3-5 principles)

Every design decision should trace back to these. Example:

| Pillar               | Meaning                                    | Anti-pattern (what to avoid)  |
| -------------------- | ------------------------------------------ | ----------------------------- |
| **Player Agency**    | Meaningful choices with clear consequences | Cutscenes that remove control |
| **Emergent Chaos**   | Systems interacting in unexpected ways     | Scripted set-pieces           |
| **Accessible Depth** | Easy to learn, hard to master              | Overwhelming tutorials        |

---

## 3. Core Loop Diagram

```
[Visual or text description]

Example:
Explore → Gather Resources → Return to Base → Craft Upgrades → Explore (harder areas)
```

- **Moment-to-moment loop:** (seconds) e.g., Move → Attack → Dodge → Heal
- **Session loop:** (minutes/hours) e.g., Clear room → Choose reward → Next room
- **Meta loop:** (across sessions) e.g., Unlock character → Level up → Face final boss

---

## 4. Player Archetypes & Goals

Who is playing your game and what do they want?

| Player Type          | Motivations                     | Mechanics that serve them                    |
| -------------------- | ------------------------------- | -------------------------------------------- |
| The Achiever         | Complete everything, get 100%   | Collections, achievements, mastery ranks     |
| The Explorer         | See everything, find secrets    | Hidden areas, lore fragments, map completion |
| The Socializer       | Share experiences, compete      | Leaderboards, shared bases, co-op            |
| The Killer/Dominator | Master systems, beat challenges | Difficulty modes, PvP, score attacks         |

(Adapt based on your game—not all types apply.)

---

## 5. Mechanic Directory (The most important section)

This is your table of contents for the sub-documents.

| Mechanic  | Owner  | Status      | Summary                               | Link   |
| --------- | ------ | ----------- | ------------------------------------- | ------ |
| Combat    | Alex   | Approved    | Real-time directional melee + parry   | [Link] |
| Inventory | Jamie  | Draft       | Grid-based, 20 slots, item stacking   | [Link] |
| Stealth   | Taylor | In Review   | Light/shadow detection, noise meter   | [Link] |
| Dialogue  | Casey  | Not Started | Branching tree, relationship tracking | [Link] |

**Status key:** Not Started → Draft → In Review → Approved → Implemented → Deprecated

---

## 6. Dependency Matrix (Critical for avoiding integration hell)

A simple table showing which mechanics need which:

| Mechanic  | Requires                             | Used By                                              |
| --------- | ------------------------------------ | ---------------------------------------------------- |
| Combat    | PlayerMovement, Camera, HealthSystem | Stealth (combat breaks stealth), Inventory (weapons) |
| Stealth   | LightSystem, SoundSystem, AI_Sight   | Dialogue (stealth affects NPC disposition)           |
| Inventory | SaveSystem, UI_Framework             | Combat (equipped items), Crafting (resources)        |

**Pro tip:** If you have more than ~10 mechanics, consider a simple Miro board or Lucidchart instead of a table.

---

## 7. Progression Architecture

- **Critical path:** Minimum steps to "beat" the game (high-level, not a walkthrough)
- **Unlock flow:** What unlocks what? (e.g., Defeat Boss A → Unlock Area B → Gain Ability C)
- **Pacing targets:** Approximate hours to reach major milestones
- **Power curve:** How player power scales over time (linear? exponential? stepped?)

---

## 8. Economy & Balancing Overview (if applicable)

- **Currencies/resources:** List each one + what it's used for
- **Sinks vs. sources:** Which mechanics generate resources? Which consume them?
- **Rarity tiers:** Common → Rare → Epic → Legendary (or your equivalent)
- **Balancing philosophy:** (e.g., "Vertical progression is capped; horizontal progression is infinite")

_Detailed economy tables go in a separate Economy spreadsheet—link it here._

---

## 9. Art & Audio Direction Summary

Not a full style guide—just the high-level notes.

- **Visual references:** 3-5 images or games
- **Color palette intent:** (e.g., "Warm safe zones, cold dangerous zones")
- **Camera style:** (e.g., Top-down 45°, Third-person over-shoulder, First-person)
- **Audio pillars:** (e.g., "Diegetic UI sounds only," "Dynamic music that responds to combat intensity")
- **Key VFX needs:** (e.g., Hit flashes, teleport trails, area-of-effect indicators)

_Link to full Art Bible and Audio Spec here._

---

## 10. Tech Constraints & Risks

| Constraint                 | Impact                                | Mitigation                                     |
| -------------------------- | ------------------------------------- | ---------------------------------------------- |
| Target 60fps on Switch     | Limits draw calls, particle count     | Budget: 500 draw calls, 200 particles max      |
| No online requirement      | All mechanics must work offline       | Save system must be local-first                |
| Controller-only (no mouse) | UI must be fully navigable with d-pad | Test every screen without touch/stick-as-mouse |

---

## 11. Milestones & Priorities

| Phase                      | Focus                | Key deliverables                          |
| -------------------------- | -------------------- | ----------------------------------------- |
| Pre-prod (Month 1-2)       | Core loop prototype  | Movement + 1 combat mechanic + 1 resource |
| Vertical Slice (Month 3-4) | Polished 10-min demo | All core systems at prototype quality     |
| Production (Month 5-12)    | Feature completion   | All mechanics at "Implemented" status     |
| Polish (Month 13-14)       | Balance + bugfix     | Tuning, juice, accessibility              |

**Must-have vs. Nice-to-have:** List mechanics in priority order. Be ruthless.

---

## 12. Open Questions & Decisions Pending

A living list of unresolved design questions. Examples:

- [ ] Is there fall damage? (Debating: realism vs. frustration)
- [ ] Permadeath mode? (Concern: splits the player base)
- [ ] How does saving work in combat? (Proposed: checkpoint-only)

---

## Appendix A: Glossary

Define your game's unique terms. Example:

| Term      | Definition                                                             |
| --------- | ---------------------------------------------------------------------- |
| Glimmer   | Primary currency, dropped by enemies                                   |
| Resonance | Resource generated by staying in light, consumed for special abilities |
| Breach    | State when stealth fails and combat begins                             |

---

## Appendix B: Quick Reference Tables

- Keyboard/controller default bindings (if fixed)
- Stat caps and formulas (simplified)
- Difficulty mode differences (if any)
