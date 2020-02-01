import HybridsElement from "~hybrids-element";
import { Hybrids, render, html, property } from "hybrids";
import css from "./basic-card.css";

interface BasicCard extends HybridsElement {
  title: string;
  width: number;
}

export default {
  title: property("Card"),
  width: property(300),
  render: render(({ title, width }) => html`
    <span>${title}</span>
    <slot style=${{ width: width + "px" }}></slot>
  `.style(css))
} as Hybrids<BasicCard>