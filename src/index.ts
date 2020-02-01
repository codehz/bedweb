import { html, define, Hybrids, property, render } from 'hybrids';
import XTerm from '~xterm';
import LoginPanel from '~components/login-panel';

import { Preloader } from '~/preloader';

import fonts from './fonts/*.woff2';

import css from './index.css';
import appcss from './app.css';
import TabGroup from '~components/tab-group';
import TabItem from '~components/tab-item';
import { ref } from '~utils';
import HybridsElement from '~hybrids-element';
import TabContext from '~components/tab-context';

const p = new Preloader()

p.preloadFont(new FontFace("MineCrafter", `url(${fonts.minecrafter})`))
p.preloadFont(new FontFace("Unifont", `url(${fonts.unifont})`))

interface SimpleTab {
  title: string;
  id: string;
  address: string;
}

interface App extends HybridsElement {
  tabs: SimpleTab[];
  activeTab: string;
  loginInit: Record<"address" | "label", string> | undefined;
  overlayElement: HTMLDivElement
  overlay: "none" | "login";
}

function handleAdd(host: App, ev: CustomEvent) {
  if (ev.detail) {
    const payload = ev.detail as { address: string, title: string, id: string };
    host.loginInit = { address: payload.address, label: payload.title };
    host.overlay = "login";
    host.tabs = host.tabs.filter(x => x.id === payload.id);
    return;
  }
  host.overlay = "login";
}

function hideOverlay(host: App) {
  const target = host.overlayElement;
  target.style.pointerEvents = 'none';
  target.animate([{
    opacity: 1
  }, {
    opacity: 0
  }], { duration: 300 }).onfinish = () => {
    host.overlay = "none";
    target.style.removeProperty("pointer-events")
  }
}

function handleCancel(host: App, ev: MouseEvent) {
  if (ev.target == ev.currentTarget) {
    hideOverlay(host);
  }
}

function handleLogin(host: App, ev: CustomEvent) {
  const data = ev.detail as { label: string, address: string };
  const id = Math.random().toString(36).slice(2);
  host.tabs = [...host.tabs, {
    id,
    title: data.label,
    address: data.address
  }]
  host.activeTab = id;
  host.loginInit = undefined;
  hideOverlay(host);
}

function handleChange(host: App, ev: CustomEvent) {
  host.activeTab = ev.detail;
}

const App: Hybrids<App> = {
  overlayElement: ref(".overlay"),
  activeTab: property("empty"),
  overlay: property("none"),
  tabs: property([]),
  render: render(({ tabs, overlay, activeTab, loginInit }) => html`
    ${html.resolve(p.wait().then(assets => html`
      <tab-group class=${{ aside: true }} onadd=${handleAdd} activeItem=${activeTab} onchange=${handleChange}>
        ${ tabs.map(({ id, title, address }) => html`
          <tab-item slot=${id} title=${title}>
            <tab-context address=${address}></tab-context>
          </tab-item>
        `.key(id))}
        <span slot="logo" id="logo">Bedweb</span>
      </tab-group>
      <div class=${{ overlay: true, empty: overlay == "none" }} onclick=${handleCancel}>
        ${overlay == "login" && html`<login-panel loginInit=${loginInit} onsubmit=${handleLogin}></login-panel>`}
      </div>
    `), html`loading`)}
  `.define({ XTerm, LoginPanel, TabGroup, TabItem, TabContext }).style(appcss)),
};

define("x-app", App);

const main = document.createElement('style')
main.innerHTML = css;
document.head.appendChild(main)

function needFix() {
  return devicePixelRatio == 1;
}

function fixOdd() {
  if (needFix()) {
    document.body.style.setProperty("--fix-odd", `${window.innerWidth % 2}px`);
  }
}
fixOdd();
window.addEventListener("resize", fixOdd, { passive: true });