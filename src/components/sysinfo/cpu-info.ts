import HybridsElement from "~hybrids-element";
import tabContext, { TabContext } from "~components/tab-context";
import { Hybrids, parent, render, html, Descriptor, property, dispatch } from "hybrids";
import { CPUID } from "~rpcapi";
import BasicCard from "./basic-card";
import css from "./cpu-info.css";

interface CpuInfo extends HybridsElement {
  parent: TabContext
  cpuid?: CPUID
}

function renderCPUID({ brand, cores, logical_cores }: CPUID) {
  return html`
    <div>CPU: ${brand}</div>
    <div>Cores: ${cores}</div>
    <div>Logical Cores: ${logical_cores}</div>
  `;
}

export default {
  parent: parent(x => x == tabContext),
  cpuid: property(undefined),
  hook: {
    connect(host, key, invalidate) {
      host.parent.api.sysinfo.cpuid().then(info => {
        host.cpuid = info;
        invalidate();
        dispatch(host, 'update');
      })
    }
  } as Descriptor<CpuInfo>,
  render: render(({ cpuid }) => html`
    <basic-card title="CPU Info">
      ${cpuid ? renderCPUID(cpuid) : html`<div>loading</div>`}
    </basic-card>
  `.define({ BasicCard }).style(css))
} as Hybrids<CpuInfo>