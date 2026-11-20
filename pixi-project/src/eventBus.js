
export default class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((currentListener) => currentListener !== listener);
  }

  emit(event, payload) {
    if (!this.events[event]) return;
    for (const listener of this.events[event]) {
      listener(payload);
    }
  }
}