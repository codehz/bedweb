export class EventEmitter {
  private events: Map<string, Array<(key?: any) => void>>;
  constructor() {
    this.events = new Map();
  }

  on(event: string, listener: (key?: any) => void) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event)!.push(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener?: (key?: any) => void) {
    if (!this.events.has(event)) return;
    if (listener) {
      const arr = this.events.get(event)!;
      const idx = arr.indexOf(listener);
      if (idx == -1) return;
      arr.splice(idx, 1);
    } else {
      this.events.delete(event);
    }
  }

  emit(event: string, obj?: any) {
    if (!this.events.has(event)) return;
    const arr = this.events.get(event)!;
    for (const item of arr) {
      item(obj);
    }
  }
}