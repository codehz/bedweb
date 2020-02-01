import HybridsElement from "~hybrids-element";
import { Hybrids, html, property } from "hybrids";

export interface TabItem extends HybridsElement {
  title: string;
}

export default {
  title: property("none"),
  render: () => html`<slot></slot>`.style(":host, slot { display: contents }")
} as Hybrids<TabItem>;