export class Gem {
  constructor({ id, name, mohs, color, facts = [], values = [] }) {
    this.id = id;
    this.name = name;
    this.mohs = mohs;
    this.color = color;
    this.facts = facts;
    this.values = values;
  }

  getDisplayValue() {
    const rarity = this.mohs >= 9 ? 'legendary' : this.mohs >= 7 ? 'rare' : 'common';
    const baseValue = this.values[0] || 1;
    return {
      rarity,
      baseValue,
      formattedValue: `${baseValue} coins`
    };
  }
}
