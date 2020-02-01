import HybridsElement from "~hybrids-element";
import { Hybrids, render, html, Descriptor, parent, property } from "hybrids";

import Masonry from "masonry-layout";
import tabItem, { TabItem } from "./tab-item";
import { ref } from "~utils";

interface MasonryLayout extends HybridsElement {
  width: number;
  parent: TabItem;
  masonry: Masonry;
  container: HTMLSlotElement;
}

function doLayout(host: MasonryLayout) {
  requestAnimationFrame(() => {
    host.masonry.reloadItems();
    host.masonry.layout();
  });
}

doLayout.options = true

export default {
  container: ref("slot"),
  hook: {
    connect(host, _, invalidate) {
      host.masonry = new Masonry(host);
      host.masonry.on("layoutComplete", function () {
        const x = host.masonry as any
        const width = x.columnWidth * x.cols;
        const offset = (x.containerWidth - width) / 2;
        host.container.style.transform = `translateX(${offset}px)`
      })
      const observer = new ResizeObserver(([{ contentRect: { width, height } }]) => {
        if (width == 0 || height == 0) return;
        doLayout(host);
      });
      observer.observe(host);
      return () => observer.disconnect();
    }
  } as Descriptor<MasonryLayout>,
  render: render(() => html`
    <slot onslotchange=${doLayout} onupdate=${doLayout}></slot>
  `.style(`:host { display: block } slot {display: block; position: absolute; transition: all ease .3s }`))
} as Hybrids<MasonryLayout>;