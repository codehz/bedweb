import HybridsElement from "../hybrids-element";
import { property, render, html, Hybrids, Descriptor } from "hybrids";
import css from './input-wrapper.css';

interface InputWrapper extends HybridsElement {
  label: string;
  _empty?: boolean;
  empty: boolean;
  value: string;
}

function isInput(target: EventTarget): target is HTMLInputElement {
  return "tagName" in target && (target as any).tagName == "INPUT";
}

export default {
  label: property("label"),
  value: {
    observe(host, value: string) {
      console.log(value);
      const input = host.getElementsByTagName("input")[0]
      if (input) {
        host._empty = value === '';
        input.value = value;
      }
    }
  },
  empty: {
    get(host) { return host._empty == undefined ? true : host._empty; },
    connect(host, key, invalidate) {
      host.addEventListener("input", ev => {
        ev.stopPropagation();
        const target = ev.target;
        if (isInput(target)) {
          const result = target.value.length == 0;
          if (result != host._empty) {
            host._empty = result;
            invalidate();
          }
        }
      });
      return () => { }
    }
  } as Descriptor<InputWrapper>,
  render: render(({ label, empty }) => html`
    <span class=${{ empty }}>${label}</span>
    <slot></slot>
  `.style(css))
} as Hybrids<InputWrapper>