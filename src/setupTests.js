import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 26 exposes an inert experimental global `localStorage` (undefined
// without --localstorage-file) that shadows jsdom's implementation under
// vitest, so any test touching Web Storage throws. Install a working
// in-memory Storage so jsdom+localStorage tests behave normally.
class MemoryStorage {
  #store = new Map();
  get length() {
    return this.#store.size;
  }
  clear() {
    this.#store.clear();
  }
  getItem(key) {
    const k = String(key);
    return this.#store.has(k) ? this.#store.get(k) : null;
  }
  setItem(key, value) {
    this.#store.set(String(key), String(value));
  }
  removeItem(key) {
    this.#store.delete(String(key));
  }
  key(index) {
    return [...this.#store.keys()][index] ?? null;
  }
}

try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    writable: true,
    configurable: true
  });
} catch {
  globalThis.localStorage = new MemoryStorage();
}

afterEach(() => {
  cleanup();
  globalThis.localStorage.clear();
});

global.expect = expect;
