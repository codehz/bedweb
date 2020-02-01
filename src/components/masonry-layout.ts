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
  console.log("!");
  requestAnimationFrame(() => {
    host.masonry.reloadItems();
    host.masonry.layout();
  });
}

doLayout.options = true

export default {
  parent: parent(x => x === tabItem),
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
      if (!host.parent) return () => { };
      function handleActive() {
        doLayout(host);
      }
      host.parent.addEventListener("active", handleActive)
      return () => host.parent.removeEventListener("active", handleActive);
    }
  } as Descriptor<MasonryLayout>,
  render: render(() => html`
    <slot onslotchange=${doLayout} onupdate=${doLayout}></slot>
  `.style(`:host { display: block } slot {display: block; position: absolute; transition: all ease 1s }`))
} as Hybrids<MasonryLayout>;