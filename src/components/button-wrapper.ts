import { render, html, Hybrids } from "hybrids";

import css from "./button-wrapper.css"

export default {
  render: render(() => html`<slot></slot>`.style(css))
} as Hybrids<HTMLElement>