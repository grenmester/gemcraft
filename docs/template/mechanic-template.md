# [Mechanic Name] — Design Doc

| Status: [Draft | Approved | In Review | Implemented] | Owner: [Name] | Last Updated: [Date] |

---

## 1. Executive Summary

- One sentence: What is this mechanic?
- One sentence: Why does it exist? (Which design pillar does it serve?)

## 2. Design Goals

- **Primary goal:** What problem does this solve?
- **Secondary goals:** What else does it enable?
- **Non-goals:** Explicitly what this mechanic is NOT responsible for
- **Fun factor:** What is the moment-to-moment feel? (e.g., "tension and release," "mastery through practice," "creative expression")

## 3. Core Behavior (How it works)

- Step-by-step flow of the mechanic from trigger to resolution
- State machine or sequence diagram (text description or image link)
- Duration, cooldown, resource costs, or other numerical constraints

## 4. Dependencies & Interactions

- **Requires from other systems:** (e.g., "Needs collision data from Physics")
- **Provides to other systems:** (e.g., "Broadcasts 'onStealthBroken' event")
- **Conflicts / Overrides:** (e.g., "Cannot use while in dialogue")
- **Known edge cases:** (e.g., "What if triggered simultaneously with save game?")

## 5. User Experience

- **Inputs:** Buttons, gestures, or commands + their functions
- **Outputs / Feedback:** Visual, audio, haptic, or UI responses
- **Screens / UI elements:** Where does UI appear? What does it show?
- **Accessibility considerations:** (e.g., "Can this be toggled? Remappable? Auto-fire option?")

## 6. Failure & Mitigation

- What can go wrong? (player misuse, system conflicts, unexpected states)
- How does the system handle it gracefully?
- What does the player see/feel when it fails?

## 7. Tuning & Metrics

- **Exposed variables for balancing:** (damage values, speeds, probabilities — keep in a table)
- **What to measure during playtesting:** (usage frequency, player error rate, satisfaction rating)
- **Success criteria:** (e.g., "Players should succeed 70% of first attempts, then 90% after tutorial")

## 8. Open Questions / Risks

- What hasn't been decided?
- What technical or design risks exist?
