import HybridsElement from "~hybrids-element";
import tabItem, { TabItem } from "./tab-item";
import { Hybrids, children, html, property, dispatch, render } from "hybrids";
import css from "./tab-group.css";
import { renderFlip } from "~utils";

export interface TabGroup extends HybridsElement {
  items: TabItem[];
  activeItem: string;
  show: boolean;
}

function isButton(target: EventTarget): target is HTMLButtonElement {
  return "tagName" in target && (target as any).tagName == "BUTTON";
}

function handleSwitch(host: TabGroup, ev: MouseEvent) {
  const target = ev.target;
  if (isButton(target)) {
    const slot = target.dataset.slot;
    if (!slot) {
      dispatch(host, "add");
      return;
    }
    host.activeItem = slot;
    dispatch(host, "change", { detail: slot, bubbles: true });
    host.items.filter(x => x.slot === slot).map(x => dispatch(x, "active"));
  }
}

const TabGroupToggleButton = {
  active: property(false),
  render: render(({ active }) => html`
    <div class=${{ active }} id="begin"></div>
    <div class=${{ active }} id="middle"></div>
    <div class=${{ active }} id="end"></div>
  `.style(`
    :host {
      width: 48px;
      height: fit-content;
      padding: 9px 0;
    }
    div {
      width: 24px;
      background-color: black;
      border-radius: 3px;
      display: block;
      height: 2px;
      margin: 6px auto;
      transition: all .2s ease-in-out;
    }
    div.active {
      width: 28px;
    }
    #begin.active { transform: translateY(8px) rotate(135deg); }
    #end.active { transform: translateY(-8px) rotate(-135deg); }
    #middle.active { transform: scale(0); }
  `))
} as Hybrids<HybridsElement & { active: boolean }>

function toggle(host: TabGroup) {
  host.show = !host.show;
}

export default {
  show: property(false),
  items: children(tabItem),
  activeItem: property("empty"),
  render: renderFlip<TabGroup>(({ items, activeItem, show }) => html`
    <tab-group-toggle-button active=${show} onclick=${toggle}></tab-group-toggle-button>
    <slot name="logo">LOGO</slot>
    <nav onclick=${handleSwitch} class=${{ show }}>
      ${items.map(({ title, slot }) => html`
        <button class=${{ active: slot === activeItem }} data-flip-key="${slot}" data-slot="${slot}">${title}</button>
      `)}
      <button class="add" data-flip-key="add">+</button>
    </nav>
    <slot name=${activeItem} class="content"><p>Empty</p></slot>
  `.style(css).define({ TabGroupToggleButton }), host => ({ parent: host.shadowRoot.querySelector("nav") }))
} as Hybrids<TabGroup>;