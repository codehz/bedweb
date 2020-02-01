import HybridsElement from "~hybrids-element";
import tabContext, { TabContext } from "~components/tab-context";
import { Hybrids, parent, render, html, Descriptor, property } from "hybrids";
import basicCard from "./basic-card";
import { Subscription, Observable, merge } from "rxjs";
import { SYSInfo } from "~rpcapi";
import xChart from "../x-chart";
import { map, share, bufferCount } from "rxjs/operators";
import css from "./mem-info.css";

interface MemInfo extends HybridsElement {
  parent: TabContext;
  utilization: number;
  data: number[];
}

function getPercent(num: number) {
  return (num * 100).toFixed(1)
}

export default {
  parent: parent(x => x === tabContext),
  data: property(Array(10).fill(0)),
  utilization: property(0),
  hook: {
    connect(host, _, invalidate) {
      const subs = new Subscription();
      const ob = new Observable<SYSInfo>(r => {
        function handler(info: SYSInfo) {
          r.next(info);
        }
        const rpc = host.parent.rpc;
        rpc.on("sysinfo.sysinfo", handler);
        return () => rpc.off("sysinfo.sysinfo", handler);
      }).pipe(map(info => 1 - (info.freeram / info.totalram)), share())
      subs.add(ob.subscribe((num) => {
        host.utilization = num;
        invalidate();
      }));
      subs.add(merge(host.data, ob).pipe(
        bufferCount(10, 1)
      ).subscribe(data => {
        host.data = data;
        invalidate();
      }));
      return () => subs.unsubscribe();
    }
  } as Descriptor<MemInfo>,
  render: render(({ utilization, data }) => html`
    <basic-card title="Memory">
      <span>${getPercent(utilization)}%</span>
      <x-chart data=${data} color="#81d4fa7f"></x-chart>
    </basic-card>
  `.define({ xChart, basicCard }).style(css))
} as Hybrids<MemInfo>;