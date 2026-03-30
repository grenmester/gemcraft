export class Inventory {
  constructor(capacity = 20) {
    this.capacity = capacity;
    this.items = [];
  }

  add(item) {
    if (this.items.length >= this.capacity) {
      return false;
    }
    this.items.push(item);
    return true;
  }

  remove(itemId) {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) return null;
    return this.items.splice(index, 1)[0];
  }

  count() {
    return this.items.length;
  }
}
