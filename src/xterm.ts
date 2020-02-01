import css from "./xterm.css"

import { Terminal } from 'xterm';

import { html, Hybrids, Descriptor, render, property } from 'hybrids';

export interface XTerm extends HTMLElement {
  terminal?: Terminal;
  fit?: (dim?: [number, number]) => void;
  render: () => ShadowRoot;
}

function getCellSize(term: Terminal): [number, number] {
  const dimensions = (term as any)._core._renderService.dimensions;
  return [dimensions.actualCellWidth, dimensions.actualCellHeight];
}

export default {
  terminalHook: {
    connect(host) {
      const term = new Terminal({
        fontFamily: "Unifont",
        fontSize: 16,
        allowTransparency: true,
        cursorStyle: "block",
        logLevel: "error",
        theme: {
          foreground: "black",
          background: "rgba(255, 255, 255, 0.8)",
          cursor: "black",
          cursorAccent: "black",
          selection: "rgba(0, 0, 0, 0.8)",
          black: "#000000",
          brightBlack: "#191919",
          red: "#683c39",
          brightRed: "#a6605b",
          green: "#39683c",
          brightGreen: "#5ba660",
          yellow: "#656839",
          brightYellow: "#a1a65b",
          blue: "#3c3968",
          brightBlue: "#605ba6",
          magenta: "#683965",
          brightMagenta: "#a65ba1",
          cyan: "#396568",
          brightCyan: "#5ba1a6",
          white: "#b9b9b9",
          brightWhite: "#ffffff"
        }
      });
      term.open(host.render() as any);
      host.fit = dim => {
        const [hw, hh] = dim ?? [host.offsetWidth, host.offsetHeight];
        if (hw == 0 || hh == 0) return;
        const [cw, ch] = getCellSize(term);
        const [tw, th] = [hw / cw | 0, hh / ch | 0];
        term.resize(tw, th);
      }
      host.terminal = term;
      const observer = new ResizeObserver(([{ contentRect: {width, height} }]) => {
        host.fit([width, height]);
      });
      observer.observe(host);
      return () => {
        observer.disconnect();
        term.dispose();
      }
    }
  } as Descriptor<XTerm>,
  render: render(() => html``.style(css))
} as Hybrids<XTerm>;