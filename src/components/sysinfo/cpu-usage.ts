import HybridsElement from "~hybrids-element";
import tabContext, { TabContext } from "~components/tab-context";
import { Hybrids, parent, Descriptor, render, html, property } from "hybrids";
import { Observable, merge, Subscription, pipe } from "rxjs"
import { pairwise, map, bufferCount, tap, share } from "rxjs/operators"
import { CPUStatGroup, CPUStat } from "~rpcapi";
import basicCard from "./basic-card";
import xChart from "../x-chart";
import css from "./cpu-usage.css";

interface CpuUsage extends HybridsElement {
  parent: TabContext;
  utilization: number;
  data: number[];
}

function getIdle(stat: CPUStat) {
  return stat.idle + stat.iowait;
}

function getWork(stat: CPUStat) {
  return stat.user + stat.nice + stat.systm + stat.irq + stat.softirq + stat.steal;
}

function utilization(prev: CPUStat, curr: CPUStat) {
  const prevIdle = getIdle(prev);
  const currIdle = getIdle(curr);
  const prevWork = getWork(prev);
  const currWork = getWork(curr);
  const prevTotal = prevIdle + prevWork;
  const currTotal = currIdle + currWork;
  const totald = currTotal - prevTotal;
  const idled = currIdle - prevIdle;
  return (totald - idled) / totald;
}

function getPercent(num: number) {
  return (num * 100).toFixed(1)
}

export default {
  parent: parent(x => x == tabContext),
  utilization: property(0),
  data: property(Array(10).fill(0)),
  ex: {
    connect(host, _, invalidate) {
      const ob = new Observable<CPUStatGroup>(sub => {
        const fn = (data: CPUStatGroup) => sub.next(data);
        const rpc = host.parent.rpc;
        rpc.on("sysinfo.cpustat", fn);
        return () => rpc.off("sysinfo.cpustat", fn);
      });
      const subscription = new Subscription();
      const util: Observable<number> = ob.pipe(
        pairwise(),
        map(pair => utilization.apply(null, pair.map(x => x.global)) as number),
        share()
      );
      subscription.add(util.subscribe((value: number) => {
        host.utilization = value;
        invalidate();
      }));
      subscription.add(merge(host.data, util).pipe(
        bufferCount(10, 1)
      ).subscribe((data: number[]) => {
        host.data = data;
        invalidate();
      }))
      return () => subscription.unsubscribe();
    }
  } as Descriptor<CpuUsage>,
  render: render(({ utilization, data }) => html`
    <basic-card title="CPU Utilization">
      <span>${getPercent(utilization)}%</span>
      <x-chart data=${data} color="#81d4fa7f"></x-chart>
    </basic-card>
  `.define({ xChart, basicCard }).style(css))
} as Hybrids<CpuUsage>;