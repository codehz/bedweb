import HybridsElement from "~hybrids-element";
import tabContext, { TabContext } from "~components/tab-context";
import { Hybrids, parent, render, html, Descriptor, property, dispatch } from "hybrids";
import basicCard from "./basic-card";
import { DiskSpace } from "~rpcapi";
import css from "./disk-info.css";
import filesize from "filesize";

const size = filesize.partial({ standard: 'iec' })

interface DiskInfo extends HybridsElement {
  parent: TabContext;
  path: string;
  info: DiskSpace;
}

export default {
  parent: parent(x => x === tabContext),
  info: property(undefined),
  path: property(""),
  hook: {
    connect(host, _, invalidate) {
      let first = true;
      function handler({ path, info }: { path: string; info: DiskSpace }) {
        host.path = path;
        host.info = info;
        invalidate();
        if (first) {
          dispatch(host, 'update');
          first = false;
        }
      }
      const rpc = host.parent.rpc;
      rpc.on("sysinfo.diskspace", handler);
      return () => rpc.off("sysinfo.diskspace", handler);
    }
  } as Descriptor<DiskInfo>,
  render: render(({ path, info }) => html`
    <basic-card title="Disk">
      ${info ? html`
        <div>For ${path}</div>
        <div>Free ${size(info.free)}</div>
        <div>Capacity ${size(info.capacity)}</div>
        <div>Available ${size(info.available)}</div>
      ` : html`<div>Loading</div>`}
    </basic-card>
  `.define({ basicCard }).style(css))
} as Hybrids<DiskInfo>;