import { RenderFunction, Descriptor, render } from "hybrids";
import { FlippingWebOptions } from "flipping/src/types";
import FlippingWeb from "flipping/src/adapters/web";

export function ref(query: string) {
  return ({ render }) => {
    if (typeof render === 'function') {
      const target = render();
      return target.querySelector(query);
    }
    return null;
  };
}

export function connect<T extends HTMLElement>(fn: (host: T, key: string, invalidate: () => void) => (() => void) | void) {
  return { connect: fn } as Descriptor<T>
}

export function delay<T>(time: number): (x: T) => Promise<T> {
  return function(content: T) {
    return new Promise(re => setTimeout(() => re(content), time))
  }
}

const flip = Symbol("flip");
const first = Symbol("first");

export function renderFlip<E extends HTMLElement>(fn: RenderFunction<E>, flipOptions: (host: E) => FlippingWebOptions, customOptions?: { shadowRoot?: boolean | object }): Descriptor<E> {
  return render((host) => {
    if (!host[first]) host[first] = true;
    else {
      if (!host[flip]) host[flip] = new FlippingWeb(flipOptions(host));
      const update = fn(host);
      return (h, t) => {
        host[flip].read();
        update(h, t);
        host[flip].flip();
      };
    }
    return fn(host);
  }, customOptions);
}