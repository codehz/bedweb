import HybridsElement from "~hybrids-element";
import tabContext, { TabContext } from "./tab-context";
import { Hybrids, parent, render, html, Descriptor, property, dispatch } from "hybrids";
import xTerm, { XTerm } from "~xterm";
import { ref } from "~utils";
import { WebSocketRPCPortView } from "~wsrpc";
import { IDisposable } from "xterm";

interface TerminalConnection extends HybridsElement {
  context: TabContext;
  terminal: XTerm;
  port: number;
  _cont: (port: number) => void;
}

export default {
  context: parent(x => x === tabContext),
  port: {
    set({ _cont }, port) {
      _cont(port);
      return port;
    }
  },
  terminal: ref("x-term"),
  hook: {
    connect: (host) => {
      let disposables: IDisposable[] = [];
      const encoder = new TextEncoder();
      const { context: { rpc, api }, terminal: { terminal } } = host;
      host._cont = port => {
        const view = rpc.bindPort(port, data => {
          if (data.byteLength == 0) {
            dispatch(host, "done");
            return;
          }
          terminal.write(new Uint8Array(data))
        });
        disposables.push(terminal.onData(data => view.send(encoder.encode(data))));
        disposables.push(terminal.onBinary(data => view.send(encoder.encode(data))));
        disposables.push(terminal.onResize(({ rows, cols }) => api.shell.resize(port, rows, cols)));
        disposables.push({ dispose() { api.shell.unlink(port); } });
        disposables.push({ dispose() { view.unbind(); } });
        terminal.focus();
      }
      return () => {
        disposables.forEach(x => x.dispose());
      };
    }
  } as Descriptor<TerminalConnection>,
  render: render(() => html`
    <x-term></x-term>
  `.define({ xTerm }).style(`:host { flex: 1; display: block }`))
} as Hybrids<TerminalConnection>;