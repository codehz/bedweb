import HybridsElement from "~hybrids-element";
import { Hybrids, property, render, html, Descriptor, parent, dispatch } from "hybrids";
import { WebSocketRPC, ProxiedAPI } from "~wsrpc";
import { RPCApi, RPCApiEvent } from "~rpcapi";

import css from "./tab-context.css";
import tabItem, { TabItem } from "./tab-item";
import cpuInfo from "./sysinfo/cpu-info";
import xChart from "./x-chart";
import cpuUsage from "./sysinfo/cpu-usage";
import memInfo from "./sysinfo/mem-info";
import MasonryLayout from "./masonry-layout";
import diskInfo from "./sysinfo/disk-info";
import fileExplorer from "./file-explorer";
import terminalManager from "./terminal-manager";

export interface TabContext extends HybridsElement {
  parent: TabItem;
  activeTab: string;
  address: string;
  state: "ready" | "connected" | "failed";
  errmessage?: string;
  api: ProxiedAPI<RPCApi>;
  rpc: WebSocketRPC<RPCApi, RPCApiEvent>;
  _cont?: (address: string) => void;
}

function emitRetry(host: TabContext) {
  const id = host.parent.id;
  const title = host.parent.title;
  const address = host.address;
  dispatch(host, "add", {
    detail: { id, title, address },
    bubbles: true
  });
}

function changeTab(host: TabContext, ev: CustomEvent) {
  host.activeTab = ev.detail;
}

function buildTree(host: TabContext) {
  return html`
    <tab-group class=floating activeItem=${host.activeTab} onchange=${changeTab}>
      <tab-item slot="home" title="Home">
        <masonry-layout>
          <cpu-info></cpu-info>
          <cpu-usage></cpu-usage>
          <mem-info></mem-info>
          <disk-info></disk-info>
        </masonry-layout>
      </tab-item>
      <tab-item slot="explorer" title="File Explorer">
        <file-explorer path="/"></file-explorer>
      </tab-item>
      <tab-item slot="terminal" title="Terminal">
        <terminal-manager></terminal-manager>
      </tab-item>
    </tab-group>
  `.define({ cpuInfo, xChart, cpuUsage, memInfo, diskInfo, fileExplorer, terminalManager, MasonryLayout });
}

export default {
  parent: parent(tabItem),
  state: property("ready"),
  activeTab: property("home"),
  address: {
    set(host, address: string, last) {
      if (!host._cont) throw new Error("Unknown state");
      host._cont(address);
      delete host._cont;
      return address;
    },
    connect(host, key, invalidate) {
      new Promise(resolve => { host._cont = resolve }).then(async (address: string) => {
        host.rpc = new WebSocketRPC(address);
        const api = await host.rpc.proxy();
        host.api = api;
        await api.ping();
        await api.rpc.on("sysinfo.cpustat", "sysinfo.sysinfo", "sysinfo.diskspace");
        host.state = "connected";
        host.rpc.on("close", e => {
          host.errmessage = e + "";
          host.state = "failed";
          invalidate();
        });
        invalidate();
      }).catch(e => {
        host.errmessage = e + "";
        host.state = "failed";
        invalidate();
      })
      return () => host.rpc?.close();
    }
  } as Descriptor<TabContext>,
  render: render(host => html`
    ${host.state === "ready" && html`<p class=info id=ready>ready</p>`}
    ${host.state === "failed" && html`<p class=info id=failed>${host.errmessage}<button onclick=${emitRetry}>retry</button></p>`}
    ${host.state === "connected" && buildTree(host)}
  `.style(css))
} as Hybrids<TabContext>