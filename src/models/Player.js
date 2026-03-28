import { Gem } from './Gem.js';

export class Player {
  constructor({
    coins = 100,
    gems = [],
    gemdex = [],
    pathProgress = 0,
    shiftPoints = 0,
    calibrationMultiplier = 1.0
  } = {}) {
    this.coins = coins;
    this.gems = gems;
    this.gemdex = gemdex;
    this.pathProgress = pathProgress;
    this.shiftPoints = shiftPoints;
    this.calibrationMultiplier = calibrationMultiplier;
  }

  addGem(gemData) {
    const gem = gemData instanceof Gem ? gemData : new Gem(gemData);
    this.gems.push(gem);
    this.coins += gem.getDisplayValue().baseValue;
    this.discoverGem(gem);
    return gem;
  }

  discoverGem(gem) {
    if (!this.gemdex.find(g => g.id === gem.id)) {
      this.gemdex.push(gem);
    }
  }

  addShiftPoints(points) {
    this.shiftPoints += points;
  }

  toJSON() {
    return {
      coins: this.coins,
      gems: this.gems,
      gemdex: this.gemdex,
      pathProgress: this.pathProgress,
      shiftPoints: this.shiftPoints,
      calibrationMultiplier: this.calibrationMultiplier
    };
  }
}
