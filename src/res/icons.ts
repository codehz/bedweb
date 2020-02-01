import res from "./icons.json"
import { render, svg, property, Hybrids } from "hybrids"
import HybridsElement from "~hybrids-element.js"

interface SvgTemplate extends HybridsElement {
  color: string;
  size: number;
  data: string;
}

function jsonToSvg(key: keyof (typeof res)) {
  return {
    color: property("black"),
    size: property(24),
    data: { get: () => res[key] },
    render: render(({ color, size, data }) =>
      svg`<svg style=${{ display: "block" }} fill=${color} width=${size + "px"} height=${size + "px"} viewBox="0 0 24 24"><path d=${data}></svg>`, { shadowRoot: false })
  } as Hybrids<SvgTemplate>;
}

export const iconConnect = jsonToSvg("connect");
export const iconFile = jsonToSvg("file");
export const iconFolder = jsonToSvg("folder");
export const iconOpenedFolder = jsonToSvg("opened-folder");
export const iconPlugin = jsonToSvg("plugin");
export const iconLink = jsonToSvg("link");
export const iconAdd = jsonToSvg("add");
export const iconUnavailable = jsonToSvg("unavailable");
export const iconDisconnect = jsonToSvg("disconnect");
export const iconSync = jsonToSvg("sync");