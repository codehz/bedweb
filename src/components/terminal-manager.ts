import HybridsElement from "~hybrids-element";
import tabContext, { TabContext } from "./tab-context";
import { Hybrids, parent, render, html, property } from "hybrids";
import css from "./terminal-manager.css";
import { iconUnavailable, iconSync, iconDisconnect, iconAdd } from "~res/icons";
import terminalConnection from "./terminal-connection";
import { delay, connect } from "~utils";

interface TerminalManager extends HybridsElement {
  context: TabContext;
  orphanList: number[] | undefined;
  error: Error | undefined;
}

const setError = (host: TerminalManager) => (e: Error) => host.error = e;
const getOrphanList = ({ context: { api } }: TerminalManager) => api.shell.get_orphan_list();
const refreshOrphanList = (host: TerminalManagerRenderer) => { getOrphanList(host.parent).then(list => host.parent.orphanList = list).catch(setError(host.parent)); };

const doDisconnect = (host: TerminalManagerRenderer) => {
  host.activeSession = undefined;
  setTimeout(() => refreshOrphanList(host));
};
const doConnect = (host: TerminalManagerRenderer) => {
  host.parent.context.api.shell.open_shell().then(port => {
    host.activeSession = port;
  }).catch(setError(host.parent));
}

const select = (port: number) => (host: TerminalManagerRenderer) => {
  console.log("select %d", port);
  host.activeSession = port;
  host.parent.context.api.shell.open_id(port).catch(setError(host.parent));
}

interface TerminalManagerRenderer extends HybridsElement {
  parent: TerminalManager;
  activeSession: number | undefined;
  list: number[];
  disable: boolean;
};

const terminalManagerContentRenderer: Hybrids<TerminalManagerRenderer> = {
  parent: parent(x => x === terminalManager),
  disable: property(false),
  list: property([]),
  activeSession: property(undefined),
  render: render((host) => renderList(host), { shadowRoot: false })
};

const handleDone = (host: TerminalManagerRenderer) => {
  host.activeSession = undefined;
  refreshOrphanList(host);
}

const renderList = (host: TerminalManagerRenderer) => html`
  <div id=toolbar>
    <span>Toolbar</span>
    <div class=padding></div>
    <icon-sync onclick=${refreshOrphanList}></icon-sync>
    <icon-disconnect color=${host.activeSession ? "black" : "#0002"} onclick=${doDisconnect}></icon-disconnect>
    <icon-add onclick=${doConnect}></icon-add>
  </div>
  ${host.activeSession 
    ? html`<terminal-connection port=${host.activeSession} ondone=${handleDone}></terminal-connection>`
    : host.list.length
    ? html`
      <ul id=result>
        ${host.list.map(id => html`<li onclick=${select(id)}>${id}</li>`.key(id))}
      </ul>
    `
    : html`
      <div id=empty>
        <icon-unavailable size=72 color="#7777"></icon-unavailable>
        <span>No orphaned sessions</span>
      </div>
    `}
`;

const reloadModule = (host: TerminalManager) => {
  host.error = null;
  host.orphanList = null;
  getOrphanList(host).then(list => host.orphanList = list).catch(setError(host));
}

const renderError = (host: TerminalManager) => html`<div id=error>${host.error}<button onclick=${reloadModule}>reload module</button></div>`;

const loading = html`<div id=loading>Loading...</div>`;

const terminalManager: Hybrids<TerminalManager> = {
  context: parent(x => x === tabContext),
  error: property(undefined),
  orphanList: connect((host) => {
    getOrphanList(host).then(list => host.orphanList = list).catch(setError(host));
  }),
  render: render(host => html`${host.error
    ? renderError(host)
    : host.orphanList
    ? html`<terminal-manager-content-renderer list=${host.orphanList}></terminal-manager-content-renderer>`
    : loading}`
    .define({ iconUnavailable, iconSync, iconDisconnect, iconAdd, terminalManagerContentRenderer, terminalConnection })
    .style(css))
};

export default terminalManager;