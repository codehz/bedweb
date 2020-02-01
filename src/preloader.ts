export class Preloader {
  private map: Map<string, Blob>;
  private tasks: Promise<void>[];
  constructor() {
    this.map = new Map();
    this.tasks = [];
  }

  preload(key: string, address: string) {
    this.tasks.push(
      (async () => {
        try {
          const data = await fetch(address);
          const blob = await data.blob();
          this.map.set(key, blob);
        } catch (err) {
          console.error("Failed to load %s from %s", key, address);
          throw err;
        }
      })()
    );
  }

  preloadFont(font: FontFace) {
    this.tasks.push(
      (async () => {
        try {
          await font.load();
          document.fonts.add(font);
        } catch (err) {
          console.error("Failed to load font %s", font.family);
          throw err;
        }
      })()
    );
  }

  async wait(): Promise<{ readonly [key: string]: string }> {
    await Promise.all(this.tasks);
    const ret = {} as { [key: string]: string };
    this.map.forEach((v, k) => { ret[k] = URL.createObjectURL(v); })
    return Object.freeze(ret);
  }

  get(key: string): Blob | void {
    return this.map.get(key);
  }
}