import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Market from './Market.jsx';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniques } from '../../../loaders/cutTechniques.js';
import { identifiedValue, stoneValue } from '../logic/market.js';

// Value now follows what was MEASURED: an ungraded rough prices at the
// floor, which would defeat the tests below that exercise a real multiplier.
// Carry a full revealed record matching this fixture's true values.
const ROUGH = {
  instanceId: 'i1', trueSpeciesId: 'ruby', caratWeight: 1.8, clarity: 82, colorGrade: 91,
  revealed: {
    weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 1.8 },
    colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 91, band: 5 },
    clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 82, band: 5 }
  }
};
const STONE = { instanceId: 's1', trueSpeciesId: 'ruby', cut: 'cabochon', cutQuality: 88, caratRetained: 1.4, clarity: 82, colorGrade: 91, phenomena: ['asterism'], score: 88 };

function renderMarket(overrides = {}) {
  const props = {
    cash: 340,
    identified: [ROUGH],
    stones: [STONE],
    speciesById,
    ownedGear: ['sieve'],
    techniques: cutTechniques,
    onSellIdentified: vi.fn(),
    onSellStone: vi.fn(),
    onBuyGear: vi.fn(),
    ...overrides
  };
  render(<Market {...props} />);
  return props;
}

describe('Market', () => {
  it('prompts when there is nothing to sell', () => {
    renderMarket({ identified: [], stones: [] });
    screen.getByText(/nothing to sell/i);
  });

  it('separates rough from cut stones', () => {
    renderMarket();
    screen.getByText(/rough/i);
    // Exact string, not /cut stones/i: the rough section's own helper text
    // ("uncut stones sell at half") contains "cut stones" as a substring
    // ("un" + "cut stones..."), so a case-insensitive regex is ambiguous.
    screen.getByText('Cut stones');
  });

  it('does not duplicate the cash total the shell already shows', () => {
    renderMarket();
    // The shell renders the running cash total on every tab; Market must not
    // render a second one. Match the VALUE of cash in any formatting rather
    // than one hard-coded string, so a reformatted duplicate is still caught —
    // but do not forbid the 💰 marker outright, since each price legitimately
    // carries it.
    const cashTotals = screen.queryAllByText((_, el) => {
      const direct = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join('')
        .replace(/[^0-9]/g, '');
      return direct === '340';
    });
    expect(cashTotals).toHaveLength(0);
  });

  it('marks every price with the currency', () => {
    renderMarket();
    // a bare number is not a price — each row must say what the unit is
    const ruby = screen.getByRole('button', { name: /Sell rough Ruby/i }).closest('li');
    expect(ruby.textContent).toMatch(/💰/);
  });

  it('prices rough and cut stones by the value rules', () => {
    renderMarket();
    // The row displays money with a currency marker and comma thousands
    // separators, so match the component's formatting rather than the bare
    // numeric string — the cut Ruby's total is 1242, rendered as "💰 1,242".
    const displayed = (n) => `💰 ${Math.round(n).toLocaleString()}`;
    screen.getByText(displayed(identifiedValue(ROUGH, speciesById.ruby)));
    screen.getByText(displayed(stoneValue(STONE, speciesById.ruby)));
  });

  it('suggests what cutting a rough stone could fetch', () => {
    renderMarket();
    screen.getByText(/could fetch/i);
  });

  it('sells a rough stone and a cut stone', () => {
    const { onSellIdentified, onSellStone } = renderMarket();
    fireEvent.click(screen.getByRole('button', { name: /Sell rough Ruby/i }));
    expect(onSellIdentified).toHaveBeenCalledWith('i1');
    fireEvent.click(screen.getByRole('button', { name: /Sell cut Ruby/i }));
    expect(onSellStone).toHaveBeenCalledWith('s1');
  });

  it('gives two rough stones of the same species distinct sell/why labels', () => {
    // The harder case: two ROUGH_2-style fixtures — same species, same true
    // carat/colour/clarity, neither carrying a `revealed` record — must still
    // get distinct labels. Falling back to a shared "ungraded" string, or to
    // the (identical) true carat, would collapse both rows onto one label.
    const ROUGH_2 = { instanceId: 'i2', trueSpeciesId: 'ruby', caratWeight: 1.8, clarity: 82, colorGrade: 91 };
    const ROUGH_3 = { instanceId: 'i3', trueSpeciesId: 'ruby', caratWeight: 1.8, clarity: 82, colorGrade: 91 };
    renderMarket({ identified: [ROUGH_2, ROUGH_3] });
    const sellFirst = screen.getByRole('button', { name: /Sell rough Ruby, ungraded, item 1/i });
    const sellSecond = screen.getByRole('button', { name: /Sell rough Ruby, ungraded, item 2/i });
    expect(sellFirst).not.toBe(sellSecond);
    const whyFirst = screen.getByRole('button', { name: /Why this price for rough Ruby, ungraded, item 1/i });
    const whySecond = screen.getByRole('button', { name: /Why this price for rough Ruby, ungraded, item 2/i });
    expect(whyFirst).not.toBe(whySecond);
  });

  it('gives two graded rough stones of the same species distinct sell/why labels', () => {
    // Pins the measured path: once carat is actually known, the label uses
    // it (and stays distinct because the measured carats differ).
    const ROUGH_HEAVY = {
      instanceId: 'i2', trueSpeciesId: 'ruby', caratWeight: 2.5, clarity: 82, colorGrade: 91,
      revealed: {
        weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.5 }
      }
    };
    renderMarket({ identified: [ROUGH, ROUGH_HEAVY] });
    const sellLight = screen.getByRole('button', { name: /Sell rough Ruby, 1.8 carat/i });
    const sellHeavy = screen.getByRole('button', { name: /Sell rough Ruby, 2.5 carat/i });
    expect(sellLight).not.toBe(sellHeavy);
    const whyLight = screen.getByRole('button', { name: /Why this price for rough Ruby, 1.8 carat/i });
    const whyHeavy = screen.getByRole('button', { name: /Why this price for rough Ruby, 2.5 carat/i });
    expect(whyLight).not.toBe(whyHeavy);
  });

  it('does not display an unmeasured rough stone\'s true colour or clarity', () => {
    // Distinctive true values with no `revealed` record: the row must show
    // as ungraded, not leak the numbers the player never measured.
    const UNMEASURED = { instanceId: 'iu1', trueSpeciesId: 'ruby', caratWeight: 3.3, clarity: 82, colorGrade: 91 };
    renderMarket({ identified: [UNMEASURED], stones: [] });
    const row = screen.getByRole('button', { name: /Sell rough Ruby/i }).closest('li');
    expect(row).not.toBeNull();
    expect(row.textContent).not.toMatch(/82/);
    expect(row.textContent).not.toMatch(/91/);
    expect(row.textContent).not.toMatch(/3\.3/);
  });

  it('explains a price in a breakdown modal', () => {
    renderMarket();
    fireEvent.click(screen.getByRole('button', { name: /Why this price for cut Ruby/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toMatch(/900/);      // base value
    expect(dialog.textContent).toMatch(/Clarity/i); // a score part
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the uncut penalty when explaining a rough price', () => {
    renderMarket();
    fireEvent.click(screen.getByRole('button', { name: /Why this price for rough Ruby/i }));
    expect(screen.getByRole('dialog').textContent).toMatch(/uncut/i);
  });

  it('shows a rough multiplier precise enough to reconcile with the total', () => {
    renderMarket();
    fireEvent.click(screen.getByRole('button', { name: /Why this price for rough Ruby/i }));
    // ROUGH is fully graded: caratWeight 1.8/5*100 = 36, colorGrade 91,
    // clarity 82: 0.5 + ((36 + 91 + 82) / 3) / 100 = 1.19667 (toFixed(3):
    // "1.197"). toFixed(2) would round this to 1.20, which no longer
    // multiplies back to the shown total — the whole point of this modal.
    expect(screen.getByRole('dialog').textContent).toMatch(/1\.197/);
  });

  it('says what each piece of gear opens, and marks what is owned', () => {
    renderMarket();
    screen.getByText(/Gravel Bar/);
    // ownedGear only includes 'sieve', so the Rock Hammer button is the sole
    // element named "Rock Hammer" — query it once and assert it directly,
    // rather than the brief's two overlapping queries for the same button.
    const rockHammerButton = screen.getByRole('button', { name: /Buy Rock Hammer/i });
    expect(rockHammerButton.disabled).toBe(false); // cash 340 >= price 300 — affordable

    // ownedGear includes 'sieve' in the default fixture — assert it actually
    // presents as owned, not merely that some other button is affordable.
    const sieveButton = screen.getByRole('button', { name: /Sieve owned/i });
    expect(sieveButton.disabled).toBe(true);
    expect(sieveButton.textContent).toBe('Owned');
  });

  it('disables a purchase that cannot be afforded', () => {
    renderMarket({ cash: 10, ownedGear: [] });
    expect(screen.getByRole('button', { name: /Buy Sieve/i }).disabled).toBe(true);
  });
});
