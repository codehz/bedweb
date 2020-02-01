import { Hybrids, render, html, dispatch, property } from "hybrids";
import HybridsElement from "~hybrids-element";
import InputWrapper from "./input-wrapper";
import ButtonWrapper from "./button-wrapper";
import FormDataEntries from "form-data-entries";

import css from "./login-panel.css";

interface LoginPanel extends HybridsElement {
  loginInit: Record<"address" | "label", string> | undefined;
}

function HandleSubmit(host: LoginPanel, event: Event) {
  event.preventDefault()
  const data = Object.fromEntries(FormDataEntries(event.target as HTMLFormElement));
  dispatch(host, "submit", { detail: data });
}

export default {
  loginInit: property(undefined),
  render: render(({ loginInit }) => html`
    <span id="title">Login</span>
    <form onsubmit=${HandleSubmit}>
      <input-wrapper label="label" value=${loginInit?.label}>
        <input type="text" name="label" required spellcheck="false"  >
      </input-wrapper>
      <input-wrapper label="address" value=${loginInit?.address}>
        <input type="url" name="address" required spellcheck="false" pattern="wss?://.+" >
      </input-wrapper>
      <button-wrapper><button type="submit">Submit</button></button-wrapper>
    </form>
  `.style(css).define({ InputWrapper, ButtonWrapper }))
} as Hybrids<LoginPanel>